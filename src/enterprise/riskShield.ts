/**
 * VELATRIX AOS · Enterprise · Shield de Risco / Audit Checker (Ferramenta 3 · P14).
 *
 * Catálogo de checagens puras (input → resultado + evidência). Nada de "40 checagens"
 * fixas: o catálogo cresce por esteira e versão. Flag final = pior severidade entre as
 * checagens que FALHARAM; nenhuma checagem executada → NAO_AVALIADO (nunca GREEN).
 */
import { NormaRegistry } from './normaRef.ts';
import { ncmMonofasico, type NcmMonofasicoRegra } from './deterministicEngine.ts';

export type Severidade = 'INFO' | 'YELLOW' | 'RED';
export type Flag = 'GREEN' | 'YELLOW' | 'RED' | 'NAO_AVALIADO';
export type Esteira = 'RECUPERACAO_TRIBUTARIA' | 'PERICIA_JUDICIAL' | 'INSS' | 'INSS_OBRAS' | 'PRECATORIA' | 'DIAGNOSTICO';

export type ResultadoCheck =
  | { status: 'OK'; evidencia: string }
  | { status: 'FALHA'; evidencia: string }
  | { status: 'NAO_VERIFICADO'; motivo: string };

export interface RiskCheck<I> {
  id: string;
  esteira: Esteira;
  descricao: string;
  severidade: Severidade;
  normaRefId?: string;
  versao: number;
  ativa: boolean;
  run: (input: I, ctx: { normas: NormaRegistry; hoje: string }) => ResultadoCheck;
}

export interface Achado { checkId: string; descricao: string; severidade: Severidade; normaRefId?: string; resultado: ResultadoCheck; }

export function executar<I>(checks: RiskCheck<I>[], input: I, ctx: { normas: NormaRegistry; hoje: string }): { flag: Flag; achados: Achado[] } {
  const achados: Achado[] = checks.filter((c) => c.ativa).map((c) => {
    let resultado: ResultadoCheck;
    try { resultado = c.run(input, ctx); } catch (e) { resultado = { status: 'NAO_VERIFICADO', motivo: 'erro na checagem: ' + (e as Error).message }; }
    return { checkId: c.id, descricao: c.descricao, severidade: c.severidade, normaRefId: c.normaRefId, resultado };
  });
  return { flag: classificar(achados), achados };
}

export function classificar(achados: Achado[]): Flag {
  const executadas = achados.filter((a) => a.resultado.status !== 'NAO_VERIFICADO');
  if (executadas.length === 0) return 'NAO_AVALIADO';
  const falhas = executadas.filter((a) => a.resultado.status === 'FALHA');
  if (falhas.some((a) => a.severidade === 'RED')) return 'RED';
  if (falhas.some((a) => a.severidade === 'YELLOW')) return 'YELLOW';
  return 'GREEN';
}

// ───────────── Recuperação Tributária ─────────────

export interface CreditoTributario {
  id: string;
  tributo: string;
  competencia: string;          // AAAA-MM
  dataPagamento?: string;       // AAAA-MM-DD
  valorCentavos: number;
  tese?: { normaRefId: string; periodoExcluidoAte?: string }; // modulação: exclui fatos até a data
  ncm?: string;
  dataFatoGerador?: string;
  spedValorCentavos?: number;   // EFD/SPED da competência
  dctfValorCentavos?: number;   // DCTF/DCTFWeb da competência
  perdcompAnteriores?: Array<{ numero: string; creditoId: string }>;
  debitoCompensar?: { codigoReceita: string };
}

export interface ContextoRecuperacao {
  creditos: CreditoTributario[];
  regrasMonofasico?: NcmMonofasicoRegra[];
  codigosReceitaVedados?: string[]; // débitos com vedação legal de compensação (lista da NormaRef)
  dataPedido: string;               // AAAA-MM-DD da transmissão prevista
}

function addYears(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${y + n}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export const CHECKS_RECUPERACAO: RiskCheck<ContextoRecuperacao>[] = [
  {
    id: 'RT-001-prescricao', esteira: 'RECUPERACAO_TRIBUTARIA', versao: 1, ativa: true, severidade: 'RED', normaRefId: 'CTN',
    descricao: 'Crédito prescrito (mais de 5 anos do pagamento — CTN art. 168)',
    run: (ctx, { normas }) => {
      const semData = ctx.creditos.filter((c) => !c.dataPagamento);
      if (semData.length === ctx.creditos.length) return { status: 'NAO_VERIFICADO', motivo: 'sem data de pagamento nos créditos' };
      const anos = normas.parametro('CTN', 'prazoRestituicaoAnos');
      const prescritos = ctx.creditos.filter((c) => c.dataPagamento && addYears(c.dataPagamento, anos) < ctx.dataPedido);
      return prescritos.length
        ? { status: 'FALHA', evidencia: `${prescritos.length} crédito(s) com pagamento anterior a ${anos} anos do pedido: ${prescritos.map((c) => c.id).join(', ')}` }
        : { status: 'OK', evidencia: `${ctx.creditos.length - semData.length} crédito(s) dentro do prazo` };
    },
  },
  {
    id: 'RT-002-tese-modulacao', esteira: 'RECUPERACAO_TRIBUTARIA', versao: 1, ativa: true, severidade: 'RED',
    descricao: 'Tese sem precedente vinculante cadastrado ou período excluído por modulação de efeitos',
    run: (ctx, { normas }) => {
      const comTese = ctx.creditos.filter((c) => c.tese);
      if (!comTese.length) return { status: 'NAO_VERIFICADO', motivo: 'nenhum crédito associado a tese' };
      const problemas = comTese.filter((c) => !normas.get(c.tese!.normaRefId) || (c.tese!.periodoExcluidoAte && c.competencia + '-01' <= c.tese!.periodoExcluidoAte));
      return problemas.length
        ? { status: 'FALHA', evidencia: `créditos fora da tese/modulação: ${problemas.map((c) => c.id).join(', ')}` }
        : { status: 'OK', evidencia: `${comTese.length} crédito(s) amparados por norma cadastrada` };
    },
  },
  {
    id: 'RT-003-sped-dctf', esteira: 'RECUPERACAO_TRIBUTARIA', versao: 1, ativa: true, severidade: 'YELLOW',
    descricao: 'Divergência entre SPED/EFD e DCTF na mesma competência',
    run: (ctx) => {
      const comp = ctx.creditos.filter((c) => c.spedValorCentavos !== undefined && c.dctfValorCentavos !== undefined);
      if (!comp.length) return { status: 'NAO_VERIFICADO', motivo: 'SPED e DCTF não disponíveis para cruzamento' };
      const div = comp.filter((c) => c.spedValorCentavos !== c.dctfValorCentavos);
      return div.length
        ? { status: 'FALHA', evidencia: div.map((c) => `${c.competencia} ${c.tributo}: SPED ${c.spedValorCentavos} × DCTF ${c.dctfValorCentavos} (centavos)`).join('; ') }
        : { status: 'OK', evidencia: `${comp.length} competência(s) conciliadas` };
    },
  },
  {
    id: 'RT-004-duplicidade-perdcomp', esteira: 'RECUPERACAO_TRIBUTARIA', versao: 1, ativa: true, severidade: 'RED',
    descricao: 'Crédito já utilizado em PER/DCOMP anterior (duplicidade)',
    run: (ctx) => {
      const hist = ctx.creditos.filter((c) => c.perdcompAnteriores !== undefined);
      if (!hist.length) return { status: 'NAO_VERIFICADO', motivo: 'histórico de PER/DCOMP não informado' };
      const dup = hist.filter((c) => c.perdcompAnteriores!.some((p) => p.creditoId === c.id));
      return dup.length
        ? { status: 'FALHA', evidencia: dup.map((c) => `${c.id} em ${c.perdcompAnteriores!.filter((p) => p.creditoId === c.id).map((p) => p.numero).join(', ')}`).join('; ') }
        : { status: 'OK', evidencia: 'nenhuma duplicidade encontrada' };
    },
  },
  {
    id: 'RT-005-ncm-monofasico', esteira: 'RECUPERACAO_TRIBUTARIA', versao: 1, ativa: true, severidade: 'RED',
    descricao: 'Crédito de tese monofásica com NCM fora da lista na data do fato gerador',
    run: (ctx) => {
      const alvo = ctx.creditos.filter((c) => c.ncm && c.dataFatoGerador);
      if (!alvo.length || !ctx.regrasMonofasico) return { status: 'NAO_VERIFICADO', motivo: 'NCM/data do fato gerador ou lista monofásica ausentes' };
      const fora = alvo.filter((c) => !ncmMonofasico(c.ncm!, c.dataFatoGerador!, ctx.regrasMonofasico!));
      return fora.length
        ? { status: 'FALHA', evidencia: fora.map((c) => `${c.id}: NCM ${c.ncm} em ${c.dataFatoGerador}`).join('; ') }
        : { status: 'OK', evidencia: `${alvo.length} item(ns) com NCM monofásico vigente` };
    },
  },
  {
    id: 'RT-006-compensacao-vedada', esteira: 'RECUPERACAO_TRIBUTARIA', versao: 1, ativa: true, severidade: 'RED', normaRefId: 'LEI:9430:1996',
    descricao: 'Compensação com débito vedado por lei (art. 74 §3º Lei 9.430/96 e correlatos)',
    run: (ctx) => {
      const comDebito = ctx.creditos.filter((c) => c.debitoCompensar);
      if (!comDebito.length) return { status: 'NAO_VERIFICADO', motivo: 'débitos a compensar não informados' };
      if (!ctx.codigosReceitaVedados) return { status: 'NAO_VERIFICADO', motivo: 'lista de débitos vedados não carregada' };
      const ved = comDebito.filter((c) => ctx.codigosReceitaVedados!.includes(c.debitoCompensar!.codigoReceita));
      return ved.length
        ? { status: 'FALHA', evidencia: ved.map((c) => `${c.id} → código ${c.debitoCompensar!.codigoReceita}`).join('; ') }
        : { status: 'OK', evidencia: 'nenhum débito vedado' };
    },
  },
];

/**
 * Exposição a multa em caso de lançamento — percentuais SEMPRE da NormaRef.
 * A multa isolada de 50% (art. 74 §17) NÃO entra: inconstitucional (Tema 736/STF).
 */
export function exposicaoMulta(valorCentavos: number, normas: NormaRegistry, qualificada = false, reincidente = false) {
  const id = 'LEI:9430:1996';
  const pct = !qualificada ? normas.parametro(id, 'multaOficioPct')
    : reincidente ? normas.parametro(id, 'multaQualificadaReincidenciaPct') : normas.parametro(id, 'multaQualificadaPct');
  return { normaRefId: id, pct, multaCentavos: Math.round((valorCentavos * pct) / 100), excluidas: ['Multa isolada 50% por compensação não homologada (Tema 736/STF)'] };
}

// ───────────── Precatória · Due diligence ─────────────

export interface ContextoPrecatorio {
  cessoesRegistradas?: Array<{ cessionario: string; data: string }> | null; // null = fonte indisponível
  penhoras?: Array<{ processo: string }> | null;
  posicaoOrdemCronologica?: { posicao: number; total: number } | null;
  capacidadePagamento?: { rclCentavos: number; estoquePrecatoriosCentavos: number; fonte: string } | null; // Siconfi RREO/RGF
  natureza?: 'ALIMENTAR' | 'COMUM' | null;
  limiteEstoqueRclPct?: number; // política de risco do tenant; ausente → não verificado
}

export const CHECKS_PRECATORIO: RiskCheck<ContextoPrecatorio>[] = [
  {
    id: 'PR-001-cessao-anterior', esteira: 'PRECATORIA', versao: 1, ativa: true, severidade: 'RED',
    descricao: 'Cessões anteriores registradas no processo',
    run: (c) => c.cessoesRegistradas == null ? { status: 'NAO_VERIFICADO', motivo: 'autos do processo não ingeridos' }
      : c.cessoesRegistradas.length ? { status: 'FALHA', evidencia: c.cessoesRegistradas.map((x) => `${x.cessionario} (${x.data})`).join('; ') } : { status: 'OK', evidencia: 'sem cessão registrada' },
  },
  {
    id: 'PR-002-penhora', esteira: 'PRECATORIA', versao: 1, ativa: true, severidade: 'RED',
    descricao: 'Penhoras registradas sobre o crédito',
    run: (c) => c.penhoras == null ? { status: 'NAO_VERIFICADO', motivo: 'autos do processo não ingeridos' }
      : c.penhoras.length ? { status: 'FALHA', evidencia: c.penhoras.map((x) => x.processo).join('; ') } : { status: 'OK', evidencia: 'sem penhora registrada' },
  },
  {
    id: 'PR-003-capacidade-ente', esteira: 'PRECATORIA', versao: 1, ativa: true, severidade: 'YELLOW',
    descricao: 'Estoque de precatórios elevado frente à RCL do ente devedor (Siconfi)',
    run: (c) => {
      if (c.capacidadePagamento == null) return { status: 'NAO_VERIFICADO', motivo: 'RREO/RGF do Siconfi não disponível' };
      if (c.limiteEstoqueRclPct === undefined) return { status: 'NAO_VERIFICADO', motivo: 'limite estoque/RCL não configurado pelo tenant' };
      const ratio = c.capacidadePagamento.estoquePrecatoriosCentavos / c.capacidadePagamento.rclCentavos;
      const ev = `estoque/RCL = ${(ratio * 100).toFixed(2)}% (${c.capacidadePagamento.fonte})`;
      return ratio * 100 > c.limiteEstoqueRclPct ? { status: 'FALHA', evidencia: ev } : { status: 'OK', evidencia: ev };
    },
  },
  {
    id: 'PR-004-natureza', esteira: 'PRECATORIA', versao: 1, ativa: true, severidade: 'INFO',
    descricao: 'Natureza do crédito identificada (alimentar/comum) para o regime aplicável',
    run: (c) => c.natureza == null ? { status: 'NAO_VERIFICADO', motivo: 'natureza não identificada' } : { status: 'OK', evidencia: c.natureza },
  },
];
