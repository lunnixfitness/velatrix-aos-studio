import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  FileCheck,
  Percent,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  X,
  FileText,
  Building,
  Scissors,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Eye,
  Printer
} from 'lucide-react';
import { SupportedCurrency, SupportedLanguage, AuditRecord } from '../../types/aos';
import { formatCurrency } from '../../utils/i18n';
import { sha256Hex } from '../../shared/crypto/hash';

export type ProfissionalFuncao = 
  | 'CABELEIREIRO' 
  | 'BARBEIRO' 
  | 'ESTETICISTA' 
  | 'MANICURE_PEDICURE' 
  | 'DEPILADOR' 
  | 'MAQUIADOR';

export interface SalaoParceiroContractData {
  salaoRazaoSocial: string;
  salaoCnpj: string;
  salaoEndereco: string;
  profissionalNome: string;
  profissionalCpf: string;
  profissionalMeiCnpj: string;
  funcao: ProfissionalFuncao;
  cotaProfissionalPct: number; // Ex: 60%
  cotaSalaoPct: number;        // Ex: 40%
  estimativaFaturamentoMensal: number;
  prazoMeses: number;
  dataInicio: string;
  custoInsumosResponsavel: 'SALAO' | 'PROFISSIONAL' | 'COMPARTILHADO';
}

interface SalaoParceiroContractCardProps {
  currency?: SupportedCurrency;
  language?: SupportedLanguage;
  onAddAuditRecord?: (record: any) => void;
  className?: string;
}

export const SalaoParceiroContractCard: React.FC<SalaoParceiroContractCardProps> = ({
  currency = 'BRL',
  language = 'pt',
  onAddAuditRecord,
  className = ''
}) => {
  // Estado dos dados do contrato
  const [contractData, setContractData] = useState<SalaoParceiroContractData>({
    salaoRazaoSocial: 'Studio & Barbearia Velatrix Prime Ltda',
    salaoCnpj: '27.819.402/0001-95',
    salaoEndereco: 'Av. Paulista, 1800 - Sala 402, Bela Vista, São Paulo/SP',
    profissionalNome: 'Carlos Eduardo Silveira',
    profissionalCpf: '312.849.108-44',
    profissionalMeiCnpj: '48.910.231/0001-12 (MEI Barbearia & Corte)',
    funcao: 'BARBEIRO',
    cotaProfissionalPct: 60,
    cotaSalaoPct: 40,
    estimativaFaturamentoMensal: 14000,
    prazoMeses: 12,
    dataInicio: new Date().toISOString().slice(0, 10),
    custoInsumosResponsavel: 'SALAO'
  });

  // Modal preview
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [contractGenerated, setContractGenerated] = useState<boolean>(false);
  const [contractHash, setContractHash] = useState<string>('calculando selo…');

  useEffect(() => {
    let active = true;
    setContractHash('calculando selo…');
    sha256Hex(
      `SALAO_PARCEIRO_${contractData.salaoCnpj}_${contractData.profissionalCpf}_${contractData.cotaProfissionalPct}_${contractData.cotaSalaoPct}_${contractData.dataInicio}`
    ).then((h) => {
      if (active) setContractHash(h);
    });
    return () => { active = false; };
  }, [contractData.salaoCnpj, contractData.profissionalCpf, contractData.cotaProfissionalPct, contractData.cotaSalaoPct, contractData.dataInicio]);

  // Split calculations
  const splitCalculations = useMemo(() => {
    const totalFaturamento = contractData.estimativaFaturamentoMensal;
    const repasseProfissional = (totalFaturamento * contractData.cotaProfissionalPct) / 100;
    const retencaoSalao = (totalFaturamento * contractData.cotaSalaoPct) / 100;

    // Economia Tributária estimada:
    // Sem Lei 13.352, o salão pagaria Simples/Presumido sobre 100% da receita (aprox 12% efetivo)
    // Com a Lei, o salão tributa APENAS a cota-parte retida (40%).
    const tributoSemLei = totalFaturamento * 0.12;
    const tributoComLei = retencaoSalao * 0.12;
    const economiaTributariaMensal = tributoSemLei - tributoComLei;
    const economiaTributariaAnual = economiaTributariaMensal * 12;

    return {
      totalFaturamento,
      repasseProfissional,
      retencaoSalao,
      economiaTributariaMensal,
      economiaTributariaAnual,
      contractHash
    };
  }, [contractData, contractHash]);

  // Atualizar cota profissional recalculando a cota salão
  const handleUpdateCotaProfissional = (pct: number) => {
    const validPct = Math.min(90, Math.max(10, pct));
    setContractData((prev) => ({
      ...prev,
      cotaProfissionalPct: validPct,
      cotaSalaoPct: 100 - validPct
    }));
  };

  const handleGenerateContract = () => {
    setContractGenerated(true);
    setIsPreviewModalOpen(true);

    if (onAddAuditRecord) {
      onAddAuditRecord({
        id: `AUDIT-SALAO-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'SALAO_PARCEIRO_CONTRACT_GEN',
        actor: 'Agente Jurídico Trabalhista HUB-07-HR',
        details: `Contrato Lei 13.352 gerado: ${contractData.salaoRazaoSocial} & ${contractData.profissionalNome}. Cota: ${contractData.cotaProfissionalPct}% prof / ${contractData.cotaSalaoPct}% salão. Hash: ${splitCalculations.contractHash}`,
        hash: splitCalculations.contractHash,
        status: 'executed'
      });
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(splitCalculations.contractHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrintOrDownload = () => {
    window.print();
  };

  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[var(--vx-deep)] via-[var(--vx-deep)] to-[var(--vx-deep)] border border-blue-500/30 shadow-xl space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Users className="w-3 h-3" />
              HUB-07-HR • MOTOR DE CONTRATO
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Scissors className="w-3 h-3" />
              LEI DO SALÃO PARCEIRO (LEI Nº 13.352/2016)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              IN RFB Nº 1.712/2017
            </span>
          </div>

          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span>Contrato Salão Parceiro • Cálculo de Cota-Parte &amp; Blindagem Trabalhista</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Instrumento jurídico e fiscal para estabelecer a parceria legal entre estabelecimento de beleza e profissional autônomo, calculando a segregação de receitas e blindando contra passivo de vínculo empregatício.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateContract}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 hover:brightness-110 text-slate-950 font-mono text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Gerar Contrato (PDF)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AVISO EXPLÍCITO OBRIGATÓRIO (REQUISITOS FORMAIS DA LEI 13.352) */}
      <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-mono space-y-2">
        <div className="flex items-center gap-2 font-black text-rose-400 uppercase tracking-wider text-xs">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Aviso Legal Mandatório de Conformidade (Art. 1º-A, § 11 da Lei 13.352/2016):</span>
        </div>
        <p className="text-[11px] leading-relaxed text-rose-300/90">
          A ausência de vínculo empregatício (CLT) entre o <strong>Salão-Parceiro</strong> e o <strong>Profissional-Parceiro</strong> depende estritamente do cumprimento formal dos requisitos previstos na Lei 13.352/2016: homologação obrigatória do instrumento perante o sindicato da categoria (ou SRTE), inscrição ativa do profissional como MEI/autônomo perante os órgãos previdenciários e municipais, e <strong>inexistência de subordinação hierárquica, habitualidade imposta ou controle de jornada de trabalho</strong>. A inobservância formal enseja a nulidade da parceria e o reconhecimento judicial de relação de emprego retroativa com condenação em verbas rescisórias, FGTS e multas.
        </p>
      </div>

      {/* Grid: Simulação de Cota-Parte & Indicadores Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Faturamento Bruto Estimado */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
            <span>Faturamento Bruto Mensal</span>
          </span>
          <div className="text-2xl font-black font-mono text-white">
            {formatCurrency(splitCalculations.totalFaturamento, currency, language)}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Receita total gerada pelos atendimentos do parceiro.
          </p>
        </div>

        {/* Card 2: Cota-Parte Profissional */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cota Profissional</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded font-bold">
              {contractData.cotaProfissionalPct}%
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {formatCurrency(splitCalculations.repasseProfissional, currency, language)}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Repasse líquido de prestação de serviços (isento no salão).
          </p>
        </div>

        {/* Card 3: Cota-Parte Salão (Retenção) */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              <span>Cota Salão (Retenção)</span>
            </span>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded font-bold">
              {contractData.cotaSalaoPct}%
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-blue-400">
            {formatCurrency(splitCalculations.retencaoSalao, currency, language)}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Tributável pelo salão (aluguel de espaço, produtos e infra).
          </p>
        </div>

        {/* Card 4: Economia Tributária Legal */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-purple-400" />
            <span>Economia Tributária Anual</span>
          </span>
          <div className="text-2xl font-black font-mono text-purple-400">
            {formatCurrency(splitCalculations.economiaTributariaAnual, currency, language)}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Economia por não bitributar o repasse ao profissional.
          </p>
        </div>

      </div>

      {/* Formulário Interativo de Parâmetros de Parceria */}
      <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Configurador de Dados da Parceria &amp; Cota-Parte</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Calculadora com split em tempo real
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          
          <div className="space-y-1">
            <label className="text-slate-400">Razão Social do Salão-Parceiro:</label>
            <input
              type="text"
              value={contractData.salaoRazaoSocial}
              onChange={(e) => setContractData({ ...contractData, salaoRazaoSocial: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">CNPJ do Salão-Parceiro:</label>
            <input
              type="text"
              value={contractData.salaoCnpj}
              onChange={(e) => setContractData({ ...contractData, salaoCnpj: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Nome do Profissional-Parceiro:</label>
            <input
              type="text"
              value={contractData.profissionalNome}
              onChange={(e) => setContractData({ ...contractData, profissionalNome: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">CPF do Profissional:</label>
            <input
              type="text"
              value={contractData.profissionalCpf}
              onChange={(e) => setContractData({ ...contractData, profissionalCpf: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">CNPJ MEI / Inscrição Municipal:</label>
            <input
              type="text"
              value={contractData.profissionalMeiCnpj}
              onChange={(e) => setContractData({ ...contractData, profissionalMeiCnpj: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Especialidade / Função Legal:</label>
            <select
              value={contractData.funcao}
              onChange={(e) => setContractData({ ...contractData, funcao: e.target.value as ProfissionalFuncao })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="BARBEIRO">Barbeiro</option>
              <option value="CABELEIREIRO">Cabeleireiro(a)</option>
              <option value="MANICURE_PEDICURE">Manicure e Pedicure</option>
              <option value="ESTETICISTA">Esteticista</option>
              <option value="MAQUIADOR">Maquiador(a)</option>
              <option value="DEPILADOR">Depilador(a)</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-400">Divisão de Cota-Parte:</label>
              <span className="text-cyan-300 font-bold">
                {contractData.cotaProfissionalPct}% Profissional / {contractData.cotaSalaoPct}% Salão
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={contractData.cotaProfissionalPct}
              onChange={(e) => handleUpdateCotaProfissional(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Estimativa Faturamento/Mês (R$):</label>
            <input
              type="number"
              value={contractData.estimativaFaturamentoMensal}
              onChange={(e) => setContractData({ ...contractData, estimativaFaturamentoMensal: Math.max(1000, Number(e.target.value) || 0) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Responsabilidade por Insumos e Produtos:</label>
            <select
              value={contractData.custoInsumosResponsavel}
              onChange={(e) => setContractData({ ...contractData, custoInsumosResponsavel: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="SALAO">Fornecidos Integralmente pelo Salão</option>
              <option value="PROFISSIONAL">Adquiridos pelo Próprio Profissional</option>
              <option value="COMPARTILHADO">Rateio Proporcional Conforme Consumo</option>
            </select>
          </div>

        </div>
      </div>

      {/* MODAL: Visualizador Completo do Contrato da Lei do Salão Parceiro */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-blue-500/40 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white font-mono">
                    Instrumento Particular de Parceria • Lei nº 13.352/2016
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Contrato Formal de Parceria Comercial e Prestação de Serviços Autônomos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintOrDownload}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Estilo Legal) */}
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-4 leading-relaxed">
              
              <div className="text-center space-y-1 border-b border-slate-800 pb-3">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  CONTRATO DE PARCERIA COMERCIAL ENTRE ESTABELECIMENTO DE BELEZA E PROFISSIONAL-PARCEIRO
                </h2>
                <p className="text-[10px] text-cyan-400">
                  FUNDAMENTADO EXPRESSAMENTE NA LEI FEDERAL Nº 13.352, DE 27 DE OUTUBRO DE 2016
                </p>
              </div>

              {/* Partes */}
              <div className="space-y-2">
                <p>
                  <strong>DE UM LADO:</strong> <span className="text-white">{contractData.salaoRazaoSocial}</span>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <span className="text-cyan-300">{contractData.salaoCnpj}</span>, com sede em {contractData.salaoEndereco}, doravante denominada simplesmente <strong>SALÃO-PARCEIRO</strong>;
                </p>
                <p>
                  <strong>DE OUTRO LADO:</strong> <span className="text-white">{contractData.profissionalNome}</span>, profissional autônomo(a), inscrito(a) no CPF sob o nº <span className="text-cyan-300">{contractData.profissionalCpf}</span>, registrado(a) sob o CNPJ MEI nº {contractData.profissionalMeiCnpj}, doravante denominado(a) simplesmente <strong>PROFISSIONAL-PARCEIRO</strong>, no exercício das atribuições legais de <strong className="text-emerald-400">{contractData.funcao}</strong>;
                </p>
                <p>
                  Têm entre si, justo e contratado, o presente instrumento de parceria nos termos dos Arts. 1º-A e 1º-B da Lei Federal nº 13.352/2016:
                </p>
              </div>

              {/* Cláusulas */}
              <div className="space-y-3 pt-2 border-t border-slate-850">
                <div>
                  <h5 className="font-bold text-slate-100">CLÁUSULA PRIMEIRA – DO OBJETO E QUALIFICAÇÃO</h5>
                  <p className="text-[11px] text-slate-400">
                    O presente contrato tem por objeto a formalização da parceria comercial para a prestação de serviços de beleza e estética ({contractData.funcao}), exercidos pelo PROFISSIONAL-PARCEIRO nas dependências e com a infraestrutura disponibilizada pelo SALÃO-PARCEIRO.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-100">CLÁUSULA SEGUNDA – DA COTA-PARTE E REPASSE FINANCEIRO</h5>
                  <p className="text-[11px] text-slate-400">
                    O SALÃO-PARCEIRO efetuará a retenção de sua cota-parte fixada em <strong className="text-cyan-300">{contractData.cotaSalaoPct}% (por cento)</strong> sobre a receita bruta dos serviços prestados, a título de aluguel de bens móveis, utensílios, administração, ponto comercial e uso do espaço físico. Caberá ao PROFISSIONAL-PARCEIRO a cota-parte a título de retribuição pelos serviços correspondente a <strong className="text-emerald-300">{contractData.cotaProfissionalPct}% (por cento)</strong>, repassada quinzenal ou mensalmente.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-100">CLÁUSULA TERCEIRA – DA AUSÊNCIA DE VÍNCULO EMPREGATÍCIO</h5>
                  <p className="text-[11px] text-slate-400">
                    Em conformidade com o Art. 1º-A, § 11 da Lei nº 13.352/2016, as partes reconhecem que inexiste entre elas qualquer vínculo empregatício ou de subordinação hierárquica, tendo o PROFISSIONAL-PARCEIRO ampla autonomia no agendamento de sua clientela, metodologia de execução e ausência de cumprimento de jornada de trabalho obrigatória.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-100">CLÁUSULA QUARTA – DAS OBRIGAÇÕES TRIBUTÁRIAS E PREVIDENCIÁRIAS</h5>
                  <p className="text-[11px] text-slate-400">
                    O PROFISSIONAL-PARCEIRO responde diretamente por suas obrigações tributárias e previdenciárias inerentes à sua condição de autônomo/MEI. O SALÃO-PARCEIRO tributará estritamente a cota-parte retida, não integrando a cota do parceiro na sua base de cálculo do Simples Nacional ou Lucro Presumido, conforme IN RFB nº 1.712/2017.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-100">CLÁUSULA QUINTA – DA HOMOLOGAÇÃO SINDICAL E VIGÊNCIA</h5>
                  <p className="text-[11px] text-slate-400">
                    O contrato vigorará pelo prazo de <strong className="text-slate-200">{contractData.prazoMeses} meses</strong> a contar de {contractData.dataInicio}, sendo submetido à homologação perante a entidade sindical laboral representativa da categoria ou órgão do Ministério do Trabalho, condição formal de plena eficácia jurídica.
                  </p>
                </div>
              </div>

              {/* Assinatura Hash */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                <span>Certificação Digital Hash SHA-256: <code className="text-cyan-400">{splitCalculations.contractHash}</code></span>
                <span>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash ? 'Hash Copiado' : 'Copiar Hash de Auditoria'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={handlePrintOrDownload}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 hover:brightness-110 text-slate-950 font-mono text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Contrato Formal (PDF)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
