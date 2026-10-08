import { ServiceSegment } from '../../types/serviceDefinition';

export const TRIBUTARIO: ServiceSegment = {
  id: 'tributario',
  label: 'Recuperação & Inteligência Tributária',
  icon: 'ReceiptText',
  description: 'Auditoria fiscal, indébito tributário, PER/DCOMP e compensação administrativa homologada.'
};

export const PERICIA: ServiceSegment = {
  id: 'pericia',
  label: 'Perícia Judicial & Extrajudicial',
  icon: 'Scale',
  description: 'Laudos periciais cíveis, trabalhistas, contábeis, de engenharia e médicos com quesitos formais.'
};

export const PREVIDENCIARIO: ServiceSegment = {
  id: 'previdenciario',
  label: 'Especialista Previdenciário & INSS',
  icon: 'Calculator',
  description: 'Revisão da vida toda, cálculo de RMI, tempo especial e planejamento de aposentadoria.'
};

export const OBRAS_ENGENHARIA: ServiceSegment = {
  id: 'obras_engenharia',
  label: 'INSS-Obras & Aferição Indireta',
  icon: 'HardHat',
  description: 'Aferição indireta 11%, regularização CNO/CEI, aproveitamento de GFIP e redução de DISO/SERO.'
};

export const PRECATORIO: ServiceSegment = {
  id: 'precatorio',
  label: 'Precatórios & RPV Federais/Estaduais',
  icon: 'Coins',
  description: 'Cálculo de liquidação, deságio, cessão de crédito e compensação tributária conforme EC 113/2021.'
};

export const DIAGNOSTICO: ServiceSegment = {
  id: 'diagnostico',
  label: 'Diagnóstico & Proposta (Risco & ROI)',
  icon: 'Activity',
  description: 'Raio-X de solvência Altman Z-Score, sangria de caixa oculta e valuation de risco patrimonial.'
};

export const SEGURANCA_CIBER: ServiceSegment = {
  id: 'seguranca_ciber',
  label: 'AOS CyberSpy & ZeroVision',
  icon: 'ShieldCheck',
  description: 'Inteligência de ameaças ofensivas, dark web crawl, contenção em tempo real e proteção de transações.'
};

export const CONECTIVIDADE_ERP: ServiceSegment = {
  id: 'conectividade_erp',
  label: 'Conectividade & Enclave mTLS ERP',
  icon: 'Cpu',
  description: 'Conexão segura ponto-a-ponto com SAP, Protheus, Totvs e Oracle com assinatura em hardware.'
};

export const BASE_SEGMENTS: ServiceSegment[] = [
  TRIBUTARIO,
  PERICIA,
  PREVIDENCIARIO,
  OBRAS_ENGENHARIA,
  PRECATORIO,
  DIAGNOSTICO,
  SEGURANCA_CIBER,
  CONECTIVIDADE_ERP
];

export const SEGMENTS_CATALOG = BASE_SEGMENTS;
