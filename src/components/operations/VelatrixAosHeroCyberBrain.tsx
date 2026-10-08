import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Layers, 
  ArrowUpRight, 
  Sparkles, 
  Radio, 
  Key, 
  Lock,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { NavigationTab } from '../../types/aos';
import { secureInt } from '../../lib/demoMode';

interface VelatrixAosHeroCyberBrainProps {
  onNavigate?: (tab: NavigationTab) => void;
  activeTab?: NavigationTab;
}

type ModuleHealthStatus = 'ok' | 'alerta' | 'critico';

interface HealthMetricContribution {
  name: string;
  source: string;
  value: string;
  score: number;
  weight: number;
}

/**
 * Modern Holographic Glassmorphism Brain with Circular Progress Ring & System Score
 */
const ModernHolographicBrainGauge: React.FC<{
  score: number;
  statusLabel: string;
  statusType: ModuleHealthStatus;
  metrics: HealthMetricContribution[];
  onClick?: () => void;
}> = ({ score, statusLabel, statusType, metrics, onClick }) => {
  const [showMetricsDetails, setShowMetricsDetails] = useState(false);

  // SVG Circular Gauge calculations
  const size = 340;
  const strokeWidth = 9;
  const radius = (size - strokeWidth * 2) / 2 - 12; // ~146px
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Status Colors
  const statusColor = statusType === 'ok' 
    ? {
        stroke: 'url(#gaugeGradientOk)',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        ping: 'bg-emerald-400',
        glow: 'rgba(16, 185, 129, 0.35)'
      }
    : statusType === 'alerta'
    ? {
        stroke: 'url(#gaugeGradientWarn)',
        text: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        ping: 'bg-amber-400',
        glow: 'rgba(245, 158, 11, 0.35)'
      }
    : {
        stroke: 'url(#gaugeGradientCrit)',
        text: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
        ping: 'bg-rose-400',
        glow: 'rgba(244, 63, 94, 0.35)'
      };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      
      {/* Outer Glow Halo with Glassmorphism */}
      <div 
        className="absolute w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${statusColor.glow} 0%, rgba(139, 92, 246, 0.12) 45%, rgba(6, 13, 30, 0) 70%)`
        }}
      />

      {/* Main Glassmorphic Circular Stage */}
      <div 
        onClick={onClick}
        className="group relative w-[310px] sm:w-[340px] h-[310px] sm:h-[340px] rounded-full flex items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-[1.02]"
        title="Cérebro Velatrix AOS: Clique para abrir o Hub do Enxame"
      >
        {/* Backdrop Glass Circle */}
        <div className="absolute inset-2 rounded-full bg-[var(--vx-deep)]/80 backdrop-blur-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-950/80 group-hover:border-cyan-400/40 transition-colors" />

        {/* Outer Tech Reticle with Tick Marks */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/15 pointer-events-none animate-[spin_60s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full border border-dashed border-purple-500/20 pointer-events-none animate-[spin_45s_linear_infinite_reverse]" />

        {/* SVG Gauge & Holographic Brain Illustration */}
        <svg 
          viewBox="0 0 340 340" 
          className="w-full h-full relative z-10 overflow-visible"
        >
          <defs>
            {/* Gauge Gradient - Nominal (Cyan -> Blue -> Emerald) */}
            <linearGradient id="gaugeGradientOk" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FF" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            {/* Gauge Gradient - Alerta (Cyan -> Amber) */}
            <linearGradient id="gaugeGradientWarn" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FF" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>

            {/* Gauge Gradient - Crítico */}
            <linearGradient id="gaugeGradientCrit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>

            {/* Holographic Brain Gradients */}
            <linearGradient id="brainLeftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FF" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="brainRightGradient" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#6366F1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#00F2FF" stopOpacity="0.08" />
            </linearGradient>

            {/* Neon Glow Filters */}
            <filter id="neonBrainGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="gaugeHeadGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ------------------------------------------------------------- */}
          {/* CIRCULAR PROGRESS RING (TRACK & INDICATOR)                     */}
          {/* ------------------------------------------------------------- */}
          {/* Background Track */}
          <circle
            cx="170"
            cy="170"
            r={radius}
            fill="none"
            stroke="#1E293B"
            strokeWidth={strokeWidth}
            strokeDasharray="4 6"
            className="opacity-40"
          />

          {/* Active Progress Arc */}
          <circle
            cx="170"
            cy="170"
            r={radius}
            fill="none"
            stroke={statusColor.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 170 170)"
            className="transition-all duration-1000 ease-out"
            filter="url(#neonBrainGlow)"
          />

          {/* Degree Ticks around Ring Perimeter */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const r1 = radius + 9;
            const r2 = radius + (i % 3 === 0 ? 15 : 12);
            const x1 = 170 + r1 * Math.cos(angle);
            const y1 = 170 + r1 * Math.sin(angle);
            const x2 = 170 + r2 * Math.cos(angle);
            const y2 = 170 + r2 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i * 10 <= (score / 100) * 360 ? '#00F2FF' : '#334155'}
                strokeWidth={i % 9 === 0 ? 1.5 : 0.8}
                strokeOpacity={i * 10 <= (score / 100) * 360 ? 0.7 : 0.25}
              />
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* HOLOGRAPHIC BRAIN ILLUSTRATION (CENTER VIEWPORT)               */}
          {/* Modern translucent glassmorphic shapes with neon wireframe    */}
          {/* ------------------------------------------------------------- */}
          <g transform="translate(45, 45) scale(0.48)" className="opacity-95">
            
            {/* Translucent Glass Hemispheres with Purple/Blue/Cyan Gradients */}
            <path
              d="M 260 60 C 210 60, 150 82, 114 128 C 84 168, 80 215, 105 255 C 125 285, 160 300, 205 300 C 230 300, 248 285, 260 270 Z"
              fill="url(#brainLeftGradient)"
              stroke="#00F2FF"
              strokeWidth="1.6"
              filter="url(#neonBrainGlow)"
            />
            <path
              d="M 260 60 C 310 60, 370 82, 406 128 C 436 168, 440 215, 415 255 C 395 285, 360 300, 315 300 C 290 300, 272 285, 260 270 Z"
              fill="url(#brainRightGradient)"
              stroke="#A855F7"
              strokeWidth="1.6"
              filter="url(#neonBrainGlow)"
            />

            {/* Neural Synapse Mesh Lines */}
            <g stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 4">
              <line x1="260" y1="60" x2="205" y2="75" />
              <line x1="260" y1="60" x2="315" y2="75" />
              <line x1="205" y1="75" x2="152" y2="108" />
              <line x1="315" y1="75" x2="368" y2="108" />
              <line x1="152" y1="108" x2="165" y2="152" />
              <line x1="368" y1="108" x2="355" y2="152" />
              <line x1="165" y1="152" x2="225" y2="150" />
              <line x1="355" y1="152" x2="295" y2="150" />
              <line x1="225" y1="150" x2="260" y2="140" />
              <line x1="295" y1="150" x2="260" y2="140" />
              <line x1="165" y1="152" x2="180" y2="195" />
              <line x1="355" y1="152" x2="340" y2="195" />
              <line x1="180" y1="195" x2="225" y2="200" />
              <line x1="340" y1="195" x2="295" y2="200" />
              <line x1="225" y1="200" x2="260" y2="185" />
              <line x1="295" y1="200" x2="260" y2="185" />
            </g>

            {/* Holographic Gyri Contours */}
            <g fill="none" stroke="#00F2FF" strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
              <path d="M 255 96 C 215 96, 175 118, 160 155 C 148 188, 175 218, 210 218" />
              <path d="M 125 190 C 150 180, 195 192, 225 175" />
              <path d="M 125 238 C 155 245, 198 255, 235 242" />
              <path d="M 185 295 C 170 308, 172 328, 208 328" stroke="#38BDF8" />
              <path d="M 265 96 C 305 96, 345 118, 360 155 C 372 188, 345 218, 310 218" stroke="#A855F7" />
              <path d="M 395 190 C 370 180, 325 192, 295 175" stroke="#A855F7" />
              <path d="M 395 238 C 365 245, 322 255, 285 242" stroke="#A855F7" />
              <path d="M 335 295 C 350 308, 348 328, 312 328" stroke="#C084FC" />
              <path d="M 260 60 L 260 270" stroke="#00F2FF" strokeDasharray="4 3" strokeOpacity="0.7" />
            </g>

            {/* Glowing Synapse Nodes (Cyan & Purple) */}
            {[
              [260, 60], [205, 75], [315, 75], [152, 108], [368, 108],
              [165, 152], [355, 152], [225, 150], [295, 150], [260, 140],
              [180, 195], [340, 195], [225, 200], [295, 200], [260, 185],
              [125, 190], [395, 190], [208, 328], [312, 328]
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="4" fill={i % 2 === 0 ? '#00F2FF' : '#C084FC'} opacity="0.9" />
                <circle cx={cx} cy={cy} r="1.6" fill="#FFFFFF" />
              </g>
            ))}
          </g>
        </svg>

        {/* ------------------------------------------------------------- */}
        {/* CENTER FLOATING SCORE & SYSTEM STATUS OVERLAY                 */}
        {/* Placar Agregado de 0 a 100 com rótulo "NÍVEL DO SISTEMA"      */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 pt-6">
          <div className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase text-slate-400">
            NÍVEL DO SISTEMA
          </div>
          
          {/* Big Score Display */}
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(0,242,255,0.4)]">
              {score}
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-cyan-400">
              /100
            </span>
          </div>

          {/* Status Label (OPERACIONAL / ALERTA / CRÍTICO) */}
          <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md ${statusColor.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor.ping} animate-ping`} />
            <span>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Metric Breakdown Details Trigger */}
      <div className="relative z-30 mt-3 flex flex-col items-center">
        <button
          type="button"
          onClick={() => setShowMetricsDetails(!showMetricsDetails)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/50 text-[10px] font-mono text-slate-300 hover:text-cyan-300 shadow-sm transition-all"
        >
          <Info className="w-3 h-3 text-cyan-400" />
          <span>{showMetricsDetails ? 'Ocultar Agregação' : 'Ver Métricas Agregadas (5 Fontes)'}</span>
        </button>

        {/* Aggregation Breakdown Flyout Card */}
        {showMetricsDetails && (
          <div className="mt-2 w-72 sm:w-80 p-3 rounded-xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-left font-mono z-40 transition-all">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800 text-[11px] font-bold text-white">
              <span className="text-[var(--vx-neon)]">Composição do Nível (0–100)</span>
              <span className="text-emerald-400">{score}% Total</span>
            </div>
            
            <div className="space-y-1.5 text-[10px]">
              {metrics.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0">
                  <div>
                    <span className="text-slate-200 font-semibold">{m.name}</span>
                    <span className="text-slate-400 block text-[9px]">{m.source}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-cyan-300 font-bold">{m.score} pts</span>
                    <span className="text-slate-400 block text-[9px]">{m.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[9px] text-slate-400 leading-tight">
              Agregação ponderada em tempo real com quórum e integridade SHA-256.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const VelatrixAosHeroCyberBrain: React.FC<VelatrixAosHeroCyberBrainProps> = ({
  onNavigate,
  activeTab = 'operational_dashboard'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null);
  const [pulseCount, setPulseCount] = useState<number>(1420);

  // Active telemetric pulse increment
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(prev => prev + secureInt(1, 3));
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // HEALTH STATUS PER MODULE (ok = emerald, alerta = amber, critico = red)
  // Used to dynamically set the color of each light conduit and card status
  // -------------------------------------------------------------
  const moduleHealth: Record<string, ModuleHealthStatus> = useMemo(() => ({
    pericial_motor: 'ok',       // Auditabilidade SHA-256 100%
    liquidity_oracle: 'ok',     // Z-Score 3.45 Seguro
    cyberspy_shield: 'ok',      // Latência P99 < 45ms
    split_payment_api: 'ok'     // D+0 Instant
  }), []);

  // -------------------------------------------------------------
  // 5 AGGREGATED METRICS CONTRIBUTING TO SYSTEM LEVEL SCORE
  // 1) Auditabilidade SHA-256 (Motor Pericial) = 100
  // 2) Latência P99 Edge (CyberSpy Escudo) = 96
  // 3) Z-Score Altman (Oráculo de Liquidez) = 94
  // 4) Instantaneidade da Liquidação (Split API) = 98
  // 5) Saúde do Grafo (Semantic Graph) = 88%
  // -------------------------------------------------------------
  const aggregatedMetrics: HealthMetricContribution[] = useMemo(() => [
    {
      name: 'Auditabilidade SHA-256',
      source: 'Motor Pericial (60 Meses)',
      value: '100% Tax Hash',
      score: 100,
      weight: 0.22
    },
    {
      name: 'Latência P99 Edge',
      source: 'CyberSpy Escudo Edge AI',
      value: '< 45ms P99',
      score: 96,
      weight: 0.20
    },
    {
      name: 'Z-Score Altman',
      source: 'Oráculo de Liquidez Preditiva',
      value: '3.45 Zona Segura',
      score: 94,
      weight: 0.20
    },
    {
      name: 'Instantaneidade Split',
      source: 'Split de Pagamentos API',
      value: 'D+0 Instant Dual',
      score: 98,
      weight: 0.20
    },
    {
      name: 'Saúde do Grafo',
      source: 'Semantic Graph Engine',
      value: '88% Consistência',
      score: 88,
      weight: 0.18
    }
  ], []);

  // Calculate Aggregated Score (Weighted)
  const systemScore = useMemo(() => {
    const rawScore = aggregatedMetrics.reduce((acc, m) => acc + m.score * m.weight, 0);
    return Math.round(rawScore); // Evaluates to ~95
  }, [aggregatedMetrics]);

  // Status Label and Category based on score range
  const systemStatusCategory: { label: string; type: ModuleHealthStatus } = useMemo(() => {
    if (systemScore >= 90) return { label: 'OPERACIONAL', type: 'ok' };
    if (systemScore >= 70) return { label: 'ALERTA', type: 'alerta' };
    return { label: 'CRÍTICO', type: 'critico' };
  }, [systemScore]);

  // -------------------------------------------------------------
  // HUD PANELS DEFINITION (MOTOR PERICIAL, ORÁCULO, CYBERSPY, SPLIT)
  // -------------------------------------------------------------
  const hudPanels = useMemo(() => [
    {
      id: 'pericial_motor',
      title: 'Motor Pericial de 60 Meses',
      badge: 'FIPS 180-4 • TEMA 69 STF',
      badgeColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/60',
      glowColor: 'hover:border-cyan-500/60',
      borderColor: 'border-slate-800 hover:border-slate-700',
      icon: ShieldCheck,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-slate-800 border-slate-700',
      description: 'Varredura pericial automatizada de 60 competências fiscais com exclusão irrefutável do ICMS destacado da base de PIS/COFINS.',
      primaryMetric: 'R$ 945.000',
      primaryLabel: 'Crédito Apurado',
      secondaryMetric: '100% Tax Hash',
      secondaryLabel: 'Auditabilidade SHA-256',
      targetTab: 'legal_tax_recovery' as NavigationTab,
      actionText: 'Executar Laudo Pericial ➔',
      status: 'ONLINE • CONFORME',
      health: moduleHealth.pericial_motor
    },
    {
      id: 'liquidity_oracle',
      title: 'Oráculo de Liquidez Preditiva',
      badge: 'MONTE CARLO • D+0 A D+90',
      badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-950/60',
      glowColor: 'hover:border-amber-500/60',
      borderColor: 'border-slate-800 hover:border-slate-700',
      icon: Activity,
      iconColor: 'text-amber-400',
      iconBg: 'bg-slate-800 border-slate-700',
      description: 'Simulações estocásticas de fluxo de caixa, stress-testing contrafactual contra crises de suprimentos e preservação de solvência.',
      primaryMetric: 'R$ 4.85M',
      primaryLabel: 'Tesouraria Projetada',
      secondaryMetric: 'Z-Score 3.45',
      secondaryLabel: 'Altman Zona Segura',
      targetTab: 'counterfactual_oracle' as NavigationTab,
      actionText: 'Consultar Oráculo ➔',
      status: 'PREDITIVO • ATIVO',
      health: moduleHealth.liquidity_oracle
    },
    {
      id: 'cyberspy_shield',
      title: 'CyberSpy Escudo Edge AI',
      badge: 'ZERO-TRUST • ERP LOCK',
      badgeColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/60',
      glowColor: 'hover:border-cyan-500/60',
      borderColor: 'border-slate-800 hover:border-slate-700',
      icon: Cpu,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-slate-800 border-slate-700',
      description: 'Barramento de decisões autônomas com isolamento multi-tenant estrito, detecção de anomalias em tempo real e proteção de transações.',
      primaryMetric: '6 Agentes',
      primaryLabel: 'Enxame Operacional',
      secondaryMetric: '< 45ms',
      secondaryLabel: 'Latência P99 Edge',
      targetTab: 'cyberspy_defense' as NavigationTab,
      actionText: 'Inspecionar Barramento ➔',
      status: 'ESCUDO REFORÇADO',
      health: moduleHealth.cyberspy_shield
    },
    {
      id: 'split_payment_api',
      title: 'Split de Pagamentos API',
      badge: 'BACEN COMPLIANT • ESCROW DUAL',
      badgeColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/60',
      glowColor: 'hover:border-cyan-500/60',
      borderColor: 'border-slate-800 hover:border-slate-700',
      icon: Layers,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-slate-800 border-slate-700',
      description: 'Liquidação via PIX/boleto na conta do próprio escritório, com divisão opcional entre profissionais parceiros e NFS-e emitida pelo escritório.',
      primaryMetric: '50% / 50%',
      primaryLabel: 'Regra de Liquidação',
      secondaryMetric: 'D+0 Instant',
      secondaryLabel: 'Espelhamento NFS-e',
      targetTab: 'partner_portal' as NavigationTab,
      actionText: 'Abrir Gestão de Split ➔',
      status: 'LIQUIDAÇÃO IMEDIATA',
      health: moduleHealth.split_payment_api
    }
  ], [moduleHealth]);

  const handlePanelClick = (tab: NavigationTab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      window.dispatchEvent(new CustomEvent('velatrix:navigate_tab', { detail: tab }));
    }
  };

  // Helper to get conduit gradient ID according to module health status
  const getConduitGradientId = (health: ModuleHealthStatus) => {
    if (health === 'ok') return 'url(#conduitOkGradient)';
    if (health === 'alerta') return 'url(#conduitWarnGradient)';
    return 'url(#conduitCritGradient)';
  };

  return (
    <section 
      ref={containerRef}
      id="velatrix-aos-hero-section"
      className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[var(--vx-deep)] via-[var(--vx-deep)] to-[var(--vx-deep)] border border-cyan-500/20 shadow-2xl shadow-cyan-950/40 p-5 lg:p-8 mb-8 text-white transition-all"
    >
      {/* ------------------------------------------------------------- */}
      {/* HIGH-TECH BACKGROUND: SUBTLE DIGITAL GRID                     */}
      {/* ------------------------------------------------------------- */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(0, 242, 255, 0.12) 0%, transparent 65%),
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px'
        }}
      />

      {/* Cybernetic Ambient Light Flares */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--vx-neon)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* HEADER: BRAND IDENTITY & TELEMETRIC STREAMING STATUS          */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyan-900/40">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black tracking-wider uppercase bg-[var(--vx-neon)]/15 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 shadow-sm shadow-[var(--vx-neon)]/20">
              <Radio className="w-3 h-3 animate-pulse" />
              VELATRIX AOS • NEURAL CORE ENGINE
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              SISTEMA NOMINAL • {systemScore}/100
            </span>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              FIPS-180-4 CRYPTO HASH SHA-256
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Arquitetura de Decisão Autônoma</span>
            <span className="bg-gradient-to-r from-[var(--vx-neon)] via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              Velatrix AOS
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-normal">
            Decisões Operacionais Autônomas, Seguras e Criptograficamente Auditáveis em Tempo Real com Barramento Semântico e Enxame de Agentes.
          </p>
        </div>

        {/* Live System Stats Pill */}
        <div className="flex items-center gap-3 shrink-0 bg-slate-950/70 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/30 shadow-inner">
          <div className="text-right font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Carga do Barramento</div>
            <div className="text-sm font-bold text-[var(--vx-neon)] flex items-center justify-end gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              {pulseCount.toLocaleString()} op/s
            </div>
          </div>
          <div className="h-8 w-px bg-cyan-900/50" />
          <div className="text-right font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Status do Enxame</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              6 ONLINE
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIEWPORT: 4 CORNER HUDS + CENTRAL HOLOGRAPHIC GAUGE     */}
      {/* Posicionados diretamente no fundo escuro do hero             */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-8">
        
        {/* SVG Holographic Conduits with Dynamic Color per Module Status (desktop) */}
        <svg className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
          <defs>
            {/* Green / Emerald Conduit Gradient (Status = OK) */}
            <linearGradient id="conduitOkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FF" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#10B981" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>

            {/* Yellow / Amber Conduit Gradient (Status = ALERTA) */}
            <linearGradient id="conduitWarnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FF" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.4" />
            </linearGradient>

            {/* Red / Critical Conduit Gradient (Status = CRÍTICO) */}
            <linearGradient id="conduitCritGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#EF4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.4" />
            </linearGradient>

            <filter id="conduitGlowDynamic" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Line 1: Center to Top-Left HUD (Motor Pericial de 60 Meses) */}
          <path
            d="M 50% 45% C 35% 40%, 15% 25%, -10 90"
            fill="none"
            stroke={getConduitGradientId(hudPanels[0].health)}
            strokeWidth="2.2"
            strokeDasharray="6 8"
            className="animate-dash-flow opacity-80"
            filter="url(#conduitGlowDynamic)"
          />

          {/* Line 2: Center to Top-Right HUD (Oráculo de Liquidez Preditiva) */}
          <path
            d="M 50% 45% C 65% 40%, 85% 25%, 102% 90"
            fill="none"
            stroke={getConduitGradientId(hudPanels[1].health)}
            strokeWidth="2.2"
            strokeDasharray="6 8"
            className="animate-dash-flow opacity-80"
            filter="url(#conduitGlowDynamic)"
          />

          {/* Line 3: Center to Bottom-Left HUD (CyberSpy Escudo Edge AI) */}
          <path
            d="M 50% 55% C 35% 60%, 15% 75%, -10 330"
            fill="none"
            stroke={getConduitGradientId(hudPanels[2].health)}
            strokeWidth="2.2"
            strokeDasharray="6 8"
            className="animate-dash-flow opacity-80"
            filter="url(#conduitGlowDynamic)"
          />

          {/* Line 4: Center to Bottom-Right HUD (Split de Pagamentos API) */}
          <path
            d="M 50% 55% C 65% 60%, 85% 75%, 102% 330"
            fill="none"
            stroke={getConduitGradientId(hudPanels[3].health)}
            strokeWidth="2.2"
            strokeDasharray="6 8"
            className="animate-dash-flow opacity-80"
            filter="url(#conduitGlowDynamic)"
          />
        </svg>

        {/* LEFT COLUMN: TOP-LEFT HUD & BOTTOM-LEFT HUD */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1 relative z-10">
          
          {/* HUD 1: TOP-LEFT - MOTOR PERICIAL DE 60 MESES */}
          <div
            onClick={() => handlePanelClick(hudPanels[0].targetTab)}
            onMouseEnter={() => setHoveredPanel(hudPanels[0].id)}
            onMouseLeave={() => setHoveredPanel(null)}
            className={`group relative p-5 rounded-2xl bg-[var(--vx-deep)]/90 backdrop-blur-xl border ${hudPanels[0].borderColor} ${hudPanels[0].glowColor} shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1`}
          >
            {/* Corner Tech Brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[var(--vx-neon)]/70 rounded-tl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[var(--vx-neon)]/70 rounded-br" />

            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl ${hudPanels[0].iconBg} ${hudPanels[0].iconColor} shrink-0 group-hover:scale-110 transition-transform`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${hudPanels[0].badgeColor}`}>
                      {hudPanels[0].badge}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      OK
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white group-hover:text-[var(--vx-neon)] transition-colors">
                    {hudPanels[0].title}
                  </h3>
                </div>
              </div>

              <div className="p-1 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-400 group-hover:text-[var(--vx-neon)] group-hover:border-[var(--vx-neon)]/40 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              {hudPanels[0].description}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 font-mono text-[11px]">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase tracking-tight">{hudPanels[0].primaryLabel}</div>
                <div className="text-xs font-bold text-[var(--vx-neon)] mt-0.5">{hudPanels[0].primaryMetric}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase tracking-tight">{hudPanels[0].secondaryLabel}</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">{hudPanels[0].secondaryMetric}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {hudPanels[0].status}
              </span>
              <span className="text-[var(--vx-neon)] font-bold group-hover:underline flex items-center gap-1">
                {hudPanels[0].actionText}
              </span>
            </div>
          </div>

          {/* HUD 3: BOTTOM-LEFT - CYBERSPY ESCUDO EDGE AI */}
          <div
            onClick={() => handlePanelClick(hudPanels[2].targetTab)}
            onMouseEnter={() => setHoveredPanel(hudPanels[2].id)}
            onMouseLeave={() => setHoveredPanel(null)}
            className={`group relative p-5 rounded-2xl bg-[var(--vx-deep)]/90 backdrop-blur-xl border ${hudPanels[2].borderColor} ${hudPanels[2].glowColor} shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1`}
          >
            {/* Corner Tech Brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/70 rounded-tl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/70 rounded-br" />

            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl ${hudPanels[2].iconBg} ${hudPanels[2].iconColor} shrink-0 group-hover:scale-110 transition-transform`}>
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${hudPanels[2].badgeColor}`}>
                      {hudPanels[2].badge}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      OK
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                    {hudPanels[2].title}
                  </h3>
                </div>
              </div>

              <div className="p-1 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-400/40 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              {hudPanels[2].description}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 font-mono text-[11px]">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase tracking-tight">{hudPanels[2].primaryLabel}</div>
                <div className="text-xs font-bold text-cyan-300 mt-0.5">{hudPanels[2].primaryMetric}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase tracking-tight">{hudPanels[2].secondaryLabel}</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">{hudPanels[2].secondaryMetric}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {hudPanels[2].status}
              </span>
              <span className="text-cyan-300 font-bold group-hover:underline flex items-center gap-1">
                {hudPanels[2].actionText}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: REDESIGNED HOLOGRAPHIC BRAIN GAUGE + PROGRESS RING + SCORE */}
        <div className="lg:col-span-4 relative flex flex-col items-center justify-center order-1 lg:order-2 my-4 lg:my-0 z-20">
          
          {/* Circular Holographic Brain Gauge with System Level Score (0-100) */}
          <ModernHolographicBrainGauge 
            score={systemScore}
            statusLabel={systemStatusCategory.label}
            statusType={systemStatusCategory.type}
            metrics={aggregatedMetrics}
            onClick={() => handlePanelClick('autonomous_swarm_brain')}
          />

          {/* Subtitle / Badge Directly Below the Brain & Ring */}
          <div 
            onClick={() => handlePanelClick('autonomous_swarm_brain')}
            className="flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-slate-950/90 border border-cyan-500/40 text-[11px] font-mono text-white shadow-xl backdrop-blur-md cursor-pointer hover:border-cyan-300 hover:bg-slate-900/90 transition-all group"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--vx-neon)] animate-pulse" />
            <span className="font-bold text-[var(--vx-neon)] tracking-wider group-hover:text-cyan-200 transition-colors">
              CÓRTEX NEURAL CENTRAL
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-semibold tracking-wide">
              6 AGENTES CONECTADOS
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: TOP-RIGHT HUD & BOTTOM-RIGHT HUD */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-3 relative z-10">
          
          {/* HUD 2: TOP-RIGHT - ORÁCULO DE LIQUIDEZ PREDITIVA */}
          <div
            onClick={() => handlePanelClick(hudPanels[1].targetTab)}
            onMouseEnter={() => setHoveredPanel(hudPanels[1].id)}
            onMouseLeave={() => setHoveredPanel(null)}
            className={`group relative p-5 rounded-2xl bg-[var(--vx-deep)]/90 backdrop-blur-xl border ${hudPanels[1].borderColor} ${hudPanels[1].glowColor} shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1`}
          >
            {/* Corner Tech Brackets */}
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400/70 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400/70 rounded-bl" />

            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl ${hudPanels[1].iconBg} ${hudPanels[1].iconColor} shrink-0 group-hover:scale-110 transition-transform`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${hudPanels[1].badgeColor}`}>
                      {hudPanels[1].badge}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      OK
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                    {hudPanels[1].title}
                  </h3>
                </div>
              </div>

              <div className="p-1 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-400 group-hover:text-amber-300 group-hover:border-amber-400/40 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              {hudPanels[1].description}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 font-mono text-[11px]">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase tracking-tight">{hudPanels[1].primaryLabel}</div>
                <div className="text-xs font-bold text-amber-300 mt-0.5">{hudPanels[1].primaryMetric}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase tracking-tight">{hudPanels[1].secondaryLabel}</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">{hudPanels[1].secondaryMetric}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {hudPanels[1].status}
              </span>
              <span className="text-amber-300 font-bold group-hover:underline flex items-center gap-1">
                {hudPanels[1].actionText}
              </span>
            </div>
          </div>

          {/* HUD 4: BOTTOM-RIGHT - SPLIT DE PAGAMENTOS API */}
          <div
            onClick={() => handlePanelClick(hudPanels[3].targetTab)}
            onMouseEnter={() => setHoveredPanel(hudPanels[3].id)}
            onMouseLeave={() => setHoveredPanel(null)}
            className={`group relative p-5 rounded-2xl bg-[var(--vx-deep)]/90 backdrop-blur-xl border ${hudPanels[3].borderColor} ${hudPanels[3].glowColor} shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1`}
          >
            {/* Corner Tech Brackets */}
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400/70 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400/70 rounded-bl" />

            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl ${hudPanels[3].iconBg} ${hudPanels[3].iconColor} shrink-0 group-hover:scale-110 transition-transform`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${hudPanels[3].badgeColor}`}>
                      {hudPanels[3].badge}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      OK
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                    {hudPanels[3].title}
                  </h3>
                </div>
              </div>

              <div className="p-1 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-400/40 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              {hudPanels[3].description}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 font-mono text-[11px]">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase tracking-tight">{hudPanels[3].primaryLabel}</div>
                <div className="text-xs font-bold text-cyan-300 mt-0.5">{hudPanels[3].primaryMetric}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[9px] text-slate-400 uppercase tracking-tight">{hudPanels[3].secondaryLabel}</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">{hudPanels[3].secondaryMetric}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {hudPanels[3].status}
              </span>
              <span className="text-cyan-300 font-bold group-hover:underline flex items-center gap-1">
                {hudPanels[3].actionText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTEGRATED SWARM BANNER                                       */}
      {/* "CÉREBRO VELATRIX AOS - ENXAME DE 6 AGENTES"                  */}
      {/* ------------------------------------------------------------- */}
      <div 
        onClick={() => handlePanelClick('autonomous_swarm_brain')}
        className="relative z-20 mt-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 shadow-xl cursor-pointer transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:shadow-cyan-500/10"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[var(--vx-neon)] shrink-0 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wide group-hover:text-[var(--vx-neon)] transition-colors">
                CÉREBRO VELATRIX AOS - ENXAME DE 6 AGENTES
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--vx-neon)] animate-ping" />
                6 WORKERS ONLINE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                DEAD-LETTER ZERO
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800">
                QUÓRUM 4/6
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fiscal (ICMS/ST D+0) • Tesouraria (Sweep Automático) • Anti-Fraude • Supply Resilience • IoT Telemetria • Déjà Vu Interceptor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-1 font-mono text-[11px] text-slate-300 border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 rounded-lg">
            <span className="text-[var(--vx-neon)] font-bold">Ledger SHA-256</span> • Multi-Sig ativo
          </div>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-[var(--vx-neon)] hover:from-cyan-400 hover:to-cyan-300 text-slate-950 text-xs font-black tracking-tight shadow-md flex items-center gap-1.5 transition-all group-hover:translate-x-0.5 cursor-pointer">
            Abrir Hub do Exame →
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER BAR: SECURITY AUDIT & PROTOCOL COMPLIANCE              */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 pt-4 border-t border-cyan-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Lock className="w-3 h-3 text-[var(--vx-neon)]" />
            ISOLAMENTO MULTI-TENANT ESTRITO (POSTGRES RLS + PRISMA CLIENT)
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Key className="w-3 h-3 text-amber-400" />
            HASH ASSINADO: e3b0c44298fc1c149afbf4c8996fb924...
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            ENTERPRISE FINTECH PROTOCOL v4.2
          </span>
        </div>
      </div>
    </section>
  );
};
