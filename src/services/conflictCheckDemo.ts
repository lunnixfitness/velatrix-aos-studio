/**
 * VELATRIX AOS · Conflict Check · base DEMO (P17).
 * Entidades e documentos FICTÍCIOS (dígitos verificadores válidos, sem correspondência com pessoas reais).
 * Em produção esta base vem do Postgres do tenant (conflict_entities), nunca do front.
 */
import type { EntidadeIndexada, SolicitacaoConflito } from '../enterprise/conflictCheck.ts';

/** Tenant jurídico de demonstração (P22) — mesmo id do tenant ativo padrão. */
export const TENANT_DEMO = 'tenant_monteiro_law';

export const BASE_CONFLITOS_DEMO: EntidadeIndexada[] = [
  {
    id: 'ENT-0001', tenantId: TENANT_DEMO, nome: 'Alpha Construções Civis LTDA', documento: '12.345.678/0002-76', tipo: 'PJ',
    papel: 'PARTE_CONTRARIA', grupoEconomicoId: 'GRP-ALPHA', relacionadas: [], barreiras: [],
    materias: [{ id: 'PROC-0012938-2025', titulo: 'Reclamação trabalhista coletiva', area: 'Trabalhista', responsavel: 'Dr. Roberto Alves', status: 'ATIVA' }],
  },
  {
    id: 'ENT-0002', tenantId: TENANT_DEMO, nome: 'Alpha Incorporadora Participações S.A.', documento: '30.229.984/0001-48', tipo: 'PJ',
    papel: 'CLIENTE_ATIVO', grupoEconomicoId: 'GRP-ALPHA', relacionadas: [], barreiras: [],
    materias: [{ id: 'MAT-2025-114', titulo: 'Recuperação tributária · ICMS-ST', area: 'Tributário', responsavel: 'Dra. Paula Menezes', status: 'ATIVA' }],
  },
  {
    id: 'ENT-0003', tenantId: TENANT_DEMO, nome: 'João C. Silva', documento: '111.444.777-35', tipo: 'PF',
    papel: 'CLIENTE_ATIVO', relacionadas: [], barreiras: [],
    materias: [{ id: 'TR-2024-88', titulo: 'Consultoria tributária · pessoa física', area: 'Tributário', responsavel: 'Dra. Paula Menezes', status: 'ATIVA' }],
  },
  {
    id: 'ENT-0004', tenantId: TENANT_DEMO, nome: 'Nexa Telecomunicações S.A.', documento: '90.712.045/0001-81', tipo: 'PJ',
    papel: 'CLIENTE_ATIVO', barreiras: ['CW-TRIB-01'],
    relacionadas: [
      { nome: 'Nexa Holding Participações LTDA', documento: '55.301.889/0001-39', papel: 'CONTROLADORA' },
      { nome: 'Marcos Xavier Gonçalves', documento: '229.833.415-34', papel: 'SOCIO' },
    ],
    materias: [{ id: 'MAT-2025-201', titulo: 'Recuperação PIS/COFINS monofásico', area: 'Tributário', responsavel: 'Dr. Caio Rezende', status: 'ATIVA' }],
  },
  {
    id: 'ENT-0005', tenantId: TENANT_DEMO, nome: 'Distribuidora Solaris Comércio LTDA', documento: '41.887.233/0001-35', tipo: 'PJ',
    papel: 'CLIENTE_INATIVO', inativoDesde: '2025-06-30', relacionadas: [], barreiras: [],
    materias: [{ id: 'MAT-2023-077', titulo: 'Perícia contábil · liquidação', area: 'Perícia Judicial', responsavel: 'Dr. Caio Rezende', status: 'ENCERRADA', encerradaEm: '2025-06-30' }],
  },
  {
    id: 'ENT-0006', tenantId: TENANT_DEMO, nome: 'Veloz Transportes S/A', documento: '66.024.117/0001-13', tipo: 'PJ',
    papel: 'PROSPECT_DECLINADO', relacionadas: [], barreiras: [], materias: [],
  },
  {
    id: 'ENT-0007', tenantId: TENANT_DEMO, nome: 'Fazenda Boa Esperança Agropecuária LTDA', documento: '77.190.302/0001-02', tipo: 'PJ',
    papel: 'PARTE_CONTRARIA', relacionadas: [], barreiras: [],
    materias: [{ id: 'PROC-0004471-2022', titulo: 'Execução de título rural', area: 'Contencioso Cível', responsavel: 'Dra. Lívia Prado', status: 'ENCERRADA', encerradaEm: '2024-03-12' }],
  },
  {
    id: 'ENT-0008', tenantId: TENANT_DEMO, nome: 'Thiago Souza Ferreira', documento: '381.726.459-37', tipo: 'PF',
    papel: 'TERCEIRO_INTERESSADO', relacionadas: [], barreiras: [],
    materias: [{ id: 'PROC-0020115-2024', titulo: 'Assistente técnico em perícia de engenharia', area: 'Perícia Judicial', responsavel: 'Dr. Caio Rezende', status: 'ATIVA' }],
  },
  {
    id: 'ENT-0009', tenantId: TENANT_DEMO, nome: 'Banco Meridional S.A.', documento: '84.550.012/0001-80', tipo: 'PJ',
    papel: 'PARTE_CONTRARIA', relacionadas: [], barreiras: [],
    materias: [{ id: 'PROC-0031002-2025', titulo: 'Revisional de contrato bancário', area: 'Contencioso Cível', responsavel: 'Dra. Lívia Prado', status: 'ATIVA' }],
  },
];

export interface CenarioConflito { id: string; rotulo: string; solicitacao: Omit<SolicitacaoConflito, 'id' | 'tenantId' | 'solicitanteId'> }

export const CENARIOS_CONFLITO: CenarioConflito[] = [
  {
    id: 'alpha', rotulo: 'Reestruturação · Construtora Alpha',
    solicitacao: {
      area: 'Societário', descricao: 'Reestruturação societária para aquisição da Construtora Alpha S.A.',
      alvos: [
        { nome: 'Construtora Alpha S.A.', documento: '12.345.678/0001-95', papel: 'NOVO_CLIENTE' },
        { nome: 'João Carlos da Silva', papel: 'SOCIO_ALVO' },
      ],
    },
  },
  {
    id: 'contra-cliente', rotulo: 'Ação contra cliente ativo',
    solicitacao: {
      area: 'Consumidor', descricao: 'Ação indenizatória contra operadora de telecom',
      alvos: [
        { nome: 'Marina Lopes Duarte', documento: '472.615.803-17', papel: 'NOVO_CLIENTE' },
        { nome: 'Nexa Telecomunicacoes SA', documento: '90.712.045/0001-81', papel: 'PARTE_CONTRARIA' },
      ],
    },
  },
  {
    id: 'fonetico', rotulo: 'Grafia divergente (fonético)',
    solicitacao: {
      area: 'Tributário', descricao: 'Planejamento tributário de pessoa física',
      alvos: [
        { nome: 'Marcos Chavier Gonsalves', papel: 'NOVO_CLIENTE' },
        { nome: 'Banco Meridional', papel: 'PARTE_CONTRARIA' },
      ],
    },
  },
  {
    id: 'limpo', rotulo: 'Sem conflito',
    solicitacao: {
      area: 'Previdenciário', descricao: 'Revisão de benefício previdenciário',
      alvos: [
        { nome: 'Helena Duarte Campos', documento: '563.490.217-70', papel: 'NOVO_CLIENTE' },
        { nome: 'Seguradora Horizonte', papel: 'PARTE_CONTRARIA' },
      ],
    },
  },
];
