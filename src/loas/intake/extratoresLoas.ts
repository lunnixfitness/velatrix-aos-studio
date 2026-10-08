/**
 * VELATRIX AOS · P28 · Esteira LOAS — Intake (estágio Captura)
 *
 * Extratores determinísticos (regex) sobre o TEXTO já obtido por OCR local
 * (src/documents/autos/ocrLocal.ts + qualidadeOcr.ts). Nenhuma chamada de rede aqui.
 *
 * Regra: campo com confiança < LIMIAR_CONFIANCA NÃO é assumido — vira pendência
 * de revisão humana. Nunca "chutar" valor.
 */

export const LIMIAR_CONFIANCA = 0.8;

export type TipoDocLoas = 'CADUNICO' | 'INDEFERIMENTO_INSS' | 'CNIS';

export interface CampoExtraido<T> {
  valor: T | null;
  confianca: number; // 0..1
  origem: string | null; // trecho do texto que sustentou a extração (auditoria)
}

export interface PendenciaRevisao {
  doc: TipoDocLoas;
  campo: string;
  motivo: 'NAO_ENCONTRADO' | 'BAIXA_CONFIANCA' | 'OCR_BAIXA_QUALIDADE' | 'INCONSISTENTE';
  detalhe?: string;
}

export interface MembroCadUnico {
  nome: string;
  cpf: string | null;
  parentescoTexto: string | null;
}

export interface DadosCadUnico {
  dataAtualizacao: CampoExtraido<string>; // AAAA-MM-DD
  codigoFamiliar: CampoExtraido<string>;
  membros: CampoExtraido<MembroCadUnico[]>;
}

export interface DadosIndeferimento {
  numeroNB: CampoExtraido<string>;
  dataDecisao: CampoExtraido<string>; // AAAA-MM-DD
  motivo: CampoExtraido<string>;
  especie: CampoExtraido<string>; // 87 (PcD) | 88 (idoso)
}

export interface BeneficioCnis {
  nb: string;
  especie: string;
  inicio: string | null; // AAAA-MM-DD
  fim: string | null;
}

export interface DadosCnis {
  vinculosAtivos: CampoExtraido<number>;
  beneficios: CampoExtraido<BeneficioCnis[]>;
}

export interface ResultadoExtracao<T> {
  tipo: TipoDocLoas;
  dados: T;
  pendencias: PendenciaRevisao[];
}

// ───────────────────────── utilitários ─────────────────────────

const VAZIO = <T>(): CampoExtraido<T> => ({ valor: null, confianca: 0, origem: null });

/** Normaliza texto de OCR: NFC, espaços, hifens tipográficos. */
export function normalizarTexto(t: string): string {
  return t
    .normalize('NFC')
    .replace(/[‐-―]/g, '-')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\r/g, '');
}

/** dd/mm/aaaa → aaaa-mm-dd, validando calendário. */
export function dataBrParaIso(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const [d, mo, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(a, mo - 1, d));
  if (dt.getUTCFullYear() !== a || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Valida CPF pelos dígitos verificadores. */
export function cpfValido(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

function pendenciasDeCampo(doc: TipoDocLoas, campo: string, c: CampoExtraido<unknown>): PendenciaRevisao[] {
  if (c.valor === null) return [{ doc, campo, motivo: 'NAO_ENCONTRADO' }];
  if (c.confianca < LIMIAR_CONFIANCA) {
    return [{ doc, campo, motivo: 'BAIXA_CONFIANCA', detalhe: `confiança ${c.confianca.toFixed(2)}` }];
  }
  return [];
}

/** Penaliza a confiança pela qualidade de OCR da página (0..1, vinda de qualidadeOcr). */
function ajustar(conf: number, qualidadeOcr: number): number {
  const q = Math.max(0, Math.min(1, qualidadeOcr));
  return Math.round(conf * (0.5 + 0.5 * q) * 100) / 100;
}

// ───────────────────────── CadÚnico ─────────────────────────

export function extrairCadUnico(textoBruto: string, qualidadeOcr = 1): ResultadoExtracao<DadosCadUnico> {
  const t = normalizarTexto(textoBruto);
  const dados: DadosCadUnico = { dataAtualizacao: VAZIO(), codigoFamiliar: VAZIO(), membros: VAZIO() };

  const mData = /(?:data\s+da\s+(?:última\s+)?atualiza[cç][aã]o|atualizado\s+em)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i.exec(t);
  if (mData) {
    const iso = dataBrParaIso(mData[1]);
    dados.dataAtualizacao = iso
      ? { valor: iso, confianca: ajustar(0.95, qualidadeOcr), origem: mData[0] }
      : { valor: null, confianca: 0, origem: mData[0] };
  }

  const mCod = /c[oó]digo\s+familiar\s*:?\s*([\d.\-\s]{8,20}\d)/i.exec(t);
  if (mCod) {
    const cod = mCod[1].replace(/\D/g, '');
    dados.codigoFamiliar = { valor: cod, confianca: ajustar(cod.length >= 10 ? 0.95 : 0.6, qualidadeOcr), origem: mCod[0] };
  }

  // Linhas de membro: "NOME COMPLETO ... CPF 000.000.000-00 ... Parentesco: FILHO(A)"
  const membros: MembroCadUnico[] = [];
  let somaConf = 0;
  const reMembro = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{4,80}?)\s+(?:CPF\s*:?\s*)?(\d{3}\.?\d{3}\.?\d{3}-?\d{2})?\s*(?:Parentesco\s*:?\s*([A-ZÁÉÍÓÚÇ()/ ]{3,40}))?$/gm;
  for (const m of t.matchAll(reMembro)) {
    const nome = m[1].trim();
    if (/CADASTRO|FAM[IÍ]LIA|COMPROVANTE|RESPONS[AÁ]VEL\s+FAMILIAR$/.test(nome)) continue;
    const cpf = m[2] ? m[2].replace(/\D/g, '') : null;
    let c = 0.7;
    if (cpf && cpfValido(cpf)) c += 0.2;
    if (m[3]) c += 0.1;
    somaConf += c;
    membros.push({ nome, cpf: cpf && cpfValido(cpf) ? cpf : null, parentescoTexto: m[3]?.trim() ?? null });
  }
  if (membros.length > 0) {
    dados.membros = {
      valor: membros,
      confianca: ajustar(Math.min(1, somaConf / membros.length), qualidadeOcr),
      origem: `${membros.length} linha(s) de membro`,
    };
  }

  const pendencias = [
    ...pendenciasDeCampo('CADUNICO', 'dataAtualizacao', dados.dataAtualizacao),
    ...pendenciasDeCampo('CADUNICO', 'codigoFamiliar', dados.codigoFamiliar),
    ...pendenciasDeCampo('CADUNICO', 'membros', dados.membros),
  ];
  if (qualidadeOcr < 0.5) pendencias.push({ doc: 'CADUNICO', campo: '*', motivo: 'OCR_BAIXA_QUALIDADE' });
  return { tipo: 'CADUNICO', dados, pendencias };
}

// ───────────────────────── Carta de indeferimento ─────────────────────────

export function extrairIndeferimento(textoBruto: string, qualidadeOcr = 1): ResultadoExtracao<DadosIndeferimento> {
  const t = normalizarTexto(textoBruto);
  const dados: DadosIndeferimento = { numeroNB: VAZIO(), dataDecisao: VAZIO(), motivo: VAZIO(), especie: VAZIO() };

  const mNb = /(?:NB|N[uú]mero\s+do\s+benef[ií]cio)\s*:?\s*(\d{3}\.?\d{3}\.?\d{3}-?\d)/i.exec(t);
  if (mNb) dados.numeroNB = { valor: mNb[1].replace(/\D/g, ''), confianca: ajustar(0.95, qualidadeOcr), origem: mNb[0] };

  const mData = /(?:data\s+da\s+decis[aã]o|em)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i.exec(t);
  if (mData) {
    const iso = dataBrParaIso(mData[1]);
    if (iso) dados.dataDecisao = { valor: iso, confianca: ajustar(/decis/i.test(mData[0]) ? 0.95 : 0.7, qualidadeOcr), origem: mData[0] };
  }

  const mEsp = /esp[eé]cie\s*:?\s*(8[78])\b/i.exec(t);
  if (mEsp) dados.especie = { valor: mEsp[1], confianca: ajustar(0.95, qualidadeOcr), origem: mEsp[0] };

  const mMot = /(?:motivo(?:\s+do\s+indeferimento)?|em\s+raz[aã]o\s+de)\s*:?\s*([^\n]{10,240})/i.exec(t);
  if (mMot) dados.motivo = { valor: mMot[1].trim().replace(/\.$/, ''), confianca: ajustar(0.85, qualidadeOcr), origem: mMot[0] };

  const pendencias = [
    ...pendenciasDeCampo('INDEFERIMENTO_INSS', 'numeroNB', dados.numeroNB),
    ...pendenciasDeCampo('INDEFERIMENTO_INSS', 'dataDecisao', dados.dataDecisao),
    ...pendenciasDeCampo('INDEFERIMENTO_INSS', 'motivo', dados.motivo),
  ];
  return { tipo: 'INDEFERIMENTO_INSS', dados, pendencias };
}

// ───────────────────────── CNIS ─────────────────────────

export function extrairCnis(textoBruto: string, qualidadeOcr = 1): ResultadoExtracao<DadosCnis> {
  const t = normalizarTexto(textoBruto);
  const dados: DadosCnis = { vinculosAtivos: VAZIO(), beneficios: VAZIO() };

  // Benefícios: "NB 123.456.789-0 Espécie 41 DIB 01/02/2020 DCB 01/02/2021"
  const beneficios: BeneficioCnis[] = [];
  const reBen = /NB\s*:?\s*(\d{3}\.?\d{3}\.?\d{3}-?\d)\s+Esp[eé]cie\s*:?\s*(\d{1,3})(?:\s+DIB\s*:?\s*(\d{2}\/\d{2}\/\d{4}))?(?:\s+DCB\s*:?\s*(\d{2}\/\d{2}\/\d{4}))?/gi;
  for (const m of t.matchAll(reBen)) {
    beneficios.push({
      nb: m[1].replace(/\D/g, ''),
      especie: m[2],
      inicio: m[3] ? dataBrParaIso(m[3]) : null,
      fim: m[4] ? dataBrParaIso(m[4]) : null,
    });
  }
  dados.beneficios = { valor: beneficios, confianca: ajustar(0.9, qualidadeOcr), origem: `${beneficios.length} benefício(s)` };

  // Vínculos: linhas com "Data Início" sem "Data Fim" contam como ativos.
  const reVinc = /V[ií]nculo[^\n]*?In[ií]cio\s*:?\s*(\d{2}\/\d{2}\/\d{4})(?:[^\n]*?Fim\s*:?\s*(\d{2}\/\d{2}\/\d{4}))?/gi;
  let total = 0, ativos = 0;
  for (const m of t.matchAll(reVinc)) { total++; if (!m[2]) ativos++; }
  dados.vinculosAtivos = total > 0
    ? { valor: ativos, confianca: ajustar(0.85, qualidadeOcr), origem: `${total} vínculo(s)` }
    : { valor: 0, confianca: ajustar(0.6, qualidadeOcr), origem: 'nenhum vínculo encontrado' };

  const pendencias = [...pendenciasDeCampo('CNIS', 'vinculosAtivos', dados.vinculosAtivos)];
  return { tipo: 'CNIS', dados, pendencias };
}

// ───────────────────────── política de envio a LLM ─────────────────────────

export interface PoliticaPrivacidadeTenant {
  zdrHabilitado: boolean; // Zero Data Retention contratado com o provedor
}

/**
 * Laudo médico é dado sensível (LGPD art. 11). Só pode sair do ambiente
 * para LLM externo se o tenant tiver ZDR contratado. Default: bloqueia.
 */
export function podeEnviarParaLlmExterno(tipoDoc: string, politica: PoliticaPrivacidadeTenant | undefined): boolean {
  const sensivel = /LAUDO|MEDIC|RECEITA|PRONTUARIO|SAUDE/i.test(tipoDoc);
  if (!sensivel) return true;
  return politica?.zdrHabilitado === true;
}
