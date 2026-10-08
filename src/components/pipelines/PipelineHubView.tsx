import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  ShieldCheck, 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Sparkles, 
  FileText, 
  Lock, 
  Briefcase, 
  Building2,
  Cpu
} from 'lucide-react';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import { useAuth } from '../../context/AuthContext';
import type { NavigationTab } from '../../types/aos';

const ESTEIRA_MODULES: { tab: NavigationTab; label: string; hint: string }[] = [
  { tab: 'legal_tax_recovery', label: 'Recuperação Tributária', hint: '60 meses, PGFN, SPED, dossiê e defesa' },
  { tab: 'pericia', label: 'Perícia Judicial', hint: 'Judicial e extrajudicial, laudo selado' },
  { tab: 'inss', label: 'Especialista INSS', hint: 'Cálculo previdenciário e INSS-Obras' },
  { tab: 'precatoria', label: 'Precatória', hint: 'Liquidação, compensação e cessão' },
  { tab: 'express_diagnosis', label: 'Diagnóstico', hint: 'Raio-X de risco e ROI' },
  { tab: 'contract_lab', label: 'Contract Lab', hint: '9 agentes por domínio contratual: societário, M&A, imobiliário, trabalhista…' },
  { tab: 'motor_pericial', label: 'Motor Pericial 60 meses', hint: 'Memória de cálculo mês a mês' },
  { tab: 'dre_waterfall', label: 'Cascata DRE · Perícia contábil', hint: 'DRE CPC 26 com análise vertical para laudos contábeis' },
  // P23: Oráculo de Liquidez saiu do hub (tesouraria corporativa, fora do escopo do escritório).
  { tab: 'leitura_autos', label: 'Leitura de Autos', hint: 'Autos de 500+ páginas: peças, busca com citação de página' },
  { tab: 'escudo_edge', label: 'Leitura de documentos', hint: 'Boletos, NF-e, PIX e procurações — com validação de dígito verificador' },
];
import { listAllServices, getService, MACRO_ETAPAS } from '../../services/registry/serviceRegistry';
import { ServiceDefinition } from '../../types/serviceDefinition';
import { SEGMENTS_CATALOG } from '../../services/registry/segments';
import { UnifiedServiceRunnerView } from './UnifiedServiceRunnerView';

const SEGMENTOS_TECNICOS = new Set(['seguranca_ciber', 'conectividade_erp']);
import { StandardizedAuditReport } from '../../types/standardizedPipeline';
import { SubTabBar } from '../console/SubTabBar';
import { ApprovalQueueView } from '../approval/ApprovalQueueView';

interface PipelineHubViewProps {
  tenantId: string;
  tenantName: string;
  tenantCnpj: string;
  onOpenReport?: (report: StandardizedAuditReport) => void;
  /** Abre o módulo completo de uma esteira (aba de 1º nível). */
  onOpenModule?: (tab: NavigationTab) => void;
  /** P9: sub-aba controlada pela rota (#/esteiras_laudos_hub/<subtab>) quando informada */
  activeSubTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

export const PipelineHubView: React.FC<PipelineHubViewProps> = ({
  tenantId,
  tenantName,
  tenantCnpj,
  onOpenReport,
  activeSubTab,
  onSubTabChange,
  onOpenModule
}) => {
  const { isTabAllowed, isSuperAdmin } = useAuth();
  const [localHubTab, setLocalHubTab] = useState<string>('esteiras');
  const hubTab = activeSubTab ?? localHubTab;
  const setHubTab = onSubTabChange ?? setLocalHubTab;
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

  // P23/P30: segurança cibernética e conector ERP são ferramentas técnicas da plataforma (Central Enterprise /
  // Super Admin), não esteiras de serviço — ficam fora do catálogo e do contador para todos os perfis.
  const allServices = useMemo(
    () => listAllServices().filter((s) => !SEGMENTOS_TECNICOS.has(s.segment.id)),
    [],
  );

  const filteredServices = useMemo(() => {
    return allServices.filter(srv => {
      const matchesSegment = selectedSegmentId === 'ALL' || srv.segment.id === selectedSegmentId;
      const matchesQuery = !searchQuery || 
        srv.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.legalBasis.some(l => l.law.toLowerCase().includes(searchQuery.toLowerCase())) ||
        srv.responsibleClass.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSegment && matchesQuery;
    });
  }, [allServices, selectedSegmentId, searchQuery]);

  // Se um serviço específico estiver aberto no Runner:
  if (activeServiceId) {
    const selectedService = getService(activeServiceId);
    if (selectedService) {
      return (
        <UnifiedServiceRunnerView
          service={selectedService}
          tenantId={tenantId}
          tenantName={tenantName}
          tenantCnpj={tenantCnpj}
          onBack={() => setActiveServiceId(null)}
          onReportGenerated={onOpenReport}
        />
      );
    }
  }

  const hubTabs = (
    <SubTabBar
      className="mb-6"
      tabs={[
        { id: 'esteiras', label: 'Esteiras de serviço' },
        { id: 'fila', label: 'Fila de Aprovação' },
      ]}
      activeTab={hubTab}
      onTabChange={setHubTab}
    />
  );

  if (hubTab === 'fila') {
    return (
      <div className="animate-in fade-in duration-200">
        {hubTabs}
        <ApprovalQueueView />
      </div>
    );
  }

  return (
    <>
    {hubTabs}
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner do Hub de Esteiras */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Plataforma Velatrix AOS • Arquitetura P0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Central de Esteiras & Laudos Periciais
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Catálogo unificado de serviços operacionais com portas de entrada contratuais estritas, esteiras de validação dedicadas por segmento e emissão de laudos oficiais auditáveis sem dados estimados.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[110px]">
              <div className="text-xl font-bold text-cyan-300">{allServices.length}</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Serviços Ativos</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[110px]">
              <div className={`text-xl font-bold ${IS_DEMO_MODE ? 'text-[#B7791F]' : 'text-emerald-400'}`}>{IS_DEMO_MODE ? 'Demo' : '100%'}</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">{IS_DEMO_MODE ? 'Dados ilustrativos' : 'Dados reais'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[110px]">
              <div className="text-xl font-bold text-indigo-300">ICP-Brasil</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Assinatura A1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Módulos completos das esteiras (substituem o antigo grupo "Esteiras de Serviço" do menu) */}
      {onOpenModule && (
        <section aria-label="Módulos das esteiras" className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Módulos das esteiras e ferramentas de análise</h2>
            <span className="text-[12px] text-ink-soft">Abre o módulo completo, com todas as sub-abas</span>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
            {ESTEIRA_MODULES.filter((mod) => isTabAllowed(mod.tab)).map((mod) => (
              <button
                key={mod.tab}
                type="button"
                onClick={() => onOpenModule(mod.tab)}
                className="group flex flex-col items-start gap-1 rounded-xl border border-hairline bg-canvas px-3.5 py-3 text-left transition-colors hover:border-accent/50 hover:bg-surface"
              >
                <span className="flex w-full items-center justify-between gap-2 text-[14px] font-semibold text-ink">
                  {mod.label}
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft transition-colors group-hover:text-accent" />
                </span>
                <span className="text-[12px] leading-snug text-ink-mute">{mod.hint}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar serviço por nome, lei (CTN, CPC, INSS) ou conselho (CRC, OAB, CREA)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filtro por Segmento */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedSegmentId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedSegmentId === 'ALL'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({allServices.length})
          </button>
          {SEGMENTS_CATALOG.filter(seg => !SEGMENTOS_TECNICOS.has(seg.id)).map(seg => (
            <button
              key={seg.id}
              type="button"
              onClick={() => setSelectedSegmentId(seg.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors cursor-pointer ${
                selectedSegmentId === seg.id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Serviços Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => {
          return (
            <div
              key={service.serviceId}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg hover:shadow-cyan-950/20"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-semibold">
                    {service.segment.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    v{service.version}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {service.serviceName}
                </h3>

                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                  {service.legalBasis[0]?.description || 'Esteira pericial homologada pelo Velatrix AOS.'}
                </p>

                {/* Badges de Esteira & Responsabilidade */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-mono flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      Esteira Dedicada:
                    </span>
                    <span className="font-mono text-slate-200 font-bold text-[11px]" title={service.pipeline.stages.map((s) => s.label).join(' → ')}>
                    {MACRO_ETAPAS.length} Estágios{service.pipeline.stages.length > MACRO_ETAPAS.length ? ` · ${service.pipeline.stages.length} sub-etapas` : ''}
                  </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-mono flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-indigo-400" />
                      Base Legal:
                    </span>
                    <span className="font-mono text-cyan-400 text-[11px] truncate max-w-[160px]" title={service.legalBasis[0]?.law}>
                      {service.legalBasis[0]?.law}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-mono flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Registro Técnico:
                    </span>
                    <span className="font-mono text-emerald-300 text-[11px]">
                      {service.responsibleClass.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-500">
                  {service.contract.requiredInputs.length} Requisitos obrigatórios
                </span>

                <button
                  type="button"
                  onClick={() => setActiveServiceId(service.serviceId)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 font-bold text-xs tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <span>Operar Esteira</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
          <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold">Nenhum serviço encontrado para os filtros selecionados.</p>
          <p className="text-xs text-slate-500 mt-1">Experimente limpar o termo de busca ou selecionar outro segmento.</p>
        </div>
      )}
    </div>
    </>
  );
};
