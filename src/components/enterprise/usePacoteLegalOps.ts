import { useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resolverDireitos, type Direitos } from '../../enterprise/legalOpsPackages';
import { subscribe, getSnapshot, contratoDoTenant, type ContratoPacote } from '../../services/legalOpsPackageStore';

/** Pacote LegalOps + direitos resolvidos do tenant ativo (P21). */
export function usePacoteLegalOps(): { contrato: ContratoPacote; direitos: Direitos } {
  const { activeTenant } = useAuth();
  const snap = useSyncExternalStore(subscribe, getSnapshot);
  return useMemo(() => {
    const contrato = contratoDoTenant(activeTenant.id, activeTenant.planTier ?? activeTenant.plano);
    return { contrato, direitos: resolverDireitos(contrato.pacote, contrato.overrides) };
    // snap entra nas deps para recalcular quando o store muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenant.id, activeTenant.planTier, activeTenant.plano, snap]);
}
