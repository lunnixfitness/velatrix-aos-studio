/**
 * VELATRIX AOS · P14 · Casos de demonstração para o Shield de Risco.
 *
 * As checagens são reais (src/enterprise/riskShield.ts); os DADOS de entrada abaixo são
 * DEMO até existir a ingestão (Velatrix Connect) e a persistência. Nenhum resultado é
 * fixo: tudo é calculado na hora a partir destes casos.
 */
import {
  executar, exposicaoMulta, CHECKS_RECUPERACAO, CHECKS_PRECATORIO,
  type Esteira, type Flag, type Achado, type ContextoRecuperacao, type ContextoPrecatorio, type RiskCheck,
} from '../enterprise/riskShield.ts';
import { NormaRegistry, NORMAS_SEED } from '../enterprise/normaRef.ts';

export const normasShield = new NormaRegistry(NORMAS_SEED);

export interface CasoDemo { id: string; nome: string; descricao: string; }
export interface ResultadoShield {
  flag: Flag;
  achados: Achado[];
  catalogoCadastrado: boolean;
  exposicao?: { pct: number; multaCentavos: number; baseCentavos: number; excluidas: string[]; normaRefId: string };
}

const hoje = () => new Date().toISOString().slice(0, 10);
const anosAtras = (n: number, mes = '03', dia = '20') => `${new Date().getFullYear() - n}-${mes}-${dia}`;
const compAtras = (n: number, mes = '02') => `${new Date().getFullYear() - n}-${mes}`;

const RECUPERACAO: Record<string, { caso: CasoDemo; ctx: () => ContextoRecuperacao }> = {
  completo: {
    caso: { id: 'completo', nome: 'Caso A · dados completos', descricao: 'SPED, DCTF, histórico de PER/DCOMP e lista monofásica carregados' },
    ctx: () => ({
      dataPedido: hoje(),
      regrasMonofasico: [{ ncmPrefixo: '3303', vigenciaInicio: '2004-01-01', normaId: 'LEI:10147:2000' }, { ncmPrefixo: '3304', vigenciaInicio: '2004-01-01', normaId: 'LEI:10147:2000' }],
      codigosReceitaVedados: ['[CÓDIGO VEDADO DEMO]'],
      creditos: [
        { id: 'CR-01', tributo: 'PIS', competencia: compAtras(2), dataPagamento: anosAtras(2), valorCentavos: 1_842_000, ncm: '3303.00.10', dataFatoGerador: anosAtras(2, '02', '10'), spedValorCentavos: 1_842_000, dctfValorCentavos: 1_842_000, perdcompAnteriores: [], debitoCompensar: { codigoReceita: '[CÓDIGO LIVRE DEMO]' } },
        { id: 'CR-02', tributo: 'COFINS', competencia: compAtras(3), dataPagamento: anosAtras(3), valorCentavos: 2_981_000, ncm: '3304.99.90', dataFatoGerador: anosAtras(3, '02', '10'), spedValorCentavos: 2_981_000, dctfValorCentavos: 2_610_000, perdcompAnteriores: [] },
      ],
    }),
  },
  riscos: {
    caso: { id: 'riscos', nome: 'Caso B · crédito antigo e duplicado', descricao: 'Inclui pagamento de mais de 5 anos e crédito já usado em PER/DCOMP' },
    ctx: () => ({
      dataPedido: hoje(),
      creditos: [
        { id: 'CR-10', tributo: 'PIS', competencia: compAtras(6), dataPagamento: anosAtras(6), valorCentavos: 950_000, perdcompAnteriores: [] },
        { id: 'CR-11', tributo: 'COFINS', competencia: compAtras(1), dataPagamento: anosAtras(1), valorCentavos: 4_400_000, perdcompAnteriores: [{ numero: '[PER/DCOMP DEMO]', creditoId: 'CR-11' }] },
      ],
    }),
  },
  vazio: {
    caso: { id: 'vazio', nome: 'Caso C · sem documentos ingeridos', descricao: 'Nenhuma fonte conectada ainda' },
    ctx: () => ({ dataPedido: hoje(), creditos: [{ id: 'CR-20', tributo: 'IRPJ', competencia: compAtras(1), valorCentavos: 100_000 }] }),
  },
};

const PRECATORIO: Record<string, { caso: CasoDemo; ctx: () => ContextoPrecatorio }> = {
  cessao: {
    caso: { id: 'cessao', nome: 'Precatório A · autos ingeridos', descricao: 'Autos e RREO disponíveis; há cessão anterior registrada' },
    ctx: () => ({
      cessoesRegistradas: [{ cessionario: '[CESSIONÁRIO DEMO]', data: anosAtras(1, '08', '14') }], penhoras: [],
      capacidadePagamento: { rclCentavos: 1_000_000_000_00, estoquePrecatoriosCentavos: 85_000_000_00, fonte: 'Siconfi RREO (DEMO)' },
      limiteEstoqueRclPct: 10, natureza: 'ALIMENTAR', posicaoOrdemCronologica: null,
    }),
  },
  semFonte: {
    caso: { id: 'semFonte', nome: 'Precatório B · sem fontes', descricao: 'Autos e Siconfi ainda não conectados' },
    ctx: () => ({}),
  },
};

export function casosDaEsteira(esteira: Esteira): CasoDemo[] {
  if (esteira === 'RECUPERACAO_TRIBUTARIA') return Object.values(RECUPERACAO).map((x) => x.caso);
  if (esteira === 'PRECATORIA') return Object.values(PRECATORIO).map((x) => x.caso);
  return [];
}

export function rodarShield(esteira: Esteira, casoId: string): ResultadoShield {
  const ctx = { normas: normasShield, hoje: hoje() };
  if (esteira === 'RECUPERACAO_TRIBUTARIA') {
    const def = RECUPERACAO[casoId] ?? RECUPERACAO.completo;
    const input = def.ctx();
    const r = executar(CHECKS_RECUPERACAO, input, ctx);
    const base = input.creditos.reduce((s, c) => s + c.valorCentavos, 0);
    const m = exposicaoMulta(base, normasShield);
    return { ...r, catalogoCadastrado: true, exposicao: { pct: m.pct, multaCentavos: m.multaCentavos, baseCentavos: base, excluidas: m.excluidas, normaRefId: m.normaRefId } };
  }
  if (esteira === 'PRECATORIA') {
    const def = PRECATORIO[casoId] ?? PRECATORIO.cessao;
    return { ...executar(CHECKS_PRECATORIO, def.ctx(), ctx), catalogoCadastrado: true };
  }
  const vazio: RiskCheck<unknown>[] = [];
  return { ...executar(vazio, {}, ctx), catalogoCadastrado: false };
}
