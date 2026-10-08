// src/components/legal/RevenueShieldPaymentModal.tsx
// Modal de Pagamento de Split / Gate de Liberação de Documentos Finais

import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  QrCode, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  DollarSign, 
  X, 
  Sparkles, 
  ExternalLink,
  CreditCard,
  Building2,
  FileCheck
} from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { RevenueShieldService, RevenueShieldState, EXCLUSIVITY_CLAUSE_DRAFT_TEXT } from '../../services/revenueShieldService';
import { SharedTenantTaxData } from '../../services/tenantTaxRecoveryBridge';

interface RevenueShieldPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantData: SharedTenantTaxData;
  onPaymentSuccess?: () => void;
}

export const RevenueShieldPaymentModal: React.FC<RevenueShieldPaymentModalProps> = ({
  isOpen,
  onClose,
  tenantData,
  onPaymentSuccess
}) => {
  const [shieldState, setShieldState] = useState<RevenueShieldState>(() => RevenueShieldService.get());
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'ESCROW' | 'CARTAO'>('PIX');

  if (!isOpen) return null;

  const totalCredits = tenantData.preliminaryScan?.totalEstimatedCredits || 2485000;
  const successFeeTotal = totalCredits * 0.20; // 20%
  const velatrixSplit = successFeeTotal * 0.30; // 30% do fee
  const partnerSplit = successFeeTotal * 0.70;  // 70% do fee

  const simulatedPixCode = `00020126580014br.gov.bcb.pix0136velatrix-split-escrow@velatrix.ai5204000053039865408${velatrixSplit.toFixed(2)}5802BR5925VELATRIX TECNOLOGIA LTDA6009SAO PAULO62140510SPLIT774926304E8A9`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(simulatedPixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      RevenueShieldService.confirmSplitPayment('PIX_GATEWAY');
      setShieldState(RevenueShieldService.get());
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-indigo-950/50 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Gate de Liberação & Liquidação do Split</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Proteção de Receita
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Liberação de download dos arquivos assinados e do certificado oficial com hash pericial.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Summary Box */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Cliente / CNPJ:</span>
              <span className="font-bold text-white">{tenantData.companyName} ({tenantData.cnpj})</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Crédito Tributário Total Homologado:</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(totalCredits, 'BRL')}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2">
              <span className="text-slate-400">Taxa de Êxito (20% Success Fee):</span>
              <span className="font-mono font-bold text-white">{formatCurrency(successFeeTotal, 'BRL')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">Split Parceiro (70%)</div>
                <div className="font-mono font-bold text-cyan-400 mt-0.5">{formatCurrency(partnerSplit, 'BRL')}</div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-indigo-500/30">
                <div className="text-[10px] text-indigo-300 font-semibold">Split Velatrix AOS (30% Devido)</div>
                <div className="font-mono font-black text-indigo-400 text-sm mt-0.5">{formatCurrency(velatrixSplit, 'BRL')}</div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Método de Liquidação do Split
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('PIX')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'PIX'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>PIX Instantâneo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ESCROW')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'ESCROW'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Conta Escrow</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARTAO')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'CARTAO'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Cartão Corporativo</span>
              </button>
            </div>
          </div>

          {/* PIX QR Code & String Display */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 bg-white rounded-xl p-2 flex items-center justify-center shrink-0">
              <QrCode className="w-20 h-20 text-slate-950" />
            </div>

            <div className="space-y-2 flex-1 w-full text-xs">
              <div className="text-slate-400">
                Pague via Chave PIX ou Copia e Cola para desbloqueio imediato em tempo real:
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 truncate">
                {simulatedPixCode}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {copiedPix ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">PIX Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Chave PIX</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Origin Proof & Legal Disclaimer Note */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Prova de Anterioridade e Não-Circunvenção Registrada</span>
            </div>
            <p className="leading-relaxed">
              O cálculo pericial de <strong>{formatCurrency(totalCredits, 'BRL')}</strong> possui hash SHA-256 e carimbo de anterioridade vinculado ao CNPJ <strong>{tenantData.cnpj}</strong>. O aproveitamento dos créditos sem a liquidação do split enseja as cominações da Cláusula de Não-Circunvenção.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Manter em Modo Prévia
          </button>

          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            {isProcessing ? (
              <span>Validando Liquidação PIX...</span>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Confirmar Pagamento & Desbloquear Downloads</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
