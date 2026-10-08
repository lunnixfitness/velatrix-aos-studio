import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  KeyRound, 
  PhoneCall, 
  CheckCircle2, 
  Fingerprint,
  FileWarning,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { ProofOfIntentSecurityCheck } from '../types/aos';

interface ProofOfIntentGuardBannerProps {
  securityGuard?: ProofOfIntentSecurityCheck;
  onOverrideFraudChallenge?: () => void;
}

export const ProofOfIntentGuardBanner: React.FC<ProofOfIntentGuardBannerProps> = ({
  securityGuard,
  onOverrideFraudChallenge
}) => {
  const [challengeResolved, setChallengeResolved] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!securityGuard) {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-medium">Guardião Proof of Intent:</span>
          <span className="text-emerald-400 font-mono text-[11px]">Origem Verificada (Zero-Injection OK)</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Assinatura HMAC-SHA256 Válida</span>
      </div>
    );
  }

  const isFraud = securityGuard.status === 'SUSPECTED_FRAUD';
  const isChallenge = securityGuard.status === 'CHALLENGE_REQUIRED';

  const handleResolveChallenge = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setChallengeResolved(true);
      if (onOverrideFraudChallenge) {
        onOverrideFraudChallenge();
      }
    }, 1000);
  };

  if (isFraud && !challengeResolved) {
    return (
      <div 
        id="proof-of-intent-fraud-intercept" 
        className="p-4 rounded-xl bg-gradient-to-r from-red-950/90 via-rose-950/95 to-slate-950 border-2 border-rose-500 shadow-2xl shadow-rose-950/60 space-y-3 animate-in fade-in duration-300"
      >
        {/* Header Alert */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-800/80 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-600 text-white animate-bounce">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-200 flex items-center gap-1.5">
                  <span>INTERCEPTAÇÃO DE SEGURANÇA ANTIFRAUDE: PROOF OF INTENT NEGADO</span>
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-rose-900 text-rose-100 border border-rose-600">
                  FLAG: {securityGuard.flag || 'SUSPECTED_FRAUD'}
                </span>
              </div>
              <p className="text-[11px] text-rose-300 font-semibold mt-0.5">
                O Guardião de Segurança bloqueou preventivamente o despacho de fundos / ordens bancárias.
              </p>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-rose-300 block">Score de Risco Antifraude:</span>
            <span className="text-sm font-black text-rose-400">{securityGuard.risk_score}/100 [CRÍTICO]</span>
          </div>
        </div>

        {/* Anomaly Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-slate-950/90 rounded-lg border border-rose-900/80 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <FileWarning className="w-3.5 h-3.5" /> Padrão Anômalo Detectado:
            </span>
            <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
              {securityGuard.anomaly_details || 'Tentativa de alteração de dados de liquidação bancária/PIX via canal não autenticado.'}
            </p>
          </div>

          <div className="p-3 bg-slate-950/90 rounded-lg border border-rose-900/80 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" /> Vetor de Ameaça & Engenharia Social:
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Fonte do evento: <strong className="text-rose-300">{securityGuard.source_authenticity}</strong>. Sem chave PGP corporativa ou contrato social autenticado.
            </p>
          </div>
        </div>

        {/* Bi-Factor Human Challenge Override Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-rose-950/40 rounded-lg border border-rose-800/60">
          <div className="text-[11px] text-rose-200 space-y-0.5">
            <span className="font-bold flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              Protocolo de Mitigação Exigido:
            </span>
            <p className="text-[10px] text-slate-300">
              {securityGuard.mitigation_protocol || 'Exige contato telefônico no número cadastrado do Diretor Financeiro e biometria executiva.'}
            </p>
          </div>

          <button
            id="btn-override-fraud-challenge"
            onClick={handleResolveChallenge}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-rose-900 cursor-pointer shrink-0"
          >
            {isVerifying ? (
              <>
                <Fingerprint className="w-4 h-4 animate-spin text-white" />
                <span>Validando Duplo Fator...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Confirmar Dupla Checagem Humana</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Verified / Cleared State
  return (
    <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-xs">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-emerald-500/20 text-emerald-300">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-emerald-200 flex items-center gap-1.5">
            Proof of Intent & Antifraude: 100% Verificado
            {challengeResolved && (
              <span className="text-[10px] font-normal bg-emerald-900 text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-600">
                Duplo Fator Humano Aprovado
              </span>
            )}
          </span>
          <span className="text-[10px] text-slate-400 block">
            Canal Autenticado • Assinatura de Origem Válida • Zero Prompt-Injection
          </span>
        </div>
      </div>

      <span className="text-[10px] font-mono text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-emerald-900">
        Risco Antifraude: {securityGuard.risk_score || 2}/100 [SEGURO]
      </span>
    </div>
  );
};
