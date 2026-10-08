import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Copy, 
  Navigation, 
  FileText, 
  DollarSign, 
  Search, 
  RefreshCw, 
  Clock, 
  Zap, 
  Activity, 
  Sliders, 
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TenantProfile, AuditRecord } from '../../types/aos';
import { CyberSpyThreatIntelligence } from './CyberSpyThreatIntelligence';
import { DjVuFiscalPatternMemoryPanel } from './DjVuFiscalPatternMemoryPanel';
import { useAuth } from '../../context/AuthContext';
import { isPartnerPortfolioScope } from '../../types/rbac';
import { PartnerPortfolioService } from '../../services/partnerPortfolioService';
import { PartnerPortfolioScopeSelector } from '../common/PartnerPortfolioScopeSelector';
import { secureId } from '../../lib/demoMode';

export interface DejaVuGlitch {
  id: string;
  type: 'MIRROR_INVOICE' | 'QUANTUM_GPS' | 'TAMPERED_BOLETO' | 'SPLIT_PIX';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  detectionTimestamp: string;
  recordA: {
    label: string;
    id: string;
    details: { [key: string]: string };
  };
  recordB: {
    label: string;
    id: string;
    details: { [key: string]: string };
  };
  discrepancyExplanation: string;
  status: 'GLITCH_DETECTED' | 'FROZEN_ERP' | 'DISMISSED';
  auditHash?: string;
}

const INITIAL_GLITCHES: DejaVuGlitch[] = [
  {
    id: 'glitch_mirror_4491',
    type: 'MIRROR_INVOICE',
    severity: 'CRITICAL',
    title: 'Nota Espelho Detectada (Mesmo Valor & Segundo / CNPJs Distintos)',
    detectionTimestamp: 'Hoje às 11:24:02',
    recordA: {
      label: 'NF-e Original (SAP MM #44.912)',
      id: 'NFe-44912-SP',
      details: {
        'Valor Total': 'R$ 48.920,00',
        'Descrição': 'Manutenção Preventiva Compressores',
        'Emitente': 'Alpha Tech Compressores LTDA',
        'CNPJ': '12.345.678/0001-90 (São Paulo - SP)',
        'Timestamp Emissão': '22/08/2026 11:24:02'
      }
    },
    recordB: {
      label: 'NF-e Duplicada Suspeita (#88.109)',
      id: 'NFe-88109-PE',
      details: {
        'Valor Total': 'R$ 48.920,00',
        'Descrição': 'Manutenção Preventiva Compressores',
        'Emitente': 'Beta Serv Peças & Filtros ME',
        'CNPJ': '98.765.432/0001-11 (Jaboatão - PE)',
        'Timestamp Emissão': '22/08/2026 11:24:02'
      }
    },
    discrepancyExplanation: 'Duas notas fiscais com a mesma descrição e valor exato ao centavo foram emitidas no mesmo segundo para empresas diferentes. Risco de faturamento em duplicidade ou fraude de fornecedor fantasma.',
    status: 'GLITCH_DETECTED'
  },
  {
    id: 'glitch_gps_quantum_884',
    type: 'QUANTUM_GPS',
    severity: 'CRITICAL',
    title: 'Telemetria Quântica: Impossibilidade Geoespacial de Caminhão',
    detectionTimestamp: 'Hoje às 11:52:30',
    recordA: {
      label: 'Ping de Telemetria #1 (5G IoT)',
      id: 'GPS-PING-SP',
      details: {
        'Veículo': 'Scania R450 (Placa ABC-4491)',
        'Localização': 'Rodovia Anchieta KM 22 (São Bernardo - SP)',
        'Velocidade Instantânea': '78 km/h',
        'Timestamp': '22/08/2026 11:40:15'
      }
    },
    recordB: {
      label: 'Ping de Telemetria #2 (Conflitante)',
      id: 'GPS-PING-RECIFE',
      details: {
        'Veículo': 'Scania R450 (Placa ABC-4491)',
        'Localização': 'Av. Agamenon Magalhães (Recife - PE)',
        'Velocidade Instantânea': '42 km/h',
        'Timestamp': '22/08/2026 11:52:30'
      }
    },
    discrepancyExplanation: 'Distância entre coordenadas de 2.140 km registrada com intervalo de apenas 12 minutos. Velocidade física requerida: 10.700 km/h (Mach 8.7). Indício de rastreador clonado ou fraude de frete fantasma.',
    status: 'GLITCH_DETECTED'
  },
  {
    id: 'glitch_boleto_tamper_990',
    type: 'TAMPERED_BOLETO',
    severity: 'HIGH',
    title: 'Boleto Adulterado: Divergência de Banco Beneficiário',
    detectionTimestamp: 'Hoje às 10:15:40',
    recordA: {
      label: 'Título no Contas a Pagar (SAP FI)',
      id: 'TIT-7712-ITAÚ',
      details: {
        'Fornecedor': 'PetroLub Distribuidora de Combustíveis',
        'Banco Homologado': '341 - Banco Itaú S.A.',
        'Agência / Conta': '4491 / 01928-3',
        'Valor': 'R$ 32.500,00'
      }
    },
    recordB: {
      label: 'Boleto PDF Recebido via E-mail',
      id: 'PDF-BOLETO-ADULTERADO',
      details: {
        'Código de Barras': '26091.79001 01043.510047 91020.150008',
        'Banco no Código': '260 - Nu Pagamentos S.A.',
        'Favorecido Final': 'L.M. Serviços Digitais ME',
        'Valor': 'R$ 32.500,00'
      }
    },
    discrepancyExplanation: 'Man-in-the-Email detectado: O PDF interceptado manteve o cabeçalho PetroLub, porém o código de barras aponta para conta digital de terceiro não homologada.',
    status: 'GLITCH_DETECTED'
  },
  {
    id: 'glitch_split_pix_122',
    type: 'SPLIT_PIX',
    severity: 'HIGH',
    title: 'Split de PIX Anti-Alçada (4x R$ 9.990 para Burlar Teto de R$ 10k)',
    detectionTimestamp: 'Hoje às 09:48:10',
    recordA: {
      label: 'Lote de 4 Operações PIX',
      id: 'PIX-BURST-SEQ',
      details: {
        'Operação 1': 'R$ 9.990,00 (09:47:12)',
        'Operação 2': 'R$ 9.990,00 (09:47:28)',
        'Operação 3': 'R$ 9.990,00 (09:47:45)',
        'Operação 4': 'R$ 9.990,00 (09:48:02)'
      }
    },
    recordB: {
      label: 'Regra de Alçada Violada',
      id: 'POLICY-LIMIT-10K',
      details: {
        'Favorecido Único': 'João Carlos Mendes (Pessoa Física)',
        'Total Acumulado': 'R$ 39.960,00 em 50 segundos',
        'Teto sem Diretoria': 'R$ 10.000,00 por favorecido/dia',
        'Status': 'Fragmentação deliberada de alçada'
      }
    },
    discrepancyExplanation: 'Comportamento estruturado de smurfing/split de pagamento para burlar a alçada de aprovação de diretoria do SAP.',
    status: 'GLITCH_DETECTED'
  }
];

interface DejaVuIntrusionPanelProps {
  tenantProfile: TenantProfile;
  onAddAuditRecord?: (record: AuditRecord) => void;
}

export const DejaVuIntrusionPanel: React.FC<DejaVuIntrusionPanelProps> = ({
  tenantProfile,
  onAddAuditRecord
}) => {
  const [securityMode, setSecurityMode] = useState<'AOS_CYBERSPY' | 'DJVU_PATTERN_MEMORY' | 'MODO_DEJAVU'>('AOS_CYBERSPY');
  const [glitches, setGlitches] = useState<DejaVuGlitch[]>(INITIAL_GLITCHES);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MIRROR_INVOICE' | 'QUANTUM_GPS' | 'TAMPERED_BOLETO' | 'SPLIT_PIX'>('ALL');
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  const handleRunDeepScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setActiveNotification('✓ Varredura Déjà Vu concluída: 1.480 transações auditadas em 18ms. 4 anomalias ativas.');
      setTimeout(() => setActiveNotification(null), 4000);
    }, 1200);
  };

  const handleFreezeTransaction = (glitchId: string) => {
    const hash = `0x${secureId('', 4)}${secureId('', 4)}`;
    const targetGlitch = glitches.find(g => g.id === glitchId);

    setGlitches(prev => prev.map(g => {
      if (g.id === glitchId) {
        return {
          ...g,
          status: 'FROZEN_ERP',
          auditHash: hash
        };
      }
      return g;
    }));

    if (onAddAuditRecord && targetGlitch) {
      const val = targetGlitch.recordA.details['Valor Total'] || 
                  targetGlitch.recordA.details['Valor'] || 
                  targetGlitch.recordB.details['Total Acumulado'] || 
                  'R$ 48.920,00';

      const newAudit: AuditRecord = {
        id: `rec_dejavu_${targetGlitch.id}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventId: targetGlitch.id,
        eventTitle: `[MODO DÉJÀ VU] ${targetGlitch.title}`,
        sector: tenantProfile.sector,
        jurisdiction: 'BR',
        agentsInvolved: [
          'Modo Déjà Vu Interceptor', 
          'Proof of Intent AI Guard', 
          'Zero-Trust Risk Agent', 
          'Motor Fiscal BR', 
          'BACEN SPI Interceptor'
        ],
        decisionSummary: `[TRAVA PREVENTIVA DÉJÀ VU]: ${targetGlitch.discrepancyExplanation} Transação congelada no ERP (${tenantProfile.connectedErp}) e BACEN SPI.`,
        decisionAst: {
          ui_type: 'CriticalDecisionCard',
          priority: 'Critical',
          summary: `Congelamento de segurança preventivo ativado: ${targetGlitch.title}`,
          kpis: [
            { label: 'Exposição Bloqueada', value: val, impact: 'positive' },
            { label: 'Risco Mitigado', value: '100% Retido', impact: 'positive' }
          ],
          invariants_checked: [
            'Invariante_Anti_Duplicidade_D0 = DISPARADA',
            'Proof_Of_Intent_Origem_Assinada = FALHOU',
            'Trava_Preventiva_ERP_BACEN = CONGELADO'
          ],
          security_guard: {
            status: 'SUSPECTED_FRAUD',
            risk_score: 99,
            source_authenticity: 'Déjà Vu Glitch Detector D+0',
            requires_biometric_override: true
          },
          audit_hash: hash
        },
        status: 'blocked_fraud',
        requiredSignatures: 1,
        signatures: [
          { role: 'Déjà Vu Autonomous Guard', keyId: `secp256k1::${hash.slice(0, 10)}`, signedAt: new Date().toISOString(), verified: true }
        ],
        executionReceipt: `TX-DEJAVU-${targetGlitch.id.toUpperCase()}`,
        invariantSnapshot: ['Invariante_Anti_Duplicidade_D0', 'Proof_Of_Intent_Origem_Assinada', 'Trava_Preventiva_ERP_BACEN']
      };
      onAddAuditRecord(newAudit);
    }

    setActiveNotification(`🛑 [Trava Preventiva Aplicada] Transação congelada no SAP & BACEN SPI com Hash ${hash}`);

    // Dispara Gatilho Automático de Split por Mitigação de Passivo / Auditoria Preventiva
    const activeClient = PartnerPortfolioService.getActiveClient();
    PartnerPortfolioService.triggerAutomatedSplitEvent({
      milestoneKey: 'AUDITORIA_CRUZADA',
      cnpj: activeClient.cnpj,
      companyName: activeClient.companyName,
      creditAmount: 39960,
      caseId: `DEJAVU-${targetGlitch ? targetGlitch.id.toUpperCase().slice(-6) : 'PASSIVO'}`,
      caseTitle: `Trava Anti-Fraude Déjà Vu: ${targetGlitch?.title || 'Mitigação de Passivo'}`,
      triggerSourceModule: 'Déjà Vu Intrusion Detection & CyberSpy',
      notes: `Transação fraudulenta congelada em D+0. Sangria prevenida e preservada na carteira do parceiro.`
    });

    setTimeout(() => setActiveNotification(null), 4000);
  };

  const handleDismissGlitch = (glitchId: string) => {
    setGlitches(prev => prev.map(g => {
      if (g.id === glitchId) {
        return { ...g, status: 'DISMISSED' };
      }
      return g;
    }));
  };

  const filteredGlitches = glitches.filter(g => {
    if (selectedFilter === 'ALL') return true;
    return g.type === selectedFilter;
  });

  const getSeverityBadge = (severity: DejaVuGlitch['severity']) => {
    if (severity === 'CRITICAL') {
      return 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse';
    }
    if (severity === 'HIGH') {
      return 'bg-amber-950 text-amber-300 border-amber-700';
    }
    return 'bg-slate-900 text-slate-300 border-slate-700';
  };

  return (
    <div id="deja-vu-intrusion-panel" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Scope Selector com RLS por Carteira de Parceiro */}
      <PartnerPortfolioScopeSelector 
        moduleName="Déjà Vu Intrusion Detection & CyberSpy"
        currentCnpj={tenantProfile.cnpj}
      />

      {/* Top Main Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-[var(--vx-deep)] p-2 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setSecurityMode('AOS_CYBERSPY')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 w-full ${
            securityMode === 'AOS_CYBERSPY'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/60 shadow-lg shadow-indigo-950/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
          <span>1. CyberSpy Edge AI Shield</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
            &lt;1ms • PIX • DarkWeb
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSecurityMode('DJVU_PATTERN_MEMORY')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 w-full ${
            securityMode === 'DJVU_PATTERN_MEMORY'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/60 shadow-lg shadow-cyan-950/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>2. Memória DjVu (Pattern-Match 60M)</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
            Caixa Preservado D+0
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSecurityMode('MODO_DEJAVU')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 w-full ${
            securityMode === 'MODO_DEJAVU'
              ? 'bg-rose-600/30 text-rose-300 border border-rose-500/60 shadow-lg shadow-rose-950/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-rose-400" />
          <span>3. Anomalias Déjà Vu & Espelho</span>
        </button>
      </div>

      {securityMode === 'AOS_CYBERSPY' ? (
        <CyberSpyThreatIntelligence 
          tenantProfile={tenantProfile} 
          onAddAuditRecord={onAddAuditRecord} 
        />
      ) : securityMode === 'DJVU_PATTERN_MEMORY' ? (
        <DjVuFiscalPatternMemoryPanel 
          tenantProfile={tenantProfile}
          onAddAuditRecord={onAddAuditRecord}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-[var(--vx-deep)] to-slate-950 border border-rose-500/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
                Anomaly & Intrusion Duplicate Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Glitch Detection D+0
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
              <span>Modo Déjà Vu (Anomaly & Duplicate Intrusion Detection)</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl">
              Motor de detecção de duplicidades anômalas e impossibilidades físicas: notas espelho com CNPJs divergentes, telemetria quântica impossível e adulteração de boletos bancários.
            </p>
          </div>

          <button
            type="button"
            disabled={isScanning}
            onClick={handleRunDeepScan}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs transition-all shadow-xl shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Varrendo Déjà Vu...' : 'Executar Varredura Deep Scan'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {activeNotification && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono flex items-center justify-between animate-in fade-in shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activeNotification}</span>
          </div>
          <button onClick={() => setActiveNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* TESLA HARMONICS FRAUD ENGINE (Ressonância & Frequências de Tesla) */}
      <div id="tesla-harmonics-fraud-engine" className="rounded-3xl bg-gradient-to-br from-slate-950 via-[var(--vx-deep)] to-slate-950 border border-indigo-500/40 p-6 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 shadow-lg shadow-indigo-950/50">
              <Activity className="w-6 h-6 animate-pulse text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
                  Harmonics Fraud Engine • Ressonância & Espectro de Frequências
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                  Princípio 3-6-9 de Tesla
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Dissonância Detectada
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Análise do ritmo habitual de pagamentos, conciliação e emissões fiscais. Transações dissonantes (fora da frequência fundamental da empresa) são isoladas antes da liquidação bancária.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Índice THAI (Tesla Harmonics)</span>
              <span className="text-sm font-black font-mono text-rose-400">88.4% Dissonância</span>
            </div>
          </div>
        </div>

        {/* Visual Spectral Waveform (SVG Harmonic Canvas) */}
        <div className="p-4 rounded-2xl bg-[var(--vx-deep)] border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-cyan-400 text-[11px]">
                <span className="w-2.5 h-1 bg-[var(--vx-neon)] rounded" /> Frequência Fundamental da Empresa (Ciclo Regular 10h-16h)
              </span>
              <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                <span className="w-2.5 h-1 bg-rose-500 rounded animate-pulse" /> Dissonância Harmônica (Possível Fraude / Smurfing)
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Espectro de Fourier D+0</span>
          </div>

          <div className="h-28 w-full relative overflow-hidden flex items-center justify-center">
            {/* SVG Harmonic Wave Visualizer */}
            <svg className="w-full h-full" viewBox="0 0 800 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00F2FF" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#00E676" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00F2FF" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF3366" stopOpacity="0.2" />
                  <stop offset="70%" stopColor="#FF3366" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FF3366" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="50" x2="800" y2="50" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="20" x2="800" y2="20" stroke="#0F172A" strokeWidth="1" />
              <line x1="0" y1="80" x2="800" y2="80" stroke="#0F172A" strokeWidth="1" />

              {/* Fundamental Smooth Sine Wave */}
              <path
                d="M 0 50 Q 50 15, 100 50 T 200 50 T 300 50 T 400 50 T 500 50 T 600 50 T 700 50 T 800 50"
                fill="none"
                stroke="url(#cyanGrad)"
                strokeWidth="2.5"
              />

              {/* Dissonant Anomaly High-Frequency Spikes */}
              <path
                d="M 280 50 L 300 12 L 310 88 L 320 8 L 335 50"
                fill="none"
                stroke="url(#roseGrad)"
                strokeWidth="3"
                className="animate-pulse"
              />
              <circle cx="310" cy="88" r="4" fill="#FF3366" className="animate-ping" />
              <circle cx="320" cy="8" r="4" fill="#FF3366" />

              <path
                d="M 620 50 L 635 18 L 645 82 L 655 10 L 670 50"
                fill="none"
                stroke="url(#roseGrad)"
                strokeWidth="3"
                className="animate-pulse"
              />
              <circle cx="655" cy="10" r="4" fill="#FF3366" className="animate-ping" />
            </svg>
          </div>
        </div>

        {/* 3 Live Harmonic Anomaly Signals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-rose-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                Pico Noturno Dissonante
              </span>
              <span className="text-[10px] font-mono text-slate-500">02:47 AM</span>
            </div>
            <strong className="text-xs font-bold text-slate-100 block">
              Dissonância Circadiana (PIX de R$ 38.400)
            </strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Disparo de pagamento em horário atípico sem histórico de aprovação prévia em 24 meses.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-rose-400 font-bold">Ruptura de Fase: 94.2%</span>
              <button 
                onClick={() => {
                  setActiveNotification('🛑 [Quarentena Ressonante] Transação noturna congelada no gateway BACEN.');
                  setTimeout(() => setActiveNotification(null), 4000);
                }}
                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
              >
                Quarentena
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                Harmônica Fracionada
              </span>
              <span className="text-[10px] font-mono text-slate-500">Hoje 10:14</span>
            </div>
            <strong className="text-xs font-bold text-slate-100 block">
              Micro-Drenagem (47 transações de R$ 990)
            </strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Frequência de emissão em harmônicos ímpares abaixo do gatilho de auditoria tradicional do ERP.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 font-bold">Ruptura de Fase: 87.5%</span>
              <button 
                onClick={() => {
                  setActiveNotification('🛑 [Quarentena Ressonante] Lote de micro-drenagem bloqueado.');
                  setTimeout(() => setActiveNotification(null), 4000);
                }}
                className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold cursor-pointer"
              >
                Quarentena
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                Desfasamento de Chave
              </span>
              <span className="text-[10px] font-mono text-slate-500">Hoje 11:32</span>
            </div>
            <strong className="text-xs font-bold text-slate-100 block">
              Favorecido Cruzado em 3 Fornecedores
            </strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mesma chave PIX cadastrada simultaneamente em empresas com CNPJs e filiais distintas.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-purple-400 font-bold">Ruptura de Fase: 91.0%</span>
              <button 
                onClick={() => {
                  setActiveNotification('🛑 [Quarentena Ressonante] Chave PIX cruzada bloqueada em todo o grupo.');
                  setTimeout(() => setActiveNotification(null), 4000);
                }}
                className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold cursor-pointer"
              >
                Quarentena
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-[var(--vx-deep)] p-2 rounded-2xl border border-slate-800">
        {[
          { id: 'ALL', label: 'Todos os Glitches', count: glitches.length },
          { id: 'MIRROR_INVOICE', label: 'Notas Espelho', count: glitches.filter(g => g.type === 'MIRROR_INVOICE').length },
          { id: 'QUANTUM_GPS', label: 'Telemetria Quântica (GPS)', count: glitches.filter(g => g.type === 'QUANTUM_GPS').length },
          { id: 'TAMPERED_BOLETO', label: 'Boleto Adulterado', count: glitches.filter(g => g.type === 'TAMPERED_BOLETO').length },
          { id: 'SPLIT_PIX', label: 'Split Anti-Alçada (PIX)', count: glitches.filter(g => g.type === 'SPLIT_PIX').length }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === tab.id
                ? 'bg-rose-950 text-rose-200 border border-rose-500 shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Glitches List Cards */}
      <div className="space-y-5">
        {filteredGlitches.map((glitch) => (
          <div
            key={glitch.id}
            className={`bg-[var(--vx-deep)] rounded-3xl border p-6 space-y-5 shadow-2xl transition-all ${
              glitch.status === 'FROZEN_ERP'
                ? 'border-emerald-500/40 bg-[var(--vx-deep)]'
                : glitch.status === 'DISMISSED'
                ? 'border-slate-900 opacity-50'
                : 'border-rose-500/40'
            }`}
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border ${
                  glitch.status === 'FROZEN_ERP'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-400'
                }`}>
                  {glitch.status === 'FROZEN_ERP' ? <Lock className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 animate-pulse" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-100">
                      {glitch.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getSeverityBadge(glitch.severity)}`}>
                      {glitch.severity}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Detectado em {glitch.detectionTimestamp}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 shrink-0">
                {glitch.status === 'GLITCH_DETECTED' && (
                  <span className="px-3 py-1 rounded-xl bg-rose-950 text-rose-300 border border-rose-700 font-mono text-xs font-bold flex items-center gap-1.5 animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    GLITCH DETECTADO (AÇÃO REQUERIDA)
                  </span>
                )}
                {glitch.status === 'FROZEN_ERP' && (
                  <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CONGELADO NO ERP & BACEN
                  </span>
                )}
                {glitch.status === 'DISMISSED' && (
                  <span className="px-3 py-1 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 font-mono text-xs font-bold">
                    IGNORADO / FALSO POSITIVO
                  </span>
                )}
              </div>
            </div>

            {/* SIDE-BY-SIDE DUPLICATE / GLITCH RECORD COMPARISON */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Record A */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <strong className="text-xs font-bold text-slate-200">
                    [Registro A] {glitch.recordA.label}
                  </strong>
                  <span className="text-[10px] font-mono text-slate-500">{glitch.recordA.id}</span>
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  {Object.entries(glitch.recordA.details).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-0.5 border-b border-slate-900/50">
                      <span className="text-slate-500">{key}:</span>
                      <strong className="text-slate-200 text-right">{val}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Record B (Suspect Divergence) */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/50 space-y-2.5">
                <div className="flex items-center justify-between border-b border-rose-900/40 pb-2">
                  <strong className="text-xs font-bold text-rose-300">
                    [Registro B] {glitch.recordB.label}
                  </strong>
                  <span className="text-[10px] font-mono text-rose-400">{glitch.recordB.id}</span>
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  {Object.entries(glitch.recordB.details).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-0.5 border-b border-rose-900/30">
                      <span className="text-slate-400">{key}:</span>
                      <strong className="text-rose-200 text-right">{val}</strong>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Explanation Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="text-slate-200 block">Diagnóstico de Intrusão & Quebra de Invariante:</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {glitch.discrepancyExplanation}
                </p>
              </div>
            </div>

            {/* Audit Hash if Frozen */}
            {glitch.auditHash && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 font-mono text-[11px] text-emerald-300">
                <span>Trilha Ledger Imutável SHA-256: <strong>{glitch.auditHash}</strong></span>
                <span className="text-[10px] text-emerald-400">Gravado no Bloco #44891</span>
              </div>
            )}

            {/* Action Buttons */}
            {glitch.status === 'GLITCH_DETECTED' && (
              <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => handleDismissGlitch(glitch.id)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Descartar Alerta
                </button>

                <button
                  type="button"
                  onClick={() => handleFreezeTransaction(glitch.id)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Congelar Transação no ERP / Trava Preventiva</span>
                </button>
              </div>
            )}

          </div>
        ))}
      </div>
    </>
  )}

    </div>
  );
};
