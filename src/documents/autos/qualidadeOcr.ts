/**
 * VELATRIX AOS · Leitura de Autos (P28) — o OCR local ficou bom o bastante?
 *
 * Decide se o texto do Tesseract (navegador, zero token) é aceito ou se a página vai
 * para o Gemini como plano B. Puro: sem IO, testável.
 *
 * Sinais de OCR ruim (carimbo, manuscrito, digitalização torta ou borrada):
 * - confiança média do Tesseract baixa;
 * - pouco texto útil;
 * - muita "sujeira": palavras sem vogal, símbolos soltos, tokens de 1 caractere.
 */

export interface AvaliacaoOcr {
  aceito: boolean;
  motivo: 'ok' | 'confianca_baixa' | 'pouco_texto' | 'texto_ruidoso';
  /** Fração (0–1) de palavras que parecem palavras reais em PT-BR ou números. */
  palavrasValidas: number;
}

export const OCR_CONFIANCA_MIN = 70;
export const OCR_CHARS_MIN = 40;
export const OCR_PALAVRAS_VALIDAS_MIN = 0.6;

const RE_PALAVRA = /^\p{L}+$/u;
const RE_VOGAL = /[aeiouáéíóúâêôãõàü]/i;
const RE_NUMERO = /^(R\$)?[\d.,/ºª°%$-]+$/;
/** Pontuação isolada (—, §, -) não conta nem a favor nem contra. */
const RE_SO_PONTUACAO = /^[\p{P}\p{S}]+$/u;
/** Palavra plausível: tem vogal (ou é sigla curta: "RS", "SP"), e 1 letra só se for vogal ("o", "a", "é"). */
const palavraPlausivel = (t: string) =>
  RE_PALAVRA.test(t) && (t.length === 1 ? RE_VOGAL.test(t) : RE_VOGAL.test(t) || t.length <= 3);

export function avaliarOcr(texto: string, confianca: number): AvaliacaoOcr {
  const util = texto.replace(/\s+/g, '');
  const tokens = texto.split(/\s+/)
    .map((t) => t.replace(/^[("'“‘[]+|[)"'”’\].,;:!?]+$/g, ''))
    .filter((t) => t && !(RE_SO_PONTUACAO.test(t) && t !== 'R$'));
  const validos = tokens.filter((t) => RE_NUMERO.test(t) || palavraPlausivel(t)).length;
  const palavrasValidas = tokens.length ? validos / tokens.length : 0;
  if (util.length < OCR_CHARS_MIN) return { aceito: false, motivo: 'pouco_texto', palavrasValidas };
  if (confianca < OCR_CONFIANCA_MIN) return { aceito: false, motivo: 'confianca_baixa', palavrasValidas };
  if (palavrasValidas < OCR_PALAVRAS_VALIDAS_MIN) return { aceito: false, motivo: 'texto_ruidoso', palavrasValidas };
  return { aceito: true, motivo: 'ok', palavrasValidas };
}

/**
 * Tokens que o Gemini gastaria nesta página: imagem A4 a ~150 dpi ≈ 6 blocos de 258 tokens
 * (~1.550) + o texto de saída (≈ 4 caracteres/token). Estimativa, exibida como tal.
 */
export const tokensOcrGeminiEstimados = (texto: string) => 1550 + Math.ceil(texto.length / 4);
