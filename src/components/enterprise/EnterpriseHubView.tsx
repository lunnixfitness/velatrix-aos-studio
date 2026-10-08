import React, { useMemo, useState } from 'react';
import {
  UserCheck,
  Users,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Plug,
  Lock,
  BadgeCheck,
  Search,
  ArrowLeft,
  ArrowRight,
  Layers,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApprovalQueueView } from '../approval/ApprovalQueueView';
import { RiskShieldPanel } from '../risk/RiskShieldPanel';
import { GuardrailPanel } from './GuardrailPanel';
import { JurimetriaPanel } from './JurimetriaPanel';
import { ConnectHealthPanel } from './ConnectHealthPanel';
import { ZdrPanel } from './ZdrPanel';
import { VerifySealPanel } from './VerifySealPanel';
import { ConflictCheckPanel } from './ConflictCheckPanel';
import { LegalOpsPackagesPanel } from './LegalOpsPackagesPanel';
import { PacoteGate } from './PacoteGate';
import { SubTabBar } from '../console/SubTabBar';
import type { Esteira as RiskEsteira } from '../../enterprise/riskShield.ts';
import type { NavigationTab } from '../../types/aos';

/**
 * Central Enterprise · Confiança
 * Mesmo padrão visual da Central de Esteiras & Laudos Periciais: um catálogo em
 * cards, e a ferramenta abre dentro da própria central (sem poluir o menu).
 */

export type EnterpriseToolId =
  | 'ent_hitl'
  | 'ent_risk_shield'
  | 'ent_guardrail'
  | 'ent_jurimetria'
  | 'ent_connect'
  | 'ent_zdr'
  | 'ent_verify_seal'
  | 'ent_conflict'
  | 'ent_packages';

interface ToolDef {
  id: EnterpriseToolId;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  meta: { label: string; value: string }[];
}

const TOOLS: ToolDef[] = [
  {
    id: 'ent_hitl',
    title: 'Aprovação Humana (HITL)',
    category: 'Governança de decisão',
    description:
      'Fila única de aprovações das esteiras: revisar, aprovar e executar, devolver ou rejeitar, com trilha de auditoria.',
    icon: UserCheck,
    meta: [
      { label: 'Atua em', value: 'Todas as esteiras' },
      { label: 'Regra', value: 'Nada executa sem revisão humana' },
      { label: 'Saída', value: 'Decisão registrada no ledger' },
    ],
  },
  {
    id: 'ent_risk_shield',
    title: 'Shield de Risco',
    category: 'Risco & compliance',
    description:
      'Checagens determinísticas por esteira (prescrição, SPED × DCTF, teses com modulação), com classificação e exposição a multa.',
    icon: ShieldAlert,
    meta: [
      { label: 'Atua em', value: '6 esteiras' },
      { label: 'Base', value: 'CTN, Lei 9.430/96, SPED' },
      { label: 'Saída', value: 'Verde / amarelo / vermelho + evidências' },
    ],
  },
  {
    id: 'ent_guardrail',
    title: 'Guardrail Anti-alucinação',
    category: 'Qualidade da IA',
    description:
      'Confere cada valor e cada citação do texto gerado contra o motor de cálculo e a base normativa vigente na data de referência.',
    icon: ShieldCheck,
    meta: [
      { label: 'Atua em', value: 'Pareceres e laudos gerados por IA' },
      { label: 'Base', value: 'Normas versionadas por vigência' },
      { label: 'Saída', value: 'Aprovado ou bloqueado, com motivo' },
    ],
  },
  {
    id: 'ent_jurimetria',
    title: 'Jurimetria · Decision Score',
    category: 'Decisão',
    description:
      'Histórico de pagamento do ente devedor e precificação da cessão (VPL) com curva de juros, deságio e prêmio de risco.',
    icon: Gauge,
    meta: [
      { label: 'Atua em', value: 'Precatórios e RPV' },
      { label: 'Base', value: 'ETTJ ANBIMA + histórico do ente' },
      { label: 'Saída', value: 'Data provável e preço da cessão' },
    ],
  },
  {
    id: 'ent_connect',
    title: 'Velatrix Connect',
    category: 'Integrações',
    description:
      'Situação de cada fonte de dados: APIs oficiais (SERPRO, SEFAZ, DataJud, DJEN) e ERPs, com modo de autenticação.',
    icon: Plug,
    meta: [
      { label: 'Atua em', value: 'Ingestão de dados' },
      { label: 'Fases', value: 'APIs oficiais · ERPs · sob demanda' },
      { label: 'Saída', value: 'Status por fonte' },
    ],
  },
  {
    id: 'ent_zdr',
    title: 'ZDR & Criptografia',
    category: 'Segurança',
    description:
      'Retenção zero no LLM, anonimização de dados pessoais antes do envio e registro de subprocessadores para o contrato.',
    icon: Lock,
    meta: [
      { label: 'Atua em', value: 'Tudo que vai para o LLM' },
      { label: 'Base', value: 'LGPD' },
      { label: 'Saída', value: 'Texto anonimizado + registro' },
    ],
  },
  {
    id: 'ent_verify_seal',
    title: 'Verificar Selo do Laudo',
    category: 'Autenticidade',
    description:
      'Envie o PDF de um laudo e confira o SHA-256 contra o selo registrado. O mesmo resultado pode ser obtido com sha256sum.',
    icon: BadgeCheck,
    meta: [
      { label: 'Atua em', value: 'Laudos emitidos' },
      { label: 'Base', value: 'SHA-256 do arquivo' },
      { label: 'Saída', value: 'Íntegro ou alterado' },
    ],
  },
  {
    id: 'ent_conflict',
    title: 'Conflict Check',
    category: 'Risco & compliance',
    description:
      'Checagem de conflito de interesses antes do aceite do caso: CPF/CNPJ, raiz de CNPJ, grupo econômico e nome (fonética PT-BR), com resultado selado em SHA-256.',
    icon: Users,
    meta: [
      { label: 'Atua em', value: 'Intake das esteiras' },
      { label: 'Camadas', value: 'Documento · Grupo · Nome' },
      { label: 'Saída', value: 'Risco + ação exigida' },
    ],
  },
  {
    id: 'ent_packages',
    title: 'Pacotes LegalOps',
    category: 'Comercial & contrato',
    description:
      'Pacote contratado pelo escritório, consumo vs. limites, matriz comparativa e simulação de upgrade com impacto mensal.',
    icon: Package,
    meta: [
      { label: 'Atua em', value: 'Todas as ferramentas Enterprise' },
      { label: 'Base', value: 'Pacote + aditivos do contrato' },
      { label: 'Saída', value: 'Direitos, limites e upsell' },
    ],
  },
];

const RISK_ESTEIRAS: { id: RiskEsteira; label: string }[] = [
  { id: 'RECUPERACAO_TRIBUTARIA', label: 'Recuperação Tributária' },
  { id: 'PERICIA_JUDICIAL', label: 'Perícia Judicial' },
  { id: 'INSS', label: 'Especialista INSS' },
  { id: 'INSS_OBRAS', label: 'INSS-Obras' },
  { id: 'PRECATORIA', label: 'Precatória' },
  { id: 'DIAGNOSTICO', label: 'Diagnóstico' },
];

const RiskShieldWithSelector: React.FC = () => {
  const [esteira, setEsteira] = useState<RiskEsteira>('RECUPERACAO_TRIBUTARIA');
  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={RISK_ESTEIRAS.map((e) => ({ id: e.id, label: e.label }))}
        activeTab={esteira}
        onTabChange={(id) => setEsteira(id as RiskEsteira)}
      />
      <RiskShieldPanel key={esteira} esteira={esteira} />
    </div>
  );
};

const renderTool = (id: EnterpriseToolId) => {
  switch (id) {
    case 'ent_hitl':
      return <ApprovalQueueView />;
    case 'ent_risk_shield':
      return <RiskShieldWithSelector />;
    case 'ent_guardrail':
      return <GuardrailPanel />;
    case 'ent_jurimetria':
      return <JurimetriaPanel />;
    case 'ent_connect':
      return <ConnectHealthPanel />;
    case 'ent_zdr':
      return <ZdrPanel />;
    case 'ent_verify_seal':
      return <VerifySealPanel />;
    case 'ent_conflict':
      return <ConflictCheckPanel />;
    case 'ent_packages':
      return <LegalOpsPackagesPanel />;
    default:
      return null;
  }
};

export const isEnterpriseToolId = (tab: string): tab is EnterpriseToolId =>
  TOOLS.some((t) => t.id === tab);

interface EnterpriseHubViewProps {
  /** Abre direto numa ferramenta (deep-link #/ent_xxx). */
  initialTool?: EnterpriseToolId | null;
}

export const EnterpriseHubView: React.FC<EnterpriseHubViewProps> = ({ initialTool = null }) => {
  const { isTabAllowed } = useAuth();
  const [openTool, setOpenTool] = useState<EnterpriseToolId | null>(initialTool);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('Todas');

  const allowedTools = useMemo(
    () => TOOLS.filter((t) => isTabAllowed(t.id as NavigationTab)),
    [isTabAllowed]
  );
  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(allowedTools.map((t) => t.category)))],
    [allowedTools]
  );
  const visible = allowedTools.filter((t) => {
    if (category !== 'Todas' && t.category !== category) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (t.title + ' ' + t.description + ' ' + t.category).toLowerCase().includes(q);
  });

  const current = openTool ? allowedTools.find((t) => t.id === openTool) : undefined;

  // ── Ferramenta aberta ────────────────────────────────────────────────────
  if (current) {
    const Icon = current.icon;
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-canvas text-accent">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                Central Enterprise · {current.category}
              </div>
              <div className="truncate text-[15px] font-semibold text-ink">{current.title}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpenTool(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[13px] font-medium text-ink-2 hover:border-hairline-strong hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar à Central
          </button>
        </div>
        <PacoteGate toolId={current.id} onVerPacotes={() => setOpenTool('ent_packages')}>
        {renderTool(current.id)}
      </PacoteGate>
      </div>
    );
  }

  // ── Catálogo ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-hairline bg-surface p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-wider text-accent">
              <Layers className="h-4 w-4" />
              Plataforma Velatrix AOS · Camada de confiança
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Central Enterprise · Confiança
            </h1>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-mute">
              Ferramentas que protegem cada entrega das esteiras: revisão humana, checagem de risco, controle da IA,
              integrações, proteção de dados e verificação de laudos.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <div className="min-w-[110px] rounded-xl border border-hairline bg-canvas p-3 text-center">
              <div className="text-xl font-semibold text-ink">{allowedTools.length}</div>
              <div className="font-mono text-[10px] uppercase text-ink-mute">Ferramentas</div>
            </div>
            <div className="min-w-[110px] rounded-xl border border-hairline bg-canvas p-3 text-center">
              <div className="text-xl font-semibold text-ink">HITL</div>
              <div className="font-mono text-[10px] uppercase text-ink-mute">Revisão humana</div>
            </div>
            <div className="min-w-[110px] rounded-xl border border-hairline bg-canvas p-3 text-center">
              <div className="text-xl font-semibold text-accent">LGPD</div>
              <div className="font-mono text-[10px] uppercase text-ink-mute">Dados pessoais</div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-hairline bg-surface p-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Buscar ferramenta</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ferramenta…"
            className="w-full rounded-lg border border-hairline bg-canvas py-2 pl-9 pr-3 text-[13px] text-ink focus:border-accent focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={
                'whitespace-nowrap rounded-lg px-3 py-1.5 font-mono text-[12px] transition-colors ' +
                (category === c ? 'bg-accent font-semibold text-[#FFFFFF]' : 'bg-canvas text-ink-mute hover:text-ink')
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline-strong p-10 text-center text-[14px] text-ink-mute">
          Nenhuma ferramenta encontrada para esse filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => {
            const Icon = t.icon;
            return (
              <article
                key={t.id}
                className="group flex flex-col justify-between rounded-2xl border border-hairline bg-canvas p-5 shadow-sm transition-colors hover:border-accent/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md border border-hairline bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-2">
                      {t.category}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <h2 className="mt-3 text-[17px] font-semibold text-ink">{t.title}</h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mute">{t.description}</p>
                  <dl className="mt-4 space-y-1.5 border-t border-hairline pt-3 font-mono text-[12px]">
                    {t.meta.map((m) => (
                      <div key={m.label} className="flex justify-between gap-3">
                        <dt className="shrink-0 text-ink-mute">{m.label}:</dt>
                        <dd className="truncate text-right text-ink-2" title={m.value}>
                          {m.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpenTool(t.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink ring-1 ring-hairline transition-colors hover:bg-accent hover:text-[#FFFFFF] hover:ring-accent"
                  >
                    Abrir ferramenta
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnterpriseHubView;
