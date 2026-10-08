import React, { useState } from 'react';
import { 
  Scale, 
  X, 
  Building2, 
  UserCheck, 
  Check, 
  Copy, 
  FileText, 
  Link as LinkIcon, 
  Sparkles, 
  AlertCircle, 
  DollarSign, 
  CheckCircle2, 
  Download,
  ArrowRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { saveSplitDeal } from '../../services/dataService';


export interface CustomSplitDealData {
  clientName: string;
  partnerName: string;
  partnerPercent: number;
  velatrixPercent: number;
  estimatedRecoveryBrl?: number;
  successFeePercent?: number;
  honorariosTotalEstimado?: number;
  valorParceiro?: number;
  valorVelatrix?: number;
  clientNetAmount?: number;
  dealId?: string;
  splitWebhookUrl?: string;
  contractStatus?: 'draft' | 'active' | 'generated';
}

export interface CustomSplitDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDeal?: (deal: CustomSplitDealData) => void;
  initialClientName?: string;
  initialPartnerName?: string;
  initialEstimatedAmount?: number;
}

export const CustomSplitDealModal: React.FC<CustomSplitDealModalProps> = ({
  isOpen,
  onClose,
  onApplyDeal,
  initialClientName = 'Atlas Metalmecânica & Componentes Ltda.',
  initialPartnerName = 'Vasconcelos & Associados Advocacia Tributária',
  initialEstimatedAmount = 1480000
}) => {
  const [clientName, setClientName] = useState<string>(initialClientName);
  const [partnerName, setPartnerName] = useState<string>(initialPartnerName);
  const [partnerPercent, setPartnerPercent] = useState<number>(50);
  const [velatrixPercent, setVelatrixPercent] = useState<number>(50);
  const [estimatedRecovery, setEstimatedRecovery] = useState<number>(initialEstimatedAmount);
  const [successFeePercent, setSuccessFeePercent] = useState<number>(20);
  
  // Feedback and generated link state
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [isCopiedClause, setIsCopiedClause] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalSum = partnerPercent + velatrixPercent;
  const isValidSplit = totalSum === 100 && partnerPercent >= 0 && velatrixPercent >= 0;

  // Calculo rigoroso de honorarios sobre a base correta de exito
  const safeEstimatedRecovery = Math.max(0, isNaN(estimatedRecovery) ? 0 : estimatedRecovery);
  const safeFeePercent = Math.max(0, Math.min(100, isNaN(successFeePercent) ? 20 : successFeePercent));
  const honorariosTotalEstimado = (safeEstimatedRecovery * safeFeePercent) / 100;
  const valorParceiro = (honorariosTotalEstimado * partnerPercent) / 100;
  const valorVelatrix = (honorariosTotalEstimado * velatrixPercent) / 100;
  const clientNetAmount = Math.max(0, safeEstimatedRecovery - honorariosTotalEstimado);

  const presets = [
    { label: '50 / 50 (Padrão)', partner: 50, velatrix: 50 },
    { label: '60 / 40', partner: 60, velatrix: 40 },
    { label: '70 / 30', partner: 70, velatrix: 30 },
    { label: '75 / 25', partner: 75, velatrix: 25 },
    { label: '80 / 20', partner: 80, velatrix: 20 },
    { label: '90 / 10', partner: 90, velatrix: 10 }
  ];

  const handleApplyPreset = (p: number, v: number) => {
    setPartnerPercent(p);
    setVelatrixPercent(v);
  };

  const handlePartnerChange = (val: number) => {
    setPartnerPercent(val);
  };

  const handleVelatrixChange = (val: number) => {
    setVelatrixPercent(val);
  };

  const handleAutoAdjustVelatrix = () => {
    const adjusted = Math.max(0, 100 - partnerPercent);
    setVelatrixPercent(adjusted);
  };

  const handleGenerateContractAndLink = () => {
    if (!isValidSplit) return;

    const dealSlug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24);
    const splitUrl = `https://velatrix.ai/split/deal-${dealSlug}?p=${partnerPercent}&v=${velatrixPercent}&fee=${safeFeePercent}&sig=sha256_${Date.now().toString(36)}`;
    
    setGeneratedLink(splitUrl);
    setIsGenerated(true);
    setSuccessToast('Split cadastrado com sucesso! Contrato personalizado e Link PIX D+0 gerados.');

    if (onApplyDeal) {
      onApplyDeal({
        clientName,
        partnerName,
        partnerPercent,
        velatrixPercent,
        estimatedRecoveryBrl: safeEstimatedRecovery,
        successFeePercent: safeFeePercent,
        honorariosTotalEstimado,
        valorParceiro,
        valorVelatrix,
        clientNetAmount,
        dealId: `DEAL-${Date.now().toString().slice(-6)}`,
        splitWebhookUrl: splitUrl,
        contractStatus: 'active'
      });
    }

    saveSplitDeal({
      title: `Contrato de Split - ${clientName}`,
      clientName,
      partnerName,
      partnerPct: partnerPercent,
      velatrixPct: velatrixPercent,
      grossAmount: honorariosTotalEstimado,
      estimatedRecovery: safeEstimatedRecovery,
      feeRate: safeFeePercent,
      partnerAmount: Number(valorParceiro.toFixed(2)),
      velatrixAmount: Number(valorVelatrix.toFixed(2)),
      clientNetAmount: Number(clientNetAmount.toFixed(2)),
      splitWebhookUrl: splitUrl,
      status: 'ACTIVE'
    }).catch(e => console.debug('[CustomSplitDealModal] saveSplitDeal fallback:', e));

    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  const dynamicContractClause = `CLÁUSULA DE SUCESSO E SPLIT AUTOMÁTICO DE HONORÁRIOS (${partnerPercent}/${velatrixPercent}):
Fica convencionado entre as partes que sobre o proveito econômico obtido pelo CLIENTE (${clientName || 'CLIENTE'}), estimado em ${formatCurrency(safeEstimatedRecovery, 'BRL')}, incidirão honorários contratuais de êxito de ${safeFeePercent}% (${formatCurrency(honorariosTotalEstimado, 'BRL')}). 
A base de cálculo dos honorários de êxito será dividida estritamente na proporção de:
a) Cota-parte do PARCEIRO (${partnerName || 'PARCEIRO'}): ${partnerPercent}% dos honorários líquidos (equivalente a ${formatCurrency(valorParceiro, 'BRL')});
b) Cota-parte da VELATRIX AUTONOMOUS ENTERPRISE: ${velatrixPercent}% dos honorários líquidos (equivalente a ${formatCurrency(valorVelatrix, 'BRL')}) referente ao licenciamento tecnológico dos motores neurais D+0 e infraestrutura pericial.
Parágrafo Único: O CLIENTE reterá ${formatCurrency(clientNetAmount, 'BRL')} (${(100 - safeFeePercent)}% do proveito econômico homologado). A liquidação e transferência dos valores ocorrerão automaticamente via Split PIX Institucional D+0 na data de compensação ou levantamento financeiro de cada crédito.`;

  const handleCopyClause = () => {
    navigator.clipboard.writeText(dynamicContractClause);
    setIsCopiedClause(true);
    setTimeout(() => setIsCopiedClause(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--vx-deep)] border border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Definição de Split Personalizado (Cadastrar Deal)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                  D+0 Automático
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure livremente a cota-parte de honorários entre Parceiro e Velatrix para este deal.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notifier */}
        {successToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* Seção 1: Identificação do Deal & Parâmetros Econômicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Campo Cliente */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cliente (Nome da Empresa)</span>
              </label>
              <input
                type="text"
                id="input-deal-client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Atlas Metalmecânica Ltda."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Campo Parceiro */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Parceiro (Escritório / Especialista)</span>
              </label>
              <input
                type="text"
                id="input-deal-partner-name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Ex: Vasconcelos & Associados Advocacia"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Campo Crédito Tributário Estimado */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>Crédito Tributário Estimado (R$)</span>
                <span className="text-[10px] text-slate-500 font-mono">Proveito Econômico Bruto</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                  R$
                </span>
                <input
                  type="number"
                  id="input-deal-estimated-recovery"
                  min="0"
                  step="10000"
                  value={isNaN(estimatedRecovery) ? '' : estimatedRecovery}
                  onChange={(e) => setEstimatedRecovery(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Campo Taxa de Honorários de Êxito */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>Honorários Contratuais de Êxito (%)</span>
                <span className="text-[10px] text-emerald-400 font-mono">Base de Cálculo do Split</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="input-deal-success-fee-percent"
                  min="1"
                  max="50"
                  step="1"
                  value={isNaN(successFeePercent) ? '' : successFeePercent}
                  onChange={(e) => setSuccessFeePercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none transition-all pr-8"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">
                  %
                </span>
              </div>
            </div>

          </div>

          {/* Seção 2: Divisão de Honorários de Êxito */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Divisão de Honorários de Êxito
                </h4>
              </div>
              
              {/* Validador de 100% */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Soma:</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isValidSplit 
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-700' 
                    : 'bg-rose-950 text-rose-400 border-rose-700'
                }`}>
                  {totalSum}% {isValidSplit ? '✓ Correto' : '✗ Inválido (deve ser 100%)'}
                </span>
              </div>
            </div>

            {/* Presets rápidos */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 block">
                Atalhos de Proporções Frequentes:
              </span>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => {
                  const isSelected = partnerPercent === p.partner && velatrixPercent === p.velatrix;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p.partner, p.velatrix)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30' 
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campos Numéricos Editáveis Livres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Cota-parte Parceiro */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-300">
                    Cota-parte Parceiro (%)
                  </label>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">
                    Honorários Escritório
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    id="input-partner-split-percent"
                    min="0"
                    max="100"
                    step="1"
                    value={isNaN(partnerPercent) ? '' : partnerPercent}
                    onChange={(e) => handlePartnerChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-base text-white font-mono font-bold focus:border-indigo-500 focus:outline-none transition-all pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Repasse creditado via PIX D+0 diretamente na conta cadastrada.
                </p>
              </div>

              {/* Cota-parte Velatrix */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-300">
                    Cota-parte Velatrix (%)
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Tecnologia &amp; AOS
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    id="input-velatrix-split-percent"
                    min="0"
                    max="100"
                    step="1"
                    value={isNaN(velatrixPercent) ? '' : velatrixPercent}
                    onChange={(e) => handleVelatrixChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-base text-white font-mono font-bold focus:border-indigo-500 focus:outline-none transition-all pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">
                    %
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-mono">
                    Licenciamento tecnológico e motor neural.
                  </p>
                  <button
                    type="button"
                    onClick={handleAutoAdjustVelatrix}
                    className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    Ajustar para 100%
                  </button>
                </div>
              </div>

            </div>

            {/* Simulação Financeira da Divisão */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-400 gap-1 pb-2 border-b border-slate-850">
                <span>
                  Base do Split (Honorários de Êxito {safeFeePercent}% de {formatCurrency(safeEstimatedRecovery, 'BRL')}):
                </span>
                <span className="text-white font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                  {formatCurrency(honorariosTotalEstimado, 'BRL')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Parceiro ({partnerPercent}%)</span>
                    <span className="text-[10px] text-indigo-400 font-bold">Honorários</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-300 block mt-1">
                    {formatCurrency(valorParceiro, 'BRL')}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    {((valorParceiro / (safeEstimatedRecovery || 1)) * 100).toFixed(1)}% do crédito total
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Velatrix ({velatrixPercent}%)</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Tecnologia</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-300 block mt-1">
                    {formatCurrency(valorVelatrix, 'BRL')}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    {((valorVelatrix / (safeEstimatedRecovery || 1)) * 100).toFixed(1)}% do crédito total
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Cliente (Líquido)</span>
                    <span className="text-[10px] text-teal-400 font-bold">{100 - safeFeePercent}%</span>
                  </div>
                  <span className="text-sm font-bold text-slate-200 block mt-1">
                    {formatCurrency(clientNetAmount, 'BRL')}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    Economia tributária retida
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso se a soma for diferente de 100% */}
            {!isValidSplit && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  A soma das duas cotas deve ser rigorosamente 100% (Soma atual: {totalSum}%). Ajuste os campos para continuar.
                </span>
              </div>
            )}

          </div>

          {/* Resultado Gerado: Link e Minuta de Cláusula */}
          {isGenerated && (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Link de Split Automático &amp; Webhook Gerado:</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Pronto para Assinatura
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              {/* Minuta da Cláusula Personalizada */}
              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    Minuta da Cláusula do Contrato Gerada ({partnerPercent}/{velatrixPercent}):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyClause}
                    className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {isCopiedClause ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopiedClause ? 'Copiado!' : 'Copiar Cláusula'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {dynamicContractClause}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer com Botão de Ação Principal */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold cursor-pointer transition-colors"
          >
            Fechar
          </button>

          <button
            type="button"
            id="btn-apply-custom-split-deal"
            disabled={!isValidSplit || !clientName.trim()}
            onClick={handleGenerateContractAndLink}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              isValidSplit && clientName.trim()
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Aplicar e Gerar Contrato / Link de Split Automático</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
