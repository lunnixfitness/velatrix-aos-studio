import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, ScanLine, FileCheck2, Send, Loader2, ShieldCheck, ShieldAlert, CalendarClock, X, Coins } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { TIPO_PECA_LABEL, type Bloco, type Peca } from '../../documents/autos/autosCore';
import { IndiceBm25 } from '../../documents/autos/indiceBm25';
import { selecionarPaginas, SELECAO_PADRAO, type OpcoesSelecao } from '../../documents/autos/selecaoPaginas';
import { paginaParaImagem } from '../../documents/autos/ocrImagem';
import { encerrarOcrLocal, ocrLocal, OcrLocalIndisponivel } from '../../documents/autos/ocrLocal';
import { avaliarOcr, tokensOcrGeminiEstimados } from '../../documents/autos/qualidadeOcr';
import type { CampoFato, FatoVerificado, StatusCitacao } from '../../documents/autos/citacao';
import {
  comLimite, extrairPeca, gerarRelatorioAutos, ocrPagina, statusAutosIa,
  type ExtracaoPeca, type ModoExtracao, type RelatorioAutos, type StatusAutosIa,
} from '../../services/autosIaClient';

/**
 * Leitura de Autos · P26b — OCR das escaneadas, extração por peça com IA e envio à revisão.
 * Todo fato exibido passou pelo Guardrail de citação no servidor: trecho literal + página.
 * Os que não conferem ficam visíveis (marcados) e nunca entram no relatório.
 */

const card = 'rounded-2xl border border-hairline bg-surface';
const rot = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute';
const btnSec = 'inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 h-9 text-[13px] text-ink-2 hover:border-hairline-strong disabled:opacity-40';
const btnPri = 'inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-[13px] font-semibold text-[#FFFFFF] hover:opacity-90 disabled:opacity-40';

const ROTULO_CAMPO: Record<CampoFato, string> = {
  parte_autora: 'Parte autora', parte_re: 'Parte ré', advogado: 'Advogados', juizo: 'Juízo',
  numero_processo: 'Número do processo', pedido: 'Pedidos', valor: 'Valores', data: 'Datas',
  prazo: 'Prazos', decisao: 'Decisões', fundamento_legal: 'Fundamentos legais', outro: 'Outros',
};
const ORDEM_CAMPOS: CampoFato[] = ['numero_processo', 'juizo', 'parte_autora', 'parte_re', 'advogado', 'pedido', 'valor', 'decisao', 'data', 'prazo', 'fundamento_legal', 'outro'];

const MOTIVO: Record<Exclude<StatusCitacao, 'CONFERE'>, string> = {
  PAGINA_FORA_DO_ESCOPO: 'página não enviada',
  TRECHO_CURTO: 'trecho curto demais',
  TRECHO_NAO_ENCONTRADO: 'trecho não existe na página',
  VALOR_DIVERGE: 'valor fora do trecho',
  DATA_DIVERGE: 'data fora do trecho',
};

const ESTEIRAS = [
  ['PERICIA_JUDICIAL', 'Perícia Judicial'], ['RECUPERACAO_TRIBUTARIA', 'Recuperação Tributária'], ['INSS', 'Especialista INSS'],
  ['INSS_OBRAS', 'INSS-Obras'], ['PRECATORIA', 'Precatório'], ['DIAGNOSTICO', 'Diagnóstico'],
] as const;

type EstadoPeca = ExtracaoPeca | { erro: string } | 'rodando';

const MODOS: { v: ModoExtracao; rotulo: string; dica: string }[] = [
  { v: 'economico', rotulo: 'Econômico', dica: 'Só regras determinísticas: zero token. Pega processo, partes, OAB, valores, datas, decisões e artigos.' },
  { v: 'hibrido', rotulo: 'Híbrido', dica: 'Regras primeiro; IA só em peças narrativas e só para pedidos, decisões, fundamentos, prazos e juízo.' },
  { v: 'completo', rotulo: 'Completo', dica: 'IA em todas as peças, com até 30 páginas por peça. Maior cobertura, maior custo.' },
];

/** Páginas por peça conforme o modo: o híbrido manda menos texto à IA (menos tokens de entrada). */
const SELECAO_POR_MODO: Record<ModoExtracao, OpcoesSelecao> = {
  economico: SELECAO_PADRAO, // regras rodam no servidor sem custo de token: pode mandar tudo
  hibrido: { ...SELECAO_PADRAO, maxPaginas: 12, maxChars: 60_000 },
  completo: SELECAO_PADRAO,
};

const CHAVE_MODO = 'velatrix.autos.modo';
const lerModoSalvo = (): ModoExtracao | null => {
  try { const v = localStorage.getItem(CHAVE_MODO); return v === 'economico' || v === 'hibrido' || v === 'completo' ? v : null; } catch { return null; }
};
const fmtTokens = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} mi` : n >= 1000 ? `${(n / 1000).toFixed(1)} mil` : String(n));

const chipGuardrail = (g: string) =>
  g === 'APROVADO' ? 'bg-good-soft text-good' : g === 'PARCIAL' ? 'bg-warn-soft text-ink' : g === 'VAZIO' ? 'bg-canvas text-ink-mute' : 'bg-crit-soft text-crit';

const pags = (a: number, b: number) => (a === b ? `p. ${a}` : `pp. ${a}–${b}`);
const dataBR = (iso: string) => iso.split('-').reverse().join('/');
const ehAbort = (e: unknown) => (e as DOMException)?.name === 'AbortError';
const msgErro = (e: unknown) => (e instanceof Error ? e.message : String(e));

export interface ExtracaoIaPanelProps {
  doc: PDFDocumentProxy;
  autosHash: string;
  nomeArquivo: string;
  totalPaginas: number;
  pecas: Peca[];
  blocos: Bloco[];
  /** Texto limpo por página (camada de texto + OCR já aplicado). */
  textos: Map<number, string>;
  escaneadas: number[];
  ocrFeito: ReadonlySet<number>;
  onOcr: (novos: Map<number, string>) => void;
  onIrPagina: (n: number) => void;
}

export const ExtracaoIaPanel: React.FC<ExtracaoIaPanelProps> = ({ doc, autosHash, nomeArquivo, totalPaginas, pecas, blocos, textos, escaneadas, ocrFeito, onOcr, onIrPagina }) => {
  const [status, setStatus] = useState<StatusAutosIa | null>(null);
  const [erroStatus, setErroStatus] = useState<string | null>(null);
  const [tarefa, setTarefa] = useState<{ nome: string; feitas: number; total: number } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [porPeca, setPorPeca] = useState<Record<string, EstadoPeca>>({});
  const [verRejeitados, setVerRejeitados] = useState(false);
  const [relatorio, setRelatorio] = useState<RelatorioAutos | null>(null);
  const [workItem, setWorkItem] = useState<{ id: string; ref?: string; status: string } | null>(null);
  const [esteira, setEsteira] = useState<string>('PERICIA_JUDICIAL');
  const abortRef = useRef<AbortController | null>(null);
  const [modo, setModoEstado] = useState<ModoExtracao>(() => lerModoSalvo() ?? 'hibrido');
  const setModo = (m: ModoExtracao) => { setModoEstado(m); try { localStorage.setItem(CHAVE_MODO, m); } catch { /* sem storage: só nesta sessão */ } };

  useEffect(() => {
    const ac = new AbortController();
    statusAutosIa(ac.signal).then((st) => {
      setStatus(st);
      // Servidor forçou o modo, ou o advogado nunca escolheu: segue o padrão do servidor.
      if (st.modoPadrao && (st.modoForcado || !lerModoSalvo())) setModoEstado(st.modoPadrao);
    }).catch((e) => { if (!ehAbort(e)) setErroStatus(msgErro(e)); });
    return () => ac.abort();
  }, []);
  // Autos novos: descarta extrações e relatório anteriores.
  useEffect(() => { setPorPeca({}); setRelatorio(null); setWorkItem(null); setAviso(null); setOcrConsumo({ local: 0, gemini: 0, gastos: 0, evitados: 0, estimado: false }); }, [autosHash]);
  useEffect(() => () => { abortRef.current?.abort(); void encerrarOcrLocal(); }, []);
  const [ocrConsumo, setOcrConsumo] = useState({ local: 0, gemini: 0, gastos: 0, evitados: 0, estimado: false });

  const pendentesOcr = useMemo(() => escaneadas.filter((n) => !ocrFeito.has(n)), [escaneadas, ocrFeito]);
  const extracoes = useMemo(() => Object.values(porPeca).filter((v): v is ExtracaoPeca => typeof v === 'object' && 'fatos' in v), [porPeca]);
  const conferidos = useMemo(() => {
    const m = new Map<CampoFato, (FatoVerificado & { pecaId: string })[]>();
    for (const ex of extracoes) for (const f of ex.fatos) {
      if (f.status !== 'CONFERE') continue;
      const l = m.get(f.campo) ?? [];
      if (!l.some((x) => x.valor === f.valor && x.pagina === f.pagina)) l.push({ ...f, pecaId: ex.peca.id });
      m.set(f.campo, l);
    }
    for (const l of m.values()) l.sort((a, b) => a.pagina - b.pagina);
    return m;
  }, [extracoes]);
  const rejeitados = useMemo(() => extracoes.flatMap((ex) => ex.fatos.filter((f) => f.status !== 'CONFERE')), [extracoes]);
  const consumo = useMemo(() => extracoes.reduce(
    (a, e) => ({
      gastos: a.gastos + (e.consumo?.tokensEntrada ?? 0) + (e.consumo?.tokensSaida ?? 0),
      evitados: a.evitados + (e.consumo?.tokensEvitados ?? 0),
      chamadas: a.chamadas + (e.consumo?.chamadasIa ?? 0),
      estimado: a.estimado || !!e.consumo?.estimado,
      semIa: a.semIa + (e.consumo?.chamadasIa ? 0 : 1),
    }),
    { gastos: 0, evitados: 0, chamadas: 0, estimado: false, semIa: 0 },
  ), [extracoes]);

  const iniciar = (nome: string, total: number) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setAviso(null);
    setTarefa({ nome, feitas: 0, total });
    return ac;
  };
  const avancar = () => setTarefa((t) => (t ? { ...t, feitas: t.feitas + 1 } : t));

  /**
   * OCR em duas camadas: Tesseract no navegador primeiro (zero token, a imagem não sai do computador);
   * o Gemini só entra quando o resultado local é ruim (avaliarOcr) e o modo não é Econômico.
   */
  const rodarOcr = async () => {
    const ac = iniciar('OCR das páginas escaneadas', pendentesOcr.length);
    const novos = new Map<number, string>();
    const falhas: number[] = [];
    const lote = { local: 0, gemini: 0, gastos: 0, evitados: 0, estimado: false };
    let localIndisponivel = false;
    const geminiPermitido = !!status?.ocr && modo !== 'economico';
    try {
      await comLimite(pendentesOcr, 2, async (n) => {
        try {
          let texto: string | null = null;
          if (!localIndisponivel) {
            try {
              const r = await ocrLocal(doc, n, (p) => setTarefa((t) => (t ? { ...t, nome: `Baixando modelo de OCR em português · ${Math.round(p * 100)}%` } : t)));
              const av = avaliarOcr(r.texto, r.confianca);
              // Econômico ou sem Gemini: aceita o local mesmo imperfeito — o guardrail só confirma o que estiver literal.
              if (r.texto.trim() && (av.aceito || !geminiPermitido)) {
                texto = r.texto;
                lote.local++;
                lote.evitados += tokensOcrGeminiEstimados(r.texto);
              }
            } catch (e) {
              if (ehAbort(e)) throw e;
              if (e instanceof OcrLocalIndisponivel) localIndisponivel = true; // cai para o Gemini nas próximas
            }
          }
          if (texto === null && geminiPermitido) {
            const img = await paginaParaImagem(doc, n);
            const r = await ocrPagina(n, img, ac.signal);
            texto = r.texto;
            lote.gemini++;
            lote.gastos += r.tokens ? r.tokens.entrada + r.tokens.saida : tokensOcrGeminiEstimados(r.texto);
            lote.estimado ||= !r.tokens || r.tokens.estimado;
          }
          if (texto !== null) novos.set(n, texto); else falhas.push(n);
        } catch (e) {
          if (ehAbort(e)) throw e;
          falhas.push(n);
        }
        setTarefa((t) => (t ? { ...t, nome: 'OCR das páginas escaneadas' } : t));
        avancar();
      }, ac.signal);
    } catch (e) {
      if (!ehAbort(e)) setAviso(msgErro(e));
    } finally {
      if (novos.size) onOcr(novos); // aplica o que ficou pronto, mesmo se cancelado
      setOcrConsumo((c) => ({ local: c.local + lote.local, gemini: c.gemini + lote.gemini, gastos: c.gastos + lote.gastos, evitados: c.evitados + lote.evitados, estimado: c.estimado || lote.estimado }));
      const avisos: string[] = [];
      if (localIndisponivel) avisos.push('OCR local indisponível neste navegador; usando o Gemini.');
      if (falhas.length) avisos.push(`OCR não leu ${falhas.length} página(s): ${falhas.slice(0, 12).join(', ')}${falhas.length > 12 ? '…' : ''}${!geminiPermitido ? ' (Gemini desligado neste modo)' : ''}`);
      if (avisos.length) setAviso(avisos.join(' '));
      setTarefa(null);
    }
  };

  const rodarExtracao = async (alvo?: Peca[]) => {
    const lista = (alvo ?? pecas).filter((p) => {
      for (let n = p.paginaInicial; n <= p.paginaFinal; n++) if ((textos.get(n) ?? '').trim().length >= 5) return true;
      return false; // peça sem texto (escaneada sem OCR / em branco): nada a extrair
    });
    const ac = iniciar('Extraindo fatos por peça', lista.length);
    setRelatorio(null);
    setWorkItem(null);
    try {
      await comLimite(lista, 3, async (p) => {
        setPorPeca((s) => ({ ...s, [p.id]: 'rodando' }));
        try {
          const blocosPeca = blocos.filter((b) => b.pecaId === p.id);
          const { paginas } = selecionarPaginas(p, textos, (q) => new IndiceBm25(blocosPeca).buscar(q, 60), SELECAO_POR_MODO[modo]);
          const r = await extrairPeca(autosHash, { id: p.id, tipo: p.tipo, titulo: p.titulo, paginaInicial: p.paginaInicial, paginaFinal: p.paginaFinal }, paginas, ac.signal, modo);
          setPorPeca((s) => ({ ...s, [p.id]: r }));
        } catch (e) {
          if (ehAbort(e)) { setPorPeca((s) => { const { [p.id]: _x, ...resto } = s; return resto; }); throw e; }
          setPorPeca((s) => ({ ...s, [p.id]: { erro: msgErro(e) } }));
        }
        avancar();
      }, ac.signal);
    } catch (e) {
      if (!ehAbort(e)) setAviso(msgErro(e));
    } finally {
      setTarefa(null);
    }
  };

  const relatorioReq = (enviarParaRevisao: boolean) =>
    gerarRelatorioAutos({
      autosHash, nomeArquivo, totalPaginas, enviarParaRevisao, esteira: enviarParaRevisao ? esteira : undefined,
      pecas: pecas.map((p) => ({ id: p.id, tipo: p.tipo, titulo: p.titulo, paginaInicial: p.paginaInicial, paginaFinal: p.paginaFinal, assinadoEm: p.assinadoEm })),
    });

  const gerar = async (enviar: boolean) => {
    setAviso(null);
    setTarefa({ nome: enviar ? 'Enviando para revisão' : 'Montando relatório', feitas: 0, total: 1 });
    try {
      const r = await relatorioReq(enviar);
      setRelatorio(r.relatorio);
      if (r.workItem) setWorkItem(r.workItem);
    } catch (e) {
      setAviso(msgErro(e));
    } finally {
      setTarefa(null);
    }
  };

  const ocupado = !!tarefa;
  const iaLigada = !!status && status.ia !== 'indisponivel';
  // Econômico não depende da IA; híbrido sem IA degrada para regras (o servidor avisa por peça).
  const podeExtrair = !!status && (iaLigada || modo !== 'completo');

  return (
    <div className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-canvas text-accent"><Sparkles className="h-5 w-5" /></span>
          <div>
            <div className={rot}>P26 · Extração com IA</div>
            <div className="text-[16px] font-semibold text-ink">Fatos dos autos, cada um com a página de origem</div>
            <div className="max-w-2xl text-[12.5px] text-ink-2">
              Só vão ao servidor as páginas escaneadas (para OCR) e as páginas selecionadas de cada peça. Todo fato é conferido contra o texto da página antes de aparecer aqui.
            </div>
          </div>
        </div>
        <div className="text-right text-[11.5px] text-ink-mute">
          {erroStatus ? <span className="text-crit">IA: {erroStatus}</span> : !status ? 'Verificando IA…' : (
            <>
              <div>IA: <span className="font-medium text-ink-2">{status.ia === 'deterministico-demo' ? 'extrator determinístico (demonstração)' : status.ia === 'indisponivel' ? 'indisponível' : status.ia.replace(/^gemini:/, '')}</span></div>
              <div>Fila do escritório: {status.escritorio.emExecucao} em execução · {status.escritorio.pendentes} aguardando</div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={rot}>Modo</span>
        <div className="inline-flex rounded-lg border border-hairline bg-canvas p-0.5" role="radiogroup" aria-label="Modo de extração">
          {MODOS.map((m) => (
            <button key={m.v} type="button" role="radio" aria-checked={modo === m.v} title={m.dica}
              disabled={ocupado || !!status?.modoForcado} onClick={() => setModo(m.v)}
              className={`h-7 rounded-md px-2.5 text-[12px] font-medium disabled:cursor-not-allowed ${modo === m.v ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute hover:text-ink-2'}`}>
              {m.rotulo}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] text-ink-mute">{status?.modoForcado ? 'Definido pelo administrador. ' : ''}{MODOS.find((m) => m.v === modo)!.dica}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btnSec} disabled={ocupado || !pendentesOcr.length} onClick={rodarOcr}
          title="OCR no seu navegador (sem token; a imagem não sai do computador). Gemini só para páginas ruins, fora do modo Econômico.">
          <ScanLine className="h-4 w-4" /> 1 · OCR das escaneadas ({pendentesOcr.length})
        </button>
        <button type="button" className={btnPri} disabled={ocupado || !podeExtrair} onClick={() => rodarExtracao()}>
          <Sparkles className="h-4 w-4" /> 2 · Extrair fatos ({pecas.length} peças)
        </button>
        <button type="button" className={btnSec} disabled={ocupado || !extracoes.length} onClick={() => gerar(false)}>
          <FileCheck2 className="h-4 w-4" /> 3 · Gerar relatório
        </button>
        {ocupado && <button type="button" className={btnSec} onClick={() => abortRef.current?.abort()}><X className="h-4 w-4" /> Cancelar</button>}
      </div>
      {!!pendentesOcr.length && (
        <div className="mt-2 text-[12px] text-ink-mute">
          {pendentesOcr.length} página(s) escaneada(s) aguardando OCR. Leitura local no navegador (sem token){status?.ocr && modo !== 'economico' ? '; páginas ilegíveis vão ao Gemini' : ''}. Na primeira vez o navegador baixa o modelo em português (alguns MB).
        </div>
      )}

      {tarefa && (
        <div className="mt-4">
          <div className="flex justify-between text-[12.5px] text-ink-2">
            <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />{tarefa.nome}{tarefa.total > 1 ? ` · ${tarefa.feitas} de ${tarefa.total}` : ''}</span>
            {tarefa.total > 1 && <span>{Math.round((tarefa.feitas / tarefa.total) * 100)}%</span>}
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${tarefa.total ? Math.max(6, (tarefa.feitas / tarefa.total) * 100) : 6}%` }} />
          </div>
        </div>
      )}
      {aviso && <div className="mt-3 rounded-lg bg-crit-soft px-3 py-2 text-[12.5px] text-crit">{aviso}</div>}

      {(extracoes.length > 0 || ocrConsumo.local + ocrConsumo.gemini > 0) && (() => {
        const gastos = consumo.gastos + ocrConsumo.gastos;
        const evitados = consumo.evitados + ocrConsumo.evitados;
        return (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[12px] text-ink-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink"><Coins className="h-4 w-4 text-accent" /> Consumo desta leitura</span>
            <span>Tokens gastos: <b className="text-ink">{fmtTokens(gastos)}</b>{(consumo.estimado || ocrConsumo.estimado) && gastos ? ' (estimado)' : ''}</span>
            <span>Evitados: <b className="text-good">{fmtTokens(evitados)}</b> <span className="text-ink-mute">(estimado)</span></span>
            {gastos + evitados > 0 && <span>Economia: <b className="text-good">{Math.round((evitados / (gastos + evitados)) * 100)}%</b></span>}
            {extracoes.length > 0 && <span className="text-ink-mute">Peças: {consumo.chamadas} com IA · {consumo.semIa} só regras</span>}
            {ocrConsumo.local + ocrConsumo.gemini > 0 && <span className="text-ink-mute">OCR: {ocrConsumo.local} local · {ocrConsumo.gemini} Gemini</span>}
          </div>
        );
      })()}

      {Object.keys(porPeca).length > 0 && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div>
            <div className={rot}>Peças</div>
            <ul className="mt-2 max-h-[380px] divide-y divide-hairline overflow-y-auto">
              {pecas.map((p) => {
                const e = porPeca[p.id];
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                    <button type="button" onClick={() => onIrPagina(p.paginaInicial)} className="min-w-0 text-left">
                      <span className="block truncate text-[12.5px] text-ink">{TIPO_PECA_LABEL[p.tipo]} · {pags(p.paginaInicial, p.paginaFinal)}</span>
                      {e && typeof e === 'object' && 'fatos' in e && (
                        <span className="block text-[11px] text-ink-mute">{e.conferidos} conferido(s){e.rejeitados ? ` · ${e.rejeitados} rejeitado(s)` : ''}{e.origem === 'deterministico' ? (e.iaIndisponivel ? ' · IA indisponível, só regras' : ' · só regras, 0 token') : e.origem === 'hibrido' ? ' · regras + IA' : ' · IA'}</span>
                      )}
                      {e && typeof e === 'object' && 'erro' in e && <span className="block truncate text-[11px] text-crit">{e.erro}</span>}
                    </button>
                    {e === 'rodando' ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-mute" />
                      : e && typeof e === 'object' && 'fatos' in e ? <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${chipGuardrail(e.guardrail)}`}>{e.guardrail}</span>
                      : e && typeof e === 'object' && 'erro' in e ? <button type="button" className="shrink-0 text-[11px] font-semibold text-accent" disabled={ocupado} onClick={() => rodarExtracao([p])}>tentar de novo</button>
                      : <span className="shrink-0 text-[11px] text-ink-mute">—</span>}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className={rot}>Fatos conferidos</div>
              {!!rejeitados.length && (
                <button type="button" className="text-[11.5px] font-medium text-ink-2 underline-offset-2 hover:underline" onClick={() => setVerRejeitados((v) => !v)}>
                  {verRejeitados ? 'ocultar' : 'ver'} {rejeitados.length} rejeitado(s) pelo guardrail
                </button>
              )}
            </div>
            <div className="mt-2 max-h-[380px] space-y-3 overflow-y-auto pr-1">
              {!conferidos.size && <div className="text-[12.5px] text-ink-mute">Nenhum fato conferido ainda.</div>}
              {ORDEM_CAMPOS.filter((c) => conferidos.has(c)).map((c) => (
                <div key={c}>
                  <div className="text-[11.5px] font-semibold text-ink-2">{ROTULO_CAMPO[c]}</div>
                  <ul className="mt-1 space-y-1.5">
                    {conferidos.get(c)!.map((f, i) => (
                      <li key={`${f.pagina}-${i}`} className="rounded-lg border border-hairline bg-canvas px-2.5 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[12.5px] font-medium text-ink">{f.valor}</span>
                          <button type="button" onClick={() => onIrPagina(f.pagina)} className="shrink-0 rounded-md bg-accent-tint px-2 py-0.5 text-[11.5px] font-semibold text-accent">p. {f.pagina}</button>
                        </div>
                        <div className="mt-1 text-[11.5px] italic leading-snug text-ink-mute">“{f.trecho.length > 220 ? `${f.trecho.slice(0, 219)}…` : f.trecho}”</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {verRejeitados && (
                <div>
                  <div className="text-[11.5px] font-semibold text-crit">Rejeitados (não entram no relatório)</div>
                  <ul className="mt-1 space-y-1.5">
                    {rejeitados.map((f, i) => (
                      <li key={i} className="rounded-lg border border-hairline px-2.5 py-2 text-[11.5px] text-ink-mute">
                        <span className="font-medium text-ink-2">{ROTULO_CAMPO[f.campo]}: {f.valor}</span> · p. {f.pagina} · <span className="text-crit">{MOTIVO[f.status as Exclude<StatusCitacao, 'CONFERE'>]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {relatorio && (
        <div className="mt-5 rounded-xl border border-hairline bg-canvas p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {relatorio.guardrail === 'BLOQUEADO' ? <ShieldAlert className="h-4 w-4 text-crit" /> : <ShieldCheck className="h-4 w-4 text-good" />}
              <span className="text-[13px] font-semibold text-ink">Relatório de leitura dos autos</span>
              <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${chipGuardrail(relatorio.guardrail)}`}>{relatorio.guardrail}</span>
            </div>
            <code className="text-[11px] text-ink-mute">conteúdo {relatorio.conteudoHash.slice(0, 12)}…</code>
          </div>
          {(relatorio.pendencias.pecasNaoExtraidas.length > 0 || relatorio.pendencias.fatosRejeitados > 0) && (
            <div className="mt-1.5 text-[12px] text-ink-mute">
              Pendências: {relatorio.pendencias.pecasNaoExtraidas.length} peça(s) sem extração · {relatorio.pendencias.fatosRejeitados} fato(s) rejeitado(s) pelo guardrail.
            </div>
          )}

          {relatorio.linhaDoTempo.length > 0 && (
            <div className="mt-3">
              <div className={`${rot} flex items-center gap-1.5`}><CalendarClock className="h-3.5 w-3.5" /> Linha do tempo</div>
              <ol className="mt-2 max-h-[260px] space-y-1 overflow-y-auto border-l border-hairline pl-3">
                {relatorio.linhaDoTempo.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px]">
                    <span className="w-[74px] shrink-0 font-medium tabular-nums text-ink">{dataBR(e.data)}</span>
                    <span className="min-w-0 flex-1 text-ink-2">{e.descricao}</span>
                    <button type="button" onClick={() => onIrPagina(e.pagina)} className="shrink-0 rounded-md bg-accent-tint px-1.5 text-[11px] font-semibold text-accent">p. {e.pagina}</button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
            {workItem ? (
              <div className="text-[12.5px] text-ink-2">
                Enviado para revisão humana: <span className="font-semibold text-ink">{workItem.ref ?? workItem.id}</span> · {workItem.status === 'READY_FOR_REVIEW' ? 'aguardando revisão' : workItem.status}. Aprovação e selo seguem pela Fila de Aprovação.
              </div>
            ) : (
              <>
                <select value={esteira} onChange={(e) => setEsteira(e.target.value)} className="h-9 rounded-lg border border-hairline bg-surface px-2 text-[13px] text-ink">
                  {ESTEIRAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button type="button" className={btnPri} disabled={ocupado || relatorio.guardrail === 'BLOQUEADO'} onClick={() => gerar(true)}>
                  <Send className="h-4 w-4" /> Enviar para revisão (HITL)
                </button>
                <span className="text-[11.5px] text-ink-mute">O profissional habilitado revisa, aprova e assina; a IA não emite laudo.</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
