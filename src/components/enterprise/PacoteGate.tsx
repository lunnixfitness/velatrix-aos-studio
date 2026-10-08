import React from 'react';
import { Lock, ArrowUpRight } from 'lucide-react';
import {
  LEGALOPS_PACKAGES,
  RECURSO_LABEL,
  RECURSO_POR_FERRAMENTA,
  pacoteMinimoPara,
  podeUsarFerramenta,
} from '../../enterprise/legalOpsPackages';
import { usePacoteLegalOps } from './usePacoteLegalOps';

/**
 * Gate comercial da Central Enterprise (P21): se o pacote do tenant não inclui
 * a ferramenta, mostra o upsell em vez de renderizar a ferramenta.
 * Gate de UI apenas — o enforcement definitivo fica no backend (RLS/rotas).
 */
export const PacoteGate: React.FC<{
  toolId: string;
  onVerPacotes: () => void;
  children: React.ReactNode;
}> = ({ toolId, onVerPacotes, children }) => {
  const { direitos } = usePacoteLegalOps();
  if (podeUsarFerramenta(direitos, toolId)) return <>{children}</>;

  const recurso = RECURSO_POR_FERRAMENTA[toolId];
  const minimo = LEGALOPS_PACKAGES[pacoteMinimoPara(recurso)];
  return (
    <div className="rounded-2xl border border-hairline bg-surface px-6 py-10 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-canvas text-ink-mute">
        <Lock className="h-5 w-5" />
      </span>
      <div className="mt-4 text-[15px] font-semibold text-ink">{RECURSO_LABEL[recurso]} não está no seu pacote</div>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-ink-2">
        Seu pacote atual é <b>{direitos.pacote.nome}</b>. Esta ferramenta está disponível a partir do pacote{' '}
        <b>{minimo.nome}</b> ({minimo.precoLabel}).
      </p>
      <button
        type="button"
        onClick={onVerPacotes}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
      >
        Comparar pacotes <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  );
};
