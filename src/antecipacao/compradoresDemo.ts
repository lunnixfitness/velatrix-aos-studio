/**
 * Compradores FICTÍCIOS para o modo demonstração. Nenhum corresponde a instituição real.
 * Em produção, compradores são cadastrados pelo Super Admin após due diligence e contrato de parceria.
 */
import type { Comprador } from './tipos.ts';

const MI = 100_000_000; // R$ 1 milhão em centavos

export const COMPRADORES_DEMO: Comprador[] = [
  {
    id: 'cmp_demo_alfa', nome: 'Alfa Créditos Judiciais FIDC (fictício)', tipoEntidade: 'FIDC', cnpj: '00.000.000/0001-00', ativo: true, demo: true,
    taxaOriginacaoBps: 150,
    politica: {
      tipos: ['PRECATORIO', 'RPV'], esferas: ['FEDERAL'], naturezas: ['ALIMENTAR', 'COMUM'], tribunais: [],
      flagsAceitas: ['GREEN', 'YELLOW'], aceitaRegimeEspecial: false, aceitaHonorarios: true,
      ticketMinCentavos: 2_000_000, ticketMaxCentavos: 30 * MI,
      taxaAlvoAaBps: 1800, premioRiscoBps: { GREEN: 0, YELLOW: 600, RED: 0, NAO_AVALIADO: 1000 }, desagioMinBps: 800, validadeOfertaDias: 7,
    },
  },
  {
    id: 'cmp_demo_beta', nome: 'Beta Securitizadora de Ativos (fictício)', tipoEntidade: 'SECURITIZADORA', cnpj: '00.000.000/0002-00', ativo: true, demo: true,
    taxaOriginacaoBps: 200,
    politica: {
      tipos: ['PRECATORIO'], esferas: ['FEDERAL', 'ESTADUAL', 'MUNICIPAL'], naturezas: ['ALIMENTAR', 'COMUM'], tribunais: [],
      flagsAceitas: ['GREEN', 'YELLOW'], aceitaRegimeEspecial: true, aceitaHonorarios: true,
      ticketMinCentavos: 10_000_000, ticketMaxCentavos: 50 * MI,
      taxaAlvoAaBps: 2400, premioRiscoBps: { GREEN: 0, YELLOW: 800, RED: 0, NAO_AVALIADO: 1200 }, desagioMinBps: 1500, validadeOfertaDias: 5,
    },
  },
  {
    id: 'cmp_demo_gama', nome: 'Gama Precatórios Multiestratégia FIC (fictício)', tipoEntidade: 'FUNDO', cnpj: '00.000.000/0003-00', ativo: true, demo: true,
    taxaOriginacaoBps: 120,
    politica: {
      tipos: ['PRECATORIO', 'RPV'], esferas: ['FEDERAL', 'ESTADUAL'], naturezas: ['ALIMENTAR'], tribunais: [],
      flagsAceitas: ['GREEN'], aceitaRegimeEspecial: false, aceitaHonorarios: false,
      ticketMinCentavos: 5_000_000, ticketMaxCentavos: 20 * MI,
      taxaAlvoAaBps: 1650, premioRiscoBps: { GREEN: 0, YELLOW: 0, RED: 0, NAO_AVALIADO: 0 }, desagioMinBps: 600, validadeOfertaDias: 10,
    },
  },
  {
    id: 'cmp_demo_delta', nome: 'Delta RPV Express (fictício)', tipoEntidade: 'FIDC', cnpj: '00.000.000/0004-00', ativo: true, demo: true,
    taxaOriginacaoBps: 250,
    politica: {
      tipos: ['RPV'], esferas: ['FEDERAL', 'ESTADUAL', 'MUNICIPAL'], naturezas: ['ALIMENTAR', 'COMUM'], tribunais: [],
      flagsAceitas: ['GREEN', 'YELLOW'], aceitaRegimeEspecial: true, aceitaHonorarios: true,
      ticketMinCentavos: 300_000, ticketMaxCentavos: 2 * MI,
      taxaAlvoAaBps: 3000, premioRiscoBps: { GREEN: 0, YELLOW: 1000, RED: 0, NAO_AVALIADO: 1500 }, desagioMinBps: 500, validadeOfertaDias: 3,
    },
  },
];
