import { StandardizedAuditReport } from '../../types/standardizedPipeline';
import { CentralAuditReportService } from '../centralAuditReportService';

export const RUN_LAUDO_INVALIDATION_MIGRATION_2026_09_21 = true;

export const CONTAMINATED_REPORT_IDS = [
  'LDO-REC-2026-69189',
  'LDO-REC-2026-69340'
] as const;

export const INVALIDATION_REASON = 'EMITIDO_COM_ACTOR_ROLE_INCORRETA_BUG_P1' as const;

export interface InvalidationMigrationResult {
  migrated: boolean;
  checkedCount: number;
  invalidatedCount: number;
  invalidatedReportIds: string[];
  skippedValidCount: number;
  timestamp: string;
}

/**
 * Invalida pura e previsivelmente uma lista de laudos em memória
 * Garantindo que APENAS laudos na lista de contaminados sejam alterados.
 */
export function invalidateContaminatedReports(
  reports: StandardizedAuditReport[]
): {
  updatedReports: StandardizedAuditReport[];
  invalidatedCount: number;
  invalidatedReportIds: string[];
  checkedCount: number;
  skippedValidCount: number;
} {
  const contaminatedSet = new Set<string>(CONTAMINATED_REPORT_IDS);
  const invalidatedReportIds: string[] = [];
  let skippedValidCount = 0;

  const updatedReports = reports.map(report => {
    if (contaminatedSet.has(report.reportId)) {
      invalidatedReportIds.push(report.reportId);
      return {
        ...report,
        status: 'INVALIDATED' as const,
        invalidationReason: INVALIDATION_REASON,
        invalidatedAt: new Date().toISOString(),
        // Zera a assinatura digital para forçar re-emissão segura
        auditHash: '',
        signer: {
          ...report.signer,
          role: `[REVOGADA - ${INVALIDATION_REASON}] ${report.signer.role}`,
          credentialNumber: undefined
        }
      };
    } else {
      skippedValidCount++;
      return report;
    }
  });

  return {
    updatedReports,
    invalidatedCount: invalidatedReportIds.length,
    invalidatedReportIds,
    checkedCount: reports.length,
    skippedValidCount
  };
}

/**
 * Executa a migração contra o CentralAuditReportService
 */
export function runLaudoInvalidationMigration(): InvalidationMigrationResult {
  if (!RUN_LAUDO_INVALIDATION_MIGRATION_2026_09_21) {
    return {
      migrated: false,
      checkedCount: 0,
      invalidatedCount: 0,
      invalidatedReportIds: [],
      skippedValidCount: 0,
      timestamp: new Date().toISOString()
    };
  }

  const reports = CentralAuditReportService.getAllReports();
  const result = invalidateContaminatedReports(reports);

  // Persiste os relatórios atualizados
  for (const report of result.updatedReports) {
    if (result.invalidatedReportIds.includes(report.reportId)) {
      CentralAuditReportService.saveReport(report);
    }
  }

  return {
    migrated: true,
    checkedCount: result.checkedCount,
    invalidatedCount: result.invalidatedCount,
    invalidatedReportIds: result.invalidatedReportIds,
    skippedValidCount: result.skippedValidCount,
    timestamp: new Date().toISOString()
  };
}
