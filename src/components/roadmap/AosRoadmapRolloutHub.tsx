import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Smartphone, 
  CheckCircle2, 
  Zap, 
  Sparkles, 
  FileText, 
  Scan, 
  ArrowRight, 
  RefreshCw, 
  Eye, 
  Activity, 
  Terminal, 
  Server, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  Fingerprint,
  Send,
  Sliders,
  Maximize2,
  X,
  Layers,
  FileCheck,
  Scale,
  TrendingUp,
  DollarSign,
  Database,
  Cpu,
  BadgeCheck
} from 'lucide-react';
import { NavigationTab, TenantProfile, FiscalJurisdiction, SupportedCurrency, AuditRecord } from '../../types/aos';
import { useAuth } from '../../context/AuthContext';
import { isPartnerPortfolioScope } from '../../types/rbac';
import { PartnerPortfolioService } from '../../services/partnerPortfolioService';
import { PartnerPortfolioScopeSelector } from '../common/PartnerPortfolioScopeSelector';
import zerovisionPixBlockImg from '../../assets/images/zerovision_pix_block_1787424709965.jpg';
import cLevelPanicLockdownImg from '../../assets/images/c_level_panic_lockdown_1787424793789.jpg';
import aosIntelligenceSuiteImg from '../../assets/images/aos_intelligence_suite_1787423932425.jpg';
import { secureId } from '../../lib/demoMode';

interface AosRoadmapRolloutHubProps {
  tenantProfile: TenantProfile;
  currency?: SupportedCurrency;
  fiscalJurisdiction?: FiscalJurisdiction;
  onNavigateTab?: (tab: NavigationTab) => void;
  onAddAuditRecord?: (record: AuditRecord) => void;
}

export const AosRoadmapRolloutHub: React.FC<AosRoadmapRolloutHubProps> = ({
  tenantProfile,
  currency = 'BRL',
  fiscalJurisdiction = 'BR',
  onNavigateTab,
  onAddAuditRecord
}) => {
  // Selected Phase / Active View State
  const [selectedPhase, setSelectedPhase] = useState<'all' | 'phase1' | 'phase2' | 'v2_modules'>('all');
  const [activeModuleModal, setActiveModuleModal] = useState<
    'zerovision' | 'whatsapp' | 'panic_sos' | 'ocr_canhotos' | null
  >(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // PIX ZEROVISION INTERACTIVE SIMULATION STATE
  // -------------------------------------------------------------
  const [pixStatus, setPixStatus] = useState<'ANOMALY_DETECTED' | 'FROZEN_OPEN_FINANCE' | 'OVERRIDDEN_MULTISIG'>('ANOMALY_DETECTED');
  const [pixProcessing, setPixProcessing] = useState(false);
  const [pixAuditHash, setPixAuditHash] = useState('0x9a8f4c2e...b317');

  const handleTriggerPixFreeze = () => {
    setPixProcessing(true);
    setTimeout(() => {
      const hash = `0x${secureId('', 4)}${secureId('', 4)}`;
      setPixStatus('FROZEN_OPEN_FINANCE');
      setPixAuditHash(hash);
      setPixProcessing(false);

      if (onAddAuditRecord) {
        onAddAuditRecord({
          id: `rec_zerovision_pix_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: 'evt_zerovision_pix_block',
          eventTitle: '[ZEROVISION] Bloqueio Preventivo de PIX Suspeito (R$ 84.500)',
          sector: tenantProfile.sector,
          jurisdiction: fiscalJurisdiction,
          agentsInvolved: ['ZeroVision Autonomous Guard', 'Proof of Intent AI Guard', 'BACEN Open Finance SPI'],
          decisionSummary: '[BLOQUEIO ANTIFRAUDE ZEROVISION]: Tentativa de transferência PIX interceptada por canal não homologado. Quarentena preventiva aplicada em 4ms.',
          decisionAst: {
            ui_type: 'CriticalDecisionCard',
            priority: 'Critical',
            summary: 'Bloqueio preventivo de PIX fraudulento em milissegundos via ZeroVision.',
            kpis: [
              { label: 'Valor Preservado', value: 'R$ 84.500', impact: 'positive' },
              { label: 'Tempo de Resposta', value: '4ms', impact: 'positive' }
            ],
            invariants_checked: ['Proof_Of_Intent_Origem_Assinada = FALHOU', 'Bloqueio_PIX_ZeroVision = ATIVADO'],
            audit_hash: hash
          },
          status: 'blocked_fraud',
          requiredSignatures: 1,
          signatures: [
            { role: 'ZeroVision AI Guard', keyId: `secp256k1::${hash.slice(0, 10)}`, signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-ZEROVISION-PIX-${Date.now().toString().slice(-6)}`,
          invariantSnapshot: ['Proof_Of_Intent_Origem_Assinada', 'Bloqueio_PIX_ZeroVision']
        });
      }
    }, 600);
  };

  const handleTriggerPixOverride = () => {
    setPixProcessing(true);
    setTimeout(() => {
      const hash = `0x${secureId('', 4)}${secureId('', 4)}`;
      setPixStatus('OVERRIDDEN_MULTISIG');
      setPixAuditHash(hash);
      setPixProcessing(false);

      if (onAddAuditRecord) {
        onAddAuditRecord({
          id: `rec_zerovision_override_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: 'evt_zerovision_pix_override',
          eventTitle: '[ZEROVISION] Desbloqueio Autorizado via Multi-Sig Executivo (R$ 84.500)',
          sector: tenantProfile.sector,
          jurisdiction: fiscalJurisdiction,
          agentsInvolved: ['Diretoria Executiva', 'CFO Treasury Key', 'ZeroVision Guard'],
          decisionSummary: '[SOBREPOSIÇÃO MULTI-SIG]: Desbloqueio e liquidação de PIX aprovado pelo quórum de diretores após autenticação biométrica.',
          decisionAst: {
            ui_type: 'CriticalDecisionCard',
            priority: 'Medium',
            summary: 'Liberação de pagamento sob dupla custódia e chancela de diretoria.',
            kpis: [
              { label: 'Valor Liberado', value: 'R$ 84.500', impact: 'positive' },
              { label: 'Quórum Colhido', value: '2/2 Diretores', impact: 'positive' }
            ],
            invariants_checked: ['MultiSig_Quorum_2_Titulares = OK', 'Biometria_Executiva_Verificada = OK'],
            audit_hash: hash
          },
          status: 'executed',
          requiredSignatures: 2,
          signatures: [
            { role: 'CEO Executive Key', keyId: 'secp256k1::0x7F4A...E1', signedAt: new Date().toISOString(), verified: true },
            { role: 'CFO Treasury Key', keyId: 'secp256k1::0x2C9B...88', signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-MULTISIG-OVERRIDE-${Date.now().toString().slice(-6)}`,
          invariantSnapshot: ['MultiSig_Quorum_2_Titulares', 'Biometria_Executiva_Verificada']
        });
      }
    }, 700);
  };

  // -------------------------------------------------------------
  // WHATSAPP FAIL-SAFE SIMULATION STATE
  // -------------------------------------------------------------
  const [waMessageState, setWaMessageState] = useState<'DELIVERED' | 'READ' | 'ACTION_BLOCKED' | 'ACTION_APPROVED'>('DELIVERED');
  const [waSending, setWaSending] = useState(false);
  const [waWebhookLatency, setWaWebhookLatency] = useState<number | null>(null);

  const handleSimulateWaAction = (action: 'block' | 'approve') => {
    setWaSending(true);
    const start = performance.now();
    setTimeout(() => {
      setWaMessageState(action === 'block' ? 'ACTION_BLOCKED' : 'ACTION_APPROVED');
      setWaWebhookLatency(Math.round(performance.now() - start));
      setWaSending(false);

      if (onAddAuditRecord) {
        const hash = `0x${secureId('', 4)}${secureId('', 4)}`;
        onAddAuditRecord({
          id: `rec_whatsapp_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: 'evt_whatsapp_failsafe',
          eventTitle: action === 'block' ? '[WHATSAPP SOS] Bloqueio Remoto Acionado via WhatsApp' : '[WHATSAPP SOS] Liberação Remota via WhatsApp',
          sector: tenantProfile.sector,
          jurisdiction: fiscalJurisdiction,
          agentsInvolved: ['WhatsApp Fail-Safe Gateway', 'Proof of Intent AI Guard', 'Enxame Orchestrator'],
          decisionSummary: action === 'block' 
            ? 'Diretor executivo respondeu com comando de bloqueio emergencial no canal WhatsApp criptografado.' 
            : 'Diretor executivo autenticou e autorizou liberação da operação via WhatsApp com token OTP.',
          decisionAst: {
            ui_type: 'CriticalDecisionCard',
            priority: action === 'block' ? 'Critical' : 'Low',
            summary: `Ação ${action === 'block' ? 'de bloqueio' : 'de aprovação'} disparada remotamente via WhatsApp.`,
            kpis: [
              { label: 'Canal', value: 'WhatsApp Business API', impact: 'positive' },
              { label: 'Latência Webhook', value: `${Math.round(performance.now() - start)}ms`, impact: 'positive' }
            ],
            invariants_checked: ['WhatsApp_HMAC_Signature_Valid = OK', 'Executive_Phone_Whitelisted = OK'],
            audit_hash: hash
          },
          status: action === 'block' ? 'blocked_fraud' : 'executed',
          requiredSignatures: 1,
          signatures: [
            { role: 'WhatsApp Verified Executive', keyId: 'secp256k1::0xWA_EXEC_VERIFIED', signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-WA-${action.toUpperCase()}-${Date.now().toString().slice(-6)}`,
          invariantSnapshot: ['WhatsApp_HMAC_Signature_Valid', 'Executive_Phone_Whitelisted']
        });
      }
    }, 550);
  };

  // -------------------------------------------------------------
  // C-LEVEL PANIC LOCKDOWN (SOS) SIMULATION STATE
  // -------------------------------------------------------------
  const [panicStep, setPanicStep] = useState<'IDLE' | 'ARMED' | 'COUNTDOWN' | 'LOCKED_DOWN' | 'RESTORED'>('IDLE');
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [lockdownLogs, setLockdownLogs] = useState<string[]>([]);

  useEffect(() => {
    let timer: any;
    if (panicStep === 'COUNTDOWN') {
      if (countdownSeconds > 1) {
        timer = setTimeout(() => setCountdownSeconds(c => c - 1), 1000);
      } else {
        timer = setTimeout(() => {
          setPanicStep('LOCKED_DOWN');
          setLockdownLogs([
            '🛑 [00:00:01] Master Switch Ativado: Sinal de Emergência enviado via BACEN Open Finance SPI.',
            '🔒 [00:00:02] Revogadas todas as 48 sessões ativas no SAP S/4HANA e TOTVS Protheus.',
            '⚡ [00:00:03] Expirados 14 tokens de API e Webhook Secrets de gateways bancários.',
            '⛓️ [00:00:04] Trilha imutável em blockchain gerada com Hash SHA-256 e selo de carimbo temporal.',
            '🛡️ [00:00:05] 300 agentes do Enxame colocados em modo quarentena autônoma estrita.'
          ]);

          if (onAddAuditRecord) {
            const auditHash = `0x${secureId('', 4)}${secureId('', 4)}`;
            onAddAuditRecord({
              id: `rec_panic_sos_${Date.now()}`,
              timestamp: new Date().toISOString(),
              eventId: 'evt_panic_lockdown_sos',
              eventTitle: '[C-LEVEL SOS] Panic Lockdown Geral Executivo Ativado',
              sector: tenantProfile.sector,
              jurisdiction: fiscalJurisdiction,
              agentsInvolved: ['C-Level Master Switch', 'BACEN Open Finance SPI', 'SAP/TOTVS Session Revoker', 'Proof of Intent Guard', 'Enxame 300 Nós'],
              decisionSummary: '[LOCKDOWN GERAL ATIVADO]: Master Switch disparado pela diretoria executiva. 48 sessões ERP revogadas, 14 tokens bancários expirados, 300 agentes do Enxame colocados em quarentena autônoma estrita.',
              decisionAst: {
                ui_type: 'CriticalDecisionCard',
                priority: 'Critical',
                summary: 'Disparo emergencial de bloqueio de todas as operações e liquidações da holding.',
                kpis: [
                  { label: 'Sessões ERP Revogadas', value: '48 ativas', impact: 'positive' },
                  { label: 'Portões Bancários', value: '14 Congelados', impact: 'positive' }
                ],
                invariants_checked: ['C_Level_Master_Emergency_Lockdown = ATIVADO', 'Zero_Trust_Quarentena_Total = OK'],
                audit_hash: auditHash
              },
              status: 'blocked_fraud',
              requiredSignatures: 1,
              signatures: [
                { role: 'C-Level Executive Master Key', keyId: 'secp256k1::0xSOS_C_LEVEL_MASTER', signedAt: new Date().toISOString(), verified: true }
              ],
              executionReceipt: `TX-SOS-LOCKDOWN-${Date.now().toString().slice(-6)}`,
              invariantSnapshot: ['C_Level_Master_Emergency_Lockdown', 'BACEN_OpenFinance_Freeze', 'Quarentena_Geral_Enxame']
            });
          }
        }, 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [panicStep, countdownSeconds, tenantProfile.sector, fiscalJurisdiction, onAddAuditRecord]);

  const handleArmPanicButton = () => {
    setPanicStep('ARMED');
  };

  const handleExecutePanicCountdown = () => {
    setCountdownSeconds(3);
    setPanicStep('COUNTDOWN');
  };

  const handleDisarmRestore = () => {
    setPanicStep('RESTORED');
    setTimeout(() => setPanicStep('IDLE'), 2000);
  };

  // -------------------------------------------------------------
  // OCR VISUAL PARA CANHOTOS SIMULATION STATE
  // -------------------------------------------------------------
  const [selectedCanhotoSample, setSelectedCanhotoSample] = useState<'nfe_4492' | 'cte_8812' | 'danfe_7109'>('nfe_4492');
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<{
    signatureDetected: boolean;
    signatureConfidencePct: number;
    accessKey: string;
    nfeNumber: string;
    deliveryDate: string;
    recipientName: string;
    recipientRgCpf: string;
    gpsConflictDetected: boolean;
    erpBaixaStatus: 'PENDING' | 'CLEARED_SAP_SD' | 'REJECTED';
  }>({
    signatureDetected: true,
    signatureConfidencePct: 98.4,
    accessKey: '3526 0812 8942 0100 0199 5500 1000 0044 9210 9823 4519',
    nfeNumber: 'NF-e 000.004.492',
    deliveryDate: '2026-08-22 às 10:42',
    recipientName: 'Carlos Eduardo Silveira (Gerente de Recebimento)',
    recipientRgCpf: 'RG: 28.914.331-X / CPF: ***.419.828-**',
    gpsConflictDetected: false,
    erpBaixaStatus: 'PENDING'
  });

  const handleRunOcrScan = (sample: 'nfe_4492' | 'cte_8812' | 'danfe_7109') => {
    setSelectedCanhotoSample(sample);
    setOcrScanning(true);
    setTimeout(() => {
      setOcrScanning(false);
      if (sample === 'nfe_4492') {
        setOcrResult({
          signatureDetected: true,
          signatureConfidencePct: 98.7,
          accessKey: '3526 0812 8942 0100 0199 5500 1000 0044 9210 9823 4519',
          nfeNumber: 'NF-e 000.004.492 - Série 1',
          deliveryDate: '2026-08-22 às 10:42',
          recipientName: 'Carlos Eduardo Silveira (Gerente de Recebimento)',
          recipientRgCpf: 'RG: 28.914.331-X',
          gpsConflictDetected: false,
          erpBaixaStatus: 'PENDING'
        });
      } else if (sample === 'cte_8812') {
        setOcrResult({
          signatureDetected: true,
          signatureConfidencePct: 99.1,
          accessKey: '3526 0811 7261 0200 0188 5700 2000 0088 1210 1934 8122',
          nfeNumber: 'CT-e 000.008.812 (Carga Refrigerada)',
          deliveryDate: '2026-08-22 às 08:15',
          recipientName: 'Mariana Duarte (Controle de Qualidade)',
          recipientRgCpf: 'Matrícula: VOT-9941',
          gpsConflictDetected: false,
          erpBaixaStatus: 'PENDING'
        });
      } else {
        setOcrResult({
          signatureDetected: false,
          signatureConfidencePct: 41.2,
          accessKey: '3526 0899 1029 0300 0177 5500 1000 0071 0910 8821 9931',
          nfeNumber: 'NF-e 000.007.109 (Incompleto)',
          deliveryDate: 'Data ilegível',
          recipientName: 'Assinatura ausente ou rasurada',
          recipientRgCpf: 'Campo em branco',
          gpsConflictDetected: true,
          erpBaixaStatus: 'REJECTED'
        });
      }
    }, 850);
  };

  const handleBaixaErp = () => {
    setOcrResult(prev => ({ ...prev, erpBaixaStatus: 'CLEARED_SAP_SD' }));
    if (onAddAuditRecord) {
      const hash = `0x${secureId('', 4)}${secureId('', 4)}`;
      onAddAuditRecord({
        id: `rec_canhoto_baixa_${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventId: 'evt_canhoto_ocr_clear',
        eventTitle: `[OCR CANHOTO] Baixa Automatizada SAP SD (${ocrResult.nfeNumber})`,
        sector: tenantProfile.sector,
        jurisdiction: fiscalJurisdiction,
        agentsInvolved: ['OCR Visual Canhoto', 'Motor Fiscal BR', 'SAP SD Gateway'],
        decisionSummary: `[BAIXA AUTOMATIZADA]: Assinatura reconhecida (${ocrResult.signatureConfidencePct}% de confiança) com recebedor ${ocrResult.recipientName}. Fatura liberada no Contas a Receber do ERP.`,
        decisionAst: {
          ui_type: 'CriticalDecisionCard',
          priority: 'Low',
          summary: 'Baixa de faturamento com confirmação de entrega física homologada por OCR.',
          kpis: [
            { label: 'Confiança OCR', value: `${ocrResult.signatureConfidencePct}%`, impact: 'positive' },
            { label: 'Status SAP SD', value: 'Liquidado', impact: 'positive' }
          ],
          invariants_checked: ['Assinatura_Canhoto_Conforme = OK', 'Conflito_GPS_Telemetria = AUSENTE'],
          audit_hash: hash
        },
        status: 'executed',
        requiredSignatures: 1,
        signatures: [
          { role: 'OCR Validation Agent', keyId: `secp256k1::${hash.slice(0, 10)}`, signedAt: new Date().toISOString(), verified: true }
        ],
        executionReceipt: `TX-CANHOTO-SAP-${Date.now().toString().slice(-6)}`,
        invariantSnapshot: ['Assinatura_Canhoto_Conforme', 'SAP_SD_Baixa_Automatica']
      });
    }

    // Dispara Gatilho Automático de Split por Rollout / Homologação Entregue
    const activeClient = PartnerPortfolioService.getActiveClient();
    PartnerPortfolioService.triggerAutomatedSplitEvent({
      milestoneKey: 'CONTRATO_ASSINADO',
      cnpj: activeClient.cnpj,
      companyName: activeClient.companyName,
      creditAmount: 560000,
      caseId: `ROLLOUT-BAIXA-${activeClient.cnpj.replace(/\D/g, '').slice(0, 6)}`,
      caseTitle: `Rollout Homologado: Baixa Canhotos OCR (${activeClient.companyName})`,
      triggerSourceModule: 'AOS Roadmap & Rollout Hub',
      notes: `Módulo operacional de conciliação fiscal e baixa em tempo real homologado em produção.`
    });
  };

  return (
    <div id="aos-roadmap-rollout-hub" className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* Scope Selector com RLS por Carteira de Parceiro */}
      <PartnerPortfolioScopeSelector 
        moduleName="AOS Roadmap & Matriz de Lançamento"
        currentCnpj={tenantProfile.cnpj}
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. MASTER ROADMAP BANNER (FASE 1 ──► FASE 2) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[var(--vx-deep)] to-slate-950 border border-[var(--vx-neon)]/40 p-6 md:p-8 shadow-2xl shadow-[var(--vx-neon)]/5">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[var(--vx-neon)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--vx-neon)]/15 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 tracking-wider uppercase">
                  Release & Deployment Architecture
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PROD LIVE
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>AOS VELATRIX: Roadmap de Lançamento & Defesa Executiva</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-3xl">
                Matriz de rollout tecnológico dividida em duas fases de impacto crítico: travamento financeiro em tempo real e automação autônoma de contingência.
              </p>
            </div>

            {/* Quick Phase Filter Buttons */}
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shrink-0">
              <button
                onClick={() => setSelectedPhase('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPhase === 'all'
                    ? 'bg-[var(--vx-neon)] text-slate-950 shadow-md shadow-[var(--vx-neon)]/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas as Fases
              </button>
              <button
                onClick={() => setSelectedPhase('phase1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPhase === 'phase1'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fase 1 (Go-Live)
              </button>
              <button
                onClick={() => setSelectedPhase('phase2')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPhase === 'phase2'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fase 2 (Update v2.0)
              </button>
              <button
                onClick={() => setSelectedPhase('v2_modules')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedPhase === 'v2_modules'
                    ? 'bg-gradient-to-r from-[var(--vx-neon)] to-emerald-400 text-slate-950 shadow-md font-mono'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Módulos AOS V2
              </button>
            </div>
          </div>

          {/* TWO PHASES HORIZONTAL INTERACTIVE PIPELINE */}
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
            
            {/* FASE 1: GO-LIVE HOJE (5 Cols) */}
            <div className={`lg:col-span-5 rounded-2xl p-5 border transition-all ${
              selectedPhase === 'phase2' ? 'opacity-40 grayscale' : 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border-emerald-500/50 shadow-xl'
            }`}>
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold text-xs">
                    01
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">
                      [FASE 1: GO-LIVE HOJE]
                    </h2>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      Disponível em Produção D+0
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                  ATIVO 24/7
                </span>
              </div>

              {/* Phase 1 Features List */}
              <div className="mt-4 space-y-3">
                <div 
                  onClick={() => setActiveModuleModal('zerovision')}
                  className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-400/70 cursor-pointer transition-all hover:bg-slate-900 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <strong className="text-xs font-bold text-slate-100">ZeroVision Digital (PIX/ERP Lock)</strong>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-6">
                    Trava preventiva instantânea de transações anômalas via Open Finance e bloqueio direto no contas a pagar do SAP/TOTVS.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveModuleModal('whatsapp')}
                  className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-400/70 cursor-pointer transition-all hover:bg-slate-900 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <strong className="text-xs font-bold text-slate-100">Alerta Fail-Safe via WhatsApp</strong>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-6">
                    Notificação push com botões de ação rápida de 1-toque com autenticação multi-sig e latência &lt; 1.2s.
                  </p>
                </div>
              </div>
            </div>

            {/* CYBER PIPELINE ARROW (1 Col) */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center text-center py-2">
              <div className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-[var(--vx-neon)]/40 text-[var(--vx-neon)] shadow-lg shadow-[var(--vx-neon)]/20 animate-pulse">
                <ArrowRight className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1 hidden lg:block font-bold">
                EVOLUÇÃO
              </span>
            </div>

            {/* FASE 2: UPDATE V2.0 (5 Cols) */}
            <div className={`lg:col-span-5 rounded-2xl p-5 border transition-all ${
              selectedPhase === 'phase1' ? 'opacity-40 grayscale' : 'bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950 border-amber-500/50 shadow-xl'
            }`}>
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-bold text-xs">
                    02
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">
                      [FASE 2: UPDATE V2.0]
                    </h2>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      Próxima Geração de Defesa & Visão
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700 animate-pulse">
                  SIMULADOR ATIVO
                </span>
              </div>

              {/* Phase 2 Features List */}
              <div className="mt-4 space-y-3">
                <div 
                  onClick={() => setActiveModuleModal('panic_sos')}
                  className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-400/70 cursor-pointer transition-all hover:bg-slate-900 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <strong className="text-xs font-bold text-slate-100">C-Level Panic Lockdown (SOS)</strong>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-6">
                    Master switch de emergência física para revogação imediata de ERP, expiração de tokens e isolamento de contas em 3 segundos.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveModuleModal('ocr_canhotos')}
                  className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-400/70 cursor-pointer transition-all hover:bg-slate-900 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scan className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <strong className="text-xs font-bold text-slate-100">OCR Visual para Canhotos de NF-e</strong>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-6">
                    Visão computacional multimodal para validação de assinaturas em comprovantes físicos, cruzamento com GPS e baixa automática no SAP MM/SD.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1.5 VELATRIX AOS V2: ECOSSISTEMA & MÓDULOS DE ALTA PERFORMANCE */}
      {/* ------------------------------------------------------------- */}
      {(selectedPhase === 'all' || selectedPhase === 'v2_modules') && (
        <div id="velatrix-v2-ecosystem-matrix" className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-950 via-[var(--vx-deep)] to-slate-950 border border-emerald-500/40 p-5 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white uppercase tracking-tight font-mono">
                    VELATRIX AOS V2: Ecossistema de Inteligência & Controladoria
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/60 uppercase">
                    7 Pilares Entregues
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Unificação DRE, Memória DjVu 60M, Oráculo de Liquidez 365D, CyberSpy Edge AI, CAPAG/PGFN, Perícia PAdES e Correspondentes & Parcerias (sem participação da plataforma).
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-slate-900 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              Engenharia Fiscal & Contábil Homologada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            
            {/* 1. DRE Unificada */}
            <div className="bg-[var(--vx-deep)] border border-cyan-500/40 hover:border-cyan-400 p-5 rounded-3xl space-y-3 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-cyan-950/40">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-[var(--vx-neon)] border border-cyan-500/40">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-600">
                    11 ETAPAS DRE
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                  1. DRE Unificada & Engenharia Fiscal
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cascata de Controladoria com NOPAT, EBITDA Gerencial, AV% e Reajustes Não Recorrentes (Estorno PIS/COFINS, INSS Patronal e SELIC).
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Receita Bruta:</span>
                    <span className="text-cyan-400 font-bold">100.0% AV</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reajuste Velatrix:</span>
                    <span className="text-emerald-400 font-bold">Não Recorrente</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.('dre_waterfall')}
                className="w-full py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Acessar DRE Unificada</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Velatrix DjVu */}
            <div className="bg-[var(--vx-deep)] border border-purple-500/40 hover:border-purple-400 p-5 rounded-3xl space-y-3 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-purple-950/40">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-600">
                    MEMÓRIA 60M
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                  2. Velatrix DjVu (Memória Fiscal)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Identificação autônoma de padrões de bitributação nos últimos 60 meses, auditoria de XMLs de fornecedores e trava pré-SEFAZ.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Varredura:</span>
                    <span className="text-purple-400 font-bold">14.820 NFs Fornec.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Caixa Preservado:</span>
                    <span className="text-emerald-400 font-bold">R$ 513.200 D+0</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.('deja_vu_detection')}
                className="w-full py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Acessar Painel DjVu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Oráculo de Liquidez 365D */}
            <div className="bg-[var(--vx-deep)] border border-emerald-500/40 hover:border-emerald-400 p-5 rounded-3xl space-y-3 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-emerald-950/40">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                    MONTE CARLO D+365
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                  3. Oráculo de Liquidez (365 Dias)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Previsão estocástica de fluxo de caixa com 10.000 iterações e injeção de créditos fiscais e-CAC DCOMP nos nós de ruptura.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risco Default:</span>
                    <span className="text-rose-400 font-bold">18.4% ➔ 1.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Injeção DCOMP:</span>
                    <span className="text-emerald-400 font-bold">+R$ 290.000 M+4</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.('counterfactual_oracle')}
                className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Acessar Oráculo 365D</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4. CyberSpy Edge AI */}
            <div className="bg-[var(--vx-deep)] border border-rose-500/40 hover:border-rose-400 p-5 rounded-3xl space-y-3 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-rose-950/40">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-600">
                    LATÊNCIA &lt; 1ms
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                  4. CyberSpy Edge AI Shield
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interceptor autônomo de desvios de NCM/CFOP direto no ERP, bloqueador de boletos adulterados e validação PIX contra base CNPJ.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fraudes Bloqueadas:</span>
                    <span className="text-rose-400 font-bold">14 Incidentes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assinatura Multi-Sig:</span>
                    <span className="text-amber-300 font-bold">Quórum 2/2</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.('deja_vu_detection')}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Acessar CyberSpy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 5. PGFN / CAPAG */}
            <div className="bg-[var(--vx-deep)] border border-amber-500/40 hover:border-amber-400 p-5 rounded-3xl space-y-3 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-amber-950/40">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600">
                    LEI 13.988/20
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                  5. PGFN / CAPAG & Transação
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Diagnóstico Dívida Ativa da União e-CAC, recálculo estocástico CAPAG com até 70% de desconto em juros e multas e minuta de transação.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Desconto Juros/Multas:</span>
                    <span className="text-emerald-400 font-bold">Até 70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parcelamento:</span>
                    <span className="text-amber-400 font-bold">Até 145 Meses</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.('legal_tax_recovery')}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Acessar CAPAG & PGFN</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 6. Módulo Pericial 1-Click */}
            <div className="bg-[var(--vx-deep)] border border-blue-500/40 hover:border-blue-400 p-5 rounded-3xl space-y-3 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-blue-950/40">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-600">
                    PAdES ICP-BRASIL
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                  6. Módulo Pericial (CRC / CNPC)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Memória de cálculo 60M com SELIC oficial, emissão de parecer técnico assinado com Certificado Digital ICP-Brasil A1/A3 via backend FastAPI.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conformidade:</span>
                    <span className="text-blue-400 font-bold">NBC TP 01 / CPC 464</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assinador Digital:</span>
                    <span className="text-emerald-400 font-bold">FastAPI / pyHanko</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.('legal_tax_recovery')}
                className="w-full py-2 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Acessar Laudo Pericial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 7. Partner-Growth Engine */}
            <div className="bg-[var(--vx-deep)] border border-teal-500/40 hover:border-teal-400 p-5 rounded-3xl space-y-3 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-teal-950/40">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-600">
                    CORRESPONDENTES & PARCERIAS
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                  7. Partner-Growth & BaaS
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Onboarding para parceiros OAB e CRC, subcontas BaaS e split automático de honorários com NFS-e por webhook sem bitributação.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Split Parceiro:</span>
                    <span className="text-teal-400 font-bold">Velatrix 0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emissão Fiscal:</span>
                    <span className="text-emerald-400 font-bold">NFS-e Direta</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.('partner_portal')}
                className="w-full py-2 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/50 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Acessar Portal do Parceiro</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. FOUR INTERACTIVE SIMULATION CARDS (SIDE BY SIDE GRID) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ========================================================= */}
        {/* CARD 1: ZEROVISION DIGITAL (PIX / OPEN FINANCE FREEZE)   */}
        {/* ========================================================= */}
        <div className="bg-[var(--vx-deep)] rounded-3xl border border-rose-500/40 p-6 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                    1. ZeroVision Digital (PIX & ERP Lock)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    FASE 1
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Detecção autônoma de fraudes em pagamentos instantâneos com trava preventiva BACEN/SPI.
                </p>
              </div>
            </div>

            <button
              onClick={() => setPreviewImage(zerovisionPixBlockImg)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px]"
              title="Ver Slide Executivo de Apresentação"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Slide 8K</span>
            </button>
          </div>

          {/* Anomaly Live Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                ACTIVE TRANSACTION BLOCK: PIX FRAUD DETECTED
              </span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
                ANOMALIA CRÍTICA
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block font-mono">Valor da Operação</span>
                <strong className="text-base font-black text-rose-400 font-mono">R$ 50.000,00</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block font-mono">Chave Favorecido</span>
                <strong className="text-xs font-mono text-slate-200 block truncate">8f4a-9c12-33ab (Aleatória)</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block font-mono">Invariante Violada</span>
                <strong className="text-xs text-amber-300 block truncate">Sem Ordem SAP vinculada</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
              <span>Latência de Interceptação: <strong className="text-cyan-400">12ms</strong></span>
              <span>Trilha SHA-256: <strong className="text-slate-300">{pixAuditHash}</strong></span>
            </div>
          </div>

          {/* Current Status Display */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-slate-400">Status no ERP & BACEN:</span>
            {pixStatus === 'ANOMALY_DETECTED' && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 font-mono font-bold border border-amber-700 flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                Aguardando Decisão do Operador
              </span>
            )}
            {pixStatus === 'FROZEN_OPEN_FINANCE' && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 font-mono font-bold border border-rose-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                TRAVADO NO OPEN FINANCE & SAP (Quarentena)
              </span>
            )}
            {pixStatus === 'OVERRIDDEN_MULTISIG' && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                LIBERADO VIA MULTI-SIG C-LEVEL
              </span>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={pixProcessing || pixStatus === 'FROZEN_OPEN_FINANCE'}
              onClick={handleTriggerPixFreeze}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-50 text-white font-black text-xs transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{pixProcessing ? 'Bloqueando...' : 'ACTIVE BLOCK (Open Finance Freeze)'}</span>
            </button>

            <button
              type="button"
              disabled={pixProcessing || pixStatus === 'OVERRIDDEN_MULTISIG'}
              onClick={handleTriggerPixOverride}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 text-white font-black text-xs transition-all shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{pixProcessing ? 'Liberando...' : 'OVERRIDE (Multi-Sig)'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: ALERTA FAIL-SAFE VIA WHATSAPP                   */}
        {/* ========================================================= */}
        <div className="bg-[var(--vx-deep)] rounded-3xl border border-emerald-500/40 p-6 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                    2. Alerta Fail-Safe via WhatsApp
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    FASE 1
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Canal de contingência C-Level com botões interativos de 1 toque e webhook assíncrono.
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
              Webhook Ativo
            </span>
          </div>

          {/* Interactive WhatsApp Frame Mockup */}
          <div className="rounded-2xl bg-[var(--vx-deep)] border border-emerald-900/60 p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-300 font-sans">AOS VELATRIX Executive Bot</span>
                <span className="text-[10px] font-mono text-emerald-500">✓ Oficial Verificado</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">11:59</span>
            </div>

            {/* Message Bubble */}
            <div className="bg-[#112328] rounded-xl p-3.5 text-xs text-slate-200 space-y-2 border border-emerald-800/30">
              <p className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                🚨 ALERTA CRÍTICO DE TESOURARIA (D+0)
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Tentativa de transferência <strong>PIX de R$ 50.000,00</strong> disparada para favorecido não homologado no ERP SAP S/4HANA.
              </p>
              <div className="p-2 rounded-lg bg-black/40 font-mono text-[10px] text-slate-400 space-y-0.5">
                <div>• Origem: Conta Itaú Matriz (44901-2)</div>
                <div>• Invariante: Teto sem NF-e ultrapassado</div>
                <div>• Timeout auto-bloqueio: 45 segundos</div>
              </div>

              {/* Action Buttons in WhatsApp Bubble */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={waSending}
                  onClick={() => handleSimulateWaAction('block')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    waMessageState === 'ACTION_BLOCKED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>BLOQUEAR PIX (1-Toque)</span>
                </button>

                <button
                  type="button"
                  disabled={waSending}
                  onClick={() => handleSimulateWaAction('approve')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    waMessageState === 'ACTION_APPROVED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AUTORIZAR COM MULTI-SIG</span>
                </button>
              </div>
            </div>

            {/* Read & Response Status */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pt-1">
              <span className="flex items-center gap-1 text-cyan-400">
                <span>✓✓ Entregue & Lido pelo CFO</span>
              </span>
              {waWebhookLatency && (
                <span className="text-emerald-400">
                  Webhook ACK em {waWebhookLatency}ms
                </span>
              )}
            </div>
          </div>

          {/* Contingency Recipients Settings */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
              Destinatários do Escalation Protocol (WhatsApp)
            </span>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                +55 (11) 99841-**** (CFO)
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                +55 (11) 98112-**** (Head Tesouraria)
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                +55 (11) 97401-**** (CISO)
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 3: C-LEVEL PANIC LOCKDOWN (SOS MASTER SWITCH)        */}
        {/* ========================================================= */}
        <div className="bg-[var(--vx-deep)] rounded-3xl border border-amber-500/40 p-6 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                    3. C-Level Panic Lockdown (SOS)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700 animate-pulse">
                    FASE 2 (v2.0)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Master Switch de emergência para contenção total de ataques cibernéticos ou fraudes em larga escala.
                </p>
              </div>
            </div>

            <button
              onClick={() => setPreviewImage(cLevelPanicLockdownImg)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px]"
              title="Ver Slide Executivo de Apresentação"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Slide 8K</span>
            </button>
          </div>

          {/* Master 3D Physical Button Mockup */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                Console de Contingência Física
              </span>
              <strong className="text-sm text-slate-200 block">
                {panicStep === 'IDLE' && 'Sistema Pronto para Armamento'}
                {panicStep === 'ARMED' && '⚠️ BOTÃO ARMADO: PRONTO PARA DISPARO'}
                {panicStep === 'COUNTDOWN' && `🚨 CONTAGEM REGRESSIVA: 00:0${countdownSeconds}`}
                {panicStep === 'LOCKED_DOWN' && '🛑 GLOBAL LOCKDOWN INICIADO'}
                {panicStep === 'RESTORED' && '✓ SISTEMA RESTAURADO'}
              </strong>
              <p className="text-[11px] text-slate-400">
                Invalida sessões ERP, expira chaves de API e congela contas bancárias em 3 segundos.
              </p>
            </div>

            {/* Glowing SOS Physical Button */}
            <div className="shrink-0 flex items-center justify-center">
              {panicStep === 'IDLE' && (
                <button
                  type="button"
                  onClick={handleArmPanicButton}
                  className="w-24 h-24 rounded-full bg-gradient-to-b from-red-600 to-rose-950 border-4 border-rose-500/80 text-white font-black text-xs uppercase tracking-wider shadow-2xl shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group"
                >
                  <Lock className="w-5 h-5 text-white group-hover:animate-bounce" />
                  <span>ARMAR SOS</span>
                </button>
              )}

              {panicStep === 'ARMED' && (
                <button
                  type="button"
                  onClick={handleExecutePanicCountdown}
                  className="w-24 h-24 rounded-full bg-gradient-to-b from-red-500 via-rose-600 to-red-900 border-4 border-red-400 text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-red-500/80 animate-pulse hover:scale-110 active:scale-90 transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <AlertTriangle className="w-6 h-6 text-yellow-300" />
                  <span>DISPARAR!</span>
                </button>
              )}

              {panicStep === 'COUNTDOWN' && (
                <div className="w-24 h-24 rounded-full bg-black border-4 border-red-500 text-red-500 font-mono font-black text-2xl flex items-center justify-center animate-ping">
                  00:0{countdownSeconds}
                </div>
              )}

              {panicStep === 'LOCKED_DOWN' && (
                <button
                  type="button"
                  onClick={handleDisarmRestore}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span>Desarmar / Restaurar</span>
                </button>
              )}
            </div>
          </div>

          {/* Defense Checklist Logs */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
              Logs da Rotina de Defesa Autônoma
            </span>
            <div className="space-y-1 font-mono text-[11px] max-h-28 overflow-y-auto pr-1">
              {lockdownLogs.length === 0 ? (
                <div className="text-slate-600 italic">
                  Nenhum lockdown ativo. Trilha de auditoria em espera nominal.
                </div>
              ) : (
                lockdownLogs.map((log, idx) => (
                  <div key={idx} className="text-amber-300/90 leading-tight">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 4: OCR VISUAL PARA CANHOTOS (VISÃO COMPUTACIONAL)    */}
        {/* ========================================================= */}
        <div className="bg-[var(--vx-deep)] rounded-3xl border border-cyan-500/40 p-6 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                    4. OCR Visual para Canhotos de NF-e
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700 animate-pulse">
                    FASE 2 (v2.0)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Extração por visão de assinaturas físicas em canhotos com conciliação D+0 e baixa no SAP SD.
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold">
              Gemini Vision
            </span>
          </div>

          {/* Canhoto Test Samples Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
              Selecione um Comprovante / Canhoto para Teste:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRunOcrScan('nfe_4492')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  selectedCanhotoSample === 'nfe_4492'
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold block truncate">NF-e 4492</div>
                <div className="text-[10px] text-slate-500 truncate">TransBrasil (Válido)</div>
              </button>

              <button
                type="button"
                onClick={() => handleRunOcrScan('cte_8812')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  selectedCanhotoSample === 'cte_8812'
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold block truncate">CT-e 8812</div>
                <div className="text-[10px] text-slate-500 truncate">Carga Fria (Válido)</div>
              </button>

              <button
                type="button"
                onClick={() => handleRunOcrScan('danfe_7109')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  selectedCanhotoSample === 'danfe_7109'
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold block truncate">NF-e 7109</div>
                <div className="text-[10px] text-slate-500 truncate">Sem Assinatura</div>
              </button>
            </div>
          </div>

          {/* OCR Extraction Result Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <span>{ocrResult.nfeNumber}</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                ocrResult.signatureDetected
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-rose-950 text-rose-300 border-rose-700'
              }`}>
                {ocrResult.signatureDetected ? `Assinatura Válida (${ocrResult.signatureConfidencePct}%)` : 'Assinatura Inválida'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block">Recebedor Identificado:</span>
                <strong className="text-slate-200">{ocrResult.recipientName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Data / Hora da Entrega:</span>
                <strong className="text-slate-200">{ocrResult.deliveryDate}</strong>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Chave de Acesso SEFAZ (44 dígitos):</span>
                <strong className="text-cyan-400 text-[10px]">{ocrResult.accessKey}</strong>
              </div>
            </div>

            {!ocrResult.signatureDetected && (
              <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Rejeição: Assinatura inválida ou ausente. Baixa automática bloqueada no ERP.</span>
              </div>
            )}

            {ocrResult.gpsConflictDetected && (
              <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Alerta: Conflito de GPS do caminhão vs endereço de entrega da NF-e!</span>
              </div>
            )}
          </div>

          {/* Action: Give Automatic ERP Clearance */}
          <div className="pt-1">
            <button
              type="button"
              disabled={!ocrResult.signatureDetected || ocrResult.erpBaixaStatus === 'CLEARED_SAP_SD' || ocrScanning}
              onClick={handleBaixaErp}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                !ocrResult.signatureDetected
                  ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-50'
                  : ocrResult.erpBaixaStatus === 'CLEARED_SAP_SD'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 opacity-90 cursor-default'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20 cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {ocrResult.erpBaixaStatus === 'CLEARED_SAP_SD'
                  ? '✓ BAIXA EXECUTADA COM SUCESSO NO SAP SD (D+0)'
                  : !ocrResult.signatureDetected
                  ? 'Baixa Bloqueada no ERP (Assinatura Inválida)'
                  : ocrScanning ? 'Processando Imagem com IA...' : 'Dar Baixa Automática no ERP (Liberar Faturamento)'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. FULL RESOLUTION IMAGE PREVIEW MODAL                        */}
      {/* ------------------------------------------------------------- */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-300">
                Visualização de Slide Executivo 8K - AOS VELATRIX
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black">
              <img
                src={previewImage}
                alt="AOS Velatrix Executive Slide"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
