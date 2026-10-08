import type {
  AnaliseCredito, CreditoJudicial, EventoCredito, ItemFormalizacao, ResultadoOfertas, StatusCredito,
} from '../antecipacao/tipos';

export type CanalAceite = 'ASSINATURA_ELETRONICA' | 'PRESENCIAL' | 'EMAIL';

export interface RegistroCredito {
  credito: CreditoJudicial;
  analise: AnaliseCredito;
  ofertas: ResultadoOfertas;
  status: StatusCredito;
  ofertaEscolhidaId?: string;
  propostaHash?: string;
  escolhidaPor?: string;
  aprovadoPor?: string;
  aceite?: { em: string; canal: CanalAceite; registradoPor: string; hash: string };
  checklist: Partial<Record<ItemFormalizacao, { em: string; por: string; evidencia: string }>>;
  pagamento?: { em: string; comprovante: string; valorCentavos: number; origem: 'COMPRADOR' | 'DEMO' };
  eventos: EventoCredito[];
  criadoEm: string;
  atualizadoEm: string;
  demo?: boolean;
}

export interface PainelAntecipacao {
  porStatus: Record<StatusCredito, number>;
  totalCreditos: number;
  valorFaceCentavos: number;
  melhorOfertaTotalCentavos: number;
  pagoCentavos: number;
  aguardandoAcao: number;
}
