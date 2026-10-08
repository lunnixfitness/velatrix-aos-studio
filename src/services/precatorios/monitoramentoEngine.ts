import {
  TriggerEvento,
  CanalAlerta,
  PrecatorioMonitorSubscription,
  EventoProcessualDetectado
} from '../../types/precatorios';
import { PrecatorioLogger } from './precatorioLogger';
import { secureInt } from '../../lib/demoMode';

export interface RegistrarMonitorRequest {
  precatorioId: string;
  numeroProcesso: string;
  tribunal: string;
  canaisAlerta: CanalAlerta[];
  triggers: TriggerEvento[];
  webhookUrl?: string;
  userId?: string;
}

export class MonitoramentoEngine {
  private logger: PrecatorioLogger;
  private assinaturas: Map<string, PrecatorioMonitorSubscription> = new Map();
  private historicoEventos: EventoProcessualDetectado[] = [];

  constructor(correlationId?: string) {
    this.logger = new PrecatorioLogger('MonitoramentoEngine', correlationId);
    this.seedMockSub();
  }

  private seedMockSub() {
    const mockId = 'MON-PREC-98214';
    this.assinaturas.set(mockId, {
      id: mockId,
      precatorioId: 'PREC-ORIG-001',
      numeroProcesso: '5002145-12.2021.4.03.6100',
      tribunal: 'TRF3',
      canaisAlerta: ['EMAIL', 'PUSH', 'IN_APP'],
      triggers: [
        'ORDEM_PAGAMENTO_EXPEDIDA',
        'SEQUESTRO_VERBA_ART100_CF',
        'IMPUGNACAO_FAZENDA_PROTOCOLADA',
        'INSCRICAO_EXCLUSAO_LOA'
      ],
      ativo: true,
      criadoEm: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      ultimoHashDiff: 'HASH-ORIG-v1-TRF3'
    });

    this.historicoEventos.push({
      id: 'EVT-01',
      precatorioId: 'PREC-ORIG-001',
      trigger: 'INSCRICAO_EXCLUSAO_LOA',
      descricao: 'Precatório incluído formalmente na dotação orçamentária federal da LOA 2026 pelo TRF3.',
      dataOcorrencia: '2025-08-20T14:30:00.000Z',
      documentoHash: 'SHA256-LOA-2026-DOTACAO-TRF3',
      tribunalOrigem: 'TRF3',
      notificadoEm: '2025-08-20T14:31:10.000Z'
    });
  }

  /**
   * Registra uma nova assinatura de monitoramento contínuo
   */
  public registrarMonitor(request: RegistrarMonitorRequest): PrecatorioMonitorSubscription {
    this.logger.info(`Registrando monitoramento para Precatório ${request.precatorioId}`, {
      processo: request.numeroProcesso,
      tribunal: request.tribunal,
      canais: request.canaisAlerta
    });

    const id = `MON-${Date.now().toString(36).toUpperCase()}-${secureInt(100, 999)}`;
    const sub: PrecatorioMonitorSubscription = {
      id,
      precatorioId: request.precatorioId,
      numeroProcesso: request.numeroProcesso,
      tribunal: request.tribunal,
      canaisAlerta: request.canaisAlerta,
      triggers: request.triggers,
      webhookUrl: request.webhookUrl,
      userId: request.userId,
      ativo: true,
      criadoEm: new Date().toISOString(),
      ultimoHashDiff: `HASH-INIT-${Date.now().toString(36)}`
    };

    this.assinaturas.set(id, sub);
    return sub;
  }

  /**
   * Consulta status de monitoramento e eventos detectados
   */
  public getMonitoramento(precatorioId: string): {
    assinatura?: PrecatorioMonitorSubscription;
    eventos: EventoProcessualDetectado[];
    pollerStatus: {
      intervaloMinutos: number;
      ultimoCheck: string;
      proximoCheck: string;
      totalAssinaturasAtivas: number;
    };
  } {
    const sub = Array.from(this.assinaturas.values()).find(s => s.precatorioId === precatorioId && s.ativo);
    const eventos = this.historicoEventos.filter(e => e.precatorioId === precatorioId);

    return {
      assinatura: sub,
      eventos,
      pollerStatus: {
        intervaloMinutos: 15,
        ultimoCheck: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        proximoCheck: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
        totalAssinaturasAtivas: this.assinaturas.size
      }
    };
  }

  /**
   * Poller que detecta movimentação processual com base no diff-hash de andamentos
   */
  public async verificarDiffProcessual(precatorioId: string, novoHashDocumento: string, triggerSugerida?: TriggerEvento): Promise<{
    mudancaDetectada: boolean;
    eventoCriado?: EventoProcessualDetectado;
  }> {
    const sub = Array.from(this.assinaturas.values()).find(s => s.precatorioId === precatorioId && s.ativo);
    if (!sub) {
      return { mudancaDetectada: false };
    }

    if (sub.ultimoHashDiff === novoHashDocumento) {
      this.logger.debug(`Sem alterações processuais para precatório ${precatorioId} (hash idêntico)`);
      return { mudancaDetectada: false };
    }

    this.logger.info(`MUDANÇA PROCESSUAL DETECTADA no precatório ${precatorioId}! Diff: ${sub.ultimoHashDiff} -> ${novoHashDocumento}`);

    const trigger = triggerSugerida || 'ORDEM_PAGAMENTO_EXPEDIDA';
    const evento: EventoProcessualDetectado = {
      id: `EVT-${Date.now().toString(36)}`,
      precatorioId,
      trigger,
      descricao: `Andamento processual crítico homologado no ${sub.tribunal}: Evento '${trigger}'.`,
      dataOcorrencia: new Date().toISOString(),
      documentoHash: novoHashDocumento,
      tribunalOrigem: sub.tribunal,
      notificadoEm: new Date().toISOString()
    };

    sub.ultimoHashDiff = novoHashDocumento;
    sub.ultimoDisparoAt = new Date().toISOString();
    this.historicoEventos.unshift(evento);

    // Disparo nos canais
    await this.dispararNotificacoes(sub, evento);

    return { mudancaDetectada: true, eventoCriado: evento };
  }

  private async dispararNotificacoes(sub: PrecatorioMonitorSubscription, evento: EventoProcessualDetectado) {
    for (const canal of sub.canaisAlerta) {
      this.logger.info(`Disparando alerta via [${canal}] para precatório ${sub.precatorioId}`, {
        trigger: evento.trigger,
        webhookUrl: sub.webhookUrl
      });
      // Em produção: integrador com Twilio/Resend/FCM/Webhook
    }
  }
}

export const monitoramentoEngine = new MonitoramentoEngine();
