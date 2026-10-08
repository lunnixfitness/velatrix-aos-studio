/**
 * VELATRIX AOS · Leitura de Autos (P26) — relatório consolidado + linha do tempo.
 *
 * Puro. Só fatos com status CONFERE entram no relatório; os demais aparecem apenas
 * como contagem de pendência. O hash é injetado (servidor: hashCanonicalSync) para
 * o módulo não depender de node:crypto e rodar igual nos testes.
 */
import { datasNoTexto, type CampoFato, type FatoVerificado, type ResultadoGuardrailCitacao } from '../../documents/autos/citacao.ts';
import type { PecaRef } from './extracaoPeca.ts';

export interface ExtracaoPeca {
  autosHash: string;
  peca: PecaRef;
  /** Hash das páginas enviadas (dedupe e trilha de auditoria; o texto não é guardado no ledger). */
  paginasHash: string;
  fatos: FatoVerificado[];
  guardrail: ResultadoGuardrailCitacao['status'];
  conferidos: number;
  rejeitados: number;
  descartados: number;
  /** ia = só IA · deterministico = só regras (zero token) · hibrido = regras + IA nos campos narrativos. */
  origem: 'ia' | 'deterministico' | 'hibrido';
  modo: 'economico' | 'hibrido' | 'completo';
  modelo?: string;
  consumo: ConsumoIa;
  /** Híbrido pediu IA mas o provedor não está configurado: ficou só nas regras. */
  iaIndisponivel?: boolean;
  emUTC: string;
}

export interface ConsumoIa {
  tokensEntrada: number;
  tokensSaida: number;
  /** Estimativa do que a chamada à IA custaria e não foi feita (regras resolveram). */
  tokensEvitados: number;
  chamadasIa: number;
  /** true quando o provedor não informou o uso e os tokens foram estimados (≈ 4 caracteres/token). */
  estimado: boolean;
}

export function somarConsumo(lista: ConsumoIa[]): ConsumoIa {
  return lista.reduce<ConsumoIa>(
    (a, c) => ({
      tokensEntrada: a.tokensEntrada + c.tokensEntrada,
      tokensSaida: a.tokensSaida + c.tokensSaida,
      tokensEvitados: a.tokensEvitados + c.tokensEvitados,
      chamadasIa: a.chamadasIa + c.chamadasIa,
      estimado: a.estimado || c.estimado,
    }),
    { tokensEntrada: 0, tokensSaida: 0, tokensEvitados: 0, chamadasIa: 0, estimado: false },
  );
}

export interface PecaResumo extends PecaRef {
  assinadoEm?: string;
}

export interface FatoRelatorio {
  valor: string;
  pagina: number;
  trecho: string;
  pecaId: string;
}

export interface EventoLinhaDoTempo {
  data: string; // AAAA-MM-DD
  descricao: string;
  pagina: number;
  pecaId: string;
  origem: 'fato' | 'assinatura';
}

export interface RelatorioAutos {
  versao: 1;
  tipoDocumento: 'RELATORIO_LEITURA_AUTOS';
  autosHash: string;
  nomeArquivo: string;
  totalPaginas: number;
  pecas: (PecaResumo & { extracao: ExtracaoPeca['guardrail'] | 'NAO_EXTRAIDA'; conferidos: number; rejeitados: number })[];
  fatos: Partial<Record<CampoFato, FatoRelatorio[]>>;
  linhaDoTempo: EventoLinhaDoTempo[];
  pendencias: { pecasNaoExtraidas: string[]; fatosRejeitados: number };
  /** Tokens gastos e evitados na leitura (fora do hash de conteúdo: mesmo conteúdo, custo diferente). */
  consumo?: ConsumoIa;
  guardrail: 'APROVADO' | 'PARCIAL' | 'BLOQUEADO';
  /** Hash do conteúdo (sem data de geração): mesma leitura → mesmo hash → idempotência. */
  conteudoHash: string;
  geradoEmUTC: string;
}

const ROTULO: Record<CampoFato, string> = {
  parte_autora: 'Parte autora', parte_re: 'Parte ré', advogado: 'Advogado', juizo: 'Juízo',
  numero_processo: 'Número do processo', pedido: 'Pedido', valor: 'Valor', data: 'Data',
  prazo: 'Prazo', decisao: 'Decisão', fundamento_legal: 'Fundamento legal', outro: 'Outro',
};

const recorte = (s: string, n = 160) => {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

export function montarLinhaDoTempo(pecas: PecaResumo[], extracoes: ExtracaoPeca[]): EventoLinhaDoTempo[] {
  const eventos: EventoLinhaDoTempo[] = [];
  const vistos = new Set<string>();
  const add = (e: EventoLinhaDoTempo) => {
    const k = `${e.data}|${e.pagina}|${e.descricao}`;
    if (!vistos.has(k)) { vistos.add(k); eventos.push(e); }
  };
  for (const p of pecas) {
    const d = p.assinadoEm ? datasNoTexto(p.assinadoEm)[0] : undefined;
    if (d) add({ data: d, descricao: `${p.titulo || p.tipo} assinada`, pagina: p.paginaInicial, pecaId: p.id, origem: 'assinatura' });
  }
  for (const ex of extracoes) {
    for (const f of ex.fatos) {
      if (f.status !== 'CONFERE' || (f.campo !== 'data' && f.campo !== 'prazo')) continue;
      for (const d of datasNoTexto(f.valor)) {
        add({ data: d, descricao: `${ROTULO[f.campo]} · ${recorte(f.trecho)}`, pagina: f.pagina, pecaId: ex.peca.id, origem: 'fato' });
      }
    }
  }
  return eventos.sort((a, b) => a.data.localeCompare(b.data) || a.pagina - b.pagina);
}

export function montarRelatorio(
  entrada: { autosHash: string; nomeArquivo: string; totalPaginas: number; pecas: PecaResumo[]; extracoes: ExtracaoPeca[]; agoraUTC: string },
  hash: (v: unknown) => string,
): RelatorioAutos {
  const porPeca = new Map(entrada.extracoes.map((e) => [e.peca.id, e]));
  const fatos: RelatorioAutos['fatos'] = {};
  let rejeitados = 0;
  let conferidos = 0;
  for (const ex of entrada.extracoes) {
    rejeitados += ex.rejeitados;
    for (const f of ex.fatos) {
      if (f.status !== 'CONFERE') continue;
      conferidos++;
      const lista = (fatos[f.campo] ??= []);
      if (!lista.some((x) => x.valor === f.valor && x.pagina === f.pagina)) {
        lista.push({ valor: f.valor, pagina: f.pagina, trecho: f.trecho, pecaId: ex.peca.id });
      }
    }
  }
  for (const lista of Object.values(fatos)) lista!.sort((a, b) => a.pagina - b.pagina);

  const pecas = [...entrada.pecas]
    .sort((a, b) => a.paginaInicial - b.paginaInicial)
    .map((p) => {
      const ex = porPeca.get(p.id);
      return { ...p, extracao: ex ? ex.guardrail : ('NAO_EXTRAIDA' as const), conferidos: ex?.conferidos ?? 0, rejeitados: ex?.rejeitados ?? 0 };
    });
  const pecasNaoExtraidas = pecas.filter((p) => p.extracao === 'NAO_EXTRAIDA').map((p) => p.id);
  const guardrail: RelatorioAutos['guardrail'] =
    conferidos === 0 ? 'BLOQUEADO' : rejeitados || pecasNaoExtraidas.length ? 'PARCIAL' : 'APROVADO';

  const conteudo = {
    versao: 1 as const,
    tipoDocumento: 'RELATORIO_LEITURA_AUTOS' as const,
    autosHash: entrada.autosHash,
    nomeArquivo: entrada.nomeArquivo,
    totalPaginas: entrada.totalPaginas,
    pecas,
    fatos,
    linhaDoTempo: montarLinhaDoTempo(entrada.pecas, entrada.extracoes),
    pendencias: { pecasNaoExtraidas, fatosRejeitados: rejeitados },
    guardrail,
  };
  // JSON round-trip: remove undefined (JCS/canonicalize não aceita) e congela a forma que vai para o hash.
  const limpo = JSON.parse(JSON.stringify(conteudo)) as typeof conteudo;
  return { ...limpo, consumo: somarConsumo(entrada.extracoes.map((e) => e.consumo)), conteudoHash: hash(limpo), geradoEmUTC: entrada.agoraUTC };
}

// ───────────────────────── payload da Fila de Aprovação (HITL) ─────────────────────────

const brl = (centavos: number) =>
  `R$ ${Math.floor(centavos / 100).toLocaleString('pt-BR')},${String(centavos % 100).padStart(2, '0')}`;

/**
 * Converte o relatório no formato WorkItemPayload da Fila de Aprovação
 * (titulo, cliente, metricas, memoriaCalculo, textoLaudo) + o relatório completo.
 * O textoLaudo só cita valores que estão na memoriaCalculo e não cita norma:
 * o guardrail do HITL (valores rastreáveis + NormaRef) aprova sem exceção especial.
 */
export function payloadRevisaoAutos(
  r: Omit<RelatorioAutos, 'geradoEmUTC'>,
  paraCentavos: (s: string) => number | null,
): { titulo: string; cliente: string; metricas: { rotulo: string; valor: string }[]; memoriaCalculo: { linha: string; valorCentavos: number }[]; textoLaudo: string } {
  const vistos = new Set<number>();
  const valores: { centavos: number; pagina: number }[] = [];
  for (const f of r.fatos.valor ?? []) {
    const c = paraCentavos(f.valor);
    if (c === null || c <= 0 || vistos.has(c)) continue;
    vistos.add(c);
    valores.push({ centavos: c, pagina: f.pagina });
  }
  const conferidos = Object.values(r.fatos).reduce((s, l) => s + (l?.length ?? 0), 0);
  const extraidas = r.pecas.filter((p) => p.extracao !== 'NAO_EXTRAIDA').length;
  const processo = r.fatos.numero_processo?.[0]?.valor;
  return {
    titulo: `Leitura de autos · ${r.nomeArquivo}`.slice(0, 200),
    cliente: processo ? `Processo ${processo}` : `Autos ${r.autosHash.slice(0, 12)}`,
    metricas: [
      { rotulo: 'Páginas', valor: String(r.totalPaginas) },
      { rotulo: 'Peças extraídas', valor: `${extraidas} de ${r.pecas.length}` },
      { rotulo: 'Fatos conferidos', valor: String(conferidos) },
      { rotulo: 'Rejeitados pelo guardrail', valor: String(r.pendencias.fatosRejeitados) },
      { rotulo: 'Linha do tempo', valor: `${r.linhaDoTempo.length} evento(s)` },
    ],
    memoriaCalculo: valores.map((v) => ({ linha: `Valor citado nos autos · p. ${v.pagina}`, valorCentavos: v.centavos })),
    textoLaudo:
      `Leitura automatizada dos autos (${r.totalPaginas} páginas, ${r.pecas.length} peças): ${conferidos} fato(s) conferido(s) com a página de origem.` +
      (valores.length ? ` Valores citados: ${valores.map((v) => `${brl(v.centavos)} (p. ${v.pagina})`).join('; ')}.` : '') +
      ' Conteúdo sujeito a revisão do profissional habilitado.',
  };
}
