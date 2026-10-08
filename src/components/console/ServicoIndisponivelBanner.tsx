import React, { useEffect, useState } from 'react';
import { EVENTO_SERVICO_INDISPONIVEL } from '../../services/dataService';

/**
 * P-BE2 · Banner exibido quando a API responde 5xx (ex.: 503 BANCO_INDISPONIVEL) ou fica
 * inacessível fora de DEMO_MODE. Substitui o antigo comportamento de mostrar dado fictício.
 */
export function ServicoIndisponivelBanner() {
  const [status, setStatus] = useState<number | null>(null);

  useEffect(() => {
    const onIndisponivel = (e: Event) => setStatus((e as CustomEvent<{ status: number }>).detail?.status ?? 0);
    window.addEventListener(EVENTO_SERVICO_INDISPONIVEL, onIndisponivel);
    return () => window.removeEventListener(EVENTO_SERVICO_INDISPONIVEL, onIndisponivel);
  }, []);

  if (status === null) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#F3C4C4] bg-[#FFF1F1] px-4 py-1.5 text-[12px] text-[#8A1C1C] sm:px-6"
    >
      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#C62828]" aria-hidden="true" />
      <strong className="shrink-0 whitespace-nowrap font-semibold">Serviço indisponível</strong>
      <span className="hidden truncate sm:inline">
        · Não foi possível carregar dados reais{status ? ` (HTTP ${status})` : ''}. Nenhum dado fictício está sendo exibido.
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="ml-auto shrink-0 rounded border border-[#F3C4C4] px-2 py-0.5 font-medium hover:bg-white"
      >
        Tentar novamente
      </button>
    </div>
  );
}
