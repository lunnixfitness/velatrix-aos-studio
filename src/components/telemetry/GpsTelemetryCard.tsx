import React, { useState } from 'react';
import { 
  Navigation, 
  Radio, 
  ThermometerSnowflake, 
  Clock, 
  ShieldAlert, 
  MapPin, 
  Maximize2, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Layers,
  ChevronRight,
  ExternalLink,
  Zap
} from 'lucide-react';
import { FleetVehicle, GeofenceZone } from '../../types/telemetry';
import { INITIAL_FLEET_VEHICLES, MOCK_GEOFENCE_ZONES } from '../../data/telemetryMockData';
import { RealGeoMap } from '../common/RealGeoMap';

interface GpsTelemetryCardProps {
  onOpenFullView: () => void;
  onSelectVehicle?: (vehicle: FleetVehicle) => void;
}

export const GpsTelemetryCard: React.FC<GpsTelemetryCardProps> = ({
  onOpenFullView,
  onSelectVehicle
}) => {
  const [vehicles] = useState<FleetVehicle[]>(INITIAL_FLEET_VEHICLES);
  const [zones] = useState<GeofenceZone[]>(MOCK_GEOFENCE_ZONES);
  const [hoveredVehicle, setHoveredVehicle] = useState<FleetVehicle | null>(null);

  // Quick stats
  const totalVehicles = vehicles.length;
  const tempAlertsCount = vehicles.filter(v => v.sensors.isTempOutOfRange).length;
  const overstayCount = vehicles.filter(v => v.geofenceState?.isOverstay).length;
  const fraudBlockedCount = vehicles.filter(v => v.audit.auditStatus === 'blocked_fraud').length;

  return (
    <div id="gps-telemetry-preview-card" className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
      
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight">
                Geolocalização & Telemetria Geoespacial
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded-full font-semibold">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                Live 5G/Starlink
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rastreamento em tempo real, Geofencing autônomo, Diárias de Overstay e IoT de Cadeia Fria
            </p>
          </div>
        </div>

        {/* Action button to open full telemetry dashboard */}
        <button
          id="btn-open-full-gps-map"
          onClick={onOpenFullView}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Ver Mapa Completo</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Badges Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Frota Ativa</div>
            <div className="text-sm font-black text-slate-100">{totalVehicles} Veículos</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-900/40 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
            <ThermometerSnowflake className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Alerta Térmico</div>
            <div className="text-sm font-black text-rose-400">{tempAlertsCount} Carga (-11.4°C)</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-900/40 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Overstay Faturado</div>
            <div className="text-sm font-black text-amber-400">{overstayCount} CD (R$ 500)</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-900/40 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Fraude Bloqueada</div>
            <div className="text-sm font-black text-emerald-400">{fraudBlockedCount} NF-e (R$ 1.150)</div>
          </div>
        </div>
      </div>

      {/* Mini Radar Map Canvas Preview & Priority Trucks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left: Mini Geospatial Vector Radar (Interactive) */}
        <div className="lg:col-span-7 relative h-56 sm:h-64 rounded-xl border border-slate-800/90 overflow-hidden select-none group bg-[var(--vx-deep)]">
          <RealGeoMap
            initialCenter={[-23.3, -46.8]}
            initialZoom={6}
            minZoom={4}
            maxZoom={10}
            height="100%"
            showLayerToggle={false}
            showControls={false}
            showRoads={true}
            showCityNames={true}
          >
            {({ project }) => {
              return (
                <>
                  {/* Geofence Hub Rings */}
                  {zones.slice(0, 4).map(zone => {
                    const pos = project(zone.lat || -23.3, zone.lng || -46.8);
                    if (!pos.inBounds) return null;

                    return (
                      <div 
                        key={zone.id}
                        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
                      >
                        <div className="w-8 h-8 rounded-full border border-cyan-500/40 bg-cyan-500/10 animate-pulse flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-cyan-400/90" />
                        </div>
                        <span className="text-[8px] font-mono font-bold text-slate-300 bg-slate-950/90 px-1 rounded mt-0.5 border border-slate-800">
                          {zone.code}
                        </span>
                      </div>
                    );
                  })}

                  {/* Moving Vehicles on Mini Map */}
                  {vehicles.map(veh => {
                    const pos = project(veh.lat, veh.lng);
                    if (!pos.inBounds) return null;

                    const isTempAlert = veh.sensors.isTempOutOfRange;
                    const isOverstay = veh.geofenceState?.isOverstay;
                    const isFraud = veh.audit.auditStatus === 'blocked_fraud';

                    let markerColor = 'bg-cyan-500 text-cyan-300 border-cyan-400';
                    if (isTempAlert) markerColor = 'bg-rose-500 text-rose-300 border-rose-400 animate-bounce';
                    else if (isOverstay) markerColor = 'bg-amber-500 text-amber-300 border-amber-400';
                    else if (isFraud) markerColor = 'bg-red-600 text-red-300 border-red-500';

                    return (
                      <button
                        key={veh.id}
                        type="button"
                        onClick={() => {
                          if (onSelectVehicle) onSelectVehicle(veh);
                          onOpenFullView();
                        }}
                        onMouseEnter={() => setHoveredVehicle(veh)}
                        onMouseLeave={() => setHoveredVehicle(null)}
                        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-transform hover:scale-125 focus:outline-none`}
                        title={`${veh.plate} - ${veh.cargoDescription}`}
                      >
                        <div className="relative">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 ${markerColor} flex items-center justify-center shadow-lg shadow-cyan-500/20`} />
                          <span className="absolute left-4 -top-1 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-slate-950/90 text-slate-200 border border-slate-800 whitespace-nowrap shadow-md">
                            {veh.plate}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Mini overlay label */}
                  <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 text-[10px] text-slate-300 bg-slate-950/90 px-2 py-0.5 rounded-lg border border-slate-800 font-mono shadow-md">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    <span>Corredor Logístico Sul-Sudeste (Real-Time)</span>
                  </div>
                </>
              );
            }}
          </RealGeoMap>

          {/* Quick Hover Tooltip */}
          {hoveredVehicle && (
            <div className="absolute top-2 right-2 z-30 bg-slate-950/95 border border-cyan-500/50 p-2 rounded-lg text-[10px] space-y-0.5 shadow-xl max-w-[200px]">
              <div className="font-bold text-slate-100 flex items-center justify-between">
                <span>{hoveredVehicle.plate}</span>
                <span className="font-mono text-cyan-400">{hoveredVehicle.speedKmH} km/h</span>
              </div>
              <div className="text-slate-400 truncate">{hoveredVehicle.cargoDescription}</div>
              <div className="text-slate-300 font-mono">ETA: {hoveredVehicle.etaMinutes} min ({hoveredVehicle.destinationName.split('(')[0]})</div>
            </div>
          )}
        </div>

        {/* Right: Critical Telemetry Highlights (2 Active Cases) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-2">
          
          {/* Card 1: Critical Cold Chain Temp Alert */}
          <div 
            onClick={() => {
              if (onSelectVehicle) onSelectVehicle(vehicles[0]);
              onOpenFullView();
            }}
            className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-rose-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[11px] font-bold text-rose-300 font-mono">
                  BRA-2E19 • Excursão Térmica
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                -11.4°C (Max: -15°C)
              </span>
            </div>
            <p className="text-[10px] text-slate-300 line-clamp-1">
              {vehicles[0].cargoDescription} • Motorista {vehicles[0].driverName.split(' ')[0]}
            </p>
            <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-mono">
              <span>ETA Cajamar: 28 min</span>
              <span className="text-rose-400 font-semibold group-hover:underline">Ver Gráfico IoT →</span>
            </div>
          </div>

          {/* Card 2: Automatic Overstay Dwell Billing */}
          <div 
            onClick={() => {
              if (onSelectVehicle) onSelectVehicle(vehicles[1]);
              onOpenFullView();
            }}
            className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-amber-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] font-bold text-amber-300 font-mono">
                  SP-9821 • Overstay em Doca
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                4h 05m (R$ 500,00)
              </span>
            </div>
            <p className="text-[10px] text-slate-300 line-clamp-1">
              Mega CD Frio Louveira • Fatura gerada automaticamente no ERP
            </p>
            <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-mono">
              <span>Doca 08 Parada</span>
              <span className="text-amber-400 font-semibold group-hover:underline">Inspecionar Fatura →</span>
            </div>
          </div>

          {/* Card 3: Anti-fraud Toll & Fuel Cross-Audit */}
          <div 
            onClick={() => {
              if (onSelectVehicle) onSelectVehicle(vehicles[2]);
              onOpenFullView();
            }}
            className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-300 font-mono">
                  PR-4412 • Fraude Bloqueada
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                -R$ 1.150,00
              </span>
            </div>
            <p className="text-[10px] text-slate-300 line-clamp-1">
              NF-e emitida 48.2 km distante do GPS real • Reembolso congelado
            </p>
            <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-mono">
              <span>Auditoria Sem Parar x NF-e</span>
              <span className="text-emerald-400 font-semibold group-hover:underline">Ver Laudo GPS →</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
