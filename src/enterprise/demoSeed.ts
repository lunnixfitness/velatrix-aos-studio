/**
 * VELATRIX AOS · Enterprise · Formato do payload da Fila de Aprovação + seed DEMO (P20).
 *
 * O seed roda NO SERVIDOR (POST /api/enterprise/demo/seed), só com DEMO_MODE ativo,
 * uma vez por tenant (idempotente). Valores e clientes são fictícios.
 */
import type { WorkItem } from './hitl';

export interface Metrica { rotulo: string; valor: string; }

export interface WorkItemPayload {
  titulo: string;
  cliente: string;
  metricas: Metrica[];
  memoriaCalculo: Array<{ linha: string; valorCentavos: number }>;
  textoLaudo: string; // redigido pelo LLM, validado pelo guardrail
  laudoId?: string;
}

export interface SeedDef {
  ref: string;
  agente: string;
  esteira: WorkItem['esteira'];
  tipo: WorkItem['tipo'];
  riscoFlag: WorkItem['riscoFlag'];
  payload: WorkItemPayload;
  /** Cenário DEMO: revisado e depois recalculado pelo agente (hash muda após a revisão). */
  payloadAposRevisao?: WorkItemPayload;
}

export function valorExposto(p: WorkItemPayload): number {
  return p.memoriaCalculo.length ? Math.max(...p.memoriaCalculo.map((l) => l.valorCentavos)) : 0;
}

export const DEMO_SEED: SeedDef[] = [
  {
    ref: 'WI-RT-0192', agente: 'Fiscal', esteira: 'RECUPERACAO_TRIBUTARIA', tipo: 'GERAR_LAUDO_FINAL', riscoFlag: 'GREEN',
    payload: {
      titulo: 'Laudo de recuperação · PIS/COFINS monofásico', cliente: '[CLIENTE DEMO A]', laudoId: 'LD-RT-0192',
      metricas: [{ rotulo: 'Competências analisadas', valor: '60' }, { rotulo: 'Créditos elegíveis', valor: '14' }, { rotulo: 'Checagens do Shield', valor: '6 OK' }],
      memoriaCalculo: [{ linha: 'Principal', valorCentavos: 4_823_000 }, { linha: 'Atualização SELIC', valorCentavos: 612_540 }, { linha: 'Total atualizado', valorCentavos: 5_435_540 }],
      textoLaudo: 'Nos termos da Lei nº 9.250/1995, o crédito principal de R$ 48.230,00, atualizado pela SELIC, totaliza R$ 54.355,40, observado o prazo do CTN.',
    },
  },
  {
    ref: 'WI-PR-0077', agente: 'Liquidez', esteira: 'PRECATORIA', tipo: 'EXPORTAR_PACOTE_PROTOCOLO', riscoFlag: 'RED',
    payload: {
      titulo: 'Pacote de cessão de precatório', cliente: '[CLIENTE DEMO B]',
      metricas: [{ rotulo: 'Face do precatório', valor: 'R$ 1.250.000,00' }, { rotulo: 'Due diligence', valor: '1 falha RED (cessão anterior)' }, { rotulo: 'Data P50', valor: '[DATA]' }],
      memoriaCalculo: [{ linha: 'Valor de face', valorCentavos: 125_000_000 }, { linha: 'VPL central', valorCentavos: 98_740_000 }],
      textoLaudo: 'Valor de face de R$ 1.250.000,00 com VPL central de R$ 987.400,00, atualizado conforme EC 113/2021.',
    },
  },
  {
    ref: 'WI-PJ-0310', agente: 'Pericial', esteira: 'PERICIA_JUDICIAL', tipo: 'GERAR_LAUDO_FINAL', riscoFlag: 'YELLOW',
    payload: {
      titulo: 'Laudo pericial contábil · liquidação de sentença', cliente: '[PROCESSO DEMO C]', laudoId: 'LD-PJ-0310',
      metricas: [{ rotulo: 'Quesitos respondidos', valor: '12/12' }, { rotulo: 'Divergência com assistente', valor: '2 itens' }],
      memoriaCalculo: [{ linha: 'Valor apurado', valorCentavos: 8_640_000 }],
      textoLaudo: 'O valor apurado é de R$ 86.400,00, atualizado pela SELIC nos termos da EC 113/2021.',
    },
    payloadAposRevisao: {
      titulo: 'Laudo pericial contábil · liquidação de sentença', cliente: '[PROCESSO DEMO C]', laudoId: 'LD-PJ-0310',
      metricas: [{ rotulo: 'Quesitos respondidos', valor: '12/12' }, { rotulo: 'Divergência com assistente', valor: '3 itens' }],
      memoriaCalculo: [{ linha: 'Valor apurado', valorCentavos: 8_712_500 }],
      textoLaudo: 'O valor apurado é de R$ 87.125,00, atualizado pela SELIC nos termos da EC 113/2021.',
    },
  },
  {
    ref: 'WI-IN-0045', agente: 'Previdenciário', esteira: 'INSS', tipo: 'GERAR_LAUDO_FINAL', riscoFlag: 'NAO_AVALIADO',
    payload: {
      titulo: 'Parecer previdenciário · revisão de benefício', cliente: '[SEGURADO DEMO D]', laudoId: 'LD-IN-0045',
      metricas: [{ rotulo: 'Vínculos no CNIS', valor: '9' }, { rotulo: 'Cross-check CNIS × CTC', valor: 'não executado' }],
      memoriaCalculo: [{ linha: 'Diferenças apuradas', valorCentavos: 2_310_000 }],
      // Proposital: citação inexistente + percentual sem origem → guardrail BLOQUEADO.
      textoLaudo: 'Diferenças de R$ 23.100,00 conforme Solução de Consulta COSIT nº 999/2025, com acréscimo de 12%.',
    },
  },
];
