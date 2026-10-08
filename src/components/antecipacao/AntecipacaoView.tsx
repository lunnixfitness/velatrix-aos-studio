/**
 * VELATRIX AOS · Antecipação de Precatórios & RPVs (Esteira Precatória → sub-aba "Antecipação")
 *
 * O advogado cadastra o crédito do cliente (e/ou seus honorários), a Velatrix faz a triagem,
 * estima o prazo constitucional e compradores parceiros fazem ofertas. O escritório escolhe,
 * o sócio aprova, o cliente aceita e a cessão é formalizada (CF art. 100 §§13-14).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, BadgeCheck, Calculator, CheckCircle2, ChevronRight, CircleDashed, ClipboardCopy, FilePlus, Gavel, Info, Landmark,
  RefreshCw, ShieldAlert, ShieldCheck, XCircle,
} from 'lucide-react';
import {
  antecipacaoApi, ErroAntecipacaoApi, reaisParaCentavos, percentualParaBps, brl, pctBps, type CompradorPublico,
} from '../../services/antecipacaoApi';
import type { RegistroCredito, PainelAntecipacao, CanalAceite } from '../../types/antecipacaoEsteira';
import type { Flag, ItemFormalizacao, Oferta, ParcelaId, StatusCredito } from '../../antecipacao/tipos';
import { validarNumeroCnj, validarCpf, validarCnpj, CHECKLIST_FORMALIZACAO, cascataBaseCedivel } from '../../antecipacao/motor';

// ───────────────────────── rótulos & estilos ─────────────────────────

const STATUS_LABEL: Record<StatusCredito, string> = {
  ANALISADO: 'Ofertas recebidas', BLOQUEADO: 'Bloqueado na triagem', OFERTA_ESCOLHIDA: 'Aguardando aprovação do sócio',
  APROVADO_INTERNO: 'Aguardando aceite do cliente', ACEITO_CLIENTE: 'Aceito pelo cliente', FORMALIZACAO: 'Em formalização',
  PAGO: 'Pago', CANCELADO: 'Cancelado',
};
const STATUS_CLS: Record<StatusCredito, string> = {
  ANALISADO: 'border-[#C7D7FE] bg-[#EEF4FF] text-[#3538CD]', BLOQUEADO: 'border-[#F4C7C3] bg-[#FEF3F2] text-[#B42318]',
  OFERTA_ESCOLHIDA: 'border-[#F1D9A8] bg-[#FFF8EA] text-[#7A4F00]', APROVADO_INTERNO: 'border-[#F1D9A8] bg-[#FFF8EA] text-[#7A4F00]',
  ACEITO_CLIENTE: 'border-[#C7D7FE] bg-[#EEF4FF] text-[#3538CD]', FORMALIZACAO: 'border-[#C7D7FE] bg-[#EEF4FF] text-[#3538CD]',
  PAGO: 'border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]', CANCELADO: 'border-hairline bg-surface text-ink-mute',
};
const FLAG: Record<Flag, { label: string; cls: string }> = {
  GREEN: { label: 'Risco baixo', cls: 'border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]' },
  YELLOW: { label: 'Atenção', cls: 'border-[#F1D9A8] bg-[#FFF8EA] text-[#7A4F00]' },
  RED: { label: 'Bloqueado', cls: 'border-[#F4C7C3] bg-[#FEF3F2] text-[#B42318]' },
  NAO_AVALIADO: { label: 'Não avaliado', cls: 'border-hairline bg-surface text-ink-mute' },
};
const PARCELA_LABEL: Record<ParcelaId, string> = {
  CREDOR: 'Crédito do cliente', HONORARIOS_CONTRATUAIS: 'Honorários contratuais (destacados)', HONORARIOS_SUCUMBENCIAIS: 'Honorários sucumbenciais',
};
const ETAPAS: Array<{ id: StatusCredito[]; label: string }> = [
  { id: ['ANALISADO', 'BLOQUEADO'], label: 'Triagem & ofertas' },
  { id: ['OFERTA_ESCOLHIDA'], label: 'Aprovação do sócio' },
  { id: ['APROVADO_INTERNO'], label: 'Aceite do cliente' },
  { id: ['ACEITO_CLIENTE', 'FORMALIZACAO'], label: 'Formalização' },
  { id: ['PAGO'], label: 'Pago' },
];
const ORDEM: StatusCredito[] = ['ANALISADO', 'OFERTA_ESCOLHIDA', 'APROVADO_INTERNO', 'ACEITO_CLIENTE', 'FORMALIZACAO', 'PAGO'];
const dataBr = (d?: string | null) => (d ? new Date(d.length === 10 ? d + 'T12:00:00Z' : d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—');
const dataHoraBr = (d: string) => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const msgErro = (e: unknown) => {
  if (e instanceof ErroAntecipacaoApi) return e.campos.length ? `${e.message}: ${e.campos.map((c) => `${c.campo} (${c.msg})`).join('; ')}` : e.message;
  return (e as Error)?.message ?? 'erro';
};

// ───────────────────────── blocos ─────────────────────────

function Chip({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[12px] font-medium ' + cls}>{children}</span>;
}
function Card({ titulo, icone, acao, children, className = '' }: { titulo: string; icone?: React.ReactNode; acao?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={'rounded-xl border border-hairline bg-canvas ' + className}>
      <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-ink">{icone}{titulo}</h3>
        {acao}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
function Botao({ children, onClick, primario, disabled, perigo }: { children: React.ReactNode; onClick?: () => void; primario?: boolean; disabled?: boolean; perigo?: boolean }) {
  const cls = primario
    ? 'bg-accent text-[#FFFFFF] hover:opacity-90'
    : perigo ? 'border border-[#F4C7C3] bg-canvas text-[#B42318] hover:bg-[#FEF3F2]' : 'border border-hairline bg-canvas text-ink hover:border-hairline-strong';
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ' + cls}>
      {children}
    </button>
  );
}
function Alerta({ tipo, children }: { tipo: 'erro' | 'aviso' | 'info' | 'ok'; children: React.ReactNode }) {
  const cls = { erro: 'border-[#F4C7C3] bg-[#FEF3F2] text-[#B42318]', aviso: 'border-[#F1D9A8] bg-[#FFF8EA] text-[#7A4F00]', info: 'border-hairline bg-surface text-ink-2', ok: 'border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]' }[tipo];
  return <div role={tipo === 'erro' ? 'alert' : 'note'} className={'rounded-lg border px-3 py-2 text-[13px] ' + cls}>{children}</div>;
}

// ───────────────────────── formulário ─────────────────────────

interface FormState {
  tipo: 'PRECATORIO' | 'RPV'; numeroProcesso: string; tribunal: string; esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL'; enteDevedor: string; ufEnte: string;
  natureza: 'ALIMENTAR' | 'COMUM'; credorNome: string; credorDoc: string; credorNasc: string; doencaGrave: boolean; deficiencia: boolean;
  valorFace: string; dataBase: string; dataRequisicao: string; transito: boolean; honContratuais: string; honSucumbenciais: string; cessoes: string;
  penhora: boolean; herdeiros: boolean; rescisoria: boolean; impugnacao: boolean; parcelas: ParcelaId[];
}
const hoje = () => new Date().toISOString().slice(0, 10);
const FORM_INICIAL = (): FormState => ({
  tipo: 'PRECATORIO', numeroProcesso: '', tribunal: '', esfera: 'FEDERAL', enteDevedor: '', ufEnte: '', natureza: 'ALIMENTAR',
  credorNome: '', credorDoc: '', credorNasc: '', doencaGrave: false, deficiencia: false, valorFace: '', dataBase: hoje().slice(0, 8) + '01',
  dataRequisicao: '', transito: true, honContratuais: '30', honSucumbenciais: '', cessoes: '0',
  penhora: false, herdeiros: false, rescisoria: false, impugnacao: false, parcelas: ['CREDOR'],
});

const inputCls = 'w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none';
function Campo({ label, dica, erro, children }: { label: string; dica?: string; erro?: string | null; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {erro ? <span className="mt-1 block text-[12px] text-[#B42318]">{erro}</span> : dica ? <span className="mt-1 block text-[12px] text-ink-mute">{dica}</span> : null}
    </label>
  );
}
function Check({ label, checked, onChange, dica }: { label: string; checked: boolean; onChange: (v: boolean) => void; dica?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-[13px] text-ink-2">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--accent)]" checked={checked} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)} />
      <span>{label}{dica && <span className="block text-[12px] text-ink-mute">{dica}</span>}</span>
    </label>
  );
}

function NovoCredito({ onCriado, onCancelar }: { onCriado: (r: RegistroCredito) => void; onCancelar: () => void }) {
  const [f, setF] = useState<FormState>(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((x) => ({ ...x, [k]: v }));

  const cnj = f.numeroProcesso.replace(/\D/g, '').length === 20 ? validarNumeroCnj(f.numeroProcesso) : null;
  const docDig = f.credorDoc.replace(/\D/g, '');
  const docOk = docDig.length === 11 ? validarCpf(docDig) : docDig.length === 14 ? validarCnpj(docDig) : null;
  const face = reaisParaCentavos(f.valorFace);
  const bps = percentualParaBps(f.honContratuais);
  const sucumb = f.honSucumbenciais.trim() ? reaisParaCentavos(f.honSucumbenciais) : 0;

  const enviar = async () => {
    setErro(null);
    if (face === null || face <= 0) return setErro('Informe o valor de face (ex.: 485.000,00).');
    if (bps === null || bps > 5000) return setErro('Honorários contratuais entre 0% e 50%.');
    if (sucumb === null) return setErro('Valor de honorários sucumbenciais inválido.');
    setEnviando(true);
    try {
      const r = await antecipacaoApi.cadastrar({
        tipo: f.tipo, numeroProcesso: f.numeroProcesso, tribunal: f.tribunal.trim().toUpperCase(), esfera: f.esfera, enteDevedor: f.enteDevedor,
        ufEnte: f.ufEnte ? f.ufEnte.toUpperCase() : undefined, natureza: f.natureza,
        credor: { nome: f.credorNome, documento: docDig, dataNascimento: f.credorNasc || undefined, doencaGrave: f.doencaGrave, deficiencia: f.deficiencia },
        valorFaceCentavos: face, dataBase: f.dataBase, dataRequisicao: f.dataRequisicao || undefined, transitoEmJulgado: f.transito,
        honorariosContratuaisBps: bps, honorariosSucumbenciaisCentavos: sucumb, cessoesAnteriores: Number(f.cessoes) || 0,
        declaracoes: { penhoraConhecida: f.penhora, herdeirosPendentes: f.herdeiros, acaoRescisoria: f.rescisoria, impugnacaoCalculosPendente: f.impugnacao },
        parcelasParaAntecipar: f.parcelas,
      });
      onCriado(r);
    } catch (e) { setErro(msgErro(e)); } finally { setEnviando(false); }
  };
  const toggleParcela = (p: ParcelaId) => set('parcelas', f.parcelas.includes(p) ? f.parcelas.filter((x) => x !== p) : [...f.parcelas, p]);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onCancelar} className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Carteira</button>
      <div>
        <h2 className="text-[20px] font-semibold tracking-tight text-ink">Cadastrar crédito para antecipação</h2>
        <p className="mt-1 text-[13px] text-ink-mute">A triagem e as ofertas saem na hora. Nada é enviado ao cliente sem aprovação do sócio.</p>
      </div>
      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      <Card titulo="Processo e requisição" icone={<Landmark className="h-4 w-4 text-accent" />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Campo label="Tipo">
            <select className={inputCls} value={f.tipo} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('tipo', e.target.value as FormState['tipo'])}>
              <option value="PRECATORIO">Precatório</option><option value="RPV">RPV (requisição de pequeno valor)</option>
            </select>
          </Campo>
          <Campo label="Número do processo (CNJ)" erro={cnj && !cnj.valido ? `Dígito verificador não confere (${cnj.normalizado})` : null} dica={cnj?.valido ? `✓ ${cnj.normalizado}` : 'NNNNNNN-DD.AAAA.J.TR.OOOO'}>
            <input className={inputCls} value={f.numeroProcesso} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('numeroProcesso', e.target.value)} placeholder="0012345-67.2023.4.03.6100" />
          </Campo>
          <Campo label="Tribunal" dica="Sigla: TRF3, TJSP, TRT2…">
            <input className={inputCls} value={f.tribunal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('tribunal', e.target.value)} placeholder="TRF3" />
          </Campo>
          <Campo label="Esfera do devedor">
            <select className={inputCls} value={f.esfera} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('esfera', e.target.value as FormState['esfera'])}>
              <option value="FEDERAL">Federal</option><option value="ESTADUAL">Estadual</option><option value="MUNICIPAL">Municipal</option>
            </select>
          </Campo>
          <Campo label="Ente devedor" dica="Ex.: União, INSS, Estado de São Paulo, Município de Campinas">
            <input className={inputCls} value={f.enteDevedor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('enteDevedor', e.target.value)} />
          </Campo>
          <Campo label="UF do ente (opcional)">
            <input className={inputCls} maxLength={2} value={f.ufEnte} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('ufEnte', e.target.value.toUpperCase())} />
          </Campo>
          <Campo label="Natureza">
            <select className={inputCls} value={f.natureza} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('natureza', e.target.value as FormState['natureza'])}>
              <option value="ALIMENTAR">Alimentar</option><option value="COMUM">Comum</option>
            </select>
          </Campo>
          <Campo label="Valor de face (R$)" erro={f.valorFace && face === null ? 'Valor inválido' : null} dica={face ? brl(face) : 'Valor requisitado, incluindo honorários destacados'}>
            <input className={inputCls} inputMode="decimal" value={f.valorFace} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('valorFace', e.target.value)} placeholder="485.000,00" />
          </Campo>
          <Campo label="Data-base do valor">
            <input type="date" className={inputCls} value={f.dataBase} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('dataBase', e.target.value)} />
          </Campo>
          <Campo label={f.tipo === 'PRECATORIO' ? 'Data de apresentação do precatório' : 'Data de expedição da RPV'} dica={f.tipo === 'PRECATORIO' ? 'Define o exercício de pagamento (corte de 2 de abril)' : 'Prazo legal de 2 meses a partir daqui'}>
            <input type="date" className={inputCls} value={f.dataRequisicao} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('dataRequisicao', e.target.value)} />
          </Campo>
          <Campo label="Cessões anteriores">
            <input className={inputCls} inputMode="numeric" value={f.cessoes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('cessoes', e.target.value.replace(/\D/g, ''))} />
          </Campo>
          <div className="flex items-end pb-2"><Check label="Trânsito em julgado" checked={f.transito} onChange={(v) => set('transito', v)} /></div>
        </div>
      </Card>

      <Card titulo="Credor (cliente)" icone={<BadgeCheck className="h-4 w-4 text-accent" />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Campo label="Nome completo / razão social"><input className={inputCls} value={f.credorNome} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('credorNome', e.target.value)} /></Campo>
          <Campo label="CPF ou CNPJ" erro={docOk === false ? 'Documento inválido' : null} dica={docOk ? '✓ válido' : undefined}>
            <input className={inputCls} inputMode="numeric" value={f.credorDoc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('credorDoc', e.target.value)} />
          </Campo>
          <Campo label="Data de nascimento (opcional)" dica="Idoso com crédito alimentar tem preferência (CF 100 §2º)">
            <input type="date" className={inputCls} value={f.credorNasc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('credorNasc', e.target.value)} />
          </Campo>
          <Check label="Portador de doença grave" checked={f.doencaGrave} onChange={(v) => set('doencaGrave', v)} />
          <Check label="Pessoa com deficiência" checked={f.deficiencia} onChange={(v) => set('deficiencia', v)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card titulo="O que antecipar" icone={<Gavel className="h-4 w-4 text-accent" />}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Campo label="Honorários contratuais destacados (%)" erro={bps === null ? 'Percentual inválido' : null} dica="Destacados no ofício (EAOAB art. 22 §4º)">
              <input className={inputCls} inputMode="decimal" value={f.honContratuais} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('honContratuais', e.target.value)} />
            </Campo>
            <Campo label="Honorários sucumbenciais (R$)" dica="Requisição própria do advogado">
              <input className={inputCls} inputMode="decimal" value={f.honSucumbenciais} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('honSucumbenciais', e.target.value)} placeholder="0,00" />
            </Campo>
          </div>
          <div className="mt-4 space-y-2">
            {(Object.keys(PARCELA_LABEL) as ParcelaId[]).map((p) => <Check key={p} label={PARCELA_LABEL[p]} checked={f.parcelas.includes(p)} onChange={() => toggleParcela(p)} />)}
          </div>
        </Card>
        <Card titulo="Declarações do advogado" icone={<ShieldAlert className="h-4 w-4 text-accent" />}>
          <p className="mb-3 text-[12px] text-ink-mute">Marque o que você sabe sobre o processo. Declarações falsas invalidam a cessão.</p>
          <div className="space-y-2">
            <Check label="Há penhora ou bloqueio sobre o crédito" checked={f.penhora} onChange={(v) => set('penhora', v)} />
            <Check label="Há herdeiros/sucessores pendentes de habilitação" checked={f.herdeiros} onChange={(v) => set('herdeiros', v)} />
            <Check label="Há ação rescisória contra o título" checked={f.rescisoria} onChange={(v) => set('rescisoria', v)} />
            <Check label="Há impugnação de cálculos pendente" checked={f.impugnacao} onChange={(v) => set('impugnacao', v)} />
          </div>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Botao onClick={onCancelar}>Cancelar</Botao>
        <Botao primario disabled={enviando || f.parcelas.length === 0} onClick={enviar}>{enviando ? 'Analisando…' : 'Analisar e buscar ofertas'}</Botao>
      </div>
    </div>
  );
}

// ───────────────────────── detalhe ─────────────────────────

function Etapas({ status }: { status: StatusCredito }) {
  const atual = status === 'BLOQUEADO' ? 0 : status === 'CANCELADO' ? -1 : ETAPAS.findIndex((e) => e.id.includes(status));
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[12px]">
      {ETAPAS.map((e, i) => {
        const feito = status === 'PAGO' || (atual > i);
        const ativo = atual === i && status !== 'PAGO';
        return (
          <li key={e.label} className="flex items-center gap-2">
            <span className={'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ' +
              (feito ? 'border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]' : ativo ? 'border-accent bg-accent-tint text-accent' : 'border-hairline text-ink-mute')}>
              {feito ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}{e.label}
            </span>
            {i < ETAPAS.length - 1 && <span className="h-px w-4 bg-hairline" />}
          </li>
        );
      })}
    </ol>
  );
}

function CartaoOferta({ o, melhor, escolhida, podeEscolher, onEscolher, ocupado }: { o: Oferta; melhor: boolean; escolhida: boolean; podeEscolher: boolean; onEscolher: () => void; ocupado: boolean }) {
  return (
    <div className={'rounded-xl border p-4 ' + (escolhida ? 'border-accent bg-accent-tint' : 'border-hairline bg-canvas')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[14px] font-semibold text-ink">{o.compradorNome}</span>
            {melhor && <Chip cls="border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]">Melhor oferta</Chip>}
            {escolhida && <Chip cls="border-accent bg-canvas text-accent">Escolhida</Chip>}
          </div>
          <div className="mt-0.5 text-[12px] text-ink-mute">Válida até {dataBr(o.validaAte)} · prazo considerado {o.prazoMesesConsiderado} meses</div>
        </div>
        <div className="text-right">
          <div className="text-[20px] font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(o.totalOfertaCentavos)}</div>
          <div className="text-[12px] text-ink-mute">à vista · deságio {pctBps(o.desagioBps)} · {pctBps(o.taxaEfetivaAaBps)} a.a.</div>
        </div>
      </div>
      <ul className="mt-3 space-y-1 border-t border-hairline pt-3 text-[13px]">
        {o.parcelas.map((p) => (
          <li key={p.parcelaId} className="flex justify-between gap-3">
            <span className="text-ink-2">{PARCELA_LABEL[p.parcelaId]}</span>
            <span className="text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(p.valorFaceCentavos)} → <strong>{brl(p.ofertaCentavos)}</strong></span>
          </li>
        ))}
      </ul>
      {podeEscolher && (
        <div className="mt-3 flex justify-end"><Botao primario={melhor} disabled={ocupado} onClick={onEscolher}>Escolher esta oferta</Botao></div>
      )}
    </div>
  );
}

function resumoParaCliente(r: RegistroCredito, o: Oferta): string {
  const linhas = [
    `PROPOSTA DE ANTECIPAÇÃO — ${r.credito.tipo === 'RPV' ? 'RPV' : 'PRECATÓRIO'}`,
    `Processo: ${r.credito.numeroProcesso} (${r.credito.tribunal}) · Devedor: ${r.credito.enteDevedor}`,
    `Credor: ${r.credito.credor.nome}`,
    '',
    ...o.parcelas.map((p) => `${PARCELA_LABEL[p.parcelaId]}: valor de face ${brl(p.valorFaceCentavos)} → pagamento à vista ${brl(p.ofertaCentavos)}`),
    '',
    `Total à vista: ${brl(o.totalOfertaCentavos)} (deságio de ${pctBps(o.desagioBps)} sobre ${brl(o.totalFaceCentavos)}).`,
    `Se aguardar o pagamento pelo ente devedor: previsão ${r.analise.prazo.dataLimiteLegal ? 'até ' + dataBr(r.analise.prazo.dataLimiteLegal) : 'indeterminada'}${r.analise.prazo.regimeEspecial ? ' (ente em regime especial)' : ''}.`,
    `Comprador: ${o.compradorNome}. Proposta válida até ${dataBr(o.validaAte)}.`,
    'A decisão de antecipar é sua: você pode optar por aguardar o pagamento integral.',
    `Código de verificação da proposta: ${r.propostaHash?.slice(0, 16)}`,
  ];
  return linhas.join('\n');
}

function Detalhe({ inicial, onVoltar, onAtualizado, demo }: { inicial: RegistroCredito; onVoltar: () => void; onAtualizado: (r: RegistroCredito) => void; demo: boolean }) {
  const [r, setR] = useState(inicial);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [canal, setCanal] = useState<CanalAceite>('ASSINATURA_ELETRONICA');
  const [evid, setEvid] = useState<Partial<Record<ItemFormalizacao, string>>>({});
  const [verExcluidos, setVerExcluidos] = useState(false);
  useEffect(() => setR(inicial), [inicial]);

  const acao = async (fn: () => Promise<RegistroCredito>, sucesso?: string) => {
    setOcupado(true); setErro(null); setOk(null);
    try { const n = await fn(); setR(n); onAtualizado(n); if (sucesso) setOk(sucesso); }
    catch (e) { setErro(msgErro(e)); } finally { setOcupado(false); }
  };
  const c = r.credito, a = r.analise;
  const cascata = useMemo(() => cascataBaseCedivel(c), [c]);
  const melhorDetalhe = r.ofertas.ofertas.find((o) => o.id === r.ofertas.melhorOfertaId);
  const escolhida = r.ofertas.ofertas.find((o) => o.id === r.ofertaEscolhidaId);
  const checklistCompleto = CHECKLIST_FORMALIZACAO.every((x) => r.checklist[x.id]);
  const podeReanalisar = ['ANALISADO', 'BLOQUEADO', 'OFERTA_ESCOLHIDA', 'APROVADO_INTERNO'].includes(r.status);
  const podeCancelar = !['PAGO', 'CANCELADO'].includes(r.status);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onVoltar} className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Carteira</button>
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight text-ink">{c.tipo === 'RPV' ? 'RPV' : 'Precatório'} · {c.enteDevedor}</h2>
            <Chip cls={STATUS_CLS[r.status]}>{STATUS_LABEL[r.status]}</Chip>
            <Chip cls={FLAG[a.flag].cls}>{FLAG[a.flag].label}</Chip>
            {r.demo && <Chip cls="border-[#F1D9A8] bg-[#FFF8EA] text-[#7A4F00]">exemplo</Chip>}
          </div>
          <p className="mt-1 font-mono text-[13px] text-ink-2">{c.numeroProcesso} · {c.tribunal}</p>
          <p className="text-[13px] text-ink-mute">{c.credor.nome} · face {brl(c.valorFaceCentavos)} em {dataBr(c.dataBase)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {podeReanalisar && <Botao disabled={ocupado} onClick={() => acao(() => antecipacaoApi.reanalisar(c.id), 'Triagem e ofertas atualizadas.')}><RefreshCw className="h-4 w-4" /> Reanalisar</Botao>}
          {podeCancelar && <Botao perigo disabled={ocupado} onClick={() => { const m = window.prompt('Motivo do cancelamento'); if (m) void acao(() => antecipacaoApi.cancelar(c.id, m), 'Cancelado.'); }}><XCircle className="h-4 w-4" /> Cancelar</Botao>}
        </div>
      </div>
      <Etapas status={r.status} />
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {ok && <Alerta tipo="ok">{ok}</Alerta>}

      {/* Próxima ação */}
      {r.status === 'BLOQUEADO' && <Alerta tipo="erro">Crédito bloqueado na triagem: corrija os itens em vermelho (ou os dados declarados) e reanalise. Compradores não recebem créditos bloqueados.</Alerta>}
      {r.status === 'OFERTA_ESCOLHIDA' && escolhida && (
        <Card titulo="Aprovação do sócio" icone={<ShieldCheck className="h-4 w-4 text-accent" />}>
          <p className="text-[13px] text-ink-2">Oferta de <strong>{escolhida.compradorNome}</strong>: {brl(escolhida.totalOfertaCentavos)} à vista. A aprovação vale para esta versão exata da proposta (código <span className="font-mono">{r.propostaHash?.slice(0, 12)}</span>); qualquer alteração exige nova aprovação.</p>
          <div className="mt-3 flex justify-end"><Botao primario disabled={ocupado} onClick={() => acao(() => antecipacaoApi.aprovar(c.id, r.propostaHash!), 'Proposta aprovada. Apresente ao cliente.')}>Aprovar proposta</Botao></div>
        </Card>
      )}
      {r.status === 'APROVADO_INTERNO' && escolhida && (
        <Card titulo="Apresentar ao cliente e registrar o aceite" icone={<BadgeCheck className="h-4 w-4 text-accent" />}
          acao={<button type="button" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline" onClick={() => { void navigator.clipboard?.writeText(resumoParaCliente(r, escolhida)); setOk('Resumo copiado. Envie ao cliente pelo canal do escritório.'); }}><ClipboardCopy className="h-4 w-4" /> Copiar resumo para o cliente</button>}>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-surface p-3 text-[12px] text-ink-2">{resumoParaCliente(r, escolhida)}</pre>
          <div className="mt-3 flex flex-wrap items-end justify-end gap-2">
            <label className="text-[13px] text-ink-2">Canal do aceite{' '}
              <select className="ml-1 rounded-lg border border-hairline bg-canvas px-2 py-1.5 text-[13px]" value={canal} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCanal(e.target.value as CanalAceite)}>
                <option value="ASSINATURA_ELETRONICA">Assinatura eletrônica</option><option value="PRESENCIAL">Presencial</option><option value="EMAIL">E-mail</option>
              </select>
            </label>
            <Botao primario disabled={ocupado} onClick={() => acao(() => antecipacaoApi.aceite(c.id, canal, r.propostaHash!), 'Aceite registrado. Siga para a formalização.')}>Cliente aceitou esta proposta</Botao>
          </div>
        </Card>
      )}
      {(r.status === 'ACEITO_CLIENTE' || r.status === 'FORMALIZACAO') && (
        <Card titulo="Formalização da cessão" icone={<Gavel className="h-4 w-4 text-accent" />}>
          <ul className="space-y-3">
            {CHECKLIST_FORMALIZACAO.map((it) => {
              const feito = r.checklist[it.id];
              return (
                <li key={it.id} className="flex flex-col gap-2 border-b border-hairline pb-3 last:border-0 last:pb-0 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    {feito ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#067647]" /> : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />}
                    <div className="min-w-0">
                      <div className="text-[13px] text-ink">{it.descricao}</div>
                      <div className="text-[12px] text-ink-mute">{it.baseLegal}{feito ? ` · ${feito.evidencia} · ${dataHoraBr(feito.em)}` : ''}</div>
                    </div>
                  </div>
                  {!feito && (
                    <div className="flex gap-2">
                      <input className="w-56 rounded-lg border border-hairline bg-canvas px-2 py-1.5 text-[13px]" placeholder="Evidência (protocolo, id do doc…)"
                        value={evid[it.id] ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEvid((x) => ({ ...x, [it.id]: e.target.value }))} />
                      <Botao disabled={ocupado || (evid[it.id] ?? '').trim().length < 3} onClick={() => acao(() => antecipacaoApi.checklist(c.id, it.id, evid[it.id]!.trim()))}>Concluir</Botao>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {checklistCompleto && (
            <div className="mt-4">
              {demo ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] text-ink-mute">Em produção, o comprador confirma o pagamento pelo webhook assinado.</span>
                  <Botao primario disabled={ocupado || !escolhida} onClick={() => acao(() => antecipacaoApi.pagamentoDemo(c.id, escolhida!.totalOfertaCentavos), 'Pagamento confirmado (simulação).')}>Simular pagamento do comprador</Botao>
                </div>
              ) : <Alerta tipo="info">Formalização completa. Aguardando a confirmação de pagamento do comprador.</Alerta>}
            </div>
          )}
        </Card>
      )}
      {r.status === 'PAGO' && r.pagamento && (
        <Alerta tipo="ok">Pago em {dataHoraBr(r.pagamento.em)}: {brl(r.pagamento.valorCentavos)} · comprovante {r.pagamento.comprovante}. Acompanhe a comunicação da cessão no processo.</Alerta>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Card titulo={`Ofertas (${r.ofertas.ofertas.length})`} icone={<Landmark className="h-4 w-4 text-accent" />}>
            {r.ofertas.ofertas.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-ink-mute">{a.flag === 'RED' ? 'Sem ofertas: o crédito está bloqueado na triagem.' : 'Nenhum comprador parceiro atende este perfil de crédito no momento.'}</p>
            ) : (
              <div className="space-y-3">
                {r.ofertas.ofertas.map((o) => (
                  <CartaoOferta key={o.id} o={o} melhor={o.id === r.ofertas.melhorOfertaId} escolhida={o.id === r.ofertaEscolhidaId}
                    podeEscolher={r.status === 'ANALISADO'} ocupado={ocupado} onEscolher={() => acao(() => antecipacaoApi.escolher(c.id, o.id), 'Oferta escolhida. Falta a aprovação do sócio.')} />
                ))}
              </div>
            )}
            {r.ofertas.excluidos.length > 0 && (
              <div className="mt-3">
                <button type="button" className="text-[12px] font-medium text-ink-2 hover:text-ink" onClick={() => setVerExcluidos((v) => !v)}>
                  {verExcluidos ? 'Ocultar' : 'Ver'} compradores que não ofertaram ({r.ofertas.excluidos.length})
                </button>
                {verExcluidos && (
                  <ul className="mt-2 space-y-1 text-[12px] text-ink-mute">
                    {r.ofertas.excluidos.map((x) => <li key={x.compradorId}><span className="text-ink-2">{x.compradorNome}</span>: {x.motivos.join('; ')}</li>)}
                  </ul>
                )}
              </div>
            )}
            <p className="mt-3 text-[12px] text-ink-mute">A Velatrix não compra créditos nem recebe valores: compradores parceiros fazem as ofertas e pagam a taxa de originação. O valor ao cliente não é reduzido por essa taxa.</p>
          </Card>

          <Card titulo="Triagem" icone={<ShieldCheck className="h-4 w-4 text-accent" />}>
            <ul className="space-y-2.5">
              {a.triagem.map((t) => {
                const st = t.resultado.status;
                const Icone = st === 'OK' ? CheckCircle2 : st === 'FALHA' ? (t.severidade === 'RED' ? XCircle : AlertTriangle) : st === 'NAO_VERIFICADO' ? CircleDashed : Info;
                const cor = st === 'OK' ? 'text-[#067647]' : st === 'FALHA' ? (t.severidade === 'RED' ? 'text-[#B42318]' : t.severidade === 'YELLOW' ? 'text-[#B54708]' : 'text-ink-mute') : 'text-ink-mute';
                const texto = t.resultado.status === 'NAO_VERIFICADO' ? t.resultado.motivo : t.resultado.evidencia;
                return (
                  <li key={t.id} className="flex items-start gap-2">
                    <Icone className={'mt-0.5 h-4 w-4 shrink-0 ' + cor} />
                    <div className="min-w-0 text-[13px]">
                      <div className="text-ink">{t.descricao}</div>
                      <div className="text-[12px] text-ink-mute">{texto}{t.baseLegal ? ` · ${t.baseLegal}` : ''}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <Card titulo="Base de cálculo da cessão" icone={<Calculator className="h-4 w-4 text-accent" />}>
            <dl className="space-y-1.5 text-[13px]">
              {cascata.linhas.map((l) => (
                <div key={l.id} className={l.sinal === '=' ? 'border-t border-hairline pt-1.5' : ''}>
                  <div className="flex justify-between gap-3">
                    <dt className={l.id === 'BASE_CEDIVEL' ? 'font-semibold text-ink' : 'text-ink-2'}>{l.rotulo}</dt>
                    <dd className={'text-right ' + (l.id === 'BASE_CEDIVEL' ? 'font-semibold text-ink' : 'text-ink')} style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {l.sinal === '-' && l.centavos > 0 ? '−' : ''}{brl(l.centavos)}
                    </dd>
                  </div>
                  {l.fundamento && <div className="text-[11px] text-ink-mute">{l.fundamento}</div>}
                </div>
              ))}
            </dl>
            {melhorDetalhe && (
              <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12px] text-ink-2">
                Melhor oferta {brl(melhorDetalhe.totalOfertaCentavos)} ÷ base {brl(cascata.baseCedivelCentavos)} → deságio de <strong>{pctBps(melhorDetalhe.desagioBps)}</strong> sobre a base cedível (não sobre o valor de face).
              </p>
            )}
          </Card>
          <Card titulo="Prazo de pagamento se esperar" icone={<Info className="h-4 w-4 text-accent" />}>
            <div className="text-[22px] font-semibold text-ink">{a.prazo.dataLimiteLegal ? dataBr(a.prazo.dataLimiteLegal) : 'Indeterminado'}</div>
            <div className="mt-0.5 text-[12px] text-ink-mute">{a.prazo.fundamento}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip cls="border-hairline bg-surface text-ink-2">central {a.prazo.mesesCentral} meses</Chip>
              <Chip cls="border-hairline bg-surface text-ink-2">conservador {a.prazo.mesesConservador} meses</Chip>
              {a.prazo.regimeEspecial && <Chip cls={FLAG.YELLOW.cls}>regime especial</Chip>}
              {a.prazo.emMora && <Chip cls={FLAG.YELLOW.cls}>ente em mora</Chip>}
              {a.prazo.preferencial && <Chip cls={FLAG.GREEN.cls}>preferência constitucional</Chip>}
            </div>
          </Card>
          <Card titulo="Memória de cálculo" icone={<Info className="h-4 w-4 text-accent" />}>
            <dl className="space-y-2 text-[13px]">
              {a.memoria.map((m) => (
                <div key={m.passo}>
                  <div className="flex justify-between gap-3"><dt className="text-ink-2">{m.passo}</dt><dd className="text-right font-medium text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{m.valor}</dd></div>
                  {m.fundamento && <div className="text-[11px] text-ink-mute">{m.fundamento}</div>}
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] text-ink-mute">Regras v{a.versaoRegras} · análise de {dataBr(a.hoje)}. Tetos e listas marcados “PREENCHER_E_VALIDAR” exigem conferência jurídica.</p>
          </Card>
          <Card titulo="Histórico" icone={<CircleDashed className="h-4 w-4 text-accent" />}>
            <ol className="space-y-2 text-[12px]">
              {[...r.eventos].reverse().map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-24 shrink-0 text-ink-mute" style={{ fontVariantNumeric: 'tabular-nums' }}>{dataHoraBr(e.em)}</span>
                  <span className="min-w-0 text-ink-2"><span className="font-medium text-ink">{e.tipo.replace(/_/g, ' ').toLowerCase()}</span>{e.detalhe ? ` · ${e.detalhe}` : ''}{e.hash ? <span className="font-mono text-ink-mute"> · {e.hash.slice(0, 10)}</span> : null}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── carteira ─────────────────────────

export const AntecipacaoView: React.FC = () => {
  const [lista, setLista] = useState<RegistroCredito[]>([]);
  const [painel, setPainel] = useState<PainelAntecipacao | null>(null);
  const [compradores, setCompradores] = useState<CompradorPublico[]>([]);
  const [demo, setDemo] = useState(false);
  const [modo, setModo] = useState<{ tipo: 'lista' } | { tipo: 'novo' } | { tipo: 'detalhe'; id: string }>({ tipo: 'lista' });
  const [filtro, setFiltro] = useState<StatusCredito | ''>('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  // Ao abrir/fechar um crédito, leva a tela ao topo do módulo (o <main> mantém a rolagem anterior).
  const topoRef = useRef<HTMLDivElement>(null);
  const primeiraRender = useRef(true);
  useEffect(() => {
    if (primeiraRender.current) { primeiraRender.current = false; return; }
    topoRef.current?.scrollIntoView({ block: 'start' });
  }, [modo]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [l, p, k, reg] = await Promise.all([antecipacaoApi.listar(), antecipacaoApi.painel(), antecipacaoApi.compradores(), antecipacaoApi.regras()]);
      setLista(l); setPainel(p); setCompradores(k); setDemo(reg.demo); setErro(null);
    } catch (e) { setErro(msgErro(e)); } finally { setCarregando(false); }
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  const atualizarItem = (r: RegistroCredito) => {
    setLista((l) => [r, ...l.filter((x) => x.credito.id !== r.credito.id)]);
    void antecipacaoApi.painel().then(setPainel).catch(() => undefined);
  };
  const filtrada = useMemo(() => lista.filter((r) => !filtro || r.status === filtro), [lista, filtro]);
  const aberto = modo.tipo === 'detalhe' ? lista.find((r) => r.credito.id === modo.id) : undefined;

  if (modo.tipo === 'novo') {
    return <div ref={topoRef} className="mx-auto max-w-6xl scroll-mt-16"><NovoCredito onCancelar={() => setModo({ tipo: 'lista' })} onCriado={(r) => { atualizarItem(r); setModo({ tipo: 'detalhe', id: r.credito.id }); }} /></div>;
  }
  if (modo.tipo === 'detalhe' && aberto) {
    return <div ref={topoRef} className="mx-auto max-w-6xl scroll-mt-16"><Detalhe inicial={aberto} demo={demo} onVoltar={() => setModo({ tipo: 'lista' })} onAtualizado={atualizarItem} /></div>;
  }

  const kpis = [
    { label: 'Créditos na carteira', valor: painel ? String(painel.totalCreditos) : '—', dica: painel ? `${painel.aguardandoAcao} aguardando ação` : '' },
    { label: 'Valor de face', valor: painel ? brl(painel.valorFaceCentavos) : '—', dica: 'soma dos créditos ativos' },
    { label: 'Melhores ofertas', valor: painel ? brl(painel.melhorOfertaTotalCentavos) : '—', dica: 'à vista, hoje' },
    { label: 'Antecipado (pago)', valor: painel ? brl(painel.pagoCentavos) : '—', dica: 'cessões liquidadas' },
  ];

  return (
    <div ref={topoRef} className="mx-auto max-w-6xl space-y-5 scroll-mt-16">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Antecipação de precatórios e RPVs</h2>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-mute">
            Cadastre o crédito do cliente ou seus honorários, veja a triagem e o prazo constitucional, e compare ofertas de compradores parceiros —
            com aprovação do sócio, aceite do cliente e cessão formalizada.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao onClick={() => void carregar()} disabled={carregando}><RefreshCw className={'h-4 w-4 ' + (carregando ? 'animate-spin' : '')} /> Atualizar</Botao>
          <Botao primario onClick={() => setModo({ tipo: 'novo' })}><FilePlus className="h-4 w-4" /> Cadastrar crédito</Botao>
        </div>
      </section>

      {demo && (
        <Alerta tipo="aviso">Ambiente de demonstração: os compradores são fictícios e o pagamento pode ser simulado. Em produção, só aparecem parceiros cadastrados pela Velatrix após due diligence.</Alerta>
      )}
      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-hairline bg-canvas p-4">
            <div className="text-[12px] text-ink-mute">{k.label}</div>
            <div className="mt-1 text-[20px] font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{k.valor}</div>
            <div className="mt-0.5 text-[12px] text-ink-soft">{k.dica}</div>
          </div>
        ))}
      </section>

      <Card titulo="Carteira" icone={<Landmark className="h-4 w-4 text-accent" />}
        acao={
          <select aria-label="Filtrar por status" className="rounded-lg border border-hairline bg-canvas px-2 py-1.5 text-[13px]" value={filtro} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltro(e.target.value as StatusCredito | '')}>
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_LABEL) as StatusCredito[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}{painel ? ` (${painel.porStatus[s]})` : ''}</option>)}
          </select>
        }>
        {!carregando && lista.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[14px] text-ink-2">Nenhum crédito cadastrado.</p>
            <p className="mt-1 text-[13px] text-ink-mute">Cadastre um precatório ou RPV para ver a triagem e as ofertas.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Botao primario onClick={() => setModo({ tipo: 'novo' })}><FilePlus className="h-4 w-4" /> Cadastrar crédito</Botao>
              {demo && <Botao onClick={async () => { try { await antecipacaoApi.semearDemo(); await carregar(); } catch (e) { setErro(msgErro(e)); } }}>Carregar exemplos</Botao>}
            </div>
          </div>
        ) : (
          <div className="-mx-4 -my-4 overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-[13px]">
              <thead className="border-b border-hairline text-[12px] text-ink-mute">
                <tr>
                  <th className="px-4 py-2 font-medium">Processo / credor</th>
                  <th className="px-2 py-2 font-medium">Devedor</th>
                  <th className="px-2 py-2 text-right font-medium">Face</th>
                <th className="px-2 py-2 text-right font-medium" title="Parcelas efetivamente cedidas: face − honorários destacados (− retenções) ± parcelas do advogado. O deságio é calculado sobre esta base.">Base cedível</th>
                  <th className="px-2 py-2 text-right font-medium">Melhor oferta</th>
                  <th className="px-2 py-2 font-medium">Risco</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-2 py-2"><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filtrada.map((r) => {
                  const melhor = r.ofertas.ofertas[0];
                  const base = cascataBaseCedivel(r.credito).baseCedivelCentavos;
                  const abrir = () => setModo({ tipo: 'detalhe', id: r.credito.id });
                  return (
                    <tr key={r.credito.id} className="cursor-pointer hover:bg-surface" tabIndex={0} aria-label={'Abrir detalhe do processo ' + r.credito.numeroProcesso}
                      onClick={abrir} onKeyDown={(e: React.KeyboardEvent<HTMLTableRowElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } }}>
                      <td className="px-4 py-2.5">
                        <div className="font-mono text-[12px] text-ink">{r.credito.numeroProcesso}</div>
                        <div className="truncate text-[12px] text-ink-mute">{r.credito.credor.nome} · {r.credito.tipo === 'RPV' ? 'RPV' : 'Precatório'}</div>
                      </td>
                      <td className="px-2 py-2.5 text-ink-2">{r.credito.enteDevedor}<div className="text-[12px] text-ink-mute">{r.credito.tribunal}</div></td>
                      <td className="px-2 py-2.5 text-right text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(r.credito.valorFaceCentavos)}</td>
                    <td className="px-2 py-2.5 text-right text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(base)}</td>
                      <td className="px-2 py-2.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {melhor ? <><div className="font-medium text-ink">{brl(melhor.totalOfertaCentavos)}</div><div className="text-[12px] text-ink-mute">deságio {pctBps(melhor.desagioBps)} s/ base</div></> : <span className="text-ink-mute">—</span>}
                      </td>
                      <td className="px-2 py-2.5"><Chip cls={FLAG[r.analise.flag].cls}>{FLAG[r.analise.flag].label}</Chip></td>
                      <td className="px-4 py-2.5"><Chip cls={STATUS_CLS[r.status]}>{STATUS_LABEL[r.status]}</Chip></td>
                      <td className="px-2 py-2.5 text-right"><span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-accent">Abrir <ChevronRight className="h-3.5 w-3.5" /></span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card titulo={`Compradores parceiros (${compradores.length})`} icone={<ShieldCheck className="h-4 w-4 text-accent" />}>
        {compradores.length === 0 ? (
          <p className="text-[13px] text-ink-mute">Nenhum comprador parceiro ativo. As análises continuam funcionando; as ofertas aparecem quando houver parceiros cadastrados.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {compradores.map((k) => (
              <li key={k.id} className="rounded-lg border border-hairline p-3">
                <div className="text-[13px] font-semibold text-ink">{k.nome}</div>
                <div className="mt-0.5 text-[12px] text-ink-mute">
                  {k.tipoEntidade} · {k.apetite.tipos.join(' e ')} · {k.apetite.esferas.map((e) => e.toLowerCase()).join(', ')} · ticket {brl(k.apetite.ticketMinCentavos)}–{brl(k.apetite.ticketMaxCentavos)}
                  {k.apetite.aceitaHonorarios ? ' · antecipa honorários' : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default AntecipacaoView;
