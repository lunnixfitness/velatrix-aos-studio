import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  UserCheck,
  Users,
  Copy,
  Check,
  Plus,
  Trash2,
  Scale,
  Calendar,
  DollarSign,
  HeartPulse,
  Printer,
  FileCheck
} from 'lucide-react';
import { ServiceDefinition } from '../../types/serviceDefinition';
import { LOAS_BPC_SERVICE } from '../../services/registry/definitions/loasService';
import { ServicePipelineStepper } from '../common/ServicePipelineStepper';
import { PipelineStageState } from '../../types/standardizedPipeline';
import {
  CasoLoas,
  MembroFamiliar,
  DespesaSaude,
  LoasCategoria,
  ParentescoLoas,
  DespesaSaudeCategoria,
  MotivoExclusaoRenda
} from '../../loas/tipos';
import { REGRAS_LOAS_V1, getSalarioMinimo, salarioMinimoPorCompetencia, TABELA_SALARIO_MINIMO_FONTES } from '../../loas/regrasLoas';
import { calcularLoas, formatarCentavosEmReais } from '../../loas/calcLoas';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import { LoasOperacaoPanel } from './loas/LoasOperacaoPanel';

interface LoasRunnerViewProps {
  service?: ServiceDefinition;
  tenantId: string;
  tenantName: string;
  tenantCnpj: string;
  onBack: () => void;
}

const PARENTESCOS: { id: ParentescoLoas; label: string }[] = [
  { id: 'REQUERENTE', label: 'Requerente' },
  { id: 'CONJUGE', label: 'Cônjuge' },
  { id: 'COMPANHEIRO', label: 'Companheiro(a)' },
  { id: 'PAI', label: 'Pai' },
  { id: 'MAE', label: 'Mãe' },
  { id: 'PADRASTO', label: 'Padrasto' },
  { id: 'MADRASTA', label: 'Madrasta' },
  { id: 'IRMAO_SOLTEIRO', label: 'Irmão(ã) Solteiro(a)' },
  { id: 'FILHO_SOLTEIRO', label: 'Filho(a) Solteiro(a)' },
  { id: 'ENTEADO_SOLTEIRO', label: 'Enteado(a) Solteiro(a)' },
  { id: 'MENOR_TUTELADO', label: 'Menor Tutelado' },
  { id: 'OUTRO', label: 'Outro (Fora do rol legal)' }
];

const CATEGORIAS_DESPESA: { id: DespesaSaudeCategoria; label: string }[] = [
  { id: 'MEDICAMENTO', label: 'Medicamento' },
  { id: 'TRATAMENTO', label: 'Tratamento / Terapia' },
  { id: 'FRALDA', label: 'Fralda Geriátrica' },
  { id: 'ALIMENTACAO_ESPECIAL', label: 'Alimentação Especial' },
  { id: 'CONSULTA', label: 'Consulta / Exame Periódico' }
];

export const LoasRunnerView: React.FC<LoasRunnerViewProps> = ({
  service = LOAS_BPC_SERVICE,
  tenantId,
  tenantName,
  tenantCnpj,
  onBack
}) => {
  // Competência padrão (2024-01 ou 2025-01)
  const [competencia, setCompetencia] = useState<string>(() => {
    const atual = new Date().toISOString().slice(0, 7);
    const disponiveis = Object.keys(salarioMinimoPorCompetencia).filter((c) => c <= atual).sort();
    return disponiveis[disponiveis.length - 1] ?? atual;
  });

  // Estado do Caso LOAS
  const [caso, setCaso] = useState<CasoLoas>({
    id: `CASO-LOAS-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    advogadoResponsavelId: 'adv-oab-sp-01',
    categoria: 'IDOSO',
    requerente: {
      id: 'req-01',
      nome: 'Raimundo Nonato de Souza',
      cpf: '381.902.441-29',
      dataNascimento: '1957-04-18', // 66 anos em 2024
      laudoPcdImpedimentoLongoPrazo: false
    },
    grupo: [
      {
        id: 'req-01',
        nome: 'Raimundo Nonato de Souza',
        parentesco: 'REQUERENTE',
        dataNascimento: '1957-04-18',
        mesmoTeto: true,
        rendaBrutaCentavos: 0
      },
      {
        id: 'conj-01',
        nome: 'Benedita Maria de Souza',
        parentesco: 'CONJUGE',
        dataNascimento: '1960-08-22',
        mesmoTeto: true,
        rendaBrutaCentavos: 40000 // R$ 400,00
      }
    ],
    despesas: [
      {
        id: 'desp-01',
        categoria: 'MEDICAMENTO',
        descricao: 'Remédios contínuos não fornecidos pelo posto de saúde',
        valorMensalCentavos: 12000, // R$ 120,00
        disponivelNoSUS: false,
        comprovanteDocId: 'DOC-RECEITA-FARMACIA-2024'
      }
    ],
    cadUnicoAtualizado: true,
    requerimentoAdministrativo: {
      numeroNB: '201.884.192-0',
      dataIndeferimento: '2024-01-20',
      motivo: 'Indeferimento administrativo por alegada superação de renda',
      moraInss: false
    },
    estagio: 'CAPTURA',
    versaoRegras: REGRAS_LOAS_V1.versao
  });

  // Estágio atual do pipeline
  const [currentStageId, setCurrentStageId] = useState<string>('CAPTURA');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Responsável técnico OAB
  const [responsavelOab, setResponsavelOab] = useState<{
    nome: string;
    registro: string;
    conselho: string;
    estado: string;
  }>({
    nome: 'Dra. Clarice Vasconcelos',
    registro: '241.809',
    conselho: 'OAB',
    estado: 'SP'
  });

  // Parecer Técnico da Esteira
  const [parecerOab, setParecerOab] = useState<string>(
    'Requerente atende a todos os requisitos legais previstos no Art. 20 da Lei nº 8.742/1993. A renda líquida per capita da família, após as exclusões legais e deduções com tratamentos médicos essenciais de saúde não fornecidos pelo SUS, posiciona o núcleo em situação de vulnerabilidade e miserabilidade manifesta.'
  );

  // Executa o motor determinístico puro de cálculo
  const resultado = useMemo(() => {
    try {
      return calcularLoas(caso, REGRAS_LOAS_V1, competencia);
    } catch (err: any) {
      console.error('[LOAS Calc Error]', err);
      return null;
    }
  }, [caso, competencia]);

  const pipelineState: PipelineStageState = useMemo(() => {
    const stageProgressMap: Record<string, number> = {
      CAPTURA: 20,
      DIAGNOSTICO: 45,
      ESTRATEGIA: 70,
      EXECUCAO: 90,
      ENTREGA: 100
    };
    return {
      currentStageId,
      progressPct: stageProgressMap[currentStageId] || 20,
      stageTimestamps: {
        [currentStageId]: new Date().toISOString()
      },
      blockedReason: resultado && resultado.pendencias.length > 0 && currentStageId !== 'CAPTURA'
        ? resultado.pendencias[0]
        : undefined,
      missingRequirements: resultado ? resultado.pendencias : []
    };
  }, [currentStageId, resultado]);

  // Cópia do hash canônico
  const copiarHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  // Carregamento de Cenários Pré-Configurados (Demo)
  const aplicarCenario = (cenarioId: 'idoso_objetivo' | 'pcd_deducoes' | 'bpc_outro_membro' | 'flexibilizacao_stf') => {
    if (cenarioId === 'idoso_objetivo') {
      setCaso({
        id: `CASO-LOAS-${Date.now().toString(36).toUpperCase()}`,
        tenantId,
        advogadoResponsavelId: 'adv-oab-sp-01',
        categoria: 'IDOSO',
        requerente: {
          id: 'req-idoso',
          nome: 'Raimundo Nonato de Souza',
          cpf: '381.902.441-29',
          dataNascimento: '1957-04-18',
          laudoPcdImpedimentoLongoPrazo: false
        },
        grupo: [
          {
            id: 'req-idoso',
            nome: 'Raimundo Nonato de Souza',
            parentesco: 'REQUERENTE',
            dataNascimento: '1957-04-18',
            mesmoTeto: true,
            rendaBrutaCentavos: 0
          },
          {
            id: 'conj-01',
            nome: 'Benedita Maria de Souza',
            parentesco: 'CONJUGE',
            dataNascimento: '1960-08-22',
            mesmoTeto: true,
            rendaBrutaCentavos: 50000 // R$ 500,00 -> per capita = R$ 250,00 (<= 1/4 SM)
          }
        ],
        despesas: [],
        cadUnicoAtualizado: true,
        requerimentoAdministrativo: {
          numeroNB: '201.884.192-0',
          dataIndeferimento: '2024-01-20',
          motivo: 'Indeferimento administrativo por alegada renda'
        },
        estagio: currentStageId,
        versaoRegras: REGRAS_LOAS_V1.versao
      });
    } else if (cenarioId === 'pcd_deducoes') {
      setCaso({
        id: `CASO-LOAS-${Date.now().toString(36).toUpperCase()}`,
        tenantId,
        advogadoResponsavelId: 'adv-oab-sp-01',
        categoria: 'DEFICIENCIA',
        requerente: {
          id: 'req-pcd',
          nome: 'Maria Clara dos Santos',
          cpf: '512.981.402-11',
          dataNascimento: '2016-03-15',
          laudoPcdImpedimentoLongoPrazo: true,
          dataLaudoPcd: '2023-11-10'
        },
        grupo: [
          {
            id: 'req-pcd',
            nome: 'Maria Clara dos Santos',
            parentesco: 'REQUERENTE',
            dataNascimento: '2016-03-15',
            mesmoTeto: true,
            rendaBrutaCentavos: 0
          },
          {
            id: 'mae-pcd',
            nome: 'Luciana dos Santos',
            parentesco: 'MAE',
            dataNascimento: '1984-09-05',
            mesmoTeto: true,
            rendaBrutaCentavos: 80000 // R$ 800,00 (acima de 1/4 SM antes das deduções)
          }
        ],
        despesas: [
          {
            id: 'desp-pcd-1',
            categoria: 'MEDICAMENTO',
            descricao: 'Anticonvulsivante e suplemento neurobiológico',
            valorMensalCentavos: 20000, // R$ 200,00
            disponivelNoSUS: false,
            comprovanteDocId: 'DOC-RECEITA-LAUDO-771'
          }
        ],
        cadUnicoAtualizado: true,
        requerimentoAdministrativo: {
          numeroNB: '210.994.012-3',
          dataIndeferimento: '2024-01-18',
          motivo: 'Perícia social do INSS desconsiderou gastos contínuos de saúde'
        },
        estagio: currentStageId,
        versaoRegras: REGRAS_LOAS_V1.versao
      });
    } else if (cenarioId === 'bpc_outro_membro') {
      setCaso({
        id: `CASO-LOAS-${Date.now().toString(36).toUpperCase()}`,
        tenantId,
        advogadoResponsavelId: 'adv-oab-sp-01',
        categoria: 'IDOSO',
        requerente: {
          id: 'req-idoso-2',
          nome: 'Geraldo Magela de Castro',
          cpf: '109.824.718-44',
          dataNascimento: '1954-11-20',
          laudoPcdImpedimentoLongoPrazo: false
        },
        grupo: [
          {
            id: 'req-idoso-2',
            nome: 'Geraldo Magela de Castro',
            parentesco: 'REQUERENTE',
            dataNascimento: '1954-11-20',
            mesmoTeto: true,
            rendaBrutaCentavos: 0
          },
          {
            id: 'conj-com-bpc',
            nome: 'Tereza Cristina de Castro',
            parentesco: 'CONJUGE',
            dataNascimento: '1956-02-14',
            mesmoTeto: true,
            rendaBrutaCentavos: 141200, // R$ 1.412,00 (BPC)
            rendaExcluida: {
              motivo: 'BPC_OUTRO_MEMBRO'
            }
          },
          {
            id: 'filho-fora',
            nome: 'Marcos de Castro',
            parentesco: 'FILHO_SOLTEIRO',
            dataNascimento: '1985-06-10',
            mesmoTeto: false, // Mora fora
            rendaBrutaCentavos: 350000 // R$ 3.500,00 (excluído por residir fora)
          }
        ],
        despesas: [],
        cadUnicoAtualizado: true,
        requerimentoAdministrativo: {
          numeroNB: '219.001.444-9',
          dataIndeferimento: '2024-01-12'
        },
        estagio: currentStageId,
        versaoRegras: REGRAS_LOAS_V1.versao
      });
    } else if (cenarioId === 'flexibilizacao_stf') {
      setCaso({
        id: `CASO-LOAS-${Date.now().toString(36).toUpperCase()}`,
        tenantId,
        advogadoResponsavelId: 'adv-oab-sp-01',
        categoria: 'DEFICIENCIA',
        requerente: {
          id: 'req-flex',
          nome: 'Valéria Regina Pires',
          cpf: '290.119.824-00',
          dataNascimento: '1995-12-01',
          laudoPcdImpedimentoLongoPrazo: true
        },
        grupo: [
          {
            id: 'req-flex',
            nome: 'Valéria Regina Pires',
            parentesco: 'REQUERENTE',
            dataNascimento: '1995-12-01',
            mesmoTeto: true,
            rendaBrutaCentavos: 0
          },
          {
            id: 'pai-flex',
            nome: 'Antônio Pires',
            parentesco: 'PAI',
            dataNascimento: '1968-07-15',
            mesmoTeto: true,
            rendaBrutaCentavos: 110000 // R$ 1.100,00 -> per capita = R$ 550,00 (> 353,00 mas <= 1/2 SM)
          }
        ],
        despesas: [
          {
            id: 'desp-flex-1',
            categoria: 'TRATAMENTO',
            descricao: 'Fisioterapia motora especializada e transporte para clínicas',
            valorMensalCentavos: 15000,
            disponivelNoSUS: false,
            comprovanteDocId: 'DOC-FISIO-2024'
          }
        ],
        cadUnicoAtualizado: true,
        requerimentoAdministrativo: {
          numeroNB: '240.119.330-8',
          dataIndeferimento: '2024-01-25',
          motivo: 'Renda per capita familiar calculada em R$ 550,00'
        },
        estagio: currentStageId,
        versaoRegras: REGRAS_LOAS_V1.versao
      });
    }
  };

  // Funções de manipulação do grupo familiar
  const adicionarMembro = () => {
    const novo: MembroFamiliar = {
      id: `membro-${Date.now()}`,
      nome: '',
      parentesco: 'FILHO_SOLTEIRO',
      dataNascimento: '2000-01-01',
      mesmoTeto: true,
      rendaBrutaCentavos: 0
    };
    setCaso(prev => ({
      ...prev,
      grupo: [...prev.grupo, novo]
    }));
  };

  const removerMembro = (id: string) => {
    setCaso(prev => ({
      ...prev,
      grupo: prev.grupo.filter(m => m.id !== id)
    }));
  };

  const atualizarMembro = (id: string, campo: keyof MembroFamiliar, valor: any) => {
    setCaso(prev => ({
      ...prev,
      grupo: prev.grupo.map(m => (m.id === id ? { ...m, [campo]: valor } : m))
    }));
  };

  // Funções de manipulação de despesas
  const adicionarDespesa = () => {
    const nova: DespesaSaude = {
      id: `desp-${Date.now()}`,
      categoria: 'MEDICAMENTO',
      descricao: '',
      valorMensalCentavos: 0,
      disponivelNoSUS: false,
      comprovanteDocId: ''
    };
    setCaso(prev => ({
      ...prev,
      despesas: [...prev.despesas, nova]
    }));
  };

  const removerDespesa = (id: string) => {
    setCaso(prev => ({
      ...prev,
      despesas: prev.despesas.filter(d => d.id !== id)
    }));
  };

  const atualizarDespesa = (id: string, campo: keyof DespesaSaude, valor: any) => {
    setCaso(prev => ({
      ...prev,
      despesas: prev.despesas.map(d => (d.id === id ? { ...d, [campo]: valor } : d))
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      {/* Top Bar com Navegação e Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-hairline hover:bg-surface text-ink transition-colors cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4 text-ink-mute" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-ink">
                LOAS / BPC · Benefício de Prestação Continuada
              </h1>
              {IS_DEMO_MODE && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-[#F1D9A8] bg-[#FFF8EA] text-[#7A4F00]">
                  Ambiente de demonstração
                </span>
              )}
            </div>
            <p className="text-xs text-ink-mute mt-0.5">
              Lei Orgânica da Assistência Social (Lei nº 8.742/1993) · Motor Analítico com Divisão Half-Even e Selo SHA-256
            </p>
          </div>
        </div>

        {/* Competência Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-ink-mute flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Competência:
          </label>
          <select
            value={competencia}
            onChange={e => setCompetencia(e.target.value)}
            className="text-xs font-mono bg-canvas border border-hairline rounded-lg px-2.5 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {Object.keys(salarioMinimoPorCompetencia).sort().reverse().map((c) => (
              <option key={c} value={c}>
                {c} (SM: {formatarCentavosEmReais(salarioMinimoPorCompetencia[c])})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stepper Padronizado de 5 Estágios */}
      <ServicePipelineStepper
        pipeline={service.pipeline}
        state={pipelineState}
      />

      {/* Seletor de Cenários de Teste / Intake Rápido */}
      <div className="bg-surface/50 border border-hairline rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-ink flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-accent" /> Cenários Predefinidos de Intake:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => aplicarCenario('idoso_objetivo')}
            className="px-2.5 py-1 rounded-md border border-hairline bg-canvas hover:bg-surface text-ink transition-colors cursor-pointer text-xs"
          >
            1. Idoso Elegível Objetivo
          </button>
          <button
            onClick={() => aplicarCenario('pcd_deducoes')}
            className="px-2.5 py-1 rounded-md border border-hairline bg-canvas hover:bg-surface text-ink transition-colors cursor-pointer text-xs"
          >
            2. PcD c/ Deduções Médicas
          </button>
          <button
            onClick={() => aplicarCenario('bpc_outro_membro')}
            className="px-2.5 py-1 rounded-md border border-hairline bg-canvas hover:bg-surface text-ink transition-colors cursor-pointer text-xs"
          >
            3. Exclusão BPC & Fora do Teto
          </button>
          <button
            onClick={() => aplicarCenario('flexibilizacao_stf')}
            className="px-2.5 py-1 rounded-md border border-hairline bg-canvas hover:bg-surface text-ink transition-colors cursor-pointer text-xs"
          >
            4. Flexibilização STF RE 567.985
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ESTÁGIO 1: CAPTURA & INTAKE DO GRUPO FAMILIAR                            */}
      {/* ========================================================================= */}
      {currentStageId === 'CAPTURA' && (
        <div className="space-y-6">
          {/* Card: Dados do Requerente */}
          <div className="bg-canvas border border-hairline rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-accent" /> 1. Qualificação do Requerente
              </h2>
              <span className="text-xs font-mono text-ink-mute">Caso: {caso.id}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-medium text-ink-2 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={caso.requerente.nome}
                  onChange={e =>
                    setCaso(prev => ({
                      ...prev,
                      requerente: { ...prev.requerente, nome: e.target.value }
                    }))
                  }
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-medium text-ink-2 mb-1">CPF do Requerente</label>
                <input
                  type="text"
                  value={caso.requerente.cpf}
                  onChange={e =>
                    setCaso(prev => ({
                      ...prev,
                      requerente: { ...prev.requerente, cpf: e.target.value }
                    }))
                  }
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-medium text-ink-2 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={caso.requerente.dataNascimento}
                  onChange={e =>
                    setCaso(prev => ({
                      ...prev,
                      requerente: { ...prev.requerente, dataNascimento: e.target.value }
                    }))
                  }
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-medium text-ink-2 mb-1">Categoria do Benefício</label>
                <select
                  value={caso.categoria}
                  onChange={e =>
                    setCaso(prev => ({
                      ...prev,
                      categoria: e.target.value as LoasCategoria
                    }))
                  }
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="IDOSO">Idoso (65 anos ou mais)</option>
                  <option value="DEFICIENCIA">Pessoa com Deficiência (PcD)</option>
                </select>
              </div>
            </div>

            {caso.categoria === 'DEFICIENCIA' && (
              <div className="pt-2 border-t border-hairline/60 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chk-pcd"
                  checked={Boolean(caso.requerente.laudoPcdImpedimentoLongoPrazo)}
                  onChange={e =>
                    setCaso(prev => ({
                      ...prev,
                      requerente: {
                        ...prev.requerente,
                        laudoPcdImpedimentoLongoPrazo: e.target.checked
                      }
                    }))
                  }
                  className="rounded border-hairline text-accent focus:ring-accent"
                />
                <label htmlFor="chk-pcd" className="text-xs text-ink">
                  Possui laudo médico pericial atestando impedimento de longo prazo (mínimo de 2 anos com CID)
                </label>
              </div>
            )}
          </div>

          {/* Card: Pré-Requisitos Legais (CadÚnico & INSS) */}
          <div className="bg-canvas border border-hairline rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2 border-b border-hairline pb-3">
              <FileCheck className="w-4 h-4 text-accent" /> 2. Pré-Requisitos Administrativos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-hairline bg-surface/30">
                <input
                  type="checkbox"
                  id="chk-cadunico"
                  checked={caso.cadUnicoAtualizado}
                  onChange={e =>
                    setCaso(prev => ({ ...prev, cadUnicoAtualizado: e.target.checked }))
                  }
                  className="rounded border-hairline text-accent focus:ring-accent"
                />
                <div>
                  <label htmlFor="chk-cadunico" className="font-semibold text-ink block">
                    CadÚnico Atualizado (&lt; 24 meses)
                  </label>
                  <span className="text-[11px] text-ink-mute">Obrigatório p/ BPC (Decreto 6.214)</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink-2 mb-1">Número do Benefício (NB Indeferido)</label>
                <input
                  type="text"
                  placeholder="Ex: 198.765.432-1"
                  value={caso.requerimentoAdministrativo.numeroNB || ''}
                  onChange={e =>
                    setCaso(prev => ({
                      ...prev,
                      requerimentoAdministrativo: {
                        ...prev.requerimentoAdministrativo,
                        numeroNB: e.target.value
                      }
                    }))
                  }
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-ink-2 mb-1">Data do Indeferimento Administrativo</label>
                <input
                  type="date"
                  value={caso.requerimentoAdministrativo.dataIndeferimento || ''}
                  onChange={e =>
                    setCaso(prev => ({
                      ...prev,
                      requerimentoAdministrativo: {
                        ...prev.requerimentoAdministrativo,
                        dataIndeferimento: e.target.value
                      }
                    }))
                  }
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Card: Composição do Grupo Familiar */}
          <div className="bg-canvas border border-hairline rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" /> 3. Grupo Familiar sob o Mesmo Teto (Art. 20 §1º Lei 8.742/93)
                </h2>
                <p className="text-[11px] text-ink-mute mt-0.5">
                  Informe todos os residentes. Parentescos fora do rol legal ou residentes em outro endereço são descartados.
                </p>
              </div>
              <button
                onClick={adicionarMembro}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-surface hover:bg-surface/80 text-xs font-medium text-ink transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Membro
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-hairline rounded-lg">
                <thead className="bg-surface/60 text-ink-mute border-b border-hairline text-[11px] uppercase tracking-wide">
                  <tr>
                    <th className="py-2.5 px-3">Nome</th>
                    <th className="py-2.5 px-3">Parentesco Legal</th>
                    <th className="py-2.5 px-3">Data Nasc.</th>
                    <th className="py-2.5 px-3 text-center">Mesmo Teto?</th>
                    <th className="py-2.5 px-3">Renda Bruta (R$)</th>
                    <th className="py-2.5 px-3">Exclusão Legal</th>
                    <th className="py-2.5 px-2 text-center w-10">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {caso.grupo.map(membro => (
                    <tr key={membro.id} className="hover:bg-surface/30">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={membro.nome}
                          onChange={e => atualizarMembro(membro.id, 'nome', e.target.value)}
                          placeholder="Nome completo"
                          className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={membro.parentesco}
                          onChange={e => atualizarMembro(membro.id, 'parentesco', e.target.value)}
                          className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                          {PARENTESCOS.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="date"
                          value={membro.dataNascimento}
                          onChange={e => atualizarMembro(membro.id, 'dataNascimento', e.target.value)}
                          className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-accent font-mono text-[11px]"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={membro.mesmoTeto}
                          onChange={e => atualizarMembro(membro.id, 'mesmoTeto', e.target.checked)}
                          className="rounded border-hairline text-accent focus:ring-accent"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1 text-ink-mute">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={Math.round(membro.rendaBrutaCentavos / 100)}
                            onChange={e =>
                              atualizarMembro(
                                membro.id,
                                'rendaBrutaCentavos',
                                Math.round(Number(e.target.value || 0) * 100)
                              )
                            }
                            className="w-full pl-8 pr-2 py-1 bg-canvas border border-hairline rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={membro.rendaExcluida?.motivo || ''}
                          onChange={e => {
                            const val = e.target.value as MotivoExclusaoRenda | '';
                            atualizarMembro(
                              membro.id,
                              'rendaExcluida',
                              val ? { motivo: val } : undefined
                            );
                          }}
                          className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-accent text-[11px]"
                        >
                          <option value="">Sem exclusão (computada)</option>
                          <option value="BPC_OUTRO_MEMBRO">BPC de outro membro (§14 Art. 20)</option>
                          <option value="BENEFICIO_ATE_1SM_IDOSO_OU_PCD">
                            Benefício até 1 SM Idoso/PcD (RE 580.963)
                          </option>
                        </select>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {membro.parentesco !== 'REQUERENTE' && (
                          <button
                            onClick={() => removerMembro(membro.id)}
                            className="p-1 rounded text-ink-mute hover:text-[#B42318] transition-colors cursor-pointer"
                            title="Remover membro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Despesas de Saúde e Medicamentos */}
          <div className="bg-canvas border border-hairline rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-accent" /> 4. Despesas de Saúde e Medicamentos (art. 20-B da Lei 8.742/93)
                </h2>
                <p className="text-[11px] text-ink-mute mt-0.5">
                  Dedução permitida exclusivamente se: 1) não fornecida pelo SUS e 2) comprovada por documento/receita.
                </p>
              </div>
              <button
                onClick={adicionarDespesa}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-surface hover:bg-surface/80 text-xs font-medium text-ink transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Despesa
              </button>
            </div>

            {caso.despesas.length === 0 ? (
              <p className="text-xs text-ink-mute italic py-2">
                Nenhuma despesa de saúde cadastrada no momento.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-hairline rounded-lg">
                  <thead className="bg-surface/60 text-ink-mute border-b border-hairline text-[11px] uppercase tracking-wide">
                    <tr>
                      <th className="py-2.5 px-3">Categoria</th>
                      <th className="py-2.5 px-3">Descrição / Finalidade</th>
                      <th className="py-2.5 px-3">Valor Mensal (R$)</th>
                      <th className="py-2.5 px-3 text-center">Disponível SUS?</th>
                      <th className="py-2.5 px-3">ID Comprovante / Doc</th>
                      <th className="py-2.5 px-2 text-center w-10">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {caso.despesas.map(desp => (
                      <tr key={desp.id} className="hover:bg-surface/30">
                        <td className="py-2 px-3">
                          <select
                            value={desp.categoria}
                            onChange={e =>
                              atualizarDespesa(desp.id!, 'categoria', e.target.value)
                            }
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                          >
                            {CATEGORIAS_DESPESA.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={desp.descricao || ''}
                            onChange={e =>
                              atualizarDespesa(desp.id!, 'descricao', e.target.value)
                            }
                            placeholder="Ex: Fraldas geriátricas M"
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="relative">
                            <span className="absolute left-2 top-1 text-ink-mute">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={Math.round(desp.valorMensalCentavos / 100)}
                              onChange={e =>
                                atualizarDespesa(
                                  desp.id!,
                                  'valorMensalCentavos',
                                  Math.round(Number(e.target.value || 0) * 100)
                                )
                              }
                              className="w-full pl-8 pr-2 py-1 bg-canvas border border-hairline rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={desp.disponivelNoSUS}
                            onChange={e =>
                              atualizarDespesa(desp.id!, 'disponivelNoSUS', e.target.checked)
                            }
                            className="rounded border-hairline text-accent focus:ring-accent"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={desp.comprovanteDocId || ''}
                            onChange={e =>
                              atualizarDespesa(desp.id!, 'comprovanteDocId', e.target.value)
                            }
                            placeholder="Ex: DOC-RECEITA-01"
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-accent font-mono text-[11px]"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => removerDespesa(desp.id!)}
                            className="p-1 rounded text-ink-mute hover:text-[#B42318] transition-colors cursor-pointer"
                            title="Remover despesa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botão de Avanço para Diagnóstico */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setCurrentStageId('DIAGNOSTICO')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ink text-canvas hover:bg-ink/90 font-medium text-xs transition-colors cursor-pointer shadow-sm"
            >
              Executar Diagnóstico & Memória de Cálculo <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESTÁGIO 2: DIAGNÓSTICO & MEMÓRIA DE CÁLCULO AUDITÁVEL                     */}
      {/* ========================================================================= */}
      {currentStageId === 'DIAGNOSTICO' && resultado && (
        <div className="space-y-6">
          {/* Card: Placar de Elegibilidade e Síntese de Indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-canvas border border-hairline rounded-xl p-4 space-y-1">
              <span className="text-[11px] font-semibold text-ink-mute uppercase tracking-wide">
                Salário Mínimo ({competencia})
              </span>
              <div className="text-lg font-bold font-mono text-ink">
                {formatarCentavosEmReais(resultado.salarioMinimoCentavos)}
              </div>
              {TABELA_SALARIO_MINIMO_FONTES[competencia]?.fonte === 'PREENCHER_E_VALIDAR' ? (
                    <p className="text-[11px] font-medium text-[#7A4F00]" title={TABELA_SALARIO_MINIMO_FONTES[competencia]?.legislacao}>
                      <span className="mr-1 inline-block rounded border border-[#F1D9A8] bg-[#FFF8EA] px-1">pendente de validação</span>
                      conferir no DOU antes de produção
                    </p>
                  ) : (
                    <p className="text-[11px] text-ink-mute">{TABELA_SALARIO_MINIMO_FONTES[competencia]?.legislacao ?? 'Base legal oficial vigente'}</p>
                  )}
            </div>

            <div className="bg-canvas border border-hairline rounded-xl p-4 space-y-1">
              <span className="text-[11px] font-semibold text-ink-mute uppercase tracking-wide">
                Limite Legal (1/4 SM)
              </span>
              <div className="text-lg font-bold font-mono text-ink">
                {formatarCentavosEmReais(resultado.limiteCentavos)}
              </div>
              <p className="text-[11px] text-ink-mute">Art. 20, § 3º Lei 8.742/93</p>
            </div>

            <div className="bg-canvas border border-hairline rounded-xl p-4 space-y-1">
              <span className="text-[11px] font-semibold text-ink-mute uppercase tracking-wide">
                Renda Per Capita Apurada
              </span>
              <div className={`text-lg font-bold font-mono ${resultado.elegivelCriterioObjetivo ? 'text-[#067647]' : 'text-[#7A4F00]'}`}>
                {formatarCentavosEmReais(resultado.perCapitaCentavos)}
              </div>
              <p className="text-[11px] text-ink-mute">Divisão bancária Half-Even</p>
            </div>

            <div className="bg-canvas border border-hairline rounded-xl p-4 space-y-1">
              <span className="text-[11px] font-semibold text-ink-mute uppercase tracking-wide">
                Enquadramento Técnico
              </span>
              <div>
                {resultado.elegivelCriterioObjetivo ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ECFDF3] text-[#067647] border border-[#ABEFC6] text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Elegível Objetivo
                  </span>
                ) : resultado.elegivelPorFlexibilizacao === 'POSSIVEL' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFF8EA] text-[#7A4F00] border border-[#F1D9A8] text-xs font-semibold">
                    <Scale className="w-3.5 h-3.5" /> Flexibilização Possível
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFF8EA] text-[#7A4F00] border border-[#F1D9A8] text-xs font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5" /> Fora do critério objetivo
                      </span>
                )}
              </div>
              <p className="text-[11px] text-ink-mute">
                {resultado.elegivelCriterioObjetivo ? 'Renda <= 1/4 SM' : 'Avaliar miserabilidade (RE 567.985 / Tema 27)'}
              </p>
            </div>
          </div>

          {/* P30 · Renda > 1/4 SM não é inelegibilidade: abre a análise de miserabilidade por outros meios (STF RE 567.985 / Tema 27) */}
              {!resultado.elegivelCriterioObjetivo && (
                <div className="p-4 rounded-xl border border-[#F1D9A8] bg-[#FFF8EA] text-xs space-y-2">
                  <div className="font-semibold text-[#7A4F00] flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Fora do critério objetivo — avaliar miserabilidade (STF RE 567.985 / Tema 27)
                  </div>
                  <p className="text-ink-2">O critério de 1/4 do SM não é absoluto. Reúna provas da vulnerabilidade real do grupo familiar antes de decidir a estratégia:</p>
                  <ul className="list-disc pl-5 space-y-1 text-ink-2">
                    <li>Avaliação social (CRAS/INSS) ou estudo socioeconômico judicial</li>
                    <li>Gastos com saúde não cobertos pelo SUS (receitas, notas, negativas do SUS)</li>
                    <li>Despesas essenciais comprovadas: moradia, alimentação especial, cuidador, transporte para tratamento</li>
                    <li>Grau de deficiência / dependência de terceiros (laudos e relatórios médicos)</li>
                    <li>Composição e rendas do grupo familiar conferidas com o CadÚnico</li>
                    <li>Indeferimento administrativo e motivo (carta do INSS)</li>
                  </ul>
                </div>
              )}

              {/* Alerta de Pendências (se houver) */}
          {resultado.pendencias.length > 0 && (
            <div className="p-4 rounded-xl border border-[#F1D9A8] bg-[#FFF8EA]/70 text-xs space-y-1.5">
              <div className="font-semibold text-[#7A4F00] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#7A4F00]" />
                Pendências de Pré-Requisitos para Concessão:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[#7A4F00]">
                {resultado.pendencias.map((pend, idx) => (
                  <li key={idx}>{pend}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabela da Memória de Cálculo Auditável */}
          <div className="bg-canvas border border-hairline rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" /> Memória de Cálculo Analítica Auditável
                </h3>
                <p className="text-[11px] text-ink-mute mt-0.5">
                  Demonstração detalhada das regras de negócio, exclusões e divisões com tolerância zero para float.
                </p>
              </div>
              <span className="text-[11px] font-mono text-ink-mute">Regras {resultado.versaoRegras}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-hairline rounded-lg">
                <thead className="bg-surface/60 text-ink-mute border-b border-hairline text-[11px] uppercase tracking-wide">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Etapa / Descrição</th>
                    <th className="py-2.5 px-3">Fórmula / Confronto</th>
                    <th className="py-2.5 px-3">Valor / Resultado</th>
                    <th className="py-2.5 px-3">Fundamento / Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {resultado.memoriaDeCalculo.map(linha => (
                    <tr key={linha.ordem} className="hover:bg-surface/30">
                      <td className="py-2.5 px-3 text-center font-mono text-ink-mute">{linha.ordem}</td>
                      <td className="py-2.5 px-3 font-semibold text-ink">{linha.passo}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-ink-2">{linha.formula}</td>
                      <td className="py-2.5 px-3 font-bold font-mono text-ink">{linha.valor}</td>
                      <td className="py-2.5 px-3 text-ink-mute text-[11px]">{linha.detalhe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confronto de Membros: Computados vs. Excluídos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Membros Computados */}
            <div className="bg-canvas border border-hairline rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-ink flex items-center justify-between border-b border-hairline pb-2">
                <span className="flex items-center gap-1.5 text-[#067647]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Membros Computados no Grupo ({resultado.membrosComputados.length})
                </span>
                <span className="text-[11px] font-mono text-ink-mute">
                  Total Renda: {formatarCentavosEmReais(resultado.rendaBrutaTotalCentavos)}
                </span>
              </h4>
              <div className="space-y-2">
                {resultado.membrosComputados.map(m => (
                  <div key={m.id} className="p-2.5 rounded-lg border border-hairline bg-surface/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">{m.nome}</span>
                      <span className="font-mono text-ink-2">
                        {formatarCentavosEmReais(m.rendaConsideradaCentavos)}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-mute flex items-center justify-between">
                      <span>{m.parentesco} · {m.idadeAnos} anos</span>
                      {m.exclusaoRendaAplicada && (
                        <span className="text-[#7A4F00] font-medium">{m.justificativaExclusao}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Membros Excluídos com Motivo */}
            <div className="bg-canvas border border-hairline rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-ink flex items-center justify-between border-b border-hairline pb-2">
                <span className="flex items-center gap-1.5 text-[#B42318]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Membros Excluídos do Cômputo ({resultado.membrosExcluidos.length})
                </span>
                <span className="text-[11px] text-ink-mute">Rol Legal / Endereço</span>
              </h4>
              {resultado.membrosExcluidos.length === 0 ? (
                <p className="text-xs text-ink-mute italic py-3 text-center">
                  Nenhum membro excluído. Todos atendem ao Art. 20 §1º da Lei 8.742/93.
                </p>
              ) : (
                <div className="space-y-2">
                  {resultado.membrosExcluidos.map((e, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-hairline bg-[#FEF3F2]/30 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{e.membro.nome}</span>
                        <span className="text-[11px] font-mono text-ink-mute line-through">
                          {formatarCentavosEmReais(e.membro.rendaBrutaCentavos)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#B42318] font-medium">{e.motivo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Confronto de Deduções: Aceitas vs. Recusadas com Motivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deduções Aceitas */}
            <div className="bg-canvas border border-hairline rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-ink flex items-center justify-between border-b border-hairline pb-2">
                <span className="flex items-center gap-1.5 text-[#067647]">
                  <HeartPulse className="w-3.5 h-3.5" /> Deduções de Saúde Aceitas ({resultado.deducoesAceitas.length})
                </span>
                <span className="font-mono text-[11px] text-[#067647]">
                  Total: -{formatarCentavosEmReais(resultado.totalDeducoesAceitasCentavos)}
                </span>
              </h4>
              {resultado.deducoesAceitas.length === 0 ? (
                <p className="text-xs text-ink-mute italic py-3 text-center">
                  Nenhuma dedução de despesa de saúde comprovada informada.
                </p>
              ) : (
                <div className="space-y-2">
                  {resultado.deducoesAceitas.map((d, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-hairline bg-surface/20 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{d.despesa.categoria}</span>
                        <span className="font-mono text-[#067647] font-semibold">
                          -{formatarCentavosEmReais(d.valorCentavos)}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-mute flex items-center justify-between">
                        <span>{d.despesa.descricao || 'Tratamento de saúde'}</span>
                        <span className="font-mono">Doc: {d.despesa.comprovanteDocId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deduções Recusadas */}
            <div className="bg-canvas border border-hairline rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-ink flex items-center justify-between border-b border-hairline pb-2">
                <span className="flex items-center gap-1.5 text-[#B42318]">
                  <ShieldAlert className="w-3.5 h-3.5" /> Deduções Recusadas ({resultado.deducoesRecusadas.length})
                </span>
                <span className="text-[11px] text-ink-mute">Regras SUS / Prova</span>
              </h4>
              {resultado.deducoesRecusadas.length === 0 ? (
                <p className="text-xs text-ink-mute italic py-3 text-center">
                  Nenhuma dedução recusada.
                </p>
              ) : (
                <div className="space-y-2">
                  {resultado.deducoesRecusadas.map((r, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-hairline bg-[#FEF3F2]/30 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{r.despesa.categoria}</span>
                        <span className="text-[11px] font-mono text-ink-mute line-through">
                          {formatarCentavosEmReais(r.despesa.valorMensalCentavos)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#B42318] font-medium">{r.motivo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selo Criptográfico SHA-256 Canônico */}
          <div className="p-4 rounded-xl border border-hairline bg-surface/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-accent shrink-0" />
              <div>
                <span className="font-semibold text-ink block">
                  Selo Criptográfico Canônico de Autenticidade (FIPS 180-4)
                </span>
                <code className="text-[11px] font-mono text-ink-mute break-all">
                  sha256:{resultado.hash}
                </code>
              </div>
            </div>
            <button
              onClick={() => copiarHash(resultado.hash)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-canvas hover:bg-surface text-ink transition-colors cursor-pointer shrink-0"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#067647]" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Selo
                </>
              )}
            </button>
          </div>

          {/* Botões de Ação do Diagnóstico */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStageId('CAPTURA')}
              className="px-4 py-2 rounded-lg border border-hairline text-ink hover:bg-surface text-xs transition-colors cursor-pointer"
            >
              Voltar ao Intake
            </button>
            <button
              onClick={() => setCurrentStageId('ESTRATEGIA')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ink text-canvas hover:bg-ink/90 font-medium text-xs transition-colors cursor-pointer shadow-sm"
            >
              Prosseguir para Estratégia Jurídica <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESTÁGIO 3: ESTRATÉGIA JURÍDICA & TESES DE FLEXIBILIZAÇÃO                 */}
      {/* ========================================================================= */}
      {currentStageId === 'ESTRATEGIA' && (
        <div className="space-y-6">
          <div className="bg-canvas border border-hairline rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Scale className="w-4 h-4 text-accent" /> Teses Jurídicas Curadas e Vinculantes
                </h3>
                <p className="text-[11px] text-ink-mute mt-0.5">
                  Proibida a geração de citações via IA. Apenas precedentes vinculantes cadastrados e homologados por comissão OAB.
                </p>
              </div>
              <span className="text-[11px] font-mono text-ink-mute">1 Precedente Ativo</span>
            </div>

            <div className="space-y-3">
              {REGRAS_LOAS_V1.teses.map(tese => (
                <div key={tese.id} className="p-4 rounded-xl border border-hairline bg-surface/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink text-xs flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-mono text-[11px]">
                        {tese.id}
                      </span>
                      {tese.titulo}
                    </span>
                    <span className="text-[11px] text-[#067647] font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Revisor: {tese.revisadoPor}
                    </span>
                  </div>
                  <p className="text-xs text-ink-2 leading-relaxed">{tese.fundamento}</p>
                  <div className="text-[11px] text-ink-mute pt-1 border-t border-hairline/60">
                    Data de Revisão: {tese.revisadoEm} · Aplicação automática na minuta processual
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-ink">Estratégia Processual Recomendada</h3>
            <div className="text-xs text-ink-2 leading-relaxed space-y-2">
              {resultado?.elegivelCriterioObjetivo ? (
                <p>
                  <strong>Recurso Administrativo ou Ação no JEF:</strong> O requerente preenche
                  o critério objetivo de 1/4 do salário mínimo (art. 20, § 3º, da Lei 8.742/93). Contra o indeferimento
                  cabe recurso administrativo ou ação de concessão no Juizado Especial Federal (Lei 10.259/2001), com
                  perícia/avaliação social quando necessárias e pedido de tutela de urgência. Mandado de segurança só se
                  houver prova pré-constituída de todos os requisitos (direito líquido e certo).
                </p>
              ) : (
                <p>
                  <strong>Ação Ordinária com Pedido de Tutela de Urgência (Tema 27 STF):</strong> Como a renda per
                  capita ultrapassa ligeiramente o critério objetivo de 1/4 do SM, fundamenta-se na
                  inconstitucionalidade parcial sem pronúncia de nulidade (RE 567.985/MT), demonstrando através das
                  receitas e laudos de saúde a hipossuficiência econômica real da família.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStageId('DIAGNOSTICO')}
              className="px-4 py-2 rounded-lg border border-hairline text-ink hover:bg-surface text-xs transition-colors cursor-pointer"
            >
              Voltar ao Diagnóstico
            </button>
            <button
              onClick={() => setCurrentStageId('EXECUCAO')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ink text-canvas hover:bg-ink/90 font-medium text-xs transition-colors cursor-pointer shadow-sm"
            >
              Prosseguir para Execução & Parecer OAB <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESTÁGIO 4: EXECUÇÃO & PARECER TÉCNICO OAB                                */}
      {/* ========================================================================= */}
      {currentStageId === 'EXECUCAO' && (
        <div className="space-y-6">
          {/* P28/P29 · operação real no servidor: cálculo, minuta, aprovação, assinatura e protocolo */}
          <LoasOperacaoPanel caso={caso} competencia={competencia} />
          <div className="bg-canvas border border-hairline rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2 border-b border-hairline pb-3">
              <UserCheck className="w-4 h-4 text-accent" /> Responsável Técnico pelo Laudo (OAB)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-medium text-ink-2 mb-1">Nome do Profissional</label>
                <input
                  type="text"
                  value={responsavelOab.nome}
                  onChange={e => setResponsavelOab(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-medium text-ink-2 mb-1">Conselho</label>
                <input
                  type="text"
                  disabled
                  value={responsavelOab.conselho}
                  className="w-full bg-surface border border-hairline rounded-lg px-3 py-1.5 text-ink-mute"
                />
              </div>

              <div>
                <label className="block font-medium text-ink-2 mb-1">Número do Registro</label>
                <input
                  type="text"
                  value={responsavelOab.registro}
                  onChange={e => setResponsavelOab(prev => ({ ...prev, registro: e.target.value }))}
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-ink-2 mb-1">UF</label>
                <input
                  type="text"
                  value={responsavelOab.estado}
                  onChange={e => setResponsavelOab(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent uppercase"
                />
              </div>
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-ink">Parecer Jurídico Conclusivo</h3>
            <textarea
              rows={4}
              value={parecerOab}
              onChange={e => setParecerOab(e.target.value)}
              className="w-full bg-canvas border border-hairline rounded-lg p-3 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStageId('ESTRATEGIA')}
              className="px-4 py-2 rounded-lg border border-hairline text-ink hover:bg-surface text-xs transition-colors cursor-pointer"
            >
              Voltar à Estratégia
            </button>
            <button
              onClick={() => setCurrentStageId('ENTREGA')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ink text-canvas hover:bg-ink/90 font-medium text-xs transition-colors cursor-pointer shadow-sm"
            >
              Homologar & Emitir Laudo Oficial <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESTÁGIO 5: ENTREGA DO LAUDO OFICIAL LOAS/BPC                             */}
      {/* ========================================================================= */}
      {currentStageId === 'ENTREGA' && resultado && (
        <div className="space-y-6">
          <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-6 shadow-sm">
            {/* Cabeçalho do Laudo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-hairline">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-mute">
                  LAUDO PERICIAL ASSISTENCIAL OFICIAL · VELATRIX AOS
                </span>
                <h2 className="text-lg font-bold text-ink mt-0.5">
                  Laudo Pericial de Elegibilidade LOAS/BPC & Diagnóstico de Miserabilidade
                </h2>
                <p className="text-xs text-ink-mute mt-1">
                  Emitido para {caso.requerente.nome} · CPF {caso.requerente.cpf} · {tenantName} ({tenantCnpj})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-surface hover:bg-surface/80 text-xs font-medium text-ink transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Imprimir Laudo
                </button>
              </div>
            </div>

            {/* Metadados e Selo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-surface/30 p-4 rounded-lg border border-hairline">
              <div>
                <span className="text-ink-mute block">Responsável Técnico</span>
                <strong className="text-ink">
                  {responsavelOab.nome} ({responsavelOab.conselho}/{responsavelOab.estado} {responsavelOab.registro})
                </strong>
              </div>
              <div>
                <span className="text-ink-mute block">Data de Emissão</span>
                <strong className="text-ink">{new Date().toLocaleDateString('pt-BR')}</strong>
              </div>
              <div>
                <span className="text-ink-mute block">Selo Criptográfico</span>
                <strong className="font-mono text-[11px] text-ink break-all">
                  sha256:{resultado.hash.slice(0, 16)}...
                </strong>
              </div>
            </div>

            {/* Conteúdo Conclusivo */}
            <div className="space-y-4 text-xs text-ink leading-relaxed">
              <h3 className="font-bold text-sm text-ink border-b border-hairline/80 pb-2">
                Conclusão Técnica Pericial
              </h3>
              <p>{parecerOab}</p>
              <div className="p-3.5 rounded-lg border border-hairline bg-surface/40 space-y-1">
                <div className="font-semibold text-ink">
                  Resumo da Aferição Financeira (Competência {competencia}):
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-ink-2 pt-1">
                  <div>Renda Bruta: {formatarCentavosEmReais(resultado.rendaBrutaTotalCentavos)}</div>
                  <div>Deduções: -{formatarCentavosEmReais(resultado.totalDeducoesAceitasCentavos)}</div>
                  <div>Líquida: {formatarCentavosEmReais(resultado.rendaLiquidaCentavos)}</div>
                  <div className="font-bold text-ink">
                    Per Capita: {formatarCentavosEmReais(resultado.perCapitaCentavos)} (Limite: {formatarCentavosEmReais(resultado.limiteCentavos)})
                  </div>
                </div>
              </div>
            </div>

            {/* Assinatura Digital e Rodapé */}
            <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-[#067647]">
                <ShieldCheck className="w-5 h-5 text-[#067647] shrink-0" />
                <span>Documento homologado e assinado digitalmente com conformidade FIPS 180-4.</span>
              </div>
              <button
                onClick={() => setCurrentStageId('CAPTURA')}
                className="px-4 py-2 rounded-lg border border-hairline bg-surface hover:bg-surface/80 text-ink text-xs font-medium cursor-pointer"
              >
                Novo Cálculo LOAS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoasRunnerView;
