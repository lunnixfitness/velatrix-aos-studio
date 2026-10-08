export type VehicleStatus = 
  | 'in_transit' 
  | 'at_geofence' 
  | 'overstay_alert' 
  | 'temp_alert' 
  | 'delayed' 
  | 'nominal';

export type CargoCategory = 
  | 'pharma_cold_chain' 
  | 'frozen_food' 
  | 'chemicals_hazardous' 
  | 'high_value_electronics' 
  | 'industrial_parts';

export interface IotSensorData {
  temperature: number; // e.g. -18.2 °C
  targetMinTemp: number; // e.g. -22.0 °C
  targetMaxTemp: number; // e.g. -15.0 °C
  humidityPct: number; // e.g. 58%
  batteryPct: number; // e.g. 94%
  vibrationG: number; // e.g. 0.12 G
  doorStatus: 'locked' | 'unlocked' | 'breached';
  compressorStatus: 'active' | 'standby' | 'fault';
  lastPingTime: string;
  isTempOutOfRange: boolean;
}

export interface GeofenceDwellState {
  zoneId: string;
  zoneName: string;
  enteredAt: string;
  dwellMinutes: number;
  gracePeriodMinutes: number;
  hourlyRateBrl: number;
  isOverstay: boolean;
  overstayAmountBrl: number;
  dockNumber?: string;
  autoBillingTriggered: boolean;
}

export interface CrossAuditDiscrepancy {
  tollTagMatched: boolean; // Tag Sem Parar / ConectCar
  tollStationName?: string;
  tollExpectedTime?: string;
  tollActualTime?: string;
  tollCostBrl?: number;

  fuelReceiptMatched: boolean; // NF-e Abastecimento vs GPS location
  fuelReceiptLocation?: string;
  fuelGpsDistanceKm?: number;
  fuelClaimedAmountBrl?: number;
  fuelApprovedAmountBrl?: number;

  auditStatus: 'verified_clean' | 'flagged_discrepancy' | 'blocked_fraud';
  auditReason?: string;
  savedOrBlockedBrl?: number;
}

export interface FleetVehicle {
  id: string;
  plate: string;
  driverName: string;
  driverPhone: string;
  vehicleModel: string;
  status: VehicleStatus;
  cargoDescription: string;
  cargoCategory: CargoCategory;
  cargoWeightKg: number;
  cargoValueBrl: number;
  
  // Real-time coordinates and map percentage
  lat: number;
  lng: number;
  mapX: number; // 0 - 100 for SVG canvas
  mapY: number; // 0 - 100 for SVG canvas
  speedKmH: number;
  headingDeg: number;
  
  originName: string;
  destinationName: string;
  etaMinutes: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  progressPct: number;
  
  // IoT Sensor Telemetry
  sensors: IotSensorData;
  tempHistory: { time: string; temp: number }[];
  
  // Geofence & Overstay
  geofenceState?: GeofenceDwellState;
  
  // Route Breadcrumbs
  routePath: { x: number; y: number; label?: string }[];
  
  // Anti-fraud Cross Audit
  audit: CrossAuditDiscrepancy;
}

export interface GeofenceZone {
  id: string;
  name: string;
  code: string;
  type: 'distribution_center' | 'port_terminal' | 'client_hub' | 'customs_bonded';
  lat?: number;
  lng?: number;
  mapX: number;
  mapY: number;
  radiusPx: number;
  cityState: string;
  activeTrucksCount: number;
  dwellLimitMinutes: number;
  overstayHourlyRateBrl: number;
  address: string;
}

export interface TelemetryEventLog {
  id: string;
  timestamp: string;
  vehicleId: string;
  plate: string;
  type: 
    | 'geofence_entry' 
    | 'geofence_exit' 
    | 'overstay_fee_billed' 
    | 'temp_alert_triggered' 
    | 'temp_restored' 
    | 'fraud_reimbursement_blocked' 
    | 'eta_recalculated'
    | 'route_anomaly_detected'
    | 'predictive_maintenance_alert';
  title: string;
  details: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  automatedPayload?: {
    action: string;
    targetService: string;
    payloadJson: string;
  };
}

export type MaintenanceRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PredictiveMaintenanceMetric {
  vehicleId: string;
  currentOdometerKm: number;
  engineHoursTotal: number;
  brakePadWearPct: number;
  oilLifeRemainingPct: number;
  tireTreadWearPct: number;
  transmissionTempAvgC: number;
  overallRiskLevel: MaintenanceRiskLevel;
  estimatedDaysToService: number;
  recommendedServiceType: string;
  estimatedCostBrl: number;
  lastServiceDate: string;
  nextScheduledKm: number;
  anomalousVibrationDetected: boolean;
  aiDiagnosticSummary: string;
}

export type RouteAnomalyType = 
  | 'unauthorized_stop' 
  | 'off_route_deviation' 
  | 'excessive_idle_time' 
  | 'speed_anomaly' 
  | 'corridor_breach';

export interface RouteAnomalyEvent {
  id: string;
  vehicleId: string;
  plate: string;
  type: RouteAnomalyType;
  severity: 'warning' | 'critical';
  detectedAt: string;
  locationName: string;
  lat: number;
  lng: number;
  durationMinutes?: number;
  expectedRoute: string;
  actualDeviationDistanceKm?: number;
  deviationKm?: number;
  anomalyDescription: string;
  recommendedAction: string;
  status: 'active_alert' | 'acknowledged' | 'dispatched_security' | 'resolved';
}
