import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Sparkles,
  Scale,
  Building,
  UserCheck,
  Copy,
  Check,
  AlertOctagon
} from 'lucide-react';
import { ServiceDefinition } from '../../types/serviceDefinition';
import { 
  StandardizedAuditReport, 
  PipelineStageState, 
  TipoBeneficio, 
  BENEFICIO_LABELS,
  BENEFICIO_CONSELHOS_MAP 
} from '../../types/standardizedPipeline';
import { ServicePipelineStepper } from '../common/ServicePipelineStepper';
import { StandardizedAuditReportModal } from '../common/StandardizedAuditReportModal';
import { getInssServiceDefinitionForBeneficio } from '../../services/registry/definitions/inssExpertiseService';
import { validarAnexoSemantico } from '../../shared/validators/laudoIngestValidator';
import { registrarCustodiaArquivo, ArquivoCustodia, formatShortSha256 } from '../../shared/upload/sha256Store';
import { auditCnisCtcCrossCheck, VinculoPrevidenciarioPeriodo } from '../../shared/validators/cnisCtcCrossCheck';
import { validateAndComputeReportHash } from '../../services/reportEmissionGuardService';
import { secureInt, IS_DEMO_MODE } from '../../lib/demoMode';
import {
  RESPONSAVEL_VAZIO, signerPendente, integridadeDasFontes, type OrigemDados, type ResponsavelTecnico,
} from '../../documents/laudo/comum';
import { pendenciasLaudoInss, type StatusCrossCheck } from '../../documents/laudo/inss';
import { ResponsavelLaudoCard } from '../laudo/ResponsavelLaudoCard';

interface InssPrevidenciarioRunnerViewProps {
  initialService: ServiceDefinition;
  tenantId: string;
  tenantName: string;
  tenantCnpj: string;
  onBack: () => void;
  onReportGenerated?: (report: StandardizedAuditReport) => void;
}

export const InssPrevidenciarioRunnerView: React.FC<InssPrevidenciarioRunnerViewProps> = ({
  initialService,
  tenantId,
  tenantName,
  tenantCnpj,
  onBack,
  onReportGenerated
}) => {
  // FIX 5: Bifurcação por tipoBeneficio com seletor no topo
  const [tipoBeneficio, setTipoBeneficio] = useState<TipoBeneficio>('programado');
  const service = getInssServiceDefinitionForBeneficio(tipoBeneficio);

  // P28: nada pré-preenchido — CPF, nascimento e DER vêm do segurado.
  const [formData, setFormData] = useState<Record<string, any>>({
    cpf: '',
    data_nascimento: '',
    der: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [custodiaArquivos, setCustodiaArquivos] = useState<Record<string, ArquivoCustodia>>({});
  const [copiedHashKey, setCopiedHashKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [crossCheckError, setCrossCheckError] = useState<string | null>(null);

  const [pipelineState, setPipelineState] = useState<PipelineStageState>({
    currentStageId: service.pipeline.initialStageId,
    progressPct: 15,
    stageTimestamps: {
      [service.pipeline.initialStageId]: new Date().toISOString()
    }
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<StandardizedAuditReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // ── P28: responsável técnico, conteúdo e regras de emissão ──
  const [responsavel, setResponsavel] = useState<ResponsavelTecnico>(RESPONSAVEL_VAZIO);
  const [textos, setTextos] = useState<Record<string, string>>({ analise: '', conclusao: '' });
  const [crossCheckStatus, setCrossCheckStatus] = useState<StatusCrossCheck>('nao_executado');
  const conselhosAceitos = BENEFICIO_CONSELHOS_MAP[tipoBeneficio];
  const origemDados: OrigemDados = Object.keys(custodiaArquivos).length ? 'documentos_custodiados' : 'nao_informada';
  const pendenciasLaudo = useMemo(
    () =>
      pendenciasLaudoInss(
        {
          estagiosPendentes: [],
          arquivosCustodia: Object.keys(custodiaArquivos).length,
          origemDados,
          modoDemonstracao: IS_DEMO_MODE,
          cpf: String(formData.cpf || ''),
          dataNascimento: String(formData.data_nascimento || ''),
          der: String(formData.der || ''),
          cnisCustodiado: !!custodiaArquivos.cnis,
          crossCheck: crossCheckStatus,
          conselhosAceitos,
          hoje: new Date().toISOString().slice(0, 10),
        },
        { responsavel, analise: textos.analise, conclusao: textos.conclusao }
      ),
    [custodiaArquivos, origemDados, formData, crossCheckStatus, conselhosAceitos, responsavel, textos]
  );

  // FIX 4: Checagem dos requisitos mandatórios (6 mandatórios na base + condicionais)
  const missingRequired = service.contract.requiredInputs.filter(req => {
    if (req.type === 'file') {
      return !uploadedFiles[req.key];
    }
    const val = formData[req.key];
    return !val || (typeof val === 'string' && val.trim().length === 0);
  });

  const canEmitReport = missingRequired.length === 0 && pendenciasLaudo.length === 0 && !isProcessing && !uploadError && !crossCheckError;

  // FIX 8 & FIX 6: Upload com validação semântica probatória e registro SHA-256
  const handleFileChange = async (key: string, file: File | null) => {
    setUploadError(null);
    setCrossCheckError(null);
    if (key === 'cnis' || key === 'ctc_vinculos') setCrossCheckStatus('nao_executado');

    if (!file) {
      setUploadedFiles(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setCustodiaArquivos(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    // FIX 6: Validação semântica para rejeitar documentos cadastrais ou comerciais em slots probatórios
    if (['cnis', 'ctc_vinculos', 'simulacao_meu_inss'].includes(key)) {
      const validacao = await validarAnexoSemantico(file, 'probatorio_previdenciario');
      if (!validacao.ok) {
        setUploadError(`[REJEITADO PELA AUDITORIA INSS]: ${validacao.detalhes}`);
        return;
      }
    }

    // FIX 8: Custódia criptográfica SHA-256
    try {
      const bytes = await file.arrayBuffer();
      const registro = await registrarCustodiaArquivo(file.name, bytes, 'Auditor Previdenciário Oficial (OAB/CRC)');
      
      setUploadedFiles(prev => ({ ...prev, [key]: file }));
      setCustodiaArquivos(prev => ({ ...prev, [key]: registro }));

      // FIX 7: Cross-check automático se CTC e CNIS estiverem presentes
      if ((key === 'ctc_vinculos' && uploadedFiles['cnis']) || (key === 'cnis' && uploadedFiles['ctc_vinculos'])) {
        executarCrossCheckCnisCtc();
      }
    } catch (err: any) {
      setUploadError(`Erro ao calcular hash criptográfico: ${err.message}`);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const copyHash = (hash: string, key: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashKey(key);
    setTimeout(() => setCopiedHashKey(null), 2000);
  };

  // FIX 7: Simulação de auditoria CTC x CNIS
  const executarCrossCheckCnisCtc = () => {
    const periodosCtcMock: VinculoPrevidenciarioPeriodo[] = [
      {
        id: 'CTC-01',
        origem: 'CTC',
        empregadorOuOrgao: 'Secretaria de Estado da Educação - SP',
        dataInicio: '2005-02-01',
        dataFim: '2012-12-31',
        diasComputados: 2890
      }
    ];

    const periodosCnisMock: VinculoPrevidenciarioPeriodo[] = [
      {
        id: 'CNIS-01',
        origem: 'CNIS',
        empregadorOuOrgao: 'Secretaria de Estado da Educação - SP',
        dataInicio: '2005-02-01',
        dataFim: '2012-12-31',
        diasComputados: 2890
      }
    ];

    const checkResult = auditCnisCtcCrossCheck(periodosCtcMock, periodosCnisMock);
    // Períodos acima são fixos (mock) até o extrator de vínculos CNIS/CTC entrar: o resultado não sustenta laudo oficial.
    setCrossCheckStatus(checkResult.hasDivergencia ? 'divergencia' : 'dados_simulados');
    if (checkResult.hasDivergencia) {
      setCrossCheckError(`Divergência Crítica (>30 dias): ${checkResult.mensagemStatus}`);
      setPipelineState(prev => ({
        ...prev,
        currentStageId: 'VALIDACAO_TEMPO_CONTRIBUICAO',
        blockedReason: checkResult.mensagemStatus
      }));
    }
  };

  // Execução da esteira e emissão do Laudo com todas as etapas
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
      progressPct: 20
    }));

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

        const reportTimestamp = new Date().toISOString();
        const randId = secureInt(10000, 99999);
        const reportId = `${service.reportSchema.idPrefix}-${randId}`;
        // Fonte verificada = arquivo com SHA-256 na custódia; campo digitado não é fonte.
        const sourceDocNames = Object.values(custodiaArquivos).map(c => `${c.filename} [SHA-256: ${c.sha256.slice(0, 8)}…]`);

        const sectionsPayload = {
          tipoBeneficio,
          beneficioLabel: BENEFICIO_LABELS[tipoBeneficio],
          cpfSegurado: formData.cpf,
          der: formData.der,
          dataNascimento: formData.data_nascimento,
          custodiaArquivos,
          evidences: sourceDocNames,
          legalBasis: service.legalBasis,
          cruzamentoCnisCtc: crossCheckStatus,
          analiseResponsavel: textos.analise.trim(),
          conclusao: textos.conclusao.trim()
        };

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
          retentionPeriodDays: 1825,
          legalBasis: service.legalBasis.map(l => l.law).join('; '),
          anonymizedFields: ['CPF Mascarado', 'Salários de Contribuição Individuais']
        };

        // P28: signatário = responsável informado; ICP-Brasil acontece depois, no fluxo de assinatura.
        const signer = signerPendente(responsavel, 'Responsável Técnico Previdenciário');

        const pipelineSnapshot = {
          verifiedRealSources: sourceDocNames,
          executionTimeMs: Math.round(performance.now() - t0),
          dataSourceIntegrity: crossCheckStatus === 'dados_simulados'
            ? ('DEMONSTRACAO_SEM_VALIDADE' as const)
            : integridadeDasFontes(origemDados)
        };

        let auditHash: string;
        try {
          auditHash = validateAndComputeReportHash({
            reportId,
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            reportType: service.reportSchema.reportType,
            reportTypeLabel: service.reportSchema.reportTypeLabel,
            tenantId,
            tenantName,
            tenantCnpj,
            issuedAt: reportTimestamp,
            issuedAtFormatted,
            signer,
            lgpdCompliance,
            pipelineSnapshot,
            sectionsPayload
          });
        } catch (err: any) {
          // P28: nunca selo substituto. Guard reprovou → o laudo não é emitido.
          setIsProcessing(false);
          setPipelineState(prev => ({ ...prev, blockedReason: `Bloqueio de Emissão: ${err?.message || 'falha de validação.'}` }));
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
    }, 600);
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
                <span>Processando Auditoria...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Emitir Laudo Previdenciário Oficial</span>
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

      {/* FIX 5: Seletor de Tipo de Benefício */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4" /> Tipo de Benefício Previdenciário (Bifurcação de Requisitos)
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Selecione a modalidade pretendida para calibrar os requisitos documentais, base legal e responsáveis técnicos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['programado', 'incapacidade', 'isencao_ir_doenca', 'pensao_morte'] as TipoBeneficio[]).map(tipo => {
            const isSelected = tipoBeneficio === tipo;
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => setTipoBeneficio(tipo)}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                {tipo === 'programado' && 'Programado'}
                {tipo === 'incapacidade' && 'Incapacidade'}
                {tipo === 'isencao_ir_doenca' && 'Isenção IR Doença'}
                {tipo === 'pensao_morte' && 'Pensão por Morte'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner de Erro de Validação Semântica ou Divergência */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/60 text-rose-200 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
              Rejeição de Ingestão de Documento
            </div>
            <p className="text-xs text-rose-200/90 mt-0.5">{uploadError}</p>
          </div>
        </div>
      )}

      {crossCheckError && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/60 text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
              Alerta de Não-Conformidade CNIS x CTC
            </div>
            <p className="text-xs text-amber-200/90 mt-0.5">{crossCheckError}</p>
          </div>
        </div>
      )}

      {/* Stepper Dinâmico com FIX 1, FIX 2 e FIX 3 */}
      <ServicePipelineStepper
        pipeline={service.pipeline}
        state={pipelineState}
        serviceContract={service.contract}
        onResolveRequirements={() => {
          const firstPending = document.getElementById('inss-inputs-section');
          firstPending?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Base Legal & Informações Regulatórias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4" /> Base Legal Vinculante Declarada
          </div>
          <div className="space-y-1.5">
            {service.legalBasis.map((lb, idx) => (
              <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="font-mono text-cyan-300 font-semibold shrink-0">{lb.law} {lb.article ? `(${lb.article})` : ''}:</span>
                <span className="text-slate-400">{lb.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" /> Responsabilidade Técnica
          </div>
          <div className="text-xs text-slate-300">
            <p className="text-slate-400">Classes profissionais legalmente habilitadas:</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {service.responsibleClass.map(cls => (
                <span key={cls} className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {cls}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800">
            Homologação com Assinatura Digital ICP-Brasil A1 vinculante.
          </div>
        </div>
      </div>

      {/* Seção de Ingestão de Fontes e Artefatos (FIX 4, FIX 6 & FIX 8) */}
      <div id="inss-inputs-section" className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Ingestão de Fontes e Artefatos Mandatórios ({service.contract.requiredInputs.length} Requisitos)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Anexe documentos oficiais autênticos (com validação semântica probatória e hash SHA-256).
            </p>
          </div>

          {missingRequired.length > 0 ? (
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/60">
              {missingRequired.length} requisito(s) obrigatório(s) pendente(s)
            </span>
          ) : (
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Requisitos Mandatórios Atendidos
            </span>
          )}
        </div>

        {/* Inputs Mandatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {service.contract.requiredInputs.map(input => {
            const isFile = input.type === 'file';
            const fileAttached = uploadedFiles[input.key];
            const custodia = custodiaArquivos[input.key];
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
                      <div className="space-y-2">
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

                        {/* FIX 8: Exibição do Hash SHA-256 + Badge Íntegro + Botão de Cópia */}
                        {custodia && (
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-[10px] font-mono">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                                ÍNTEGRO
                              </span>
                              <span className="text-slate-400 truncate" title={custodia.sha256}>
                                SHA-256: {formatShortSha256(custodia.sha256)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => copyHash(custodia.sha256, input.key)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                              title="Copiar Hash Completo"
                            >
                              {copiedHashKey === input.key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedHashKey === input.key ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        )}
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
                    type={input.key === 'der' || input.key === 'data_nascimento' ? 'date' : 'text'}
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

      {/* P28 — Responsável técnico e conteúdo do laudo */}
      <ResponsavelLaudoCard
        conselhosAceitos={conselhosAceitos}
        responsavel={responsavel}
        onResponsavelChange={setResponsavel}
        campos={[
          { key: 'analise', label: 'Análise dos vínculos e do tempo de contribuição', placeholder: 'Vínculos considerados, períodos controvertidos, regra de transição aplicada…', min: 40, value: textos.analise },
          { key: 'conclusao', label: 'Conclusão do laudo', placeholder: 'Conclusão redigida pelo responsável técnico…', min: 40, value: textos.conclusao }
        ]}
        onCampoChange={(k, v) => setTextos(prev => ({ ...prev, [k]: v }))}
        pendencias={pendenciasLaudo}
        avisoDemonstracao={crossCheckStatus === 'dados_simulados' && IS_DEMO_MODE}
      />

      {/* Modal de Laudo Oficial Emitido */}
      {generatedReport && (
        <StandardizedAuditReportModal
          report={generatedReport}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};
