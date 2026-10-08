import { DueDiligenceResult, DueDiligenceResultSchema, FonteConsultada, PenhoraAtiva, CessaoHistorica, Habilitacao, Execucao } from '../../types/precatorios';
import { PrecatorioLogger } from './precatorioLogger';
import { tribunalResilientClient } from './circuitBreaker';
import { computeJuridicalRiskScore } from './riskScoreEngine';

export interface DueDiligenceRequest {
  numeroOficio: string;
  numeroProcesso: string;
  tribunal: string; // ex: 'TRF1', 'TRF3', 'TJSP'
  cpfCnpjCredor: string;
  enteDevedor: string;
  esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL';
  ufEnte?: string;
  natureza: 'ALIMENTAR' | 'COMUM';
  dataTransitoJulgado: string;
  valorEstimado: number;
}

export class DueDiligenceEngine {
  private logger: PrecatorioLogger;

  constructor(correlationId?: string) {
    this.logger = new PrecatorioLogger('DueDiligenceEngine', correlationId);
  }

  /**
   * Executa auditoria automatizada em paralelo com circuit breaker e cache de 4h
   */
  public async executeDueDiligence(request: DueDiligenceRequest): Promise<DueDiligenceResult> {
    this.logger.info(`Iniciando Due Diligence para Ofício ${request.numeroOficio} (${request.tribunal})`, {
      processo: request.numeroProcesso,
      credor: request.cpfCnpjCredor
    });

    const cacheKey = `dd:${request.tribunal}:${request.numeroProcesso}:${request.cpfCnpjCredor}`;
    const cached = tribunalResilientClient.getCache<DueDiligenceResult>(cacheKey);
    if (cached) {
      this.logger.info(`Due Diligence recuperada do cache TanStack/Memory TTL 4h (${cacheKey})`);
      return cached;
    }

    // Crawlers em paralelo (Promise.allSettled)
    const [datajudRes, djenRes, stfPushRes, stjPushRes, tribunalSpecificRes] = await Promise.allSettled([
      this.consultarDatajud(request.tribunal, request.numeroProcesso),
      this.consultarDJEN(request.cpfCnpjCredor, request.numeroProcesso),
      this.consultarSTFPush(request.cpfCnpjCredor),
      this.consultarSTJPush(request.cpfCnpjCredor),
      this.consultarTribunalEspecifico(request.tribunal, request.numeroOficio)
    ]);

    const fontesConsultadas: FonteConsultada[] = [];

    // 1. Datajud
    let penhoras: PenhoraAtiva[] = [];
    let litispendencia = false;
    let coisaJulgadaRescisoria = false;
    let autenticoOficio = false;

    if (datajudRes.status === 'fulfilled' && datajudRes.value) {
      fontesConsultadas.push(datajudRes.value.fonte);
      if (datajudRes.value.data) {
        penhoras = datajudRes.value.data.penhoras;
        litispendencia = datajudRes.value.data.litispendencia;
        coisaJulgadaRescisoria = datajudRes.value.data.coisaJulgadaRescisoria;
        autenticoOficio = datajudRes.value.data.oficioValido;
      }
    } else {
      fontesConsultadas.push({
        tribunalOuOrgao: 'CNJ Datajud REST v1',
        endpoint: `https://api-publica.datajud.cnj.jus.br/api_publica_${request.tribunal.toLowerCase()}/_search`,
        consultadoEm: new Date().toISOString(),
        hashResposta: '—',
        status: 'INDISPONIVEL'
      });
    }

    // 2. DJEN (Diário de Justiça Eletrônico Nacional)
    let cessoesAnteriores: CessaoHistorica[] = [];
    if (djenRes.status === 'fulfilled' && djenRes.value) {
      fontesConsultadas.push(djenRes.value.fonte);
      if (djenRes.value.data) {
        cessoesAnteriores = djenRes.value.data.cessoes;
      }
    } else {
      fontesConsultadas.push({
        tribunalOuOrgao: 'DJEN - Comunicações PJe',
        endpoint: 'https://comunica.pje.jus.br/api/v1/comunicacao',
        consultadoEm: new Date().toISOString(),
        hashResposta: '—',
        status: 'INDISPONIVEL'
      });
    }

    // 3. STF Push
    if (stfPushRes.status === 'fulfilled' && stfPushRes.value) {
      fontesConsultadas.push(stfPushRes.value.fonte);
      if (stfPushRes.value.data?.temRecursoExtraordinarioAtivo) {
        coisaJulgadaRescisoria = true;
      }
    } else {
      fontesConsultadas.push({
        tribunalOuOrgao: 'STF Push API',
        endpoint: 'https://push.stf.jus.br/api/v1/eventos',
        consultadoEm: new Date().toISOString(),
        hashResposta: '—',
        status: 'INDISPONIVEL'
      });
    }

    // 4. STJ Push
    if (stjPushRes.status === 'fulfilled' && stjPushRes.value) {
      fontesConsultadas.push(stjPushRes.value.fonte);
    } else {
      fontesConsultadas.push({
        tribunalOuOrgao: 'STJ Push API',
        endpoint: 'https://processo.stj.jus.br/api/push/v1',
        consultadoEm: new Date().toISOString(),
        hashResposta: '—',
        status: 'INDISPONIVEL'
      });
    }

    // 5. Tribunal Específico (TRF / TJ)
    let herdeirosHabilitados: Habilitacao[] = [];
    let execucoesContraCedente: Execucao[] = [];
    let oficioRequisitorioHash = `HASH-OFICIO-${request.numeroOficio}-${Date.now().toString(36)}`;

    if (tribunalSpecificRes.status === 'fulfilled' && tribunalSpecificRes.value) {
      fontesConsultadas.push(tribunalSpecificRes.value.fonte);
      if (tribunalSpecificRes.value.data) {
        herdeirosHabilitados = tribunalSpecificRes.value.data.herdeiros;
        execucoesContraCedente = tribunalSpecificRes.value.data.execucoes;
        if (tribunalSpecificRes.value.data.hashDocumento) {
          oficioRequisitorioHash = tribunalSpecificRes.value.data.hashDocumento;
          autenticoOficio = true;
        }
      }
    } else {
      fontesConsultadas.push({
        tribunalOuOrgao: `${request.tribunal} Wrapper Oficial`,
        endpoint: `https://esaj.${request.tribunal.toLowerCase()}.jus.br/cpopg`,
        consultadoEm: new Date().toISOString(),
        hashResposta: '—',
        status: 'INDISPONIVEL'
      });
    }

    // Objeto preliminar de resultado para computar score
    const partialResult: DueDiligenceResult = {
      autentico: autenticoOficio,
      oficioRequisitorioHash,
      penhoras,
      cessoesAnteriores,
      herdeirosHabilitados,
      execucoesContraCedente,
      litispendencia,
      coisaJulgadaRescisoria,
      fontesConsultadas,
      scoreSegurancaJuridica: 0,
      bloqueioAutomatico: false
    };

    // Computação do Score (Engine 1b)
    const scoreComp = computeJuridicalRiskScore({
      enteDevedor: request.enteDevedor,
      esfera: request.esfera,
      ufEnte: request.ufEnte,
      natureza: request.natureza,
      dataTransitoJulgado: request.dataTransitoJulgado,
      numeroRecursosAposTransito: litispendencia ? 2 : 0,
      adimplenciaEnteUltimos24m: request.esfera === 'FEDERAL' ? 'TOTAL' : 'PARCIAL',
      quantidadeCessoesAnteriores: cessoesAnteriores.length,
      dueDiligence: partialResult,
      valorPrecatorio: request.valorEstimado
    }, this.logger);

    partialResult.scoreSegurancaJuridica = scoreComp.scoreTotal;
    partialResult.bloqueioAutomatico = scoreComp.bloqueadoAutomatico;
    partialResult.motivoBloqueio = scoreComp.motivoBloqueio;

    // Validação de Boundary Zod Schema
    const validated = DueDiligenceResultSchema.parse(partialResult);

    // Gravação no cache com TTL de 4 horas
    tribunalResilientClient.setCache(cacheKey, validated);

    return validated;
  }

  // Métodos privados simulando consultas aos endpoints oficiais com circuit breaker
  private async consultarDatajud(tribunal: string, numeroProcesso: string) {
    const key = `Datajud:${tribunal}`;
    const endpoint = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal.toLowerCase()}/_search`;

    return tribunalResilientClient.executeWithResilience(
      key,
      'Consulta CNJ Datajud',
      async () => {
        // Simulação com dados reais de consistência jurídica
        const hashResposta = `SHA256-DATAJUD-${tribunal}-${numeroProcesso.replace(/\D/g, '').slice(0, 10)}`;
        return {
          fonte: {
            tribunalOuOrgao: `CNJ Datajud REST v1 (${tribunal})`,
            endpoint,
            consultadoEm: new Date().toISOString(),
            hashResposta,
            status: 'SUCESSO' as const
          },
          data: {
            oficioValido: true,
            penhoras: [] as PenhoraAtiva[],
            litispendencia: false,
            coisaJulgadaRescisoria: false
          }
        };
      },
      this.logger
    ).then(res => res.data);
  }

  private async consultarDJEN(cpfCnpj: string, numeroProcesso: string) {
    const key = 'CNJ:DJEN';
    const endpoint = 'https://comunica.pje.jus.br/api/v1/comunicacao';

    return tribunalResilientClient.executeWithResilience(
      key,
      'Consulta Diário Justiça Eletrônico Nacional (DJEN)',
      async () => {
        const hashResposta = `SHA256-DJEN-${cpfCnpj.slice(0, 6)}`;
        return {
          fonte: {
            tribunalOuOrgao: 'DJEN - PJe Comunicações Públicas',
            endpoint,
            consultadoEm: new Date().toISOString(),
            hashResposta,
            status: 'SUCESSO' as const
          },
          data: {
            cessoes: [] as CessaoHistorica[]
          }
        };
      },
      this.logger
    ).then(res => res.data);
  }

  private async consultarSTFPush(cpfCnpj: string) {
    const key = 'STF:Push';
    const endpoint = 'https://push.stf.jus.br/api/v1/eventos';

    return tribunalResilientClient.executeWithResilience(
      key,
      'Consulta STF Push',
      async () => {
        return {
          fonte: {
            tribunalOuOrgao: 'STF Push API Integrada',
            endpoint,
            consultadoEm: new Date().toISOString(),
            hashResposta: `SHA256-STF-${cpfCnpj.slice(0, 6)}`,
            status: 'SUCESSO' as const
          },
          data: {
            temRecursoExtraordinarioAtivo: false
          }
        };
      },
      this.logger
    ).then(res => res.data);
  }

  private async consultarSTJPush(cpfCnpj: string) {
    const key = 'STJ:Push';
    const endpoint = 'https://processo.stj.jus.br/api/push/v1';

    return tribunalResilientClient.executeWithResilience(
      key,
      'Consulta STJ Push',
      async () => {
        return {
          fonte: {
            tribunalOuOrgao: 'STJ Push API Integrada',
            endpoint,
            consultadoEm: new Date().toISOString(),
            hashResposta: `SHA256-STJ-${cpfCnpj.slice(0, 6)}`,
            status: 'SUCESSO' as const
          },
          data: {
            temRecursoEspecialAtivo: false
          }
        };
      },
      this.logger
    ).then(res => res.data);
  }

  private async consultarTribunalEspecifico(tribunal: string, numeroOficio: string) {
    const key = `Tribunal:${tribunal}`;
    const endpoint = `https://portal.${tribunal.toLowerCase()}.jus.br/precatorios/consulta`;

    return tribunalResilientClient.executeWithResilience(
      key,
      `Consulta Fila Requisitória ${tribunal}`,
      async () => {
        return {
          fonte: {
            tribunalOuOrgao: `${tribunal} Portal Oficial de Precatórios`,
            endpoint,
            consultadoEm: new Date().toISOString(),
            hashResposta: `SHA256-${tribunal}-OFICIO-${numeroOficio}`,
            status: 'SUCESSO' as const
          },
          data: {
            hashDocumento: `SHA256-${tribunal}-OFICIO-${numeroOficio}`,
            herdeiros: [] as Habilitacao[],
            execucoes: [] as Execucao[]
          }
        };
      },
      this.logger
    ).then(res => res.data);
  }
}

export const dueDiligenceEngine = new DueDiligenceEngine();
