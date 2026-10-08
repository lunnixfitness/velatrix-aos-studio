/**
 * VELATRIX AOS · Correspondentes & Parcerias (P23)
 *
 * Substitui o antigo split 50/50 (Velatrix × parceiro sobre honorários).
 * Regras de conformidade embutidas:
 *  - A Velatrix NUNCA participa de honorários/resultado do cliente. A receita
 *    da plataforma é licença SaaS + uso (ver legalOpsPackages.ts).
 *  - A divisão só ocorre entre profissionais da MESMA classe regulada
 *    (OAB com OAB, CRC com CRC, perito com perito).
 *  - Acordo só fica "vigente" com ciência do cliente registrada e selo SHA-256.
 * Módulo puro (sem React/IO) — o selo é calculado fora, via hashCanonical.
 */

export type ClasseProfissional = 'OAB' | 'CRC' | 'PERITO';
export type PapelParticipante = 'titular' | 'correspondente' | 'coautor';
export type StatusAcordo = 'rascunho' | 'vigente' | 'encerrado';

export interface Participante {
  id: string;
  nome: string;
  registro: string; // ex.: OAB/SP 118.204 · CRC/SP 1SP301442/O-7
  classe: ClasseProfissional;
  papel: PapelParticipante;
  percentual: number; // 0 < p ≤ 100, soma = 100
  interno: boolean; // membro do tenant ou profissional externo
}

export interface CienciaCliente {
  cliente: string;
  documento: string; // CPF/CNPJ
  meio: 'contrato' | 'aditivo' | 'email' | 'assinatura_digital';
  em: string; // ISO
}

export interface AcordoParceria {
  id: string;
  tenantId: string;
  titulo: string;
  classe: ClasseProfissional;
  participantes: Participante[];
  ciencia: CienciaCliente | null;
  status: StatusAcordo;
  criadoEm: string;
  criadoPor: string;
  selo: string | null; // SHA-256 de payloadSelo()
  encerradoEm?: string;
}

export const CLASSE_LABEL: Record<ClasseProfissional, string> = {
  OAB: 'Advocacia (OAB)',
  CRC: 'Contabilidade (CRC)',
  PERITO: 'Perícia judicial',
};

const REGISTRO_RE: Record<ClasseProfissional, RegExp> = {
  OAB: /^OAB\/[A-Z]{2}\s*\d{1,3}(\.?\d{3})?(-?[A-Z])?$/,
  CRC: /^CRC\/[A-Z]{2}\s*\S+$/,
  PERITO: /^\S.{3,}$/,
};

/** Qualquer referência à plataforma como beneficiária é vetada. */
const PLATAFORMA_RE = /velatrix/i;
const EPS = 0.001;

export function validarAcordo(a: Pick<AcordoParceria, 'classe' | 'participantes' | 'titulo'>): string[] {
  const erros: string[] = [];
  const ps = a.participantes || [];
  if (!a.titulo?.trim()) erros.push('Informe um título para o acordo.');
  if (ps.length < 2) erros.push('Um acordo de parceria precisa de pelo menos 2 profissionais.');

  const ids = new Set<string>();
  const registros = new Set<string>();
  for (const p of ps) {
    if (ids.has(p.id)) erros.push(`Participante duplicado: ${p.nome}.`);
    ids.add(p.id);
    const reg = (p.registro || '').trim().toUpperCase();
    if (registros.has(reg)) erros.push(`Registro profissional repetido: ${p.registro}.`);
    registros.add(reg);
    if (PLATAFORMA_RE.test(p.id) || PLATAFORMA_RE.test(p.nome)) {
      erros.push('A Velatrix não participa de honorários — remova a plataforma da divisão.');
    }
    if (p.classe !== a.classe) {
      erros.push(`${p.nome} é ${CLASSE_LABEL[p.classe]}; a divisão só é permitida entre profissionais de ${CLASSE_LABEL[a.classe]}.`);
    }
    if (!REGISTRO_RE[a.classe].test(reg)) erros.push(`Registro inválido para ${p.nome}: "${p.registro}".`);
    if (!(p.percentual > 0 && p.percentual <= 100)) erros.push(`Percentual de ${p.nome} deve estar entre 0 e 100.`);
  }
  const soma = ps.reduce((s, p) => s + (Number(p.percentual) || 0), 0);
  if (ps.length && Math.abs(soma - 100) > EPS) erros.push(`A soma dos percentuais deve ser 100% (atual: ${soma.toFixed(2)}%).`);
  if (!ps.some((p) => p.papel === 'titular')) erros.push('Defina um profissional titular.');
  return [...new Set(erros)];
}

export function validarCiencia(c: CienciaCliente | null): string[] {
  if (!c) return ['Registre a ciência do cliente antes de ativar o acordo.'];
  const e: string[] = [];
  if (!c.cliente?.trim()) e.push('Informe o cliente.');
  const doc = (c.documento || '').replace(/\D/g, '');
  if (doc.length !== 11 && doc.length !== 14) e.push('Documento do cliente deve ser CPF (11) ou CNPJ (14 dígitos).');
  if (!c.em || Number.isNaN(Date.parse(c.em))) e.push('Data da ciência inválida.');
  return e;
}

/** Divide um valor em centavos exatos (maiores restos). Soma == valor. */
export function calcularDivisao(participantes: Participante[], valorBrl: number): { id: string; nome: string; valorBrl: number }[] {
  const total = Math.round(Math.max(0, valorBrl) * 100);
  const brutos = participantes.map((p) => ({ p, exato: (total * p.percentual) / 100 }));
  const base = brutos.map((b) => Math.floor(b.exato));
  let resto = total - base.reduce((s, v) => s + v, 0);
  const ordem = brutos
    .map((b, i) => ({ i, frac: b.exato - Math.floor(b.exato) }))
    .sort((x, y) => y.frac - x.frac || x.i - y.i);
  for (const { i } of ordem) {
    if (resto <= 0) break;
    base[i] += 1;
    resto -= 1;
  }
  return brutos.map((b, i) => ({ id: b.p.id, nome: b.p.nome, valorBrl: base[i] / 100 }));
}

/** O que o selo protege (ordem estável; sem campos voláteis de UI). */
export function payloadSelo(a: AcordoParceria) {
  return {
    v: 1,
    id: a.id,
    tenantId: a.tenantId,
    titulo: a.titulo.trim(),
    classe: a.classe,
    participantes: [...a.participantes]
      .sort((x, y) => x.id.localeCompare(y.id))
      .map((p) => ({ id: p.id, registro: p.registro.trim().toUpperCase(), papel: p.papel, percentual: p.percentual })),
    ciencia: a.ciencia,
    plataformaParticipa: false,
  };
}

export class AcordoInvalido extends Error {
  readonly erros: string[];
  readonly httpStatus = 422;
  constructor(erros: string[]) {
    super(erros.join(' '));
    this.erros = erros;
  }
}

/** Rascunho → vigente. Exige acordo válido, ciência válida e selo. */
export function ativarAcordo(a: AcordoParceria, ciencia: CienciaCliente, selo: string): AcordoParceria {
  if (a.status !== 'rascunho') throw new AcordoInvalido([`Só rascunhos podem ser ativados (status: ${a.status}).`]);
  const erros = [...validarAcordo(a), ...validarCiencia(ciencia)];
  if (!/^[0-9a-f]{64}$/.test(selo)) erros.push('Selo SHA-256 inválido.');
  if (erros.length) throw new AcordoInvalido(erros);
  return { ...a, ciencia, selo, status: 'vigente' };
}

export function encerrarAcordo(a: AcordoParceria, em = new Date().toISOString()): AcordoParceria {
  if (a.status !== 'vigente') throw new AcordoInvalido(['Só acordos vigentes podem ser encerrados.']);
  return { ...a, status: 'encerrado', encerradoEm: em };
}
