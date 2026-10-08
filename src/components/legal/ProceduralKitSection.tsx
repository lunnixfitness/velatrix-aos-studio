import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Scale, 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  Printer, 
  ExternalLink,
  Edit3,
  Building,
  DollarSign,
  Gavel,
  CheckCircle2,
  FileSpreadsheet,
  Lock,
  Unlock,
  AlertTriangle,
  Fingerprint
} from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { SharedTenantTaxData, PreliminaryTaxTeseEstimate } from '../../services/tenantTaxRecoveryBridge';
import { 
  RevenueShieldService, 
  RevenueShieldState, 
  EXCLUSIVITY_CLAUSE_DRAFT_TEXT,
  EXCLUSIVITY_LEGAL_DISCLAIMER 
} from '../../services/revenueShieldService';
import { PartnerPortfolioService } from '../../services/partnerPortfolioService';
import { RevenueShieldPaymentModal } from './RevenueShieldPaymentModal';
import { ExclusivityAgreementModal } from './ExclusivityAgreementModal';

interface ProceduralKitSectionProps {
  tenantData: SharedTenantTaxData;
}

export const ProceduralKitSection: React.FC<ProceduralKitSectionProps> = ({ tenantData }) => {
  const [shieldState, setShieldState] = useState<RevenueShieldState>(() => RevenueShieldService.get());
  const [selectedDocumentType, setSelectedDocumentType] = useState<'peticao' | 'procuracao' | 'contrato'>('peticao');
  const [selectedTeseId, setSelectedTeseId] = useState<string>(() => {
    return tenantData.preliminaryScan?.teses[0]?.id || 'tese_tema_69';
  });

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isExclusivityModalOpen, setIsExclusivityModalOpen] = useState<boolean>(false);

  // Lawyer & Customization Form State
  const [lawyerName, setLawyerName] = useState<string>('Dr. Marcelo Vasconcelos Ribeiro');
  const [lawyerOab, setLawyerOab] = useState<string>('OAB/SP 384.920');
  const [lawyerEmail, setLawyerEmail] = useState<string>('tributario@vasconcelosadv.com.br');
  const [lawFirmName, setLawFirmName] = useState<string>('Vasconcelos & Associados Advocacia Tributária');
  const [courtJurisdiction, setCourtJurisdiction] = useState<string>('Subseção Judiciária da Justiça Federal de São Paulo/SP');
  const [successFeePercent, setSuccessFeePercent] = useState<number>(20);
  const [partnerSplitPercent, setPartnerSplitPercent] = useState<number>(70); // 70% Parceiro / 30% Velatrix
  
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<boolean>(false);

  useEffect(() => {
    const unsub = RevenueShieldService.subscribe((state) => {
      setShieldState(state);
    });
    return unsub;
  }, []);

  const activeTese = tenantData.preliminaryScan?.teses.find(t => t.id === selectedTeseId) || tenantData.preliminaryScan?.teses[0];
  const teseAmount = activeTese?.estimatedCredit || 1180000;
  const totalAudited = tenantData.preliminaryScan?.totalEstimatedCredits || 2485000;
  const originProofStamp = `[PROVA DE ORIGEM & ANTERIORIDADE VELATRIX AOS :: CNPJ ${tenantData.cnpj} :: HASH: ${shieldState.originProofHash.slice(0, 18)}... :: ID: ${shieldState.originProofId} :: REGISTRO DE CUSTÓDIA D+0]`;

  // Generate dynamic legal text based on variables
  const generatePetitionText = () => {
    const headerBanner = shieldState.isSplitConfirmed
      ? `=== DOCUMENTO OFICIAL HOMOLOGADO - VELATRIX AOS ===\n${originProofStamp}\nCHAVE DE AUDITORIA: ${shieldState.originProofHash}\n\n`
      : `=== [MODO PRÉVIA - DOCUMENTO BLOQUEADO PARA DOWNLOAD DEFINITIVO] ===\n*** AGUARDANDO CONFIRMAÇÃO DE SPLIT VIA PORTAL DE PARCEIROS ***\n${originProofStamp}\n\n`;

    return `${headerBanner}EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) FEDERAL DA VARA CÍVEL DA ${courtJurisdiction.toUpperCase()}

AUTOR: ${tenantData.companyName.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${tenantData.cnpj}, com sede em domicílio tributário ativo, neste ato representada por seus procuradores signatários (Procuração anexa - Doc. 01).

RÉ: UNIÃO FEDERAL (FAZENDA NACIONAL), pessoa jurídica de direito público interno, representada por sua Procuradoria-Geral da Fazenda Nacional (PGFN).

AÇÃO ORDINÁRIA DE REPETIÇÃO DE INDÉBITO TRIBUTÁRIO C/C PEDIDO DE COMPENSAÇÃO ADMINISTRATIVA
Com base no rito do Código de Processo Civil, Código Tributário Nacional (arts. 165 e 168) e na tese jurídica vinculante fixada pelo ${activeTese?.court || 'Supremo Tribunal Federal'}.

I. DO OBJETO E DA TESE JURÍDICA APLICÁVEL
A presente demanda visa ao reconhecimento do direito à repetição/compensação do indébito tributário decorrente da ${activeTese?.title || 'Exclusão do ICMS da Base de Cálculo do PIS/COFINS'}, conforme consagrado no ${activeTese?.code || 'Tema 69 STF (RE 574.706)'}.

Conforme pacificado pela Suprema Corte:
"${activeTese?.jurisprudence || 'O ICMS destacado na nota fiscal não integra a base de cálculo das contribuições ao PIS e à COFINS por não constituir faturamento do contribuinte.'}"

II. DA MEMÓRIA DE CÁLCULO E AUDITORIA PERICIAL (VELATRIX AOS)
A Autora realizou auditoria minuciosa de seus arquivos digitais (SPED Fiscal, EFD-Contribuições e XMLs de notas fiscais) dos últimos 60 (sessenta) meses, processados pelo motor pericial Velatrix AOS sob o Hash de Autenticidade Digital:
HASH SHA-256 DO LAUDO (FIPS 180-4 / Web Crypto): ${tenantData.preliminaryScan?.hashSha256 || '8f2a91c0e5b742aa39f9411dc8219c44b931fae812d46e01a87b32091c77f24d'}
IDENTIFICADOR TÉCNICO DE ANTERIORIDADE: ${shieldState.originProofId}

• Período Auditado: 60 meses ininterruptos (D-60 a D+0)
• Documentos Fiscais Auditados: ${(activeTese?.documentsAnalyzed || 48210).toLocaleString('pt-BR')} documentos
• Regime Tributário: ${tenantData.taxRegime.toUpperCase().replace('_', ' ')}
• Indébito Principal Apurado: ${formatCurrency(teseAmount, 'BRL')}
• Atualização Monetária (Taxa SELIC): ${formatCurrency(teseAmount * 0.284, 'BRL')}
• TOTAL LÍQUIDO REPETÍVEL/COMPENSÁVEL: ${formatCurrency(teseAmount * 1.284, 'BRL')}

III. DOS PEDIDOS
Diante do exposto, requer a Vossa Excelência:
a) A citação da União Federal (Fazenda Nacional);
b) O julgamento de PROCEDÊNCIA TOTAL da presente ação para:
   b.1) Declarar a inexigibilidade dos valores recolhidos a maior a título da tese invocada (${activeTese?.code});
   b.2) Condenar a Ré à restituição/habilitação do crédito apurado no montante de ${formatCurrency(teseAmount * 1.284, 'BRL')}, acrescido de juros SELIC até a liquidação;
   b.3) Reconhecer o direito à compensação administrativa perante a Receita Federal do Brasil (via PER/DCOMP Web);
c) A condenação da Ré em honorários sucumbenciais na forma do art. 85 do CPC.

Dá-se à causa o valor de ${formatCurrency(teseAmount * 1.284, 'BRL')}.

Termos em que,
Pede Deferimento.

Local e Data: São Paulo/SP, ${new Date().toLocaleDateString('pt-BR')}

_____________________________________________________
${lawyerName}
${lawyerOab}
${lawFirmName}

${shieldState.isSplitConfirmed ? '[ASSINATURA DIGITAL ICP-BRASIL VÁLIDA • CERTIFICADO VELATRIX AOS Nº 88291-2026]' : '[PRÉVIA SEM VALIDADE DE PROTOCOLO - LIBERAÇÃO CONDICIONADA AO SPLIT]'}`;
  };

  const generatePowerOfAttorneyText = () => {
    const headerBanner = shieldState.isSplitConfirmed
      ? `=== INSTRUMENTO DE MANDATO HOMOLOGADO - VELATRIX AOS ===\n${originProofStamp}\n\n`
      : `=== [MODO PRÉVIA - MINUTA BLOQUEADA PARA DOWNLOAD OFICIAL] ===\n*** AGUARDANDO CONFIRMAÇÃO DE SPLIT ***\n\n`;

    return `${headerBanner}PROCURAÇÃO "AD JUDICIA ET EXTRA"

OUTORGANTE:
${tenantData.companyName.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${tenantData.cnpj}, com sede em domicílio tributário no Estado de SP, neste ato representada por seus diretores/administradores legais com poderes para este ato.

OUTORGADOS:
${lawyerName.toUpperCase()}, brasileiro, advogado, inscrito na ${lawyerOab}, com escritório profissional na ${lawFirmName}, e-mail: ${lawyerEmail}.

PODERES:
Por este instrumento particular de mandato, o OUTORGANTE confere aos OUTORGADOS amplos e gerais poderes para o foro em geral, conferidos pela cláusula "ad judicia et extra", para representá-lo perante a Justiça Federal de 1º e 2º Graus, Superior Tribunal de Justiça (STJ), Supremo Tribunal Federal (STF), bem como perante os órgãos da Administração Pública Direta e Indireta, especialmente a Secretaria da Receita Federal do Brasil (RFB), Procuradoria-Geral da Fazenda Nacional (PGFN), Secretarias de Estado de Fazenda (SEFAZ), Delegacias Regionais de Julgamento (DRJ) e Conselho Administrativo de Recursos Fiscais (CARF).

PODERES ESPECÍFICOS:
Poderes expressos para requerer habilitação de créditos tributários decorrentes de decisões judiciais transitadas em julgado (Instrução Normativa RFB nº 2055/2021), transmitir Declarações de Compensação (PER/DCOMP Web), protocolar requerimentos de Transação Tributária por Adesão ou Individual na PGFN (REGULARIZE), acessar processos digitais no e-CAC via procuração eletrônica, assinar termos de adesão a parcelamentos, transigir, acordar, receber valores via RPV ou Precatório, firmar compromissos e substabelecer com ou sem reserva de poderes.

CONFORMIDADE LGPD (LEI 13.709/2018) E ANTERIORIDADE TÉCNICA:
Os dados fiscais e cadastrais compartilhados com os OUTORGADOS são utilizados exclusivamente para a consecução dos serviços jurídicos e periciais tributários contratados, sob rigoroso dever de sigilo profissional e proteção de dados, com prova técnica de anterioridade ${shieldState.originProofId}.

${tenantData.companyName}
CNPJ nº ${tenantData.cnpj}

São Paulo/SP, ${new Date().toLocaleDateString('pt-BR')}

_____________________________________________________
REPRESENTANTE LEGAL DO OUTORGANTE
Assinatura Digital ICP-Brasil / e-CNPJ`;
  };

  const generateContractText = () => {
    const totalWithSelic = teseAmount * 1.284;
    const totalHonorarios = totalWithSelic * (successFeePercent / 100);
    const partnerCut = totalHonorarios * (partnerSplitPercent / 100);
    const velatrixCut = totalHonorarios * ((100 - partnerSplitPercent) / 100);

    const headerBanner = shieldState.isSplitConfirmed
      ? `=== INSTRUMENTO CONTRATUAL HOMOLOGADO - VELATRIX AOS ===\n${originProofStamp}\n\n`
      : `=== [MODO PRÉVIA - INSTRUMENTO CONTRATUAL BLOQUEADO PARA USO FINAL] ===\n*** AGUARDANDO CONFIRMAÇÃO DE SPLIT ***\n\n`;

    return `${headerBanner}CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS, PERÍCIA TRIBUTÁRIA DIGITAL E LICENCIAMENTO DE PLATAFORMA COM CLÁUSULA DE ÊXITO ("SUCCESS FEE") E NÃO-CIRCUNVENÇÃO

CONTRATANTE:
${tenantData.companyName.toUpperCase()}, inscrita no CNPJ sob o nº ${tenantData.cnpj}, com sede no território nacional.

CONTRATADA (ASSESSORIA JURÍDICA E ORIGINAÇÃO):
${lawFirmName.toUpperCase()}, representada pelo ${lawyerName} (${lawyerOab}).

PARCEIRA TÉCNICA EM TECNOLOGIA, PERÍCIA ALGORÍTMICA E LICENCIAMENTO:
HOLDING VELATRIX TECNOLOGIA LTDA, desenvolvedora e proprietária da plataforma pericial Velatrix AOS (Registro de Anterioridade nº ${shieldState.originProofId}).

CLÁUSULA 1ª — DO OBJETO:
O presente contrato tem por objeto a prestação de serviços de auditoria digital de 60 meses, recuperação de créditos fiscais e ajuizamento de ações/compensações tributárias administrativas relativas a: ${activeTese?.title || 'Teses Tributárias Pacificadas'}, no montante inicial estimado de ${formatCurrency(teseAmount, 'BRL')}.

CLÁUSULA 2ª — DOS HONORÁRIOS DE ÊXITO ("QUOTA LITIS"):
A CONTRATANTE pagará a título de honorários advocatícios e periciais o percentual de ${successFeePercent}% (${successFeePercent} por cento) calculado EXCLUSIVAMENTE sobre o efetivo benefício econômico auferido (crédito homologado pela RFB ou compensado em tributos correntes).

Parágrafo Único: Não haverá cobrança de honorários iniciais ("pro labore"), vinculando-se a remuneração integralmente ao sucesso financeiro da medida.

CLÁUSULA 3ª — DA REPARTIÇÃO DE HONORÁRIOS E LICENCIAMENTO DE SOFTWARE:
1. DOS HONORÁRIOS DE ÊXITO POR RECUPERAÇÃO PONTUAL:
Os honorários de êxito auferidos sobre o crédito recuperado serão liquidados e divididos na seguinte proporção irrevogável:
• ${partnerSplitPercent}% (setenta por cento) destinados ao Escritório Parceiro Originador (${lawFirmName}): Estimado em ${formatCurrency(partnerCut, 'BRL')}
• ${100 - partnerSplitPercent}% (trinta por cento) destinados à Perícia Técnica Velatrix AOS: Estimado em ${formatCurrency(velatrixCut, 'BRL')}

2. DA ASSINATURA RECORRENTE E LICENCIAMENTO DE SOFTWARE (SAAS):
Os valores auferidos a título de licenciamento recorrente da plataforma Velatrix AOS (módulos de Escudo Preventivo, Auditoria Contínua SPED e Monitoramento de NCMs) constituem receita própria e exclusiva da VELATRIX TECNOLOGIA LTDA, sendo retidos em 100% (cem por cento) por esta, sem comissionamento ou repasse sobre assinaturas.

CLÁUSULA 4ª — DE EXCLUSIVIDADE DE CANAL, ANTERIORIDADE E NÃO-CIRCUNVENÇÃO:
"O Cliente/Parceiro reconhece que os créditos tributários, teses jurídicas e cálculos periciais apresentados através da plataforma Velatrix AOS constituem produto de propriedade intelectual da Velatrix Tecnologia Ltda, identificados e documentados com registro técnico de anterioridade (hash criptográfico ${shieldState.originProofHash} e data de geração ${shieldState.originProofTimestamp}). Fica estabelecido que qualquer aproveitamento administrativo ou judicial desses créditos, ainda que formalizado ou pago fora dos mecanismos de cobrança da plataforma, gera para a Velatrix o direito à taxa de êxito contratualmente prevista, sujeitando a parte infratora, em caso de comprovada circunvenção de pagamento, à multa compensatória equivalente a 30% (trinta por cento) sobre o valor do crédito homologado, sem prejuízo da cobrança judicial dos valores originalmente devidos."
${EXCLUSIVITY_LEGAL_DISCLAIMER}

CLÁUSULA 5ª — DO SIGILO E NÃO-REPÚDIO:
As partes acordam que todos os relatórios periciais gerados pela plataforma Velatrix AOS contam com autenticação criptográfica SHA-256 e certificação pericial digital, com validade plena em juízo ou perante o e-CAC.

E, por estarem justas e contratadas, assinam o presente contrato eletronicamente.

São Paulo/SP, ${new Date().toLocaleDateString('pt-BR')}

____________________________          ____________________________
CONTRATANTE (${tenantData.companyName})        CONTRATADA (${lawFirmName})

____________________________
VELATRIX TECNOLOGIA LTDA`;
  };

  const getActiveText = () => {
    if (selectedDocumentType === 'peticao') return generatePetitionText();
    if (selectedDocumentType === 'procuracao') return generatePowerOfAttorneyText();
    return generateContractText();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveText());
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2500);
  };

  const handleDownloadDoc = () => {
    if (!shieldState.isSplitConfirmed) {
      setIsPaymentModalOpen(true);
      return;
    }

    setIsGeneratingDoc(true);
    const element = document.createElement('a');
    const file = new Blob([getActiveText()], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Velatrix_${selectedDocumentType.toUpperCase()}_${tenantData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_ASSINADO.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    // Dispara Gatilho Automático de Split por Peça/Defesa Judicial Protocolada
    const currentTese = tenantData.preliminaryScan?.teses.find(t => t.id === selectedTeseId);
    PartnerPortfolioService.triggerAutomatedSplitEvent({
      milestoneKey: 'DEFESA_PROTOCOLADA',
      cnpj: tenantData.cnpj,
      companyName: tenantData.companyName,
      creditAmount: currentTese ? currentTese.estimatedCredit : 1250000,
      caseId: `KIT-${selectedDocumentType.toUpperCase()}-${tenantData.cnpj.replace(/\D/g, '').slice(0, 6)}`,
      caseTitle: `Kit Processual (${selectedDocumentType.toUpperCase()}): ${tenantData.companyName}`,
      triggerSourceModule: 'Kit Processual & Remediação Legal',
      notes: `Peça processual ${selectedDocumentType.toUpperCase()} exportada com termo de exclusividade e split de honorários fixado em ${partnerSplitPercent}%.`
    });

    setTimeout(() => setIsGeneratingDoc(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Kit Processual Automático & Blindagem de Receita</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Pronto p/ Protocolo PJe / e-CAC
                </span>
                {shieldState.isSplitConfirmed ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-cyan-400" />
                    Split Confirmado (Downloads Liberados)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    Gate Ativo (Modo Prévia)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Geração de Petição Inicial, Procuração e Contrato Success Fee com cláusula de não-circunvenção e carimbo pericial de anterioridade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsExclusivityModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>Termo de Exclusividade</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all flex items-center gap-2 shadow-sm"
            >
              {copiedStatus ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>

            {shieldState.isSplitConfirmed ? (
              <button
                onClick={handleDownloadDoc}
                disabled={isGeneratingDoc}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingDoc ? 'Exportando...' : 'Baixar Minuta Assinada'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-600/30 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Desbloquear Download (Split Gate)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Shield Gate Warning Alert if locked */}
      {!shieldState.isSplitConfirmed && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <strong>Gate de Liberação Ativo:</strong> As peças estão em modo prévia com marca d’água digital. O download do arquivo assinado e sem marca d’água será liberado após confirmação do split.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
          >
            Confirmar Split via PIX →
          </button>
        </div>
      )}

      {/* Main Grid: Parameters on Left, Live Document Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Document Select & Parametrization (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Step 1: Select Type of Document */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              1. Selecione a Peça Jurídica
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setSelectedDocumentType('peticao')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  selectedDocumentType === 'peticao'
                    ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-5 h-5 ${selectedDocumentType === 'peticao' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-sm font-bold">Petição Inicial Ordinária</div>
                    <div className="text-xs text-slate-400">Repetição de Indébito / Habilitação RFB</div>
                  </div>
                </div>
                {selectedDocumentType === 'peticao' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
              </button>

              <button
                onClick={() => setSelectedDocumentType('procuracao')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  selectedDocumentType === 'procuracao'
                    ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCheck className={`w-5 h-5 ${selectedDocumentType === 'procuracao' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-sm font-bold">Procuração Ad Judicia et Extra</div>
                    <div className="text-xs text-slate-400">Poderes amplos perante RFB, PGFN e Tribunais</div>
                  </div>
                </div>
                {selectedDocumentType === 'procuracao' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
              </button>

              <button
                onClick={() => setSelectedDocumentType('contrato')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  selectedDocumentType === 'contrato'
                    ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Scale className={`w-5 h-5 ${selectedDocumentType === 'contrato' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-sm font-bold">Contrato de Honorários de Êxito</div>
                    <div className="text-xs text-slate-400">Com Cláusula de Não-Circunvenção</div>
                  </div>
                </div>
                {selectedDocumentType === 'contrato' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
              </button>
            </div>
          </div>

          {/* Step 2: Target Tese Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              2. Tese Tributária Vinculada
            </label>
            <select
              value={selectedTeseId}
              onChange={(e) => setSelectedTeseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {(tenantData.preliminaryScan?.teses || []).map((tese) => (
                <option key={tese.id} value={tese.id}>
                  {tese.code} — {tese.title.slice(0, 35)}... ({formatCurrency(tese.estimatedCredit, 'BRL')})
                </option>
              ))}
            </select>
            {activeTese && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Crédito Principal:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(activeTese.estimatedCredit, 'BRL')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Atualização SELIC (+28.4%):</span>
                  <span className="font-bold text-blue-400">{formatCurrency(activeTese.estimatedCredit * 0.284, 'BRL')}</span>
                </div>
                <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1">
                  <span>Valor Total da Causa:</span>
                  <span className="font-bold text-white">{formatCurrency(activeTese.estimatedCredit * 1.284, 'BRL')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Lawyer & Law Firm Customization */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. Dados do Advogado / Escritório Parceiro
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Nome do Advogado:</span>
                <input
                  type="text"
                  value={lawyerName}
                  onChange={(e) => setLawyerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block mb-1">Número OAB:</span>
                  <input
                    type="text"
                    value={lawyerOab}
                    onChange={(e) => setLawyerOab(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Honorários Êxito (%):</span>
                  <input
                    type="number"
                    value={successFeePercent}
                    onChange={(e) => setSuccessFeePercent(Number(e.target.value))}
                    min={10}
                    max={30}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Escritório / Sociedade de Advogados:</span>
                <input
                  type="text"
                  value={lawFirmName}
                  onChange={(e) => setLawFirmName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Foro / Subseção Judiciária:</span>
                <input
                  type="text"
                  value={courtJurisdiction}
                  onChange={(e) => setCourtJurisdiction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Live Document Preview (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl relative">
            
            {/* Document Header Bar */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                  MINUTA_{selectedDocumentType.toUpperCase()}_{tenantData.cnpj.replace(/[^0-9]/g, '')}.DOCX
                </span>
              </div>
              <div className="flex items-center gap-3">
                {shieldState.isSplitConfirmed ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    ICP-Brasil & Split Homologado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                    <Lock className="w-3.5 h-3.5" />
                    Marca d’Água Ativa (Bloqueado)
                  </span>
                )}
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedStatus ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Document Content View with Watermark overlay if locked */}
            <div className="p-6 md:p-8 bg-slate-950/90 text-slate-200 font-mono text-xs leading-relaxed overflow-y-auto max-h-[640px] whitespace-pre-wrap selection:bg-indigo-600 selection:text-white border-t border-slate-900 relative">
              {!shieldState.isSplitConfirmed && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-10 overflow-hidden z-20">
                  <div className="text-5xl font-black text-amber-300 rotate-[-25deg] uppercase tracking-widest text-center">
                    PRÉVIA NÃO HOMOLOGADA<br />
                    AGUARDANDO CONFIRMAÇÃO DE SPLIT<br />
                    VELATRIX AOS
                  </div>
                </div>
              )}
              <div className="relative z-10">
                {getActiveText()}
              </div>
            </div>

            {/* Document Footer Bar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-indigo-400" />
                <span className="truncate">{originProofStamp}</span>
              </div>
              <div className="font-semibold text-slate-300 shrink-0">
                {shieldState.isSplitConfirmed ? 'Liberado para Protocolo' : 'Download Bloqueado'}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Modals */}
      <RevenueShieldPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tenantData={tenantData}
        onPaymentSuccess={() => {
          setShieldState(RevenueShieldService.get());
        }}
      />

      <ExclusivityAgreementModal
        isOpen={isExclusivityModalOpen}
        onClose={() => setIsExclusivityModalOpen(false)}
        tenantData={tenantData}
        onAcceptanceSaved={() => {
          setShieldState(RevenueShieldService.get());
        }}
      />
    </div>
  );
};

