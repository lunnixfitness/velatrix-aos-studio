/**
 * @deprecated - DEPRECATED: VELATRIX AOS Data Foundation Migration.
 * Esta fonte de dados estática em array foi substituída pela camada de persistência Prisma / PostgreSQL
 * e pelos repositórios assíncronos em `src/server/repositories/` e `src/services/dataService.ts`.
 * Mantido exclusivamente para fins de retrocompatibilidade de tipos e fallback resiliente do seed.
 */
import { TenantProfile } from '../types/aos';

export type OfficeRole = 'commercial' | 'manager' | 'onboarding' | 'hr' | 'legal' | 'accounting';

export type LeadOrigin = 'LANDING_PAGE' | 'MAPS_MANUAL' | 'INDICACAO_PARCEIRO';

export type ProfessionalRole = 'Advogado' | 'Contador';
export type ProfessionalStatus = 'Disponível' | 'Ocupado' | 'Ausente';
export type AssignmentStatus = 'ASSIGNED' | 'WAITING_DISTRIBUTION';

export interface ReassignmentLog {
  previousProfessionalName: string;
  newProfessionalName: string;
  reason: string;
  timestamp: string;
  reassignedBy: string;
}

export interface TaxProfessional {
  id: string;
  name: string;
  email: string;
  role: ProfessionalRole;
  status: ProfessionalStatus;
  maxCapacity: number;
  activeLeadsCount: number;
  activeInQueue: boolean;
  lastAssignedAt?: string;
  specialties: string[];
  registrationNumber: string; // OAB ou CRC
}

export interface ProspectLead {
  id: string;
  name: string;
  tradeName?: string;
  cnpj: string;

  sector: string;
  sectorLabel: string;
  stage: 'lead' | 'proposal_sent' | 'negotiation' | 'closed';
  responsibleName: string;
  estimatedMrrBrl: number;
  lastContactDate: string;
  notes: string;
  // Campos de Qualificação / Diagnóstico Fiscal da Landing Page:
  origem: LeadOrigin;
  cnae?: string;
  regimeTributarioEstimado?: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | string;
  tesesAplicaveis?: string[];
  scoreAderencia?: number; // 0 a 100
  faixaCreditoEstimado?: string; // ex: 'R$ 80.000 - R$ 250.000'
  dataDiagnostico?: string;
  autoDiagnosticoCompleto?: boolean;
  // Motor de Distribuição Automática de Leads:
  assignedProfessionalId?: string;
  responsibleRole?: ProfessionalRole;
  assignedAt?: string;
  assignmentStatus?: AssignmentStatus;
  reassignmentHistory?: ReassignmentLog[];
}

export interface OnboardingProject {
  id: string;
  tenantId?: string;
  clientName: string;
  cnpj: string;
  sector: string;
  erp: string;
  stage: 'onboarding_started' | 'connectors_configured' | 'training' | 'live';
  progressPercent: number;
  leadEngineer: string;
  targetLiveDate: string;
  activeBlockers?: string;
}

export interface EmployeeBankDetails {
  bankName: string;
  agency: string;
  accountNumber: string;
  accountType: 'Corrente' | 'Poupança';
  pixKey: string;
  pixKeyType?: 'CPF' | 'CNPJ' | 'E-mail' | 'Telefone' | 'Chave Aleatória';
}

export type PayrollPaymentStatus = 'Pago' | 'Pendente' | 'Agendado';
export type PayrollPaymentMethod = 'PIX' | 'Transferência';

export interface EmployeePayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  roleTitle: string;
  department: string;
  salaryBrl: number;
  bonusOrExtraBrl?: number;
  netAmountBrl: number;
  status: PayrollPaymentStatus;
  scheduledPaymentDate: string;
  actualPaymentDate?: string;
  paymentMethod: PayrollPaymentMethod;
  bankName: string;
  accountDetails: string;
  pixKey?: string;
  receiptHash?: string;
  pixTransactionId?: string;
}

export interface MonthlyPayrollHistory {
  competencyMonth: string; // e.g. '09/2026', '08/2026'
  competencyLabel: string; // e.g. 'Setembro / 2026'
  isCurrentMonth?: boolean;
  totalPayrollBrl: number;
  totalEmployees: number;
  paidEmployeesCount: number;
  pendingEmployeesCount: number;
  scheduledEmployeesCount: number;
  nextScheduledDate: string;
  closingDate?: string;
  status: 'Em Aberto' | 'Parcialmente Pago' | 'Fechado & Homologado';
  eSocialProtocol?: string;
  sefipHash?: string;
  records: EmployeePayrollRecord[];
}

export interface OfficeEmployee {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  systemAccessRole: string;
  department: 'Comercial' | 'Engenharia & Implantação' | 'Jurídico & Compliance' | 'Financeiro & Controladoria' | 'Operações & RH';
  status: 'Ativo' | 'Afastado';
  admissionDate: string;
  salaryBrl?: number;
  bankDetails?: EmployeeBankDetails;
}

export interface ClientContract {
  id: string;
  clientName: string;
  cnpj: string;
  contractNumber: string;
  status: 'Rascunho' | 'Em Assinatura' | 'Assinado';
  effectiveDate: string;
  renewalDate: string;
  planName: string;
  mockAttachmentName: string;
  fileSizeKb: number;
  assignedLawyer: string;
}

export interface BillingEntry {
  id: string;
  tenantId: string;
  clientName: string;
  cnpj: string;
  planTier: string;
  amountBrl: number;
  dueDate: string;
  billingStatus: 'Pago' | 'Pendente' | 'Atrasado';
  invoiceNumber: string;
  paymentMethod: string;
}

export interface OfficeInternalAuditEntry {
  id: string;
  timestamp: string;
  employeeName: string;
  employeeRole: string;
  actionType: 'PROSPECT_MOVED' | 'PROVISION_REQUESTED' | 'PRE_INVOICE_GENERATED' | 'CONTRACT_STATUS_CHANGED' | 'EMPLOYEE_STATUS_CHANGED' | 'EMPLOYEE_CREATED' | 'EMPLOYEE_UPDATED' | 'PAYROLL_EXPORTED' | 'ONBOARDING_STAGE_CHANGED' | 'LEAD_CAPTURED' | 'LEAD_DISTRIBUTED' | 'LEAD_REASSIGNED' | 'PROFESSIONAL_STATUS_CHANGED';
  actionSummary: string;
  details: string;
}

export const INITIAL_MOCK_TAX_PROFESSIONALS: TaxProfessional[] = [
  {
    id: 'prof_01',
    name: 'Dr. Guilherme Siqueira',
    email: 'guilherme.siqueira@velatrix.com.br',
    role: 'Advogado',
    status: 'Disponível',
    maxCapacity: 5,
    activeLeadsCount: 2,
    activeInQueue: true,
    lastAssignedAt: '2026-08-18 11:30',
    specialties: ['Teses STF/STJ (Tema 69)', 'Indústria & Mineração', 'Lucro Real'],
    registrationNumber: 'OAB/SP 312.450'
  },
  {
    id: 'prof_02',
    name: 'Dra. Camila Mendonça',
    email: 'camila.mendonca@velatrix.com.br',
    role: 'Advogado',
    status: 'Disponível',
    maxCapacity: 5,
    activeLeadsCount: 3,
    activeInQueue: true,
    lastAssignedAt: '2026-08-19 14:15',
    specialties: ['Varejo & Supermercados', 'Construção Civil', 'PIS/COFINS Monofásicos'],
    registrationNumber: 'OAB/RJ 198.740'
  },
  {
    id: 'prof_03',
    name: 'Dr. Rodrigo Fontes',
    email: 'rodrigo.fontes@velatrix.com.br',
    role: 'Advogado',
    status: 'Disponível',
    maxCapacity: 4,
    activeLeadsCount: 2,
    activeInQueue: true,
    lastAssignedAt: '2026-08-17 16:45',
    specialties: ['Agronegócio & Commodities', 'Créditos ICMS Exportação', 'PERSE'],
    registrationNumber: 'OAB/RS 87.210'
  },
  {
    id: 'prof_04',
    name: 'Dra. Beatriz Toledo',
    email: 'beatriz.toledo@velatrix.com.br',
    role: 'Advogado',
    status: 'Ausente',
    maxCapacity: 4,
    activeLeadsCount: 0,
    activeInQueue: false,
    lastAssignedAt: '2026-08-10 09:00',
    specialties: ['Serviços & ISS', 'Simples Nacional', 'Planejamento Sucessório'],
    registrationNumber: 'OAB/MG 144.890'
  },
  {
    id: 'prof_05',
    name: 'Dra. Juliana Alencar',
    email: 'juliana.alencar@velatrix.com.br',
    role: 'Contador',
    status: 'Disponível',
    maxCapacity: 6,
    activeLeadsCount: 1,
    activeInQueue: true,
    lastAssignedAt: '2026-08-16 10:20',
    specialties: ['Perícia Contábil', 'Auditoria SPED EFD/ECF', 'Revisão PGDAS-D'],
    registrationNumber: 'CRC/SP 1SP284560'
  },
  {
    id: 'prof_06',
    name: 'Dr. Renato Esteves',
    email: 'renato.esteves@velatrix.com.br',
    role: 'Contador',
    status: 'Disponível',
    maxCapacity: 5,
    activeLeadsCount: 1,
    activeInQueue: true,
    lastAssignedAt: '2026-08-15 15:10',
    specialties: ['Monofásicos Farmácias & Autopeças', 'Restituição PER/DCOMP', 'ICMS-ST'],
    registrationNumber: 'CRC/RJ 089421'
  },
  {
    id: 'prof_07',
    name: 'Dra. Mariana Prado',
    email: 'mariana.prado@velatrix.com.br',
    role: 'Contador',
    status: 'Ocupado',
    maxCapacity: 4,
    activeLeadsCount: 4,
    activeInQueue: true,
    lastAssignedAt: '2026-08-19 17:50',
    specialties: ['Folha de Pagamento & eSocial', 'Reoneração CPRB', 'Cooperativas'],
    registrationNumber: 'CRC/PR 054120'
  }
];

export const INITIAL_MOCK_INTERNAL_AUDIT_LOGS: OfficeInternalAuditEntry[] = [
  {
    id: 'log_01',
    timestamp: '2026-08-20 10:14:22',
    employeeName: 'Camila Mendonça',
    employeeRole: 'Comercial',
    actionType: 'PROSPECT_MOVED',
    actionSummary: 'Prospect movido para Fechado',
    details: 'Movimentou "Cyrela Construtora & Incorporadora" de Negociação para Fechado (MRR R$ 19.600).'
  },
  {
    id: 'log_02',
    timestamp: '2026-08-20 09:45:10',
    employeeName: 'Ana Beatriz Souza',
    employeeRole: 'Contador',
    actionType: 'PRE_INVOICE_GENERATED',
    actionSummary: 'Pré-Fatura gerada para cliente',
    details: 'Emitiu pré-fatura mockada ref. NF-e 8200 para Nexus Indústria & Manufatura (R$ 19.600).'
  },
  {
    id: 'log_03',
    timestamp: '2026-08-19 16:30:00',
    employeeName: 'Dr. Leonardo Castilho',
    employeeRole: 'Advogado',
    actionType: 'CONTRACT_STATUS_CHANGED',
    actionSummary: 'Status de contrato avançado',
    details: 'Avançou minuta CTR-2026-0145/BR (Cyrela) de "Rascunho" para "Em Assinatura".'
  },
  {
    id: 'log_04',
    timestamp: '2026-08-19 14:15:33',
    employeeName: 'Felipe Santana',
    employeeRole: 'Implantação',
    actionType: 'ONBOARDING_STAGE_CHANGED',
    actionSummary: 'Etapa de onboarding avançada',
    details: 'Avançou "Rede FarmaVida" para a etapa "Treinamento C-Level" (Progresso: 80%).'
  },
  {
    id: 'log_05',
    timestamp: '2026-08-19 11:05:18',
    employeeName: 'Juliana Paes Ribeiro',
    employeeRole: 'RH',
    actionType: 'EMPLOYEE_STATUS_CHANGED',
    actionSummary: 'Status de colaborador alterado',
    details: 'Alterou status de "Lucas Menezes" para Ativo no quadro de Implantação.'
  }
];

export const INITIAL_MOCK_PROSPECTS: ProspectLead[] = [
  {
    id: 'prospect_01',
    name: 'Votorantim Cimentos & Calcário',
    cnpj: '01.838.723/0001-27',
    sector: 'manufacturing',
    sectorLabel: 'Indústria Pesada / Mineração',
    stage: 'lead',
    responsibleName: 'Dr. Guilherme Siqueira',
    responsibleRole: 'Advogado',
    assignedProfessionalId: 'prof_01',
    assignedAt: '2026-08-18 11:30',
    assignmentStatus: 'ASSIGNED',
    estimatedMrrBrl: 38000,
    lastContactDate: '2026-08-18',
    notes: 'Interesse em detecção de anomalias em paradas de forno e integração SAP ECC.',
    origem: 'MAPS_MANUAL',
    cnae: '2320-6/00 - Fabricação de cimento',
    regimeTributarioEstimado: 'Lucro Real',
    tesesAplicaveis: ['Tema 69 STF (ICMS na base PIS/COFINS)', 'Créditos de IPI sobre Insumos'],
    scoreAderencia: 84,
    faixaCreditoEstimado: 'R$ 420.000 - R$ 980.000'
  },
  {
    id: 'prospect_02',
    name: 'Grupo Pão de Açúcar (Logística Fria)',
    cnpj: '47.508.411/0001-56',
    sector: 'retail',
    sectorLabel: 'Varejo & Distribuição Fria',
    stage: 'proposal_sent',
    responsibleName: 'Dra. Camila Mendonça',
    responsibleRole: 'Advogado',
    assignedProfessionalId: 'prof_02',
    assignedAt: '2026-08-15 14:22',
    assignmentStatus: 'ASSIGNED',
    estimatedMrrBrl: 42000,
    lastContactDate: '2026-08-15',
    notes: 'Proposta do Plano Enterprise enviada para comitê de suprimentos.',
    origem: 'LANDING_PAGE',
    cnae: '4711-3/02 - Hipermercados e supermercados',
    regimeTributarioEstimado: 'Lucro Real',
    tesesAplicaveis: ['Tema 69 STF (Exclusão do ICMS da base do PIS/COFINS)', 'PIS/COFINS Monofásico (Lei 10.147/00)', 'Créditos sobre Energia Elétrica e Refrigeração'],
    scoreAderencia: 93,
    faixaCreditoEstimado: 'R$ 650.000 - R$ 1.850.000',
    dataDiagnostico: '2026-08-15 14:22',
    autoDiagnosticoCompleto: true
  },
  {
    id: 'prospect_03',
    name: 'Hospital Samaritano & Rede D’Or',
    cnpj: '60.528.093/0001-09',
    sector: 'healthcare',
    sectorLabel: 'Saúde & Cadeia Hospitalar',
    stage: 'negotiation',
    responsibleName: 'Dr. Guilherme Siqueira',
    responsibleRole: 'Advogado',
    assignedProfessionalId: 'prof_01',
    assignedAt: '2026-08-19 10:15',
    assignmentStatus: 'ASSIGNED',
    estimatedMrrBrl: 28500,
    lastContactDate: '2026-08-19',
    notes: 'Alinhamento de cláusula de quarentena de insumos e LGPD em fase final com jurídico.',
    origem: 'INDICACAO_PARCEIRO',
    cnae: '8610-1/01 - Atividades de atendimento hospitalar',
    regimeTributarioEstimado: 'Lucro Presumido',
    tesesAplicaveis: ['Tema 118 STF (ISS no PIS/COFINS)', 'Equiparação Hospitalar IRPJ/CSLL (8% / 12%)'],
    scoreAderencia: 79,
    faixaCreditoEstimado: 'R$ 310.000 - R$ 720.000'
  },
  {
    id: 'prospect_04',
    name: 'SLC Agrícola & Trading de Grãos',
    cnpj: '89.096.457/0001-55',
    sector: 'agribusiness',
    sectorLabel: 'Agronegócio & Commodities',
    stage: 'negotiation',
    responsibleName: 'Dr. Rodrigo Fontes',
    responsibleRole: 'Advogado',
    assignedProfessionalId: 'prof_03',
    assignedAt: '2026-08-17 09:40',
    assignmentStatus: 'ASSIGNED',
    estimatedMrrBrl: 32000,
    lastContactDate: '2026-08-17',
    notes: 'Validação de conector TOTVS Agro e telemetria de silos com hedge cambial.',
    origem: 'LANDING_PAGE',
    cnae: '0111-3/01 - Cultivo de grãos e cereais',
    regimeTributarioEstimado: 'Lucro Real',
    tesesAplicaveis: ['Crédito Presumido PIS/COFINS Agro', 'Subvenções de ICMS para Investimento (Lei 14.789/23)'],
    scoreAderencia: 88,
    faixaCreditoEstimado: 'R$ 540.000 - R$ 1.400.000',
    dataDiagnostico: '2026-08-17 09:40',
    autoDiagnosticoCompleto: true
  },
  {
    id: 'prospect_05',
    name: 'Cyrela Construtora & Incorporadora',
    cnpj: '73.178.600/0001-18',
    sector: 'construction',
    sectorLabel: 'Construção Civil & Obras',
    stage: 'closed',
    responsibleName: 'Dra. Camila Mendonça',
    responsibleRole: 'Advogado',
    assignedProfessionalId: 'prof_02',
    assignedAt: '2026-08-19 14:15',
    assignmentStatus: 'ASSIGNED',
    estimatedMrrBrl: 19600,
    lastContactDate: '2026-08-19',
    notes: 'Contrato assinado. Pronto para provisionamento no Super-Admin e kickoff de onboarding.',
    origem: 'MAPS_MANUAL',
    cnae: '4120-4/00 - Construção de edifícios',
    regimeTributarioEstimado: 'Lucro Presumido',
    tesesAplicaveis: ['Exclusão de Permutas da Base PIS/COFINS', 'Tema 118 STF (ISS no PIS/COFINS)'],
    scoreAderencia: 62,
    faixaCreditoEstimado: 'R$ 180.000 - R$ 420.000'
  },
  {
    id: 'prospect_06',
    name: 'Drogaria & Rede Farma Brasil',
    cnpj: '22.981.442/0001-19',
    sector: 'retail',
    sectorLabel: 'Farmácias & Cosméticos',
    stage: 'lead',
    responsibleName: 'Dra. Juliana Alencar',
    responsibleRole: 'Contador',
    assignedProfessionalId: 'prof_05',
    assignedAt: '2026-08-20 11:15',
    assignmentStatus: 'ASSIGNED',
    estimatedMrrBrl: 15400,
    lastContactDate: '2026-08-20',
    notes: 'Chegou via Landing Page com diagnóstico fiscal instantâneo pré-preenchido e alta aderência a monofásicos.',
    origem: 'LANDING_PAGE',
    cnae: '4771-7/01 - Comércio varejista de produtos farmacêuticos',
    regimeTributarioEstimado: 'Simples Nacional',
    tesesAplicaveis: ['Segregação de Monofásicos PGDAS-D (Lei 10.147/00)', 'ICMS-ST Base Simples Nacional'],
    scoreAderencia: 96,
    faixaCreditoEstimado: 'R$ 120.000 - R$ 380.000',
    dataDiagnostico: '2026-08-20 11:15',
    autoDiagnosticoCompleto: true
  },
  {
    id: 'prospect_07',
    name: 'Auto Peças & Distribuidora Rodoviária',
    cnpj: '33.145.890/0001-63',
    sector: 'manufacturing',
    sectorLabel: 'Autopeças & Distribuição',
    stage: 'lead',
    responsibleName: 'Dr. Renato Esteves',
    responsibleRole: 'Contador',
    assignedProfessionalId: 'prof_06',
    assignedAt: '2026-08-19 16:05',
    assignmentStatus: 'ASSIGNED',
    estimatedMrrBrl: 18200,
    lastContactDate: '2026-08-19',
    notes: 'Diagnóstico fiscal automático realizado na Landing Page com alta aderência a produtos monofásicos automotivos.',
    origem: 'LANDING_PAGE',
    cnae: '4530-7/03 - Comércio a varejo de autopeças e acessórios',
    regimeTributarioEstimado: 'Simples Nacional',
    tesesAplicaveis: ['PIS/COFINS Monofásico Autopeças (Lei 10.485/02)', 'Segregação PGDAS-D'],
    scoreAderencia: 91,
    faixaCreditoEstimado: 'R$ 140.000 - R$ 410.000',
    dataDiagnostico: '2026-08-19 16:05',
    autoDiagnosticoCompleto: true
  },
  {
    id: 'prospect_08',
    name: 'Lanchonetes e Pizzarias Bella Paulista',
    cnpj: '58.204.112/0001-81',
    sector: 'services',
    sectorLabel: 'Bares & Restaurantes',
    stage: 'lead',
    responsibleName: 'Dr. Rodrigo Fontes',
    responsibleRole: 'Advogado',
    assignedProfessionalId: 'prof_03',
    assignedAt: '2026-08-18 10:10',
    assignmentStatus: 'ASSIGNED',
    estimatedMrrBrl: 8500,
    lastContactDate: '2026-08-18',
    notes: 'Cadastrado manualmente via prospecção local.',
    origem: 'MAPS_MANUAL',
    cnae: '5611-2/01 - Restaurantes e similares',
    regimeTributarioEstimado: 'Simples Nacional',
    tesesAplicaveis: ['PERSE (Programa Emergencial)', 'Exclusão Gorjetas da Receita Bruta'],
    scoreAderencia: 45,
    faixaCreditoEstimado: 'R$ 35.000 - R$ 90.000'
  },
  {
    id: 'prospect_09',
    name: 'TechCloud Soluções SaaS & TI',
    cnpj: '17.334.810/0001-90',
    sector: 'services',
    sectorLabel: 'Tecnologia & Software',
    stage: 'proposal_sent',
    responsibleName: 'Dra. Camila Mendonça',
    responsibleRole: 'Advogado',
    assignedProfessionalId: 'prof_02',
    assignedAt: '2026-08-18 10:30',
    assignmentStatus: 'ASSIGNED',
    estimatedMrrBrl: 22000,
    lastContactDate: '2026-08-18',
    notes: 'Veio da Landing Page. Análise preliminar indicou score moderado para crédito sobre servidores de nuvem.',
    origem: 'LANDING_PAGE',
    cnae: '6202-3/00 - Desenvolvimento e licenciamento de softwares',
    regimeTributarioEstimado: 'Lucro Presumido',
    tesesAplicaveis: ['Tema 118 STF (ISS no PIS/COFINS)', 'Não-cumulatividade sobre servidores e infraestrutura Cloud'],
    scoreAderencia: 68,
    faixaCreditoEstimado: 'R$ 75.000 - R$ 190.000',
    dataDiagnostico: '2026-08-18 10:30',
    autoDiagnosticoCompleto: true
  },
  {
    id: 'prospect_10',
    name: 'Hospital São Mateus & Diagnósticos Médicos',
    cnpj: '41.872.109/0001-33',
    sector: 'healthcare',
    sectorLabel: 'Saúde & Clínicas Médicas',
    stage: 'lead',
    responsibleName: 'Aguardando Distribuição (Fila)',
    estimatedMrrBrl: 26000,
    lastContactDate: '2026-08-20',
    notes: 'Novo lead captado via Landing Page. Aguardando alocação automática por capacidade da equipe tributária.',
    origem: 'LANDING_PAGE',
    cnae: '8610-1/02 - Atividades de atendimento em pronto-socorro e clínicas',
    regimeTributarioEstimado: 'Lucro Presumido',
    tesesAplicaveis: ['Equiparação Hospitalar IRPJ/CSLL', 'Tema 118 STF (ISS no PIS/COFINS)'],
    scoreAderencia: 89,
    faixaCreditoEstimado: 'R$ 290.000 - R$ 680.000',
    dataDiagnostico: '2026-08-20 16:45',
    autoDiagnosticoCompleto: true,
    assignmentStatus: 'WAITING_DISTRIBUTION'
  }
];

export const INITIAL_MOCK_ONBOARDING_PROJECTS: OnboardingProject[] = [
  {
    id: 'onb_01',
    tenantId: 'tenant_nexus_01',
    clientName: 'Nexus Indústria & Manufatura S/A',
    cnpj: '18.492.301/0001-84',
    sector: 'Indústria & Manufatura',
    erp: 'TOTVS Protheus REST',
    stage: 'live',
    progressPercent: 100,
    leadEngineer: 'Lucas Silveira',
    targetLiveDate: '2026-01-20',
    activeBlockers: undefined
  },
  {
    id: 'onb_02',
    tenantId: 'tenant_agro_02',
    clientName: 'Cerrado Grãos & Bioenergia Corp',
    cnpj: '03.882.119/0001-20',
    sector: 'Agronegócio & Trading',
    erp: 'SAP S/4HANA OData',
    stage: 'live',
    progressPercent: 100,
    leadEngineer: 'Mariana Duarte',
    targetLiveDate: '2026-02-05'
  },
  {
    id: 'onb_03',
    tenantId: 'tenant_drogasil_03',
    clientName: 'Rede FarmaVida & Logística Hospitalar',
    cnpj: '61.585.865/0001-51',
    sector: 'Saúde & Farma',
    erp: 'Linx Farma + TOTVS Protheus',
    stage: 'training',
    progressPercent: 80,
    leadEngineer: 'Lucas Silveira',
    targetLiveDate: '2026-08-30',
    activeBlockers: 'Treinamento de C-Levels em Multi-Sig via Celular'
  },
  {
    id: 'onb_04',
    clientName: 'Cyrela Construtora & Incorporadora',
    cnpj: '73.178.600/0001-18',
    sector: 'Construção Civil',
    erp: 'UAU / Mega ERP',
    stage: 'onboarding_started',
    progressPercent: 20,
    leadEngineer: 'Mariana Duarte',
    targetLiveDate: '2026-09-15',
    activeBlockers: 'Aguardando liberação de credenciais de VPN do ERP'
  },
  {
    id: 'onb_05',
    clientName: 'OmniVarejo Brasil Logística S/A',
    cnpj: '09.332.144/0001-90',
    sector: 'Varejo & E-commerce',
    erp: 'Bling ERP + VTEX API',
    stage: 'connectors_configured',
    progressPercent: 55,
    leadEngineer: 'Thiago Valente',
    targetLiveDate: '2026-09-02'
  }
];

export const INITIAL_MOCK_EMPLOYEES: OfficeEmployee[] = [
  {
    id: 'emp_01',
    name: 'Guilherme Siqueira',
    email: 'guilherme.siqueira@velatrix.ai',
    roleTitle: 'Head Comercial & Enterprise Sales',
    systemAccessRole: 'Comercial (Acesso Total Funil)',
    department: 'Comercial',
    status: 'Ativo',
    admissionDate: '2025-03-10',
    salaryBrl: 14500,
    bankDetails: {
      bankName: '341 - Itaú Unibanco',
      agency: '0842',
      accountNumber: '29481-3',
      accountType: 'Corrente',
      pixKey: 'guilherme.siqueira@velatrix.ai',
      pixKeyType: 'E-mail'
    }
  },
  {
    id: 'emp_02',
    name: 'Camila Mendonça',
    email: 'camila.mendonca@velatrix.ai',
    roleTitle: 'Account Executive Senior',
    systemAccessRole: 'Comercial (Executivo de Contas)',
    department: 'Comercial',
    status: 'Ativo',
    admissionDate: '2025-06-15',
    salaryBrl: 9800,
    bankDetails: {
      bankName: '260 - Nu Pagamentos (Nubank)',
      agency: '0001',
      accountNumber: '8841920-5',
      accountType: 'Corrente',
      pixKey: '329.841.098-12',
      pixKeyType: 'CPF'
    }
  },
  {
    id: 'emp_03',
    name: 'Renato Faria',
    email: 'renato.faria@velatrix.ai',
    roleTitle: 'Diretor Geral de Operações (COO)',
    systemAccessRole: 'Gerente (Visão Executiva 360)',
    department: 'Operações & RH',
    status: 'Ativo',
    admissionDate: '2024-11-01',
    salaryBrl: 18000,
    bankDetails: {
      bankName: '001 - Banco do Brasil',
      agency: '1824-1',
      accountNumber: '50192-8',
      accountType: 'Corrente',
      pixKey: 'renato.faria@velatrix.ai',
      pixKeyType: 'E-mail'
    }
  },
  {
    id: 'emp_04',
    name: 'Lucas Silveira',
    email: 'lucas.silveira@velatrix.ai',
    roleTitle: 'Líder Técnico de Implantações',
    systemAccessRole: 'Implantação (Setup & Conectores)',
    department: 'Engenharia & Implantação',
    status: 'Ativo',
    admissionDate: '2025-01-20',
    salaryBrl: 11200,
    bankDetails: {
      bankName: '033 - Banco Santander',
      agency: '3145',
      accountNumber: '13009412-1',
      accountType: 'Corrente',
      pixKey: '+55 11 98765-4321',
      pixKeyType: 'Telefone'
    }
  },
  {
    id: 'emp_05',
    name: 'Beatriz Vasconcelos',
    email: 'beatriz.v@velatrix.ai',
    roleTitle: 'Gerente de Talentos & RH',
    systemAccessRole: 'RH (Gestão de Acessos & Pessoas)',
    department: 'Operações & RH',
    status: 'Ativo',
    admissionDate: '2025-04-01',
    salaryBrl: 9500,
    bankDetails: {
      bankName: '237 - Banco Bradesco',
      agency: '2041',
      accountNumber: '48201-9',
      accountType: 'Poupança',
      pixKey: 'beatriz.v@velatrix.ai',
      pixKeyType: 'E-mail'
    }
  },
  {
    id: 'emp_06',
    name: 'Dr. Leonardo Castilho',
    email: 'leonardo.castilho@velatrix.ai',
    roleTitle: 'Consultor Jurídico & DPO',
    systemAccessRole: 'Advogado (Contratos & Compliance)',
    department: 'Jurídico & Compliance',
    status: 'Ativo',
    admissionDate: '2024-12-10',
    salaryBrl: 13000,
    bankDetails: {
      bankName: '077 - Banco Inter',
      agency: '0001',
      accountNumber: '9481023-7',
      accountType: 'Corrente',
      pixKey: 'leonardo.castilho@velatrix.ai',
      pixKeyType: 'E-mail'
    }
  },
  {
    id: 'emp_07',
    name: 'Juliana Pires',
    email: 'juliana.pires@velatrix.ai',
    roleTitle: 'Controller & Contadora Chefe',
    systemAccessRole: 'Contador (Faturamento & Receita)',
    department: 'Financeiro & Controladoria',
    status: 'Ativo',
    admissionDate: '2025-02-15',
    salaryBrl: 10500,
    bankDetails: {
      bankName: '341 - Itaú Unibanco',
      agency: '1590',
      accountNumber: '38194-2',
      accountType: 'Corrente',
      pixKey: '401.982.170-44',
      pixKeyType: 'CPF'
    }
  },
  {
    id: 'emp_08',
    name: 'Thiago Valente',
    email: 'thiago.valente@velatrix.ai',
    roleTitle: 'Engenheiro de Integração de ERP',
    systemAccessRole: 'Implantação (Suporte de Borda)',
    department: 'Engenharia & Implantação',
    status: 'Afastado',
    admissionDate: '2025-05-18',
    salaryBrl: 7900,
    bankDetails: {
      bankName: '104 - Caixa Econômica Federal',
      agency: '0219',
      accountNumber: '0019482-3',
      accountType: 'Poupança',
      pixKey: 'thiago.valente@velatrix.ai',
      pixKeyType: 'E-mail'
    }
  }
];

export const INITIAL_MOCK_CONTRACTS: ClientContract[] = [
  {
    id: 'ctr_01',
    clientName: 'Nexus Indústria & Manufatura S/A',
    cnpj: '18.492.301/0001-84',
    contractNumber: 'CTR-2026-0089/BR',
    status: 'Assinado',
    effectiveDate: '2026-01-15',
    renewalDate: '2027-01-15',
    planName: 'Plano Professional (R$ 19.600/mês)',
    mockAttachmentName: 'Contrato_Master_SLA_Nexus_Manufatura_v3.pdf',
    fileSizeKb: 412,
    assignedLawyer: 'Dr. Leonardo Castilho'
  },
  {
    id: 'ctr_02',
    clientName: 'Cerrado Grãos & Bioenergia Corp',
    cnpj: '03.882.119/0001-20',
    contractNumber: 'CTR-2025-0044/BR',
    status: 'Assinado',
    effectiveDate: '2025-11-20',
    renewalDate: '2026-11-20',
    planName: 'Plano Enterprise (R$ 48.500/mês)',
    mockAttachmentName: 'Master_Service_Agreement_Cerrado_Agro_Signed.pdf',
    fileSizeKb: 580,
    assignedLawyer: 'Dr. Leonardo Castilho'
  },
  {
    id: 'ctr_03',
    clientName: 'Rede FarmaVida & Logística Hospitalar',
    cnpj: '61.585.865/0001-51',
    contractNumber: 'CTR-2026-0112/BR',
    status: 'Assinado',
    effectiveDate: '2026-02-10',
    renewalDate: '2027-02-10',
    planName: 'Plano Enterprise (R$ 52.000/mês)',
    mockAttachmentName: 'Aditivo_LGPD_Anvisa_FarmaVida_DocuSign.pdf',
    fileSizeKb: 340,
    assignedLawyer: 'Dr. Leonardo Castilho'
  },
  {
    id: 'ctr_04',
    clientName: 'Cyrela Construtora & Incorporadora',
    cnpj: '73.178.600/0001-18',
    contractNumber: 'CTR-2026-0145/BR',
    status: 'Em Assinatura',
    effectiveDate: '2026-08-20',
    renewalDate: '2027-08-20',
    planName: 'Plano Professional (R$ 19.600/mês)',
    mockAttachmentName: 'Minuta_Contratual_Cyrela_AOS_Aprovada.pdf',
    fileSizeKb: 310,
    assignedLawyer: 'Dr. Leonardo Castilho'
  },
  {
    id: 'ctr_05',
    clientName: 'Hospital Samaritano & Rede D’Or',
    cnpj: '60.528.093/0001-09',
    contractNumber: 'CTR-2026-0148/BR',
    status: 'Rascunho',
    effectiveDate: '2026-09-01',
    renewalDate: '2027-09-01',
    planName: 'Plano Enterprise + Quarentena Zero-Trust',
    mockAttachmentName: 'Minuta_Inicial_Samaritano_Termos_SLA.pdf',
    fileSizeKb: 275,
    assignedLawyer: 'Dr. Leonardo Castilho'
  }
];

export const INITIAL_MOCK_PAYROLL_HISTORIES: MonthlyPayrollHistory[] = [
  {
    competencyMonth: '09/2026',
    competencyLabel: 'Setembro / 2026 (Competência Vigente)',
    isCurrentMonth: true,
    totalPayrollBrl: 94400,
    totalEmployees: 8,
    paidEmployeesCount: 5,
    pendingEmployeesCount: 1,
    scheduledEmployeesCount: 2,
    nextScheduledDate: '05/10/2026',
    status: 'Parcialmente Pago',
    eSocialProtocol: 'eSocial-20260902-PRE-VLX',
    sefipHash: '0x8f2a91c0e5b742aa39f9411dc8219c44b931fae812d46e01a87b32091c77f24d',
    records: [
      {
        id: 'pay_09_01',
        employeeId: 'emp_01',
        employeeName: 'Guilherme Siqueira',
        email: 'guilherme.siqueira@velatrix.ai',
        roleTitle: 'Head Comercial & Enterprise Sales',
        department: 'Comercial',
        salaryBrl: 14500,
        netAmountBrl: 14500,
        status: 'Pago',
        scheduledPaymentDate: '05/09/2026',
        actualPaymentDate: '02/09/2026',
        paymentMethod: 'PIX',
        bankName: '341 - Itaú Unibanco',
        accountDetails: 'Ag 0842 · CC 29481-3',
        pixKey: 'guilherme.siqueira@velatrix.ai',
        receiptHash: '0x8a92f03b51d4e78a67c10bca38219e44501a9b8321c470e9a117b5091c88d12e',
        pixTransactionId: 'E000381662026090214309817265'
      },
      {
        id: 'pay_09_02',
        employeeId: 'emp_02',
        employeeName: 'Camila Mendonça',
        email: 'camila.mendonca@velatrix.ai',
        roleTitle: 'Account Executive Senior',
        department: 'Comercial',
        salaryBrl: 9800,
        netAmountBrl: 9800,
        status: 'Pago',
        scheduledPaymentDate: '05/09/2026',
        actualPaymentDate: '02/09/2026',
        paymentMethod: 'PIX',
        bankName: '260 - Nu Pagamentos (Nubank)',
        accountDetails: 'Ag 0001 · CC 8841920-5',
        pixKey: '329.841.098-12',
        receiptHash: '0x7c11d4e92a83f15b809a47318cb921a603fe92451c8b320984da721c009b152a',
        pixTransactionId: 'E182361202026090215129038471'
      },
      {
        id: 'pay_09_03',
        employeeId: 'emp_03',
        employeeName: 'Renato Faria',
        email: 'renato.faria@velatrix.ai',
        roleTitle: 'Diretor Geral de Operações (COO)',
        department: 'Operações & RH',
        salaryBrl: 18000,
        netAmountBrl: 18000,
        status: 'Pago',
        scheduledPaymentDate: '05/09/2026',
        actualPaymentDate: '01/09/2026',
        paymentMethod: 'PIX',
        bankName: '001 - Banco do Brasil',
        accountDetails: 'Ag 1824-1 · CC 50192-8',
        pixKey: 'renato.faria@velatrix.ai',
        receiptHash: '0x3f54b8109dca8261e4091ba8302194c7901bca7215e4a819b329410ca78190de',
        pixTransactionId: 'E000000002026090109451829304'
      },
      {
        id: 'pay_09_04',
        employeeId: 'emp_04',
        employeeName: 'Lucas Silveira',
        email: 'lucas.silveira@velatrix.ai',
        roleTitle: 'Líder Técnico de Implantações',
        department: 'Engenharia & Implantação',
        salaryBrl: 11200,
        netAmountBrl: 11200,
        status: 'Agendado',
        scheduledPaymentDate: '05/09/2026',
        paymentMethod: 'PIX',
        bankName: '033 - Banco Santander',
        accountDetails: 'Ag 3145 · CC 13009412-1',
        pixKey: '+55 11 98765-4321',
        receiptHash: '0x12a9bf84c3e109d78201a94bc7201b490218de47a810c9213894bca0918ef012'
      },
      {
        id: 'pay_09_05',
        employeeId: 'emp_05',
        employeeName: 'Beatriz Vasconcelos',
        email: 'beatriz.v@velatrix.ai',
        roleTitle: 'Gerente de Talentos & RH',
        department: 'Operações & RH',
        salaryBrl: 9500,
        netAmountBrl: 9500,
        status: 'Pago',
        scheduledPaymentDate: '05/09/2026',
        actualPaymentDate: '01/09/2026',
        paymentMethod: 'Transferência',
        bankName: '237 - Banco Bradesco',
        accountDetails: 'Ag 2041 · CP 48201-9',
        pixKey: 'beatriz.v@velatrix.ai',
        receiptHash: '0x91dae821bc047910fa312984bc091247019bac5821940182390481204918234a',
        pixTransactionId: 'TED-237-20260901-0098412-BRD'
      },
      {
        id: 'pay_09_06',
        employeeId: 'emp_06',
        employeeName: 'Dr. Leonardo Castilho',
        email: 'leonardo.castilho@velatrix.ai',
        roleTitle: 'Consultor Jurídico & DPO',
        department: 'Jurídico & Compliance',
        salaryBrl: 13000,
        netAmountBrl: 13000,
        status: 'Pago',
        scheduledPaymentDate: '05/09/2026',
        actualPaymentDate: '02/09/2026',
        paymentMethod: 'PIX',
        bankName: '077 - Banco Inter',
        accountDetails: 'Ag 0001 · CC 9481023-7',
        pixKey: 'leonardo.castilho@velatrix.ai',
        receiptHash: '0x55b8109dca8261e4091ba8302194c7901bca7215e4a819b329410ca78190de',
        pixTransactionId: 'E004169682026090211248901237'
      },
      {
        id: 'pay_09_07',
        employeeId: 'emp_07',
        employeeName: 'Juliana Pires',
        email: 'juliana.pires@velatrix.ai',
        roleTitle: 'Controller & Contadora Chefe',
        department: 'Financeiro & Controladoria',
        salaryBrl: 10500,
        netAmountBrl: 10500,
        status: 'Agendado',
        scheduledPaymentDate: '05/09/2026',
        paymentMethod: 'PIX',
        bankName: '341 - Itaú Unibanco',
        accountDetails: 'Ag 1590 · CC 38194-2',
        pixKey: '401.982.170-44',
        receiptHash: '0x6e28f149021da819c4021948ba02194c70182ba091c7841098234190812904b8'
      },
      {
        id: 'pay_09_08',
        employeeId: 'emp_08',
        employeeName: 'Thiago Valente',
        email: 'thiago.valente@velatrix.ai',
        roleTitle: 'Engenheiro de Integração de ERP',
        department: 'Engenharia & Implantação',
        salaryBrl: 7900,
        netAmountBrl: 7900,
        status: 'Pendente',
        scheduledPaymentDate: '05/09/2026',
        paymentMethod: 'Transferência',
        bankName: '104 - Caixa Econômica Federal',
        accountDetails: 'Ag 0219 · CP 0019482-3',
        pixKey: 'thiago.valente@velatrix.ai'
      }
    ]
  },
  {
    competencyMonth: '08/2026',
    competencyLabel: 'Agosto / 2026 (Competência Fechada)',
    totalPayrollBrl: 94400,
    totalEmployees: 8,
    paidEmployeesCount: 8,
    pendingEmployeesCount: 0,
    scheduledEmployeesCount: 0,
    nextScheduledDate: '05/08/2026',
    closingDate: '05/08/2026',
    status: 'Fechado & Homologado',
    eSocialProtocol: 'eSocial-20260805-772914-VLX',
    sefipHash: '0x4a91c78190da8214bca8192401824bca810294102948bc019284019284019284',
    records: [
      {
        id: 'pay_08_01',
        employeeId: 'emp_01',
        employeeName: 'Guilherme Siqueira',
        email: 'guilherme.siqueira@velatrix.ai',
        roleTitle: 'Head Comercial & Enterprise Sales',
        department: 'Comercial',
        salaryBrl: 14500,
        netAmountBrl: 14500,
        status: 'Pago',
        scheduledPaymentDate: '05/08/2026',
        actualPaymentDate: '05/08/2026',
        paymentMethod: 'PIX',
        bankName: '341 - Itaú Unibanco',
        accountDetails: 'Ag 0842 · CC 29481-3',
        pixKey: 'guilherme.siqueira@velatrix.ai',
        receiptHash: '0x4b9012a819c4021948ba02194c70182ba091c7841098234190812904b86e28f1',
        pixTransactionId: 'E000381662026080510129847162'
      },
      {
        id: 'pay_08_02',
        employeeId: 'emp_02',
        employeeName: 'Camila Mendonça',
        email: 'camila.mendonca@velatrix.ai',
        roleTitle: 'Account Executive Senior',
        department: 'Comercial',
        salaryBrl: 9800,
        netAmountBrl: 9800,
        status: 'Pago',
        scheduledPaymentDate: '05/08/2026',
        actualPaymentDate: '05/08/2026',
        paymentMethod: 'PIX',
        bankName: '260 - Nu Pagamentos (Nubank)',
        accountDetails: 'Ag 0001 · CC 8841920-5',
        pixKey: '329.841.098-12',
        receiptHash: '0x2a91048bc0192840192840192844a91c78190da8214bca8192401824bca81029',
        pixTransactionId: 'E182361202026080511209384710'
      },
      {
        id: 'pay_08_03',
        employeeId: 'emp_03',
        employeeName: 'Renato Faria',
        email: 'renato.faria@velatrix.ai',
        roleTitle: 'Diretor Geral de Operações (COO)',
        department: 'Operações & RH',
        salaryBrl: 18000,
        netAmountBrl: 18000,
        status: 'Pago',
        scheduledPaymentDate: '05/08/2026',
        actualPaymentDate: '05/08/2026',
        paymentMethod: 'PIX',
        bankName: '001 - Banco do Brasil',
        accountDetails: 'Ag 1824-1 · CC 50192-8',
        pixKey: 'renato.faria@velatrix.ai',
        receiptHash: '0x94bca810294a91c78190da8214bca8192401824bca810294102948bc01928401',
        pixTransactionId: 'E000000002026080509301928374'
      },
      {
        id: 'pay_08_04',
        employeeId: 'emp_04',
        employeeName: 'Lucas Silveira',
        email: 'lucas.silveira@velatrix.ai',
        roleTitle: 'Líder Técnico de Implantações',
        department: 'Engenharia & Implantação',
        salaryBrl: 11200,
        netAmountBrl: 11200,
        status: 'Pago',
        scheduledPaymentDate: '05/08/2026',
        actualPaymentDate: '05/08/2026',
        paymentMethod: 'PIX',
        bankName: '033 - Banco Santander',
        accountDetails: 'Ag 3145 · CC 13009412-1',
        pixKey: '+55 11 98765-4321',
        receiptHash: '0x810294102948bc0192840192840192844a91c78190da8214bca8192401824bca',
        pixTransactionId: 'E003310022026080514109823412'
      },
      {
        id: 'pay_08_05',
        employeeId: 'emp_05',
        employeeName: 'Beatriz Vasconcelos',
        email: 'beatriz.v@velatrix.ai',
        roleTitle: 'Gerente de Talentos & RH',
        department: 'Operações & RH',
        salaryBrl: 9500,
        netAmountBrl: 9500,
        status: 'Pago',
        scheduledPaymentDate: '05/08/2026',
        actualPaymentDate: '05/08/2026',
        paymentMethod: 'Transferência',
        bankName: '237 - Banco Bradesco',
        accountDetails: 'Ag 2041 · CP 48201-9',
        pixKey: 'beatriz.v@velatrix.ai',
        receiptHash: '0x192840192844a91c78190da8214bca8192401824bca810294102948bc0192840',
        pixTransactionId: 'TED-237-20260805-0048192-BRD'
      },
      {
        id: 'pay_08_06',
        employeeId: 'emp_06',
        employeeName: 'Dr. Leonardo Castilho',
        email: 'leonardo.castilho@velatrix.ai',
        roleTitle: 'Consultor Jurídico & DPO',
        department: 'Jurídico & Compliance',
        salaryBrl: 13000,
        netAmountBrl: 13000,
        status: 'Pago',
        scheduledPaymentDate: '05/08/2026',
        actualPaymentDate: '05/08/2026',
        paymentMethod: 'PIX',
        bankName: '077 - Banco Inter',
        accountDetails: 'Ag 0001 · CC 9481023-7',
        pixKey: 'leonardo.castilho@velatrix.ai',
        receiptHash: '0x401824bca810294102948bc0192840192844a91c78190da8214bca8192401824',
        pixTransactionId: 'E004169682026080512059182736'
      },
      {
        id: 'pay_08_07',
        employeeId: 'emp_07',
        employeeName: 'Juliana Pires',
        email: 'juliana.pires@velatrix.ai',
        roleTitle: 'Controller & Contadora Chefe',
        department: 'Financeiro & Controladoria',
        salaryBrl: 10500,
        netAmountBrl: 10500,
        status: 'Pago',
        scheduledPaymentDate: '05/08/2026',
        actualPaymentDate: '05/08/2026',
        paymentMethod: 'PIX',
        bankName: '341 - Itaú Unibanco',
        accountDetails: 'Ag 1590 · CC 38194-2',
        pixKey: '401.982.170-44',
        receiptHash: '0xda8214bca8192401824bca810294102948bc0192840192844a91c78190da8214',
        pixTransactionId: 'E000381662026080515409823410'
      },
      {
        id: 'pay_08_08',
        employeeId: 'emp_08',
        employeeName: 'Thiago Valente',
        email: 'thiago.valente@velatrix.ai',
        roleTitle: 'Engenheiro de Integração de ERP',
        department: 'Engenharia & Implantação',
        salaryBrl: 7900,
        netAmountBrl: 7900,
        status: 'Pago',
        scheduledPaymentDate: '05/08/2026',
        actualPaymentDate: '05/08/2026',
        paymentMethod: 'Transferência',
        bankName: '104 - Caixa Econômica Federal',
        accountDetails: 'Ag 0219 · CP 0019482-3',
        pixKey: 'thiago.valente@velatrix.ai',
        receiptHash: '0xca810294102948bc0192840192844a91c78190da8214bca8192401824bca8102',
        pixTransactionId: 'TED-104-20260805-0019283-CEF'
      }
    ]
  },
  {
    competencyMonth: '07/2026',
    competencyLabel: 'Julho / 2026 (Competência Fechada)',
    totalPayrollBrl: 91200,
    totalEmployees: 8,
    paidEmployeesCount: 8,
    pendingEmployeesCount: 0,
    scheduledEmployeesCount: 0,
    nextScheduledDate: '05/07/2026',
    closingDate: '05/07/2026',
    status: 'Fechado & Homologado',
    eSocialProtocol: 'eSocial-20260705-410982-VLX',
    sefipHash: '0x3e18f02948bc0192840192840192844a91c78190da8214bca8192401824bca81',
    records: [
      {
        id: 'pay_07_01',
        employeeId: 'emp_01',
        employeeName: 'Guilherme Siqueira',
        email: 'guilherme.siqueira@velatrix.ai',
        roleTitle: 'Head Comercial & Enterprise Sales',
        department: 'Comercial',
        salaryBrl: 14000,
        netAmountBrl: 14000,
        status: 'Pago',
        scheduledPaymentDate: '05/07/2026',
        actualPaymentDate: '05/07/2026',
        paymentMethod: 'PIX',
        bankName: '341 - Itaú Unibanco',
        accountDetails: 'Ag 0842 · CC 29481-3',
        pixKey: 'guilherme.siqueira@velatrix.ai',
        receiptHash: '0x18f02948bc0192840192840192844a91c78190da8214bca8192401824bca8102',
        pixTransactionId: 'E000381662026070509128374619'
      },
      {
        id: 'pay_07_02',
        employeeId: 'emp_02',
        employeeName: 'Camila Mendonça',
        email: 'camila.mendonca@velatrix.ai',
        roleTitle: 'Account Executive Senior',
        department: 'Comercial',
        salaryBrl: 9500,
        netAmountBrl: 9500,
        status: 'Pago',
        scheduledPaymentDate: '05/07/2026',
        actualPaymentDate: '05/07/2026',
        paymentMethod: 'PIX',
        bankName: '260 - Nu Pagamentos (Nubank)',
        accountDetails: 'Ag 0001 · CC 8841920-5',
        pixKey: '329.841.098-12',
        receiptHash: '0x92840192840192844a91c78190da8214bca8192401824bca8102948bc0192840',
        pixTransactionId: 'E182361202026070510459283741'
      },
      {
        id: 'pay_07_03',
        employeeId: 'emp_03',
        employeeName: 'Renato Faria',
        email: 'renato.faria@velatrix.ai',
        roleTitle: 'Diretor Geral de Operações (COO)',
        department: 'Operações & RH',
        salaryBrl: 17500,
        netAmountBrl: 17500,
        status: 'Pago',
        scheduledPaymentDate: '05/07/2026',
        actualPaymentDate: '05/07/2026',
        paymentMethod: 'PIX',
        bankName: '001 - Banco do Brasil',
        accountDetails: 'Ag 1824-1 · CC 50192-8',
        pixKey: 'renato.faria@velatrix.ai',
        receiptHash: '0x840192844a91c78190da8214bca8192401824bca8102948bc0192840192840192',
        pixTransactionId: 'E000000002026070511301928374'
      },
      {
        id: 'pay_07_04',
        employeeId: 'emp_04',
        employeeName: 'Lucas Silveira',
        email: 'lucas.silveira@velatrix.ai',
        roleTitle: 'Líder Técnico de Implantações',
        department: 'Engenharia & Implantação',
        salaryBrl: 11000,
        netAmountBrl: 11000,
        status: 'Pago',
        scheduledPaymentDate: '05/07/2026',
        actualPaymentDate: '05/07/2026',
        paymentMethod: 'PIX',
        bankName: '033 - Banco Santander',
        accountDetails: 'Ag 3145 · CC 13009412-1',
        pixKey: '+55 11 98765-4321',
        receiptHash: '0x78190da8214bca8192401824bca8102948bc0192840192840192844a91c78190',
        pixTransactionId: 'E003310022026070513109283741'
      },
      {
        id: 'pay_07_05',
        employeeId: 'emp_05',
        employeeName: 'Beatriz Vasconcelos',
        email: 'beatriz.v@velatrix.ai',
        roleTitle: 'Gerente de Talentos & RH',
        department: 'Operações & RH',
        salaryBrl: 9200,
        netAmountBrl: 9200,
        status: 'Pago',
        scheduledPaymentDate: '05/07/2026',
        actualPaymentDate: '05/07/2026',
        paymentMethod: 'Transferência',
        bankName: '237 - Banco Bradesco',
        accountDetails: 'Ag 2041 · CP 48201-9',
        pixKey: 'beatriz.v@velatrix.ai',
        receiptHash: '0xbca8192401824bca8102948bc0192840192840192844a91c78190da8214bca81',
        pixTransactionId: 'TED-237-20260705-0038192-BRD'
      },
      {
        id: 'pay_07_06',
        employeeId: 'emp_06',
        employeeName: 'Dr. Leonardo Castilho',
        email: 'leonardo.castilho@velatrix.ai',
        roleTitle: 'Consultor Jurídico & DPO',
        department: 'Jurídico & Compliance',
        salaryBrl: 12500,
        netAmountBrl: 12500,
        status: 'Pago',
        scheduledPaymentDate: '05/07/2026',
        actualPaymentDate: '05/07/2026',
        paymentMethod: 'PIX',
        bankName: '077 - Banco Inter',
        accountDetails: 'Ag 0001 · CC 9481023-7',
        pixKey: 'leonardo.castilho@velatrix.ai',
        receiptHash: '0x1824bca8102948bc0192840192840192844a91c78190da8214bca8192401824b',
        pixTransactionId: 'E004169682026070514109283741'
      },
      {
        id: 'pay_07_07',
        employeeId: 'emp_07',
        employeeName: 'Juliana Pires',
        email: 'juliana.pires@velatrix.ai',
        roleTitle: 'Controller & Contadora Chefe',
        department: 'Financeiro & Controladoria',
        salaryBrl: 10000,
        netAmountBrl: 10000,
        status: 'Pago',
        scheduledPaymentDate: '05/07/2026',
        actualPaymentDate: '05/07/2026',
        paymentMethod: 'PIX',
        bankName: '341 - Itaú Unibanco',
        accountDetails: 'Ag 1590 · CC 38194-2',
        pixKey: '401.982.170-44',
        receiptHash: '0x948bc0192840192840192844a91c78190da8214bca8192401824bca8102948bc',
        pixTransactionId: 'E000381662026070515209283741'
      },
      {
        id: 'pay_07_08',
        employeeId: 'emp_08',
        employeeName: 'Thiago Valente',
        email: 'thiago.valente@velatrix.ai',
        roleTitle: 'Engenheiro de Integração de ERP',
        department: 'Engenharia & Implantação',
        salaryBrl: 7000,
        netAmountBrl: 7000,
        status: 'Pago',
        scheduledPaymentDate: '05/07/2026',
        actualPaymentDate: '05/07/2026',
        paymentMethod: 'Transferência',
        bankName: '104 - Caixa Econômica Federal',
        accountDetails: 'Ag 0219 · CP 0019482-3',
        pixKey: 'thiago.valente@velatrix.ai',
        receiptHash: '0x0192840192844a91c78190da8214bca8192401824bca8102948bc019284019284',
        pixTransactionId: 'TED-104-20260705-0018294-CEF'
      }
    ]
  },
  {
    competencyMonth: '06/2026',
    competencyLabel: 'Junho / 2026 (Competência Fechada)',
    totalPayrollBrl: 88500,
    totalEmployees: 7,
    paidEmployeesCount: 7,
    pendingEmployeesCount: 0,
    scheduledEmployeesCount: 0,
    nextScheduledDate: '05/06/2026',
    closingDate: '05/06/2026',
    status: 'Fechado & Homologado',
    eSocialProtocol: 'eSocial-20260605-194038-VLX',
    sefipHash: '0x7f20b81092840192844a91c78190da8214bca8192401824bca8102948bc01928',
    records: [
      {
        id: 'pay_06_01',
        employeeId: 'emp_01',
        employeeName: 'Guilherme Siqueira',
        email: 'guilherme.siqueira@velatrix.ai',
        roleTitle: 'Head Comercial & Enterprise Sales',
        department: 'Comercial',
        salaryBrl: 14000,
        netAmountBrl: 14000,
        status: 'Pago',
        scheduledPaymentDate: '05/06/2026',
        actualPaymentDate: '05/06/2026',
        paymentMethod: 'PIX',
        bankName: '341 - Itaú Unibanco',
        accountDetails: 'Ag 0842 · CC 29481-3',
        pixKey: 'guilherme.siqueira@velatrix.ai',
        receiptHash: '0x20b81092840192844a91c78190da8214bca8192401824bca8102948bc0192840',
        pixTransactionId: 'E000381662026060509301827364'
      },
      {
        id: 'pay_06_02',
        employeeId: 'emp_02',
        employeeName: 'Camila Mendonça',
        email: 'camila.mendonca@velatrix.ai',
        roleTitle: 'Account Executive Senior',
        department: 'Comercial',
        salaryBrl: 9500,
        netAmountBrl: 9500,
        status: 'Pago',
        scheduledPaymentDate: '05/06/2026',
        actualPaymentDate: '05/06/2026',
        paymentMethod: 'PIX',
        bankName: '260 - Nu Pagamentos (Nubank)',
        accountDetails: 'Ag 0001 · CC 8841920-5',
        pixKey: '329.841.098-12',
        receiptHash: '0x840192844a91c78190da8214bca8192401824bca8102948bc019284020b81092',
        pixTransactionId: 'E182361202026060510151928374'
      },
      {
        id: 'pay_06_03',
        employeeId: 'emp_03',
        employeeName: 'Renato Faria',
        email: 'renato.faria@velatrix.ai',
        roleTitle: 'Diretor Geral de Operações (COO)',
        department: 'Operações & RH',
        salaryBrl: 17500,
        netAmountBrl: 17500,
        status: 'Pago',
        scheduledPaymentDate: '05/06/2026',
        actualPaymentDate: '05/06/2026',
        paymentMethod: 'PIX',
        bankName: '001 - Banco do Brasil',
        accountDetails: 'Ag 1824-1 · CC 50192-8',
        pixKey: 'renato.faria@velatrix.ai',
        receiptHash: '0x91c78190da8214bca8192401824bca8102948bc019284020b81092840192844a',
        pixTransactionId: 'E000000002026060511101928374'
      },
      {
        id: 'pay_06_04',
        employeeId: 'emp_04',
        employeeName: 'Lucas Silveira',
        email: 'lucas.silveira@velatrix.ai',
        roleTitle: 'Líder Técnico de Implantações',
        department: 'Engenharia & Implantação',
        salaryBrl: 11000,
        netAmountBrl: 11000,
        status: 'Pago',
        scheduledPaymentDate: '05/06/2026',
        actualPaymentDate: '05/06/2026',
        paymentMethod: 'PIX',
        bankName: '033 - Banco Santander',
        accountDetails: 'Ag 3145 · CC 13009412-1',
        pixKey: '+55 11 98765-4321',
        receiptHash: '0xda8214bca8192401824bca8102948bc019284020b81092840192844a91c78190',
        pixTransactionId: 'E003310022026060513401928374'
      },
      {
        id: 'pay_06_05',
        employeeId: 'emp_05',
        employeeName: 'Beatriz Vasconcelos',
        email: 'beatriz.v@velatrix.ai',
        roleTitle: 'Gerente de Talentos & RH',
        department: 'Operações & RH',
        salaryBrl: 9000,
        netAmountBrl: 9000,
        status: 'Pago',
        scheduledPaymentDate: '05/06/2026',
        actualPaymentDate: '05/06/2026',
        paymentMethod: 'Transferência',
        bankName: '237 - Banco Bradesco',
        accountDetails: 'Ag 2041 · CP 48201-9',
        pixKey: 'beatriz.v@velatrix.ai',
        receiptHash: '0xca8192401824bca8102948bc019284020b81092840192844a91c78190da8214b',
        pixTransactionId: 'TED-237-20260605-0028192-BRD'
      },
      {
        id: 'pay_06_06',
        employeeId: 'emp_06',
        employeeName: 'Dr. Leonardo Castilho',
        email: 'leonardo.castilho@velatrix.ai',
        roleTitle: 'Consultor Jurídico & DPO',
        department: 'Jurídico & Compliance',
        salaryBrl: 12500,
        netAmountBrl: 12500,
        status: 'Pago',
        scheduledPaymentDate: '05/06/2026',
        actualPaymentDate: '05/06/2026',
        paymentMethod: 'PIX',
        bankName: '077 - Banco Inter',
        accountDetails: 'Ag 0001 · CC 9481023-7',
        pixKey: 'leonardo.castilho@velatrix.ai',
        receiptHash: '0x1824bca8102948bc019284020b81092840192844a91c78190da8214bca819240',
        pixTransactionId: 'E004169682026060514501928374'
      },
      {
        id: 'pay_06_07',
        employeeId: 'emp_07',
        employeeName: 'Juliana Pires',
        email: 'juliana.pires@velatrix.ai',
        roleTitle: 'Controller & Contadora Chefe',
        department: 'Financeiro & Controladoria',
        salaryBrl: 10000,
        netAmountBrl: 10000,
        status: 'Pago',
        scheduledPaymentDate: '05/06/2026',
        actualPaymentDate: '05/06/2026',
        paymentMethod: 'PIX',
        bankName: '341 - Itaú Unibanco',
        accountDetails: 'Ag 1590 · CC 38194-2',
        pixKey: '401.982.170-44',
        receiptHash: '0x102948bc019284020b81092840192844a91c78190da8214bca8192401824bca8',
        pixTransactionId: 'E000381662026060515501928374'
      }
    ]
  }
];
