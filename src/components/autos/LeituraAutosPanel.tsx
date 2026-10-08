import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileSearch, Upload, Search, ChevronLeft, ChevronRight, ShieldCheck, ScanLine, FileText, X, Loader2 } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { triarPaginas, segmentarPecas, gerarBlocos, paginasLimpas, TIPO_PECA_LABEL, type Bloco, type PaginaTexto, type Peca, type TriagemPagina } from '../../documents/autos/autosCore';
import { IndiceBm25, partesDestacadas, type Resultado } from '../../documents/autos/indiceBm25';
import { lerPdf, liberarPdf, renderizarPagina, LIMITE_BYTES, type ProgressoLeitura } from '../../documents/autos/leitorPdf';
import { ExtracaoIaPanel } from './ExtracaoIaPanel';

/**
 * Leitura de Autos (P25) — autos de centenas de páginas, lidos no navegador,
 * separados em peças e pesquisáveis com citação de página. Sem IA nesta fase:
 * toda resposta é um trecho literal dos autos, com a página de origem.
 */

const card = 'rounded-2xl border border-hairline bg-surface';
const rot = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute';
const btnSec = 'inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 h-9 text-[13px] text-ink-2 hover:border-hairline-strong disabled:opacity-40';

interface Autos {
  doc: PDFDocumentProxy;
  nome: string;
  hash: string;
  tamanho: number;
  msLeitura: number;
  msIndice: number;
  total: number;
  triagem: TriagemPagina[];
  pecas: Peca[];
  indice: IndiceBm25;
  blocos: number;
  /** P26b: páginas originais, blocos, texto limpo por página e textos vindos do OCR. */
  paginas: PaginaTexto[];
  blocosLista: Bloco[];
  limpas: Map<number, string>;
  ocr: Map<number, string>;
}

/** Blocos + índice + texto limpo por página (refeito quando o OCR traz texto novo). */
function indexar(paginas: PaginaTexto[], pecas: Peca[]) {
  const limpasArr = paginasLimpas(paginas); // índice sem cabeçalhos/rodapés repetidos
  const blocosLista = gerarBlocos(limpasArr, pecas);
  return { blocosLista, indice: new IndiceBm25(blocosLista), limpas: new Map(limpasArr.map((p) => [p.n, p.texto] as [number, string])) };
}

const Visualizador: React.FC<{ doc: PDFDocumentProxy; pagina: number; total: number; onIr: (n: number) => void; onFechar: () => void }> = ({ doc, pagina, total, onIr, onFechar }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const caixaRef = useRef<HTMLDivElement>(null);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let cancelar: (() => void) | undefined;
    let vivo = true;
    setCarregando(true);
    const largura = Math.min(760, (caixaRef.current?.clientWidth || 600) - 16);
    renderizarPagina(doc, pagina, canvasRef.current!, largura)
      .then((c) => { cancelar = c; })
      .catch(() => { /* render cancelado ao trocar de página */ })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; cancelar?.(); };
  }, [doc, pagina]);
  return (
    <div className={`${card} p-4`} ref={caixaRef}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[13px] font-semibold text-ink">Página {pagina} de {total}</div>
        <div className="flex gap-1.5">
          <button type="button" className={btnSec} disabled={pagina <= 1} onClick={() => onIr(pagina - 1)}><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" className={btnSec} disabled={pagina >= total} onClick={() => onIr(pagina + 1)}><ChevronRight className="h-4 w-4" /></button>
          <button type="button" className={btnSec} onClick={onFechar}><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="relative flex justify-center overflow-auto rounded-lg bg-canvas p-2">
        {carregando && <Loader2 className="absolute top-6 h-5 w-5 animate-spin text-ink-mute" />}
        <canvas ref={canvasRef} className="shadow-sm" />
      </div>
    </div>
  );
};

export const LeituraAutosPanel: React.FC = () => {
  const [autos, setAutos] = useState<Autos | null>(null);
  const [prog, setProg] = useState<ProgressoLeitura | null>(null);
  const [etapa, setEtapa] = useState<string>('');
  const [erro, setErro] = useState<string | null>(null);
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [pagina, setPagina] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Libera o PDF anterior quando os autos mudam; cancela leitura só ao desmontar.
  // Chaveado no documento (não no objeto autos): o OCR atualiza autos sem destruir o PDF aberto.
  const docAtual = autos?.doc;
  useEffect(() => () => { if (docAtual) void liberarPdf(docAtual); }, [docAtual]);

  const aplicarOcr = useCallback((novos: Map<number, string>) => {
    setAutos((a) => {
      if (!a || !novos.size) return a;
      const ocr = new Map([...a.ocr, ...novos]);
      const paginas = a.paginas.map((p) => (ocr.has(p.n) ? { ...p, texto: ocr.get(p.n)! } : p));
      const ix = indexar(paginas, a.pecas);
      return { ...a, ocr, paginas, indice: ix.indice, blocosLista: ix.blocosLista, blocos: ix.blocosLista.length, limpas: ix.limpas };
    });
  }, []);
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const processar = useCallback(async (arquivo: File) => {
    setErro(null); setResultados(null); setPagina(null); setConsulta('');
    if (!/\.pdf$/i.test(arquivo.name) && arquivo.type !== 'application/pdf') { setErro('Envie um arquivo PDF.'); return; }
    if (arquivo.size > LIMITE_BYTES) { setErro('Arquivo acima de 200 MB.'); return; }
    setAutos(null); // o efeito acima destrói o documento anterior
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      setEtapa('Lendo páginas');
      const r = await lerPdf(arquivo, { onProgresso: setProg, sinal: ac.signal });
      setEtapa('Separando peças e indexando');
      await new Promise((res) => setTimeout(res, 0));
      const t0 = performance.now();
      const triagem = triarPaginas(r.paginas);
      const pecas = segmentarPecas(r.paginas);
      const ix = indexar(r.paginas, pecas);
      setAutos({ doc: r.doc, nome: r.nomeArquivo, hash: r.hashArquivo, tamanho: r.tamanhoBytes, msLeitura: r.ms, msIndice: Math.round(performance.now() - t0), total: r.paginas.length, triagem, pecas, indice: ix.indice, blocos: ix.blocosLista.length, blocosLista: ix.blocosLista, limpas: ix.limpas, paginas: r.paginas, ocr: new Map() });
      setEtapa('');
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') setErro(e instanceof Error ? e.message : String(e));
      setEtapa('');
    } finally {
      setProg(null);
    }
  }, [autos]);

  const contagem = useMemo(() => {
    const c = { texto: 0, escaneada: 0, branco: 0, duplicada: 0 };
    autos?.triagem.forEach((t) => { c[t.tipo]++; });
    return c;
  }, [autos]);

  const buscar = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!autos || !consulta.trim()) return;
    setResultados(autos.indice.buscar(consulta, 8));
  };

  const pecaDaPagina = (n: number) => autos?.pecas.find((p) => n >= p.paginaInicial && n <= p.paginaFinal);

  return (
    <div className="space-y-5">
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-canvas text-accent"><FileSearch className="h-5 w-5" /></span>
            <div>
              <div className={rot}>Central de Esteiras · Leitura de Autos</div>
              <div className="text-[20px] font-semibold text-ink">Leitura de Autos</div>
              <div className="max-w-2xl text-[13px] text-ink-2">
                Autos de centenas de páginas lidos no seu navegador, separados em peças e pesquisáveis com citação de página. Leitura e busca rodam no seu computador; só a extração com IA envia ao servidor as páginas selecionadas.
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {etapa && <button type="button" className={btnSec} onClick={() => abortRef.current?.abort()}>Cancelar</button>}
            <button type="button" disabled={!!etapa} onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-[13px] font-semibold text-[#FFFFFF] hover:opacity-90 disabled:opacity-40">
              <Upload className="h-4 w-4" /> Enviar autos (PDF)
            </button>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) processar(f); }} />
          </div>
        </div>

        {etapa && (
          <div className="mt-4">
            <div className="flex justify-between text-[12.5px] text-ink-2">
              <span>{etapa}{prog?.etapa === 'lendo' ? ` · ${prog.pagina} de ${prog.total}` : ''}</span>
              {prog?.total ? <span>{Math.round((prog.pagina / prog.total) * 100)}%</span> : null}
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${prog?.total ? (prog.pagina / prog.total) * 100 : 8}%` }} />
            </div>
          </div>
        )}
        {erro && <div className="mt-3 rounded-lg bg-crit-soft px-3 py-2 text-[12.5px] text-crit">{erro}</div>}
        {!autos && !etapa && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) processar(f); }}
            className="mt-4 rounded-xl border border-dashed border-hairline-strong bg-canvas px-4 py-8 text-center text-[13px] text-ink-mute">
            Arraste o PDF dos autos aqui · até 200 MB · PJe, e-SAJ, eproc ou digitalizado
          </div>
        )}
      </div>

      {autos && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: 'Páginas', v: autos.total.toLocaleString('pt-BR'), s: `${(autos.tamanho / 1024 / 1024).toFixed(1)} MB · lido em ${(autos.msLeitura / 1000).toFixed(1)} s` },
              { k: 'Peças identificadas', v: autos.pecas.length, s: `${autos.blocos} blocos indexados em ${autos.msIndice} ms` },
              { k: 'Com texto', v: contagem.texto, s: `${contagem.branco} em branco · ${contagem.duplicada} duplicadas` },
              { k: 'Escaneadas (OCR)', v: contagem.escaneada, s: contagem.escaneada ? `${autos.ocr.size} de ${contagem.escaneada} lidas por OCR` : 'Nenhuma — tudo pesquisável' },
            ].map((m) => (
              <div key={m.k} className={`${card} p-4`}>
                <div className={rot}>{m.k}</div>
                <div className="mt-1 text-[22px] font-semibold text-ink">{m.v}</div>
                <div className="text-[12px] text-ink-mute">{m.s}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[12px] text-ink-mute">
            <ShieldCheck className="h-4 w-4 text-good" />
            <span className="truncate">{autos.nome} · SHA-256 <code>{autos.hash.slice(0, 16)}…{autos.hash.slice(-8)}</code></span>
          </div>

          <ExtracaoIaPanel
            doc={autos.doc}
            autosHash={autos.hash}
            nomeArquivo={autos.nome}
            totalPaginas={autos.total}
            pecas={autos.pecas}
            blocos={autos.blocosLista}
            textos={autos.limpas}
            escaneadas={autos.triagem.filter((t) => t.tipo === 'escaneada').map((t) => t.n)}
            ocrFeito={new Set(autos.ocr.keys())}
            onOcr={aplicarOcr}
            onIrPagina={setPagina}
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <div className="space-y-5">
              <form onSubmit={buscar} className={`${card} p-4`}>
                <div className={rot}>Pergunte aos autos</div>
                <div className="mt-2 flex gap-2">
                  <input value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Ex.: houve condenação em honorários?"
                    className="h-9 w-full rounded-lg border border-hairline bg-canvas px-3 text-[13px] text-ink" />
                  <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-semibold text-[#FFFFFF]"><Search className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 text-[11.5px] text-ink-mute">Busca literal com citação — nada é inventado. A extração com IA (abaixo) usa estes trechos e cita a página de cada fato.</div>
                {resultados && (
                  <ul className="mt-3 space-y-2">
                    {resultados.length === 0 && <li className="text-[13px] text-ink-mute">Não encontrado nos autos.</li>}
                    {resultados.map((r) => {
                      const peca = autos.pecas.find((p) => p.id === r.bloco.pecaId);
                      return (
                        <li key={r.bloco.id} className="rounded-xl border border-hairline bg-canvas p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-medium text-ink-2">{peca ? TIPO_PECA_LABEL[peca.tipo] : 'Trecho'}</span>
                            <button type="button" onClick={() => setPagina(r.bloco.paginaInicial)} className="rounded-md bg-accent-tint px-2 py-0.5 text-[12px] font-semibold text-accent">
                              {r.bloco.paginaInicial === r.bloco.paginaFinal ? `p. ${r.bloco.paginaInicial}` : `pp. ${r.bloco.paginaInicial}–${r.bloco.paginaFinal}`}
                            </button>
                          </div>
                          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink">
                            {partesDestacadas(r.trecho, r.termos).map((p, i) => p.hit ? <mark key={i} className="rounded bg-warn-soft px-0.5 text-ink">{p.t}</mark> : <span key={i}>{p.t}</span>)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </form>

              <div className={`${card} p-4`}>
                <div className={rot}>Peças ({autos.pecas.length})</div>
                <ul className="mt-2 max-h-[420px] divide-y divide-hairline overflow-y-auto">
                  {autos.pecas.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => setPagina(p.paginaInicial)} className="flex w-full items-start gap-2 py-2 text-left hover:bg-surface-hover">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />
                        <span className="min-w-0">
                          <span className="block text-[13px] text-ink">{p.titulo}</span>
                          {p.assinadoPor && <span className="block truncate text-[11.5px] text-ink-mute">Assinado por {p.assinadoPor}{p.assinadoEm ? ` em ${p.assinadoEm}` : ''}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              {pagina ? (
                <>
                  <Visualizador doc={autos.doc} pagina={pagina} total={autos.total} onIr={setPagina} onFechar={() => setPagina(null)} />
                  {pecaDaPagina(pagina) && <div className="mt-2 text-[12px] text-ink-mute">Peça: {pecaDaPagina(pagina)!.titulo}</div>}
                </>
              ) : (
                <div className={`${card} flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-6 text-center text-[13px] text-ink-mute`}>
                  <ScanLine className="h-6 w-6" />
                  Clique numa peça ou numa citação para abrir a página.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
