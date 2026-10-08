import { listAllServices } from './serviceRegistry';
import { ServiceDefinition, ActorRoleId } from '../../types/serviceDefinition';

export class RegistryContractViolation extends Error {
  public violations: string[];

  constructor(message: string, violations: string[] = []) {
    super(message);
    this.name = 'RegistryContractViolation';
    this.violations = violations;
    Object.setPrototypeOf(this, RegistryContractViolation.prototype);
  }
}

export interface ActorRoleAuditViolation {
  serviceId: string;
  stageId: string;
  stageLabel: string;
  invalidRole: ActorRoleId;
  allowedRoles: ActorRoleId[];
  reason: string;
}

export interface ActorRoleAuditReport {
  timestamp: string;
  totalServicesAudited: number;
  totalStagesAudited: number;
  valid: boolean;
  violations: ActorRoleAuditViolation[];
}

/**
 * Valida os papéis de atores atribuídos aos estágios de todos os serviços registrados
 * contra o contrato estrito `allowedActorRoles`.
 * Dispara RegistryContractViolation se qualquer violação for detectada.
 */
export function auditActorRoleAssignments(servicesToAudit?: ServiceDefinition[]): ActorRoleAuditReport {
  const services = servicesToAudit || listAllServices();
  const violations: ActorRoleAuditViolation[] = [];
  let totalStages = 0;

  for (const service of services) {
    if (!service.allowedActorRoles || service.allowedActorRoles.length === 0) {
      continue;
    }

    const allowedSet = new Set<ActorRoleId>(service.allowedActorRoles);

    for (const stage of service.pipeline.stages) {
      totalStages++;
      if (!allowedSet.has(stage.actorRole)) {
        violations.push({
          serviceId: service.serviceId,
          stageId: stage.id,
          stageLabel: stage.label,
          invalidRole: stage.actorRole,
          allowedRoles: service.allowedActorRoles,
          reason: `Estágio "${stage.id}" (${stage.label}) no serviço "${service.serviceId}" possui papel "${stage.actorRole}", que viola a lista permitida: [${service.allowedActorRoles.join(', ')}].`
        });
      }
    }
  }

  const report: ActorRoleAuditReport = {
    timestamp: new Date().toISOString(),
    totalServicesAudited: services.length,
    totalStagesAudited: totalStages,
    valid: violations.length === 0,
    violations
  };

  if (violations.length > 0) {
    const detailMsg = violations.map(v => ` - [${v.serviceId}] Estágio ${v.stageId}: ${v.reason}`).join('\n');
    throw new RegistryContractViolation(
      `[actorRoleAudit] VIOLAÇÃO CONTRATUAL DE PAPÉIS DETECTADA (${violations.length} erro(s)):\n${detailMsg}`,
      violations.map(v => v.reason)
    );
  }

  return report;
}
