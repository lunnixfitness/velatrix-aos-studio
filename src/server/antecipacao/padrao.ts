/**
 * VELATRIX AOS · Antecipação · montagem padrão (server.ts)
 *
 * DEMO_MODE: compradores fictícios, pagamento simulável e exemplos por escritório.
 * Produção: lista de compradores vazia até o cadastro de parceiros reais (com contrato e due diligence);
 * pagamento só via webhook HMAC do comprador; quatro olhos ligado.
 */
import type { Express } from 'express';
import { IS_DEMO_MODE } from '../../lib/demoMode.ts';
import { getSalarioMinimo } from '../../loas/regrasLoas.ts';
import { digitoCnj } from '../../antecipacao/motor.ts';
import { COMPRADORES_DEMO } from '../../antecipacao/compradoresDemo.ts';
import type { Comprador } from '../../antecipacao/tipos.ts';
import { ServicoAntecipacao, type CtxAntecipacao } from './servico.ts';
import { registerAntecipacaoRoutes } from './routes.ts';

const cnj = (n7: string, ano: string, j: string, tr: string, or: string) => `${n7}-${digitoCnj(n7, ano, j, tr, or)}.${ano}.${j}.${tr}.${or}`;
const SEM_PENDENCIAS = { penhoraConhecida: false, herdeirosPendentes: false, acaoRescisoria: false, impugnacaoCalculosPendente: false };

/** Créditos FICTÍCIOS (nomes e documentos de teste) para demonstrar triagem GREEN/YELLOW/RED e ofertas. */
export const EXEMPLOS_DEMO = (hoje: string): unknown[] => {
  const ano = Number(hoje.slice(0, 4));
  return [
    {
      tipo: 'PRECATORIO', numeroProcesso: cnj('0012345', String(ano - 3), '4', '03', '6100'), tribunal: 'TRF3', esfera: 'FEDERAL', enteDevedor: 'União',
      natureza: 'ALIMENTAR', credor: { nome: 'Cliente Demo A (fictício)', documento: '52998224725', dataNascimento: '1958-05-10' },
      valorFaceCentavos: 48_500_000, dataBase: `${ano}-07-01`, dataRequisicao: `${ano}-03-20`, transitoEmJulgado: true,
      honorariosContratuaisBps: 3000, honorariosSucumbenciaisCentavos: 0, cessoesAnteriores: 0, declaracoes: SEM_PENDENCIAS,
      parcelasParaAntecipar: ['CREDOR', 'HONORARIOS_CONTRATUAIS'],
    },
    {
      tipo: 'RPV', numeroProcesso: cnj('0004567', String(ano - 2), '4', '01', '3400'), tribunal: 'TRF1', esfera: 'FEDERAL', enteDevedor: 'INSS',
      natureza: 'ALIMENTAR', credor: { nome: 'Cliente Demo B (fictício)', documento: '11144477735' },
      valorFaceCentavos: 6_800_000, dataBase: `${hoje.slice(0, 7)}-01`, dataRequisicao: hoje, transitoEmJulgado: true,
      honorariosContratuaisBps: 2000, honorariosSucumbenciaisCentavos: 0, cessoesAnteriores: 0, declaracoes: SEM_PENDENCIAS,
      parcelasParaAntecipar: ['CREDOR'],
    },
    {
      tipo: 'PRECATORIO', numeroProcesso: cnj('1023456', String(ano - 6), '8', '26', '0053'), tribunal: 'TJSP', esfera: 'ESTADUAL', enteDevedor: 'Estado de São Paulo', ufEnte: 'SP',
      natureza: 'COMUM', credor: { nome: 'Empresa Demo C Ltda (fictícia)', documento: '11222333000181' },
      valorFaceCentavos: 132_000_000, dataBase: `${ano}-01-01`, dataRequisicao: `${ano - 1}-06-10`, transitoEmJulgado: true,
      honorariosContratuaisBps: 2000, honorariosSucumbenciaisCentavos: 8_000_000, cessoesAnteriores: 1, declaracoes: SEM_PENDENCIAS,
      parcelasParaAntecipar: ['CREDOR', 'HONORARIOS_SUCUMBENCIAIS'],
    },
    {
      tipo: 'PRECATORIO', numeroProcesso: cnj('0007788', String(ano - 4), '8', '19', '0001'), tribunal: 'TJRJ', esfera: 'MUNICIPAL', enteDevedor: 'Município de Niterói', ufEnte: 'RJ',
      natureza: 'COMUM', credor: { nome: 'Cliente Demo D (fictício)', documento: '39053344705' },
      valorFaceCentavos: 21_000_000, dataBase: `${ano}-04-01`, dataRequisicao: `${ano}-02-15`, transitoEmJulgado: true,
      honorariosContratuaisBps: 2500, honorariosSucumbenciaisCentavos: 0, cessoesAnteriores: 0, declaracoes: { ...SEM_PENDENCIAS, penhoraConhecida: true },
      parcelasParaAntecipar: ['CREDOR'],
    },
  ];
};

export function registerAntecipacaoRoutesPadrao(app: Express): ServicoAntecipacao {
  // Produção: substituir por repositório de compradores cadastrados pelo Super Admin.
  const compradores = (): Comprador[] => (IS_DEMO_MODE ? COMPRADORES_DEMO : []);
  const servico = new ServicoAntecipacao({
    compradores,
    salarioMinimo: getSalarioMinimo,
    quatroOlhos: !IS_DEMO_MODE,
    permitirPagamentoManual: IS_DEMO_MODE,
  });
  const semearDemo = (c: CtxAntecipacao): number => {
    let n = 0;
    for (const ex of EXEMPLOS_DEMO(new Date().toISOString().slice(0, 10))) {
      try { servico.cadastrar(c, ex, { demo: true }); n++; } catch { /* já semeado (409) */ }
    }
    return n;
  };
  registerAntecipacaoRoutes(app, servico, { compradores, demo: IS_DEMO_MODE, semearDemo });
  return servico;
}
