import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Scale,
  Sparkles,
  GitCommit,
  RefreshCw,
  Search,
  Lock,
  ArrowLeft,
  Sliders,
  FileCheck2,
  Send,
  Download,
  Upload,
  Cpu,
  CreditCard,
  Shield
} from 'lucide-react';
import { IS_DEMO_MODE, secureInt } from '../../lib/demoMode';
import { registrarCustodiaArquivo, type ArquivoCustodia } from '../../shared/upload/sha256Store';
import {
  RESPONSAVEL_VAZIO, signerPendente, integridadeDasFontes, lerDataIso, type OrigemDados, type ResponsavelTecnico,
} from '../../documents/laudo/comum';
import { pendenciasLaudoPrecatorio, CONSELHOS_PRECATORIO, type StatusVerificacao } from '../../documents/laudo/precatorio';
import { motivosKycPendente, motivoDocumentoCedente, detalharPendencias, VALIDADE_COMPROVANTE_DIAS } from '../../documents/laudo/motivosKyc';
import { ResponsavelLaudoCard } from '../laudo/ResponsavelLaudoCard';
import { StandardizedAuditReportModal } from '../common/StandardizedAuditReportModal';
import { validateAndComputeReportHash } from '../../services/reportEmissionGuardService';
import { CentralAuditReportService } from '../../services/centralAuditReportService';
import {
  PrecatorioKind,
  DueDiligenceResult,
  PropostaCessaoTerm,
  PrecatorioOriginado,
  MemoriaAtualizacaoSegmentada,
  KycCedenteResult
} from '../../types/precatorios';
import { ServiceDefinition } from '../../types/serviceDefinition';
import { StandardizedAuditReport } from '../../types/standardizedPipeline';
import { originacaoEngine } from '../../services/precatorios/originacaoEngine';
import { dueDiligenceEngine } from '../../services/precatorios/dueDiligenceEngine';
import { precificacaoEngine } from '../../services/precatorios/precificacaoEngine';
import { complianceEngine } from '../../services/precatorios/complianceClient';
import {
  TenantComplianceConfig,
  InstrucaoManualSplit,
  ComprovanteSplit,
  AssinaturaDigitalPkiResult,
  ProtocoloDjenResult,
  DestinatarioSplit
} from '../../services/precatorios/adapters/types';
import { ScoreJuridicoBadge } from '../precatorios/ScoreJuridicoBadge';
import { PropostaCessaoCard } from '../precatorios/PropostaCessaoCard';
import { CadeiaCessoesTimeline } from '../precatorios/CadeiaCessoesTimeline';
import { MonitoramentoDashboard } from '../precatorios/MonitoramentoDashboard';
import { CompensacaoSimulatorForm } from '../precatorios/CompensacaoSimulatorForm';
import { BifurcacaoKindSelector } from '../precatorios/BifurcacaoKindSelector';
import { TenantProviderConfigModal } from '../precatorios/TenantProviderConfigModal';
import { ManualSplitInstructionCard } from '../precatorios/ManualSplitInstructionCard';
import { IcpBrasilSignerModal } from '../precatorios/IcpBrasilSignerModal';
import { DjenPeticionamentoModal } from '../precatorios/DjenPeticionamentoModal';

/** Dígitos visíveis da máscara LGPD ('123.***.***-00') batem com o documento completo informado? */
function confereComMascara(mascara: string, documento: string): boolean {
  const m = mascara.toUpperCase().replace(/[^0-9A-Z*]/g, '');
  const d = documento.toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (!m || m.length !== d.length) return false;
  return [...m].every((c, i) => c === '*' || c === d[i]);
}

/** P28 — documentos que o laudo de due diligence exige na cadeia de custódia. */
const SLOTS_PRECATORIO = [
  { key: 'oficio_requisitorio', label: 'Ofício requisitório' },
  { key: 'certidao_transito', label: 'Certidão de trânsito em julgado' },
  { key: 'declaracao_origem', label: 'Declaração de origem lícita (assinada pelo cedente)' },
  { key: 'comprovante_endereco', label: 'Comprovante de endereço do cedente' },
] as const;

interface PrecatorioEnterpriseRunnerViewProps {
  service?: ServiceDefinition;
  tenantId?: string;
  tenantName?: string;
  tenantCnpj?: string;
  onBack?: () => void;
  onBackToDashboard?: () => void;
  onReportGenerated?: (report: StandardizedAuditReport) => void;
}

export const PrecatorioEnterpriseRunnerView: React.FC<PrecatorioEnterpriseRunnerViewProps> = ({
  service,
  tenantId = 'default',
  tenantName = 'Escritório Parceiro / Fundo Titular',
  tenantCnpj,
  onBack,
  onReportGenerated
}) => {
  const effectiveTenantId = tenantCnpj || tenantId || '47.829.112/0001-90';
  const [kind, setKind] = useState<PrecatorioKind>('originacao_para_cessao');
  const [oportunidades, setOportunidades] = useState<PrecatorioOriginado[]>(() => {
    return originacaoEngine.filtrarOportunidades({}).items;
  });
  const [selectedPrecatorio, setSelectedPrecatorio] = useState<PrecatorioOriginado>(() => {
    return oportunidades[0];
  });

  // Estados de cálculo e engines
  const [loadingDueDiligence, setLoadingDueDiligence] = useState<boolean>(false);
  const [dueDiligence, setDueDiligence] = useState<DueDiligenceResult | null>(null);
  const [memoriaCalculo, setMemoriaCalculo] = useState<MemoriaAtualizacaoSegmentada | null>(null);
  const [propostaTerm, setPropostaTerm] = useState<PropostaCessaoTerm | null>(null);
  const [kycResult, setKycResult] = useState<KycCedenteResult | null>(null);
  const [desagioDesejado, setDesagioDesejado] = useState<number>(32.5);
  const [activeTabEstagio, setActiveTabEstagio] = useState<number>(1);

  // Estados de Adapters Plugáveis & Modais
  const [tenantConfig, setTenantConfig] = useState<TenantComplianceConfig>(() =>
    complianceEngine.getTenantConfig(effectiveTenantId)
  );
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isIcpSignerOpen, setIsIcpSignerOpen] = useState(false);
  const [isDjenModalOpen, setIsDjenModalOpen] = useState(false);

  // Estados de Execução de Split & Manual Mode
  const [instrucaoManual, setInstrucaoManual] = useState<InstrucaoManualSplit | null>(null);
  const [executandoSplit, setExecutandoSplit] = useState(false);
  const [splitEfetivado, setSplitEfetivado] = useState<any | null>(null);
  const [assinaturaIcpResult, setAssinaturaIcpResult] = useState<AssinaturaDigitalPkiResult | null>(null);
  const [protocoloDjenResult, setProtocoloDjenResult] = useState<ProtocoloDjenResult | null>(null);
  const [versaoLedger, setVersaoLedger] = useState(1);

  // ── P28: laudo de due diligence — documentos, datas e conteúdo vêm de quem assina ──
  const [dataTransitoJulgado, setDataTransitoJulgado] = useState('');
  const [comprovanteEnderecoData, setComprovanteEnderecoData] = useState('');
  const [custodiaPrec, setCustodiaPrec] = useState<Record<string, ArquivoCustodia>>({});
  const [responsavelPrec, setResponsavelPrec] = useState<ResponsavelTecnico>(RESPONSAVEL_VAZIO);
  const [parecerPrec, setParecerPrec] = useState('');
  /** A listagem mostra o documento mascarado (LGPD); o laudo exige o completo, conferido contra a máscara. */
  const [credorDocCompleto, setCredorDocCompleto] = useState('');
  const credorConfere = confereComMascara(selectedPrecatorio.cedenteDocumento, credorDocCompleto);
  const [erroLaudoPrec, setErroLaudoPrec] = useState<string | null>(null);
  const [laudoPrec, setLaudoPrec] = useState<StandardizedAuditReport | null>(null);
  const [isLaudoPrecOpen, setIsLaudoPrecOpen] = useState(false);

  const transitoValido = lerDataIso(dataTransitoJulgado) ? dataTransitoJulgado : '';
  const comprovanteCustodiado = !!custodiaPrec.comprovante_endereco;
  const comprovanteValido = comprovanteCustodiado && lerDataIso(comprovanteEnderecoData) ? comprovanteEnderecoData : '';
  const declaracaoCustodiada = !!custodiaPrec.declaracao_origem;
  // Feedback no próprio campo (além da lista de pendências).
  const erroDocCedente = credorDocCompleto.trim() ? motivoDocumentoCedente(credorDocCompleto, selectedPrecatorio.cedenteDocumento) : null;
  const idadeComprovanteDias = lerDataIso(comprovanteEnderecoData)
    ? Math.floor((Date.now() - Date.parse(comprovanteEnderecoData + 'T00:00:00Z')) / 86_400_000)
    : null;
  const comprovanteVencido = idadeComprovanteDias !== null && idadeComprovanteDias > VALIDADE_COMPROVANTE_DIAS;

  const statusDueDiligence: StatusVerificacao = !dueDiligence
    ? 'pendente'
    : dueDiligence.bloqueioAutomatico || !dueDiligence.autentico
      ? 'reprovada'
      : IS_DEMO_MODE ? 'simulada' : 'concluida';
  const statusKyc: StatusVerificacao = !kycResult || !kycResult.aprovado
    ? 'pendente'
    : IS_DEMO_MODE && tenantConfig.kycProviderType !== 'MANUAL' ? 'simulada' : 'concluida';
  const origemPrec: OrigemDados = IS_DEMO_MODE
    ? 'gerador_demonstracao'
    : Object.keys(custodiaPrec).length ? 'documentos_custodiados' : 'nao_informada';

  const pendenciasPrec = useMemo(() => {
    const p = pendenciasLaudoPrecatorio(
      {
        estagiosPendentes: loadingDueDiligence ? ['Due diligence em execução'] : [],
        arquivosCustodia: Object.keys(custodiaPrec).length,
        origemDados: origemPrec,
        modoDemonstracao: IS_DEMO_MODE,
        cnjOrigem: selectedPrecatorio.numeroProcesso,
        numeroPrecatorio: selectedPrecatorio.numeroOficio,
        enteDevedor: selectedPrecatorio.enteDevedor,
        natureza: selectedPrecatorio.natureza === 'ALIMENTAR' ? 'alimentar' : selectedPrecatorio.natureza === 'COMUM' ? 'comum' : '',
        valorFace: selectedPrecatorio.valorOriginal,
        credorDocumento: credorDocCompleto,
        dueDiligence: statusDueDiligence,
        kyc: statusKyc,
        dataTransitoJulgado,
        hoje: new Date().toISOString().slice(0, 10),
      },
      { responsavel: responsavelPrec, parecer: parecerPrec }
    );
    if (credorDocCompleto.trim() && !credorConfere) {
      p.push(`CPF/CNPJ informado não confere com o cadastro do cedente (${selectedPrecatorio.cedenteDocumento}).`);
    }
    if (!custodiaPrec.oficio_requisitorio) p.push('Anexe o ofício requisitório à cadeia de custódia.');
    if (!custodiaPrec.certidao_transito) p.push('Anexe a certidão de trânsito em julgado à cadeia de custódia.');
    // Pendências genéricas → instruções concretas (o que anexar, qual data, qual dígito).
    const motivosKyc = statusKyc === 'pendente' && !loadingDueDiligence
      ? motivosKycPendente({
          kyc: kycResult,
          declaracaoAnexada: declaracaoCustodiada,
          comprovanteAnexado: comprovanteCustodiado,
          comprovanteEmissao: comprovanteEnderecoData,
          hoje: new Date().toISOString().slice(0, 10),
        })
      : [];
    return detalharPendencias(p, motivosKyc, motivoDocumentoCedente(credorDocCompleto, selectedPrecatorio.cedenteDocumento));
  }, [loadingDueDiligence, custodiaPrec, origemPrec, selectedPrecatorio, statusDueDiligence, statusKyc, kycResult, dataTransitoJulgado, responsavelPrec, parecerPrec, declaracaoCustodiada, comprovanteCustodiado, comprovanteEnderecoData, comprovanteValido, credorDocCompleto, credorConfere]);

  // Troca de precatório: documentos e parecer são do crédito anterior — zera tudo, menos o responsável.
  useEffect(() => {
    setCustodiaPrec({});
    setDataTransitoJulgado('');
    setComprovanteEnderecoData('');
    setParecerPrec('');
    setCredorDocCompleto('');
    setLaudoPrec(null);
    setErroLaudoPrec(null);
  }, [selectedPrecatorio.id]);

  // Carregar dados quando seleciona precatório
  useEffect(() => {
    let isMounted = true;
    async function carregarDados() {
      setLoadingDueDiligence(true);
      try {
        // 1. Due Diligence com circuit breaker e crawlers
        const dd = await dueDiligenceEngine.executeDueDiligence({
          numeroOficio: selectedPrecatorio.numeroOficio,
          numeroProcesso: selectedPrecatorio.numeroProcesso,
          tribunal: selectedPrecatorio.tribunal,
          cpfCnpjCredor: selectedPrecatorio.cedenteDocumento,
          enteDevedor: selectedPrecatorio.enteDevedor,
          esfera: selectedPrecatorio.esfera,
          ufEnte: selectedPrecatorio.ufEnte,
          natureza: selectedPrecatorio.natureza,
          dataTransitoJulgado: transitoValido, // P28: lido da certidão; nunca presumido
          valorEstimado: selectedPrecatorio.valorEstimadoAtual
        });

        // 2. Atualização Monetária Segmentada
        const atualizacao = precificacaoEngine.atualizarMonetariamente({
          valorOriginal: selectedPrecatorio.valorOriginal,
          dataBase: selectedPrecatorio.dataExpedicao
        });

        // 3. Proposta de Cessão vinculante
        const proposta = await precificacaoEngine.gerarPropostaCessao({
          precatorioId: selectedPrecatorio.id,
          numeroOficio: selectedPrecatorio.numeroOficio,
          credorNome: selectedPrecatorio.cedenteMascarado,
          credorCpfCnpj: selectedPrecatorio.cedenteDocumento,
          valorFaceAtualizado: atualizacao.valorTotalAtualizado,
          desagioPercentual: desagioDesejado,
          expectativaMeses: selectedPrecatorio.anoLOA >= 2027 ? 24 : 12,
          scoreSegurancaJuridica: dd.scoreSegurancaJuridica
        });

        // 4. KYC Cedente
        const kyc = await complianceEngine.executarKycCedente({
          // KYC roda sobre o documento completo conferido; a máscara da listagem não identifica ninguém.
          cpfCnpj: credorConfere ? credorDocCompleto : selectedPrecatorio.cedenteDocumento,
          nome: selectedPrecatorio.cedenteMascarado,
          valorOperacao: proposta.valorLiquidoCredor,
          // P28: só vale o que está na custódia — antes eram presumidos (comprovante "de 30 dias" e declaração "assinada").
          comprovanteEnderecoEmissaoData: comprovanteValido,
          declaracaoOrigemAssinada: declaracaoCustodiada
        });

        if (isMounted) {
          setDueDiligence(dd);
          setMemoriaCalculo(atualizacao);
          setPropostaTerm(proposta);
          setKycResult(kyc);
        }
      } catch (err) {
        console.error('Erro ao executar pipeline do precatório:', err);
      } finally {
        if (isMounted) setLoadingDueDiligence(false);
      }
    }

    carregarDados();
    return () => {
      isMounted = false;
    };
  }, [selectedPrecatorio, desagioDesejado, transitoValido, comprovanteValido, declaracaoCustodiada, credorConfere]);

  const anexarDocumentoPrec = async (key: string, file: File) => {
    setErroLaudoPrec(null);
    try {
      const registro = await registrarCustodiaArquivo(file.name, await file.arrayBuffer(), 'Responsável técnico / Velatrix Custody Enclave');
      setCustodiaPrec(prev => ({ ...prev, [key]: registro }));
    } catch {
      setErroLaudoPrec(`Falha ao gerar o SHA-256 de ${file.name}: o arquivo não entrou na cadeia de custódia.`);
    }
  };

  const emitirLaudoPrecatorio = () => {
    if (pendenciasPrec.length || !dueDiligence || !kycResult) {
      setErroLaudoPrec(`Laudo bloqueado: ${pendenciasPrec[0] || 'due diligence/KYC ainda não concluídos.'}`);
      return;
    }
    const t0 = performance.now();
    try {
      const issuedAt = new Date().toISOString();
      const custodiaLista = Object.values(custodiaPrec);
      const sectionsPayload = {
        identificacao_credito: {
          titulo: '1. Identificação do Crédito',
          numeroOficio: selectedPrecatorio.numeroOficio,
          processoOrigem: selectedPrecatorio.numeroProcesso,
          tribunal: selectedPrecatorio.tribunal,
          enteDevedor: selectedPrecatorio.enteDevedor,
          esfera: selectedPrecatorio.esfera,
          natureza: selectedPrecatorio.natureza,
          valorFace: selectedPrecatorio.valorOriginal,
          dataExpedicao: selectedPrecatorio.dataExpedicao,
          dataTransitoJulgado,
          credorDocumento: selectedPrecatorio.cedenteDocumento,
          credorDocumentoConferido: credorConfere
        },
        due_diligence: {
          titulo: '2. Due Diligence do Crédito',
          execucao: statusDueDiligence,
          autentico: dueDiligence.autentico,
          penhorasAtivas: dueDiligence.penhoras.length,
          cessoesAnteriores: dueDiligence.cessoesAnteriores.length,
          litispendencia: dueDiligence.litispendencia,
          coisaJulgadaRescisoria: dueDiligence.coisaJulgadaRescisoria,
          scoreSegurancaJuridica: dueDiligence.scoreSegurancaJuridica,
          fontesConsultadas: dueDiligence.fontesConsultadas
        },
        kyc_cedente: {
          titulo: '3. KYC / PLD do Cedente',
          execucao: statusKyc,
          pepIdentificado: kycResult.pepIdentificado,
          provaDeVida: kycResult.provaDeVidaStatus,
          kycAuditHash: kycResult.kycAuditHash
        },
        atualizacao_monetaria: {
          titulo: '4. Atualização Monetária',
          valorTotalAtualizado: memoriaCalculo ? memoriaCalculo.valorTotalAtualizado : 'não calculada'
        },
        cadeia_custodia: {
          titulo: '5. Documentos Examinados',
          arquivos: custodiaLista.map(c => ({ nome: c.filename, hashSha256: c.sha256, carimboTempo: c.uploadedAt }))
        },
        parecer: {
          titulo: '6. Parecer do Responsável Técnico',
          texto: parecerPrec.trim(),
          responsabilidadeClasse: `${responsavelPrec.nome.trim()} — ${responsavelPrec.registro.trim()}`
        }
      };

      const reportInput: Omit<StandardizedAuditReport, 'auditHash'> = {
        reportId: `${service.reportSchema?.idPrefix || 'LDO-PREC'}-${secureInt(10000, 99999)}`,
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        reportType: service.reportSchema?.reportType || 'DUE_DILIGENCE_PRECATORIO',
        reportTypeLabel: 'Laudo de Due Diligence de Precatório',
        issuedAt,
        issuedAtFormatted: new Date(issuedAt).toLocaleString('pt-BR'),
        tenantId,
        tenantName,
        tenantCnpj,
        lgpdCompliance: {
          isCompliant: true,
          dataProtectionOfficer: 'Encarregado (DPO) do tenant',
          dataMaskingApplied: true,
          retentionPeriodDays: 1825,
          legalBasis: 'Art. 7º, II e VI da Lei 13.709/2018',
          anonymizedFields: ['Nome do cedente mascarado na listagem']
        },
        signer: signerPendente(responsavelPrec, 'Responsável Técnico — Precatórios'),
        pipelineSnapshot: {
          verifiedRealSources: custodiaLista.map(c => `${c.filename} [SHA-256: ${c.sha256.slice(0, 8)}…]`),
          executionTimeMs: Math.round(performance.now() - t0),
          dataSourceIntegrity: integridadeDasFontes(origemPrec)
        },
        sectionsPayload,
        status: 'VALID'
      };

      const auditHash = validateAndComputeReportHash(reportInput);
      const finalReport: StandardizedAuditReport = { ...reportInput, auditHash };
      CentralAuditReportService.saveReport(finalReport);
      setLaudoPrec(finalReport);
      setIsLaudoPrecOpen(true);
      setErroLaudoPrec(null);
      onReportGenerated?.(finalReport);
    } catch (err: unknown) {
      setErroLaudoPrec(err instanceof Error ? err.message : 'Falha na emissão do laudo de due diligence.');
    }
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer mb-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Catálogo de Serviços</span>
        </button>
      )}

      {/* Top Banner de Governança & Compliance */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 border border-cyan-500/30 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                Velatrix AOS v3.0 Enterprise
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                EC 113/2021 (SELIC)
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold">
                Lei 14.973/2024 (Compensação 75%)
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold">
                BaaS: {tenantConfig.baasProviderType}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold">
                KYC: {tenantConfig.kycProviderType}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5 font-mono">
              Precatórios & Liquidez Judicial — Esteira Unificada
            </h2>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Orquestração e integridade criptográfica pura. Não operamos financeiramente nem custodiamos recursos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Provedores do Tenant</span>
            </button>

            {dueDiligence && (
              <ScoreJuridicoBadge
                score={dueDiligence.scoreSegurancaJuridica}
                bloqueadoAutomatico={dueDiligence.bloqueioAutomatico}
                motivoBloqueio={dueDiligence.motivoBloqueio}
                size="lg"
              />
            )}
          </div>
        </div>
      </div>

      {/* Bifurcação: Seletor de Modalidade (Discriminated Union) */}
      <BifurcacaoKindSelector selectedKind={kind} onSelectKind={setKind} />

      {/* Seletor / Switcher de Precatório Ativo */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-slate-300 uppercase">
            Precatório em Análise:
          </span>
          <select
            value={selectedPrecatorio.id}
            onChange={e => {
              const p = oportunidades.find(o => o.id === e.target.value);
              if (p) setSelectedPrecatorio(p);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            {oportunidades.map(op => (
              <option key={op.id} value={op.id}>
                {op.numeroOficio} — {op.tribunal} ({op.enteDevedor}) • R$ {op.valorEstimadoAtual.toLocaleString('pt-BR')}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Ente: <strong className="text-slate-200">{selectedPrecatorio.enteDevedor}</strong></span>
          <span>•</span>
          <span>LOA: <strong className="text-cyan-400">{selectedPrecatorio.anoLOA}</strong></span>
          <span>•</span>
          <span>Natureza: <strong className="text-emerald-400">{selectedPrecatorio.natureza}</strong></span>
        </div>
      </div>

      {/* Barra de Navegação pelos 5 Estágios da Esteira */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { num: 1, title: 'Recepção & Datajud', badge: 'D0' },
          { num: 2, title: 'Due Diligence & Penhoras', badge: 'D+1' },
          { num: 3, title: 'SELIC EC 113 & VPL', badge: 'D+2' },
          { num: 4, title: 'Escritura & Formalização', badge: 'D+3' },
          { num: 5, title: 'Habilitação & BaaS Pix', badge: 'D+5' }
        ].map(step => {
          const isActive = activeTabEstagio === step.num;
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveTabEstagio(step.num)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="font-bold">#0{step.num}</span>
                <span className="px-1.5 py-0.2 rounded bg-black/40 text-slate-400">{step.badge}</span>
              </div>
              <div className="text-xs font-bold font-mono leading-tight">{step.title}</div>
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DOS ESTÁGIOS */}

      {/* ESTÁGIO 1: Recepção do Título & Validação da Dívida */}
      {activeTabEstagio === 1 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                Estágio #01 • SLA 24h • Executor: Advogado & Triagem
              </span>
              <h3 className="text-base font-bold text-white font-mono mt-0.5">
                Recepção do Título & Consulta Integrada aos Tribunais
              </h3>
            </div>
            {dueDiligence && (
              <ScoreJuridicoBadge score={dueDiligence.scoreSegurancaJuridica} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Dados Requisitórios</span>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Ofício:</span>
                <span className="text-slate-200 font-bold">{selectedPrecatorio.numeroOficio}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Autos Judiciais:</span>
                <span className="text-slate-200 font-bold">{selectedPrecatorio.numeroProcesso}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Tribunal / Esfera:</span>
                <span className="text-cyan-300 font-bold">{selectedPrecatorio.tribunal} ({selectedPrecatorio.esfera})</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Orçamento LOA:</span>
                <span className="text-emerald-400 font-bold">{selectedPrecatorio.anoLOA}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Fontes Oficiais Consultadas (4h TTL)</span>
              {dueDiligence?.fontesConsultadas.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-900">
                  <span className="text-slate-300">{f.tribunalOuOrgao}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    f.status === 'SUCESSO'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {f.status === 'SUCESSO' ? 'OK 200' : '— dado não disponível —'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ESTÁGIO 2: Due Diligence de Titularidade, Penhoras & Cadeia Notarial */}
      {activeTabEstagio === 2 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                Estágio #02 • SLA 48h • Auditoria Preventiva
              </span>
              <h3 className="text-base font-bold text-white font-mono mt-0.5">
                Varredura de Penhoras (SisbaJud), Litispendência & KYC/PLD
              </h3>
            </div>
            {dueDiligence?.bloqueioAutomatico && (
              <span className="px-2.5 py-1 rounded bg-rose-950 border border-rose-500 text-rose-300 text-xs font-mono font-bold">
                BLOQUEIO PREVENTIVO ATIVO
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block uppercase text-[10px]">Penhoras Ativas</span>
              <span className="text-base font-bold text-emerald-400 mt-1 block">
                {dueDiligence?.penhoras.length === 0 ? '0 Penhoras Detectadas' : `${dueDiligence?.penhoras.length} Penhora(s)`}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{IS_DEMO_MODE ? 'Simulado · SisbaJud não conectado' : 'Varredura BacenJud / SisbaJud OK'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block uppercase text-[10px]">KYC / PLD Cedente (≥ R$ 50k)</span>
              <span className="text-base font-bold text-emerald-400 mt-1 block">
                {kycResult?.aprovado
                  ? (IS_DEMO_MODE && tenantConfig.kycProviderType !== 'MANUAL'
                            ? `Simulado (${tenantConfig.kycProviderType})`
                            : `Aprovado (${tenantConfig.kycProviderType === 'MANUAL' ? 'Auditoria Manual' : tenantConfig.kycProviderType})`)
                  : 'Pendente Documental'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {tenantConfig.kycProviderType === 'MANUAL'
                  ? 'Modo Instrução Manual Ativo'
                  : 'Circular BCB 3.978 / COAF 40'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block uppercase text-[10px]">Cadeia de Cessões Merkle</span>
              <span className="text-base font-bold text-cyan-300 mt-1 block">
                {dueDiligence?.cessoesAnteriores.length === 0 ? 'Cadeia Limpa (Titular)' : 'Cessões Preexistentes'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {complianceEngine.getCadeiaCessoes('CESS-ORIG-001').length} elos auditados
              </span>
            </div>
          </div>

          {/* Timeline da Cadeia */}
          <CadeiaCessoesTimeline
            key={versaoLedger}
            hashesEncadeados={complianceEngine.getCadeiaCessoes('CESS-ORIG-001')}
          />
        </div>
      )}

      {/* ESTÁGIO 3: Atualização Monetária Segmentada (SELIC EC 113) & Precificação */}
      {activeTabEstagio === 3 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                Estágio #03 • SLA 24h • Executor: Perito Contábil (CRC)
              </span>
              <h3 className="text-base font-bold text-white font-mono mt-0.5">
                Atualização Monetária Segmentada & Cálculo de Deságio / VPL
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Deságio:</span>
              <input
                type="number"
                step="0.5"
                min="5"
                max="60"
                value={desagioDesejado}
                onChange={e => setDesagioDesejado(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold text-xs"
              />
              <span className="text-xs font-mono text-slate-400">%</span>
            </div>
          </div>

          {/* Tabela de Marcos Temporais do STF e EC 113/2021 */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="p-3">Segmento Histórico</th>
                  <th className="p-3">Índice Aplicado</th>
                  <th className="p-3">Base Legal</th>
                  <th className="p-3 text-right">Fator Multiplicador</th>
                  <th className="p-3 text-right">Valor Final Segmento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {memoriaCalculo?.segmentos.map((seg, i) => (
                  <tr key={i} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-slate-200">{seg.periodoRotulo}</td>
                    <td className="p-3 text-cyan-400">{seg.indiceAplicado}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{seg.baseLegal}</td>
                    <td className="p-3 text-right font-bold text-amber-300">{seg.fatorAcumulado.toFixed(4)}x</td>
                    <td className="p-3 text-right font-bold text-slate-100">
                      R$ {seg.valorFinalSegmento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Proposta Card */}
          {propostaTerm && <PropostaCessaoCard proposta={propostaTerm} />}
        </div>
      )}

      {/* ESTÁGIO 4: Minuta da Escritura Pública & Formalização */}
      {activeTabEstagio === 4 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                Estágio #04 • SLA 72h • Lavratura Cartorária & ICP-Brasil
              </span>
              <h3 className="text-base font-bold text-white font-mono mt-0.5">
                Instrumento de Cessão ou Compensação Tributária
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsIcpSignerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <Cpu className="w-4 h-4" />
                <span>Assinar Digitalmente (ICP-Brasil A1)</span>
              </button>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-cyan-300 text-xs font-mono font-bold">
                Lei 8.935/1994 (Notarial)
              </span>
            </div>
          </div>

          {assinaturaIcpResult && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">
                    Minuta assinada com Certificado ICP-Brasil ({assinaturaIcpResult.certificado.subjectName})
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Carimbo do Tempo: {assinaturaIcpResult.carimboDoTempoIcpBrasil} • AC: {assinaturaIcpResult.certificado.emissorAC}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold">
                PAdES Encadeado
              </span>
            </div>
          )}

          {/* Se modalidade for compensação tributária, renderiza o simulador formal */}
          {kind === 'compensacao_tributaria' ? (
            <CompensacaoSimulatorForm
              valorPrecatorioPadrao={memoriaCalculo?.valorTotalAtualizado || selectedPrecatorio.valorEstimadoAtual}
              precatorioId={selectedPrecatorio.id}
            />
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold uppercase text-[10px]">Minuta Gerada via Template HBS</span>
                <span className="text-emerald-400">Hash SHA-256 Registrado</span>
              </div>
              <div className="p-3 rounded-lg bg-black/60 border border-slate-800 text-slate-300 text-[11px] leading-relaxed font-mono">
                {`INSTRUMENTO PARTICULAR DE PROPOSTA VINCULANTE DE CESSÃO DE CRÉDITO JUDICIAL`}
                <br />
                {`OFÍCIO: ${selectedPrecatorio.numeroOficio} | TRIBUNAL: ${selectedPrecatorio.tribunal}`}
                <br />
                {`VALOR ATUALIZADO (SELIC EC 113): R$ ${memoriaCalculo?.valorTotalAtualizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                <br />
                {`DESÁGIO APLICADO: ${desagioDesejado}% | LÍQUIDO AO CREDOR: R$ ${propostaTerm?.valorLiquidoCredor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                <br />
                {`STATUS DA MINUTA: Aprovada pelo Enclave Velatrix com Assinatura ICP-Brasil A1 (${assinaturaIcpResult ? 'ASSINADO' : 'PENDENTE'}).`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ESTÁGIO 5: Habilitação Judicial, Registro no Tribunal & Liquidação Financeira Escrow */}
      {activeTabEstagio === 5 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                Estágio #05 • SLA 120h • Habilitação & Liquidação Financeira
              </span>
              <h3 className="text-base font-bold text-white font-mono mt-0.5">
                Habilitação no Tribunal & Split de Liquidação (BaaS / Manual)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold">
                BaaS: {tenantConfig.baasProviderType}
              </span>
              <button
                type="button"
                onClick={() => setIsDjenModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Peticionamento & DJEN</span>
              </button>
            </div>
          </div>

          {/* Execução de Split: Se BaaS Automático ou Manual */}
          {tenantConfig.baasProviderType !== 'MANUAL' && !instrucaoManual ? (
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase">
                    Split Pix Direto via Provedor BaaS Plugado ({tenantConfig.baasProviderType})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const dests: DestinatarioSplit[] = [
                      {
                        papel: 'CREDOR_ORIGINAL',
                        nome: selectedPrecatorio.cedenteMascarado,
                        cpfCnpj: selectedPrecatorio.cedenteDocumento,
                        chavePix: '11987654321',
                        percentual: 83.5,
                        valorNominal: propostaTerm?.valorLiquidoCredor || 0
                      },
                      {
                        papel: 'ADVOGADO',
                        nome: 'Escritório de Advocacia Parceiro',
                        cpfCnpj: '12.345.678/0001-90',
                        chavePix: 'advocacia@parceiro.com.br',
                        percentual: 15.0,
                        valorNominal: (memoriaCalculo?.valorTotalAtualizado || 0) * 0.15
                      },
                      {
                        papel: 'VELATRIX_PLATAFORMA',
                        nome: 'Velatrix Soluções de Tecnologia S.A.',
                        cpfCnpj: '00.123.456/0001-00',
                        chavePix: 'financeiro@velatrix.com.br',
                        percentual: 1.5,
                        valorNominal: (memoriaCalculo?.valorTotalAtualizado || 0) * 0.015
                      }
                    ];
                    const inst = await complianceEngine.gerarInstrucaoManualSplit({
                      cessaoId: 'CESS-ORIG-001',
                      valorTotalOperacao: (propostaTerm?.valorLiquidoCredor || 0) + ((memoriaCalculo?.valorTotalAtualizado || 0) * 0.165),
                      destinatarios: dests,
                      numeroOficio: selectedPrecatorio.numeroOficio
                    });
                    setInstrucaoManual(inst);
                  }}
                  className="text-amber-400 hover:text-amber-300 underline text-[11px] cursor-pointer"
                >
                  Alternar para Modo Instrução Manual
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block uppercase text-[10px]">Credor Cedente (Líquido)</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    R$ {propostaTerm?.valorLiquidoCredor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block uppercase text-[10px]">Honorários OAB (15%)</span>
                  <span className="text-cyan-300 font-bold text-sm">
                    R$ {((memoriaCalculo?.valorTotalAtualizado || 0) * 0.15).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block uppercase text-[10px]">Fee Plataforma (1.5%)</span>
                  <span className="text-amber-300 font-bold text-sm">
                    R$ {((memoriaCalculo?.valorTotalAtualizado || 0) * 0.015).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {splitEfetivado ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Split Pix Liquidado com Sucesso via {tenantConfig.baasProviderType}!</span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>End-to-End Id Pix: <code className="text-cyan-300">{splitEfetivado.endToEndIdPix}</code></div>
                    <div>Hash do Comprovante: <code className="text-slate-400">{splitEfetivado.comprovanteSha256?.slice(0, 32)}...</code></div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={executandoSplit}
                    onClick={async () => {
                      setExecutandoSplit(true);
                      try {
                        const total = (propostaTerm?.valorLiquidoCredor || 0) + ((memoriaCalculo?.valorTotalAtualizado || 0) * 0.165);
                        const res = await complianceEngine.executarBaaSSplit({
                          cessaoId: 'CESS-ORIG-001',
                          valorTotalOperacao: total,
                          destinatarios: [
                            {
                              papel: 'CREDOR_ORIGINAL',
                              nome: selectedPrecatorio.cedenteMascarado,
                              cpfCnpj: selectedPrecatorio.cedenteDocumento,
                              chavePix: '11987654321',
                              percentual: 83.5,
                              valorNominal: propostaTerm?.valorLiquidoCredor || 0
                            },
                            {
                              papel: 'ADVOGADO',
                              nome: 'Advogado Titular',
                              cpfCnpj: '12.345.678/0001-90',
                              chavePix: 'advocacia@parceiro.com.br',
                              percentual: 15.0,
                              valorNominal: (memoriaCalculo?.valorTotalAtualizado || 0) * 0.15
                            },
                            {
                              papel: 'VELATRIX_PLATAFORMA',
                              nome: 'Velatrix Soluções S.A.',
                              cpfCnpj: '00.123.456/0001-00',
                              chavePix: 'financeiro@velatrix.com.br',
                              percentual: 1.5,
                              valorNominal: (memoriaCalculo?.valorTotalAtualizado || 0) * 0.015
                            }
                          ],
                          tenantId: effectiveTenantId
                        });
                        setSplitEfetivado(res);
                        setVersaoLedger(v => v + 1);
                      } catch (err) {
                        console.error('Erro ao executar split:', err);
                      } finally {
                        setExecutandoSplit(false);
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-2 shadow-lg"
                  >
                    {executandoSplit ? (
                      <span className="animate-pulse">Processando Split na API {tenantConfig.baasProviderType}...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Disparar Split Pix Direto ({tenantConfig.baasProviderType})</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Modo Instrução Manual Ativo */
            instrucaoManual ? (
              <ManualSplitInstructionCard
                instrucao={instrucaoManual}
                cessaoId="CESS-ORIG-001"
                onComprovanteRegistrado={() => setVersaoLedger(v => v + 1)}
              />
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/30 text-center space-y-3 font-mono text-xs">
                <CreditCard className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-white font-bold text-sm">
                  Modo Instrução Manual de Liquidação Bancária
                </h4>
                <p className="text-slate-400 max-w-lg mx-auto text-[11px] leading-relaxed">
                  O tenant não configurou provedor BaaS direto ou optou por liquidar fora da plataforma. Gere a ordem formal de liquidação em PDF com QR Code Pix copia-e-cola e anexe o comprovante após execução.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const total = (propostaTerm?.valorLiquidoCredor || 0) + ((memoriaCalculo?.valorTotalAtualizado || 0) * 0.165);
                    const inst = await complianceEngine.gerarInstrucaoManualSplit({
                      cessaoId: 'CESS-ORIG-001',
                      valorTotalOperacao: total,
                      destinatarios: [
                        {
                          papel: 'CREDOR_ORIGINAL',
                          nome: selectedPrecatorio.cedenteMascarado,
                          cpfCnpj: selectedPrecatorio.cedenteDocumento,
                          chavePix: '11987654321',
                          percentual: 83.5,
                          valorNominal: propostaTerm?.valorLiquidoCredor || 0
                        },
                        {
                          papel: 'ADVOGADO',
                          nome: 'Escritório de Advocacia Titular',
                          cpfCnpj: '12.345.678/0001-90',
                          chavePix: 'advocacia@parceiro.com.br',
                          percentual: 15.0,
                          valorNominal: (memoriaCalculo?.valorTotalAtualizado || 0) * 0.15
                        },
                        {
                          papel: 'VELATRIX_PLATAFORMA',
                          nome: 'Velatrix Soluções S.A.',
                          cpfCnpj: '00.123.456/0001-00',
                          chavePix: 'financeiro@velatrix.com.br',
                          percentual: 1.5,
                          valorNominal: (memoriaCalculo?.valorTotalAtualizado || 0) * 0.015
                        }
                      ],
                      numeroOficio: selectedPrecatorio.numeroOficio
                    });
                    setInstrucaoManual(inst);
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Gerar Instrução Manual & Códigos Pix
                </button>
              </div>
            )
          )}

          {/* Protocolo Judicial e DJEN Resumo */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Protocolo de Habilitação do Cessionário (DJEN)
              </span>
              <button
                type="button"
                onClick={() => setIsDjenModalOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 text-[11px] underline cursor-pointer"
              >
                Abrir Painel DJEN
              </button>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Juízo da Execução:</span>
              <span className="text-slate-200">{selectedPrecatorio.tribunal}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status da Juntada:</span>
              <span className="text-emerald-400 font-bold">
                {protocoloDjenResult ? `Protocolado: ${protocoloDjenResult.numeroProtocoloJudicial}` : 'Minuta Pronta para Protocolo'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Base Constitucional:</span>
              <span className="text-cyan-300 font-bold">Art. 100 § 14 CF/88 c/c Res. CNJ 303</span>
            </div>
          </div>

          {/* Monitoramento Real-Time */}
          <MonitoramentoDashboard
            precatorioId={selectedPrecatorio.id}
            tribunal={selectedPrecatorio.tribunal}
            numeroProcesso={selectedPrecatorio.numeroProcesso}
          />
        </div>
      )}

      {/* P28 — Laudo de Due Diligence do Precatório */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Laudo de due diligence — documentos examinados
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cada documento entra na cadeia de custódia com SHA-256. Datas vêm dos documentos; nada é presumido.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SLOTS_PRECATORIO.map(slot => {
            const doc = custodiaPrec[slot.key];
            return (
              <label
                key={slot.key}
                className={`block p-3 rounded-xl border text-xs space-y-1 cursor-pointer transition-colors ${
                  doc ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-slate-950/60 border-slate-700 hover:border-cyan-600/60'
                }`}
              >
                <span className="font-bold text-slate-200 block">{slot.label}</span>
                {doc ? (
                  <span className="font-mono text-emerald-300 block truncate" title={doc.sha256}>
                    {doc.filename} · SHA-256 {doc.sha256.slice(0, 12)}…
                  </span>
                ) : (
                  <span className="text-slate-500 block">Selecionar PDF</span>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) void anexarDocumentoPrec(slot.key, f);
                    e.target.value = '';
                  }}
                />
              </label>
            );
          })}
        </div>

        <label className="block space-y-1 text-xs">
          <span className="font-bold text-slate-300">
            CPF/CNPJ completo do cedente <span className="font-mono text-slate-500">(cadastro: {selectedPrecatorio.cedenteDocumento})</span>
          </span>
          <input
            value={credorDocCompleto}
            onChange={e => setCredorDocCompleto(e.target.value)}
            placeholder="Conforme o documento de identificação"
            className={`w-full px-3 py-2 rounded-xl bg-slate-900 border text-slate-200 font-mono ${
              credorDocCompleto && (!credorConfere || erroDocCedente) ? 'border-rose-600' : 'border-slate-700'
            }`}
          />
          {erroDocCedente && <span className="block text-[11px] text-rose-400">{erroDocCedente}</span>}
          {!erroDocCedente && credorDocCompleto.trim() && !credorConfere && (
            <span className="block text-[11px] text-rose-400">Não confere com o cadastro ({selectedPrecatorio.cedenteDocumento}).</span>
          )}
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block space-y-1 text-xs">
            <span className="font-bold text-slate-300">Trânsito em julgado (conforme a certidão)</span>
            <input
              type="date"
              value={dataTransitoJulgado}
              onChange={e => setDataTransitoJulgado(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono"
            />
          </label>
          <label className="block space-y-1 text-xs">
            <span className="font-bold text-slate-300">Emissão do comprovante de endereço</span>
            <input
              type="date"
              value={comprovanteEnderecoData}
              onChange={e => setComprovanteEnderecoData(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl bg-slate-900 border text-slate-200 font-mono ${comprovanteVencido ? 'border-rose-600' : 'border-slate-700'}`}
            />
            {idadeComprovanteDias !== null && (
              <span className={`block text-[11px] ${comprovanteVencido || idadeComprovanteDias < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                {idadeComprovanteDias < 0
                  ? 'Data no futuro.'
                  : comprovanteVencido
                    ? `Emitido há ${idadeComprovanteDias} dias — o KYC aceita até ${VALIDADE_COMPROVANTE_DIAS}. Anexe um mais recente.`
                    : `Emitido há ${idadeComprovanteDias} dias (válido até ${VALIDADE_COMPROVANTE_DIAS}).`}
              </span>
            )}
          </label>
        </div>
      </div>

      <ResponsavelLaudoCard
        conselhosAceitos={CONSELHOS_PRECATORIO}
        responsavel={responsavelPrec}
        onResponsavelChange={setResponsavelPrec}
        campos={[
          { key: 'parecer', label: 'Parecer sobre o crédito', placeholder: 'Liquidez, riscos identificados (penhoras, cessões, rescisória), recomendação…', min: 40, value: parecerPrec }
        ]}
        onCampoChange={(_k, v) => setParecerPrec(v)}
        pendencias={pendenciasPrec}
        avisoDemonstracao={IS_DEMO_MODE}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={emitirLaudoPrecatorio}
          disabled={pendenciasPrec.length > 0}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            pendenciasPrec.length
              ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
          }`}
        >
          Emitir laudo de due diligence
        </button>
        {laudoPrec && (
          <button
            type="button"
            onClick={() => setIsLaudoPrecOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-sm font-bold cursor-pointer"
          >
            Ver laudo emitido
          </button>
        )}
        {erroLaudoPrec && <span className="text-xs text-rose-400">{erroLaudoPrec}</span>}
      </div>

      <StandardizedAuditReportModal
        report={laudoPrec}
        isOpen={isLaudoPrecOpen}
        onClose={() => setIsLaudoPrecOpen(false)}
      />

      {/* Modais Plugáveis */}
      <TenantProviderConfigModal
        tenantId={tenantId}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigSaved={cfg => {
          setTenantConfig(cfg);
          setInstrucaoManual(null);
        }}
      />

      <IcpBrasilSignerModal
        isOpen={isIcpSignerOpen}
        onClose={() => setIsIcpSignerOpen(false)}
        documentoId={`MINUTA-${selectedPrecatorio.id}`}
        conteudoDocumento={`INSTRUMENTO_CESSAO_OFICIO_${selectedPrecatorio.numeroOficio}_VALOR_${memoriaCalculo?.valorTotalAtualizado}`}
        cessaoId="CESS-ORIG-001"
        onAssinaturaConcluida={res => {
          setAssinaturaIcpResult(res);
          setVersaoLedger(v => v + 1);
        }}
      />

      <DjenPeticionamentoModal
        isOpen={isDjenModalOpen}
        onClose={() => setIsDjenModalOpen(false)}
        precatorioId={selectedPrecatorio.id}
        numeroProcesso={selectedPrecatorio.numeroProcesso}
        tribunal={selectedPrecatorio.tribunal}
        numeroOficio={selectedPrecatorio.numeroOficio}
        cedenteNome={selectedPrecatorio.cedenteMascarado}
        cedenteDocumento={selectedPrecatorio.cedenteDocumento}
        cessionarioNome={tenantName}
        cessionarioCnpj={tenantCnpj || '00.000.000/0001-00'}
        valorCessao={propostaTerm?.valorLiquidoCredor || selectedPrecatorio.valorEstimadoAtual}
        cessaoId="CESS-ORIG-001"
        onProtocoloRegistrado={prot => {
          setProtocoloDjenResult(prot);
          setVersaoLedger(v => v + 1);
        }}
      />
    </div>
  );
};
