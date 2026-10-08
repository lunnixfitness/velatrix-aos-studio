import { ServiceDefinition, PipelineStageDef, MacroEtapaId } from '../../types/serviceDefinition';

const SERVICE_REGISTRY = new Map<string, ServiceDefinition>();

/**
 * Validação e registro de ServiceDefinition
 */
export function registerService(def: ServiceDefinition): void {
  if (!def || !def.serviceId) {
    throw new Error('[ServiceRegistry] Definição de serviço inválida ou sem serviceId.');
  }

  if (SERVICE_REGISTRY.has(def.serviceId)) {
    console.warn(`[ServiceRegistry] Serviço "${def.serviceId}" já registrado. Atualizando definição.`);
  }

  // Validação dos estágios da esteira
  const stageIds = new Set(def.pipeline.stages.map(s => s.id));

  if (!stageIds.has(def.pipeline.initialStageId)) {
    throw new Error(
      `[ServiceRegistry] initialStageId "${def.pipeline.initialStageId}" não existe nos stages do serviço "${def.serviceId}".`
    );
  }

  for (const terminalId of def.pipeline.terminalStageIds) {
    if (!stageIds.has(terminalId)) {
      throw new Error(
        `[ServiceRegistry] terminalStageId "${terminalId}" não existe nos stages do serviço "${def.serviceId}".`
      );
    }
  }

  for (const transition of def.pipeline.transitions) {
    if (!stageIds.has(transition.from)) {
      throw new Error(
        `[ServiceRegistry] Transição inválida no serviço "${def.serviceId}": origem "${transition.from}" inexiste.`
      );
    }
    if (!stageIds.has(transition.to)) {
      throw new Error(
        `[ServiceRegistry] Transição inválida no serviço "${def.serviceId}": destino "${transition.to}" inexiste.`
      );
    }
  }

  // Validação de não-ficção mandatória
  if (def.forbidEstimatedDataInFinalReport !== true) {
    throw new Error(
      `[ServiceRegistry] Regra Inviolável violada: forbidEstimatedDataInFinalReport DEVE ser true no serviço "${def.serviceId}".`
    );
  }

  SERVICE_REGISTRY.set(def.serviceId, def);
}

export function getService(serviceId: string): ServiceDefinition | undefined {
  return SERVICE_REGISTRY.get(serviceId);
}

export function listServicesBySegment(segmentId: string): ServiceDefinition[] {
  return Array.from(SERVICE_REGISTRY.values()).filter(s => s.segment.id === segmentId);
}

export function listAllServices(): ServiceDefinition[] {
  return Array.from(SERVICE_REGISTRY.values());
}

export function clearRegistry(): void {
  SERVICE_REGISTRY.clear();
}

// ───────────────────────── P30 · padronização em 5 macro-etapas ─────────────────────────

export const MACRO_ETAPAS: ReadonlyArray<{ id: MacroEtapaId; label: string }> = Object.freeze([
  { id: 'CAPTURA', label: 'Captura' },
  { id: 'DIAGNOSTICO', label: 'Diagnóstico' },
  { id: 'ESTRATEGIA', label: 'Estratégia' },
  { id: 'EXECUCAO', label: 'Execução' },
  { id: 'ENTREGA', label: 'Entrega' },
]);

/**
 * Agrupa os estágios técnicos de qualquer esteira nas 5 macro-etapas padrão
 * (Captura → Diagnóstico → Estratégia → Execução → Entrega). Estágios extras viram
 * sub-etapas (checklist) dentro da macro-etapa — os ids dos estágios não mudam.
 * Regra: `macroEtapa` explícito vence; senão 1º estágio = Captura, último = Entrega e os
 * do meio são distribuídos em ordem entre Diagnóstico/Estratégia/Execução.
 */
export function agruparEmMacroEtapas(stages: PipelineStageDef[]): Array<{ id: MacroEtapaId; label: string; stages: PipelineStageDef[] }> {
  const grupos = MACRO_ETAPAS.map((m) => ({ id: m.id, label: m.label, stages: [] as PipelineStageDef[] }));
  const n = stages.length;
  stages.forEach((s, i) => {
    let k: number;
    const explicito = s.macroEtapa ? MACRO_ETAPAS.findIndex((m) => m.id === s.macroEtapa) : -1;
    if (explicito >= 0) k = explicito;
    else if (i === 0) k = 0;
    else if (i === n - 1) k = 4;
    else k = 1 + Math.min(2, Math.floor(((i - 1) * 3) / Math.max(1, n - 2)));
    grupos[k].stages.push(s);
  });
  return grupos;
}
