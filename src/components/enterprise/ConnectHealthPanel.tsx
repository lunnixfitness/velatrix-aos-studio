import React, { useMemo, useState } from 'react';
import { PlugZap, CircleSlash, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { CATALOGO_CONECTORES, saudeConector, proximaTentativa, type SaudeStatus, type Fase } from '../../enterprise/connect.ts';

const STATUS_UI: Record<SaudeStatus, { label: string; cls: string; Icon: React.FC<{ className?: string }> }> = {
  OK: { label: 'Ativo', cls: 'bg-good-soft text-good', Icon: CheckCircle2 },
  ERRO: { label: 'Erro', cls: 'bg-crit-soft text-crit', Icon: AlertTriangle },
  NAO_CONFIGURADO: { label: 'Não configurado', cls: 'bg-surface text-ink-mute border border-hairline', Icon: Clock },
  NAO_SUPORTADO: { label: 'Não suportado', cls: 'bg-surface text-ink-mute border border-hairline', Icon: CircleSlash },
  SOMENTE_INTERFACE: { label: 'Sob demanda', cls: 'bg-accent-soft text-accent', Icon: PlugZap },
};
const FASE_LABEL: Record<Fase, string> = { A: 'Fase A · APIs oficiais', B: 'Fase B · ERPs com API pública', C: 'Fase C · Enterprise sob demanda' };
const AUTH_LABEL: Record<string, string> = {
  API_KEY_PROCURACAO: 'Chave + procuração eletrônica', CERTIFICADO_A1: 'Certificado A1 do cliente', PUBLICA: 'API pública',
  OAUTH2: 'OAuth2', ARQUIVO_SFTP: 'Arquivo (SFTP/pasta)', NENHUM: '—',
};

export const ConnectHealthPanel: React.FC = () => {
  // Sem cofre de credenciais conectado ainda: nenhuma credencial cadastrada (estado real, não simulado).
  const linhas = useMemo(() => CATALOGO_CONECTORES.map((c) => ({ c, s: saudeConector(c, { temCredencial: false }) })), []);
  const [fase, setFase] = useState<Fase | 'todas'>('todas');
  const vis = linhas.filter((l) => fase === 'todas' || l.c.fase === fase);
  const backoff = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((t) => proximaTentativa(t));

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-[22px] font-semibold text-ink tracking-tight">Velatrix Connect · Saúde dos Conectores</h2>
        <p className="text-[13.5px] text-ink-mute max-w-3xl">Ingestão passiva por consulta agendada às APIs oficiais — portais do governo não enviam webhooks. Webhook só para ERPs que oferecem. Cada documento coletado recebe hash SHA-256, origem e data no ledger, e eventos relevantes viram itens na Fila de Aprovação (nunca ação automática).</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['todas', 'A', 'B', 'C'] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFase(f)} className={`h-9 px-3.5 rounded-full text-[12.5px] border ${fase === f ? 'bg-accent text-[#FFFFFF] border-accent' : 'bg-canvas text-ink-2 border-hairline-strong hover:bg-surface'}`}>
            {f === 'todas' ? 'Todas as fases' : FASE_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="border border-hairline rounded-xl overflow-hidden bg-canvas">
        <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,2.4fr)] gap-4 px-5 py-2.5 bg-surface border-b border-hairline text-[11px] font-semibold uppercase tracking-wide text-ink-mute">
          <span>Fonte</span><span>Modo</span><span>Autenticação</span><span>Status</span><span>Observação</span>
        </div>
        {vis.map(({ c, s }) => {
          const ui = STATUS_UI[s.status];
          return (
            <div key={c.id} className="grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,2.4fr)] gap-2 md:gap-4 px-5 py-3.5 border-b border-hairline last:border-b-0 text-[13px] items-start">
              <div><div className="font-medium text-ink">{c.fonte}</div><div className="text-[11.5px] text-ink-mute">{FASE_LABEL[c.fase]}{c.cursor ? ` · cursor: ${c.cursor}` : ''}</div></div>
              <div className="text-ink-2">{c.modo === 'POLLING' ? 'Consulta agendada' : c.modo === 'WEBHOOK' ? 'Webhook do ERP' : c.modo === 'ARQUIVO' ? 'Arquivo' : '—'}</div>
              <div className="text-ink-2">{AUTH_LABEL[c.authType]}</div>
              <div><span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${ui.cls}`}><ui.Icon className="w-3.5 h-3.5" />{ui.label}</span></div>
              <div className="text-[12.5px] text-ink-2">{c.observacao}</div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-2">
          <div className="text-[13px] font-semibold text-ink">Política de nova tentativa</div>
          <div className="text-[12.5px] text-ink-mute">Espera exponencial; após 8 falhas o job vai para a fila de falhas (DLQ) para análise.</div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {backoff.map((b, i) => <span key={i} className="font-mono text-[11.5px] px-2 py-1 rounded bg-surface text-ink-2">{i + 1}ª: {b.acao === 'DLQ' ? 'DLQ' : b.atrasoMs >= 60000 ? `${Math.round(b.atrasoMs / 60000)} min` : `${b.atrasoMs / 1000} s`}</span>)}
          </div>
        </div>
        <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-2">
          <div className="text-[13px] font-semibold text-ink">Garantias</div>
          <ul className="text-[12.5px] text-ink-2 space-y-1 list-disc pl-4">
            <li>Um documento nunca é processado duas vezes (chave tenant + fonte + documento).</li>
            <li>Limite de requisições por fonte e por cliente.</li>
            <li>Credenciais e certificado A1 ficam só no cofre do servidor.</li>
            <li>Sem raspagem de portal com login de usuário.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConnectHealthPanel;
