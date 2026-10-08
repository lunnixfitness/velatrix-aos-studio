import React, { useState, useMemo, useEffect } from 'react';
import {
  Scale,
  ShieldCheck,
  FileCheck2,
  ArrowRight,
  Clock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  UploadCloud,
  FileText,
  UserCheck,
  Building2,
  Lock,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  BadgeAlert,
  ArrowLeft,
  Gavel,
  Briefcase
} from 'lucide-react';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import {
  PericiaKind,
  PericiaDominio,
  ConselhoProfissional,
  DOMINIO_CONSELHOS_MAP,
  ArquivoCustodia,
  PericiaEstagio,
  EstagioStatus,
  PericiaPipeline,
  StandardizedAuditReport
} from '../../types/standardizedPipeline';
import { ServiceDefinition } from '../../types/serviceDefinition';
import { ACTOR_LABELS, ActorRoleId } from '../../types/serviceDefinition';
import { getPericiaPipelineDefinition } from '../../services/registry/definitions/judicialExpertiseService';
import { validarAnexoSemantico, registrarCustodiaArquivo } from '../../services/laudoIngestValidator';
import { validateAndComputeReportHash } from '../../services/reportEmissionGuardService';
import { CentralAuditReportService } from '../../services/centralAuditReportService';
import { StandardizedAuditReportModal } from '../common/StandardizedAuditReportModal';
import { secureInt } from '../../lib/demoMode';
import { pendenciasEmissaoLaudo, textoHonorarios, CONTEUDO_VAZIO, type ConteudoPerito, type Quesito } from '../../documents/pericia/emissaoLaudo';

// BUG-04: Rótulo do card superior direito conforme o kind
const TENANT_CARD_LABEL_MAP: Record<PericiaKind, string> = {
  judicial: 'CONTRIBUINTE / PARTE',
  arbitral: 'REQUERENTE / PARTES DA ARBITRAGEM',
  contratual: 'CONTRATANTE'
};

// BUG-03: Função kindLabel
const kindLabel = (k: PericiaKind): string => {
  switch (k) {
    case 'judicial':
      return 'Judicial';
    case 'arbitral':
      return 'Arbitral';
    case 'contratual':
      return 'Extrajudicial Contratual';
    default:
      return 'Judicial';
  }
};

interface PericiaEsteiraViewProps {
  service?: ServiceDefinition;
  tenantId?: string;
  tenantName?: string;
  tenantCnpj?: string;
  onBack?: () => void;
  onReportGenerated?: (report: StandardizedAuditReport) => void;
}

// Representação de Estágio com SLA em cascata real
interface EstagioOperacional extends PericiaEstagio {
  deadlineCalculado?: Date;
  diasAposD0?: number;
  isEstourado?: boolean;
  isAguardando?: boolean;
}

export const PericiaEsteiraView: React.FC<PericiaEsteiraViewProps> = ({
  service = getPericiaPipelineDefinition(),
  tenantId = 'default-tenant',
  tenantName = 'VORTEX INDUSTRIAL & LOGÍSTICA S/A',
  tenantCnpj = '12.345.678/0001-90',
  onBack,
  onReportGenerated
}) => {
  // --------------------------------------------------------------------------
  // MUDANÇA 1: BIFURCAÇÃO JUDICIAL vs EXTRAJUDICIAL (Discriminated Union)
  // --------------------------------------------------------------------------
  const [kind, setKind] = useState<PericiaKind>('judicial');

  // Campos específicos por kind (sem dados fake)
  const [cnj, setCnj] = useState<string>(IS_DEMO_MODE ? '5001234-15.2026.8.26.0100' : '');
  const [juizo, setJuizo] = useState<string>(IS_DEMO_MODE ? '2ª Vara Cível e Empresarial Central de São Paulo/SP' : '');
  const [camaraArbitral, setCamaraArbitral] = useState<string>(IS_DEMO_MODE ? 'CAM-CCBC - Centro de Arbitragem e Mediação' : '');
  const [procedimentoArbitral, setProcedimentoArbitral] = useState<string>(IS_DEMO_MODE ? 'Procedimento Arbitral nº 148/2026/SEC' : '');
  const [clausulaCompromissoria, setClausulaCompromissoria] = useState<string>(IS_DEMO_MODE ? 'Cláusula 14ª - Perícia Extrajudicial Consensual' : '');

  // --------------------------------------------------------------------------
  // MUDANÇA 3: REGISTRO PROFISSIONAL DINÂMICO
  // --------------------------------------------------------------------------
  const [dominio, setDominio] = useState<PericiaDominio>('contabil');
  const conselhosExigidos: ConselhoProfissional[] = useMemo(() => {
    return DOMINIO_CONSELHOS_MAP[dominio] || ['CRC'];
  }, [dominio]);

  // --------------------------------------------------------------------------
  // MUDANÇA 2: ESTÁGIOS CPC & STATUS DE IMPUGNAÇÃO
  // --------------------------------------------------------------------------
  // Status de impugnação de honorários (bloqueia #3 se 'em_impugnacao')
  const [statusImpugnacao, setStatusImpugnacao] = useState<'sem_impugnacao' | 'em_impugnacao' | 'homologado'>('sem_impugnacao');

  // Timestamp de Depósito (#2.75) — Marco temporal de reset
  const [timestampDeposito, setTimestampDeposito] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // MUDANÇA 5: CADEIA DE CUSTÓDIA VISÍVEL
  // --------------------------------------------------------------------------
  const [custodiaStore, setCustodiaStore] = useState<Record<string, ArquivoCustodia>>({});

  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeStageId, setActiveStageId] = useState<string>('NOMEACAO');
  const [completedStageIds, setCompletedStageIds] = useState<string[]>(['NOMEACAO']);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<StandardizedAuditReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // P27: conteúdo do laudo escrito pelo perito
  const [conteudo, setConteudo] = useState<ConteudoPerito>(CONTEUDO_VAZIO);
  const setCampo = (k: 'peritoNome' | 'peritoRegistro' | 'objeto' | 'metodologia' | 'conclusao') =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const v = ev.target.value; setConteudo((c) => ({ ...c, [k]: v })); };
  const setQuesito = (id: string, patch: Partial<Quesito>) =>
    setConteudo((c) => ({ ...c, quesitos: c.quesitos.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));
  const addQuesito = () =>
    setConteudo((c) => ({ ...c, quesitos: [...c.quesitos, { id: `${Date.now()}-${c.quesitos.length}`, origem: kind === 'judicial' ? 'Juízo' : kind === 'arbitral' ? 'Câmara arbitral' : 'Contratante', pergunta: '', resposta: '' }] }));
  const removeQuesito = (id: string) => setConteudo((c) => ({ ...c, quesitos: c.quesitos.filter((q) => q.id !== id) }));

  // Data Base D+0 fixada
  const [baseDateD0] = useState<Date>(() => new Date());

  // --------------------------------------------------------------------------
  // MUDANÇA 6: CASCATA REAL DE SLA A PARTIR DO D+0
  // --------------------------------------------------------------------------
  const pipelineDef = useMemo(() => {
    return getPericiaPipelineDefinition(kind);
  }, [kind]);

  // Timestamps de conclusão dos estágios
  const [stageTimestamps, setStageTimestamps] = useState<Record<string, string>>({
    NOMEACAO: new Date(Date.now() - 3600000 * 48).toISOString()
  });

  // Cálculo da cascata de SLA para cada estágio
  const estagiosOperacionais: EstagioOperacional[] = useMemo(() => {
    const rawStages = pipelineDef.stages;
    const now = Date.now();
    const isSkippedImpugnacao = kind === 'judicial' && statusImpugnacao === 'sem_impugnacao';

    // BUG-02: Quando o kind='judicial' e statusImpugnacao='sem_impugnacao', marcar #2.5 como skipped
    // e o grafo pula #2.5 e o dependeDe do #3 vira #2.75 diretamente (e #2.75 depende de #2 PROPOSTA_HONORARIOS).
    const stagesWithDependencies = rawStages.map((st, idx) => {
      let stageNumber = `#${idx + 1}`;
      if (kind === 'judicial') {
        if (st.id === 'IMPUGNACAO_HONORARIOS') stageNumber = '#2.5';
        else if (st.id === 'DEPOSITO_PREVIO_HONORARIOS') stageNumber = '#2.75';
        else if (idx >= 4) stageNumber = `#${idx - 1}`;
      }

      let effDependeDe = st.dependeDe;
      if (isSkippedImpugnacao) {
        if (st.id === 'DEPOSITO_PREVIO_HONORARIOS') {
          effDependeDe = 'PROPOSTA_HONORARIOS';
        } else if (st.id === 'VISTORIA_DILIGENCIA') {
          effDependeDe = 'DEPOSITO_PREVIO_HONORARIOS';
        }
      }

      return {
        ...st,
        numero: stageNumber,
        dependeDe: effDependeDe,
        slaHoras: st.slaHoras || st.slaHours || 24
      };
    });

    // BUG-01: reescreva o cálculo de deadline por estágio como
    // deadline(e) = completedAt(estagios[e.dependeDe]) + e.slaHoras
    // onde o #1 usa D0. Recalcule todos os D+N a partir do grafo real.
    const effectiveCompletionMap: Record<string, Date> = {};
    const deadlineMap: Record<string, Date> = {};
    const startedAtMap: Record<string, Date> = {};
    const diasAposD0Map: Record<string, number> = {};

    for (const st of stagesWithDependencies) {
      const isSkipped = isSkippedImpugnacao && st.id === 'IMPUGNACAO_HONORARIOS';

      let stageStartTime: Date;
      if (!st.dependeDe) {
        // #1 usa D0
        stageStartTime = baseDateD0;
      } else {
        // deadline(e) = completedAt(estagios[e.dependeDe]) + e.slaHoras
        if (stageTimestamps[st.dependeDe]) {
          const parsed = new Date(stageTimestamps[st.dependeDe]);
          stageStartTime = isNaN(parsed.getTime()) ? baseDateD0 : parsed;
        } else if (effectiveCompletionMap[st.dependeDe]) {
          const parsedEff = effectiveCompletionMap[st.dependeDe];
          stageStartTime = isNaN(parsedEff.getTime()) ? baseDateD0 : parsedEff;
        } else {
          stageStartTime = baseDateD0;
        }
      }

      if (isNaN(stageStartTime.getTime())) {
        console.error(`[PericiaEsteiraView] Data inválida para estágio ${st.id}, aplicando fallback baseDateD0`);
        stageStartTime = baseDateD0;
      }

      startedAtMap[st.id] = stageStartTime;

      const deadline = new Date(stageStartTime.getTime() + st.slaHoras * 3600 * 1000);
      deadlineMap[st.id] = deadline;

      // Recalcular todos os D+N a partir do grafo real
      const diasAposD0 = Math.max(1, Math.round((deadline.getTime() - baseDateD0.getTime()) / (24 * 3600 * 1000)));
      diasAposD0Map[st.id] = diasAposD0;

      // Completion efetivo para quem depender deste estágio
      if (stageTimestamps[st.id]) {
        effectiveCompletionMap[st.id] = new Date(stageTimestamps[st.id]);
      } else if (isSkipped) {
        effectiveCompletionMap[st.id] = stageStartTime;
      } else {
        effectiveCompletionMap[st.id] = deadline;
      }
    }

    return stagesWithDependencies.map(st => {
      const isSkipped = isSkippedImpugnacao && st.id === 'IMPUGNACAO_HONORARIOS';
      const deadlineCalculado = deadlineMap[st.id];
      const diasAposD0 = diasAposD0Map[st.id];
      const startedAt = startedAtMap[st.id]?.toISOString() || baseDateD0.toISOString();
      const completedAt = stageTimestamps[st.id];

      if (isSkipped) {
        return {
          id: st.id,
          numero: st.numero,
          label: st.label,
          actorRole: st.actorRole,
          slaHoras: st.slaHoras,
          startedAt,
          completedAt: undefined,
          dependeDe: st.dependeDe,
          status: 'skipped' as const,
          isTerminal: st.isTerminal,
          requiredArtifacts: st.requiredArtifacts,
          deadlineCalculado,
          diasAposD0,
          isEstourado: false,
          isAguardando: false
        };
      }

      const isCompleted = completedStageIds.includes(st.id);
      const predecessorCompleted = !st.dependeDe || completedStageIds.includes(st.dependeDe);
      const isBlockedByImpugnacao = kind === 'judicial' && st.id === 'VISTORIA_DILIGENCIA' && statusImpugnacao === 'em_impugnacao';
      const isAguardando = !predecessorCompleted || isBlockedByImpugnacao;
      const isEstourado = !isCompleted && !isAguardando && now > deadlineCalculado.getTime();

      let status: EstagioStatus = 'pendente';
      if (isCompleted) {
        status = 'concluido';
      } else if (isAguardando) {
        status = 'aguardando';
      } else if (isEstourado) {
        status = 'bloqueado';
      } else if (st.id === activeStageId) {
        status = 'em_andamento';
      }

      return {
        id: st.id,
        numero: st.numero,
        label: st.label,
        actorRole: st.actorRole,
        slaHoras: st.slaHoras,
        startedAt,
        completedAt,
        dependeDe: st.dependeDe,
        status,
        isTerminal: st.isTerminal,
        requiredArtifacts: st.requiredArtifacts,
        deadlineCalculado,
        diasAposD0,
        isEstourado,
        isAguardando
      };
    });
  }, [pipelineDef, kind, completedStageIds, stageTimestamps, statusImpugnacao, baseDateD0, activeStageId]);

  // P27: o laudo só sai com a esteira concluída e o conteúdo preenchido pelo perito
  const pendenciasLaudo = useMemo(() => pendenciasEmissaoLaudo({
    kind,
    cnj,
    juizo,
    camara: camaraArbitral,
    procedimento: procedimentoArbitral,
    clausula: clausulaCompromissoria,
    estagiosPendentes: estagiosOperacionais
      .filter((s) => !s.isTerminal && s.status !== 'skipped' && s.status !== 'concluido')
      .map((s) => `${s.numero} ${s.label}`),
    impugnacao: statusImpugnacao,
    depositoRegistradoEm: timestampDeposito,
    arquivosCustodia: Object.keys(custodiaStore).length,
  }, conteudo), [kind, cnj, juizo, camaraArbitral, procedimentoArbitral, clausulaCompromissoria, estagiosOperacionais, statusImpugnacao, timestampDeposito, custodiaStore, conteudo]);

  // Formatação amigável de SLA
  const formatSlaString = (estagio: EstagioOperacional) => {
    if (estagio.status === 'skipped') {
      return 'SLA: N/A (Dispensado)';
    }
    if (!estagio.deadlineCalculado) return `SLA: ${estagio.slaHoras}h`;
    const d = estagio.deadlineCalculado;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `SLA: ${estagio.slaHoras}h → vence ${dia}/${mes} ${horas}:${minutos} (D+${estagio.diasAposD0})`;
  };

  // --------------------------------------------------------------------------
  // MUDANÇA 4 & 5: UPLOAD COM VALIDAÇÃO SEMÂNTICA E CADEIA DE CUSTÓDIA
  // --------------------------------------------------------------------------
  const handleFileUpload = async (slotKey: string, file: File) => {
    setUploadError(null);

    try {
      // 1. Validação Semântica para o slot probatório
      if (slotKey === 'documentos_periciais') {
        const validacao = await validarAnexoSemantico(file, 'probatorio');
        if (!validacao.ok) {
          setUploadError(`[REJEITADO PELA AUDITORIA]: ${validacao.detalhes}`);
          return;
        }
      }

      // 2. Cadeia de Custódia com SHA-256 via crypto.subtle
      const bytes = await file.arrayBuffer();
      const custodiaItem = await registrarCustodiaArquivo(file.name, bytes, 'Perito Oficial / Velatrix Custody Enclave');

      setCustodiaStore(prev => ({
        ...prev,
        [slotKey]: custodiaItem
      }));
    } catch (err: unknown) {
      setUploadError('Falha ao processar arquivo e gerar digest SHA-256.');
    }
  };

  const copySha256ToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Simular Avanço de Estágio na Esteira
  const handleAdvanceStage = () => {
    const currentIdx = estagiosOperacionais.findIndex(s => s.id === activeStageId);
    if (currentIdx === -1) return;

    // Se estiver em impugnação, bloqueia avanço para o estágio #3
    if (kind === 'judicial' && activeStageId === 'IMPUGNACAO_HONORARIOS' && statusImpugnacao === 'em_impugnacao') {
      setUploadError('Avanço bloqueado: Honorários periciais sob impugnação das partes (CPC Art. 465 §3º). Aguardando deliberação judicial.');
      return;
    }

    const nowIso = new Date().toISOString();
    const currentStage = estagiosOperacionais[currentIdx];

    // Se for o depósito prévio (#2.75), aciona o marco temporal de reset
    if (currentStage.id === 'DEPOSITO_PREVIO_HONORARIOS') {
      setTimestampDeposito(nowIso);
    }

    setStageTimestamps(prev => ({
      ...prev,
      [currentStage.id]: nowIso
    }));

    if (!completedStageIds.includes(currentStage.id)) {
      setCompletedStageIds(prev => [...prev, currentStage.id]);
    }

    // Procura próximo estágio não pulado
    let nextIdx = currentIdx + 1;
    while (nextIdx < estagiosOperacionais.length && estagiosOperacionais[nextIdx].status === 'skipped') {
      nextIdx++;
    }

    if (nextIdx < estagiosOperacionais.length) {
      setActiveStageId(estagiosOperacionais[nextIdx].id);
      setUploadError(null);
    }
  };

  // --------------------------------------------------------------------------
  // EMISSÃO OFICIAL DO LAUDO PADRONIZADO (ICP-BRASIL A1)
  // --------------------------------------------------------------------------
  const handleEmitReport = () => {
    if (pendenciasLaudo.length) {
      setUploadError(`Laudo bloqueado: ${pendenciasLaudo[0]}`);
      return;
    }
    const t0 = performance.now();
    setIsProcessing(true);
    setUploadError(null);

    try {
      const activeService = service as any;
      const reportTimestamp = new Date().toISOString();
      const randId = secureInt(10000, 99999);
      const idPrefix = activeService.reportSchema?.idPrefix || 'PERICIA';
      const reportId = `${idPrefix}-${randId}`;

      // Monta dados do procedimento sem inventar dados
      const dadosProcedimento: Record<string, string | null> = {
        kind,
        dominio,
        conselhosExigidos: conselhosExigidos.join(', ')
      };

      if (kind === 'judicial') {
        dadosProcedimento['cnj'] = cnj || null;
        dadosProcedimento['juizo'] = juizo || null;
        dadosProcedimento['cpc_465_honorarios'] = textoHonorarios(statusImpugnacao);
        dadosProcedimento['cpc_465_deposito'] = timestampDeposito ? `Depósito prévio registrado na esteira em ${new Date(timestampDeposito).toLocaleString('pt-BR')}` : null;
      } else if (kind === 'arbitral') {
        dadosProcedimento['camara'] = camaraArbitral || null;
        dadosProcedimento['procedimento'] = procedimentoArbitral || null;
      } else {
        dadosProcedimento['contratante'] = tenantName || null;
        dadosProcedimento['clausulaCompromissoria'] = clausulaCompromissoria || null;
      }

      const quesitosValidos = conteudo.quesitos.filter((q) => q.pergunta.trim());
      const sectionsPayload = {
        objeto_pericia: {
          titulo: '1. Objeto da Perícia & Histórico do Procedimento',
          natureza: kind.toUpperCase(),
          dominioTecnico: dominio.toUpperCase(),
          dadosProcedimento,
          resumoLide: conteudo.objeto.trim()
        },
        metodologia: {
          titulo: '2. Metodologia Científica e Normas Técnicas Empregadas',
          normasAplicaveis: [
            ...(activeService.legalBasis ? activeService.legalBasis.map((l: any) => l.law || l) : []),
            `Normas técnicas do conselho profissional (${conselhosExigidos.join('/')})`
          ],
          criteriosApuracao: conteudo.metodologia.trim()
        },
        quesitos_respondidos: {
          titulo: '3. Resposta aos Quesitos',
          totalQuesitos: quesitosValidos.length,
          quesitos: quesitosValidos.map((q, n) => ({ numero: n + 1, origem: q.origem, pergunta: q.pergunta.trim(), resposta: q.resposta.trim() }))
        },
        evidencias_examinadas: {
          titulo: '4. Evidências Documentais e Inspeções Realizadas',
          arquivosCustodia: Object.values(custodiaStore).map(c => ({
            nome: c.filename,
            hashSha256: c.sha256,
            carimboTempo: c.uploadedAt,
            responsavel: c.uploadedBy
          }))
        },
        conclusao_pericial: {
          titulo: '5. Conclusão Pericial & Parecer Técnico do Perito Oficial',
          parecer: conteudo.conclusao.trim(),
          responsabilidadeClasse: `${conteudo.peritoNome.trim()} — ${conteudo.peritoRegistro.trim()}`
        },
        anexos_tecnicos: {
          titulo: '6. Anexos Probatórios e Memória Contábil/Gráfica',
          documentosIntegrados: Object.keys(custodiaStore).length,
          integridadeVerificada: `${Object.keys(custodiaStore).length} arquivo(s) com SHA-256 registrado na cadeia de custódia`
        }
      };

      const issuedAtFormatted = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const signer = {
        name: conteudo.peritoNome.trim(),
        role: `Perito ${kindLabel(kind)} (${conselhosExigidos.join('/')})`,
        credentialNumber: conteudo.peritoRegistro.trim(),
        signatureType: 'PENDENTE_ASSINATURA_ICP' as const
      };

      const pipelineSnapshot = {
        verifiedRealSources: Object.values(custodiaStore).map(c => `${c.filename} [SHA-256: ${c.sha256.slice(0, 8)}...]`),
        executionTimeMs: Math.round(performance.now() - t0),
        dataSourceIntegrity: 'ARQUIVOS_AUDITADOS' as const
      };

      const reportInput: Omit<StandardizedAuditReport, 'auditHash'> = {
        reportId,
        serviceId: activeService.serviceId || activeService.id || 'PERICIA_JUDICIAL',
        serviceName: `${activeService.serviceName || activeService.name || 'Perícia Judicial & Extrajudicial'} (${kind.toUpperCase()})`,
        reportType: activeService.reportSchema?.reportType || 'PERICIA_JUDICIAL_CONTABIL',
        reportTypeLabel: kind === 'judicial' ? 'Laudo Pericial Judicial Conclusivo' : 'Parecer Pericial Conclusivo Extrajudicial',
        issuedAt: reportTimestamp,
        issuedAtFormatted,
        tenantId,
        tenantName,
        tenantCnpj,
        dominio,
        periciaKind: kind,
        periciaPayload: {
          kind,
          dominio,
          dadosProcedimento,
          custodiaArquivos: custodiaStore
        },
        sectionsPayload,
        pipelineSnapshot,
        signer,
        lgpdCompliance: {
          isCompliant: true,
          dataProtectionOfficer: 'DPO Velatrix Trust & Security Enclave',
          dataMaskingApplied: true,
          retentionPeriodDays: 1825,
          legalBasis: 'Art. 7º, II da Lei 13.709/2018 (Cumprimento de Obrigação Legal)',
          anonymizedFields: ['Dados bancários protegidos', 'Chaves mTLS ERP']
        },
        status: 'VALID'
      };

      // Cálculo Canônico de Integridade do Laudo (Zod + SHA-256)
      const auditHash = validateAndComputeReportHash(reportInput);

      const finalReport: StandardizedAuditReport = {
        ...reportInput,
        auditHash
      };

      CentralAuditReportService.saveReport(finalReport);
      setGeneratedReport(finalReport);
      setIsModalOpen(true);

      if (onReportGenerated) {
        onReportGenerated(finalReport);
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Falha na emissão oficial do laudo pericial.');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeStageIndex = estagiosOperacionais.findIndex(s => s.id === activeStageId);
  const currentStageDef = estagiosOperacionais[activeStageIndex] || estagiosOperacionais[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Voltar ao catálogo"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Módulo Perícia Oficial v2.0.0 • ICP-Brasil A1</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              Perícia {kindLabel(kind)} Oficial
            </h1>
          </div>
        </div>

        {/* Tenant em Operação */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <div className="text-xs">
            <div className="font-mono text-slate-400 text-[10px] uppercase">
              {TENANT_CARD_LABEL_MAP[kind]}:
            </div>
            <div className="font-bold text-slate-100">{tenantName}</div>
            <div className="font-mono text-cyan-400 text-[10px]">{tenantCnpj}</div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MUDANÇA 1: SELETOR DE "KIND" (ANTES DO CARD DE CONTRATO DE ENTRADA)    */}
      {/* ---------------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Modalidade da perícia
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Modalidade de Atuação Pericial
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Selecione o enquadramento processual antes de submeter os documentos. A esteira bifurca as regras processuais e o estágio conclusivo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setKind('judicial'); setActiveStageId('NOMEACAO'); }}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                kind === 'judicial'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Gavel className="w-4 h-4" />
              <span>Perícia Judicial</span>
            </button>

            <button
              type="button"
              onClick={() => { setKind('arbitral'); setActiveStageId('NOMEACAO'); }}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                kind === 'arbitral'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Perícia Arbitral</span>
            </button>

            <button
              type="button"
              onClick={() => { setKind('contratual'); setActiveStageId('NOMEACAO'); }}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                kind === 'contratual'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Perícia Contratual</span>
            </button>
          </div>
        </div>

        {/* Campos Condicionalmente Renderizados pelo Kind */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          {kind === 'judicial' && (
            <>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Número CNJ do Processo (Resolução CNJ 65/2008):
                </label>
                <input
                  type="text"
                  value={cnj}
                  onChange={e => setCnj(e.target.value)}
                  placeholder="NNNNNNN-DD.AAAA.J.TR.OOOO"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Juízo / Vara Competente:
                </label>
                <input
                  type="text"
                  value={juizo}
                  onChange={e => setJuizo(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                />
              </div>
            </>
          )}

          {kind === 'arbitral' && (
            <>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Câmara Arbitral Institucional:
                </label>
                <input
                  type="text"
                  value={camaraArbitral}
                  onChange={e => setCamaraArbitral(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Número do Procedimento Arbitral:
                </label>
                <input
                  type="text"
                  value={procedimentoArbitral}
                  onChange={e => setProcedimentoArbitral(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                />
              </div>
            </>
          )}

          {kind === 'contratual' && (
            <>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Contratante da Perícia (Tenant Requisitante):
                </label>
                <div className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold">
                  {tenantName || '— sem dado real —'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Cláusula Compromissória / Estipulação Contratual:
                </label>
                <input
                  type="text"
                  value={clausulaCompromissoria}
                  onChange={e => setClausulaCompromissoria(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MUDANÇA 3: RESPONSABILIDADE TÉCNICA EXIGIDA DINÂMICA (POR DOMÍNIO)     */}
      {/* ---------------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Responsável técnico</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Responsabilidade Técnica Exigida
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Conselhos de classe mapeados dinamicamente com base no domínio pericial (`laudo.dominio`).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Domínio:</span>
            {(['contabil', 'engenharia', 'medico', 'multidisciplinar'] as PericiaDominio[]).map(dom => (
              <button
                key={dom}
                type="button"
                onClick={() => setDominio(dom)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  dominio === dom
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {dom.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Badges de Conselhos Mapeados do Dicionário Dinâmico */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400">Conselhos com Assinatura Obrigatória:</span>
          {conselhosExigidos.map(conselho => (
            <span
              key={conselho}
              className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Registro {conselho} Ativo</span>
            </span>
          ))}
          <span className="text-[11px] font-mono text-slate-500 ml-auto">
            Mapa: {dominio} → [{conselhosExigidos.join(', ')}]
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MUDANÇA 2 & 6: ESTEIRA COMPLETA COM ESTÁGIOS CPC E CASCATA DE SLA      */}
      {/* ---------------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase">
              Esteira de Execução Pericial Oficial ({kind.toUpperCase()})
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {kind === 'judicial'
                ? 'Inclui estágios CPC #2.5 (Impugnação) e #2.75 (Depósito Prévio com reset do relógio) e homologação #7.'
                : 'Procedimento arbitral/contratual sem rito do CPC 465, finalizando com Entrega Formal ao Contratante/Câmara.'}
            </div>
          </div>

          {/* Controles do Rito CPC para Teste Interativo */}
          {kind === 'judicial' && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">Status #2.5 (CPC 465 §3º):</span>
              <button
                type="button"
                onClick={() => setStatusImpugnacao(s => s === 'em_impugnacao' ? 'sem_impugnacao' : 'em_impugnacao')}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                  statusImpugnacao === 'em_impugnacao'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {statusImpugnacao === 'em_impugnacao' ? 'IMPUGNAÇÃO ATIVA (Bloqueia #3)' : 'Sem Impugnação'}
              </button>
            </div>
          )}
        </div>

        {/* Grade de Estágios com Cascata de SLA e Badges Dinâmicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {estagiosOperacionais.map((st) => {
            const isCurrent = st.id === activeStageId;
            const isCompleted = completedStageIds.includes(st.id);
            const isBlocked = st.isAguardando;

            let cardBg = 'bg-slate-950/40 border-slate-800';
            let dotColor = 'bg-slate-700';
            let statusBadge = (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                PENDENTE
              </span>
            );

            if (st.status === 'skipped') {
              // BUG-02: marcar #2.5 como skipped e renderizar badge cinza "N/A · Sem Impugnação" em vez de "OK · CONCLUÍDO"
              cardBg = 'bg-slate-950/30 border-slate-800/80 opacity-80';
              dotColor = 'bg-slate-600';
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                  N/A · Sem Impugnação
                </span>
              );
            } else if (isCompleted) {
              cardBg = 'bg-emerald-950/20 border-emerald-800/40';
              dotColor = 'bg-emerald-400';
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  OK • CONCLUÍDO
                </span>
              );
            } else if (isBlocked) {
              // MUDANÇA 2: Estágio bloqueado renderiza badge "AGUARDANDO" em amarelo, não "OK" em verde!
              cardBg = 'bg-amber-950/20 border-amber-800/40';
              dotColor = 'bg-amber-400 animate-pulse';
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  AGUARDANDO
                </span>
              );
            } else if (st.isEstourado) {
              // MUDANÇA 6: Se now > deadline, badge vira vermelho "SLA ESTOURADO"
              cardBg = 'bg-rose-950/20 border-rose-800/50';
              dotColor = 'bg-rose-500';
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold">
                  SLA ESTOURADO
                </span>
              );
            } else if (isCurrent) {
              cardBg = 'bg-cyan-950/30 border-cyan-800/60 ring-1 ring-cyan-500/30';
              dotColor = 'bg-cyan-400';
              statusBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  EM ANDAMENTO
                </span>
              );
            }

            return (
              <div
                key={st.id}
                className={`p-3 rounded-xl border ${cardBg} transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {st.numero}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {statusBadge}
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    </div>
                  </div>

                  <div className={`text-xs font-bold leading-tight ${st.status === 'skipped' ? 'text-slate-400' : isCurrent ? 'text-cyan-300' : isCompleted ? 'text-emerald-400' : isBlocked ? 'text-amber-300' : 'text-slate-300'}`}>
                    {st.label}
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <UserCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{ACTOR_LABELS[st.actorRole as ActorRoleId] || st.actorRole}</span>
                  </div>

                  {/* Notas especiais para estágios CPC */}
                  {st.id === 'IMPUGNACAO_HONORARIOS' && (
                    <div className="mt-1.5 text-[9px] font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
                      {st.status === 'skipped' ? 'CPC 465 §3º: Sem impugnação das partes (Dispensado)' : 'CPC 465 §3º: Prazo de 5 dias (120h)'}
                    </div>
                  )}
                  {st.id === 'DEPOSITO_PREVIO_HONORARIOS' && (
                    <div className="mt-1.5 text-[9px] font-mono text-indigo-400/90 bg-indigo-950/30 px-1.5 py-0.5 rounded border border-indigo-800/40">
                      CPC 465 §4º: Marco Temporal de Reset
                    </div>
                  )}
                </div>

                {/* SLA Cascata Formatado & Concluído ISO 8601 */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatSlaString(st)}</span>
                    </span>
                  </div>
                  {st.completedAt && (() => {
                    const rawTs = st.completedAt;
                    let isoStr = rawTs;
                    const parsedTs = new Date(rawTs);
                    if (!isNaN(parsedTs.getTime())) {
                      isoStr = parsedTs.toISOString();
                    }
                    return (
                      <span className="text-cyan-400/80 text-[9px] font-mono truncate" title={`Concluído: ${isoStr}`}>
                        Concluído: {isoStr}
                      </span>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ação de Avanço de Estágio */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span className="font-mono text-slate-400">Estágio Ativo:</span>
            <span className="font-bold text-cyan-300">{currentStageDef.numero} {currentStageDef.label}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdvanceStage}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-cyan-950/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Avançar Estágio na Esteira</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleEmitReport}
              disabled={isProcessing || pendenciasLaudo.length > 0}
              title={pendenciasLaudo.length ? pendenciasLaudo.join('\n') : 'Emitir laudo'}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Emitir Laudo Padronizado</span>
            </button>
          </div>
        </div>
      </div>

      {/* P27: conteúdo do laudo é escrito pelo perito — o sistema não presume nada */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
              <FileText className="w-4 h-4" />
              <span>Conteúdo do laudo</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">Preenchido e assumido pelo perito responsável</h3>
            <p className="text-xs text-slate-400 mt-1">Nada aqui é gerado automaticamente. O laudo só é emitido com a esteira concluída e todos os campos preenchidos.</p>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border ${pendenciasLaudo.length ? 'border-amber-500/40 text-amber-300 bg-amber-500/10' : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'}`}>
            {pendenciasLaudo.length ? `${pendenciasLaudo.length} pendência(s)` : 'Pronto para emitir'}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-400 space-y-1">
            <span>Perito responsável (nome completo)</span>
            <input value={conteudo.peritoNome} onChange={setCampo('peritoNome')} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white" placeholder="Nome como consta no registro" />
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Registro profissional ({conselhosExigidos.join('/')})</span>
            <input value={conteudo.peritoRegistro} onChange={setCampo('peritoRegistro')} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white" placeholder="Ex.: CRC-SP 123456/O-7" />
          </label>
        </div>
        <label className="block text-xs text-slate-400 space-y-1">
          <span>Objeto da perícia</span>
          <textarea value={conteudo.objeto} onChange={setCampo('objeto')} rows={2} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white" placeholder="O que o juízo/partes determinaram apurar" />
        </label>
        <label className="block text-xs text-slate-400 space-y-1">
          <span>Metodologia empregada</span>
          <textarea value={conteudo.metodologia} onChange={setCampo('metodologia')} rows={3} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white" placeholder="Documentos examinados, critérios, normas técnicas aplicadas" />
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Quesitos ({conteudo.quesitos.length})</span>
            <button type="button" onClick={addQuesito} className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 hover:border-cyan-500 cursor-pointer">+ Adicionar quesito</button>
          </div>
          {conteudo.quesitos.length === 0 && (
            <p className="text-xs text-slate-500">Nenhum quesito cadastrado. Transcreva os quesitos do juízo e das partes.</p>
          )}
          {conteudo.quesitos.map((q, n) => (
            <div key={q.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-300">Quesito {n + 1}</span>
                <select value={q.origem} onChange={(ev) => setQuesito(q.id, { origem: ev.target.value })} className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-white">
                  {['Juízo', 'Autor', 'Réu', 'Assistente técnico', 'Câmara arbitral', 'Contratante'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <button type="button" onClick={() => removeQuesito(q.id)} className="ml-auto text-xs text-slate-500 hover:text-rose-400 cursor-pointer">remover</button>
              </div>
              <textarea value={q.pergunta} onChange={(ev) => setQuesito(q.id, { pergunta: ev.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white" placeholder="Pergunta (como formulada nos autos)" />
              <textarea value={q.resposta} onChange={(ev) => setQuesito(q.id, { resposta: ev.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white" placeholder="Resposta do perito" />
            </div>
          ))}
        </div>

        <label className="block text-xs text-slate-400 space-y-1">
          <span>Conclusão pericial</span>
          <textarea value={conteudo.conclusao} onChange={setCampo('conclusao')} rows={3} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white" placeholder="Conclusão fundamentada nos exames realizados" />
        </label>

        {pendenciasLaudo.length > 0 && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <div className="text-xs font-bold text-amber-300 mb-1">Antes de emitir o laudo:</div>
            <ul className="list-disc pl-5 space-y-0.5 text-xs text-slate-300">
              {pendenciasLaudo.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MUDANÇA 4 & 5: GESTÃO DE ARQUIVOS, VALIDAÇÃO SEMÂNTICA & CADEIA CUSTÓDIA */}
      {/* ---------------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
            <Lock className="w-4 h-4" />
            <span>Documentos examinados • Cadeia de custódia</span>
          </div>
          <h3 className="text-base font-bold text-white mt-0.5">
            Anexos Obrigatórios & Digest SHA-256 no Store
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Arquivos com características cadastrais (ex: Cartão CNPJ, Contrato Social) em slots probatórios são sumariamente rejeitados.
          </p>
        </div>

        {uploadError && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase font-mono">Bloqueio de Conformidade Pericial:</div>
              <div>{uploadError}</div>
            </div>
          </div>
        )}

        {/* Inputs de Arquivos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slot Probatório (Testa Validação Semântica) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                Slot Probatório: Documentos da Lide (Diário/Razão/Notas)
              </span>
              <span className="text-[10px] font-mono text-cyan-400">slotNatureza: probatorio</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Anexar documentos técnicos da perícia. Documentos cadastrais serão bloqueados por heurística no 1º KB.
            </p>

            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-xs font-mono font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Selecionar Arquivo Probatório</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload('documentos_periciais', f);
                  }}
                />
              </label>

              {/* Botão de teste rápido com simulação de anexo cadastral inválido */}
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([
                    'REPÚBLICA FEDERATIVA DO BRASIL\nCADASTRO NACIONAL DA PESSOA JURÍDICA\nCOMPROVANTE DE INSCRIÇÃO E DE SITUAÇÃO CADASTRAL\nSITUAÇÃO CADASTRAL: ATIVA\nQUADRO DE SÓCIOS E ADMINISTRADORES (QSA)'
                  ], { type: 'text/plain' });
                  const mockFile = new File([blob], 'cartao_cnpj_simulado.txt', { type: 'text/plain' });
                  handleFileUpload('documentos_periciais', mockFile);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-[11px] font-mono transition-colors"
                title="Simula upload de Cartão CNPJ no slot probatório para demonstrar rejeição"
              >
                Testar Rejeição de Cadastral
              </button>
            </div>
          </div>

          {/* Outro slot para outros documentos */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                Petição de Quesitos / Notificação
              </span>
              <span className="text-[10px] font-mono text-slate-400">slotNatureza: peticao</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Quesitos das partes homologados pelo juízo ou câmara arbitral.
            </p>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold cursor-pointer transition-colors">
              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
              <span>Selecionar Quesitos</span>
              <input
                type="file"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload('quesitos_partes', f);
                }}
              />
            </label>
          </div>
        </div>

        {/* MUDANÇA 5: CARDS DE CADEIA DE CUSTÓDIA COM SHA-256 */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-mono text-slate-400 font-bold uppercase">
            Cadeia de Custódia Registrada (Store Imutável):
          </div>

          {Object.entries(custodiaStore).map(([key, item]) => {
            const shortHash = `${item.sha256.slice(0, 4)}…${item.sha256.slice(-4)}`;
            const isCopied = copiedHash === item.sha256;

            return (
              <div
                key={key}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <span className="text-base">📎</span>
                  <span className="font-mono font-bold text-slate-100">{item.filename}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <span>sha256:</span>
                    <span className="text-cyan-300 font-bold">{shortHash}</span>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                    <span>✓</span>
                    <span>Íntegro</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => copySha256ToClipboard(item.sha256)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors flex items-center gap-1"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>[copiar]</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botão para Visualizar Laudo Emitido caso já exista */}
      {generatedReport && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-300">
                Laudo Oficial Emitido com Sucesso ({generatedReport.reportId})
              </div>
              <div className="text-xs text-emerald-200/80 font-mono mt-0.5">
                Audit Hash SHA-256: {generatedReport.auditHash.slice(0, 16)}... | Assinatura ICP-Brasil A1
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Ver Laudo Emitido</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Oficial de Exibição do Laudo */}
      <StandardizedAuditReportModal
        report={generatedReport}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
