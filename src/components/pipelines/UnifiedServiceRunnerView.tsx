import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  FileCheck, 
  ShieldCheck, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Lock, 
  Play, 
  Sparkles,
  Scale,
  Building,
  UserCheck
} from 'lucide-react';
import { ServiceDefinition } from '../../types/serviceDefinition';
import { StandardizedAuditReport, PipelineStageState } from '../../types/standardizedPipeline';
import { ServicePipelineStepper } from '../common/ServicePipelineStepper';
import { StandardizedAuditReportModal } from '../common/StandardizedAuditReportModal';
import { generateTaxRecoveryPayload } from '../../services/registry/definitions/taxRecoveryService';
import { validateAndComputeReportHash } from '../../services/reportEmissionGuardService';
import { PericiaEsteiraView } from '../esteiras/PericiaEsteiraView';
import { InssPrevidenciarioRunnerView } from '../esteiras/InssPrevidenciarioRunnerView';
import { PrecatorioEnterpriseRunnerView } from '../esteiras/PrecatorioEnterpriseRunnerView';
import { LoasRunnerView } from '../esteiras/LoasRunnerView';
import { secureInt, IS_DEMO_MODE } from '../../lib/demoMode';
import { registrarCustodiaArquivo, type ArquivoCustodia } from '../../shared/upload/sha256Store';
import {
  CONSELHOS, RESPONSAVEL_VAZIO, pendenciasBase, pendenciasResponsavel, pendenciasTexto, signerPendente, integridadeDasFontes,
  type Conselho, type OrigemDados, type ResponsavelTecnico,
} from '../../documents/laudo/comum';
import { pendenciasLaudoTributario } from '../../documents/laudo/tributaria';
import { pendenciasLaudoDiagnostico } from '../../documents/laudo/diagnostico';
import { ResponsavelLaudoCard } from '../laudo/ResponsavelLaudoCard';

interface UnifiedServiceRunnerViewProps {
  service: ServiceDefinition;
  tenantId: string;
  tenantName: string;
  tenantCnpj: string;
  onBack: () => void;
  onReportGenerated?: (report: StandardizedAuditReport) => void;
}

export const UnifiedServiceRunnerView: React.FC<UnifiedServiceRunnerViewProps> = ({
  service,
  tenantId,
  tenantName,
  tenantCnpj,
  onBack,
  onReportGenerated
}) => {
  if (service.serviceId === 'judicial_expertise') {
    return (
      <PericiaEsteiraView
        service={service}
        tenantId={tenantId}
        tenantName={tenantName}
        tenantCnpj={tenantCnpj}
        onBack={onBack}
        onReportGenerated={onReportGenerated}
      />
    );
  }

  if (service.serviceId === 'inss_expertise') {
    return (
      <InssPrevidenciarioRunnerView
        initialService={service}
        tenantId={tenantId}
        tenantName={tenantName}
        tenantCnpj={tenantCnpj}
        onBack={onBack}
        onReportGenerated={onReportGenerated}
      />
    );
  }

  if (service.serviceId === 'precatorio_management') {
    return (
      <PrecatorioEnterpriseRunnerView
        service={service}
        tenantId={tenantId}
        tenantName={tenantName}
        tenantCnpj={tenantCnpj}
        onBack={onBack}
        onReportGenerated={onReportGenerated}
      />
    );
  }

  if (service.serviceId === 'loas_bpc') {
    return (
      <LoasRunnerView
        service={service}
        tenantId={tenantId}
        tenantName={tenantName}
        tenantCnpj={tenantCnpj}
        onBack={onBack}
      />
    );
  }

  return (
    <GenericServiceRunner
      service={service}
      tenantId={tenantId}
      tenantName={tenantName}
      tenantCnpj={tenantCnpj}
      onBack={onBack}
      onReportGenerated={onReportGenerated}
    />
  );
};

/**
 * Esteiras sem view dedicada (Recuperação Tributária, Diagnóstico Risco & ROI e demais).
 * Componente separado para que nenhum hook rode depois dos returns condicionais acima.
 */
const GenericServiceRunner: React.FC<UnifiedServiceRunnerViewProps> = ({
  service,
  tenantId,
  tenantName,
  tenantCnpj,
  onBack,
  onReportGenerated
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    cnpj: tenantCnpj,
    tenant_cnpj: tenantCnpj,
    cnpj_construtora: tenantCnpj,
    cpf_ou_cnpj_credor: tenantCnpj
  });
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [pipelineState, setPipelineState] = useState<PipelineStageState>({
    currentStageId: service.pipeline.initialStageId,
    progressPct: 15,
    stageTimestamps: {
      // ISO real: o stepper calcula SLA a partir do timestamp do predecessor.
      [service.pipeline.initialStageId]: new Date().toISOString()
    }
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<StandardizedAuditReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // ── P28: conteúdo do responsável técnico e cadeia de custódia ──
  const [custodia, setCustodia] = useState<Record<string, ArquivoCustodia>>({});
  const [custodiaErro, setCustodiaErro] = useState<string | null>(null);
  const [responsavel, setResponsavel] = useState<ResponsavelTecnico>(RESPONSAVEL_VAZIO);
  const [textos, setTextos] = useState<Record<string, string>>({ fundamentacao: '', conclusao: '' });
  const [parecerFavoravel, setParecerFavoravel] = useState<boolean | null>(null);

  const isTax = service.serviceId === 'tax_recovery' || service.serviceId === 'legal_tax_recovery';
  const isDiag = service.serviceId === 'risk_roi_diagnosis';
  const conselhosAceitos = useMemo(
    () => service.responsibleClass.map(String).filter((c): c is Conselho => (CONSELHOS as string[]).includes(c)),
    [service.responsibleClass]
  );
  const taxBase = useMemo(
    () => (isTax ? generateTaxRecoveryPayload({ monthsCount: 60, tenantCnpj, tenantName }) : null),
    [isTax, tenantCnpj, tenantName]
  );
  const hojeIso = new Date().toISOString().slice(0, 10);
  // A memória tributária ainda sai do gerador; quando o parser SPED entrar, a origem passa a 'documentos_custodiados'.
  const origemDados: OrigemDados = isTax
    ? 'gerador_demonstracao'
    : Object.keys(custodia).length ? 'documentos_custodiados' : 'nao_informada';

  const pendenciasLaudo = useMemo(() => {
    const base = {
      estagiosPendentes: [] as string[],
      arquivosCustodia: Object.keys(custodia).length,
      origemDados,
      modoDemonstracao: IS_DEMO_MODE,
    };
    if (isTax && taxBase) {
      const p = pendenciasLaudoTributario(
        {
          ...base,
          cnpj: tenantCnpj,
          competencias: taxBase.memoria_calculo.map((m) => m.competencia),
          dataReferencia: hojeIso,
          teses: taxBase.base_legal_aplicada.map((b) => b.law),
        },
        { responsavel, fundamentacao: textos.fundamentacao, conclusao: textos.conclusao }
      );
      if (parecerFavoravel === null) p.push('Indique o sentido do parecer (favorável ou desfavorável ao crédito).');
      return p;
    }
    if (isDiag) {
      return pendenciasLaudoDiagnostico(
        {
          ...base,
          cnpj: String(formData.tenant_cnpj || tenantCnpj),
          exercicio: String(formData.exercicio || ''),
          dreCustodiada: !!custodia.accounting_dre,
          extratoCustodiado: !!custodia.bank_statement,
          anoAtual: new Date().getFullYear(),
        },
        { responsavel, conclusao: textos.conclusao }
      );
    }
    return [
      ...pendenciasBase(base),
      ...pendenciasResponsavel(responsavel, conselhosAceitos),
      ...pendenciasTexto('a conclusão do laudo', textos.conclusao, 40),
    ];
  }, [isTax, isDiag, taxBase, custodia, origemDados, tenantCnpj, hojeIso, responsavel, textos, parecerFavoravel, formData, conselhosAceitos]);

  // Checagem de preenchimento dos inputs obrigatórios
  const missingRequired = service.contract.requiredInputs.filter(req => {
    if (req.type === 'file') {
      return !uploadedFiles[req.key];
    }
    const val = formData[req.key];
    return !val || (typeof val === 'string' && val.trim().length === 0);
  });

  const canEmitReport = missingRequired.length === 0 && pendenciasLaudo.length === 0 && !isProcessing;

  const handleFileChange = async (key: string, file: File | null) => {
    setCustodiaErro(null);
    if (file) {
      try {
        const registro = await registrarCustodiaArquivo(file.name, await file.arrayBuffer(), 'Responsável técnico / Velatrix Custody Enclave');
        setUploadedFiles(prev => ({ ...prev, [key]: file }));
        setCustodia(prev => ({ ...prev, [key]: registro }));
      } catch {
        setCustodiaErro(`Falha ao gerar o SHA-256 de ${file.name}: o arquivo não entrou na cadeia de custódia.`);
      }
    } else {
      setCustodia(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setUploadedFiles(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Simulação da Esteira até Estágio Terminal com Geração de Laudo Real
  const handleExecutePipeline = () => {
    if (pendenciasLaudo.length) {
      setPipelineState(prev => ({ ...prev, blockedReason: `Laudo bloqueado: ${pendenciasLaudo[0]}` }));
      return;
    }
    const t0 = performance.now();
    if (missingRequired.length > 0) {
      setPipelineState(prev => ({
        ...prev,
        blockedReason: `Entradas obrigatórias pendentes: ${missingRequired.map(r => r.label).join(', ')}`,
        missingRequirements: missingRequired.map(r => r.label)
      }));
      return;
    }

    setIsProcessing(true);
    setPipelineState(prev => ({
      ...prev,
      blockedReason: undefined,
      missingRequirements: [],
      progressPct: 40
    }));

    // Simulação progressiva pelos estágios da esteira
    const stages = service.pipeline.stages;
    let stepIndex = 1;

    const interval = setInterval(() => {
      if (stepIndex < stages.length - 1) {
        const currentStage = stages[stepIndex];
        setPipelineState(prev => ({
          ...prev,
          currentStageId: currentStage.id,
          progressPct: Math.round(((stepIndex + 1) / stages.length) * 100),
          stageTimestamps: {
            ...prev.stageTimestamps,
            [currentStage.id]: new Date().toISOString()
          }
        }));
        stepIndex++;
      } else {
        clearInterval(interval);
        const terminalStage = stages[stages.length - 1];

        // Geração do Laudo Oficial Padronizado
        const reportTimestamp = new Date().toISOString();
        const randId = secureInt(10000, 99999);
        const reportId = `${service.reportSchema.idPrefix}-${randId}`;
        // Fonte verificada = arquivo com SHA-256 na custódia; campo digitado não é fonte.
        const sourceDocNames = Object.values(custodia).map(c => `${c.filename} [SHA-256: ${c.sha256.slice(0, 8)}…]`);

        // Construção do sectionsPayload estruturado e tipado
        let sectionsPayload: Record<string, any>;
        if (service.serviceId === 'tax_recovery' || service.serviceId === 'legal_tax_recovery') {
          sectionsPayload = generateTaxRecoveryPayload({
            monthsCount: 60,
            tenantCnpj,
            tenantName,
            parecer: {
              conclusao: textos.conclusao.trim(),
              responsavelTecnico: responsavel.nome.trim(),
              registroProfissional: responsavel.registro.trim(),
              orgaoClasse: responsavel.conselho,
              parecerFavoravel: parecerFavoravel === true,
              fundamentoResumido: textos.fundamentacao.trim(),
              observacoes: origemDados === 'gerador_demonstracao'
                ? ['Memória de cálculo produzida pelo gerador de demonstração: sem validade oficial.']
                : []
            }
          });
        } else {
          sectionsPayload = {
            ...formData,
            evidences: sourceDocNames,
            legalBasis: service.legalBasis,
            conclusion: textos.conclusao.trim()
          };
        }

        const issuedAtFormatted = new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const lgpdCompliance = {
          isCompliant: true,
          dataProtectionOfficer: 'DPO Velatrix Trust & Security Enclave',
          dataMaskingApplied: true,
          retentionPeriodDays: 1825, // 5 anos
          legalBasis: service.legalBasis.map(l => l.law).join('; '),
          anonymizedFields: ['Dados bancários parciais', 'Hash de procuração']
        };

        // P28: signatário = responsável informado; ICP-Brasil acontece depois, no fluxo de assinatura.
        const signer = signerPendente(responsavel, 'Responsável Técnico');

        const pipelineSnapshot = {
          verifiedRealSources: sourceDocNames,
          executionTimeMs: Math.round(performance.now() - t0),
          dataSourceIntegrity: integridadeDasFontes(origemDados)
        };

        // Guard de Emissão P0: Validação estrita Zod ANTES de calcular o hash SHA-256
        let auditHash: string;
        try {
          auditHash = validateAndComputeReportHash({
            reportId,
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            reportType: service.reportSchema.reportType,
            reportTypeLabel: service.reportSchema.reportTypeLabel,
            issuedAt: reportTimestamp,
            issuedAtFormatted,
            tenantId,
            tenantName,
            tenantCnpj,
            lgpdCompliance,
            signer,
            pipelineSnapshot,
            sectionsPayload
          });
        } catch (guardErr: any) {
          console.error('[UnifiedServiceRunnerView] Bloqueio pelo Guard de Emissão:', guardErr);
          setIsProcessing(false);
          setPipelineState(prev => ({
            ...prev,
            blockedReason: `Bloqueio de Emissão P0: ${guardErr.message || 'Falha de validação Zod.'}`
          }));
          return;
        }

        const newReport: StandardizedAuditReport = {
          reportId,
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          reportType: service.reportSchema.reportType,
          reportTypeLabel: service.reportSchema.reportTypeLabel,
          issuedAt: reportTimestamp,
          issuedAtFormatted,
          tenantId,
          tenantName,
          tenantCnpj,
          lgpdCompliance,
          auditHash,
          signer,
          pipelineSnapshot,
          sectionsPayload
        };

        setPipelineState(prev => ({
          ...prev,
          currentStageId: terminalStage.id,
          progressPct: 100,
          stageTimestamps: {
            ...prev.stageTimestamps,
            [terminalStage.id]: new Date().toISOString()
          }
        }));

        setIsProcessing(false);
        setGeneratedReport(newReport);
        setIsReportModalOpen(true);

        if (onReportGenerated) {
          onReportGenerated(newReport);
        }
      }
    }, 700);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <span>{service.segment.label}</span>
              <span>•</span>
              <span>v{service.version}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              {service.serviceName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExecutePipeline}
            disabled={!canEmitReport}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${
              canEmitReport 
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-400 hover:to-emerald-500 text-slate-950 shadow-cyan-900/40 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                <span>Processando Esteira...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Emitir Laudo Padronizado</span>
              </>
            )}
          </button>

          {generatedReport && (
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ver Laudo Emitido</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper Dinâmico */}
      <ServicePipelineStepper
        pipeline={service.pipeline}
        state={pipelineState}
        serviceContract={service.contract}
        onResolveRequirements={() => {
          const firstPending = document.getElementById('inputs-section');
          firstPending?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Base Legal & Informações Regulatórias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4" /> Base Legal Vinculante Declarada
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {service.legalBasis.map((base, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="font-bold text-white block">{base.law}</span>
                {base.article && <span className="text-[11px] font-mono text-cyan-300 block">{base.article}</span>}
                <span className="text-[11px] text-slate-400 mt-0.5 block">{base.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Responsabilidade Técnica Exigida
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {service.responsibleClass.map(cls => (
                <span key={cls} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold text-xs">
                  Registro {cls}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Laudo emitido pendente de assinatura ICP-Brasil do responsável técnico; retenção probatória de 5 anos (LGPD).
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>Vedado qualquer uso de dados estimados no laudo final.</span>
          </div>
        </div>
      </div>

      {/* Seção de Formulário de Entrada do Contrato */}
      <div id="inputs-section" className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Ingestão de Fontes e Artefatos do Contrato
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Preencha ou anexe os documentos reais para alimentar a esteira de auditoria.
            </p>
          </div>

          {missingRequired.length > 0 ? (
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/60">
              {missingRequired.length} campo(s) obrigatório(s) pendente(s)
            </span>
          ) : (
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Requisitos Atendidos
            </span>
          )}
        </div>

        {/* Inputs Obrigatórios */}
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
            Entradas Mandatórias (Sem Dados Estimados)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.contract.requiredInputs.map(input => {
              const isFile = input.type === 'file';
              const fileAttached = uploadedFiles[input.key];
              const value = formData[input.key] || '';

              return (
                <div 
                  key={input.key}
                  className={`p-4 rounded-xl border transition-all ${
                    (isFile ? fileAttached : value) 
                      ? 'bg-slate-950/60 border-slate-800' 
                      : 'bg-slate-950/90 border-slate-700/80 ring-1 ring-cyan-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <label className="text-xs font-bold text-slate-200 block">
                      {input.label} <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {input.type.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-3 leading-snug">
                    {input.description}
                  </p>

                  {isFile ? (
                    <div>
                      {fileAttached ? (
                        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/60 flex items-center justify-between text-xs">
                          <span className="text-emerald-300 font-mono truncate">{fileAttached.name}</span>
                          <button
                            type="button"
                            onClick={() => handleFileChange(input.key, null)}
                            className="text-slate-400 hover:text-rose-400 text-xs font-mono ml-2 cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors bg-slate-900/50 hover:bg-slate-900">
                          <UploadCloud className="w-5 h-5 text-cyan-400" />
                          <span className="text-xs text-slate-300 font-medium">Selecionar Arquivo Real</span>
                          {input.formats && (
                            <span className="text-[10px] font-mono text-slate-500">
                              Formatos aceitos: {input.formats.join(', ')}
                            </span>
                          )}
                          <input
                            type="file"
                            className="hidden"
                            accept={input.formats?.join(',')}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileChange(input.key, f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={value}
                      placeholder={`Informe ${input.label}...`}
                      onChange={(e) => handleFieldChange(input.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inputs Opcionais */}
        {service.contract.optionalInputs.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
              Entradas Complementares (Opcionais)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.contract.optionalInputs.map(input => {
                const isFile = input.type === 'file';
                const fileAttached = uploadedFiles[input.key];
                const value = formData[input.key] || '';

                return (
                  <div key={input.key} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        {input.label}
                      </label>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                        OPCIONAL
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-3 leading-snug">
                      {input.description}
                    </p>

                    {isFile ? (
                      <div>
                        {fileAttached ? (
                          <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/60 flex items-center justify-between text-xs">
                            <span className="text-cyan-300 font-mono truncate">{fileAttached.name}</span>
                            <button
                              type="button"
                              onClick={() => handleFileChange(input.key, null)}
                              className="text-slate-400 hover:text-rose-400 text-xs font-mono ml-2 cursor-pointer"
                            >
                              Remover
                            </button>
                          </div>
                        ) : (
                          <label className="border border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-900/30 text-slate-400 text-xs">
                            <UploadCloud className="w-4 h-4 text-slate-400" />
                            <span>Anexar {input.formats?.join(', ')}</span>
                            <input
                              type="file"
                              className="hidden"
                              accept={input.formats?.join(',')}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileChange(input.key, f);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={value}
                        placeholder={`Opcional: ${input.label}`}
                        onChange={(e) => handleFieldChange(input.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-slate-600 font-mono"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {custodiaErro && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">{custodiaErro}</div>
      )}

      {/* P28 — Responsável técnico e conteúdo do laudo */}
      <ResponsavelLaudoCard
        conselhosAceitos={conselhosAceitos}
        responsavel={responsavel}
        onResponsavelChange={setResponsavel}
        campos={[
          ...(isTax
            ? [{ key: 'fundamentacao', label: 'Fundamentação técnica do crédito', placeholder: 'Teses, dispositivos legais e critério de apuração adotados…', min: 40, value: textos.fundamentacao }]
            : []),
          { key: 'conclusao', label: 'Conclusão do laudo', placeholder: 'Conclusão redigida pelo responsável técnico…', min: 40, value: textos.conclusao }
        ]}
        onCampoChange={(k, v) => setTextos(prev => ({ ...prev, [k]: v }))}
        pendencias={pendenciasLaudo}
        avisoDemonstracao={origemDados === 'gerador_demonstracao' && IS_DEMO_MODE}
      >
        {isTax && (
          <label className="block space-y-1 max-w-xs">
            <span className="text-[11px] font-bold text-slate-300">Sentido do parecer</span>
            <select
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
              value={parecerFavoravel === null ? '' : parecerFavoravel ? 'sim' : 'nao'}
              onChange={(e) => setParecerFavoravel(e.target.value === '' ? null : e.target.value === 'sim')}
            >
              <option value="">Selecione…</option>
              <option value="sim">Favorável ao crédito</option>
              <option value="nao">Desfavorável</option>
            </select>
          </label>
        )}
        {isDiag && (
          <label className="block space-y-1 max-w-xs">
            <span className="text-[11px] font-bold text-slate-300">Exercício das demonstrações (AAAA)</span>
            <input
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono"
              value={String(formData.exercicio || '')}
              onChange={(e) => handleFieldChange('exercicio', e.target.value)}
            />
          </label>
        )}
      </ResponsavelLaudoCard>

      {/* Modal de Laudo Oficial */}
      <StandardizedAuditReportModal
        report={generatedReport}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
