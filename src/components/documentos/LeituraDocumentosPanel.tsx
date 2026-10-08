import React, { useCallback, useRef, useState } from 'react';
import { ScanText, Upload, CheckCircle2, XCircle, AlertTriangle, Info, FileText, Loader2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { lerPdf, liberarPdf, LIMITE_BYTES } from '../../documents/autos/leitorPdf';
import {
  extrairDocumento, TIPO_CAMPO_LABEL, TIPO_DOC_LABEL, type ResultadoExtracao, type Campo, type TipoCampo,
} from '../../documents/extracao/extratores';

/**
 * Leitura de documentos (P26a) — leitura REAL de boletos, guias, NF-e/NFS-e,
 * comprovantes PIX, procurações e contratos. Extração determinística com
 * validação de dígito verificador; cada campo mostra a página e o trecho.
 * Substitui a simulação anterior (resultado fixo por preset).
 */

const card = 'rounded-2xl border border-hairline bg-surface';
const rot = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute';

interface Item {
  id: string;
  nome: string;
  tamanho: number;
  estado: 'lendo' | 'pronto' | 'ocr' | 'erro';
  erro?: string;
  paginas?: number;
  ms?: number;
  hash?: string;
  resultado?: ResultadoExtracao;
}

const ORDEM: TipoCampo[] = ['boleto', 'chave_nfe', 'pix_copia_cola', 'pix_e2e', 'processo_cnj', 'cnpj', 'cpf', 'oab', 'valor', 'data'];

const Selo: React.FC<{ v: boolean | null }> = ({ v }) =>
  v === true ? <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-good"><CheckCircle2 className="h-3.5 w-3.5" />válido</span>
    : v === false ? <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-crit"><XCircle className="h-3.5 w-3.5" />inválido</span>
      : <span className="text-[11.5px] text-ink-mute">—</span>;

const LinhaCampo: React.FC<{ c: Campo }> = ({ c }) => {
  const [aberto, setAberto] = useState(false);
  const det = Object.entries(c.detalhes || {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return (
    <li className="border-b border-hairline last:border-0">
      <button type="button" onClick={() => setAberto((x) => !x)} className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-surface-hover">
        {aberto ? <ChevronDown className="mt-0.5 h-4 w-4 text-ink-mute" /> : <ChevronRight className="mt-0.5 h-4 w-4 text-ink-mute" />}
        <span className="w-36 shrink-0 text-[12.5px] text-ink-2">{TIPO_CAMPO_LABEL[c.tipo]}</span>
        <span className="min-w-0 flex-1 break-all font-mono text-[12.5px] text-ink">{c.valor}</span>
        <span className="w-20 shrink-0"><Selo v={c.valido} /></span>
        <span className="w-12 shrink-0 text-right text-[12px] text-ink-mute">p. {c.pagina}</span>
      </button>
      {aberto && (
        <div className="space-y-1.5 px-10 pb-3 text-[12px]">
          {det.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {det.map(([k, v]) => <span key={k} className="rounded-md border border-hairline bg-canvas px-2 py-0.5 text-ink-2"><b className="text-ink">{k}</b>: {String(v)}</span>)}
            </div>
          )}
          <div className="rounded-lg bg-canvas px-2.5 py-1.5 text-ink-2">“{c.trecho}”</div>
        </div>
      )}
    </li>
  );
};

const CardDocumento: React.FC<{ it: Item; onRemover: () => void }> = ({ it, onRemover }) => {
  const r = it.resultado;
  const campos = r ? [...r.campos].sort((a, b) => ORDEM.indexOf(a.tipo) - ORDEM.indexOf(b.tipo) || a.pagina - b.pagina) : [];
  const principais = campos.filter((c) => c.tipo !== 'valor' && c.tipo !== 'data');
  const secundarios = campos.filter((c) => c.tipo === 'valor' || c.tipo === 'data');
  const [verTodos, setVerTodos] = useState(false);
  const altas = r?.alertas.filter((a) => a.severidade === 'alta').length || 0;
  return (
    <div className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-canvas text-ink-mute"><FileText className="h-4 w-4" /></span>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-ink">{it.nome}</div>
            <div className="text-[12px] text-ink-mute">
              {(it.tamanho / 1024).toFixed(0)} KB
              {it.paginas ? ` · ${it.paginas} pág.` : ''}
              {it.ms != null ? ` · lido em ${(it.ms / 1000).toFixed(1)} s` : ''}
              {it.hash ? ` · SHA-256 ${it.hash.slice(0, 12)}…` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {it.estado === 'lendo' && <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2"><Loader2 className="h-4 w-4 animate-spin" />lendo…</span>}
          {r && (
            <span className="rounded-md bg-accent-tint px-2 py-1 text-[12px] font-semibold text-accent">
              {TIPO_DOC_LABEL[r.tipo]}{r.confianca !== 'alta' ? ` · confiança ${r.confianca}` : ''}
            </span>
          )}
          {r && (altas ? <span className="rounded-md bg-crit-soft px-2 py-1 text-[12px] font-semibold text-crit">{altas} alerta(s)</span> : <span className="rounded-md bg-good-soft px-2 py-1 text-[12px] font-semibold text-good">sem alertas críticos</span>)}
          <button type="button" onClick={onRemover} className="text-ink-mute hover:text-crit" title="Remover"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {it.estado === 'erro' && <div className="mt-3 rounded-lg bg-crit-soft px-3 py-2 text-[12.5px] text-crit">{it.erro}</div>}
      {it.estado === 'ocr' && (
        <div className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-[12.5px] text-warn">
          Imagem ou digitalização sem camada de texto. A leitura por OCR entra na próxima fase (P26); nada foi inventado.
        </div>
      )}

      {r && r.alertas.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {r.alertas.map((a, i) => (
            <li key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-[12.5px] ${a.severidade === 'alta' ? 'bg-crit-soft text-crit' : a.severidade === 'media' ? 'bg-warn-soft text-warn' : 'bg-canvas text-ink-2'}`}>
              {a.severidade === 'info' ? <Info className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{a.mensagem}{a.pagina ? ` (p. ${a.pagina})` : ''}</span>
            </li>
          ))}
        </ul>
      )}

      {principais.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline">
          <div className="flex items-center gap-3 border-b border-hairline bg-canvas px-3 py-1.5 pl-10 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-mute">
            <span className="w-36">Campo</span><span className="flex-1">Valor</span><span className="w-20">Validação</span><span className="w-12 text-right">Pág.</span>
          </div>
          <ul>{principais.map((c, i) => <LinhaCampo key={`${c.tipo}-${c.valor}-${i}`} c={c} />)}</ul>
        </div>
      )}
      {secundarios.length > 0 && (
        <div className="mt-3">
          <button type="button" onClick={() => setVerTodos((x) => !x)} className="text-[12.5px] font-medium text-accent">
            {verTodos ? 'Ocultar' : 'Ver'} valores e datas ({secundarios.length})
          </button>
          {verTodos && <ul className="mt-2 overflow-hidden rounded-xl border border-hairline">{secundarios.map((c, i) => <LinhaCampo key={`${c.tipo}-${c.valor}-${i}`} c={c} />)}</ul>}
        </div>
      )}
    </div>
  );
};

export const LeituraDocumentosPanel: React.FC = () => {
  const [itens, setItens] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const atualizar = (id: string, patch: Partial<Item>) => setItens((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const processar = useCallback(async (arquivos: File[]) => {
    const novos: Item[] = arquivos.map((f, i) => ({ id: `${Date.now()}-${i}-${f.name}`, nome: f.name, tamanho: f.size, estado: 'lendo' }));
    setItens((xs) => [...novos, ...xs]);
    // Um por vez: não disputa CPU com a UI mesmo com dezenas de arquivos.
    for (let i = 0; i < arquivos.length; i++) {
      const f = arquivos[i];
      const id = novos[i].id;
      if (f.size > LIMITE_BYTES) { atualizar(id, { estado: 'erro', erro: 'Arquivo acima de 200 MB.' }); continue; }
      if (/^image\//.test(f.type)) { atualizar(id, { estado: 'ocr' }); continue; }
      if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { atualizar(id, { estado: 'erro', erro: 'Formato não suportado. Envie PDF (ou imagem, que entra na fila de OCR).' }); continue; }
      try {
        const r = await lerPdf(f);
        void liberarPdf(r.doc);
        const semTexto = r.paginas.every((p) => p.texto.replace(/\s/g, '').length < 20);
        if (semTexto) { atualizar(id, { estado: 'ocr', paginas: r.paginas.length, ms: r.ms, hash: r.hashArquivo }); continue; }
        atualizar(id, { estado: 'pronto', paginas: r.paginas.length, ms: r.ms, hash: r.hashArquivo, resultado: extrairDocumento(r.paginas) });
      } catch (e) {
        atualizar(id, { estado: 'erro', erro: e instanceof Error ? e.message : String(e) });
      }
    }
  }, []);

  const resumo = itens.reduce((a, it) => {
    if (it.resultado) { a.lidos++; a.alertas += it.resultado.alertas.filter((x) => x.severidade === 'alta').length; }
    if (it.estado === 'ocr') a.ocr++;
    return a;
  }, { lidos: 0, alertas: 0, ocr: 0 });

  return (
    <div className="space-y-5">
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-canvas text-accent"><ScanText className="h-5 w-5" /></span>
            <div>
              <div className={rot}>Central de Esteiras · Leitura de documentos</div>
              <div className="text-[20px] font-semibold text-ink">Leitura de documentos</div>
              <div className="max-w-2xl text-[13px] text-ink-2">
                Boletos, guias, NF-e/NFS-e, comprovantes PIX, procurações e contratos. Cada número com dígito verificador é conferido — linha digitável, chave de acesso, processo CNJ, CPF/CNPJ (inclusive alfanumérico) e PIX.
              </div>
            </div>
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-[13px] font-semibold text-[#FFFFFF] hover:opacity-90">
            <Upload className="h-4 w-4" /> Enviar documentos
          </button>
          <input ref={inputRef} type="file" multiple accept="application/pdf,.pdf,image/*" className="hidden"
            onChange={(e) => { const fs = Array.from(e.target.files || []); e.target.value = ''; if (fs.length) processar(fs); }} />
        </div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const fs = Array.from(e.dataTransfer.files || []); if (fs.length) processar(fs); }}
          className="mt-4 rounded-xl border border-dashed border-hairline-strong bg-canvas px-4 py-6 text-center text-[13px] text-ink-mute">
          Arraste um ou vários arquivos · PDF com texto é lido na hora · fotos e digitalizações vão para a fila de OCR
        </div>
        {itens.length > 0 && (
          <div className="mt-3 text-[12px] text-ink-mute">
            {itens.length} arquivo(s) · {resumo.lidos} lido(s) · {resumo.alertas} alerta(s) crítico(s){resumo.ocr ? ` · ${resumo.ocr} aguardando OCR` : ''}
            <button type="button" onClick={() => setItens([])} className="ml-3 text-accent">limpar</button>
          </div>
        )}
      </div>

      {itens.map((it) => <CardDocumento key={it.id} it={it} onRemover={() => setItens((xs) => xs.filter((x) => x.id !== it.id))} />)}
    </div>
  );
};
