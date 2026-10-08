/**
 * VELATRIX AOS · Leitura de documentos (P26a) — extração determinística.
 *
 * Varre o texto de cada página e devolve campos com a página e o trecho de
 * origem. Cada número com dígito verificador é validado: se a conta não
 * fecha, o campo vem marcado como inválido e gera alerta (erro de digitação
 * ou adulteração). Nada é inventado; campos ausentes simplesmente não aparecem.
 */
import type { PaginaTexto } from '../autos/autosCore';
import {
  soDigitos, validarCPF, validarCNPJ, formatarCNPJ, normalizarCNPJ, lerBoletoBancario, lerBoletoArrecadacao,
  lerChaveNFe, lerProcessoCNJ, lerPixCopiaCola, dataValida, type Boleto,
} from './validadores.ts';

export type TipoCampo =
  | 'boleto' | 'chave_nfe' | 'processo_cnj' | 'pix_copia_cola' | 'pix_e2e'
  | 'cnpj' | 'cpf' | 'oab' | 'valor' | 'data';

export const TIPO_CAMPO_LABEL: Record<TipoCampo, string> = {
  boleto: 'Linha digitável', chave_nfe: 'Chave de acesso', processo_cnj: 'Processo (CNJ)', pix_copia_cola: 'PIX copia e cola',
  pix_e2e: 'ID da transação PIX', cnpj: 'CNPJ', cpf: 'CPF', oab: 'OAB', valor: 'Valor', data: 'Data',
};

export interface Campo {
  tipo: TipoCampo;
  valor: string; // como exibir
  bruto: string; // como estava no documento
  valido: boolean | null; // null = sem dígito verificador
  pagina: number;
  trecho: string;
  detalhes?: Record<string, string | number | null | undefined>;
}

export type Severidade = 'alta' | 'media' | 'info';
export interface Alerta { severidade: Severidade; mensagem: string; pagina?: number }

export type TipoDocumento =
  | 'boleto' | 'guia_arrecadacao' | 'nfe' | 'nfse' | 'comprovante_pix' | 'procuracao' | 'contrato'
  | 'peca_processual' | 'documento';

export const TIPO_DOC_LABEL: Record<TipoDocumento, string> = {
  boleto: 'Boleto bancário', guia_arrecadacao: 'Guia de arrecadação', nfe: 'Nota fiscal eletrônica (NF-e)', nfse: 'Nota fiscal de serviço (NFS-e)',
  comprovante_pix: 'Comprovante PIX', procuracao: 'Procuração', contrato: 'Contrato', peca_processual: 'Peça processual', documento: 'Documento',
};

export interface ResultadoExtracao {
  tipo: TipoDocumento;
  confianca: 'alta' | 'media' | 'baixa';
  motivos: string[];
  campos: Campo[];
  alertas: Alerta[];
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ');
const dataBr = (iso: string) => iso.split('-').reverse().join('/');

function trechoEm(texto: string, ini: number, fim: number, margem = 60): string {
  const a = Math.max(0, ini - margem);
  const b = Math.min(texto.length, fim + margem);
  return `${a > 0 ? '…' : ''}${texto.slice(a, b).replace(/\s+/g, ' ').trim()}${b < texto.length ? '…' : ''}`;
}

/** Valores "R$ 1.234,56" → número. */
export const numeroBR = (s: string) => Number(s.replace(/[^\d,]/g, '').replace(',', '.'));

export function extrairCampos(paginas: PaginaTexto[], referencia = Date.now()): Campo[] {
  const campos: Campo[] = [];
  const vistos = new Set<string>();
  const add = (c: Campo) => {
    const k = `${c.tipo}:${c.valor}`;
    if (vistos.has(k)) return;
    vistos.add(k);
    campos.push(c);
  };

  for (const pg of paginas) {
    const t = pg.texto || '';
    let m: RegExpExecArray | null;

    // PIX copia-e-cola (antes das sequências numéricas; contém dígitos longos)
    // O BR Code costuma quebrar em várias linhas: procura no texto sem quebras.
    const compacto = t.replace(/[\r\n]+/g, '');
    const reBr = /000201[0-9A-Za-z .:/@\-_*]{20,}?6304[0-9A-Fa-f]{4}/g;
    while ((m = reBr.exec(compacto))) {
      const pix = lerPixCopiaCola(m[0]);
      add({ tipo: 'pix_copia_cola', valor: pix.chave ? `chave ${pix.chave}` : 'BR Code', bruto: m[0], valido: pix.valido, pagina: pg.n, trecho: trechoEm(compacto, m.index, m.index + m[0].length, 20), detalhes: { chave: pix.chave, valor: pix.valor != null ? brl(pix.valor) : undefined, recebedor: pix.nome, cidade: pix.cidade, txid: pix.txid } });
    }

    // ID fim a fim do PIX (E + ISPB 8 + AAAAMMDDHHmm + 11)
    const reE2E = /\bE\d{8}\d{12}[A-Za-z0-9]{11}\b/g;
    while ((m = reE2E.exec(t))) add({ tipo: 'pix_e2e', valor: m[0], bruto: m[0], valido: null, pagina: pg.n, trecho: trechoEm(t, m.index, m.index + m[0].length), detalhes: { ispb: m[0].slice(1, 9), dataHora: `${m[0].slice(15, 17)}/${m[0].slice(13, 15)}/${m[0].slice(9, 13)} ${m[0].slice(17, 19)}:${m[0].slice(19, 21)}` } });

    // Sequências numéricas longas: boleto (47/48) e chave NF-e (44)
    const reSeq = /\d[\d .\-]{38,70}\d/g;
    while ((m = reSeq.exec(t))) {
      const d = soDigitos(m[0]);
      const perto = semAcento(t.slice(Math.max(0, m.index - 80), m.index)).toUpperCase();
      const trecho = trechoEm(t, m.index, m.index + m[0].length, 30);
      if (d.length === 47) {
        const b = lerBoletoBancario(d, referencia);
        add(campoBoleto(b, m[0], pg.n, trecho));
      } else if (d.length === 48 && d[0] === '8') {
        const b = lerBoletoArrecadacao(d);
        add(campoBoleto(b, m[0], pg.n, trecho));
      } else if (d.length === 44) {
        const n = lerChaveNFe(d);
        if (n.valido || /CHAVE|ACESSO|DANFE|NF-?E/.test(perto)) {
          add({ tipo: 'chave_nfe', valor: d.replace(/(\d{4})(?=\d)/g, '$1 '), bruto: m[0], valido: n.valido, pagina: pg.n, trecho, detalhes: { modelo: n.modelo, uf: n.uf, emissao: n.anoMes, emitente: n.emitente ? formatarCNPJ(n.emitente) : undefined, serie: n.serie, numero: n.numero, falhas: n.falhas.join(' ') || undefined } });
        }
      }
    }

    // Processo CNJ
    const reCnj = /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g;
    while ((m = reCnj.exec(t))) {
      const p = lerProcessoCNJ(m[0]);
      add({ tipo: 'processo_cnj', valor: p.numero, bruto: m[0], valido: p.valido, pagina: pg.n, trecho: trechoEm(t, m.index, m.index + m[0].length), detalhes: { ano: p.ano, segmento: p.segmento, tribunal: p.tribunal, origem: p.origem } });
    }

    // CNPJ (numérico ou alfanumérico, formatado) e CPF formatado
    const reCnpj = /\b[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/[0-9A-Z]{4}-\d{2}\b/g;
    while ((m = reCnpj.exec(t))) add({ tipo: 'cnpj', valor: formatarCNPJ(m[0]), bruto: m[0], valido: validarCNPJ(m[0]), pagina: pg.n, trecho: trechoEm(t, m.index, m.index + m[0].length), detalhes: { alfanumerico: /[A-Z]/.test(normalizarCNPJ(m[0]).slice(0, 12)) ? 'sim' : undefined } });
    const reCpf = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
    while ((m = reCpf.exec(t))) add({ tipo: 'cpf', valor: m[0], bruto: m[0], valido: validarCPF(m[0]), pagina: pg.n, trecho: trechoEm(t, m.index, m.index + m[0].length) });

    // OAB
    const reOab = /\bOAB\s*\/?\s*([A-Z]{2})\s*(?:n[º°o.]\s*)?(\d{1,3}(?:\.\d{3})|\d{1,6})(?:-?[A-Z])?\b/gi;
    while ((m = reOab.exec(t))) add({ tipo: 'oab', valor: `OAB/${m[1].toUpperCase()} ${m[2]}`, bruto: m[0], valido: null, pagina: pg.n, trecho: trechoEm(t, m.index, m.index + m[0].length), detalhes: { uf: m[1].toUpperCase() } });

    // Valores e datas
    const reVal = /R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g;
    while ((m = reVal.exec(t))) add({ tipo: 'valor', valor: brl(numeroBR(m[0])), bruto: m[0], valido: null, pagina: pg.n, trecho: trechoEm(t, m.index, m.index + m[0].length, 40) });
    const reData = /\b(\d{2})\/(\d{2})\/(\d{4})\b/g;
    while ((m = reData.exec(t))) {
      if (!dataValida(m[1], m[2], m[3])) continue;
      add({ tipo: 'data', valor: m[0], bruto: m[0], valido: null, pagina: pg.n, trecho: trechoEm(t, m.index, m.index + m[0].length, 40) });
    }
  }
  return campos;
}

function campoBoleto(b: Boleto, bruto: string, pagina: number, trecho: string): Campo {
  return {
    tipo: 'boleto', valor: b.linhaDigitavel, bruto, valido: b.valido, pagina, trecho,
    detalhes: {
      modalidade: b.tipo === 'bancario' ? 'Bancário' : 'Arrecadação/convênio', banco: b.banco,
      valor: b.valor != null ? brl(b.valor) : undefined, vencimento: b.vencimento ? dataBr(b.vencimento) : undefined,
      falhas: b.falhas.join(' ') || undefined,
    },
  };
}

export function classificarDocumento(paginas: PaginaTexto[], campos: Campo[]): Pick<ResultadoExtracao, 'tipo' | 'confianca' | 'motivos'> {
  const t = semAcento(paginas.slice(0, 3).map((p) => p.texto).join('\n')).toUpperCase();
  const tem = (tipo: TipoCampo) => campos.some((c) => c.tipo === tipo);
  const regras: [TipoDocumento, boolean, string][] = [
    ['guia_arrecadacao', campos.some((c) => c.tipo === 'boleto' && c.detalhes?.modalidade !== 'Bancário'), 'linha digitável de arrecadação'],
    ['boleto', campos.some((c) => c.tipo === 'boleto' && c.detalhes?.modalidade === 'Bancário'), 'linha digitável bancária'],
    ['nfe', tem('chave_nfe') && /DANFE|NOTA FISCAL ELETRONICA/.test(t), 'chave de acesso + DANFE'],
    ['nfse', /NFS-?E|NOTA FISCAL DE SERVICOS?( ELETRONICA)?/.test(t), 'cabeçalho de NFS-e'],
    ['comprovante_pix', (tem('pix_e2e') || tem('pix_copia_cola')) && /\bPIX\b/.test(t), 'identificador de transação PIX'],
    ['procuracao', /\bPROCURACAO\b|\bSUBSTABELECIMENTO\b/.test(t), 'título de procuração'],
    ['contrato', /\bCONTRATO\b|\bCONTRATANTE\b/.test(t), 'termos contratuais'],
    ['peca_processual', tem('processo_cnj') || /EXCELENTISSIM|MERITISSIM/.test(t), 'número CNJ ou endereçamento ao juízo'],
  ];
  const hit = regras.find(([, ok]) => ok);
  if (!hit) return { tipo: 'documento', confianca: 'baixa', motivos: ['sem marcadores conhecidos'] };
  const outros = regras.filter(([tp, ok]) => ok && tp !== hit[0]).length;
  return { tipo: hit[0], confianca: outros ? 'media' : 'alta', motivos: [hit[2]] };
}

export function gerarAlertas(tipo: TipoDocumento, campos: Campo[], referencia = Date.now()): Alerta[] {
  const alertas: Alerta[] = [];
  for (const c of campos) {
    if (c.valido === false) {
      alertas.push({ severidade: 'alta', pagina: c.pagina, mensagem: `${TIPO_CAMPO_LABEL[c.tipo]} ${c.valor} não passa na validação${c.detalhes?.falhas ? ` (${c.detalhes.falhas})` : ''} — possível erro de digitação ou adulteração.` });
    }
  }
  // Boleto: valor do código de barras deve aparecer impresso no documento
  for (const b of campos.filter((c) => c.tipo === 'boleto' && c.valido)) {
    const vb = b.detalhes?.valor as string | undefined;
    const impressos = campos.filter((c) => c.tipo === 'valor').map((c) => c.valor);
    if (vb && impressos.length && !impressos.includes(vb)) {
      alertas.push({ severidade: 'alta', pagina: b.pagina, mensagem: `Valor do código de barras (${vb}) não aparece impresso no boleto (${[...new Set(impressos)].slice(0, 3).join(', ')}). Confira antes de pagar.` });
    }
    const venc = b.detalhes?.vencimento as string | undefined;
    if (venc) {
      const [d, m, a] = venc.split('/').map(Number);
      if (Date.UTC(a, m - 1, d) < referencia - 86400000) alertas.push({ severidade: 'media', pagina: b.pagina, mensagem: `Boleto vencido em ${venc}.` });
    }
  }
  if (tipo === 'boleto' && !campos.some((c) => c.tipo === 'cnpj' || c.tipo === 'cpf')) {
    alertas.push({ severidade: 'media', mensagem: 'Boleto sem CNPJ/CPF do beneficiário identificável no texto.' });
  }
  if (!campos.length) alertas.push({ severidade: 'info', mensagem: 'Nenhum campo reconhecido. Se for foto ou digitalização, a leitura por OCR entra na próxima fase.' });
  return alertas;
}

export function extrairDocumento(paginas: PaginaTexto[], referencia = Date.now()): ResultadoExtracao {
  const campos = extrairCampos(paginas, referencia);
  const cls = classificarDocumento(paginas, campos);
  return { ...cls, campos, alertas: gerarAlertas(cls.tipo, campos, referencia) };
}
