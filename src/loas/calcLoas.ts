/**
 * VELATRIX AOS · P27 · Motor de Cálculo LOAS / BPC (Função Pura)
 *
 * Princípios Arquiteturais:
 * 1. Função 100% pura: sem I/O, sem chamadas de rede, sem relógio não injetado.
 * 2. Determinismo absoluto: mesma entrada + mesma competência + mesmas regras → mesmo resultado + mesmo hash.
 * 3. Proibido float para dinheiro: todos os cômputos em números inteiros (centavos).
 * 4. Divisão com arredondamento Half-Even (Banker's rounding) para divisão per capita e fração de SM.
 * 5. Selo canônico SHA-256 via sha256HexSync.
 */

import type {
  CasoLoas,
  MembroComputado,
  MembroExcluido,
  DeducaoAceita,
  DeducaoRecusada,
  ElegibilidadeFlexibilizacao,
  LinhaMemoriaCalculo,
  ResultadoCalculoLoas
} from './tipos.ts';
import type { RegrasLoas } from './regrasLoas.ts';
import { getSalarioMinimo } from './regrasLoas.ts';
import { sha256HexSync } from '../shared/crypto/sha256Sync.ts';

/**
 * Arredondamento bancário (Half-Even) para divisão inteira em centavos.
 * Quando o resto é exatamente a metade do divisor, arredonda para o inteiro par mais próximo.
 */
export function divideHalfEven(numeradorCentavos: number, divisor: number): number {
  if (divisor === 0) throw new Error('Divisão por zero no cálculo per capita.');
  if (numeradorCentavos === 0) return 0;

  const quociente = Math.floor(numeradorCentavos / divisor);
  const resto = numeradorCentavos % divisor;

  if (resto === 0) return quociente;

  const dobroResto = resto * 2;
  if (dobroResto < divisor) {
    return quociente;
  }
  if (dobroResto > divisor) {
    return quociente + 1;
  }
  // Exatamente metade: aproxima para o par mais próximo
  return quociente % 2 === 0 ? quociente : quociente + 1;
}

/**
 * Calcula idade em anos completos entre duas datas ISO (AAAA-MM-DD).
 */
export function calcularIdadeEmAnos(dataNascimentoIso: string, dataReferenciaIso: string): number {
  if (!dataNascimentoIso || !dataReferenciaIso) return 0;
  const [anoNasc, mesNasc, diaNasc] = dataNascimentoIso.slice(0, 10).split('-').map(Number);
  const [anoRef, mesRef, diaRef] = dataReferenciaIso.slice(0, 10).split('-').map(Number);

  if (isNaN(anoNasc) || isNaN(anoRef)) return 0;

  let anos = anoRef - anoNasc;
  if (mesRef < mesNasc || (mesRef === mesNasc && diaRef < diaNasc)) {
    anos--;
  }
  return Math.max(0, anos);
}

/**
 * Formata valor em centavos para exibição em moeda brasileira (R$).
 */
export function formatarCentavosEmReais(centavos: number): string {
  const negativo = centavos < 0;
  const abs = Math.abs(centavos);
  const inteiros = Math.floor(abs / 100);
  const resto = abs % 100;
  const inteirosFormatados = inteiros.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavosFormatados = resto.toString().padStart(2, '0');
  return `${negativo ? '-' : ''}R$ ${inteirosFormatados},${centavosFormatados}`;
}

/**
 * Serialização canônica determinística para hash SHA-256 estável.
 */
function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}';
}

/**
 * Motor central de cálculo do benefício LOAS/BPC.
 */
export function calcularLoas(
  caso: CasoLoas,
  regras: RegrasLoas,
  competencia: string
): ResultadoCalculoLoas {
  // 1. Obter Salário Mínimo da competência (Lança erro se não cadastrado)
  const salarioMinimoCentavos = getSalarioMinimo(competencia);

  // Data de referência para verificação etária
  const dataReferencia = caso.requerimentoAdministrativo?.dataIndeferimento || `${competencia}-01`;

  // 2. Limite legal objetivo (fração de SM com arredondamento Half-Even)
  const limiteCentavos = divideHalfEven(
    salarioMinimoCentavos * regras.limiteRendaPerCapitaNumerador,
    regras.limiteRendaPerCapitaDenominador
  );

  // 3. Filtrar e validar composição do grupo familiar
  const membrosComputados: MembroComputado[] = [];
  const membrosExcluidos: MembroExcluido[] = [];

  // Garante que o requerente seja sempre avaliado (mesmo se grupo vier vazio)
  const grupoCompleto = [...caso.grupo];
  const requerenteNoGrupo = grupoCompleto.some(
    m => m.parentesco === 'REQUERENTE' || (caso.requerente && m.id === caso.requerente.id)
  );

  if (!requerenteNoGrupo && caso.requerente) {
    grupoCompleto.unshift({
      id: caso.requerente.id,
      nome: caso.requerente.nome,
      parentesco: 'REQUERENTE',
      dataNascimento: caso.requerente.dataNascimento,
      mesmoTeto: true,
      rendaBrutaCentavos: 0
    });
  }

  for (const membro of grupoCompleto) {
    if (!membro.mesmoTeto) {
      membrosExcluidos.push({
        membro,
        motivo: 'Membro não reside sob o mesmo teto (art. 20, § 1º da Lei nº 8.742/1993)'
      });
      continue;
    }

    if (!regras.parentescosComputados.includes(membro.parentesco) || membro.parentesco === 'OUTRO') {
      membrosExcluidos.push({
        membro,
        motivo: 'Grau de parentesco não integra o rol legal da família para BPC (art. 20, § 1º da Lei nº 8.742/1993)'
      });
      continue;
    }

    // Membro aceito no cômputo
    const idade = calcularIdadeEmAnos(membro.dataNascimento, dataReferencia);
    let rendaConsiderada = membro.rendaBrutaCentavos;
    let justificativaExclusao: string | undefined;
    let exclusaoAplicada = membro.rendaExcluida?.motivo;

    if (membro.rendaExcluida) {
      if (membro.rendaExcluida.motivo === 'BPC_OUTRO_MEMBRO') {
        rendaConsiderada = 0;
        justificativaExclusao = 'Exclusão legal de BPC auferido por outro membro do grupo (art. 20, § 14 da Lei nº 8.742/1993)';
      } else if (membro.rendaExcluida.motivo === 'BENEFICIO_ATE_1SM_IDOSO_OU_PCD') {
        rendaConsiderada = 0;
        justificativaExclusao = 'Exclusão de benefício previdenciário/assistencial de até 1 SM de idoso ou PcD (art. 34, parágrafo único do Estatuto do Idoso e RE 580.963 / Tema 644 STJ)';
      }
    }

    membrosComputados.push({
      id: membro.id,
      nome: membro.nome,
      parentesco: membro.parentesco,
      idadeAnos: idade,
      rendaBrutaCentavos: membro.rendaBrutaCentavos,
      rendaConsideradaCentavos: rendaConsiderada,
      exclusaoRendaAplicada: exclusaoAplicada,
      justificativaExclusao
    });
  }

  // 4. Apuração da Renda Bruta Total Computada
  const rendaBrutaTotalCentavos = membrosComputados.reduce(
    (acc, m) => acc + m.rendaConsideradaCentavos,
    0
  );

  // 5. Apuração de Deduções de Despesas de Saúde
  const deducoesAceitas: DeducaoAceita[] = [];
  const deducoesRecusadas: DeducaoRecusada[] = [];

  for (const despesa of caso.despesas) {
    if (despesa.disponivelNoSUS) {
      deducoesRecusadas.push({
        despesa,
        motivo: 'Despesa fornecida gratuitamente pela rede pública de saúde (SUS)'
      });
      continue;
    }

    if (!despesa.comprovanteDocId || despesa.comprovanteDocId.trim() === '') {
      deducoesRecusadas.push({
        despesa,
        motivo: 'Ausência de documento comprobatório idôneo (receita médica ou laudo/cupom fiscal)'
      });
      continue;
    }

    deducoesAceitas.push({
      despesa,
      valorCentavos: despesa.valorMensalCentavos
    });
  }

  const totalDeducoesAceitasCentavos = deducoesAceitas.reduce(
    (acc, d) => acc + d.valorCentavos,
    0
  );

  // Renda Líquida nunca pode ser negativa
  const rendaLiquidaCentavos = Math.max(0, rendaBrutaTotalCentavos - totalDeducoesAceitasCentavos);

  // 6. Cômputo Per Capita
  const totalMembrosComputados = membrosComputados.length > 0 ? membrosComputados.length : 1;
  const perCapitaCentavos = divideHalfEven(rendaLiquidaCentavos, totalMembrosComputados);

  // 7. Avaliação de Elegibilidade
  const elegivelCriterioObjetivo = perCapitaCentavos <= limiteCentavos;

  let elegivelPorFlexibilizacao: ElegibilidadeFlexibilizacao = 'NAO_AVALIADO';
  if (!elegivelCriterioObjetivo) {
    // Patamar de flexibilização: até 1/2 salário mínimo per capita (Jurisprudência STF RE 567.985 / Tema 173 TNU)
    const patamarMeioSm = divideHalfEven(salarioMinimoCentavos, 2);
    if (perCapitaCentavos <= patamarMeioSm || totalDeducoesAceitasCentavos > 0) {
      elegivelPorFlexibilizacao = 'POSSIVEL';
    } else {
      elegivelPorFlexibilizacao = 'IMPROVAVEL';
    }
  }

  // 8. Verificação de Pré-Requisitos e Pendências
  const pendencias: string[] = [];

  if (!caso.cadUnicoAtualizado) {
    pendencias.push('CadÚnico não atualizado nos últimos 24 meses (obrigatório para BPC/LOAS).');
  }

  const reqAdm = caso.requerimentoAdministrativo;
  const temRequerimentoValido = Boolean(reqAdm?.numeroNB || reqAdm?.dataIndeferimento || reqAdm?.moraInss);
  if (!temRequerimentoValido) {
    pendencias.push('Ausência de prévio requerimento administrativo com indeferimento ou mora do INSS (Tema 350 STF).');
  }

  // Verificação específica por categoria
  if (caso.categoria === 'IDOSO') {
    const idadeRequerente = calcularIdadeEmAnos(caso.requerente.dataNascimento, dataReferencia);
    if (idadeRequerente < regras.idadeMinimaIdoso) {
      pendencias.push(
        `Requerente não atingiu a idade mínima legal de 65 anos na data de referência (${idadeRequerente} anos apurados).`
      );
    }
  } else if (caso.categoria === 'DEFICIENCIA') {
    if (!caso.requerente.laudoPcdImpedimentoLongoPrazo) {
      pendencias.push(
        'Ausência de comprovação de impedimento de longo prazo (mínimo de 2 anos) mediante laudo/perícia médica.'
      );
    }
  }

  // 9. Construção da Memória de Cálculo Auditável
  const memoriaDeCalculo: LinhaMemoriaCalculo[] = [
    {
      ordem: 1,
      passo: 'Competência & Salário Mínimo de Referência',
      formula: `SM(${competencia})`,
      valor: formatarCentavosEmReais(salarioMinimoCentavos),
      detalhe: 'Valor oficial vigente na competência de análise'
    },
    {
      ordem: 2,
      passo: 'Limite Legal de Renda Per Capita (1/4 SM)',
      formula: `SM / 4 = ${salarioMinimoCentavos} / 4`,
      valor: formatarCentavosEmReais(limiteCentavos),
      detalhe: 'Critério objetivo do Art. 20, § 3º da Lei nº 8.742/1993'
    },
    {
      ordem: 3,
      passo: 'Grupo Familiar Sob o Mesmo Teto',
      formula: `Membros computados: ${membrosComputados.length} | Excluídos: ${membrosExcluidos.length}`,
      valor: `${membrosComputados.length} ${membrosComputados.length === 1 ? 'pessoa' : 'pessoas'}`,
      detalhe: membrosExcluidos.length > 0 
        ? `${membrosExcluidos.length} membro(s) descartado(s) por residir fora ou parentesco fora do rol`
        : 'Todos os membros residem sob o mesmo teto e integram o rol legal'
    },
    {
      ordem: 4,
      passo: 'Renda Bruta Total Familiar Computada',
      formula: membrosComputados.map(m => `${m.nome}: ${formatarCentavosEmReais(m.rendaConsideradaCentavos)}`).join(' + ') || 'R$ 0,00',
      valor: formatarCentavosEmReais(rendaBrutaTotalCentavos),
      detalhe: 'Excluídos benefícios de até 1 SM de idoso/PcD e outros BPC'
    },
    {
      ordem: 5,
      passo: 'Deduções Médicas e de Saúde Aprovadas',
      formula: deducoesAceitas.length > 0
        ? deducoesAceitas.map(d => `${d.despesa.categoria}: -${formatarCentavosEmReais(d.valorCentavos)}`).join(' ')
        : 'Nenhuma dedução elegível',
      valor: formatarCentavosEmReais(totalDeducoesAceitasCentavos),
      detalhe: `${deducoesAceitas.length} aprovada(s) (não-SUS + comprovante), ${deducoesRecusadas.length} recusada(s)`
    },
    {
      ordem: 6,
      passo: 'Renda Líquida Familiar Apurada',
      formula: `max(0, Renda Bruta - Deduções) = max(0, ${formatarCentavosEmReais(rendaBrutaTotalCentavos)} - ${formatarCentavosEmReais(totalDeducoesAceitasCentavos)})`,
      valor: formatarCentavosEmReais(rendaLiquidaCentavos),
      detalhe: 'Base para o cálculo per capita'
    },
    {
      ordem: 7,
      passo: 'Renda Per Capita Familiar',
      formula: `Renda Líquida / Membros = ${rendaLiquidaCentavos} / ${totalMembrosComputados} (Half-Even)`,
      valor: formatarCentavosEmReais(perCapitaCentavos),
      detalhe: 'Divisão exata em centavos com arredondamento bancário'
    },
    {
      ordem: 8,
      passo: 'Confronto com Critério Objetivo (1/4 SM)',
      formula: `${formatarCentavosEmReais(perCapitaCentavos)} <= ${formatarCentavosEmReais(limiteCentavos)}`,
      valor: elegivelCriterioObjetivo ? 'ELEGÍVEL (<= 1/4 SM)' : 'FORA DO CRITÉRIO OBJETIVO (> 1/4 SM) — AVALIAR MISERABILIDADE',
      detalhe: elegivelCriterioObjetivo 
        ? 'Preenche o critério objetivo de miserabilidade legal' 
        : `Possibilidade de flexibilização judicial via STF RE 567.985: ${elegivelPorFlexibilizacao}`
    }
  ];

  // 10. Geração do Selo Criptográfico SHA-256 Canônico
  const payloadParaHash = {
    casoId: caso.id,
    tenantId: caso.tenantId,
    categoria: caso.categoria,
    competencia,
    versaoRegras: regras.versao,
    salarioMinimoCentavos,
    limiteCentavos,
    totalMembros: totalMembrosComputados,
    membrosComputados: membrosComputados.map(m => ({
      id: m.id,
      nome: m.nome,
      parentesco: m.parentesco,
      rendaBrutaCentavos: m.rendaBrutaCentavos,
      rendaConsideradaCentavos: m.rendaConsideradaCentavos,
      exclusao: m.exclusaoRendaAplicada
    })),
    membrosExcluidos: membrosExcluidos.map(e => ({
      id: e.membro.id,
      motivo: e.motivo
    })),
    rendaBrutaTotalCentavos,
    totalDeducoesAceitasCentavos,
    deducoesAceitas: deducoesAceitas.map(d => ({
      categoria: d.despesa.categoria,
      valorCentavos: d.valorCentavos,
      docId: d.despesa.comprovanteDocId
    })),
    deducoesRecusadas: deducoesRecusadas.map(d => ({
      categoria: d.despesa.categoria,
      motivo: d.motivo
    })),
    rendaLiquidaCentavos,
    perCapitaCentavos,
    elegivelCriterioObjetivo,
    elegivelPorFlexibilizacao,
    pendencias
  };

  const hash = sha256HexSync(canonicalStringify(payloadParaHash));

  return {
    competencia,
    salarioMinimoCentavos,
    membrosComputados,
    membrosExcluidos,
    rendaBrutaTotalCentavos,
    totalDeducoesAceitasCentavos,
    deducoesAceitas,
    deducoesRecusadas,
    rendaLiquidaCentavos,
    perCapitaCentavos,
    limiteCentavos,
    elegivelCriterioObjetivo,
    elegivelPorFlexibilizacao,
    pendencias,
    memoriaDeCalculo,
    versaoRegras: regras.versao,
    hash
  };
}
