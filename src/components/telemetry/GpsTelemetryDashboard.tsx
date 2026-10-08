import React, { useState } from 'react';
import { 
  Navigation, 
  Radio, 
  ThermometerSnowflake, 
  Clock, 
  ShieldAlert, 
  MapPin, 
  Truck, 
  Layers, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Compass, 
  Activity, 
  Zap, 
  Receipt, 
  PhoneCall, 
  Building2, 
  Search, 
  Info,
  Maximize2,
  FileCheck,
  Fuel,
  ArrowRight,
  Sparkles,
  KeyRound,
  Check
} from 'lucide-react';
import { 
  FleetVehicle, 
  GeofenceZone, 
  TelemetryEventLog,
  PredictiveMaintenanceMetric,
  RouteAnomalyEvent
} from '../../types/telemetry';
import { 
  INITIAL_FLEET_VEHICLES, 
  MOCK_GEOFENCE_ZONES, 
  INITIAL_TELEMETRY_LOGS,
  MOCK_PREDICTIVE_MAINTENANCE,
  MOCK_ROUTE_ANOMALIES
} from '../../data/telemetryMockData';
import { RealGeoMap } from '../common/RealGeoMap';
import { AuditRecord } from '../../types/aos';
import { secureId, secureInt } from '../../lib/demoMode';

interface GpsTelemetryDashboardProps {
  onBackToDashboard?: () => void;
  initialSelectedVehicleId?: string;
  onAddAuditRecord?: (record: AuditRecord) => void;
}

export const GpsTelemetryDashboard: React.FC<GpsTelemetryDashboardProps> = ({
  onBackToDashboard,
  initialSelectedVehicleId,
  onAddAuditRecord
}) => {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(INITIAL_FLEET_VEHICLES);
  const [zones] = useState<GeofenceZone[]>(MOCK_GEOFENCE_ZONES);
  const [logs, setLogs] = useState<TelemetryEventLog[]>(INITIAL_TELEMETRY_LOGS);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    initialSelectedVehicleId || INITIAL_FLEET_VEHICLES[0].id
  );
  const [activeTab, setActiveTab] = useState<
    'map_tracker' | 'geofence_zones' | 'overstay_billing' | 'iot_cold_chain' | 'fraud_audit' | 'predictive_maintenance' | 'route_anomalies'
  >('map_tracker');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<RouteAnomalyEvent[]>(MOCK_ROUTE_ANOMALIES);
  const [maintenanceRecords, setMaintenanceRecords] = useState<Record<string, PredictiveMaintenanceMetric>>(MOCK_PREDICTIVE_MAINTENANCE);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(id);
    setTimeout(() => setCopiedPayload(null), 2000);
  };

  // 1. Simulation: Restore Temperature
  const handleRestoreTemperature = (vehicleId: string) => {
    setIsSimulating(true);
    setTimeout(() => {
      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return {
            ...v,
            status: 'nominal',
            sensors: {
              ...v.sensors,
              temperature: -18.2,
              compressorStatus: 'active',
              isTempOutOfRange: false
            },
            tempHistory: [
              ...v.tempHistory,
              { time: '15:20', temp: -18.2 }
            ]
          };
        }
        return v;
      }));

      const newLog: TelemetryEventLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        vehicleId,
        plate: selectedVehicle.plate,
        type: 'temp_restored',
        title: 'Câmara Frigorífica Normalizada (-18.2°C)',
        details: 'Compressor reiniciado com sucesso após acionamento do protocolo de redundância. Carga resguardada dentro da especificação farmacêutica.',
        severity: 'success'
      };
      setLogs(prev => [newLog, ...prev]);
      setIsSimulating(false);

      if (onAddAuditRecord) {
        const hash = `0x${Array.from({ length: 32 }, () => secureInt(0, 15).toString(16)).join('')}`;
        onAddAuditRecord({
          id: `rec_telemetry_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: `evt_iot_temp_${vehicleId}`,
          eventTitle: `Normalização Térmica Cadeia Fria IoT (${selectedVehicle.plate})`,
          sector: 'logistics',
          agentsInvolved: ['IoT ColdChain Sensor Agent', 'Facility Maint. Guard', 'Ledger Orchestrator'],
          decisionSummary: `Disparo autônomo de comando de religamento do compressor frigorífico para o veículo ${selectedVehicle.plate}. Temperatura restaurada para -18.2°C dentro do SLA da Anvisa RDC 430.`,
          decisionAst: {
            id: `ast_iot_${Date.now()}`,
            ui_type: 'CriticalDecisionCard',
            priority: 'High',
            summary: `Cadeia Fria preservada. Prejuízo evitado: R$ 420.000 em vacinas/imunobiológicos.`,
            kpis: [
              { label: 'Temperatura Alvo', value: '-18.2°C', impact: 'positive' },
              { label: 'Veículo', value: selectedVehicle.plate, impact: 'neutral' },
              { label: 'SLA Frio', value: 'Conforme', impact: 'positive' }
            ],
            invariants_checked: ['Faixa Térmica [-22°C .. -15°C]', 'Alimentação Auxiliar Nominal'],
            audit_hash: hash
          },
          status: 'executed',
          requiredSignatures: 2,
          signatures: [
            { role: 'IoT Edge Telemetry Key', keyId: '0x992B...C104', signedAt: new Date().toISOString(), verified: true },
            { role: 'Pharma Quality Validator', keyId: '0x71A0...D892', signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-IOT-COLDCHAIN-${secureId('', 4).toUpperCase()}`,
          invariantSnapshot: ['Temperatura <= -15°C', 'Redundância do Gerador Ativa'],
          recordHash: hash
        });
      }
    }, 600);
  };

  // 2. Simulation: Trigger Overstay Invoice
  const handleTriggerOverstayInvoice = (vehicleId: string) => {
    setIsSimulating(true);
    setTimeout(() => {
      const overstayAmount = selectedVehicle.geofenceState?.overstayAmountBrl || 500;
      const newLog: TelemetryEventLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        vehicleId,
        plate: selectedVehicle.plate,
        type: 'overstay_fee_billed',
        title: 'Fatura de Estadia Reconciliada no SAP TMS',
        details: `Cálculo de diária de permanência excedente (R$ ${overstayAmount},00) aprovado e lançado no centro de custo da transportadora.`,
        severity: 'warning',
        automatedPayload: {
          action: 'dispatch_sap_ar_invoice',
          targetService: 'sap_s4hana_tms_api',
          payloadJson: JSON.stringify({
            event: 'CONFIRMED_OVERSTAY_POSTING',
            vehicleId,
            plate: selectedVehicle.plate,
            amountBrl: overstayAmount,
            status: 'CLEARED_AUTOMATICALLY'
          }, null, 2)
        }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsSimulating(false);

      if (onAddAuditRecord) {
        const hash = `0x${Array.from({ length: 32 }, () => secureInt(0, 15).toString(16)).join('')}`;
        onAddAuditRecord({
          id: `rec_overstay_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: `evt_overstay_${vehicleId}`,
          eventTitle: `Fatura de Estadia Reconciliada SAP TMS (${selectedVehicle.plate})`,
          sector: 'logistics',
          agentsInvolved: ['Fleet & TMS Agent', 'SAP Financial Gateway', 'Audit Ledger'],
          decisionSummary: `Lançamento autônomo de diária de permanência de R$ ${overstayAmount},00 por excesso de tempo em doca (${selectedVehicle.geofenceState?.zoneName || 'CD Intermodal'}).`,
          decisionAst: {
            id: `ast_overstay_${Date.now()}`,
            ui_type: 'CriticalDecisionCard',
            priority: 'Medium',
            summary: `Cobrança de estadia processada no SAP TMS com auditoria telemétrica D+0.`,
            kpis: [
              { label: 'Valor Cobrado', value: `R$ ${overstayAmount},00`, impact: 'positive' },
              { label: 'Tempo em Doca', value: `${selectedVehicle.geofenceState?.dwellMinutes || 120} min`, impact: 'neutral' }
            ],
            invariants_checked: ['Dwell Time > Grace Period (45 min)', 'Trava Anti-Glosa TMS'],
            audit_hash: hash
          },
          status: 'executed',
          requiredSignatures: 2,
          signatures: [
            { role: 'TMS Dispatch Key', keyId: '0x33A1...E49B', signedAt: new Date().toISOString(), verified: true },
            { role: 'SAP Finance Gateway', keyId: '0x88CC...11D9', signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-TMS-OVERSTAY-${secureId('', 4).toUpperCase()}`,
          invariantSnapshot: ['Carência de 45m expirada', 'Lançamento Contábil D+0'],
          recordHash: hash
        });
      }
    }, 600);
  };

  // 3. Simulation: Geofence Check-in
  const handleSimulateGeofenceEntry = (vehicleId: string, zoneId: string) => {
    const targetZone = zones.find(z => z.id === zoneId) || zones[0];
    setIsSimulating(true);
    setTimeout(() => {
      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return {
            ...v,
            status: 'at_geofence',
            speedKmH: 0,
            mapX: targetZone.mapX,
            mapY: targetZone.mapY,
            geofenceState: {
              zoneId: targetZone.id,
              zoneName: targetZone.name,
              enteredAt: new Date().toLocaleTimeString().slice(0, 5),
              dwellMinutes: 1,
              gracePeriodMinutes: targetZone.dwellLimitMinutes,
              hourlyRateBrl: targetZone.overstayHourlyRateBrl,
              isOverstay: false,
              overstayAmountBrl: 0,
              dockNumber: 'Doca 02 (Check-in Automático via Geofencing)',
              autoBillingTriggered: false
            }
          };
        }
        return v;
      }));

      const newLog: TelemetryEventLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        vehicleId,
        plate: selectedVehicle.plate,
        type: 'geofence_entry',
        title: `Check-in Autônomo em ${targetZone.name}`,
        details: `Caminhão cruzou raio de 500m do ${targetZone.name}. Evento disparado no TMS sem necessidade de guichê ou preenchimento manual de formulários.`,
        severity: 'success'
      };
      setLogs(prev => [newLog, ...prev]);
      setIsSimulating(false);

      if (onAddAuditRecord) {
        const hash = `0x${Array.from({ length: 32 }, () => secureInt(0, 15).toString(16)).join('')}`;
        onAddAuditRecord({
          id: `rec_geofence_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: `evt_geo_entry_${vehicleId}`,
          eventTitle: `Check-in Autônomo Geofence (${targetZone.name})`,
          sector: 'logistics',
          agentsInvolved: ['Geofence IoT Gate', 'TMS Autonomous Reception', 'Audit Ledger'],
          decisionSummary: `Reconhecimento de entrada em raio de 500m de ${targetZone.name} para o veículo ${selectedVehicle.plate}. Abertura automática de portaria e agendamento de doca.`,
          decisionAst: {
            id: `ast_geo_${Date.now()}`,
            ui_type: 'CriticalDecisionCard',
            priority: 'Low',
            summary: `Check-in sem fricção operacional no pátio logístico.`,
            kpis: [
              { label: 'Zona', value: targetZone.name, impact: 'neutral' },
              { label: 'Tempo de Espera Reduzido', value: '-22 min', impact: 'positive' }
            ],
            invariants_checked: ['Raio Geográfico < 500m', 'Manifesto de Carga MDF-e Válido'],
            audit_hash: hash
          },
          status: 'executed',
          requiredSignatures: 1,
          signatures: [
            { role: 'Geofence RFID Sensor', keyId: '0x12FA...99BB', signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-GEOFENCE-IN-${secureId('', 4).toUpperCase()}`,
          invariantSnapshot: ['Geofence Raio 500m', 'MDF-e Autorizado'],
          recordHash: hash
        });
      }
    }, 600);
  };

  // 4. Simulation: Predictive Maintenance Schedule
  const handleScheduleMaintenance = (vehicleId: string) => {
    setIsSimulating(true);
    setTimeout(() => {
      setMaintenanceRecords(prev => {
        const curr = prev[vehicleId];
        if (!curr) return prev;
        return {
          ...prev,
          [vehicleId]: {
            ...curr,
            overallRiskLevel: 'LOW',
            estimatedDaysToService: 60,
            aiDiagnosticSummary: 'Revisão preventiva confirmada e agendada no SAP PM / Oficina Base Autorizada Scania. Peças e fluidos reservados com antecedência.'
          }
        };
      });

      const newLog: TelemetryEventLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        vehicleId,
        plate: selectedVehicle.plate,
        type: 'predictive_maintenance_alert',
        title: 'Ordem de Manutenção Preventiva Gerada (SAP PM)',
        details: `Meta-agente de frotas abriu OS preventiva para troca de pastilhas e óleo com base em telemetria preditiva. Evitada parada corretiva em rodovia.`,
        severity: 'success'
      };
      setLogs(prev => [newLog, ...prev]);
      setIsSimulating(false);

      if (onAddAuditRecord) {
        const hash = `0x${Array.from({ length: 32 }, () => secureInt(0, 15).toString(16)).join('')}`;
        onAddAuditRecord({
          id: `rec_pm_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: `evt_sap_pm_${vehicleId}`,
          eventTitle: `Ordem de Manutenção Preventiva SAP PM (${selectedVehicle.plate})`,
          sector: 'logistics',
          agentsInvolved: ['CAN-Bus Fleet Agent', 'SAP PM Gateway', 'Audit Ledger'],
          decisionSummary: `Abertura autônoma de Ordem de Serviço Preventiva no SAP PM com base em desgaste telemétrico de pastilhas e óleo motor. Custo estimado de R$ 4.200,00 aprovado.`,
          decisionAst: {
            id: `ast_pm_${Date.now()}`,
            ui_type: 'CriticalDecisionCard',
            priority: 'Medium',
            summary: `Manutenção preventiva disparada para evitar downtime corretivo em trânsito.`,
            kpis: [
              { label: 'Economia Preventiva vs Corretiva', value: 'R$ 18.500', impact: 'positive' },
              { label: 'Previsão de Parada', value: 'Programada (D+7)', impact: 'positive' }
            ],
            invariants_checked: ['Desgaste > Limite Crítico 75%', 'Alocação Orçamentária Aprovada'],
            audit_hash: hash
          },
          status: 'executed',
          requiredSignatures: 2,
          signatures: [
            { role: 'Fleet Telemetry Agent', keyId: '0x44EE...8811', signedAt: new Date().toISOString(), verified: true },
            { role: 'SAP PM Master Key', keyId: '0x22DD...7733', signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-SAP-PM-${secureId('', 4).toUpperCase()}`,
          invariantSnapshot: ['Telemetria CAN-bus > 75%', 'OS Agendada'],
          recordHash: hash
        });
      }
    }, 600);
  };

  // 5. Simulation: Acknowledge & Dispatch Security for Anomaly
  const handleUpdateAnomalyStatus = (anomalyId: string, newStatus: 'acknowledged' | 'dispatched_security' | 'resolved') => {
    setAnomalies(prev => prev.map(a => a.id === anomalyId ? { ...a, status: newStatus } : a));
    const anom = anomalies.find(a => a.id === anomalyId);
    if (anom) {
      const newLog: TelemetryEventLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        vehicleId: anom.vehicleId,
        plate: anom.plate,
        type: 'route_anomaly_detected',
        title: newStatus === 'dispatched_security' ? 'Escolta Virtual & Contato Acionados' : 'Desvio de Rota Reconhecido',
        details: `Ação tomada para anomalia "${anom.anomalyDescription.slice(0, 80)}...". Status atualizado para: ${newStatus.toUpperCase()}.`,
        severity: newStatus === 'dispatched_security' ? 'critical' : 'warning'
      };
      setLogs(prev => [newLog, ...prev]);

      if (onAddAuditRecord && newStatus === 'dispatched_security') {
        const hash = `0x${Array.from({ length: 32 }, () => secureInt(0, 15).toString(16)).join('')}`;
        onAddAuditRecord({
          id: `rec_anomaly_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: `evt_escort_${anom.id}`,
          eventTitle: `Escolta & Contenção de Risco de Rota (${anom.plate})`,
          sector: 'logistics',
          agentsInvolved: ['Route Compliance Agent', 'Security Dispatch Swarm', 'Audit Ledger'],
          decisionSummary: `Desvio de rota não-autorizado detectado para o veículo ${anom.plate}. Escolta virtual e bloqueio preventivo de ignição acionados via protocolo Zero-Trust.`,
          decisionAst: {
            id: `ast_escort_${Date.now()}`,
            ui_type: 'CriticalDecisionCard',
            priority: 'High',
            summary: `Mitigação de risco de sinistro e roubo de carga.`,
            kpis: [
              { label: 'Desvio Rastreado', value: `${anom.deviationKm} km fora do corredor`, impact: 'negative' },
              { label: 'Status', value: 'Escolta Acionada', impact: 'positive' }
            ],
            invariants_checked: ['Desvio de Rota > 3 km', 'Parada em Zona Não-Homologada'],
            audit_hash: hash
          },
          status: 'quarantine',
          requiredSignatures: 2,
          signatures: [
            { role: 'Security Control Key', keyId: '0x99AA...5512', signedAt: new Date().toISOString(), verified: true },
            { role: 'AOS Risk Engine', keyId: '0x11FF...3344', signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-SECURITY-ESCORT-${secureId('', 4).toUpperCase()}`,
          invariantSnapshot: ['Alerta de Rota Crítico', 'Escolta Acionada'],
          recordHash: hash
        });
      }
    }
  };

  // Filtered vehicles
  const filteredVehicles = vehicles.filter(v => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'alert') return v.sensors.isTempOutOfRange || v.geofenceState?.isOverstay || v.audit.auditStatus === 'blocked_fraud';
    if (filterStatus === 'in_transit') return v.status === 'in_transit' || v.status === 'temp_alert';
    if (filterStatus === 'geofence') return v.status === 'at_geofence' || v.status === 'overstay_alert';
    return true;
  });

  return (
    <div id="gps-telemetry-dashboard" className="max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-slate-100 tracking-tight">
                Geolocalização & Telemetria Geoespacial
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                AOS Fleet & Supply Chain v4.8
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Rastreamento em Tempo Real • Geofencing Autônomo • Diárias de Overstay • Cadeia Fria IoT • Auditoria Antifraude
            </p>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            ← Voltar ao Dashboard
          </button>
        )}
      </div>

      {/* 5 Main Feature Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80 scrollbar-none">
        <button
          onClick={() => setActiveTab('map_tracker')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
            activeTab === 'map_tracker'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <Navigation className="w-4 h-4 text-cyan-400" />
          <span>1. Mapa & Rotas ao Vivo</span>
        </button>

        <button
          onClick={() => setActiveTab('geofence_zones')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
            activeTab === 'geofence_zones'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>2. Cercas Virtuais (Geofencing)</span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono">
            {zones.length} CDs
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overstay_billing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
            activeTab === 'overstay_billing'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>3. Diárias de Overstay</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 text-[10px] font-mono font-bold">
            R$ 500 faturados
          </span>
        </button>

        <button
          onClick={() => setActiveTab('iot_cold_chain')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
            activeTab === 'iot_cold_chain'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <ThermometerSnowflake className="w-4 h-4 text-rose-400" />
          <span>4. IoT Cadeia Fria</span>
          <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 text-[10px] font-mono font-bold animate-pulse">
            1 Alerta (-11.4°C)
          </span>
        </button>

        <button
          onClick={() => setActiveTab('fraud_audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
            activeTab === 'fraud_audit'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>5. Auditoria GPS x Pedágio</span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold">
            -R$ 1.150 Fraude
          </span>
        </button>

        <button
          onClick={() => setActiveTab('predictive_maintenance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
            activeTab === 'predictive_maintenance'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>6. Manutenção Preditiva</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 text-[10px] font-mono font-bold">
            IA Preditiva
          </span>
        </button>

        <button
          onClick={() => setActiveTab('route_anomalies')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
            activeTab === 'route_anomalies'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>7. Anomalias de Rota</span>
          <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 text-[10px] font-mono font-bold animate-pulse">
            {anomalies.filter(a => a.status === 'active_alert').length} Alertas
          </span>
        </button>
      </div>

      {/* Main Grid: Interactive Map + Inspection Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Vector Canvas Map */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          
          <div className="relative w-full h-[480px] sm:h-[560px] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-[var(--vx-deep)]">
            <RealGeoMap
              initialCenter={[-23.3, -46.8]}
              initialZoom={7}
              minZoom={4}
              maxZoom={12}
              height="100%"
              showLayerToggle={true}
              showControls={true}
              showRoads={true}
              showCityNames={true}
              selectedMarkerId={selectedVehicleId}
            >
              {({ project }) => {
                return (
                  <>
                    {/* Top Tactical Map Overlay Bar */}
                    <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                      <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-auto shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-slate-200 font-mono">
                          Malha Rodoviária Sul-Sudeste
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">| 5 Satélites Starlink/GPS</span>
                      </div>

                      {/* Status Filter buttons */}
                      <div className="flex items-center bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 pointer-events-auto gap-1 text-[10px] shadow-lg">
                        <button
                          type="button"
                          onClick={() => setFilterStatus('all')}
                          className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${filterStatus === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Todos ({vehicles.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterStatus('alert')}
                          className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${filterStatus === 'alert' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Críticos/Alertas
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterStatus('in_transit')}
                          className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${filterStatus === 'in_transit' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Em Trânsito
                        </button>
                      </div>
                    </div>

                    {/* Geofence Hub Zones on Map (Projected from real coordinates) */}
                    {zones.map(zone => {
                      const pos = project(zone.lat || -23.3, zone.lng || -46.8);
                      if (!pos.inBounds) return null;

                      return (
                        <div 
                          key={zone.id}
                          style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
                        >
                          <div className="w-16 h-16 rounded-full border border-cyan-500/50 bg-cyan-500/10 flex items-center justify-center animate-pulse">
                            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400/90 shadow-md shadow-cyan-500/50" />
                          </div>
                          <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-[9px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow-md">
                            {zone.name.split(' - ')[0]}
                          </div>
                        </div>
                      );
                    })}

                    {/* Vehicles on Map (Projected from real coordinates) */}
                    {filteredVehicles.map(veh => {
                      const isSelected = veh.id === selectedVehicleId;
                      const pos = project(veh.lat, veh.lng);
                      if (!pos.inBounds) return null;

                      const isTempAlert = veh.sensors.isTempOutOfRange;
                      const isOverstay = veh.geofenceState?.isOverstay;
                      const isFraud = veh.audit.auditStatus === 'blocked_fraud';

                      let badgeColor = 'bg-cyan-500 text-cyan-300 border-cyan-400';
                      if (isTempAlert) badgeColor = 'bg-rose-500 text-rose-200 border-rose-400 animate-bounce';
                      else if (isOverstay) badgeColor = 'bg-amber-500 text-amber-200 border-amber-400';
                      else if (isFraud) badgeColor = 'bg-red-600 text-red-200 border-red-500';

                      return (
                        <button
                          key={veh.id}
                          type="button"
                          onClick={() => setSelectedVehicleId(veh.id)}
                          style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all duration-200 focus:outline-none ${
                            isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <div className={`p-1.5 rounded-full border-2 ${badgeColor} shadow-xl flex items-center justify-center`}>
                              <Truck className="w-4 h-4 text-white" />
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border mt-0.5 whitespace-nowrap shadow-lg ${
                              isSelected 
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-md ring-1 ring-cyan-400' 
                                : 'bg-slate-950/90 text-slate-200 border-slate-800'
                            }`}>
                              {veh.plate}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {/* Bottom Status Ticker Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 z-30 bg-slate-950/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shadow-2xl">
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span className="text-slate-200 font-bold">{selectedVehicle.plate}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-cyan-400 font-bold">{selectedVehicle.speedKmH} km/h</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{selectedVehicle.driverName}</span>
                      </div>
                      <div className="text-slate-400">
                        ETA {selectedVehicle.destinationName.split('(')[0]}: <strong className="text-emerald-400 font-bold">{selectedVehicle.etaMinutes} min</strong>
                      </div>
                    </div>
                  </>
                );
              }}
            </RealGeoMap>
          </div>

          {/* Quick Vehicle Selector Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  v.id === selectedVehicleId
                    ? 'bg-slate-900 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/80 border-slate-800/80 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200">{v.plate}</span>
                  {v.sensors.isTempOutOfRange && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                  {v.geofenceState?.isOverstay && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{v.cargoDescription}</div>
              </button>
            ))}
          </div>

        </div>

        {/* Right Column: Deep-Dive Feature Inspector Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* TAB 1: Real-time Map & Route Telemetry */}
          {activeTab === 'map_tracker' && (
            <div className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Telemetria de Rota & ETA Dinâmico
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                  {selectedVehicle.plate}
                </span>
              </div>

              {/* Vehicle & Driver Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Veículo & Modelo:</span>
                  <span className="font-bold text-slate-200">{selectedVehicle.vehicleModel}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Motorista:</span>
                  <span className="font-semibold text-slate-200">{selectedVehicle.driverName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Contato:</span>
                  <span className="font-mono text-cyan-400 flex items-center gap-1">
                    <PhoneCall className="w-3 h-3" /> {selectedVehicle.driverPhone}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400">Carga:</span>
                  <span className="font-bold text-white truncate max-w-[220px]">{selectedVehicle.cargoDescription}</span>
                </div>
              </div>

              {/* Route Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progresso da Rota:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedVehicle.progressPct}% concluído</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                    style={{ width: `${selectedVehicle.progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{selectedVehicle.originName}</span>
                  <span>{selectedVehicle.destinationName}</span>
                </div>
              </div>

              {/* Live Distance & ETA metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-mono">Distância Restante</div>
                  <div className="text-base font-black text-white mt-0.5">{selectedVehicle.distanceRemainingKm} km</div>
                  <div className="text-[10px] text-slate-500 font-mono">Total: {selectedVehicle.totalDistanceKm} km</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-cyan-900/40">
                  <div className="text-slate-400 text-[10px] uppercase font-mono">ETA Calculado</div>
                  <div className="text-base font-black text-cyan-300 mt-0.5">{selectedVehicle.etaMinutes} minutos</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Sem retenção viária</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('iot_cold_chain')}
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-cyan-300 border border-slate-700 transition-colors cursor-pointer text-center"
                >
                  Ver Sensores IoT →
                </button>
                <button
                  onClick={() => setActiveTab('geofence_zones')}
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors cursor-pointer text-center shadow-md"
                >
                  Ver Geofencing →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Geofencing Sem Apontamento Manual */}
          {activeTab === 'geofence_zones' && (
            <div className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Cercas Virtuais (Geofencing Sem Apontamento)
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                  Zero Apontamento Manual
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                As cercas virtuais do AOS detectam automaticamente a entrada e saída nos Centros de Distribuição, integrando diretamente com o TMS/WMS sem necessidade de crachá físico ou lançamento manual.
              </p>

              {/* CD Zones List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {zones.map(zone => (
                  <div key={zone.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{zone.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                        {zone.activeTrucksCount} carretas no pátio
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{zone.address}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/50">
                      <span>Carência: {zone.dwellLimitMinutes / 60}h gratuitas</span>
                      <span>Diária extra: R$ {zone.overstayHourlyRateBrl.toFixed(2)}/h</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simulation Action */}
              <button
                disabled={isSimulating}
                onClick={() => handleSimulateGeofenceEntry(selectedVehicle.id, 'zone_cd_louveira')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Processando Geofence...' : `Simular Entrada Automática de ${selectedVehicle.plate} no CD Louveira`}</span>
              </button>
            </div>
          )}

          {/* TAB 3: Diárias de Espera (Overstay Billing) */}
          {activeTab === 'overstay_billing' && (
            <div className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Cobrança Autônoma de Diárias de Espera (Overstay)
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800 font-bold">
                  Lei 13.103/15
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Veículo Auditado:</span>
                  <span className="font-mono font-bold text-amber-300">SP-9821 • Claudemir Rocha</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Local da Doca:</span>
                  <span className="text-slate-200">Mega CD Frio Louveira (Doca 08)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Tempo de Permanência:</span>
                  <span className="font-mono font-black text-white text-sm">4h 05min</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-amber-800/40 pt-1.5">
                  <span>Carência Contratual: 2h 00min</span>
                  <span className="text-amber-400 font-bold">Excedente: 2h 05min</span>
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Taxa Horária de Estadia:</span>
                  <span>R$ 240,00 / hora</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Horas Faturadas (2.08h):</span>
                  <span>R$ 500,00</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold text-sm pt-1 border-t border-slate-800">
                  <span>Total Faturado no ERP:</span>
                  <span>R$ 500,00</span>
                </div>
              </div>

              {/* Tool Calling Payload Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Payload Webhook Autônomo (SAP S/4HANA TMS):</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify({
                      action: 'issue_dwell_overstay_invoice',
                      target: 'sap_s4hana_tms_api',
                      plate: 'SP-9821',
                      chargedBrl: 500.00
                    }, null, 2), 'overstay')}
                    className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {copiedPayload === 'overstay' ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                    <span>{copiedPayload === 'overstay' ? 'Copiado' : 'Copiar Payload'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[10px] text-amber-300 border border-slate-800 overflow-x-auto">
{`{
  "service": "sap_s4hana_tms_api",
  "action": "issue_dwell_overstay_invoice",
  "parameters": {
    "plate": "SP-9821",
    "dwellMinutes": 245,
    "billedHours": 2.08,
    "ratePerHour": 240.00,
    "totalChargedBrl": 500.00,
    "status": "POSTED_AUTOMATICALLY_IN_AR_LEDGER"
  }
}`}
                </pre>
              </div>

              <button
                disabled={isSimulating}
                onClick={() => handleTriggerOverstayInvoice('veh_02')}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Emitindo Fatura...' : 'Forçar Reconciliação de Diária no TMS'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: IoT Cadeia Fria (Temperatura & Umidade) */}
          {activeTab === 'iot_cold_chain' && (
            <div className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <ThermometerSnowflake className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Telemetria IoT de Carga Crítica (Cadeia Fria)
                  </h3>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                  selectedVehicle.sensors.isTempOutOfRange 
                    ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}>
                  {selectedVehicle.sensors.isTempOutOfRange ? 'Excursão Térmica' : 'Nominal'}
                </span>
              </div>

              {/* Live Sensor Gauge Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`p-3.5 rounded-xl border ${
                  selectedVehicle.sensors.isTempOutOfRange 
                    ? 'bg-rose-950/30 border-rose-500/50' 
                    : 'bg-slate-900/80 border-slate-800'
                }`}>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Temperatura Atual</div>
                  <div className={`text-xl font-black mt-0.5 ${
                    selectedVehicle.sensors.isTempOutOfRange ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {selectedVehicle.sensors.temperature}°C
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Faixa: {selectedVehicle.sensors.targetMinTemp}°C a {selectedVehicle.sensors.targetMaxTemp}°C
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Umidade Relativa</div>
                  <div className="text-xl font-black text-cyan-300 mt-0.5">
                    {selectedVehicle.sensors.humidityPct}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Compressor: <strong className={selectedVehicle.sensors.compressorStatus === 'fault' ? 'text-rose-400' : 'text-emerald-400'}>
                      {selectedVehicle.sensors.compressorStatus.toUpperCase()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Temperature History Chart / Sparkline */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Curva Térmica Recente:</span>
                  <span className="text-[10px] font-mono text-slate-500">{selectedVehicle.sensors.lastPingTime}</span>
                </div>
                <div className="flex items-end gap-2 h-20 pt-2 px-2 bg-slate-950 rounded-lg border border-slate-800/80">
                  {selectedVehicle.tempHistory.map((item, idx) => {
                    const isExceeded = item.temp > selectedVehicle.sensors.targetMaxTemp;
                    const heightPct = Math.min(100, Math.max(15, (Math.abs(item.temp) / 25) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                        <div 
                          className={`w-full rounded-t transition-all ${
                            isExceeded ? 'bg-rose-500 animate-pulse' : 'bg-cyan-500'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[8px] font-mono text-slate-500">{item.time}</span>
                        <div className="absolute -top-6 bg-slate-950 border border-slate-800 px-1 py-0.5 rounded text-[8px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.temp}°C
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              {selectedVehicle.sensors.isTempOutOfRange ? (
                <button
                  disabled={isSimulating}
                  onClick={() => handleRestoreTemperature(selectedVehicle.id)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Normalizando...' : 'Acionar Redundância & Normalizar Temperatura (-18.2°C)'}</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Cadeia fria estabilizada. Nenhuma ação de contingência necessária.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Auditoria Antifraude (GPS x Pedágio x Abastecimento) */}
          {activeTab === 'fraud_audit' && (
            <div className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Auditoria Antifraude: GPS x Pedágio x NF-e
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-800 font-bold">
                  Fraude Bloqueada
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                O AOS cruza os pontos de rastreamento do GPS com as passagens nas cancelas de pedágio (Sem Parar / ConectCar) e as notas fiscais de abastecimento para identificar desvios e fraudes em reembolsos.
              </p>

              {/* Audit Card Details for Vehicle 03 */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-red-500/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Veículo Auditado:</span>
                  <span className="font-mono font-bold text-slate-200">PR-4412 • Rogério Mendes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cancelas de Pedágio (Sem Parar):</span>
                  <span className="text-rose-400 font-semibold">✗ Não detectado no km 310</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nota Fiscal de Combustível:</span>
                  <span className="text-slate-200">Auto Posto Vale Verde (R$ 1.150,00)</span>
                </div>
                <div className="flex items-center justify-between text-rose-400 font-bold border-t border-slate-800 pt-1.5">
                  <span>Divergência Geográfica GPS:</span>
                  <span>48.2 km fora da rota</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/60 text-xs space-y-1">
                <div className="font-bold text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Ação Autônoma do Guardião AOS:</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Reembolso de <strong>R$ 1.150,00</strong> bloqueado no módulo de contas a pagar. O motorista foi notificado para justificar o desvio de trajeto.
                </p>
              </div>

              {/* Audited stats */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Economia Prevenida</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">R$ 1.150,00</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Status do Lançamento</div>
                  <div className="text-rose-400 font-bold text-sm mt-0.5">CONGELADO</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Agente de Manutenção Preditiva */}
          {activeTab === 'predictive_maintenance' && (() => {
            const maint = maintenanceRecords[selectedVehicle.id] || {
              vehicleId: selectedVehicle.id,
              currentOdometerKm: 180000,
              engineHoursTotal: 4000,
              brakePadWearPct: 50,
              oilLifeRemainingPct: 50,
              tireTreadWearPct: 50,
              transmissionTempAvgC: 90,
              overallRiskLevel: 'MEDIUM' as const,
              estimatedDaysToService: 20,
              recommendedServiceType: 'Revisão Preventiva Padrão',
              estimatedCostBrl: 2500,
              lastServiceDate: '2026-06-01',
              nextScheduledKm: 190000,
              anomalousVibrationDetected: false,
              aiDiagnosticSummary: 'Telemetria nominal coletada via CAN-bus e sensores IoT de bordo.'
            };

            let riskBadgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
            if (maint.overallRiskLevel === 'MEDIUM') riskBadgeColor = 'bg-amber-950/80 text-amber-300 border-amber-700';
            if (maint.overallRiskLevel === 'HIGH') riskBadgeColor = 'bg-orange-950/80 text-orange-300 border-orange-700';
            if (maint.overallRiskLevel === 'CRITICAL') riskBadgeColor = 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse';

            return (
              <div className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-100">
                      Agente de Manutenção Preditiva (CAN-Bus IoT)
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${riskBadgeColor}`}>
                    Risco: {maint.overallRiskLevel}
                  </span>
                </div>

                {/* Main Prognosis Banner */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">Próxima Revisão Recomendada:</span>
                    <span className="text-base font-black text-amber-300 font-mono flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Em {maint.estimatedDaysToService} dias (~{(maint.nextScheduledKm - maint.currentOdometerKm).toLocaleString('pt-BR')} km)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium pt-1">
                    {maint.recommendedServiceType}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <span>Estimativa de Custo Preventivo:</span>
                    <strong className="text-emerald-400 font-mono">
                      {maint.estimatedCostBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </strong>
                  </div>
                </div>

                {/* Subsystem Telemetry Bars */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                    Desgaste de Componentes em Tempo Real
                  </span>

                  {/* Pastilhas de Freio */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Desgaste das Pastilhas de Freio:</span>
                      <span className={`font-mono font-bold ${maint.brakePadWearPct > 75 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {maint.brakePadWearPct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${maint.brakePadWearPct > 75 ? 'bg-rose-500' : maint.brakePadWearPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${maint.brakePadWearPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Vida Útil do Óleo */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Vida Útil Restante do Óleo Motor:</span>
                      <span className={`font-mono font-bold ${maint.oilLifeRemainingPct < 25 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {maint.oilLifeRemainingPct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${maint.oilLifeRemainingPct < 25 ? 'bg-rose-500' : maint.oilLifeRemainingPct < 50 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                        style={{ width: `${maint.oilLifeRemainingPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Desgaste de Pneus */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Desgaste Banda de Rodagem Pneus:</span>
                      <span className={`font-mono font-bold ${maint.tireTreadWearPct > 70 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {maint.tireTreadWearPct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${maint.tireTreadWearPct > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${maint.tireTreadWearPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Prognostic Note */}
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Diagnóstico da IA de Manutenção:</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {maint.aiDiagnosticSummary}
                  </p>
                </div>

                {/* Action Trigger */}
                <button
                  type="button"
                  disabled={isSimulating || maint.overallRiskLevel === 'LOW'}
                  onClick={() => handleScheduleMaintenance(selectedVehicle.id)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {maint.overallRiskLevel === 'LOW' 
                      ? '✓ Revisão Preventiva em Dia' 
                      : isSimulating ? 'Emitindo OS...' : 'Agendar Manutenção Preventiva no SAP PM'}
                  </span>
                </button>
              </div>
            );
          })()}

          {/* TAB 7: Agente de Detecção de Anomalias de Rota */}
          {activeTab === 'route_anomalies' && (
            <div className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Detecção de Anomalias de Rota & Desvios
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800 font-bold">
                  {anomalies.length} Casos Rastreados
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                O motor comparador geoespacial analisa telemetria segundo a segundo contra os corredores autorizados (SLA, rodovias pedagiadas e pontos de parada homologados), disparando alertas instantâneos para contenção de risco de carga.
              </p>

              {/* Anomalies List */}
              <div className="space-y-3">
                {anomalies.map(anom => (
                  <div 
                    key={anom.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      anom.status === 'active_alert'
                        ? 'bg-rose-950/20 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
                        : anom.status === 'dispatched_security'
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                        <span className="text-rose-400">[{anom.plate}]</span>
                        <span>{anom.type.replace(/_/g, ' ').toUpperCase()}</span>
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                        anom.status === 'active_alert' ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse' :
                        anom.status === 'dispatched_security' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {anom.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium mt-1.5">
                      {anom.anomalyDescription}
                    </p>

                    <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                      <div>📍 Local: {anom.locationName}</div>
                      <div>🛣️ Rota Prevista: {anom.expectedRoute}</div>
                      {anom.actualDeviationDistanceKm && (
                        <div className="text-rose-400 font-bold">⚠️ Desvio acumulado: {anom.actualDeviationDistanceKm} km</div>
                      )}
                    </div>

                    {/* Action buttons per anomaly */}
                    {anom.status === 'active_alert' && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleUpdateAnomalyStatus(anom.id, 'dispatched_security')}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Acionar Escolta Virtual</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateAnomalyStatus(anom.id, 'acknowledged')}
                          className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Reconhecer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Telemetry Event Stream Logs */}
          <div className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Eventos de Telemetria ao Vivo
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {logs.length} Registros
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {logs.map(log => {
                let badgeStyle = 'text-cyan-400 bg-cyan-950/80 border-cyan-800';
                if (log.severity === 'critical') badgeStyle = 'text-rose-400 bg-rose-950/80 border-rose-800';
                if (log.severity === 'warning') badgeStyle = 'text-amber-400 bg-amber-950/80 border-amber-800';
                if (log.severity === 'success') badgeStyle = 'text-emerald-400 bg-emerald-950/80 border-emerald-800';

                return (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-200 flex items-center gap-1">
                        <span className="font-mono text-slate-400">{log.timestamp}</span>
                        <span>•</span>
                        <span className="text-cyan-300 font-mono">{log.plate}</span>
                      </span>
                      <span className={`px-1.5 py-0.2 rounded border font-mono font-bold ${badgeStyle}`}>
                        {log.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200">{log.title}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{log.details}</div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
