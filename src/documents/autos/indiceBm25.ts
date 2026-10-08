/**
 * VELATRIX AOS · Leitura de Autos (P25) — índice léxico BM25 com citação.
 *
 * Busca determinística (sem IA) sobre os blocos dos autos: toda resposta traz
 * as páginas de origem. É a base do "pergunte aos autos" e o filtro que
 * seleciona o contexto enviado ao LLM na P26 (menos tokens, mais precisão).
 * 500 páginas ≈ 1–2 mil blocos: indexa em milissegundos no navegador.
 */
import type { Bloco } from './autosCore';

const STOP = new Set(
  ('a o e os as de da do das dos em no na nos nas um uma uns umas por para com sem que se ao aos à às ' +
    'é ser foi são como mais mas ou pelo pela pelos pelas seu sua seus suas este esta isso essa esse ' +
    'nao não já há ha tem ter sobre entre até ate quando onde qual quais qualquer houve foram sido ' +
    'fls folhas pág pag página pagina num').split(/\s+/),
);

export function tokenizar(t: string): string[] {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/(\d)[.](?=\d{3}\b)/g, '$1') // 1.250.000 → 1250000
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** Radical simples em PT (plural/gênero), suficiente para busca jurídica. */
const radical = (w: string) => {
  if (/^\d+$/.test(w)) return w;
  let r = w.replace(/(oes|aes|ais|eis|is|es|s)$/, '');
  if (r.length > 5) r = r.replace(/(ando|endo|indo|ado|ada|ido|ida|ou|ar|er|ir)$/, '');
  return r.replace(/(a|o|e)$/, '');
};

export interface Resultado {
  bloco: Bloco;
  score: number;
  trecho: string;
  termos: string[];
}

export class IndiceBm25 {
  private readonly postings = new Map<string, { i: number; tf: number }[]>();
  private readonly tamanhos: number[] = [];
  private readonly media: number;
  private readonly blocos: Bloco[];
  private readonly k1: number;
  private readonly b: number;

  constructor(blocos: Bloco[], k1 = 1.2, b = 0.75) {
    this.blocos = blocos;
    this.k1 = k1;
    this.b = b;
    blocos.forEach((bl, i) => {
      const toks = tokenizar(bl.texto).map(radical);
      this.tamanhos[i] = toks.length;
      const tf = new Map<string, number>();
      for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
      for (const [t, f] of tf) {
        let lista = this.postings.get(t);
        if (!lista) this.postings.set(t, (lista = []));
        lista.push({ i, tf: f });
      }
    });
    this.media = this.tamanhos.reduce((s, n) => s + n, 0) / Math.max(1, blocos.length);
  }

  get tamanho() { return this.blocos.length; }

  buscar(consulta: string, limite = 8): Resultado[] {
    const termosOriginais = [...new Set(tokenizar(consulta))];
    const termos = [...new Set(termosOriginais.map(radical))];
    if (!termos.length || !this.blocos.length) return [];
    const N = this.blocos.length;
    const scores = new Map<number, number>();
    for (const t of termos) {
      const lista = this.postings.get(t);
      if (!lista) continue;
      const idf = Math.log(1 + (N - lista.length + 0.5) / (lista.length + 0.5));
      for (const { i, tf } of lista) {
        const norm = tf * (this.k1 + 1) / (tf + this.k1 * (1 - this.b + this.b * (this.tamanhos[i] / (this.media || 1))));
        scores.set(i, (scores.get(i) || 0) + idf * norm);
      }
    }
    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, limite)
      .map(([i, score]) => ({ bloco: this.blocos[i], score: Number(score.toFixed(4)), trecho: trecho(this.blocos[i].texto, termos), termos: termosOriginais }));
  }
}

/**
 * Janela de ~320 caracteres centrada no trecho com MAIS termos distintos da
 * consulta (e, no empate, mais ocorrências). Cada ocorrência é candidata a
 * início de janela — o termo buscado sempre aparece no trecho exibido.
 */
export function trecho(texto: string, termosRadicais: string[], janela = 320): string {
  const norm = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const termos = termosRadicais.filter((t) => t.length > 1);
  const hits: { pos: number; termo: string }[] = [];
  for (const t of termos) {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(norm)) && hits.length < 2000) hits.push({ pos: m.index, termo: t });
  }
  if (!hits.length) {
    const fim = Math.min(texto.length, janela);
    return `${texto.slice(0, fim).trim()}${fim < texto.length ? '…' : ''}`;
  }
  hits.sort((x, y) => x.pos - y.pos);
  let melhorIni = hits[0].pos;
  let melhor = [-1, -1];
  for (const h of hits) {
    const ini = Math.max(0, h.pos - 60);
    const dentro = hits.filter((x) => x.pos >= ini && x.pos < ini + janela - 20);
    const score = [new Set(dentro.map((x) => x.termo)).size, dentro.length];
    if (score[0] > melhor[0] || (score[0] === melhor[0] && score[1] > melhor[1])) { melhor = score; melhorIni = ini; }
  }
  // Recua até o início de uma palavra para não cortar no meio.
  let ini = melhorIni;
  while (ini > 0 && /\S/.test(texto[ini - 1]) && melhorIni - ini < 20) ini--;
  const fim = Math.min(texto.length, ini + janela);
  return `${ini > 0 ? '…' : ''}${texto.slice(ini, fim).trim()}${fim < texto.length ? '…' : ''}`;
}

/** Divide o trecho em partes para destacar termos na UI (sem HTML cru). */
export function partesDestacadas(texto: string, termos: string[]): { t: string; hit: boolean }[] {
  if (!termos.length) return [{ t: texto, hit: false }];
  const norm = texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const marcas: boolean[] = new Array(texto.length).fill(false);
  for (const termo of termos.map((x) => radical(x)).filter((x) => x.length > 2)) {
    let i = norm.indexOf(termo);
    while (i >= 0) {
      const inicioPalavra = i === 0 || !/[a-z0-9]/.test(norm[i - 1]);
      let k = i;
      while (k < norm.length && /[a-z0-9]/.test(norm[k])) k++; // marca a palavra inteira
      if (inicioPalavra) for (let j = i; j < k; j++) marcas[j] = true;
      i = norm.indexOf(termo, Math.max(k, i + 1));
    }
  }
  const out: { t: string; hit: boolean }[] = [];
  for (let i = 0; i < texto.length; i++) {
    const last = out[out.length - 1];
    if (last && last.hit === marcas[i]) last.t += texto[i];
    else out.push({ t: texto[i], hit: marcas[i] });
  }
  return out;
}
