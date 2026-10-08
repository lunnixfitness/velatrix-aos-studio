// Registry Base & Funções
export * from './serviceRegistry';
export * from './segments';
export * from './actorRoleAudit';

// Definições de Serviços (Auto-registro no carregamento do bundle)
import './definitions/taxRecoveryService';
import './definitions/judicialExpertiseService';
import './definitions/inssExpertiseService';
import './definitions/inssObrasService';
import './definitions/precatorioService';
import './definitions/loasService';
import './definitions/riskRoiService';
import './definitions/cyberspyThreatService';
import './definitions/erpConnectorService';

// Boot Gate — Auditoria Contratual de Actor Roles
import { auditActorRoleAssignments } from './actorRoleAudit';
auditActorRoleAssignments();

