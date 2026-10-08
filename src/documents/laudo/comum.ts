/**
 * Regras comuns de emissão de laudo (P28) — valem para TODAS as esteiras.
 *
 * Princípio herdado do P27 (Perícia): o sistema não presume nada que vá no laudo.
 * Responsável técnico, conclusão e origem dos números vêm de quem assina; a
 * assinatura ICP-Brasil só é afirmada depois de acontecer.
 * Funções puras — testadas em __tests__/emissao.nodetest.ts.
 */

export type Conselho = 'CRC' | 'CREA' | 'CRM' | 'OAB' | 'CORECON';
export const CONSELHOS: Conselho[] = ['CRC', 'CREA', 'CRM', 'OAB', 'CORECON'];

export interface ResponsavelTecnico {
  nome: string;
  conselho: Conselho | '';
  /** Como consta na carteira, ex.: "CRC-SP 123456/O-7", "OAB/SP 123.456". */
  registro: string;
}

export const RESPONSAVEL_VAZIO: ResponsavelTecnico = { nome: '', conselho: '', registro: '' };

/**
 * De onde vieram os números do laudo.
 * - documentos_custodiados: extraídos de arquivos com SHA-256 na cadeia de custódia
 * - conexao_erp_assinada: puxados por conector ERP com webhook assinado
 * - gerador_demonstracao: produzidos por gerador sintético (só DEMO_MODE, sem validade)
 * - nao_informada: ninguém declarou — bloqueia
 */
export type OrigemDados = 'documentos_custodiados' | 'conexao_erp_assinada' | 'gerador_demonstracao' | 'nao_informada';

export interface BaseEmissao {
  /** Estágios não terminais, não dispensados e não concluídos (ex.: "#3 Cruzamento"). */
  estagiosPendentes: string[];
  arquivosCustodia: number;
  origemDados: OrigemDados;
  /** IS_DEMO_MODE do servidor/cliente. Só aqui dado sintético pode virar laudo — marcado sem validade. */
  modoDemonstracao: boolean;
}

export const preenchido = (s: string | null | undefined, min = 1) => (s ?? '').trim().length >= min;

export function pendenciasBase(b: BaseEmissao): string[] {
  const p: string[] = [];
  if (b.estagiosPendentes.length) p.push(`Conclua os estágios da esteira: ${b.estagiosPendentes.join(', ')}.`);
  if (b.arquivosCustodia < 1) p.push('Anexe ao menos um documento examinado (cadeia de custódia SHA-256).');
  if (b.origemDados === 'nao_informada') {
    p.push('Origem dos dados do laudo não informada.');
  } else if (b.origemDados === 'gerador_demonstracao' && !b.modoDemonstracao) {
    p.push('Os números vêm do gerador de demonstração: laudo oficial exige dados extraídos dos documentos custodiados ou de conexão ERP assinada.');
  }
  return p;
}

export function pendenciasResponsavel(r: ResponsavelTecnico, aceitos: readonly Conselho[]): string[] {
  const p: string[] = [];
  const nome = r.nome.trim();
  if (!preenchido(nome, 5) || !/\S+\s+\S+/.test(nome)) p.push('Informe o nome completo do responsável técnico.');
  if (!r.conselho) {
    p.push(`Selecione o conselho profissional do responsável (${aceitos.join('/')}).`);
  } else if (!aceitos.includes(r.conselho)) {
    p.push(`Conselho ${r.conselho} não habilita este laudo (aceitos: ${aceitos.join('/')}).`);
  }
  if (!preenchido(r.registro, 4) || !/\d/.test(r.registro)) p.push('Informe o número de registro no conselho (ex.: CRC-SP 123456/O-7).');
  return p;
}

export function pendenciasTexto(rotulo: string, texto: string, min: number): string[] {
  return preenchido(texto, min) ? [] : [`Escreva ${rotulo} (mín. ${min} caracteres).`];
}

export interface SignerPendente {
  name: string;
  role: string;
  credentialNumber: string;
  signatureType: 'PENDENTE_ASSINATURA_ICP';
}

/** Signatário do laudo recém-emitido: quem assina é o responsável; ICP-Brasil ainda NÃO aconteceu. */
export function signerPendente(r: ResponsavelTecnico, papel: string): SignerPendente {
  return {
    name: r.nome.trim(),
    role: `${papel} (${r.conselho})`,
    credentialNumber: r.registro.trim(),
    signatureType: 'PENDENTE_ASSINATURA_ICP',
  };
}

export type IntegridadeFontes = 'ARQUIVOS_AUDITADOS' | 'CONEXAO_ERP_ASSINADA' | 'DEMONSTRACAO_SEM_VALIDADE';

/** Rótulo de integridade que o laudo pode afirmar, dado de onde os números vieram. */
export function integridadeDasFontes(origem: OrigemDados): IntegridadeFontes {
  if (origem === 'documentos_custodiados') return 'ARQUIVOS_AUDITADOS';
  if (origem === 'conexao_erp_assinada') return 'CONEXAO_ERP_ASSINADA';
  if (origem === 'gerador_demonstracao') return 'DEMONSTRACAO_SEM_VALIDADE';
  throw new Error('Origem dos dados não informada: o laudo não pode afirmar integridade.');
}

// ───────────── datas ISO (AAAA-MM-DD / AAAA-MM) ─────────────

export function lerDataIso(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null;
}

/** 'AAAA-MM' → índice de mês absoluto (ano*12 + mês-1), ou null se inválida. */
export function mesAbsoluto(comp: string): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(comp.trim());
  if (!m || +m[2] < 1 || +m[2] > 12) return null;
  return +m[1] * 12 + (+m[2] - 1);
}
