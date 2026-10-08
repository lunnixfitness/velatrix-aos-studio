import { OriginacaoFiltros, PrecatorioOriginado } from '../../types/precatorios';
import { PrecatorioLogger } from './precatorioLogger';
import { secureInt } from '../../lib/demoMode';
import { dvCNJ } from '../../documents/extracao/validadores';

export interface OriginacaoQueryResult {
  items: PrecatorioOriginado[];
  totalEncontrado: number;
  filtrosAplicados: OriginacaoFiltros;
  dataVarredura: string;
  workerExecucaoInfo: {
    cronSchedule: string;
    proximaExecucao: string;
    fontesAtivas: string[];
  };
}

export class OriginacaoEngine {
  private logger: PrecatorioLogger;
  private databaseMock: PrecatorioOriginado[] = [];

  constructor(correlationId?: string) {
    this.logger = new PrecatorioLogger('OriginacaoEngine', correlationId);
    this.seedInitialPool();
  }

  private seedInitialPool() {
    this.databaseMock = [
      {
        id: 'PREC-ORIG-001',
        numeroOficio: 'OF-REQ-2026-TRF3-98214',
        numeroProcesso: '5002145-20.2021.4.03.6100',
        tribunal: 'TRF3',
        enteDevedor: 'União Federal',
        ufEnte: 'DF',
        natureza: 'ALIMENTAR',
        esfera: 'FEDERAL',
        anoLOA: 2026,
        valorOriginal: 350000.00,
        valorEstimadoAtual: 428750.00,
        dataExpedicao: '2025-06-15',
        score: 95,
        fonteCaptura: 'FILA_TRIBUNAL',
        cedenteMascarado: 'Maria A. S.***',
        cedenteDocumento: '123.***.***-00'
      },
      {
        id: 'PREC-ORIG-002',
        numeroOficio: 'OF-REQ-2026-TJSP-14022',
        numeroProcesso: '1004523-15.2019.8.26.0053',
        tribunal: 'TJSP',
        enteDevedor: 'Estado de São Paulo',
        ufEnte: 'SP',
        natureza: 'COMUM',
        esfera: 'ESTADUAL',
        anoLOA: 2027,
        valorOriginal: 1250000.00,
        valorEstimadoAtual: 1485000.00,
        dataExpedicao: '2024-11-20',
        score: 82,
        fonteCaptura: 'VELATRIX_INBOX',
        cedenteMascarado: 'Engenharia & Empreendimentos LTDA***',
        cedenteDocumento: '12.345.*** / 0001-**'
      },
      {
        id: 'PREC-ORIG-003',
        numeroOficio: 'OF-REQ-2025-TRF1-33104',
        numeroProcesso: '0012398-95.2020.4.01.3400',
        tribunal: 'TRF1',
        enteDevedor: 'Instituto Nacional do Seguro Social - INSS',
        ufEnte: 'DF',
        natureza: 'ALIMENTAR',
        esfera: 'FEDERAL',
        anoLOA: 2026,
        valorOriginal: 180000.00,
        valorEstimadoAtual: 221400.00,
        dataExpedicao: '2025-03-10',
        score: 92,
        fonteCaptura: 'MARKETPLACE',
        cedenteMascarado: 'João B. C.***',
        cedenteDocumento: '456.***.***-11'
      },
      {
        id: 'PREC-ORIG-004',
        numeroOficio: 'OF-REQ-2026-TJRJ-8812',
        numeroProcesso: '0089234-58.2018.8.19.0001',
        tribunal: 'TJRJ',
        enteDevedor: 'Estado do Rio de Janeiro',
        ufEnte: 'RJ',
        natureza: 'COMUM',
        esfera: 'ESTADUAL',
        anoLOA: 2028,
        valorOriginal: 890000.00,
        valorEstimadoAtual: 1045000.00,
        dataExpedicao: '2024-08-12',
        score: 58,
        fonteCaptura: 'FILA_TRIBUNAL',
        cedenteMascarado: 'Auto Transportes Rio***',
        cedenteDocumento: '33.888.*** / 0001-**'
      },
      {
        id: 'PREC-ORIG-005',
        numeroOficio: 'OF-REQ-2026-TRF4-5120',
        numeroProcesso: '5011982-45.2022.4.04.7100',
        tribunal: 'TRF4',
        enteDevedor: 'União Federal',
        ufEnte: 'RS',
        natureza: 'ALIMENTAR',
        esfera: 'FEDERAL',
        anoLOA: 2026,
        valorOriginal: 520000.00,
        valorEstimadoAtual: 637000.00,
        dataExpedicao: '2025-05-02',
        score: 94,
        fonteCaptura: 'VELATRIX_INBOX',
        cedenteMascarado: 'Carlos E. D.***',
        cedenteDocumento: '789.***.***-22'
      }
    ];
  }

  /**
   * Executa triagem e filtragem estruturada sobre a base de oportunidades
   */
  public filtrarOportunidades(filtros: OriginacaoFiltros): OriginacaoQueryResult {
    this.logger.info('Executando query builder de originação e triagem', { filtros });

    let resultado = [...this.databaseMock];

    if (filtros.enteDevedor) {
      resultado = resultado.filter(p => p.esfera.toLowerCase() === filtros.enteDevedor);
    }

    if (filtros.entesUF && filtros.entesUF.length > 0) {
      const ufs = filtros.entesUF.map(u => u.toUpperCase());
      resultado = resultado.filter(p => p.ufEnte && ufs.includes(p.ufEnte));
    }

    if (filtros.natureza && filtros.natureza !== 'ambas') {
      const nat = filtros.natureza.toUpperCase();
      resultado = resultado.filter(p => p.natureza === nat);
    }

    if (filtros.tribunalOrigem && filtros.tribunalOrigem.length > 0) {
      resultado = resultado.filter(p => filtros.tribunalOrigem!.includes(p.tribunal));
    }

    if (filtros.anoInscricaoLOA) {
      const { min, max } = filtros.anoInscricaoLOA;
      if (min !== undefined) resultado = resultado.filter(p => p.anoLOA >= min);
      if (max !== undefined) resultado = resultado.filter(p => p.anoLOA <= max);
    }

    if (filtros.faixaValor) {
      const { min, max } = filtros.faixaValor;
      if (min !== undefined) resultado = resultado.filter(p => p.valorEstimadoAtual >= min);
      if (max !== undefined) resultado = resultado.filter(p => p.valorEstimadoAtual <= max);
    }

    if (filtros.scoreMinimo !== undefined) {
      resultado = resultado.filter(p => p.score >= filtros.scoreMinimo!);
    }

    this.logger.info(`Filtro concluído: ${resultado.length} oportunidades identificadas`);

    return {
      items: resultado,
      totalEncontrado: resultado.length,
      filtrosAplicados: filtros,
      dataVarredura: new Date().toISOString(),
      workerExecucaoInfo: {
        cronSchedule: '0 6,12,18 * * * (BullMQ 3x ao dia)',
        proximaExecucao: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        fontesAtivas: ['TRF1-6 Fila Pública', 'TJSP/TJRJ/TJMG DJEN', 'Velatrix Inbox OCR', 'Marketplace Interno']
      }
    };
  }

  /**
   * Simula a ingestão via OCR + NER do Velatrix Inbox
   */
  public extrairOficioInbox(payload: { emailRemetente: string; nomeArquivo: string; textoBrutoOuPdf: string }): PrecatorioOriginado {
    this.logger.info(`Processando documento recebido no Velatrix Inbox: ${payload.nomeArquivo}`);

    const randNum = secureInt(10000, 99999);
    const novoPrecatorio: PrecatorioOriginado = {
      id: `PREC-INBOX-${randNum}`,
      numeroOficio: `OF-INBOX-${randNum}`,
      // Demo: número CNJ com dígito verificador calculado (Res. CNJ 65/2008), não fixo.
      numeroProcesso: `50${randNum}-${dvCNJ(`50${randNum}`, '2023', '4', '03', '6100')}.2023.4.03.6100`,
      tribunal: 'TRF3',
      enteDevedor: 'União Federal',
      ufEnte: 'SP',
      natureza: 'ALIMENTAR',
      esfera: 'FEDERAL',
      anoLOA: 2026,
      valorOriginal: 280000.00,
      valorEstimadoAtual: 336000.00,
      dataExpedicao: new Date().toISOString().split('T')[0],
      score: 91,
      fonteCaptura: 'VELATRIX_INBOX',
      cedenteMascarado: 'Credor Inbox Homologado***',
      cedenteDocumento: '987.***.***-33'
    };

    this.databaseMock.unshift(novoPrecatorio);
    return novoPrecatorio;
  }
}

export const originacaoEngine = new OriginacaoEngine();
