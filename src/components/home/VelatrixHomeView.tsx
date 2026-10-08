import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { FilePlus, Layers, UserCheck, FileCheck, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as approvalQueue from '../../services/approvalQueueService';
import { CentralAuditReportService } from '../../services/centralAuditReportService';
import type { StandardizedAuditReport } from '../../types/standardizedPipeline';
import type { NavigationTab } from '../../types/aos';

/**
 * Início · painel de trabalho do profissional (advogado, contador, perito).
 * Responde três perguntas: o que está pendente, quanto vale, o que faço agora.
 * Só mostra dados que existem nos serviços (fila HITL e Central de Laudos);
 * sem dado, mostra estado vazio honesto.
 */

interface VelatrixHomeViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

const ESTEIRA_LABEL: Record<string, string> = {
  RECUPERACAO_TRIBUTARIA: 'Recuperação Tributária',
  PERICIA_JUDICIAL: 'Perícia Judicial',
  INSS: 'Especialista INSS',
  INSS_OBRAS: 'INSS-Obras',
  PRECATORIA: 'Precatória',
  DIAGNOSTICO: 'Diagnóstico',
};

const ESTEIRA_TAB: { tab: NavigationTab; label: string }[] = [
  { tab: 'legal_tax_recovery', label: 'Recuperação Tributária' },
  { tab: 'pericia', label: 'Perícia Judicial' },
  { tab: 'inss', label: 'Especialista INSS' },
  { tab: 'precatoria', label: 'Precatória' },
  { tab: 'express_diagnosis', label: 'Diagnóstico' },
];

const FLAG_STYLE: Record<string, { label: string; cls: string }> = {
  GREEN: { label: 'Risco verde', cls: 'bg-[#EAF6EF] text-[#0F7C4A] border-[#BFE3D0]' },
  YELLOW: { label: 'Risco amarelo', cls: 'bg-[#FFF6E5] text-[#8A5A00] border-[#F1D9A8]' },
  RED: { label: 'Risco vermelho', cls: 'bg-[#FDF0EE] text-[#B4321F] border-[#F1C7BF]' },
  NAO_AVALIADO: { label: 'Não avaliado', cls: 'bg-surface text-ink-mute border-hairline' },
};

const STATUS_LABEL: Record<string, string> = {
  READY_FOR_REVIEW: 'Aguardando revisão',
  APPROVED: 'Aprovado · aguardando execução',
  DRAFT: 'Rascunho',
};

const brl = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

export const VelatrixHomeView: React.FC<VelatrixHomeViewProps> = ({ onNavigate }) => {
  const { currentUser, activeTenant, isTabAllowed } = useAuth();

  const queue = useSyncExternalStore(approvalQueue.subscribe, approvalQueue.getSnapshot, approvalQueue.getSnapshot);
  // P20: a fila vem do servidor; carrega ao abrir a Home (idempotente).
  useEffect(() => { void approvalQueue.inicializar(); }, [activeTenant?.id]);

  const [reports, setReports] = useState<StandardizedAuditReport[]>(() => CentralAuditReportService.getAllReports(activeTenant?.id));
  useEffect(() => {
    setReports(CentralAuditReportService.getAllReports(activeTenant?.id));
    const off = CentralAuditReportService.subscribe(() => setReports(CentralAuditReportService.getAllReports(activeTenant?.id)));
    return off;
  }, [activeTenant?.id]);

  const pendentes = useMemo(
    () => queue
      .filter((e) => !activeTenant?.id || e.item.tenantId === activeTenant.id)
      .filter((e) => e.item.status === 'READY_FOR_REVIEW' || e.item.status === 'APPROVED'),
    [queue, activeTenant?.id]
  );
  const emRevisao = pendentes.filter((e) => e.item.status === 'READY_FOR_REVIEW').length;
  const aprovados = pendentes.filter((e) => e.item.status === 'APPROVED').length;
  const valorEmAberto = pendentes.reduce((s, e) => s + (e.item.valorEnvolvidoCentavos || 0), 0);

  const recentes = useMemo(
    () => [...reports].sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1)).slice(0, 5),
    [reports]
  );

  // P24: ignora pronomes de tratamento (Dr., Dra., Eng.) — "Boa tarde, Helena", não "Boa tarde, Dra."
  const firstName = (currentUser?.name || '').split(' ').find((p) => p && !/^(dr|dra|eng|prof|profa|sr|sra)\.?$/i.test(p)) || '';
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const can = (t: NavigationTab) => isTabAllowed(t);

  const kpis = [
    { label: 'Aguardando revisão', value: String(emRevisao), hint: 'itens na fila de aprovação' },
    { label: 'Aprovados para executar', value: String(aprovados), hint: 'prontos para gerar ou protocolar' },
    { label: 'Valor em análise', value: pendentes.length ? brl(valorEmAberto) : '—', hint: 'soma dos itens pendentes' },
    { label: 'Laudos emitidos', value: String(reports.length), hint: 'na Central de Laudos' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Cabeçalho */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-[13px] capitalize text-ink-mute">{hoje}</div>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-ink">
            {greeting()}
            {firstName ? ', ' + firstName : ''}
          </h1>
          <p className="mt-1 text-[14px] text-ink-mute">{activeTenant?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can('esteiras_laudos_hub') && (
            <button
              type="button"
              onClick={() => onNavigate('esteiras_laudos_hub')}
              className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-[14px] font-medium text-ink hover:border-hairline-strong"
            >
              <Layers className="h-4 w-4" />
              Central de Esteiras
            </button>
          )}
          {can('novo_laudo') && (
            <button
              type="button"
              onClick={() => onNavigate('novo_laudo')}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[14px] font-semibold text-[#FFFFFF] hover:opacity-90"
            >
              <FilePlus className="h-4 w-4" />
              Novo laudo
            </button>
          )}
        </div>
      </section>

      {/* Números do dia */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumo">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-hairline bg-canvas p-4">
            <div className="text-[13px] text-ink-mute">{k.label}</div>
            <div className="mt-1 text-[24px] font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {k.value}
            </div>
            <div className="mt-0.5 text-[12px] text-ink-soft">{k.hint}</div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Pendências */}
        <section className="rounded-xl border border-hairline bg-canvas lg:col-span-3">
          <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <UserCheck className="h-4 w-4 text-accent" />
              Aguardando sua ação
            </h2>
            {can('ent_hitl') && (
              <button
                type="button"
                onClick={() => onNavigate('ent_hitl')}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
              >
                Abrir fila <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </header>
          {pendentes.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[14px] text-ink-2">Nada aguardando revisão.</p>
              <p className="mt-1 text-[13px] text-ink-mute">
                Quando uma esteira gerar um laudo ou pacote de protocolo, ele aparece aqui para você revisar e aprovar.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {pendentes.slice(0, 6).map((e) => {
                const flag = FLAG_STYLE[e.item.riscoFlag] || FLAG_STYLE.NAO_AVALIADO;
                return (
                  <li key={e.item.id}>
                    <button
                      type="button"
                      onClick={() => can('ent_hitl') && onNavigate('ent_hitl')}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-medium text-ink">{e.payload.titulo}</div>
                        <div className="mt-0.5 truncate text-[13px] text-ink-mute">
                          {e.payload.cliente} · {ESTEIRA_LABEL[e.item.esteira] || e.item.esteira} ·{' '}
                          {STATUS_LABEL[e.item.status] || e.item.status}
                        </div>
                      </div>
                      <span className={'hidden shrink-0 rounded-md border px-2 py-0.5 text-[12px] sm:inline ' + flag.cls}>
                        {flag.label}
                      </span>
                      <span
                        className="w-28 shrink-0 text-right text-[14px] font-semibold text-ink"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {brl(e.item.valorEnvolvidoCentavos || 0)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Laudos recentes */}
        <section className="rounded-xl border border-hairline bg-canvas lg:col-span-2">
          <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <FileCheck className="h-4 w-4 text-accent" />
              Laudos recentes
            </h2>
            {can('central_laudos') && (
              <button
                type="button"
                onClick={() => onNavigate('central_laudos')}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </header>
          {recentes.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] text-ink-mute">Nenhum laudo emitido ainda.</div>
          ) : (
            <ul className="divide-y divide-hairline">
              {recentes.map((r) => (
                <li key={r.reportId} className="px-4 py-3">
                  <div className="truncate text-[14px] font-medium text-ink">{r.reportTypeLabel}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-mute">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {r.tenantName} · {r.issuedAtFormatted}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Atalhos das esteiras */}
      <section aria-label="Esteiras">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Esteiras</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          {ESTEIRA_TAB.filter((e) => can(e.tab)).map((e) => (
            <button
              key={e.tab}
              type="button"
              onClick={() => onNavigate(e.tab)}
              className="group flex items-center justify-between gap-2 rounded-xl border border-hairline bg-canvas px-4 py-3 text-left text-[14px] font-medium text-ink hover:border-accent/50 hover:bg-surface"
            >
              {e.label}
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft group-hover:text-accent" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default VelatrixHomeView;
