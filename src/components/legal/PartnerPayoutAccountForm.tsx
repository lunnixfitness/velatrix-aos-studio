import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Send, 
  FileCheck, 
  AlertTriangle,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PartnerPayoutAccount, PartnerPayoutType } from '../../types/partnerPayout';
import { PayoutValidationGateway } from '../../services/payoutValidationGateway';
import { useAuth } from '../../context/AuthContext';
import { AuditRecord } from '../../types/aos';

interface PartnerPayoutAccountFormProps {
  partnerId?: string;
  partnerName?: string;
  tenantId?: string;
  onAddAuditRecord?: (record: AuditRecord) => void;
  requiredQuorum?: number;
}

export const PartnerPayoutAccountForm: React.FC<PartnerPayoutAccountFormProps> = ({
  partnerId = 'partner_vasconcelos_adv',
  partnerName = 'Vasconcelos & Associados Direito Tributário',
  tenantId = 'tenant_nexus_01',
  onAddAuditRecord,
  requiredQuorum = 2
}) => {
  const { currentUser, currentUserRole, activeTenant } = useAuth();
  
  const [activeAccount, setActiveAccount] = useState<PartnerPayoutAccount | null>(null);
  const [quarantineAccount, setQuarantineAccount] = useState<PartnerPayoutAccount | null>(null);
  const [history, setHistory] = useState<PartnerPayoutAccount[]>([]);
  
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signingAccountId, setSigningAccountId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Form states
  const [payoutType, setPayoutType] = useState<PartnerPayoutType>('PIX_CNPJ');
  const [pixKeyInput, setPixKeyInput] = useState('');
  const [beneficiaryNameInput, setBeneficiaryNameInput] = useState(partnerName);
  const [beneficiaryDocInput, setBeneficiaryDocInput] = useState('');
  
  // Bank fields
  const [bankCode, setBankCode] = useState('341');
  const [bankName, setBankName] = useState('Banco Itaú Unibanco');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'CORRENTE' | 'POUPANCA' | 'PAGAMENTO'>('CORRENTE');

  // RBAC checks
  const canApproveOrSign = ['super_admin', 'tenant_admin', 'cfo_executive', 'compliance_officer'].includes(currentUserRole || '');
  const isPartnerView = currentUserRole === 'parceiro_tributario';

  const loadAccounts = () => {
    const data = PayoutValidationGateway.getAccountsForPartner(partnerId);
    setActiveAccount(data.activeHomologatedAccount);
    setQuarantineAccount(data.pendingQuarantineAccount);
    setHistory(data.history);
  };

  useEffect(() => {
    loadAccounts();
  }, [partnerId]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!beneficiaryNameInput.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Informe a Razão Social ou Nome do Titular da Conta.' });
      return;
    }
    if (!beneficiaryDocInput.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Informe o CNPJ ou CPF do titular.' });
      return;
    }

    if (payoutType.startsWith('PIX') && !pixKeyInput.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Informe o valor da Chave PIX.' });
      return;
    }

    if (payoutType === 'CONTA_BANCARIA' && (!agency.trim() || !accountNumber.trim())) {
      setFeedbackMessage({ type: 'error', text: 'Informe os dados completos da agência e conta bancária.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const requester = {
        email: currentUser?.email || 'parceiro@vasconcelosadv.com.br',
        name: currentUser?.name || 'Solicitante Parceiro',
        role: currentUserRole || 'parceiro_tributario'
      };

      const newAccount = await PayoutValidationGateway.requestAccountHomologation({
        partnerId,
        tenantId: activeTenant?.id || tenantId,
        partnerName,
        payoutType,
        pixKeyRaw: payoutType.startsWith('PIX') ? pixKeyInput : undefined,
        bankDetails: payoutType === 'CONTA_BANCARIA' ? {
          bankCode,
          bankName,
          agency,
          accountNumber,
          accountType
        } : undefined,
        beneficiaryName: beneficiaryNameInput,
        beneficiaryDocumentRaw: beneficiaryDocInput,
        requestedBy: requester,
        quorumRequired: requiredQuorum
      });

      // Emite registro de Auditoria D+0 no Ledger
      if (onAddAuditRecord) {
        const auditRec: AuditRecord = {
          id: `aud_payout_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: `evt_payout_${Date.now()}`,
          eventTitle: 'Solicitação de Alteração de Domicílio Bancário / PIX (Quarentena D+0)',
          decisionSummary: `Nova conta/chave PIX submetida para quarentena (Invariante Bloqueio_Troca_Conta_Não_Homologada). Validação prévia DICT: Concluída. Quórum exigido: ${requiredQuorum} assinaturas.`,
          decisionAst: {
            ui_type: 'CriticalDecisionCard',
            priority: 'High',
            summary: `Alteração de Domicílio Bancário - Parceiro ${partnerName}`,
            kpis: [],
            invariants_checked: ['Bloqueio_Troca_Conta_Não_Homologada: QUARENTENA_ATIVA']
          },
          status: 'quarantine',
          signatures: [],
          executionReceipt: `REC-PAYOUT-QUARANTINE-${newAccount.id}`,
          invariantSnapshot: ['Bloqueio_Troca_Conta_Não_Homologada: ATIVO', 'Quarentena_48h: ATIVA'],
          recordHash: newAccount.auditHash,
          requiredSignatures: requiredQuorum
        };
        onAddAuditRecord(auditRec);
      }

      setFeedbackMessage({
        type: 'success',
        text: 'Solicitação registrada com sucesso! A nova conta entrou em Quarentena de Segurança e aguarda quórum de assinaturas.'
      });
      setShowRequestForm(false);
      setPixKeyInput('');
      setAgency('');
      setAccountNumber('');
      loadAccounts();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Falha ao solicitar homologação de conta.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignApproval = async (accountId: string, decision: 'APPROVED' | 'REJECTED') => {
    setSigningAccountId(accountId);
    setFeedbackMessage(null);

    try {
      const signer = {
        email: currentUser?.email || 'cfo@velatrix.ai',
        name: currentUser?.name || 'Mariana Duarte (CFO)',
        role: currentUserRole || 'cfo_executive'
      };

      const result = PayoutValidationGateway.signApproval(
        accountId,
        signer,
        decision,
        decision === 'APPROVED' 
          ? 'Assinatura digital de conformidade com os termos de repasse e liquidação bancária.' 
          : 'Rejeição de alteração de domicílio por inconsistência de compliance.'
      );

      // Emite registro de auditoria da assinatura
      if (onAddAuditRecord) {
        const auditRec: AuditRecord = {
          id: `aud_sig_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: `evt_sig_${Date.now()}`,
          eventTitle: `Assinatura de ${decision === 'APPROVED' ? 'Aprovação' : 'Rejeição'} de Domicílio Bancário / PIX`,
          decisionSummary: `Assinatura por ${signer.name} (${signer.role}). Status resultante: ${result.updatedAccount.status}. Homologação final: ${result.wasHomologated ? 'CONCLUÍDA' : 'EM ANDAMENTO'}.`,
          decisionAst: {
            ui_type: 'CriticalDecisionCard',
            priority: 'High',
            summary: `Assinatura Multi-Sig de Conta - ${decision}`,
            kpis: [],
            invariants_checked: ['Bloqueio_Troca_Conta_Não_Homologada: VERIFICADA']
          },
          status: decision === 'APPROVED' ? (result.wasHomologated ? 'executed' : 'pending') : 'rejected',
          signatures: [
            {
              role: signer.role,
              keyId: `secp256k1_${signer.email.split('@')[0]}`,
              signedAt: new Date().toISOString(),
              verified: true
            }
          ],
          executionReceipt: `REC-PAYOUT-SIG-${Date.now()}`,
          invariantSnapshot: ['Bloqueio_Troca_Conta_Não_Homologada: ATIVO'],
          recordHash: result.updatedAccount.auditHash,
          requiredSignatures: result.updatedAccount.requiredQuorum
        };
        onAddAuditRecord(auditRec);
      }

      setFeedbackMessage({
        type: 'success',
        text: result.wasHomologated 
          ? 'Quórum atingido! A nova conta foi formalmente HOMOLOGADA e está ativa para liquidações.' 
          : `Assinatura digital (${decision === 'APPROVED' ? 'Aprovação' : 'Rejeição'}) gravada no Ledger com sucesso.`
      });

      loadAccounts();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Erro ao assinar aprovação da conta.'
      });
    } finally {
      setSigningAccountId(null);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header com Invariante de Segurança */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[var(--vx-neon)]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Conta Homologada para Recebimento de Honorários
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Auditada & Homologada
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Protocolo de Quarentena e Invariante de Segurança (<span className="text-cyan-300 font-mono text-[11px]">Bloqueio_Troca_Conta_Não_Homologada</span>)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!showRequestForm && (
            <button
              type="button"
              onClick={() => setShowRequestForm(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Solicitar Troca de Conta / Chave</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer transition-all"
            title="Ver histórico de auditoria"
          >
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span className="text-[11px]">Histórico</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedbackMessage && (
        <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
            : feedbackMessage.type === 'error'
            ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
            : 'bg-cyan-950/50 border-cyan-500/50 text-cyan-200'
        }`}>
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : feedbackMessage.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{feedbackMessage.text}</span>
        </div>
      )}

      {/* CONTA ATUALMENTE HOMOLOGADA (CARD ATIVO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/10 border-b border-l border-emerald-500/30 rounded-bl-xl text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            CONTA ATIVA PARA LIQUIDAÇÃO
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Favorecido / Titular:</span>
            <span className="text-xs font-bold text-slate-100">
              {activeAccount?.beneficiaryName || partnerName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] text-slate-400 block">Tipo & Chave / Domicílio:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold">
                  {activeAccount?.payoutType || 'PIX_CNPJ'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {activeAccount?.pixKeyMasked || activeAccount?.bankDetailsMasked?.accountNumberMasked || '48.912.***/***1-04'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Documento Validado DICT:</span>
              <span className="text-xs font-mono text-slate-300 block mt-0.5">
                {activeAccount?.beneficiaryDocumentMasked || '48.912.***/***1-04'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              Quórum Aprovado: {activeAccount?.approvals.length || 2} de {activeAccount?.requiredQuorum || 2} assinaturas
            </span>
            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]" title={activeAccount?.auditHash}>
              Hash: {activeAccount?.auditHash || '0x8f2a...9281'}
            </span>
          </div>
        </div>

        {/* ORQUESTRADOR / DICT MOCK INFO */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Orquestração de Split</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              A Velatrix valida a titularidade via DICT/SPI e orquestra a liquidação. Nenhum dado bancário bruto fica exposto sem assinatura criptográfica.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Gateway SPI/DICT</span>
            <span className="text-emerald-400 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Interoperável
            </span>
          </div>
        </div>
      </div>

      {/* SE HOUVER SOLICITAÇÃO EM QUARENTENA / AGUARDANDO ASSINATURAS */}
      {quarantineAccount && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <div>
                <h5 className="text-xs font-bold text-amber-200">
                  Nova Solicitação em Quarentena de Segurança (Aguardando Assinaturas)
                </h5>
                <span className="text-[11px] text-amber-300/80">
                  Submetida por {quarantineAccount.requestedBy.name} ({quarantineAccount.requestedBy.role}) em {new Date(quarantineAccount.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {quarantineAccount.approvals.filter(a => a.decision === 'APPROVED').length} / {quarantineAccount.requiredQuorum} Assinaturas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-950/70 p-3 rounded-lg border border-amber-500/20">
            <div>
              <span className="text-slate-400 block text-[10px]">Nova Chave/Conta:</span>
              <span className="font-mono font-bold text-amber-200">
                {quarantineAccount.pixKeyMasked || quarantineAccount.bankDetailsMasked?.accountNumberMasked} ({quarantineAccount.payoutType})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Favorecido:</span>
              <span className="text-slate-200">{quarantineAccount.beneficiaryName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Documento Mascarado:</span>
              <span className="font-mono text-slate-300">{quarantineAccount.beneficiaryDocumentMasked}</span>
            </div>
          </div>

          {/* PAINEL DE ASSINATURA MULTI-SIG (Acessível a papéis com escopo Financial/Admin) */}
          {canApproveOrSign && (
            <div className="pt-2 border-t border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Seu perfil ({currentUserRole}) possui autoridade para assinatura de auditoria D+0.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={signingAccountId === quarantineAccount.id}
                  onClick={() => handleSignApproval(quarantineAccount.id, 'APPROVED')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Assinar Aprovação</span>
                </button>
                <button
                  type="button"
                  disabled={signingAccountId === quarantineAccount.id}
                  onClick={() => handleSignApproval(quarantineAccount.id, 'REJECTED')}
                  className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rejeitar</span>
                </button>
              </div>
            </div>
          )}

          {isPartnerView && (
            <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>A conta anterior permanece ativa para liquidações até que o comitê financeiro co-assine a aprovação D+0.</span>
            </div>
          )}
        </div>
      )}

      {/* FORMULÁRIO SEGURO DE SOLICITAÇÃO DE HOMOLOGAÇÃO */}
      {showRequestForm && (
        <form onSubmit={handleSubmitRequest} className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h5 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[var(--vx-neon)]" />
              Formulário de Solicitação de Novo Domicílio Bancário / PIX
            </h5>
            <button
              type="button"
              onClick={() => setShowRequestForm(false)}
              className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tipo de Recebimento
              </label>
              <select
                value={payoutType}
                onChange={(e) => setPayoutType(e.target.value as PartnerPayoutType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none"
              >
                <option value="PIX_CNPJ">PIX - CNPJ</option>
                <option value="PIX_CPF">PIX - CPF</option>
                <option value="PIX_EMAIL">PIX - E-mail</option>
                <option value="PIX_TELEFONE">PIX - Telefone Celular</option>
                <option value="PIX_ALEATORIA">PIX - Chave Aleatória (EVP)</option>
                <option value="CONTA_BANCARIA">TED / DOC - Conta Bancária Tradicional</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {payoutType === 'CONTA_BANCARIA' ? 'Banco' : 'Chave PIX'}
              </label>
              {payoutType === 'CONTA_BANCARIA' ? (
                <select
                  value={bankCode}
                  onChange={(e) => {
                    setBankCode(e.target.value);
                    const names: Record<string, string> = {
                      '341': 'Banco Itaú Unibanco',
                      '237': 'Banco Bradesco',
                      '001': 'Banco do Brasil',
                      '033': 'Banco Santander',
                      '260': 'Nu Pagamentos (Nubank)',
                      '077': 'Banco Inter'
                    };
                    setBankName(names[e.target.value] || 'Outro Banco');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                >
                  <option value="341">341 - Banco Itaú Unibanco</option>
                  <option value="237">237 - Banco Bradesco</option>
                  <option value="001">001 - Banco do Brasil</option>
                  <option value="033">033 - Banco Santander</option>
                  <option value="260">260 - Nu Pagamentos (Nubank)</option>
                  <option value="077">077 - Banco Inter</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={
                    payoutType === 'PIX_CNPJ' ? '00.000.000/0001-00' :
                    payoutType === 'PIX_EMAIL' ? 'financeiro@escritorio.adv.br' :
                    payoutType === 'PIX_TELEFONE' ? '+55 11 99999-9999' : 'Insira a chave'
                  }
                  value={pixKeyInput}
                  onChange={(e) => setPixKeyInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none font-mono"
                />
              )}
            </div>
          </div>

          {payoutType === 'CONTA_BANCARIA' && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Agência</label>
                <input
                  type="text"
                  placeholder="Ex: 0001"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Número da Conta</label>
                <input
                  type="text"
                  placeholder="Ex: 12345-6"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Tipo</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none"
                >
                  <option value="CORRENTE">Conta Corrente</option>
                  <option value="POUPANCA">Poupança</option>
                  <option value="PAGAMENTO">Conta de Pagamento</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Razão Social / Nome do Favorecido
              </label>
              <input
                type="text"
                value={beneficiaryNameInput}
                onChange={(e) => setBeneficiaryNameInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                CNPJ / CPF do Favorecido (DICT Check)
              </label>
              <input
                type="text"
                placeholder="Ex: 48.912.384/0001-04"
                value={beneficiaryDocInput}
                onChange={(e) => setBeneficiaryDocInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Ao enviar, a chave passará por validação de titularidade no DICT e entrará em quarentena auditada de 48h até validação do comitê financeiro.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowRequestForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[var(--vx-neon)] hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Validando DICT & Protocolando...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Solicitar Homologação D+0</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* HISTÓRICO DE AUDITORIA DE DOMICÍLIOS */}
      {showHistory && (
        <div className="pt-3 border-t border-slate-800 space-y-2 animate-fadeIn">
          <h6 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
            Trilha Imutável de Homologações & Assinaturas
          </h6>

          <div className="space-y-1.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      item.status === 'homologado' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      item.status === 'quarantine' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      item.status === 'rejeitado' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {item.pixKeyMasked || item.bankDetailsMasked?.accountNumberMasked}
                    </span>
                    <span className="text-slate-400 text-[11px]">({item.beneficiaryName})</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Solicitado por {item.requestedBy.name} em {new Date(item.createdAt).toLocaleDateString('pt-BR')} • {item.approvals.length} assinaturas registradas
                  </div>
                </div>

                <div className="font-mono text-[10px] text-slate-400">
                  Hash: {item.auditHash.slice(0, 14)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
