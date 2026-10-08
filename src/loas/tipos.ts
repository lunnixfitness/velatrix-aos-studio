/**
 * VELATRIX AOS · P27 · Esteira LOAS / BPC (Lei nº 8.742/1993)
 * Tipos de domínio e contratos de dados para elegibilidade e apuração.
 *
 * REGRA ABSOLUTA: Todos os valores monetários são expressos em CENTAVOS (número inteiro).
 * Proibido uso de float ou números fracionários para quantias monetárias.
 */

export type LoasCategoria = 'IDOSO' | 'DEFICIENCIA';

/**
 * Rol legal de parentesco familiar para fins de BPC (Lei 8.742/1993, Art. 20, § 1º):
 * "a família é composta pelo requerente, o cônjuge ou companheiro, os pais e, na ausência
 * de um deles, a madrasta ou o padrasto, os irmãos solteiros, os filhos e enteados solteiros
 * e os menores tutelados, desde que vivam sob o mesmo teto."
 */
export type ParentescoLoas =
  | 'REQUERENTE'
  | 'CONJUGE'
  | 'COMPANHEIRO'
  | 'PAI'
  | 'MAE'
  | 'PADRASTO'
  | 'MADRASTA'
  | 'IRMAO_SOLTEIRO'
  | 'FILHO_SOLTEIRO'
  | 'ENTEADO_SOLTEIRO'
  | 'MENOR_TUTELADO'
  | 'OUTRO';

export type MotivoExclusaoRenda = 
  | 'BPC_OUTRO_MEMBRO' 
  | 'BENEFICIO_ATE_1SM_IDOSO_OU_PCD';

export interface RendaExcluidaInfo {
  motivo: MotivoExclusaoRenda;
  detalhe?: string;
  valorCentavos?: number;
}

export interface MembroFamiliar {
  id: string;
  nome: string;
  parentesco: ParentescoLoas;
  dataNascimento: string; // Formato AAAA-MM-DD
  mesmoTeto: boolean;
  rendaBrutaCentavos: number; // Inteiro em centavos
  rendaExcluida?: RendaExcluidaInfo;
}

export type DespesaSaudeCategoria = 
  | 'MEDICAMENTO' 
  | 'TRATAMENTO' 
  | 'FRALDA' 
  | 'ALIMENTACAO_ESPECIAL' 
  | 'CONSULTA';

export interface DespesaSaude {
  id?: string;
  categoria: DespesaSaudeCategoria;
  descricao?: string;
  valorMensalCentavos: number; // Inteiro em centavos
  disponivelNoSUS: boolean;
  comprovanteDocId?: string; // ID do anexo ou documento comprobatório
}

export interface RequerimentoAdministrativo {
  numeroNB?: string;
  dataIndeferimento?: string; // Formato AAAA-MM-DD
  motivo?: string;
  moraInss?: boolean; // Se decorreu mais de 90 dias sem resposta da Autarquia
}

export interface RequerenteLoas {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string; // Formato AAAA-MM-DD
  /** Requisito para Categoria DEFICIENCIA: impedimento de longo prazo (mínimo 2 anos) comprovado por laudo */
  laudoPcdImpedimentoLongoPrazo?: boolean;
  dataLaudoPcd?: string;
}

export interface CasoLoas {
  id: string;
  tenantId: string;
  advogadoResponsavelId: string;
  categoria: LoasCategoria;
  requerente: RequerenteLoas;
  grupo: MembroFamiliar[];
  despesas: DespesaSaude[];
  cadUnicoAtualizado: boolean;
  requerimentoAdministrativo: RequerimentoAdministrativo;
  estagio: string;
  versaoRegras: string;
}

/** Linha da memória de cálculo auditável */
export interface LinhaMemoriaCalculo {
  ordem: number;
  passo: string;
  formula: string;
  valor: string;
  detalhe?: string;
}

export interface MembroComputado {
  id: string;
  nome: string;
  parentesco: ParentescoLoas;
  idadeAnos: number;
  rendaBrutaCentavos: number;
  rendaConsideradaCentavos: number;
  exclusaoRendaAplicada?: MotivoExclusaoRenda;
  justificativaExclusao?: string;
}

export interface MembroExcluido {
  membro: MembroFamiliar;
  motivo: string;
}

export interface DeducaoAceita {
  despesa: DespesaSaude;
  valorCentavos: number;
}

export interface DeducaoRecusada {
  despesa: DespesaSaude;
  motivo: string;
}

export type ElegibilidadeFlexibilizacao = 'NAO_AVALIADO' | 'POSSIVEL' | 'IMPROVAVEL';

export interface ResultadoCalculoLoas {
  competencia: string;
  salarioMinimoCentavos: number;
  membrosComputados: MembroComputado[];
  membrosExcluidos: MembroExcluido[];
  rendaBrutaTotalCentavos: number;
  totalDeducoesAceitasCentavos: number;
  deducoesAceitas: DeducaoAceita[];
  deducoesRecusadas: DeducaoRecusada[];
  rendaLiquidaCentavos: number;
  perCapitaCentavos: number;
  limiteCentavos: number;
  elegivelCriterioObjetivo: boolean;
  elegivelPorFlexibilizacao: ElegibilidadeFlexibilizacao;
  pendencias: string[];
  memoriaDeCalculo: LinhaMemoriaCalculo[];
  versaoRegras: string;
  hash: string;
}
