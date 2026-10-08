// src/components/legal/SimulatedSplitPaymentModal.tsx
// Modal de Demonstração / Protótipo de Integração de Pagamento com Split Automático e Escrow D+0

import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  UserCheck, 
  FileText, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Link2, 
  DollarSign, 
  Send, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Landmark,
  Barcode,
  Eye,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { 
  SplitPaymentCharge, 
  SplitPaymentSimulationService, 
  DualNfseRecord,
  SplitWebhookPayload
} from '../../services/splitPaymentSimulationService';
import { AuditRecord } from '../../types/aos';

interface SimulatedSplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  charge: SplitPaymentCharge | null;
  onAddAuditRecord?: (record: AuditRecord) => void;
  onChargeUpdated?: (updatedCharge: SplitPaymentCharge) => void;
}

export const SimulatedSplitPaymentModal: React.FC<SimulatedSplitPaymentModalProps> = ({
  isOpen,
  onClose,
  charge: initialCharge,
  onAddAuditRecord,
  onChargeUpdated
}) => {
  const [currentCharge, setCurrentCharge] = useState<SplitPaymentCharge | null>(initialCharge);
  const [activePaymentMethod, setActivePaymentMethod] = useState<'PIX' | 'BOLETO'>('PIX');
  const [activeSubView, setActiveSubView] = useState<'checkout' | 'escrow_flow' | 'nfse' | 'webhook'>('checkout');
  const [isCopiedPix, setIsCopiedPix] = useState<boolean>(false);
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [isCopiedBoleto, setIsCopiedBoleto] = useState<boolean>(false);
  const [isSimulatingSettlement, setIsSimulatingSettlement] = useState<boolean>(false);
  const [settlementStep, setSettlementStep] = useState<number>(0);
  const [showJsonWebhook, setShowJsonWebhook] = useState<boolean>(false);
  const [selectedNfseView, setSelectedNfseView] = useState<DualNfseRecord | null>(null);

  useEffect(() => {
    setCurrentCharge(initialCharge);
    if (initialCharge) {
      setActivePaymentMethod(initialCharge.paymentMethod || 'PIX');
    }
  }, [initialCharge]);

  if (!isOpen || !currentCharge) return null;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(currentCharge.pixCopiaECola);
    setIsCopiedPix(true);
    setTimeout(() => setIsCopiedPix(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentCharge.paymentUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  const handleCopyBoleto = () => {
    navigator.clipboard.writeText(currentCharge.boletoLinhaDigitavel);
    setIsCopiedBoleto(true);
    setTimeout(() => setIsCopiedBoleto(false), 2500);
  };

  const handleSimulatePaymentReceived = () => {
    setIsSimulatingSettlement(true);
    setSettlementStep(1);

    // Sequence of visual simulation steps
    setTimeout(() => {
      setSettlementStep(2); // "Processando Split Automático..."
    }, 800);

    setTimeout(() => {
      setSettlementStep(3); // "Disparando Webhook de Liquidação..."
    }, 1600);

    setTimeout(() => {
      setSettlementStep(4); // "Emitindo NFS-e Dual..."
    }, 2400);

    setTimeout(() => {
      try {
        const result = SplitPaymentSimulationService.simulatePaymentSettlement(currentCharge.id);
        setCurrentCharge(result.charge);
        if (onChargeUpdated) {
          onChargeUpdated(result.charge);
        }
        if (onAddAuditRecord) {
          onAddAuditRecord(result.auditRecord);
        }
        setSettlementStep(5); // "Concluído!"
        setTimeout(() => {
          setIsSimulatingSettlement(false);
          setActiveSubView('escrow_flow');
        }, 1000);
      } catch (err) {
        console.error(err);
        setIsSimulatingSettlement(false);
      }
    }, 3200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="simulated-split-payment-modal"
        className="bg-[var(--vx-deep)] border border-slate-700/90 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-[var(--vx-deep)] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Gateway de Pagamento com Split Automático D+0
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  SIMULAÇÃO ESCROW PROTÓTIPO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {currentCharge.clientCompanyName} • CNPJ {currentCharge.clientCnpj}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Status Banner */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Status da Cobrança:</span>
            {currentCharge.status === 'SPLIT_PROCESSADO' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Split Processado &amp; Liquidado D+0</span>
              </span>
            ) : currentCharge.status === 'PAGO' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pago (Em processamento de Split)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Pendente (Aguardando Pagamento do Cliente)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div>
              <span className="text-slate-500">ID:</span> <strong className="text-slate-300">{currentCharge.id}</strong>
            </div>
            <div>
              <span className="text-slate-500">Criado em:</span> <strong className="text-slate-300">{currentCharge.createdAt}</strong>
            </div>
            {currentCharge.paidAt && (
              <div>
                <span className="text-slate-500">Liquidado em:</span> <strong className="text-emerald-400">{currentCharge.paidAt}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveSubView('checkout')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-mono font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'checkout'
                ? 'border-emerald-500 text-emerald-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Link de Cobrança &amp; Pagamento</span>
          </button>

          <button
            onClick={() => setActiveSubView('escrow_flow')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-mono font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'escrow_flow'
                ? 'border-indigo-500 text-indigo-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Conta Escrow &amp; Split Visual</span>
          </button>

          <button
            onClick={() => setActiveSubView('nfse')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-mono font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'nfse'
                ? 'border-emerald-500 text-emerald-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>NFS-e Emitidas {currentCharge.partnerNfse ? '(Dual 2/2)' : '(0/2)'}</span>
          </button>

          <button
            onClick={() => setActiveSubView('webhook')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-mono font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'webhook'
                ? 'border-cyan-500 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Webhook de Liquidação</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: CHECKOUT & PAYMENT LINK */}
          {activeSubView === 'checkout' && (
            <div className="space-y-6">
              
              {/* Fee & Split Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    {currentCharge.dealTitle}
                  </span>
                  <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
                    <span>{formatCurrency(currentCharge.totalAmount, 'BRL')}</span>
                    <span className="text-xs text-slate-400 font-normal">Valor Total dos Honorários de Êxito</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-right">
                    <span className="text-[10px] text-emerald-400 block font-mono font-bold">PARCEIRO ({currentCharge.partnerSplitPct}%)</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {formatCurrency(currentCharge.partnerSplitAmount, 'BRL')}
                    </span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-right">
                    <span className="text-[10px] text-cyan-400 block font-mono font-bold">VELATRIX ({currentCharge.velatrixSplitPct}%)</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {formatCurrency(currentCharge.velatrixSplitAmount, 'BRL')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Switcher & QR / Barcode Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left: Interactive Payment Interface */}
                <div className="md:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200 font-mono">Forma de Pagamento Simulada:</span>
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setActivePaymentMethod('PIX')}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                          activePaymentMethod === 'PIX'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        PIX Instantâneo
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePaymentMethod('BOLETO')}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                          activePaymentMethod === 'BOLETO'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Boleto Bancário
                      </button>
                    </div>
                  </div>

                  {activePaymentMethod === 'PIX' ? (
                    <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                      {/* Placeholder QR Code */}
                      <div className="w-40 h-40 rounded-2xl bg-white p-2.5 border-2 border-emerald-500/50 shadow-lg flex items-center justify-center shrink-0">
                        <img 
                          src={currentCharge.pixQrCode} 
                          alt="QR Code PIX Simulado" 
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="space-y-3 flex-1 w-full">
                        <div>
                          <span className="text-[11px] text-slate-400 font-mono block">Chave PIX Dinâmica (Conta Escrow D+0):</span>
                          <span className="text-xs font-bold text-emerald-400 font-mono break-all">
                            escrow-split-{currentCharge.id.toLowerCase()}@velatrix.ai
                          </span>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 font-mono block mb-1">PIX Copia e Cola:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={currentCharge.pixCopiaECola}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300 truncate"
                            />
                            <button
                              onClick={handleCopyPix}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors shadow-sm"
                            >
                              {isCopiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopiedPix ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                        <Barcode className="w-12 h-12 text-slate-400 mx-auto" />
                        <span className="text-[11px] font-mono text-slate-400 block">Linha Digitável do Boleto:</span>
                        <div className="text-xs font-mono font-bold text-slate-200 tracking-wider">
                          {currentCharge.boletoLinhaDigitavel}
                        </div>
                        <button
                          onClick={handleCopyBoleto}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold cursor-pointer transition-colors"
                        >
                          {isCopiedBoleto ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopiedBoleto ? 'Copiado!' : 'Copiar Código de Barras'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Public Checkout Link */}
                  <div className="pt-3 border-t border-slate-800 space-y-1.5">
                    <span className="text-[11px] text-slate-400 font-mono block">
                      Link de Pagamento Direto para o Cliente:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 truncate flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{currentCharge.paymentUrl}</span>
                      </div>
                      <button
                        onClick={handleCopyLink}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors border border-slate-700"
                      >
                        {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{isCopiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Simulation Action & Escrow Highlight */}
                <div className="md:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>BLINDAGEM DE SPLIT AUTOMÁTICO</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      Liquidação Direta em Conta Escrow
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ao efetuar o pagamento, a tecnologia de Gateway do Velatrix divide a receita instantaneamente: o parceiro recebe seus <strong>{currentCharge.partnerSplitPct}% via PIX</strong> e a Velatrix retém seus <strong>{currentCharge.velatrixSplitPct}%</strong> de tecnologia.
                    </p>
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300 font-mono space-y-1">
                      <div>✓ Sem trânsito unilateral de fundos</div>
                      <div>✓ Sem risco de retenção de honorários</div>
                      <div>✓ Emissão autônoma e simultânea de 2 NFS-e</div>
                    </div>
                  </div>

                  {/* Simulation Button */}
                  <div className="pt-4 border-t border-slate-800/80">
                    {currentCharge.status === 'PENDENTE' ? (
                      <div className="space-y-2">
                        <button
                          id="btn-confirmar-pagamento-simulado"
                          disabled={isSimulatingSettlement}
                          onClick={handleSimulatePaymentReceived}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                        >
                          {isSimulatingSettlement ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-white" />
                              <span>Simulando Liquidação Bancária...</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-emerald-200" />
                              <span>Confirmar Pagamento Recebido (Simular D+0)</span>
                            </>
                          )}
                        </button>
                        <span className="text-[10px] text-center block text-slate-500 font-mono">
                          Simulação de demonstração: divide o split e emite NFS-e em tempo real.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs font-mono">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>PAGAMENTO LIQUIDADO &amp; SPLIT PROCESSADO</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Recursos creditados e NFS-e geradas com sucesso.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Progress Stepper during Simulation */}
              {isSimulatingSettlement && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-mono text-indigo-300">
                    <span className="font-bold">Processamento Autônomo da Transação:</span>
                    <span>Passo {settlementStep} de 4</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className={`h-2 rounded-full transition-all ${settlementStep >= 1 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    <div className={`h-2 rounded-full transition-all ${settlementStep >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    <div className={`h-2 rounded-full transition-all ${settlementStep >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    <div className={`h-2 rounded-full transition-all ${settlementStep >= 4 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                  </div>
                  <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    {settlementStep === 1 && '1. Recebendo liquidação na Conta Escrow Transitória...'}
                    {settlementStep === 2 && `2. Executando Split Bancário (${currentCharge.partnerSplitPct}% Parceiro / ${currentCharge.velatrixSplitPct}% Velatrix)...`}
                    {settlementStep === 3 && '3. Disparando Webhook de Liquidação e confirmação bancária...'}
                    {settlementStep === 4 && '4. Emitindo NFS-e Dual e registrando na Trilha de Auditoria com Hash SHA-256...'}
                    {settlementStep >= 5 && '5. Transação Concluída com Sucesso!'}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: VISUAL ESCROW FLOW DIAGRAM */}
          {activeSubView === 'escrow_flow' && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h4 className="text-base font-bold text-white">
                  Topologia de Liquidação Escrow com Split Automático
                </h4>
                <p className="text-xs text-slate-400">
                  O valor bruto dos honorários nunca passa integralmente pela conta do parceiro ou da Velatrix, eliminando bitributação e retenções indevidas.
                </p>
              </div>

              {/* Graphical Flow Architecture */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 relative overflow-hidden">
                
                {/* 1. Client Payer */}
                <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-700 text-center shadow-lg relative">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Tomador do Serviço (Cliente Auditado)</span>
                  <span className="text-sm font-bold text-white block mt-0.5">{currentCharge.clientCompanyName}</span>
                  <span className="text-xs font-mono text-indigo-400 block mt-1">
                    Valor Pago: {formatCurrency(currentCharge.totalAmount, 'BRL')}
                  </span>
                </div>

                {/* Downward Arrow to Escrow */}
                <div className="flex flex-col items-center justify-center my-1 text-slate-500">
                  <div className="w-0.5 h-6 bg-indigo-500/50" />
                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/60 flex items-center justify-center text-indigo-300 text-[10px] font-bold my-1">
                    ↓
                  </div>
                  <div className="w-0.5 h-6 bg-indigo-500/50" />
                </div>

                {/* 2. Escrow Central Gateway */}
                <div className="max-w-lg mx-auto p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border-2 border-indigo-500/60 text-center shadow-2xl relative">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-mono font-bold border border-indigo-500/40 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>CONTA ESCROW TRANSITÓRIA VELATRIX</span>
                  </div>
                  <div className="text-lg font-black text-white font-mono">
                    {formatCurrency(currentCharge.totalAmount, 'BRL')} (100%)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Conta Segregada BCB ISPB 09941 • Liquidação D+0 Instantânea
                  </div>
                  <div className="mt-3 text-[10px] text-indigo-200 bg-indigo-900/30 py-1 px-3 rounded-lg border border-indigo-500/20 inline-block font-mono">
                    Regra Smart Split: Divisão simultânea no momento exato do recebimento
                  </div>
                </div>

                {/* Split Splitter Arrows */}
                <div className="grid grid-cols-2 max-w-2xl mx-auto my-3 gap-8">
                  <div className="flex flex-col items-center text-emerald-400">
                    <div className="w-0.5 h-8 bg-emerald-500/50" />
                    <span className="text-[11px] font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      Repasse {currentCharge.partnerSplitPct}%
                    </span>
                    <div className="w-0.5 h-6 bg-emerald-500/50" />
                  </div>

                  <div className="flex flex-col items-center text-cyan-400">
                    <div className="w-0.5 h-8 bg-cyan-500/50" />
                    <span className="text-[11px] font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                      Retenção {currentCharge.velatrixSplitPct}%
                    </span>
                    <div className="w-0.5 h-6 bg-cyan-500/50" />
                  </div>
                </div>

                {/* 3. Destination Accounts (Partner + Velatrix) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-4">
                  
                  {/* Partner Account Card */}
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">CONTA DO PARCEIRO</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                        {currentCharge.partnerSplitPct}%
                      </span>
                    </div>
                    <div className="text-xl font-bold text-white font-mono">
                      {formatCurrency(currentCharge.partnerSplitAmount, 'BRL')}
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono">
                      {currentCharge.partnerPayoutAccount}
                    </div>
                    <div className="text-[10px] text-emerald-400/90 font-mono pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                      <span>Status: {currentCharge.status === 'SPLIT_PROCESSADO' ? 'LIQUIDADO VIA PIX' : 'AGUARDANDO'}</span>
                      {currentCharge.partnerNfse && <span>NFS-e #{currentCharge.partnerNfse.number}</span>}
                    </div>
                  </div>

                  {/* Velatrix Account Card */}
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">CONTA VELATRIX</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                        {currentCharge.velatrixSplitPct}%
                      </span>
                    </div>
                    <div className="text-xl font-bold text-white font-mono">
                      {formatCurrency(currentCharge.velatrixSplitAmount, 'BRL')}
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono">
                      {currentCharge.velatrixPayoutAccount}
                    </div>
                    <div className="text-[10px] text-cyan-400/90 font-mono pt-2 border-t border-cyan-500/20 flex items-center justify-between">
                      <span>Status: {currentCharge.status === 'SPLIT_PROCESSADO' ? 'LIQUIDADO VIA TED' : 'AGUARDANDO'}</span>
                      {currentCharge.velatrixNfse && <span>NFS-e #{currentCharge.velatrixNfse.number}</span>}
                    </div>
                  </div>

                </div>

              </div>

              {/* Compliance Note */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Segurança Tributária &amp; Anti-Bitributação:</strong>{' '}
                  Como os honorários são cindidos diretamente no arranjo de pagamento do gateway (art. 10 da Lei 12.865/2013), cada pessoa jurídica emite a respectiva NFS-e apenas sobre o montante que efetivamente auferiu como receita própria, garantindo conformidade com a Solução de Consulta COSIT nº 170/2021.
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: DUAL NFS-E EMITIDAS */}
          {activeSubView === 'nfse' && (
            <div className="space-y-6">
              {currentCharge.partnerNfse && currentCharge.velatrixNfse ? (
                <div className="space-y-6">
                  <div className="text-center max-w-xl mx-auto space-y-1">
                    <h4 className="text-base font-bold text-white flex items-center justify-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-emerald-400" />
                      <span>Emissão Dual de NFS-e Concluída</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Ambas as notas fiscais foram geradas pelo Webhook de Liquidação e vinculadas ao contrato com hash criptográfico.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* NFS-e Parceiro */}
                    <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-4 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-emerald-600 text-white font-mono text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase">
                        NFS-e do Parceiro
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold block">NOTA FISCAL DE SERVIÇO ELETRÔNICA</span>
                        <h5 className="text-lg font-bold text-white font-mono">NFS-e #{currentCharge.partnerNfse.number}</h5>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Código de Verificação: <strong className="text-slate-200">{currentCharge.partnerNfse.verificationCode}</strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
                        <div className="text-slate-400">
                          <span className="text-slate-500">Prestador:</span> {currentCharge.partnerNfse.emissorName} ({currentCharge.partnerNfse.emissorCnpj})
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">Tomador:</span> {currentCharge.partnerNfse.tomadorName} ({currentCharge.partnerNfse.tomadorCnpj})
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">Código de Serviço:</span> {currentCharge.partnerNfse.serviceCode}
                        </div>
                        <div className="text-slate-400 pt-1 border-t border-slate-800/80">
                          <span className="text-slate-500">Discriminação:</span> {currentCharge.partnerNfse.description}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                        <div>
                          <span className="text-[10px] text-emerald-400 font-mono block">VALOR BRUTO</span>
                          <span className="text-sm font-bold text-white font-mono">
                            {formatCurrency(currentCharge.partnerNfse.grossValue, 'BRL')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-mono block">VALOR LÍQUIDO</span>
                          <span className="text-sm font-bold text-emerald-300 font-mono">
                            {formatCurrency(currentCharge.partnerNfse.netValue, 'BRL')}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Protocolo RFB: {currentCharge.partnerNfse.protocoloRfb} • Emitida em {currentCharge.partnerNfse.emissionDate}
                      </div>
                    </div>

                    {/* NFS-e Velatrix */}
                    <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-4 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-cyan-600 text-white font-mono text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase">
                        NFS-e Velatrix
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold block">NOTA FISCAL DE SERVIÇO ELETRÔNICA</span>
                        <h5 className="text-lg font-bold text-white font-mono">NFS-e #{currentCharge.velatrixNfse.number}</h5>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Código de Verificação: <strong className="text-slate-200">{currentCharge.velatrixNfse.verificationCode}</strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
                        <div className="text-slate-400">
                          <span className="text-slate-500">Prestador:</span> {currentCharge.velatrixNfse.emissorName} ({currentCharge.velatrixNfse.emissorCnpj})
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">Tomador:</span> {currentCharge.velatrixNfse.tomadorName} ({currentCharge.velatrixNfse.tomadorCnpj})
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">Código de Serviço:</span> {currentCharge.velatrixNfse.serviceCode}
                        </div>
                        <div className="text-slate-400 pt-1 border-t border-slate-800/80">
                          <span className="text-slate-500">Discriminação:</span> {currentCharge.velatrixNfse.description}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                        <div>
                          <span className="text-[10px] text-cyan-400 font-mono block">VALOR BRUTO</span>
                          <span className="text-sm font-bold text-white font-mono">
                            {formatCurrency(currentCharge.velatrixNfse.grossValue, 'BRL')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-mono block">VALOR LÍQUIDO</span>
                          <span className="text-sm font-bold text-cyan-300 font-mono">
                            {formatCurrency(currentCharge.velatrixNfse.netValue, 'BRL')}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Protocolo RFB: {currentCharge.velatrixNfse.protocoloRfb} • Emitida em {currentCharge.velatrixNfse.emissionDate}
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <Clock className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                  <h4 className="text-sm font-bold text-white">NFS-e Aguardando Liquidação</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Assim que o pagamento for recebido na Conta Escrow, o Webhook acionará automaticamente a emissão da NFS-e do Parceiro e da Velatrix.
                  </p>
                  <button
                    onClick={() => setActiveSubView('checkout')}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer"
                  >
                    <span>Ir para Checkout e Simular Pagamento</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WEBHOOK DE LIQUIDAÇÃO */}
          {activeSubView === 'webhook' && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h4 className="text-base font-bold text-white flex items-center justify-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <span>Webhook de Liquidação &amp; Disparo Fiscal</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Evento emitido pelo gateway quando os fundos são segregados e liquidados com sucesso na Conta Escrow.
                </p>
              </div>

              {currentCharge.webhookPayload ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs font-mono">
                        200
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white font-mono">POST /api/webhooks/escrow/split-settled</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Disparado em: {currentCharge.webhookPayload.timestamp}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      DELIVERED_SUCCESS
                    </span>
                  </div>

                  {/* JSON Code Viewer */}
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Payload JSON (Simulado D+0)</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(currentCharge.webhookPayload, null, 2));
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar JSON</span>
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-96">
                      {JSON.stringify(currentCharge.webhookPayload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <Terminal className="w-10 h-10 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Webhook Ainda Não Disparado</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    O Webhook `escrow.split.settled` será disparado no exato instante em que o cliente quitar o boleto ou PIX simulado.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hash Criptográfico de Auditoria:</span>
            <strong className="text-slate-300 truncate max-w-xs">{currentCharge.auditHash}</strong>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
