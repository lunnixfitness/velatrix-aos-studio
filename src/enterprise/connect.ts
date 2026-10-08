/**
 * VELATRIX AOS · Enterprise · Velatrix Connect — ingestão passiva (Ferramenta 1 · P15).
 *
 * Portais do governo não enviam webhooks: a ingestão é por POLLING agendado nas APIs
 * oficiais. Webhook só para ERPs que oferecem. Sem scraping de portal com login.
 * Eventos detectados viram WorkItem em READY_FOR_REVIEW — nunca ação automática.
 */

export type Fase = 'A' | 'B' | 'C';
export type Suporte = 'IMPLEMENTAVEL_API_OFICIAL' | 'SOMENTE_INTERFACE' | 'NAO_SUPORTADO';
export type AuthType = 'API_KEY_PROCURACAO' | 'CERTIFICADO_A1' | 'PUBLICA' | 'OAUTH2' | 'ARQUIVO_SFTP' | 'NENHUM';

export interface ConnectorSpec {
  id: string;
  fonte: string;
  fase: Fase;
  authType: AuthType;
  modo: 'POLLING' | 'WEBHOOK' | 'ARQUIVO' | 'N/A';
  suporte: Suporte;
  cursor?: string;          // ex.: NSU, data da última movimentação
  observacao: string;
}

export const CATALOGO_CONECTORES: ConnectorSpec[] = [
  { id: 'serpro-integra-contador', fonte: 'SERPRO Integra Contador', fase: 'A', authType: 'API_KEY_PROCURACAO', modo: 'POLLING', suporte: 'IMPLEMENTAVEL_API_OFICIAL', observacao: 'Somente serviços cobertos pela API e liberados pela procuração eletrônica do cliente (ex.: PGDAS-D, DCTFWeb, Caixa Postal, situação fiscal).' },
  { id: 'nfe-distribuicao-dfe', fonte: 'NF-e · DistribuiçãoDFe (SEFAZ)', fase: 'A', authType: 'CERTIFICADO_A1', modo: 'POLLING', suporte: 'IMPLEMENTAVEL_API_OFICIAL', cursor: 'NSU', observacao: 'Webservice nacional; certificado A1 do cliente nunca sai do servidor.' },
  { id: 'datajud', fonte: 'DataJud (CNJ)', fase: 'A', authType: 'PUBLICA', modo: 'POLLING', suporte: 'IMPLEMENTAVEL_API_OFICIAL', observacao: 'Metadados e movimentações processuais.' },
  { id: 'djen-comunica', fonte: 'DJEN / Comunica (CNJ)', fase: 'A', authType: 'PUBLICA', modo: 'POLLING', suporte: 'IMPLEMENTAVEL_API_OFICIAL', observacao: 'Comunicações e intimações pela fonte oficial.' },
  { id: 'omie', fonte: 'Omie', fase: 'B', authType: 'API_KEY_PROCURACAO', modo: 'POLLING', suporte: 'IMPLEMENTAVEL_API_OFICIAL', observacao: 'API pública do ERP.' },
  { id: 'bling', fonte: 'Bling', fase: 'B', authType: 'OAUTH2', modo: 'WEBHOOK', suporte: 'IMPLEMENTAVEL_API_OFICIAL', observacao: 'OAuth2; webhooks do próprio ERP.' },
  { id: 'conta-azul', fonte: 'Conta Azul', fase: 'B', authType: 'OAUTH2', modo: 'POLLING', suporte: 'IMPLEMENTAVEL_API_OFICIAL', observacao: 'OAuth2.' },
  { id: 'totvs', fonte: 'TOTVS Protheus / RM', fase: 'C', authType: 'ARQUIVO_SFTP', modo: 'ARQUIVO', suporte: 'SOMENTE_INTERFACE', observacao: 'Sob demanda por cliente; fallback SFTP/pasta.' },
  { id: 'sap', fonte: 'SAP (OData/RFC)', fase: 'C', authType: 'ARQUIVO_SFTP', modo: 'ARQUIVO', suporte: 'SOMENTE_INTERFACE', observacao: 'Sob demanda por cliente; fallback SFTP/pasta.' },
  { id: 'senior', fonte: 'Senior', fase: 'C', authType: 'ARQUIVO_SFTP', modo: 'ARQUIVO', suporte: 'SOMENTE_INTERFACE', observacao: 'Sob demanda por cliente; fallback SFTP/pasta.' },
  { id: 'perdcomp', fonte: 'PER/DCOMP (transmissão)', fase: 'A', authType: 'NENHUM', modo: 'N/A', suporte: 'NAO_SUPORTADO', observacao: 'Sem API pública de transmissão conhecida: o sistema gera o pacote e o profissional transmite.' },
  { id: 'det', fonte: 'DET (MTE)', fase: 'A', authType: 'NENHUM', modo: 'N/A', suporte: 'NAO_SUPORTADO', observacao: 'Sem API: não suportado.' },
  { id: 'dec-municipal', fonte: 'DEC municipais', fase: 'A', authType: 'NENHUM', modo: 'N/A', suporte: 'NAO_SUPORTADO', observacao: 'Sem API: não suportado.' },
];

export interface DocumentoIngerido { idDocumento: string; conteudo: Uint8Array; tipo: string; }

export interface Connector {
  spec: ConnectorSpec;
  poll(cursor: string | null): Promise<{ docs: DocumentoIngerido[]; novoCursor: string | null }>;
  healthcheck(): Promise<boolean>;
}

export type SaudeStatus = 'OK' | 'ERRO' | 'NAO_CONFIGURADO' | 'NAO_SUPORTADO' | 'SOMENTE_INTERFACE';

export function saudeConector(spec: ConnectorSpec, estado: { temCredencial: boolean; ultimoSucesso?: string; ultimoErro?: { em: string; msg: string } }): { status: SaudeStatus; detalhe: string } {
  if (spec.suporte === 'NAO_SUPORTADO') return { status: 'NAO_SUPORTADO', detalhe: spec.observacao };
  if (spec.suporte === 'SOMENTE_INTERFACE') return { status: 'SOMENTE_INTERFACE', detalhe: spec.observacao };
  if (!estado.temCredencial && spec.authType !== 'PUBLICA') return { status: 'NAO_CONFIGURADO', detalhe: 'Não configurado' };
  if (estado.ultimoErro && (!estado.ultimoSucesso || estado.ultimoErro.em > estado.ultimoSucesso)) return { status: 'ERRO', detalhe: estado.ultimoErro.msg };
  return { status: 'OK', detalhe: estado.ultimoSucesso ? `último sucesso ${estado.ultimoSucesso}` : 'aguardando primeira coleta' };
}

/** Chave idempotente por (tenant, fonte, documento). */
export function jobKey(tenantId: string, fonte: string, idDocumento: string): string {
  return `${tenantId}:${fonte}:${idDocumento}`;
}

/** Backoff exponencial com jitter limitado; após maxTentativas → DLQ. */
export function proximaTentativa(tentativa: number, opts: { baseMs?: number; maxMs?: number; maxTentativas?: number; jitter?: number } = {}): { acao: 'RETRY'; atrasoMs: number } | { acao: 'DLQ' } {
  const { baseMs = 1000, maxMs = 15 * 60_000, maxTentativas = 8, jitter = 0 } = opts;
  if (tentativa >= maxTentativas) return { acao: 'DLQ' };
  const atraso = Math.min(maxMs, baseMs * 2 ** tentativa);
  return { acao: 'RETRY', atrasoMs: Math.round(atraso * (1 + jitter)) };
}

/** Limite de taxa por fonte e por tenant (token bucket). */
export class TokenBucket {
  private tokens: number;
  private ultimo: number;
  private capacidade: number;
  private porSegundo: number;
  constructor(capacidade: number, porSegundo: number, agoraMs: number) { this.capacidade = capacidade; this.porSegundo = porSegundo; this.tokens = capacidade; this.ultimo = agoraMs; }
  tentar(agoraMs: number): boolean {
    this.tokens = Math.min(this.capacidade, this.tokens + ((agoraMs - this.ultimo) / 1000) * this.porSegundo);
    this.ultimo = agoraMs;
    if (this.tokens >= 1) { this.tokens -= 1; return true; }
    return false;
  }
}

export type EventoMonitoramento =
  | { tipo: 'CAIXA_POSTAL_NOVA_MENSAGEM'; tenantId: string; ref: string }
  | { tipo: 'NOVA_INTIMACAO'; tenantId: string; ref: string }
  | { tipo: 'DIVERGENCIA_NFE_SPED'; tenantId: string; ref: string }
  | { tipo: 'MOVIMENTACAO_PRECATORIO'; tenantId: string; ref: string };

/** Toda regra de monitoramento gera WorkItem para revisão humana — nunca executa. */
export function eventoParaWorkItemStatus(_e: EventoMonitoramento): 'READY_FOR_REVIEW' {
  return 'READY_FOR_REVIEW';
}
