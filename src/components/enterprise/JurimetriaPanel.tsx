import React, { useMemo, useState } from 'react';
import { CalendarRange, Calculator, Send, Info } from 'lucide-react';
import { scoreLiquidacao, backtest, precificarCessao, AMOSTRA_MINIMA, AVISO_JURIMETRIA, type HistoricoPagamento, type CurvaJuros } from '../../enterprise/jurimetria.ts';
import { formatBRL } from '../../enterprise/deterministicEngine.ts';
import { parseBRLToCentavos } from '../../enterprise/guardrail.ts';
import { criarPropostaCessao } from '../../services/approvalQueueService';

const hoje = () => new Date().toISOString().slice(0, 10);
const br = (d: string) => d.split('-').reverse().join('/');

function parseHistorico(txt: string): { linhas: HistoricoPagamento[]; erros: number } {
  const linhas: HistoricoPagamento[] = []; let erros = 0;
  for (const l of txt.split('\n').map((x) => x.trim()).filter(Boolean)) {
    const m = l.match(/^(\d{4}-\d{2}-\d{2})\s*[;,\t]\s*(\d{4}-\d{2}-\d{2})$/);
    if (m && m[1] <= m[2]) linhas.push({ inscricao: m[1], pagamento: m[2] }); else erros++;
  }
  return { linhas, erros };
}
function parseCurva(txt: string): CurvaJuros['pontos'] {
  return txt.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split(/[;\t]/).map((x) => Number(x.trim().replace(',', '.'))))
    .filter(([a, t]) => Number.isFinite(a) && Number.isFinite(t) && a >= 0).map(([anos, taxaAa]) => ({ anos, taxaAa }));
}

/** Gera histórico SINTÉTICO só para demonstrar a tela (rotulado como tal). */
function sintetico(): string {
  const out: string[] = []; const base = Date.parse('2019-07-01T00:00:00Z');
  for (let i = 0; i < 60; i++) {
    const insc = new Date(base + (i % 12) * 30 * 86400000);
    const pg = new Date(insc.getTime() + (540 + ((i * 37) % 420)) * 86400000);
    out.push(`${insc.toISOString().slice(0, 10)};${pg.toISOString().slice(0, 10)}`);
  }
  return out.join('\n');
}

export const JurimetriaPanel: React.FC = () => {
  const [hist, setHist] = useState('');
  const [sint, setSint] = useState(false);
  const [inscricao, setInscricao] = useState(hoje());
  const [face, setFace] = useState('');
  const [curvaTxt, setCurvaTxt] = useState('');
  const [desagio, setDesagio] = useState('');
  const [premio, setPremio] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const ph = useMemo(() => parseHistorico(hist), [hist]);
  const score = useMemo(() => scoreLiquidacao(ph.linhas, inscricao, hoje()), [ph, inscricao]);
  const bt = useMemo(() => {
    const corte = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
    return { corte, ...backtest(ph.linhas, corte) };
  }, [ph]);

  const pontos = useMemo(() => parseCurva(curvaTxt), [curvaTxt]);
  const faceCent = useMemo(() => { try { return face.trim() ? parseBRLToCentavos(face.startsWith('R$') ? face : 'R$ ' + face) : null; } catch { return null; } }, [face]);
  const vpl = useMemo(() => {
    if (score.status !== 'OK' || !faceCent || pontos.length === 0 || desagio === '' || premio === '') return null;
    return precificarCessao(faceCent, score.valor, hoje(), { fonte: 'Curva informada pelo usuário', data: hoje(), pontos }, { desagioPct: Number(desagio.replace(',', '.')), premioRiscoPct: Number(premio.replace(',', '.')) });
  }, [score, faceCent, pontos, desagio, premio]);

  const enviar = async () => {
    if (!vpl || !faceCent || score.status !== 'OK') return;
    const id = await criarPropostaCessao({ faceCentavos: faceCent, vplCentralCentavos: vpl.faixa.central, propostaCentavos: vpl.propostaCentavos, p50: score.valor.p50, n: score.n, desagioPct: Number(desagio.replace(',', '.')) });
    setMsg(`Proposta enviada como rascunho para a Fila de Aprovação (${id}).`);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-[22px] font-semibold text-ink tracking-tight">Score de Liquidação & Precificação</h2>
        <p className="text-[13.5px] text-ink-mute max-w-3xl">Toda previsão sai como faixa (P10 / P50 / P90), com o tamanho da amostra e a data dos dados. Com menos de {AMOSTRA_MINIMA} pagamentos históricos o score não é exibido. {AVISO_JURIMETRIA}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-3">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-ink"><CalendarRange className="w-4 h-4 text-accent" /> Histórico do ente devedor</div>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Pagamentos: inscrição;pagamento (AAAA-MM-DD), um por linha
            <textarea rows={7} value={hist} onChange={(e) => { setHist(e.target.value); setSint(false); }} placeholder="2021-07-01;2023-02-15" className="px-3 py-2.5 rounded-lg border border-hairline-strong bg-canvas text-[12.5px] font-mono font-normal" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setHist(sintetico()); setSint(true); }} className="h-9 px-3 rounded-lg border border-hairline-strong text-[12.5px] text-ink-2 bg-canvas hover:bg-surface">Carregar histórico sintético</button>
            {sint && <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-warn-soft text-warn">DADOS SINTÉTICOS · só para demonstração</span>}
            {ph.erros > 0 && <span className="text-[12px] text-crit">{ph.erros} linha(s) ignorada(s)</span>}
          </div>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Inscrição do precatório analisado
            <input type="date" value={inscricao} onChange={(e) => setInscricao(e.target.value)} className="h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-normal" />
          </label>
        </div>

        <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-3">
          <div className="text-[14px] font-semibold text-ink">Data provável de pagamento</div>
          {score.status === 'DADOS_INSUFICIENTES' ? (
            <div className="rounded-lg bg-surface border border-hairline px-4 py-5 text-center space-y-1">
              <div className="text-[15px] font-semibold text-ink-2">Dados insuficientes</div>
              <div className="text-[12.5px] text-ink-mute">n = {score.n} · mínimo {score.minimo} pagamentos com data até {br(score.dataBase)}</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {([['Otimista (P10)', score.valor.p10], ['Central (P50)', score.valor.p50], ['Conservador (P90)', score.valor.p90]] as const).map(([l, d]) => (
                  <div key={l} className="bg-surface rounded-lg px-3 py-3"><div className="text-[11.5px] text-ink-mute">{l}</div><div className="font-mono text-[16px] font-semibold text-ink">{br(d)}</div></div>
                ))}
              </div>
              <div className="text-[12.5px] text-ink-2">Amostra n = {score.n} · dados até {br(score.dataBase)} · prazo central {score.valor.prazosDias.p50} dias</div>
              <div className="text-[12.5px] text-ink-2">Backtest (corte {br(bt.corte)}): {bt.maeDias === null ? 'sem pagamentos posteriores ao corte para validar' : `erro médio de ${bt.maeDias} dias em ${bt.n} pagamento(s)`}</div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-4">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink"><Calculator className="w-4 h-4 text-accent" /> Precificação da cessão (VPL)</div>
        <div className="grid md:grid-cols-4 gap-3">
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Valor de face
            <input value={face} onChange={(e) => setFace(e.target.value)} placeholder="R$ 1.250.000,00" className="h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-mono font-normal" />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Deságio do cliente (%)
            <input value={desagio} onChange={(e) => setDesagio(e.target.value)} inputMode="decimal" className="h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-normal" />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Prêmio de risco (% a.a.)
            <input value={premio} onChange={(e) => setPremio(e.target.value)} inputMode="decimal" className="h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-normal" />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2 md:row-span-2">Curva de juros: anos;taxa % a.a.
            <textarea rows={4} value={curvaTxt} onChange={(e) => setCurvaTxt(e.target.value)} placeholder={'0,5;10,5\n2;11\n5;11,8'} className="px-3 py-2 rounded-lg border border-hairline-strong bg-canvas text-[12.5px] font-mono font-normal" />
          </label>
        </div>
        <div className="flex items-start gap-2 text-[12px] text-ink-mute"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Use a ETTJ pública da ANBIMA do dia. O prêmio de risco deve refletir a classificação do Shield de Risco.</div>
        {!vpl ? (
          <div className="text-[12.5px] text-ink-mute">Preencha o valor de face, a curva, o deságio e o prêmio — e tenha um score válido — para calcular.</div>
        ) : (
          <div className="space-y-3">
            <div className="grid md:grid-cols-4 gap-3">
              {([['VPL otimista', vpl.faixa.otimista], ['VPL central', vpl.faixa.central], ['VPL conservador', vpl.faixa.conservador], ['Proposta (rascunho)', vpl.propostaCentavos]] as const).map(([l, v]) => (
                <div key={l} className="bg-surface rounded-lg px-3 py-3"><div className="text-[11.5px] text-ink-mute">{l}</div><div className="font-mono text-[16px] font-semibold text-ink">{formatBRL(v)}</div></div>
              ))}
            </div>
            <div className="text-[12px] text-ink-mute font-mono">{vpl.formula}</div>
            <button type="button" onClick={enviar} className="h-10 px-4 rounded-lg bg-accent text-[#FFFFFF] text-[13px] font-semibold flex items-center gap-2"><Send className="w-4 h-4" /> Enviar para a Fila de Aprovação</button>
          </div>
        )}
        {msg && <div role="status" className="text-[13px] text-good">{msg}</div>}
      </div>
    </div>
  );
};

export default JurimetriaPanel;
