/**
 * VELATRIX AOS · Enterprise · Guardrail anti-alucinação (Ferramenta 2).
 *
 * O LLM só redige. Antes de um texto virar laudo/petição:
 *  1. todo valor monetário (R$) e todo percentual citado precisa bater com um valor
 *     produzido pelo motor determinístico ou com um parâmetro da NormaRef citada;
 *  2. toda citação normativa precisa existir na base local e estar vigente.
 * Qualquer violação bloqueia a emissão (status BLOQUEADO), nunca "corrige" em silêncio.
 */
import { extrairCitacoes, NormaRegistry } from './normaRef.ts';

export interface ValoresPermitidos {
  centavos: number[];   // saídas do motor determinístico
  percentuais?: number[]; // ex.: fator SELIC, alíquotas calculadas
}

export interface GuardrailResultado {
  status: 'APROVADO' | 'BLOQUEADO';
  valoresNaoRastreados: string[];
  percentuaisNaoRastreados: string[];
  citacoesDesconhecidas: string[];
  citacoesNaoVigentes: string[];
}

export function parseBRLToCentavos(s: string): number {
  const m = s.match(/(-)?\s*R\$\s*(-)?\s*([\d.]+)(?:,(\d{1,2}))?/);
  if (!m) throw new Error('valor BRL inválido: ' + s);
  const reais = Number(m[3].replace(/\./g, ''));
  const cent = m[4] ? Number(m[4].padEnd(2, '0')) : 0;
  const v = reais * 100 + cent;
  return m[1] || m[2] ? -v : v;
}

function parsePct(s: string): number {
  return Number(s.replace('%', '').trim().replace(/\./g, '').replace(',', '.'));
}

export function verificarTexto(
  texto: string,
  permitidos: ValoresPermitidos,
  normas: NormaRegistry,
  dataReferencia: string,
): GuardrailResultado {
  const centSet = new Set(permitidos.centavos);
  const pctPermit = new Set<number>((permitidos.percentuais ?? []).map((p) => Math.round(p * 1e4)));

  const citacoes = extrairCitacoes(texto);
  const citacoesDesconhecidas: string[] = [];
  const citacoesNaoVigentes: string[] = [];
  for (const c of citacoes) {
    const n = normas.get(c.key);
    if (!n) citacoesDesconhecidas.push(c.texto);
    else {
      if (!normas.vigente(c.key, dataReferencia)) citacoesNaoVigentes.push(c.texto);
      for (const v of Object.values(n.parametros ?? {})) pctPermit.add(Math.round(Number(v) * 1e4));
    }
  }

  const valoresNaoRastreados: string[] = [];
  for (const m of texto.matchAll(/-?\s*R\$\s*-?\s*[\d.]+(?:,\d{1,2})?/g)) {
    if (!centSet.has(parseBRLToCentavos(m[0]))) valoresNaoRastreados.push(m[0].trim());
  }
  const percentuaisNaoRastreados: string[] = [];
  for (const m of texto.matchAll(/\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*%/g)) {
    if (!pctPermit.has(Math.round(parsePct(m[0]) * 1e4))) percentuaisNaoRastreados.push(m[0].trim());
  }

  const bloqueado = valoresNaoRastreados.length + percentuaisNaoRastreados.length + citacoesDesconhecidas.length + citacoesNaoVigentes.length > 0;
  return { status: bloqueado ? 'BLOQUEADO' : 'APROVADO', valoresNaoRastreados, percentuaisNaoRastreados, citacoesDesconhecidas, citacoesNaoVigentes };
}
