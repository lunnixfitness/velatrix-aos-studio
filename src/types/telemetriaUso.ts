export type TipoEventoCliente = 'sessao_inicio' | 'tela' | 'heartbeat' | 'sessao_fim' | 'acao';
export type TipoEvento = TipoEventoCliente | 'tokens' | 'desfecho';
export type ResultadoDesfecho = 'ganha' | 'perdida' | 'acordo' | 'arquivada';
export type Dispositivo = 'desktop' | 'mobile';

export interface EventoTelemetria {
  ts: number;
  tenantId: string;
  userId: string;
  sessaoId: string;
  tipo: TipoEvento;
  papel?: string;
  tela?: string;
  acao?: string;
  cidade?: string;
  uf?: string;
  dispositivo?: Dispositivo;
  modelo?: string;
  tokensEntrada?: number;
  tokensSaida?: number;
  resultado?: ResultadoDesfecho;
  esteira?: string;
  demo?: boolean;
}

export interface SessaoAoVivo {
  sessaoId: string;
  tenantId: string;
  userId: string;
  papel?: string;
  telaAtual: string | null;
  telaDesde: number;
  inicio: number;
  ultimoSinal: number;
  cidade: string;
  uf: string;
  dispositivo?: Dispositivo;
  telasVisitadas: number;
  demo?: boolean;
}

export interface ItemFeed {
  ts: number;
  tenantId: string;
  userId: string;
  tipo: TipoEvento;
  tela?: string;
  acao?: string;
  resultado?: ResultadoDesfecho;
  esteira?: string;
  cidade?: string;
  demo?: boolean;
}

export interface ResumoTelemetria {
  geradoEm: number;
  janelaMs: number;
  granularidade: 'hora' | 'dia';
  contemDadosDemo: boolean;
  kpis: {
    usuariosAgora: number;
    sessoesAgora: number;
    tenantsAtivosAgora: number;
    usuariosUnicos: number;
    sessoes: number;
    minutosAtivos: number;
    tokensEntrada: number;
    tokensSaida: number;
    desfechos: Record<ResultadoDesfecho, number>;
    taxaExito: number | null;
  };
  porHoraDoDia: number[];
  serie: Array<{ t: number; sessoes: number; usuarios: number; tokens: number }>;
  cidades: Array<{ cidade: string; uf: string; sessoes: number }>;
  telas: Array<{ tela: string; aberturas: number }>;
  modelos: Array<{ modelo: string; tokens: number }>;
  tenants: Array<{ tenantId: string; usuarios: number; sessoes: number; minutosAtivos: number; tokens: number; ganhas: number }>;
}

export const HORA = 3_600_000;
export const DIA = 24 * HORA;
export const JANELAS = { '1h': HORA, '24h': DIA, '7d': 7 * DIA, '30d': 30 * DIA } as const;
export type JanelaId = keyof typeof JANELAS;
