// src/components/legal/AntiCircumventionMonitoringPanel.tsx
// Painel de Monitoramento Pós-Entrega, Homologação RFB vs Split e Detecção de Circunvenção - Velatrix AOS

import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileText, 
  Download, 
  Gavel, 
  Send, 
  RefreshCw, 
  Search, 
  Lock, 
  Unlock, 
  ExternalLink,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { 
  RevenueShieldService, 
  RevenueShieldState, 
  AntiCircumventionCase,
  EXCLUSIVITY_CLAUSE_DRAFT_TEXT
} from '../../services/revenueShieldService';
import { SharedTenantTaxData } from '../../services/tenantTaxRecoveryBridge';

interface AntiCircumventionMonitoringPanelProps {
  tenantData?: SharedTenantTaxData;
  onOpenPaymentModal?: () => void;
  onOpenExclusivityModal?: () => void;
}

export const AntiCircumventionMonitoringPanel: React.FC<AntiCircumventionMonitoringPanelProps> = ({
  tenantData,
  onOpenPaymentModal,
  onOpenExclusivityModal
}) => {
  const [shieldState, setShieldState] = useState<RevenueShieldState>(() => RevenueShieldService.get());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dispatchedNotif, setDispatchedNotif] = useState<string | null>(null);
  const [isExportingProof, setIsExportingProof] = useState<string | null>(null);

  useEffect(() => {
    const unsub = RevenueShieldService.subscribe((state) => {
      setShieldState(state);
    });
    return unsub;
  }, []);

  const cases = shieldState.antiCircumventionCases;

  const filteredCases = cases.filter(c => 
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.cnpj.includes(searchQuery)
  );

  const circumventionAlertsCount = cases.filter(c => c.riskSeverity === 'ALTO_CIRCUNVENCAO').length;

  const handleDispatchNotification = (caseItem: AntiCircumventionCase) => {
    setDispatchedNotif(caseItem.id);
    setTimeout(() => {
      setDispatchedNotif(null);
      alert(`NOTIFICAÇÃO EXTRAJUDICIAL DISPARADA COM SUCESSO!\n\nDestinatário: ${caseItem.companyName} (${caseItem.cnpj})\nFundamento: Cláusula de Exclusividade e Não-Circunvenção Velatrix AOS\nCrédito Homologado: ${formatCurrency(caseItem.identifiedCreditAmount, 'BRL')}\nSplit Devido à Velatrix: ${formatCurrency(caseItem.velatrixSplitAmount, 'BRL')}\n\nO documento foi transmitido com protocolo digital e carimbo de anterioridade.`);
    }, 1000);
  };

  const handleExportOriginProof = (caseItem: AntiCircumventionCase) => {
    setIsExportingProof(caseItem.id);
    setTimeout(() => {
      setIsExportingProof(null);

      const proofText = `LAUDO TÉCNICO DE PROVA DE ANTERIORIDADE E REGISTRO DE ORIGEM
EMITIDO PELA PLATAFORMA AUTÔNOMA VELATRIX AOS (AUTONOMOUS OPERATING SYSTEM)

IDENTIFICADOR DE ORIGEM: ${caseItem.originProofId}
EMPRESA BENEFICIÁRIA: ${caseItem.companyName.toUpperCase()}
CNPJ: ${caseItem.cnpj}
SETOR: ${caseItem.sector}

DATA E HORA DO LEVANTAMENTO PERICIAL D+0 ORIGINAL: ${caseItem.detectionTimestamp}
CRÉDITO IDENTIFICADO ORIGINALMENTE PELA VELATRIX: ${formatCurrency(caseItem.identifiedCreditAmount, 'BRL')}
STATUS NA RECEITA FEDERAL: ${caseItem.rfbStatusLabel}
STATUS DO SPLIT VELATRIX: ${caseItem.splitPaymentStatus}

TERMO DE EXCLUSIVIDADE & NÃO-CIRCUNVENÇÃO VINCULADO:
${EXCLUSIVITY_CLAUSE_DRAFT_TEXT}

HASH CRIPTOGRÁFICO DE ANTERIORIDADE (SHA-256):
${shieldState.originProofHash}

CERTIFICADO DIGITAL DE CUSTÓDIA:
Este documento constitui prova técnica irrefutável de que os créditos tributários e memórias de cálculo foram levantados pioneiramente pela plataforma Velatrix AOS, gerando obrigação irrevogável de remuneração de honorários de êxito à Velatrix Tecnologia Ltda.`;

      const element = document.createElement('a');
      const file = new Blob([proofText], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = `Prova_Anterioridade_Velatrix_${caseItem.cnpj.replace(/[^0-9]/g, '')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 900);
  };

  const handleTogglePaymentSim = () => {
    if (shieldState.isSplitConfirmed) {
      RevenueShieldService.lockSplitPayment();
    } else {
      RevenueShieldService.confirmSplitPayment('PIX_GATEWAY');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert if Circumvention Detected */}
      {circumventionAlertsCount > 0 && (
        <div className="p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-2 border-rose-500/60 rounded-2xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-400 shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-rose-300 uppercase tracking-tight">
                  🚨 Alerta de Risco de Inadimplência / Circunvenção Detectada ({circumventionAlertsCount})
                </h4>
              </div>
              <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">
                Créditos foram homologados perante a Receita Federal / e-CAC sem a confirmação de liquidação do split correspondente na plataforma. Downloads de peças finais estão bloqueados pelo Gate de Receita.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenPaymentModal && (
              <button
                type="button"
                onClick={onOpenPaymentModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Liquidar Split PIX</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleTogglePaymentSim}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition-colors"
            >
              Alternar Gate: {shieldState.isSplitConfirmed ? 'Bloquear' : 'Desbloquear'}
            </button>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Status do Gate de Receita (Tenant Principal)</div>
          <div className="flex items-center gap-2 mt-1">
            {shieldState.isSplitConfirmed ? (
              <>
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="text-lg font-bold text-emerald-400">DOWNLOADS LIBERADOS</span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-lg font-bold text-rose-400">BLOQUEADO (MODO PRÉVIA)</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            {shieldState.isSplitConfirmed ? 'Split liquidado via PIX Gateway' : 'Aguardando confirmação de split'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Prova de Anterioridade Ativa</div>
          <div className="text-base font-bold text-cyan-400 font-mono mt-1 truncate">
            {shieldState.originProofId}
          </div>
          <div className="text-[11px] text-slate-500">
            Hash SHA-256 e timestamp atestados em cartório digital
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Aceite de Exclusividade & Não-Circunvenção</div>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-300">REGISTRADO NO LIVRO-RAZÃO</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {shieldState.acceptanceRecord?.timestamp || 'Gravado com IP e CPF'}
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por empresa ou CNPJ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-64 md:w-80"
              />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Monitoramento Pós-Entrega & Cruzamento RFB
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenExclusivityModal && (
              <button
                type="button"
                onClick={onOpenExclusivityModal}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Termo de Exclusividade</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Empresa / CNPJ</th>
                <th className="py-3.5 px-5">Crédito Identificado</th>
                <th className="py-3.5 px-5">Status RFB / e-CAC</th>
                <th className="py-3.5 px-5">Status Split Velatrix</th>
                <th className="py-3.5 px-5 text-right">Ações de Proteção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCases.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-bold text-white text-sm">{item.companyName}</div>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">{item.cnpj} • {item.sector}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.originProofId}</div>
                  </td>

                  <td className="py-4 px-5 font-mono font-bold text-white">
                    <div>{formatCurrency(item.identifiedCreditAmount, 'BRL')}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      Split Velatrix: <strong className="text-indigo-400">{formatCurrency(item.velatrixSplitAmount, 'BRL')}</strong>
                    </div>
                  </td>

                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {item.rfbStatusLabel}
                    </span>
                  </td>

                  <td className="py-4 px-5">
                    {item.splitPaymentStatus === 'PAGAMENTO_CONFIRMADO' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        Split Liquidado (Liberado)
                      </span>
                    ) : item.riskSeverity === 'ALTO_CIRCUNVENCAO' ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                          🚨 Risco de Circunvenção
                        </span>
                        <div className="text-[10px] text-rose-400">Homologado sem pagamento</div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Aguardando Homologação
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportOriginProof(item)}
                        disabled={isExportingProof === item.id}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                        title="Baixar Prova de Anterioridade Criptográfica"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isExportingProof === item.id ? 'Gerando...' : 'Prova de Origem'}</span>
                      </button>

                      {item.riskSeverity === 'ALTO_CIRCUNVENCAO' && (
                        <button
                          type="button"
                          onClick={() => handleDispatchNotification(item)}
                          disabled={dispatchedNotif === item.id}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-md shadow-rose-600/30 cursor-pointer"
                          title="Enviar Notificação Extrajudicial de Não-Circunvenção"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          <span>{dispatchedNotif === item.id ? 'Disparando...' : 'Notificar Extrajudicial'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
