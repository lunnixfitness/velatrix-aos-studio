import { describe, it, expect } from 'vitest';
import { 
  ActorRoleId, 
  ACTOR_LABELS, 
  ServiceDefinition 
} from '../types/serviceDefinition';
import { listAllServices } from '../services/registry/serviceRegistry';
import { 
  auditActorRoleAssignments, 
  RegistryContractViolation 
} from '../services/registry/actorRoleAudit';
import { 
  invalidateContaminatedReports, 
  CONTAMINATED_REPORT_IDS, 
  INVALIDATION_REASON,
  RUN_LAUDO_INVALIDATION_MIGRATION_2026_09_21
} from '../services/centralAuditReports/invalidateContaminatedReports';
import { StandardizedAuditReport } from '../types/standardizedPipeline';

// Importa todas as definições registradas
import '../services/registry/index';

describe('Auditoria de Contrato de ActorRole & Governança de Laudos (Bugfix P1)', () => {

  describe('1. Validação dos 13 Valores de ActorRoleId e Labels Oficiais', () => {
    const expectedRoles: ActorRoleId[] = [
      'SISTEMA',
      'ANALISTA_TRIBUTARIO',
      'ANALISTA_PREVIDENCIARIO',
      'ANALISTA_FINANCEIRO',
      'ANALISTA_SEGURANCA_CISSP',
      'ENGENHEIRO_INFRA_REDES',
      'ENGENHEIRO_CIVIL_CREA',
      'PERITO',
      'ADVOGADO_OAB',
      'CONTADOR_CRC',
      'ENGENHEIRO_CREA',
      'JUIZ_EXTERNO',
      'AUDITOR_FISCAL'
    ];

    it('deve conter exatamente 13 chaves cadastradas no dicionário de labels', () => {
      const keys = Object.keys(ACTOR_LABELS);
      expect(keys.length).toBe(13);
      for (const role of expectedRoles) {
        expect(ACTOR_LABELS[role]).toBeDefined();
        expect(typeof ACTOR_LABELS[role]).toBe('string');
        expect(ACTOR_LABELS[role].length).toBeGreaterThan(0);
      }
    });

    it('todos os labels devem estar em português correto sem caracteres corrompidos', () => {
      expect(ACTOR_LABELS.ANALISTA_PREVIDENCIARIO).toBe('Analista Previdenciário');
      expect(ACTOR_LABELS.ANALISTA_FINANCEIRO).toBe('Analista Financeiro');
      expect(ACTOR_LABELS.ANALISTA_SEGURANCA_CISSP).toBe('Analista de Segurança (CISSP)');
      expect(ACTOR_LABELS.ENGENHEIRO_INFRA_REDES).toBe('Engenheiro de Infraestrutura & Redes');
      expect(ACTOR_LABELS.ENGENHEIRO_CIVIL_CREA).toBe('Engenheiro Civil (CREA)');
      expect(ACTOR_LABELS.ANALISTA_TRIBUTARIO).toBe('Analista Tributário');
      expect(ACTOR_LABELS.SISTEMA).toBe('Autônomo (Sistema)');
    });
  });

  describe('2. Gate de Auditoria Contratual (auditActorRoleAssignments)', () => {
    it('deve auditar com sucesso os serviços oficiais do registry sem disparar violação', () => {
      const allServices = listAllServices();
      expect(allServices.length).toBe(9);

      const report = auditActorRoleAssignments(allServices);
      expect(report.valid).toBe(true);
      expect(report.violations.length).toBe(0);
      expect(report.totalServicesAudited).toBe(9);
      expect(report.totalStagesAudited).toBeGreaterThan(30);
    });

    it('deve disparar RegistryContractViolation se um serviço tiver estágio com actorRole fora do allowedActorRoles', () => {
      const mockServiceViolador: ServiceDefinition = {
        serviceId: 'servico_teste_inss_contaminado',
        serviceName: 'Teste INSS Contaminado',
        version: '1.0.0',
        segment: { id: 'previdenciario', label: 'Previdenciário', description: 'desc', icon: 'FileText' },
        responsibleClass: ['OAB'],
        forbidEstimatedDataInFinalReport: true,
        allowedActorRoles: ['ANALISTA_PREVIDENCIARIO', 'ADVOGADO_OAB', 'SISTEMA'],
        contract: {
          serviceId: 'servico_teste_inss_contaminado',
          serviceName: 'Teste INSS',
          category: 'previdenciario',
          forbidEstimatedDataInFinalReport: true,
          requiredInputs: [],
          optionalInputs: [],
          validationRules: []
        },
        pipeline: {
          initialStageId: 'STAGE_1',
          terminalStageIds: ['STAGE_2'],
          stages: [
            {
              id: 'STAGE_1',
              label: 'Recepção',
              kind: 'INTAKE',
              actorRole: 'ANALISTA_TRIBUTARIO' as any, // ILEGAL para INSS!
              slaHours: 24,
              isTerminal: false,
              requiredArtifacts: []
            },
            {
              id: 'STAGE_2',
              label: 'Emissão',
              kind: 'EMIT',
              actorRole: 'ADVOGADO_OAB',
              slaHours: 24,
              isTerminal: true,
              requiredArtifacts: []
            }
          ],
          transitions: [{ from: 'STAGE_1', to: 'STAGE_2' }]
        },
        legalBasis: [],
        reportSchema: {
          reportType: 'teste',
          reportTypeLabel: 'Teste',
          idPrefix: 'LDO-TEST',
          sections: [],
          signatureRequirements: []
        }
      };

      expect(() => {
        auditActorRoleAssignments([mockServiceViolador]);
      }).toThrow(RegistryContractViolation);

      try {
        auditActorRoleAssignments([mockServiceViolador]);
      } catch (err: any) {
        expect(err.name).toBe('RegistryContractViolation');
        expect(err.violations.length).toBe(1);
        expect(err.violations[0]).toContain('ANALISTA_TRIBUTARIO');
      }
    });

    it('serviços específicos devem possuir os novos papéis corretos em seus estágios', () => {
      const services = listAllServices();
      
      const inss = services.find(s => s.serviceId === 'inss_expertise');
      expect(inss).toBeDefined();
      expect(inss?.pipeline.stages.some(st => st.actorRole === 'ANALISTA_PREVIDENCIARIO')).toBe(true);

      const obras = services.find(s => s.serviceId === 'inss_obras');
      expect(obras).toBeDefined();
      expect(obras?.pipeline.stages.some(st => st.actorRole === 'ENGENHEIRO_CIVIL_CREA')).toBe(true);

      const risk = services.find(s => s.serviceId === 'risk_roi_diagnosis');
      expect(risk).toBeDefined();
      expect(risk?.pipeline.stages.some(st => st.actorRole === 'ANALISTA_FINANCEIRO')).toBe(true);

      const cyber = services.find(s => s.serviceId === 'cyberspy_threat');
      expect(cyber).toBeDefined();
      expect(cyber?.pipeline.stages.some(st => st.actorRole === 'ANALISTA_SEGURANCA_CISSP')).toBe(true);

      const erp = services.find(s => s.serviceId === 'erp_connector');
      expect(erp).toBeDefined();
      expect(erp?.pipeline.stages.some(st => st.actorRole === 'ENGENHEIRO_INFRA_REDES')).toBe(true);
    });
  });

  describe('3. Invalidação de Laudos Contaminados (Migration 2026-09-21)', () => {
    it('deve ter a feature flag ativa e listar explicitamente os laudos contaminados', () => {
      expect(RUN_LAUDO_INVALIDATION_MIGRATION_2026_09_21).toBe(true);
      expect(CONTAMINATED_REPORT_IDS).toContain('LDO-REC-2026-69189');
      expect(CONTAMINATED_REPORT_IDS).toContain('LDO-REC-2026-69340');
    });

    it('deve invalidar LDO-REC-2026-69189 e LDO-REC-2026-69340 e zerar a assinatura, mas NÃO tocar LDO-REC-2026-44532', () => {
      const mockReports: StandardizedAuditReport[] = [
        {
          reportId: 'LDO-REC-2026-69189',
          serviceId: 'tax_recovery',
          serviceName: 'Recuperação Tributária',
          reportType: 'fiscal_recovery',
          reportTypeLabel: 'Laudo Fiscal',
          issuedAt: new Date().toISOString(),
          issuedAtFormatted: '21/09/2026 10:00',
          tenantId: 'tenant_1',
          tenantName: 'Vanguarda',
          tenantCnpj: '03.847.192/0001-44',
          lgpdCompliance: { isCompliant: true, dataProtectionOfficer: 'dpo', dataMaskingApplied: true, retentionPeriodDays: 1825, legalBasis: 'CTN', anonymizedFields: [] },
          auditHash: 'hash_original_assinado_1',
          signer: { name: 'Roberto', role: 'Perito', credentialNumber: 'CRC-SP', signatureType: 'ICP_BRASIL_A1' },
          pipelineSnapshot: { verifiedRealSources: [], executionTimeMs: 100, dataSourceIntegrity: '100% REAL VERIFICADO' }
        },
        {
          reportId: 'LDO-REC-2026-69340',
          serviceId: 'inss_expertise',
          serviceName: 'Especialista INSS',
          reportType: 'inss_report',
          reportTypeLabel: 'Laudo INSS',
          issuedAt: new Date().toISOString(),
          issuedAtFormatted: '21/09/2026 11:00',
          tenantId: 'tenant_2',
          tenantName: 'Empresa Segurada',
          tenantCnpj: '11.222.333/0001-99',
          lgpdCompliance: { isCompliant: true, dataProtectionOfficer: 'dpo', dataMaskingApplied: true, retentionPeriodDays: 1825, legalBasis: 'Lei 8.213', anonymizedFields: [] },
          auditHash: 'hash_original_assinado_2',
          signer: { name: 'Fiscal Fallback', role: 'Analista Tributário', credentialNumber: 'CRC-SP', signatureType: 'ICP_BRASIL_A1' },
          pipelineSnapshot: { verifiedRealSources: [], executionTimeMs: 120, dataSourceIntegrity: '100% REAL VERIFICADO' }
        },
        {
          reportId: 'LDO-REC-2026-44532',
          serviceId: 'tax_recovery',
          serviceName: 'Recuperação Tributária Legítima',
          reportType: 'fiscal_recovery',
          reportTypeLabel: 'Laudo Fiscal Válido',
          issuedAt: new Date().toISOString(),
          issuedAtFormatted: '21/09/2026 12:00',
          tenantId: 'tenant_3',
          tenantName: 'Cliente Conforme',
          tenantCnpj: '44.555.666/0001-00',
          lgpdCompliance: { isCompliant: true, dataProtectionOfficer: 'dpo', dataMaskingApplied: true, retentionPeriodDays: 1825, legalBasis: 'CTN', anonymizedFields: [] },
          auditHash: 'hash_legitimo_preservado_44532',
          signer: { name: 'Dra. Carolina', role: 'Procuradora Tributária', credentialNumber: 'OAB/SP 312.441', signatureType: 'ICP_BRASIL_A1' },
          pipelineSnapshot: { verifiedRealSources: [], executionTimeMs: 150, dataSourceIntegrity: '100% REAL VERIFICADO' }
        }
      ];

      const { updatedReports, invalidatedCount, invalidatedReportIds, skippedValidCount } = invalidateContaminatedReports(mockReports);

      expect(invalidatedCount).toBe(2);
      expect(skippedValidCount).toBe(1);
      expect(invalidatedReportIds).toEqual(['LDO-REC-2026-69189', 'LDO-REC-2026-69340']);

      // 1. LDO-REC-2026-69189 deve estar INVALIDADO e com hash zerado
      const r1 = updatedReports.find(r => r.reportId === 'LDO-REC-2026-69189')!;
      expect(r1.status).toBe('INVALIDATED');
      expect(r1.invalidationReason).toBe(INVALIDATION_REASON);
      expect(r1.auditHash).toBe('');
      expect(r1.signer.role).toContain(INVALIDATION_REASON);

      // 2. LDO-REC-2026-69340 deve estar INVALIDADO e com hash zerado
      const r2 = updatedReports.find(r => r.reportId === 'LDO-REC-2026-69340')!;
      expect(r2.status).toBe('INVALIDATED');
      expect(r2.invalidationReason).toBe(INVALIDATION_REASON);
      expect(r2.auditHash).toBe('');
      expect(r2.signer.role).toContain(INVALIDATION_REASON);

      // 3. LDO-REC-2026-44532 NÃO deve ser tocado de forma alguma
      const r3 = updatedReports.find(r => r.reportId === 'LDO-REC-2026-44532')!;
      expect(r3.status).toBeUndefined();
      expect(r3.invalidationReason).toBeUndefined();
      expect(r3.auditHash).toBe('hash_legitimo_preservado_44532');
      expect(r3.signer.role).toBe('Procuradora Tributária');
      expect(r3.signer.credentialNumber).toBe('OAB/SP 312.441');
    });
  });
});
