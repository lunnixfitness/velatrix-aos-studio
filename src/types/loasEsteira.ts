export type StatusItemLote = 'PENDENTE' | 'PROTOCOLADO' | 'DUPLICADO' | 'FALHA';

export interface EstadoLote {
  loteId: string;
  tenantId: string;
  criadoPor: string;
  criadoEm: string;
  itens: Array<{ casoId: string; status: StatusItemLote; numeroProcesso?: string; erro?: string }>;
}
