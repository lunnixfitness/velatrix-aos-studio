/**
 * @deprecated - DEPRECATED: VELATRIX AOS Data Foundation Migration.
 * Modelos e seeds para telemetria IoT e frotas.
 */
import { FleetVehicle, GeofenceZone, TelemetryEventLog } from '../types/telemetry';

export const MOCK_GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: 'zone_cd_cajamar',
    name: 'Hub Central - CD Cajamar',
    code: 'CD-SP-01',
    type: 'distribution_center',
    lat: -23.3556,
    lng: -46.8789,
    mapX: 42,
    mapY: 48,
    radiusPx: 45,
    cityState: 'Cajamar, SP',
    activeTrucksCount: 6,
    dwellLimitMinutes: 180, // 3h grace period
    overstayHourlyRateBrl: 180.00,
    address: 'Rodovia Anhanguera, km 38 - Cajamar / SP'
  },
  {
    id: 'zone_cd_louveira',
    name: 'Mega CD Frio - Louveira',
    code: 'CD-SP-02',
    type: 'distribution_center',
    lat: -23.0864,
    lng: -46.9531,
    mapX: 46,
    mapY: 38,
    radiusPx: 40,
    cityState: 'Louveira, SP',
    activeTrucksCount: 4,
    dwellLimitMinutes: 120, // 2h grace period for cold storage
    overstayHourlyRateBrl: 240.00,
    address: 'Estrada Municipal Louveira-Itatiba, km 4'
  },
  {
    id: 'zone_porto_santos',
    name: 'Terminal Portuário Santos (BTP)',
    code: 'PORT-SSZ',
    type: 'port_terminal',
    lat: -23.9608,
    lng: -46.3336,
    mapX: 58,
    mapY: 62,
    radiusPx: 48,
    cityState: 'Santos, SP',
    activeTrucksCount: 9,
    dwellLimitMinutes: 240, // 4h grace period
    overstayHourlyRateBrl: 320.00,
    address: 'Margem Direita do Porto de Santos - Alemoa'
  },
  {
    id: 'zone_cd_betim',
    name: 'Polo Industrial Betim',
    code: 'CD-MG-01',
    type: 'client_hub',
    lat: -19.9678,
    lng: -44.1986,
    mapX: 68,
    mapY: 28,
    radiusPx: 38,
    cityState: 'Betim, MG',
    activeTrucksCount: 3,
    dwellLimitMinutes: 180,
    overstayHourlyRateBrl: 190.00,
    address: 'Via Expressa de Contagem, km 12 - Betim / MG'
  },
  {
    id: 'zone_cd_curitiba',
    name: 'CD Sul - São José dos Pinhais',
    code: 'CD-PR-01',
    type: 'distribution_center',
    lat: -25.5347,
    lng: -49.1931,
    mapX: 30,
    mapY: 78,
    radiusPx: 42,
    cityState: 'Curitiba / SJP, PR',
    activeTrucksCount: 5,
    dwellLimitMinutes: 180,
    overstayHourlyRateBrl: 175.00,
    address: 'BR-376, km 15 - Contorno Leste de Curitiba'
  }
];

export const INITIAL_FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: 'veh_01',
    plate: 'BRA-2E19',
    driverName: 'Marcos Vinícius Silveira',
    driverPhone: '+55 11 98451-2290',
    vehicleModel: 'Volvo FH 540 6x4 (Bitrem Frigorífico)',
    status: 'temp_alert',
    cargoDescription: 'Vacinas & Imunobiológicos (Cadeia Fria Estrita)',
    cargoCategory: 'pharma_cold_chain',
    cargoWeightKg: 14200,
    cargoValueBrl: 1850000,
    lat: -23.3521,
    lng: -46.8791,
    mapX: 44,
    mapY: 42,
    speedKmH: 76,
    headingDeg: 145,
    originName: 'Laboratório Campinas SP',
    destinationName: 'CD Cajamar SP (Doca 14)',
    etaMinutes: 28,
    distanceRemainingKm: 34,
    totalDistanceKm: 120,
    progressPct: 72,
    sensors: {
      temperature: -11.4, // Alert! target is -22 to -15
      targetMinTemp: -22.0,
      targetMaxTemp: -15.0,
      humidityPct: 68,
      batteryPct: 91,
      vibrationG: 0.18,
      doorStatus: 'locked',
      compressorStatus: 'fault',
      lastPingTime: 'Há 12s via Starlink IoT Telemetry',
      isTempOutOfRange: true
    },
    tempHistory: [
      { time: '14:00', temp: -18.5 },
      { time: '14:15', temp: -18.2 },
      { time: '14:30', temp: -17.4 },
      { time: '14:45', temp: -15.2 },
      { time: '15:00', temp: -13.1 },
      { time: '15:10', temp: -11.4 }
    ],
    routePath: [
      { x: 38, y: 32, label: 'Origem: Campinas' },
      { x: 41, y: 37, label: 'Pedágio Valinhos' },
      { x: 44, y: 42, label: 'Posição Atual (Anhanguera km 48)' },
      { x: 42, y: 48, label: 'Destino: CD Cajamar' }
    ],
    audit: {
      tollTagMatched: true,
      tollStationName: 'Pedágio Anhanguera km 52 (Sem Parar)',
      tollExpectedTime: '14:48',
      tollActualTime: '14:49',
      tollCostBrl: 38.40,
      fuelReceiptMatched: true,
      fuelReceiptLocation: 'Posto Graal 56',
      fuelGpsDistanceKm: 0.05,
      fuelClaimedAmountBrl: 890.00,
      fuelApprovedAmountBrl: 890.00,
      auditStatus: 'verified_clean'
    }
  },
  {
    id: 'veh_02',
    plate: 'SP-9821',
    driverName: 'Claudemir de Oliveira Rocha',
    driverPhone: '+55 19 99120-4411',
    vehicleModel: 'Scania R450 6x2 (Carreta Sider)',
    status: 'overstay_alert',
    cargoDescription: 'Chapa de Aço & Bobinas Automotivas',
    cargoCategory: 'industrial_parts',
    cargoWeightKg: 28500,
    cargoValueBrl: 420000,
    lat: -23.1904,
    lng: -46.9511,
    mapX: 46,
    mapY: 38,
    speedKmH: 0,
    headingDeg: 0,
    originName: 'Usiminas Cubatão SP',
    destinationName: 'Mega CD Frio - Louveira (Doca 08)',
    etaMinutes: 0,
    distanceRemainingKm: 0,
    totalDistanceKm: 180,
    progressPct: 100,
    sensors: {
      temperature: 24.2,
      targetMinTemp: 10.0,
      targetMaxTemp: 40.0,
      humidityPct: 45,
      batteryPct: 88,
      vibrationG: 0.01,
      doorStatus: 'locked',
      compressorStatus: 'standby',
      lastPingTime: 'Há 5s via GSM 4G Gateway',
      isTempOutOfRange: false
    },
    tempHistory: [
      { time: '12:00', temp: 23.8 },
      { time: '13:00', temp: 24.0 },
      { time: '14:00', temp: 24.1 },
      { time: '15:00', temp: 24.2 }
    ],
    geofenceState: {
      zoneId: 'zone_cd_louveira',
      zoneName: 'Mega CD Frio - Louveira',
      enteredAt: '11:15',
      dwellMinutes: 245, // 4h 5min (Grace period is 2h / 120min)
      gracePeriodMinutes: 120,
      hourlyRateBrl: 240.00,
      isOverstay: true,
      overstayAmountBrl: 500.00, // 2h 5min overstay billed
      dockNumber: 'Doca 08 (Aguardando Descarregamento)',
      autoBillingTriggered: true
    },
    routePath: [
      { x: 58, y: 62, label: 'Origem: Santos' },
      { x: 50, y: 52, label: 'Rodoanel Mário Covas' },
      { x: 46, y: 38, label: 'No CD Louveira (Parado na Doca 08)' }
    ],
    audit: {
      tollTagMatched: true,
      tollStationName: 'Pedágio Rodoanel Sul km 24 (ConectCar)',
      tollExpectedTime: '09:40',
      tollActualTime: '09:41',
      tollCostBrl: 22.80,
      fuelReceiptMatched: true,
      auditStatus: 'verified_clean'
    }
  },
  {
    id: 'veh_03',
    plate: 'PR-4412',
    driverName: 'Rogério Batista Mendes',
    driverPhone: '+55 41 97782-9012',
    vehicleModel: 'Mercedes-Benz Actros 2651',
    status: 'delayed',
    cargoDescription: 'Placas de Circuito & Chips Eletrônicos',
    cargoCategory: 'high_value_electronics',
    cargoWeightKg: 8500,
    cargoValueBrl: 3400000,
    lat: -24.8122,
    lng: -49.1284,
    mapX: 35,
    mapY: 66,
    speedKmH: 62,
    headingDeg: 210,
    originName: 'CD Cajamar SP',
    destinationName: 'CD Curitiba PR',
    etaMinutes: 110,
    distanceRemainingKm: 142,
    totalDistanceKm: 420,
    progressPct: 66,
    sensors: {
      temperature: 21.0,
      targetMinTemp: 15.0,
      targetMaxTemp: 30.0,
      humidityPct: 52,
      batteryPct: 96,
      vibrationG: 0.14,
      doorStatus: 'locked',
      compressorStatus: 'standby',
      lastPingTime: 'Há 18s via Iridium Satellite',
      isTempOutOfRange: false
    },
    tempHistory: [
      { time: '13:00', temp: 20.5 },
      { time: '14:00', temp: 21.0 },
      { time: '15:00', temp: 21.0 }
    ],
    routePath: [
      { x: 42, y: 48, label: 'Origem: CD Cajamar' },
      { x: 38, y: 58, label: 'BR-116 Registro' },
      { x: 35, y: 66, label: 'Posição Atual (Serra do Cafezal)' },
      { x: 30, y: 78, label: 'Destino: CD Curitiba' }
    ],
    audit: {
      tollTagMatched: false, // Discrepancy! Missed expected toll booth
      tollStationName: 'Pedágio BR-116 km 310',
      tollExpectedTime: '13:30',
      tollActualTime: 'Desvio Detectado (Rota Alternativa não autorizada)',
      fuelReceiptMatched: false, // Flagged receipt!
      fuelReceiptLocation: 'Auto Posto Vale Verde (48 km fora da rota)',
      fuelGpsDistanceKm: 48.2,
      fuelClaimedAmountBrl: 1150.00,
      fuelApprovedAmountBrl: 0.00,
      auditStatus: 'blocked_fraud',
      auditReason: 'NF-e de abastecimento emitida a 48.2 km de distância do rastreador GPS no mesmo timestamp.',
      savedOrBlockedBrl: 1150.00
    }
  },
  {
    id: 'veh_04',
    plate: 'MG-7730',
    driverName: 'Henrique Alves Fonseca',
    driverPhone: '+55 31 99801-7722',
    vehicleModel: 'DAF XF 530 FTS',
    status: 'in_transit',
    cargoDescription: 'Cortes Especiais de Carne Bovina Congelada (-18°C)',
    cargoCategory: 'frozen_food',
    cargoWeightKg: 22000,
    cargoValueBrl: 680000,
    lat: -21.4201,
    lng: -44.8912,
    mapX: 62,
    mapY: 34,
    speedKmH: 82,
    headingDeg: 45,
    originName: 'Frigorífico Barretos SP',
    destinationName: 'Polo Industrial Betim MG',
    etaMinutes: 75,
    distanceRemainingKm: 98,
    totalDistanceKm: 380,
    progressPct: 74,
    sensors: {
      temperature: -19.6, // Nominal cold chain
      targetMinTemp: -24.0,
      targetMaxTemp: -18.0,
      humidityPct: 62,
      batteryPct: 98,
      vibrationG: 0.11,
      doorStatus: 'locked',
      compressorStatus: 'active',
      lastPingTime: 'Há 8s via Dual SIM 5G',
      isTempOutOfRange: false
    },
    tempHistory: [
      { time: '13:00', temp: -19.2 },
      { time: '13:45', temp: -19.4 },
      { time: '14:30', temp: -19.5 },
      { time: '15:10', temp: -19.6 }
    ],
    routePath: [
      { x: 40, y: 30, label: 'Origem: Barretos' },
      { x: 52, y: 32, label: 'Fernão Dias km 720' },
      { x: 62, y: 34, label: 'Posição Atual (BR-381 Oliveira)' },
      { x: 68, y: 28, label: 'Destino: Betim' }
    ],
    audit: {
      tollTagMatched: true,
      tollStationName: 'Pedágio Fernão Dias km 680 (Sem Parar)',
      tollExpectedTime: '14:10',
      tollActualTime: '14:11',
      tollCostBrl: 32.00,
      fuelReceiptMatched: true,
      fuelReceiptLocation: 'Posto Oliveira BR-381',
      fuelGpsDistanceKm: 0.1,
      fuelClaimedAmountBrl: 1200.00,
      fuelApprovedAmountBrl: 1200.00,
      auditStatus: 'verified_clean'
    }
  },
  {
    id: 'veh_05',
    plate: 'RJ-5510',
    driverName: 'Leandro de Souza Moreira',
    driverPhone: '+55 21 98834-1199',
    vehicleModel: 'MAN TGX 28.440 6x2',
    status: 'at_geofence',
    cargoDescription: 'Produtos Químicos & Resinas Industriais',
    cargoCategory: 'chemicals_hazardous',
    cargoWeightKg: 19800,
    cargoValueBrl: 510000,
    lat: -23.9511,
    lng: -46.3211,
    mapX: 58,
    mapY: 62,
    speedKmH: 0,
    headingDeg: 180,
    originName: 'Polo Petroquímico Duque de Caxias RJ',
    destinationName: 'Terminal Portuário Santos (BTP)',
    etaMinutes: 0,
    distanceRemainingKm: 0,
    totalDistanceKm: 490,
    progressPct: 100,
    sensors: {
      temperature: 26.5,
      targetMinTemp: 15.0,
      targetMaxTemp: 35.0,
      humidityPct: 50,
      batteryPct: 89,
      vibrationG: 0.02,
      doorStatus: 'locked',
      compressorStatus: 'standby',
      lastPingTime: 'Há 15s via Gateway Portuário',
      isTempOutOfRange: false
    },
    tempHistory: [
      { time: '13:00', temp: 26.0 },
      { time: '14:00', temp: 26.3 },
      { time: '15:00', temp: 26.5 }
    ],
    geofenceState: {
      zoneId: 'zone_porto_santos',
      zoneName: 'Terminal Portuário Santos (BTP)',
      enteredAt: '14:20',
      dwellMinutes: 52,
      gracePeriodMinutes: 240,
      hourlyRateBrl: 320.00,
      isOverstay: false,
      overstayAmountBrl: 0,
      dockNumber: 'Gate 04 (Check-in Automático Geofence Concluído)',
      autoBillingTriggered: false
    },
    routePath: [
      { x: 74, y: 44, label: 'Origem: Rio de Janeiro' },
      { x: 64, y: 54, label: 'Via Dutra / Tamoios' },
      { x: 58, y: 62, label: 'No Porto de Santos (Descarregando)' }
    ],
    audit: {
      tollTagMatched: true,
      tollStationName: 'Pedágio Imigrantes km 42 (Sem Parar)',
      tollExpectedTime: '13:50',
      tollActualTime: '13:50',
      tollCostBrl: 44.50,
      fuelReceiptMatched: true,
      auditStatus: 'verified_clean'
    }
  }
];

export const INITIAL_TELEMETRY_LOGS: TelemetryEventLog[] = [
  {
    id: 'log_01',
    timestamp: '15:10:14',
    vehicleId: 'veh_01',
    plate: 'BRA-2E19',
    type: 'temp_alert_triggered',
    title: 'Excursão Térmica Detectada (-11.4°C)',
    details: 'Sensor IoT da câmara frigorífica registrou temperatura acima do limite máximo (-15.0°C). Compressor em estado FAULT. Alerta disparado ao motorista Marcos e à torre de controle.',
    severity: 'critical',
    automatedPayload: {
      action: 'emergency_temp_escalation',
      targetService: 'telemetry_broker_fastapi',
      payloadJson: JSON.stringify({
        event: 'TEMP_BREACH_ALERT',
        plate: 'BRA-2E19',
        driver: 'Marcos Vinícius Silveira',
        currentTemp: -11.4,
        maxThreshold: -15.0,
        cargo: 'Vacinas & Imunobiológicos',
        actionsDispatched: ['SMS_DRIVER', 'TELEGRAM_DISPATCHER', 'FAST_TRACK_DOCK_RESERVATION']
      }, null, 2)
    }
  },
  {
    id: 'log_02',
    timestamp: '15:05:00',
    vehicleId: 'veh_02',
    plate: 'SP-9821',
    type: 'overstay_fee_billed',
    title: 'Cobrança Autônoma de Overstay (R$ 500,00)',
    details: 'Tempo de permanência no Mega CD Frio Louveira atingiu 4h 05min (carência contratual: 2h). Emissão autônoma de fatura de estadia no ERP/TMS sem intervenção manual.',
    severity: 'warning',
    automatedPayload: {
      action: 'issue_dwell_overstay_invoice',
      targetService: 'sap_s4hana_tms_api',
      payloadJson: JSON.stringify({
        invoiceType: 'OVERSTAY_DWELL_FEE',
        plate: 'SP-9821',
        geofenceZone: 'CD-SP-02',
        dwellTotalMinutes: 245,
        graceMinutes: 120,
        billedHours: 2.08,
        hourlyRateBrl: 240.00,
        totalChargedBrl: 500.00,
        status: 'POSTED_AUTOMATICALLY_IN_AR_LEDGER'
      }, null, 2)
    }
  },
  {
    id: 'log_03',
    timestamp: '14:52:18',
    vehicleId: 'veh_03',
    plate: 'PR-4412',
    type: 'fraud_reimbursement_blocked',
    title: 'Bloqueio de Reembolso Divergente (R$ 1.150,00)',
    details: 'Auditoria cruzou coordenadas GPS e nota fiscal de combustível: o caminhão estava a 48.2 km de distância do posto informado no cupom. Reembolso congelado preventivamente.',
    severity: 'critical',
    automatedPayload: {
      action: 'block_fraudulent_reimbursement',
      targetService: 'oracle_erp_expense_vault',
      payloadJson: JSON.stringify({
        auditCheck: 'CROSS_GPS_NFE_VERIFICATION',
        plate: 'PR-4412',
        driver: 'Rogério Batista Mendes',
        receiptStore: 'Auto Posto Vale Verde',
        gpsDiscrepancyKm: 48.2,
        claimedAmountBrl: 1150.00,
        actionTaken: 'REIMBURSEMENT_BLOCKED_PENDING_EXPLANATION'
      }, null, 2)
    }
  },
  {
    id: 'log_04',
    timestamp: '14:20:00',
    vehicleId: 'veh_05',
    plate: 'RJ-5510',
    type: 'geofence_entry',
    title: 'Check-in Geofencing Concluído (Porto de Santos)',
    details: 'Veículo cruzou perímetro da cerca virtual do Terminal BTP. Apontamento de entrada gerado automaticamente no TMS com vinculação do Gate 04.',
    severity: 'success'
  }
];

export const MOCK_PREDICTIVE_MAINTENANCE: Record<string, import('../types/telemetry').PredictiveMaintenanceMetric> = {
  veh_01: {
    vehicleId: 'veh_01',
    currentOdometerKm: 184520,
    engineHoursTotal: 4210,
    brakePadWearPct: 78,
    oilLifeRemainingPct: 22,
    tireTreadWearPct: 64,
    transmissionTempAvgC: 98.4,
    overallRiskLevel: 'HIGH',
    estimatedDaysToService: 6,
    recommendedServiceType: 'Troca de Óleo Sintético 10W40 + Pastilhas de Freio Eixo Traseiro',
    estimatedCostBrl: 4250.00,
    lastServiceDate: '2026-06-12',
    nextScheduledKm: 188000,
    anomalousVibrationDetected: true,
    aiDiagnosticSummary: 'Sensores IoT registraram pico de vibração 0.18G no compressor e degradação acelerada do fluido térmico. Recomendado recolhimento em até 6 dias para evitar parada em trânsito.'
  },
  veh_02: {
    vehicleId: 'veh_02',
    currentOdometerKm: 312800,
    engineHoursTotal: 7890,
    brakePadWearPct: 91,
    oilLifeRemainingPct: 9,
    tireTreadWearPct: 88,
    transmissionTempAvgC: 104.2,
    overallRiskLevel: 'CRITICAL',
    estimatedDaysToService: 2,
    recommendedServiceType: 'Revisão Geral do Sistema Pneumático + Troca Imediata de Pastilhas & Pneus Direcionais',
    estimatedCostBrl: 8900.00,
    lastServiceDate: '2026-04-18',
    nextScheduledKm: 315000,
    anomalousVibrationDetected: true,
    aiDiagnosticSummary: 'Desgaste severo das pastilhas (>90%) e temperatura de transmissão elevada (104.2°C). Risco iminente de perda de eficiência de frenagem sob carga pesada (32t).'
  },
  veh_03: {
    vehicleId: 'veh_03',
    currentOdometerKm: 98400,
    engineHoursTotal: 2150,
    brakePadWearPct: 35,
    oilLifeRemainingPct: 68,
    tireTreadWearPct: 30,
    transmissionTempAvgC: 84.1,
    overallRiskLevel: 'LOW',
    estimatedDaysToService: 45,
    recommendedServiceType: 'Inspeção Preventiva Periódica P3 (Filtros de Ar e Combustível)',
    estimatedCostBrl: 1800.00,
    lastServiceDate: '2026-07-29',
    nextScheduledKm: 110000,
    anomalousVibrationDetected: false,
    aiDiagnosticSummary: 'Todos os parâmetros mecânicos operando dentro das tolerâncias do fabricante Scania. Nenhuma anomalia de telemetria nos últimos 30 dias.'
  },
  veh_04: {
    vehicleId: 'veh_04',
    currentOdometerKm: 245100,
    engineHoursTotal: 5620,
    brakePadWearPct: 62,
    oilLifeRemainingPct: 41,
    tireTreadWearPct: 55,
    transmissionTempAvgC: 91.0,
    overallRiskLevel: 'MEDIUM',
    estimatedDaysToService: 18,
    recommendedServiceType: 'Troca de Correia Dentada e Calibração Injetores Common-Rail',
    estimatedCostBrl: 3400.00,
    lastServiceDate: '2026-05-20',
    nextScheduledKm: 250000,
    anomalousVibrationDetected: false,
    aiDiagnosticSummary: 'Desgaste moderado de pneus e correia. Agendamento sugerido para a próxima janela de retorno à base de Curitiba.'
  },
  veh_05: {
    vehicleId: 'veh_05',
    currentOdometerKm: 142300,
    engineHoursTotal: 3400,
    brakePadWearPct: 44,
    oilLifeRemainingPct: 58,
    tireTreadWearPct: 42,
    transmissionTempAvgC: 86.5,
    overallRiskLevel: 'LOW',
    estimatedDaysToService: 32,
    recommendedServiceType: 'Alinhamento/Balanceamento a Laser e Lubrificação de Quinta Roda',
    estimatedCostBrl: 1200.00,
    lastServiceDate: '2026-07-04',
    nextScheduledKm: 155000,
    anomalousVibrationDetected: false,
    aiDiagnosticSummary: 'Desempenho estável no corredor Rio-Santos. Telemetria de consumo de Arla-32 e diesel perfeitamente alinhada com a média de frota.'
  }
};

export const MOCK_ROUTE_ANOMALIES: import('../types/telemetry').RouteAnomalyEvent[] = [
  {
    id: 'anom_01',
    vehicleId: 'veh_02',
    plate: 'SP-9821',
    type: 'excessive_idle_time',
    severity: 'critical',
    detectedAt: 'Há 42 min',
    locationName: 'Pátio Externo Posto Graal km 72 - Louveira SP',
    lat: -23.1020,
    lng: -46.9420,
    durationMinutes: 245,
    expectedRoute: 'Corredor Campinas -> Louveira -> Santos (Margem Direita)',
    anomalyDescription: 'Veículo com carga frango congelado permaneceu parado por mais de 4h em local não homologado sem registro de pausa no tacógrafo digital.',
    recommendedAction: 'Acionar contato de rádio com o motorista e despachar checagem de integridade de lacres e bateria do gerador frigorífico.',
    status: 'active_alert'
  },
  {
    id: 'anom_02',
    vehicleId: 'veh_03',
    plate: 'PR-4412',
    type: 'off_route_deviation',
    severity: 'critical',
    detectedAt: 'Há 1h 15 min',
    locationName: 'Estrada Vicinal do Pântano (Desvio de 14.8 km da BR-381)',
    lat: -20.0820,
    lng: -44.2900,
    actualDeviationDistanceKm: 14.8,
    expectedRoute: 'BR-381 Rodovia Fernão Dias (Betim -> SP)',
    anomalyDescription: 'Desvio de 14.8 km fora do corredor seguro sem ordem de desvio por obras pela concessionária Arteris.',
    recommendedAction: 'Disparar meta-agente de escolta virtual e solicitar confirmação de senha de coação no teclado de bordo.',
    status: 'dispatched_security'
  },
  {
    id: 'anom_03',
    vehicleId: 'veh_01',
    plate: 'BRA-2E19',
    type: 'corridor_breach',
    severity: 'warning',
    detectedAt: 'Há 18 min',
    locationName: 'Acesso Secundário Anhanguera km 45',
    lat: -23.3300,
    lng: -46.8900,
    actualDeviationDistanceKm: 2.3,
    expectedRoute: 'SP-330 Rodovia Anhanguera Pista Expressa',
    anomalyDescription: 'Transição inesperada para pista marginal em trecho com histórico de baixa cobertura celular.',
    recommendedAction: 'Monitorar telemetria Starlink IoT com ping contínuo a cada 10 segundos até entrada no CD Cajamar.',
    status: 'acknowledged'
  }
];
