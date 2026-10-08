import React, { useState } from 'react';
import { 
  Globe, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  PowerOff, 
  Eye, 
  ShieldCheck,
  Server,
  Zap,
  Activity,
  Layers,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { TenantProfile } from '../../types/aos';
import { useAuth } from '../../context/AuthContext';
import { VELATRIX_PLAN_TIERS, PlanTier } from '../../data/planFeatures';
import { RealGeoMap } from '../common/RealGeoMap';

export const SuperAdminGeoDashboard: React.FC = () => {
  const { tenantsList, activeTenant, setActiveTenant } = useAuth();
  // Default to activeTenant or first tenant so panel is ready immediately
  const [selectedPinTenant, setSelectedPinTenant] = useState<TenantProfile | null>(
    activeTenant || tenantsList[0] || null
  );

  // Group tenants by status
  const nominalCount = tenantsList.filter(t => t.status === 'active').length;
  const warningCount = tenantsList.filter(t => t.status === 'warning').length;
  const shadowCount = tenantsList.filter(t => t.status === 'shadow_mode').length;
  const suspendedCount = tenantsList.filter(t => t.status === 'suspended').length;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return { label: 'Nominal', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', pin: '#10B981', ring: 'rgba(16, 185, 129, 0.4)' };
      case 'warning':
        return { label: 'Alerta Conector', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', pin: '#F59E0B', ring: 'rgba(245, 158, 11, 0.4)' };
      case 'shadow_mode':
        return { label: 'Shadow Mode (14d)', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', pin: '#00F2FF', ring: 'rgba(0, 242, 255, 0.4)' };
      case 'suspended':
        return { label: 'Kill-Switch Ativo', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40', pin: '#F43F5E', ring: 'rgba(244, 63, 94, 0.4)' };
      default:
        return { label: 'Ativo', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', pin: '#10B981', ring: 'rgba(16, 185, 129, 0.4)' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Status Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Tenants Nominais</span>
            <span className="text-xl font-bold text-emerald-200 font-mono">{nominalCount}</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">Em Alerta / Latência</span>
            <span className="text-xl font-bold text-amber-200 font-mono">{warningCount}</span>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">Shadow Mode (14d)</span>
            <span className="text-xl font-bold text-cyan-200 font-mono">{shadowCount}</span>
          </div>
          <Eye className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">Kill-Switch / Suspensos</span>
            <span className="text-xl font-bold text-rose-200 font-mono">{suspendedCount}</span>
          </div>
          <PowerOff className="w-6 h-6 text-rose-400" />
        </div>
      </div>

      {/* Main Map + Side Details View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Geographic Map Canvas Column */}
        <div className="lg:col-span-8 bg-[var(--vx-deep)] p-4 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--vx-neon)]" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Distribuição Geográfica Real & Enclaves Velatrix
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                LatAm Multi-Região • {tenantsList.length} Nós Ativos
              </span>
            </div>
          </div>

          {/* Real Cartographic Map Container */}
          <RealGeoMap
            initialCenter={[-15.78, -50.0]}
            initialZoom={4}
            minZoom={3}
            maxZoom={10}
            height={520}
            showLayerToggle={true}
            showControls={true}
            showRoads={true}
            showCityNames={true}
          >
            {({ project }) => (
              <div className="absolute inset-0 pointer-events-none">
                {tenantsList.map((tenant) => {
                  const lat = tenant.location?.lat ?? -15.78;
                  const lng = tenant.location?.lng ?? -47.93;
                  const { x, y, inBounds } = project(lat, lng);
                  if (!inBounds) return null;

                  const statusMeta = getStatusBadge(tenant.status);
                  const isSelected = selectedPinTenant?.id === tenant.id;

                  return (
                    <div
                      key={tenant.id}
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className="absolute pointer-events-auto z-30 group"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPinTenant(tenant);
                        }}
                        className={`relative flex items-center justify-center p-2 rounded-full cursor-pointer transition-all duration-200 focus:outline-none ${
                          isSelected ? 'scale-125 z-40' : 'hover:scale-115'
                        }`}
                        title={`${tenant.name} (${tenant.location?.city || ''}/${tenant.location?.state || ''}) - Clique para inspecionar`}
                      >
                        {/* Outer Pulsing Aura */}
                        <span 
                          style={{ backgroundColor: statusMeta.pin }}
                          className={`absolute w-9 h-9 rounded-full opacity-35 ${
                            isSelected ? 'animate-ping' : 'group-hover:animate-pulse'
                          }`} 
                        />

                        {/* Middle Halo Circle */}
                        <span 
                          style={{ borderColor: statusMeta.pin, backgroundColor: `${statusMeta.pin}20` }}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform ${
                            isSelected ? 'border-[var(--vx-neon)] bg-[var(--vx-neon)]/30' : ''
                          }`}
                        >
                          <Building2 className="w-3 h-3 text-white" />
                        </span>

                        {/* Floating Geo-Label */}
                        <div className={`absolute left-full ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold whitespace-nowrap shadow-xl border transition-all ${
                          isSelected 
                            ? 'bg-[var(--vx-neon)] text-slate-950 border-white shadow-[var(--vx-neon)]/30 scale-105' 
                            : 'bg-slate-950/90 text-slate-200 border-slate-800 group-hover:border-[var(--vx-neon)]/50 group-hover:text-[var(--vx-neon)]'
                        }`}>
                          <span>{tenant.name.split(' ')[0]}</span>
                          <span className="opacity-75 ml-1">({tenant.location?.state || 'BR'})</span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </RealGeoMap>

          {/* Quick Enclaves Bottom Selector Strip */}
          <div className="pt-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5">
              Enclaves Registrados no Mapa (Clique para focar no Enclave):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tenantsList.map(tenant => {
                const isSelected = selectedPinTenant?.id === tenant.id;
                const statusMeta = getStatusBadge(tenant.status);
                return (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => setSelectedPinTenant(tenant)}
                    className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[var(--vx-neon)]/15 border-[var(--vx-neon)] text-[var(--vx-neon)] shadow-lg shadow-[var(--vx-neon)]/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-bold truncate text-[11px]">{tenant.name.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tenant.location?.city} - {tenant.location?.state}</div>
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.color.replace('text-', 'bg-')}`} />
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Selected Tenant Inspection Card */}
        <div className="lg:col-span-4 bg-[var(--vx-deep)] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--vx-neon)]" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Inspeção Geográfica de Enclave
                </h3>
              </div>
              {selectedPinTenant && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getStatusBadge(selectedPinTenant.status).bg} ${getStatusBadge(selectedPinTenant.status).color} ${getStatusBadge(selectedPinTenant.status).border}`}>
                  {getStatusBadge(selectedPinTenant.status).label}
                </span>
              )}
            </div>

            {selectedPinTenant ? (
              <div className="space-y-3.5 text-xs">
                
                {/* Header Information */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="text-[10px] text-[var(--vx-neon)] uppercase font-mono font-bold">
                    {selectedPinTenant.sectorLabel || 'Manufatura & Indústria'}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 leading-snug">{selectedPinTenant.name}</h4>
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                    <span>CNPJ: {selectedPinTenant.cnpj}</span>
                    <span className="text-slate-500">ID: {selectedPinTenant.id.slice(0, 14)}</span>
                  </div>
                </div>

                {/* Geo Coordinates & Topology */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Localidade:</span>
                    <span className="font-semibold text-slate-100">{selectedPinTenant.location?.city} / {selectedPinTenant.location?.state}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Coordenadas GPS:</span>
                    <span className="text-cyan-400">{selectedPinTenant.location?.lat?.toFixed(4)}°, {selectedPinTenant.location?.lng?.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Plano Ativo:</span>
                    <span className="text-[var(--vx-neon)] font-bold">{selectedPinTenant.planTier}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Receita Mensal (MRR):</span>
                    <span className="text-emerald-400 font-bold">R$ {selectedPinTenant.mrrBrl?.toLocaleString('pt-BR') || '0'},00</span>
                  </div>
                </div>

                {/* System Integration & Channels */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-mono font-bold flex items-center justify-between">
                    <span>Integrações & Conectores ERP</span>
                    <Server className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="text-[11px] text-slate-200 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
                    {selectedPinTenant.connectedErp || 'TOTVS Protheus / SAP OData'}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPinTenant.connectedChannels?.map(ch => (
                      <span key={ch} className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                        {ch}
                      </span>
                    )) || (
                      <span className="text-slate-500 text-[10px] font-mono">SPED Fiscal • WhatsApp Webhook</span>
                    )}
                  </div>
                </div>

                {/* Telemetry & Latency Node Stats */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-mono font-bold flex items-center justify-between">
                    <span>Telemetria do Nó SRE & Gemini</span>
                    <Activity className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">Latência Nó</span>
                      <span className="text-emerald-400 font-bold">18ms (Cloud Run)</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">Consumo Gemini</span>
                      <span className="text-slate-200 font-bold">{((selectedPinTenant.tokensConsumedMonthly || 0) / 1000000).toFixed(2)}M Tok</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-40 animate-bounce" />
                <p className="font-semibold text-slate-300">Nenhum Enclave Selecionado</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                  Clique em qualquer marcador no mapa ou na lista abaixo para inspecionar os parâmetros operacionais.
                </p>
              </div>
            )}
          </div>

          {selectedPinTenant && (
            <div className="pt-4 border-t border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setActiveTenant(selectedPinTenant)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--vx-neon)] to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[var(--vx-neon)]/20"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Alternar Dashboard para {selectedPinTenant.name.split(' ')[0]}</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

