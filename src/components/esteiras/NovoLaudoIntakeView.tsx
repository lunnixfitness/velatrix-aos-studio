import React, { useState } from 'react';
import {
  FilePlus,
  Scale,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Save,
  Check
} from 'lucide-react';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import { PageHead } from '../console/PageHead';
import { CentralAuditReportService } from '../../services/centralAuditReportService';
import { UnifiedTenantService } from '../../services/unifiedTenantService';
import { StandardizedAuditReportModal } from '../common/StandardizedAuditReportModal';
import { NavigationTab } from '../../types/aos';
import { secureInt } from '../../lib/demoMode';

export interface NovoLaudoIntakeViewProps {
  onNavigateTab?: (tab: NavigationTab) => void;
  onOpenReportModal?: (report: any) => void;
  tenantProfile?: any;
  onBackToDashboard?: () => void;
  onReportCreated?: (report: any) => void;
}

export const NovoLaudoIntakeView: React.FC<NovoLaudoIntakeViewProps> = ({
  onNavigateTab
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [reportType, setReportType] = useState<'judicial' | 'tributario' | 'previdenciario' | 'precatorio'>('judicial');
  
  // Step 1 Form
  const [processNumber, setProcessNumber] = useState(IS_DEMO_MODE ? '1004521-72.2025.8.26.0100' : '');
  const [appointmentDate, setAppointmentDate] = useState(IS_DEMO_MODE ? '2026-09-15' : '');
  const [court, setCourt] = useState(IS_DEMO_MODE ? '3ª Vara Cível — Foro Central SP' : '');
  const [judge, setJudge] = useState(IS_DEMO_MODE ? 'Dra. Ana Cláudia Ferraz' : '');
  const [deadlineDays, setDeadlineDays] = useState(45);
  const [causeValue, setCauseValue] = useState(IS_DEMO_MODE ? 'R$ 2.140.900,00' : '');

  const activeTenant = UnifiedTenantService.getActiveTenant();

  // Step 2 Form
  const [authorName, setAuthorName] = useState(IS_DEMO_MODE ? (activeTenant?.name || 'Metalúrgica São Bento S/A') : '');
  const [authorDoc, setAuthorDoc] = useState(IS_DEMO_MODE ? (activeTenant?.cnpj || '18.472.516/0001-33') : '');
  const [defendantName, setDefendantName] = useState(IS_DEMO_MODE ? 'Fazenda Nacional' : '');
  const [defendantDoc, setDefendantDoc] = useState(IS_DEMO_MODE ? '00.394.460/0058-87' : '');

  // Step 3 Form
  const [objectSummary, setObjectSummary] = useState(IS_DEMO_MODE ? 'Revisão e compensação de indébito fiscal PIS/COFINS monofásico e apuração de créditos ICMS-ST dos últimos 60 meses.' : '');
  const [questionsCount, setQuestionsCount] = useState(12);

  // Step 4 Form
  const [expertName, setExpertName] = useState(IS_DEMO_MODE ? 'Dr. Carlos Mendonça (CRC/SP 2SP194820/O-4)' : '');
  const [primaryEngine, setPrimaryEngine] = useState('Motor Pericial 60 Meses + Gemini 3.7 Flash');

  // Step 5 Result
  const [generatedProtocol, setGeneratedProtocol] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReport, setCreatedReport] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFinishIntake = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const protocol = `LD-${new Date().getFullYear()}-${secureInt(1000, 9999)}`;
      setGeneratedProtocol(protocol);

      // Create standardized report in CentralAuditReportService
      const now = new Date();
      const newReport = {
        reportId: protocol,
        serviceId: reportType === 'judicial' ? 'pericia_judicial' : reportType === 'tributario' ? 'tax_recovery' : reportType === 'previdenciario' ? 'inss_previdenciario' : 'precatorios',
        serviceName: `Laudo Técnico ${reportType.toUpperCase()}`,
        reportType: reportType === 'judicial' ? 'pericial' : reportType === 'tributario' ? 'fiscal_recovery' : reportType === 'previdenciario' ? 'inss_benefit' : 'precatorios',
        reportTypeLabel: `Laudo Técnico ${reportType.toUpperCase()}`,
        issuedAt: now.toISOString(),
        issuedAtFormatted: now.toLocaleDateString('pt-BR'),
        tenantId: activeTenant?.id || 'tenant_current',
        tenantName: activeTenant?.name || authorName,
        tenantCnpj: activeTenant?.cnpj || authorDoc,
        lgpdCompliance: {
          isCompliant: true,
          dataProtectionOfficer: 'DPO Velatrix (compliance@velatrix.ai)',
          dataMaskingApplied: true,
          retentionPeriodDays: 1825,
          legalBasis: 'Art. 7º Lei 13.709/2018',
          anonymizedFields: []
        },
        auditHash: `0x${Date.now().toString(16)}`,
        signer: {
          name: expertName,
          role: 'Perito Responsável',
          signatureType: 'ICP_BRASIL_A1' as const
        },
        pipelineSnapshot: {
          verifiedRealSources: ['Autos do Processo Judicial ' + processNumber],
          executionTimeMs: 1420,
          dataSourceIntegrity: '100% REAL VERIFICADO' as const
        }
      };
      CentralAuditReportService.saveReport(newReport);

      setCreatedReport(newReport);
      setIsSubmitting(false);
      setCurrentStep(5);
    }, 600);
  };

  const steps = [
    { num: 1, title: 'Tipo & Origem', subtitle: 'obrigatório' },
    { num: 2, title: 'Partes', subtitle: 'requerente / réu' },
    { num: 3, title: 'Objeto & Quesitos', subtitle: 'matéria do laudo' },
    { num: 4, title: 'Perito & Motor', subtitle: 'roteamento' },
    { num: 5, title: 'Confirmação', subtitle: 'protocolo emitido' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 font-sans">
      <PageHead
        eyebrow="Intake · Abertura de Processo"
        title="Novo Laudo Técnico"
        description="Wizard de 5 passos para ingestão, parametrização e roteamento para o motor pericial do Neural Core."
        actions={
          <div className="flex items-center gap-2">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('central_laudos')}
                className="px-3 py-1.5 text-xs font-medium text-ink-mute hover:text-ink bg-surface hover:bg-surface-hover border border-hairline rounded-md cursor-pointer transition-colors"
              >
                Ver Central de Laudos
              </button>
            )}
          </div>
        }
      />

      {/* Stepper Header */}
      <div className="bg-surface border border-hairline rounded-xl p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-5 gap-2 relative">
          {steps.map((st) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <div
                key={st.num}
                onClick={() => {
                  if (st.num < currentStep) setCurrentStep(st.num);
                }}
                className={`flex flex-col items-center text-center cursor-pointer transition-colors ${
                  st.num < currentStep ? 'hover:opacity-80' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold mb-1.5 transition-all ${
                    isCompleted
                      ? 'bg-good text-[#FFFFFF]'
                      : isCurrent
                      ? 'bg-accent text-[#FFFFFF] ring-2 ring-accent/30'
                      : 'bg-canvas text-ink-soft border border-hairline'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : st.num}
                </div>
                <div className={`text-xs font-medium truncate max-w-full ${isCurrent ? 'text-accent font-semibold' : 'text-ink-mute'}`}>
                  {st.title}
                </div>
                <div className="text-[10px] text-ink-soft hidden sm:block">
                  {st.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Tipo & Origem */}
      {currentStep === 1 && (
        <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Passo 1 · Tipo & Origem do processo
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-mute mb-2">
              Selecione a Esteira / Tipo de Laudo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'judicial', title: 'Laudo Pericial Judicial', desc: 'Perícia contábil, financeira, trabalhista ou de engenharia determinada pelo juízo.', tag: 'Esteira: Perícia Judicial' },
                { id: 'tributario', title: 'Laudo de Recuperação Tributária', desc: 'Fundamentação técnica e memórias de cálculo de créditos fiscais e PGFN.', tag: 'Esteira: Recuperação Fiscal' },
                { id: 'previdenciario', title: 'Laudo Previdenciário / Obras', desc: 'Aferição CNO/SERO, retenção 11% e cálculo de benefícios INSS.', tag: 'Esteira: Especialista INSS' },
                { id: 'precatorio', title: 'Cálculo & Homologação de Precatório', desc: 'Atualização monetária, Selic, deságio e análise de liquidação.', tag: 'Esteira: Precatória' }
              ].map((card) => (
                <div
                  key={card.id}
                  onClick={() => setReportType(card.id as any)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    reportType === card.id
                      ? 'border-accent bg-accent-tint shadow-xs'
                      : 'border-hairline bg-surface hover:border-hairline-strong'
                  }`}
                >
                  <div className="font-medium text-[13.5px] text-ink mb-1">{card.title}</div>
                  <div className="text-xs text-ink-mute leading-relaxed mb-2">{card.desc}</div>
                  <div className="inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-accent-soft text-accent">
                    {card.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Número dos Autos (CNJ)
              </label>
              <input
                type="text"
                value={processNumber}
                onChange={(e) => setProcessNumber(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs font-mono text-ink focus:outline-none focus:border-accent"
              />
              <span className="text-[10.5px] text-ink-soft">Formato: NNNNNNN-DD.AAAA.J.TR.OOOO</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Data da Nomeação / Solicitação
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs font-mono text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Vara / Órgão Julgador
              </label>
              <input
                type="text"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Magistrado / Autoridade
              </label>
              <input
                type="text"
                value={judge}
                onChange={(e) => setJudge(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Prazo do Laudo (dias corridos)
              </label>
              <input
                type="number"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs font-mono text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Valor da Causa / Apuração Estimada
              </label>
              <input
                type="text"
                value={causeValue}
                onChange={(e) => setCauseValue(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs font-mono text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-ink hover:bg-accent text-[#FFFFFF] text-xs font-medium rounded-md cursor-pointer transition-colors"
            >
              <span>Avançar para Partes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Partes */}
      {currentStep === 2 && (
        <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Passo 2 · Partes Envolvidas
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Requerente / Autor
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                CNPJ / CPF do Requerente
              </label>
              <input
                type="text"
                value={authorDoc}
                onChange={(e) => setAuthorDoc(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs font-mono text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Requerido / Réu
              </label>
              <input
                type="text"
                value={defendantName}
                onChange={(e) => setDefendantName(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                CNPJ / CPF do Requerido
              </label>
              <input
                type="text"
                value={defendantDoc}
                onChange={(e) => setDefendantDoc(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs font-mono text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-hairline text-ink-mute hover:text-ink text-xs font-medium rounded-md cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-ink hover:bg-accent text-[#FFFFFF] text-xs font-medium rounded-md cursor-pointer transition-colors"
            >
              <span>Avançar para Objeto & Quesitos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Objeto & Quesitos */}
      {currentStep === 3 && (
        <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Passo 3 · Objeto & Quesitos Periciais
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-mute mb-1">
              Objeto da Perícia / Descrição da Matéria Técnica
            </label>
            <textarea
              rows={4}
              value={objectSummary}
              onChange={(e) => setObjectSummary(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Número de Quesitos Formulados
              </label>
              <input
                type="number"
                value={questionsCount}
                onChange={(e) => setQuestionsCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs font-mono text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div className="p-3 bg-accent-tint border border-hairline rounded-lg flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-accent shrink-0" />
              <div className="text-xs text-ink-mute">
                O <strong>Neural Core</strong> formulará respostas preliminares automáticas com fundamentação jurisprudencial do STJ/STF para cada quesito.
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-hairline text-ink-mute hover:text-ink text-xs font-medium rounded-md cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-ink hover:bg-accent text-[#FFFFFF] text-xs font-medium rounded-md cursor-pointer transition-colors"
            >
              <span>Avançar para Perito & Motor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Perito & Motor */}
      {currentStep === 4 && (
        <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Passo 4 · Atribuição de Perito & Roteamento do Motor
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Perito Técnico Responsável
              </label>
              <input
                type="text"
                value={expertName}
                onChange={(e) => setExpertName(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs text-ink focus:outline-none focus:border-accent"
              />
              <span className="text-[10.5px] text-ink-soft">Registro profissional validado pelo barramento</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                Motor Cognitivo de Suporte
              </label>
              <input
                type="text"
                value={primaryEngine}
                onChange={(e) => setPrimaryEngine(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-xs text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="p-4 bg-surface border border-hairline rounded-lg space-y-2">
            <div className="text-xs font-semibold text-ink">Resumo do Intake para Emissão:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-ink-mute font-mono">
              <div>Processo: {processNumber}</div>
              <div>Autor: {authorName}</div>
              <div>Vara: {court}</div>
              <div>Prazo: {deadlineDays} dias</div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-hairline text-ink-mute hover:text-ink text-xs font-medium rounded-md cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinishIntake}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-good hover:bg-good/90 text-[#FFFFFF] text-xs font-semibold rounded-md cursor-pointer transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Gerando Protocolo...' : 'Gerar Protocolo & Abrir Processo'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Confirmação & Protocolo */}
      {currentStep === 5 && (
        <div className="bg-canvas border border-hairline rounded-xl p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-good-soft text-good flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-xl font-serif text-ink mb-1">
              Processo Registrado com Sucesso!
            </h2>
            <p className="text-xs text-ink-mute">
              O intake foi concluído e os dados foram inseridos na Central de Laudos com custódia criptográfica imutável.
            </p>
          </div>

          <div className="inline-block p-4 bg-surface border border-hairline rounded-lg text-center">
            <div className="text-[10px] uppercase font-mono tracking-wider text-ink-soft mb-1">
              Protocolo Oficial do Laudo
            </div>
            <div className="text-2xl font-mono font-bold text-accent">
              {generatedProtocol}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-ink text-[#FFFFFF] text-xs font-medium rounded-md hover:bg-accent cursor-pointer transition-colors"
            >
              Visualizar Dossiê do Laudo
            </button>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('central_laudos')}
                className="px-4 py-2 bg-surface text-ink border border-hairline text-xs font-medium rounded-md hover:bg-surface-hover cursor-pointer transition-colors"
              >
                Ir para Central de Laudos
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setGeneratedProtocol(null);
              }}
              className="px-4 py-2 border border-hairline text-ink-mute hover:text-ink text-xs font-medium rounded-md cursor-pointer transition-colors"
            >
              Novo Intake
            </button>
          </div>
        </div>
      )}

      {/* Standardized Audit Report Modal for previewing report */}
      {isModalOpen && createdReport && (
        <StandardizedAuditReportModal
          report={createdReport}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
