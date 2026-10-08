import React, { useMemo, useState } from 'react';
import { ShieldCheck, ShieldAlert, BookOpen } from 'lucide-react';
import { verificarTexto, parseBRLToCentavos } from '../../enterprise/guardrail.ts';
import { NormaRegistry, NORMAS_SEED } from '../../enterprise/normaRef.ts';
import { formatBRL } from '../../enterprise/deterministicEngine.ts';

const normas = new NormaRegistry(NORMAS_SEED);
const EXEMPLO_TEXTO = 'Nos termos da Lei nº 9.250/1995, o crédito de R$ 48.230,00, atualizado pela SELIC, totaliza R$ 54.355,40. Em caso de lançamento, aplica-se multa de ofício de 75% (Lei 9.430/96).';
const EXEMPLO_VALORES = 'R$ 48.230,00\nR$ 54.355,40';

function parseValores(txt: string): { centavos: number[]; invalidos: string[] } {
  const centavos: number[] = []; const invalidos: string[] = [];
  for (const raw of txt.split('\n').map((l) => l.trim()).filter(Boolean)) {
    try { centavos.push(parseBRLToCentavos(raw.startsWith('R$') ? raw : 'R$ ' + raw)); } catch { invalidos.push(raw); }
  }
  return { centavos, invalidos };
}

export const GuardrailPanel: React.FC = () => {
  const [texto, setTexto] = useState(EXEMPLO_TEXTO);
  const [valores, setValores] = useState(EXEMPLO_VALORES);
  const [dataRef, setDataRef] = useState(new Date().toISOString().slice(0, 10));
  const pv = useMemo(() => parseValores(valores), [valores]);
  const r = useMemo(() => verificarTexto(texto, { centavos: pv.centavos }, normas, dataRef), [texto, pv, dataRef]);
  const ok = r.status === 'APROVADO';

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-[22px] font-semibold text-ink tracking-tight">Guardrail anti-alucinação</h2>
        <p className="text-[13.5px] text-ink-mute max-w-3xl">O LLM só redige. Todo valor em R$, todo percentual e toda citação legal do texto precisam vir do motor de cálculo determinístico ou da base normativa local — senão a emissão é bloqueada. Teste qualquer trecho de laudo abaixo.</p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Texto redigido pelo LLM
          <textarea rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} className="px-3 py-2.5 rounded-lg border border-hairline-strong bg-canvas text-[13.5px] font-normal leading-relaxed" />
        </label>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Valores calculados pelo motor (um por linha)
            <textarea rows={5} value={valores} onChange={(e) => setValores(e.target.value)} className="px-3 py-2.5 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-mono font-normal" />
          </label>
          {pv.invalidos.length > 0 && <div className="text-[12px] text-crit">Linhas inválidas: {pv.invalidos.join(', ')}</div>}
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Data de referência (vigência)
            <input type="date" value={dataRef} onChange={(e) => setDataRef(e.target.value)} className="h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-normal" />
          </label>
        </div>
      </div>

      <div className={`rounded-xl border px-5 py-4 space-y-2 ${ok ? 'border-good/25 bg-good-soft/60' : 'border-crit/25 bg-crit-soft/60'}`}>
        <div className={`flex items-center gap-2 text-[15px] font-semibold ${ok ? 'text-good' : 'text-crit'}`}>
          {ok ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          {ok ? 'Aprovado: todos os valores e citações são rastreáveis' : 'Bloqueado: há itens sem origem'}
        </div>
        {[['Valores sem origem no cálculo', r.valoresNaoRastreados], ['Percentuais sem origem', r.percentuaisNaoRastreados], ['Citações fora da base normativa', r.citacoesDesconhecidas], ['Citações fora de vigência', r.citacoesNaoVigentes]]
          .filter(([, v]) => (v as string[]).length > 0)
          .map(([l, v]) => <div key={l as string} className="text-[13px] text-ink-2"><span className="font-medium">{l as string}:</span> {(v as string[]).join(' · ')}</div>)}
        {pv.centavos.length > 0 && <div className="text-[12px] text-ink-mute">Valores do motor considerados: {pv.centavos.map(formatBRL).join(' · ')}</div>}
      </div>

      <div className="rounded-xl border border-hairline bg-canvas">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-hairline text-[13px] font-semibold text-ink"><BookOpen className="w-4 h-4" /> Base normativa local ({normas.all().length} normas)</div>
        {normas.all().map((n) => (
          <div key={n.id} className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)_minmax(0,1.2fr)] gap-2 md:gap-4 px-5 py-3 border-b border-hairline last:border-b-0 text-[12.5px]">
            <code className="font-mono text-ink">{n.id}</code>
            <span className="text-ink-2">{n.ementa}{n.parametros ? ` · parâmetros: ${Object.entries(n.parametros).map(([k, v]) => `${k}=${v}`).join(', ')}` : ''}</span>
            <span className="text-ink-mute">vigente desde {n.vigenciaInicio.split('-').reverse().join('/')}</span>
          </div>
        ))}
        <div className="px-5 py-3 text-[12px] text-warn bg-warn-soft/50 rounded-b-xl">Base mínima para demonstração. A base completa (IN RFB, Soluções de Consulta COSIT, Temas STF/STJ) é mantida e revisada pelo responsável jurídico.</div>
      </div>
    </div>
  );
};

export default GuardrailPanel;
