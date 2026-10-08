/**
 * VELATRIX AOS · Leitura de documentos (P26a) — validadores de dígito verificador.
 * Puro e determinístico: nenhum campo é "aceito" sem a conta fechar.
 */

export const soDigitos = (s: string) => s.replace(/\D/g, '');

// ───────────── CPF / CNPJ (inclui CNPJ alfanumérico, IN RFB 2.229/2024) ─────────────

export function validarCPF(v: string): boolean {
  const d = soDigitos(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

/** Valor do caractere no cálculo do CNPJ: código ASCII − 48 (0–9 → 0–9, A → 17…). */
const valorCnpj = (c: string) => c.charCodeAt(0) - 48;

export function normalizarCNPJ(v: string): string {
  return v.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

export function validarCNPJ(v: string): boolean {
  const c = normalizarCNPJ(v);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(\d)\1{13}$/.test(c)) return false;
  const dv = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let s = 0;
    for (let i = 0; i < n; i++) s += valorCnpj(c[i]) * pesos[i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(c[12]) && dv(13) === Number(c[13]);
}

export const formatarCNPJ = (c: string) => {
  const n = normalizarCNPJ(c);
  return n.length === 14 ? `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}` : c;
};

// ───────────── módulos 10 / 11 ─────────────

export function mod10(num: string): number {
  let s = 0;
  let peso = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    let p = Number(num[i]) * peso;
    if (p > 9) p = Math.floor(p / 10) + (p % 10);
    s += p;
    peso = peso === 2 ? 1 : 2;
  }
  return (10 - (s % 10)) % 10;
}

/** Módulo 11 com pesos 2..9 da direita para a esquerda; devolve o resto. */
export function resto11(num: string): number {
  let s = 0;
  let peso = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    s += Number(num[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  return s % 11;
}

// ───────────── boleto bancário (47) e arrecadação/convênio (48) ─────────────

export interface Boleto {
  tipo: 'bancario' | 'arrecadacao';
  linhaDigitavel: string;
  codigoBarras: string;
  valido: boolean;
  falhas: string[];
  banco?: string;
  valor: number | null; // R$
  vencimento: string | null; // ISO yyyy-mm-dd
}

/** Código de barras bancário (44) a partir da linha digitável (47). */
export function barrasDeLinhaBancaria(l: string): string {
  return l.slice(0, 4) + l[32] + l.slice(33, 47) + l.slice(4, 9) + l.slice(10, 20) + l.slice(21, 31);
}

export function dvGeralBancario(barras44: string): number {
  const base = barras44.slice(0, 4) + barras44.slice(5);
  const dv = 11 - resto11(base);
  return dv === 0 || dv === 10 || dv === 11 ? 1 : dv;
}

const BASE_ANTIGA = Date.UTC(1997, 9, 7); // fator 0 = 07/10/1997
const BASE_NOVA = Date.UTC(2025, 1, 22); // fator 1000 = 22/02/2025 (reinício FEBRABAN)
const DIA = 86400000;

/** Fator de vencimento → data. Após o reinício de 2025 há duas leituras; vence a mais próxima da referência. */
export function dataDoFator(fator: number, referencia = Date.now()): string | null {
  if (!fator) return null;
  const candidatas = [BASE_ANTIGA + fator * DIA];
  if (fator >= 1000) candidatas.push(BASE_NOVA + (fator - 1000) * DIA);
  const melhor = candidatas.sort((a, b) => Math.abs(a - referencia) - Math.abs(b - referencia))[0];
  return new Date(melhor).toISOString().slice(0, 10);
}

export function lerBoletoBancario(linha: string, referencia = Date.now()): Boleto {
  const l = soDigitos(linha);
  const falhas: string[] = [];
  if (l.length !== 47) return { tipo: 'bancario', linhaDigitavel: l, codigoBarras: '', valido: false, falhas: ['Linha digitável deve ter 47 dígitos.'], valor: null, vencimento: null };
  if (mod10(l.slice(0, 9)) !== Number(l[9])) falhas.push('DV do campo 1 não confere.');
  if (mod10(l.slice(10, 20)) !== Number(l[20])) falhas.push('DV do campo 2 não confere.');
  if (mod10(l.slice(21, 31)) !== Number(l[31])) falhas.push('DV do campo 3 não confere.');
  const barras = barrasDeLinhaBancaria(l);
  if (dvGeralBancario(barras) !== Number(barras[4])) falhas.push('DV geral do código de barras não confere.');
  const fator = Number(barras.slice(5, 9));
  const valor = Number(barras.slice(9, 19)) / 100;
  return {
    tipo: 'bancario', linhaDigitavel: l, codigoBarras: barras, valido: falhas.length === 0, falhas,
    banco: barras.slice(0, 3), valor: valor || null, vencimento: dataDoFator(fator, referencia),
  };
}

export function lerBoletoArrecadacao(linha: string): Boleto {
  const l = soDigitos(linha);
  const falhas: string[] = [];
  if (l.length !== 48 || l[0] !== '8') return { tipo: 'arrecadacao', linhaDigitavel: l, codigoBarras: '', valido: false, falhas: ['Guia de arrecadação deve ter 48 dígitos e começar com 8.'], valor: null, vencimento: null };
  const idValor = l[2];
  const usa10 = idValor === '6' || idValor === '7';
  const dvBloco = (b: string) => (usa10 ? mod10(b) : (() => { const d = 11 - resto11(b); return d >= 10 ? 0 : d; })());
  let barras = '';
  for (let i = 0; i < 4; i++) {
    const bloco = l.slice(i * 12, i * 12 + 11);
    if (dvBloco(bloco) !== Number(l[i * 12 + 11])) falhas.push(`DV do bloco ${i + 1} não confere.`);
    barras += bloco;
  }
  const semDv = barras.slice(0, 3) + barras.slice(4);
  if (dvBloco(semDv) !== Number(barras[3])) falhas.push('DV geral da guia não confere.');
  const valor = idValor === '6' || idValor === '8' ? Number(barras.slice(4, 15)) / 100 : null;
  return { tipo: 'arrecadacao', linhaDigitavel: l, codigoBarras: barras, valido: falhas.length === 0, falhas, valor: valor || null, vencimento: null };
}

// ───────────── NF-e / NFC-e / CT-e: chave de acesso (44) ─────────────

export const UF_IBGE: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
  '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};

const MODELO: Record<string, string> = { '55': 'NF-e', '65': 'NFC-e', '57': 'CT-e', '58': 'MDF-e', '67': 'CT-e OS' };

export interface ChaveNFe {
  chave: string;
  valido: boolean;
  falhas: string[];
  uf?: string;
  anoMes?: string;
  emitente?: string; // CNPJ/CPF
  emitenteValido?: boolean;
  modelo?: string;
  serie?: string;
  numero?: string;
}

export const dvChaveNFe = (c43: string) => { const r = resto11(c43); return r < 2 ? 0 : 11 - r; };

export function lerChaveNFe(v: string): ChaveNFe {
  const c = soDigitos(v);
  const falhas: string[] = [];
  if (c.length !== 44) return { chave: c, valido: false, falhas: ['Chave de acesso deve ter 44 dígitos.'] };
  if (dvChaveNFe(c.slice(0, 43)) !== Number(c[43])) falhas.push('DV da chave de acesso não confere.');
  const uf = UF_IBGE[c.slice(0, 2)];
  if (!uf) falhas.push('Código de UF inválido.');
  const mes = Number(c.slice(4, 6));
  if (mes < 1 || mes > 12) falhas.push('Mês de emissão inválido.');
  const emit = c.slice(6, 20);
  const emitenteValido = validarCNPJ(emit) || validarCPF(emit.slice(3));
  if (!emitenteValido) falhas.push('CNPJ/CPF do emitente inválido.');
  return {
    chave: c, valido: falhas.length === 0, falhas, uf, anoMes: `20${c.slice(2, 4)}-${c.slice(4, 6)}`,
    emitente: emit, emitenteValido, modelo: MODELO[c.slice(20, 22)] || `modelo ${c.slice(20, 22)}`,
    serie: String(Number(c.slice(22, 25))), numero: String(Number(c.slice(25, 34))),
  };
}

// ───────────── número de processo CNJ (Res. 65/2008) ─────────────

export const SEGMENTO_JUSTICA: Record<string, string> = {
  '1': 'STF', '2': 'CNJ', '3': 'STJ', '4': 'Justiça Federal', '5': 'Justiça do Trabalho',
  '6': 'Justiça Eleitoral', '7': 'Justiça Militar da União', '8': 'Justiça Estadual', '9': 'Justiça Militar Estadual',
};

export function dvCNJ(n7: string, ano: string, j: string, tr: string, orig: string): string {
  const r = BigInt(`${n7}${ano}${j}${tr}${orig}00`) % 97n;
  return String(98n - r).padStart(2, '0');
}

export interface ProcessoCNJ { numero: string; valido: boolean; ano?: string; segmento?: string; tribunal?: string; origem?: string }

export function lerProcessoCNJ(v: string): ProcessoCNJ {
  const m = v.match(/(\d{7})-?(\d{2})\.?(\d{4})\.?(\d)\.?(\d{2})\.?(\d{4})/);
  if (!m) return { numero: v, valido: false };
  const [, n, dd, ano, j, tr, orig] = m;
  return {
    numero: `${n}-${dd}.${ano}.${j}.${tr}.${orig}`,
    valido: dvCNJ(n, ano, j, tr, orig) === dd,
    ano, segmento: SEGMENTO_JUSTICA[j], tribunal: tr, origem: orig,
  };
}

// ───────────── PIX copia-e-cola (BR Code, EMV) ─────────────

export function crc16Ccitt(s: string): string {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let k = 0; k < 8; k++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(s: string): Map<string, string> {
  const m = new Map<string, string>();
  let i = 0;
  while (i + 4 <= s.length) {
    const id = s.slice(i, i + 2);
    const len = Number(s.slice(i + 2, i + 4));
    if (!Number.isFinite(len)) break;
    m.set(id, s.slice(i + 4, i + 4 + len));
    i += 4 + len;
  }
  return m;
}

export interface PixCopiaCola { payload: string; valido: boolean; chave?: string; valor?: number; nome?: string; cidade?: string; txid?: string }

export function lerPixCopiaCola(payload: string): PixCopiaCola {
  const p = payload.trim();
  const i = p.lastIndexOf('6304');
  if (!p.startsWith('000201') || i < 0 || p.length !== i + 8) return { payload: p, valido: false };
  const valido = crc16Ccitt(p.slice(0, i + 4)) === p.slice(i + 4).toUpperCase();
  const t = tlv(p.slice(0, i));
  const conta = tlv(t.get('26') || '');
  const adic = tlv(t.get('62') || '');
  return {
    payload: p, valido, chave: conta.get('01'), valor: t.get('54') ? Number(t.get('54')) : undefined,
    nome: t.get('59'), cidade: t.get('60'), txid: adic.get('05'),
  };
}

/** Data dd/mm/aaaa existente no calendário? */
export function dataValida(dd: string, mm: string, aaaa: string): boolean {
  const d = new Date(Date.UTC(Number(aaaa), Number(mm) - 1, Number(dd)));
  return d.getUTCFullYear() === Number(aaaa) && d.getUTCMonth() === Number(mm) - 1 && d.getUTCDate() === Number(dd);
}
