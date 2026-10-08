import React, { useState } from 'react';
import { FileCheck2, FileWarning, Upload, Search, BadgeCheck } from 'lucide-react';
import { authFetch } from '../../services/authClient';

async function sha256File(f: File): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', await f.arrayBuffer());
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface SealRecord {
  laudoId: string;
  versao: number;
  esteira: string;
  payloadHash: string;
  emitidoEmUTC: string;
  signatario: { nome: string; registroClasse: string };
  selo: string;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/^0x/, '');
const isHex64 = (s: string) => /^[0-9a-f]{64}$/.test(s);

/**
 * Autenticidade de laudo (P13/P20).
 * 1) Consulta do selo no registro do servidor (data, signatário, versão) — escopo do tenant logado.
 * 2) Hash SHA-256 de um arquivo, calculado no navegador (o arquivo não sai da máquina).
 * O selo registrado é o hash do CONTEÚDO do laudo (JSON canônico), não dos bytes do PDF.
 */
export const VerifySealPanel: React.FC = () => {
  const [selo, setSelo] = useState('');
  const [consulta, setConsulta] = useState<{ estado: 'idle' | 'buscando' | 'ok' | 'nao' | 'erro'; rec?: SealRecord; msg?: string }>({ estado: 'idle' });

  const [arquivo, setArquivo] = useState<{ nome: string; tamanho: number; hash: string } | null>(null);
  const [esperado, setEsperado] = useState('');
  const [calc, setCalc] = useState(false);

  const consultar = async () => {
    const s = norm(selo);
    if (!isHex64(s)) { setConsulta({ estado: 'erro', msg: 'O selo tem 64 caracteres hexadecimais.' }); return; }
    setConsulta({ estado: 'buscando' });
    try {
      const res = await authFetch(`/api/enterprise/seals/by-hash/${s}`);
      if (res.status === 404) { setConsulta({ estado: 'nao' }); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      setConsulta({ estado: 'ok', rec: data as SealRecord });
    } catch (e) {
      setConsulta({ estado: 'erro', msg: (e as Error).message });
    }
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    setCalc(true);
    try { setArquivo({ nome: f.name, tamanho: f.size, hash: await sha256File(f) }); } finally { setCalc(false); }
  };
  const esp = norm(esperado);
  const comparacao = arquivo && isHex64(esp) ? (esp === arquivo.hash ? 'igual' : 'diferente') : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-1.5">
        <h2 className="text-[22px] font-semibold text-ink tracking-tight">Verificar autenticidade de laudo</h2>
        <p className="text-[13.5px] text-ink-mute">Consulte o selo impresso no laudo no registro do servidor, ou calcule o SHA-256 de um arquivo aqui mesmo, sem enviá-lo.</p>
      </div>

      <section className="rounded-xl border border-hairline bg-canvas p-5 space-y-3">
        <div className="text-[14px] font-semibold text-ink">Consultar selo no registro</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={selo} onChange={(e) => setSelo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void consultar(); }}
            placeholder="selo do laudo (64 caracteres)" className="flex-1 h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[12.5px] font-mono" />
          <button type="button" onClick={consultar} disabled={consulta.estado === 'buscando'}
            className="h-10 px-4 rounded-lg bg-accent text-[#FFFFFF] text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            <Search className="w-4 h-4" /> {consulta.estado === 'buscando' ? 'Consultando…' : 'Consultar'}
          </button>
        </div>
        {consulta.estado === 'ok' && consulta.rec && (
          <div className="rounded-lg border border-good/25 bg-good-soft/50 p-4 space-y-1.5 text-[12.5px] text-ink-2">
            <div className="flex items-center gap-2 text-[13.5px] font-semibold text-good"><BadgeCheck className="w-5 h-5" /> Selo registrado</div>
            <div>Laudo <span className="font-mono text-ink">{consulta.rec.laudoId}</span> · versão {consulta.rec.versao}</div>
            <div>Emitido em {new Date(consulta.rec.emitidoEmUTC).toLocaleString('pt-BR')} (UTC {consulta.rec.emitidoEmUTC})</div>
            <div>Signatário: {consulta.rec.signatario.nome} · {consulta.rec.signatario.registroClasse}</div>
            <div className="break-all">Hash do conteúdo aprovado: <code className="font-mono">{consulta.rec.payloadHash}</code></div>
            <div className="text-[12px] text-ink-mute">Assinatura ICP-Brasil e carimbo do tempo: ainda não configurados.</div>
          </div>
        )}
        {consulta.estado === 'nao' && <div className="flex items-center gap-2 text-[13.5px] font-semibold text-crit"><FileWarning className="w-5 h-5" /> Selo não encontrado no registro deste escritório.</div>}
        {consulta.estado === 'erro' && <div className="text-[12.5px] text-crit">{consulta.msg}</div>}
      </section>

      <section className="space-y-3">
        <div className="text-[14px] font-semibold text-ink">Hash de um arquivo</div>
        <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-hairline-strong rounded-xl py-10 bg-surface cursor-pointer hover:bg-surface-hover">
          <Upload className="w-6 h-6 text-ink-mute" />
          <span className="text-[13.5px] text-ink-2 font-medium">{calc ? 'Calculando…' : 'Escolher arquivo'}</span>
          <input type="file" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>

        {arquivo && (
          <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-3">
            <div className="text-[13px] text-ink-2"><span className="font-medium text-ink">{arquivo.nome}</span> · {(arquivo.tamanho / 1024).toFixed(1)} KB</div>
            <div>
              <div className="text-[12px] text-ink-mute">SHA-256 do arquivo</div>
              <code className="font-mono text-[13px] text-ink break-all">{arquivo.hash}</code>
            </div>
            <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Hash de referência do arquivo (opcional)
              <input value={esperado} onChange={(e) => setEsperado(e.target.value)} placeholder="cole aqui os 64 caracteres" className="h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[12.5px] font-mono font-normal" />
            </label>
            {comparacao === 'igual' && <div className="flex items-center gap-2 text-[13.5px] font-semibold text-good"><FileCheck2 className="w-5 h-5" /> O arquivo é idêntico à referência.</div>}
            {comparacao === 'diferente' && <div className="flex items-center gap-2 text-[13.5px] font-semibold text-crit"><FileWarning className="w-5 h-5" /> O arquivo difere da referência.</div>}
            <div className="text-[12px] text-ink-mute">O mesmo resultado pode ser conferido com <code className="font-mono">sha256sum</code> ou OpenSSL.</div>
          </div>
        )}
      </section>
    </div>
  );
};

export default VerifySealPanel;
