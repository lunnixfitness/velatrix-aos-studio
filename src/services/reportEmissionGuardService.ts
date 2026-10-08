import { sha256HexSync } from '../shared/crypto/sha256Sync';
import { StandardizedAuditReport } from '../types/standardizedPipeline';
import { 
  guardReportEmission, 
  containsObjectStringification,
  TaxRecoverySectionsPayloadSchema 
} from '../types/reportDtos';

/** Esteiras cujo laudo tem responsável técnico humano (P27/P28). */
export const ESTEIRAS_COM_RESPONSAVEL = new Set([
  'tax_recovery', 'legal_tax_recovery', 'judicial_expertise', 'inss_expertise', 'inss_obras',
  'precatorio_management', 'risk_roi_diagnosis',
]);
/** Padrões dos signatários que as esteiras fabricavam antes do P28. */
const SIGNATARIO_FABRICADO = /^Dr\(a\)\. Auditor Respons/i;
const REGISTRO_FABRICADO = /^REG-[A-Z]+-BR-\d+$/;

export class EmissionGuardError extends Error {
  public readonly code: string;
  public readonly serviceId: string;
  public readonly issues?: string[];

  constructor(message: string, serviceId: string, issues?: string[]) {
    super(message);
    this.name = 'EmissionGuardError';
    this.code = 'EMISSION_GUARD_VIOLATION';
    this.serviceId = serviceId;
    this.issues = issues;
  }
}

/**
 * Guard de Emissão Oficial do Velatrix AOS.
 * Executa a validação rigorosa com Zod de cada seção antes de calcular o hash SHA-256.
 * Se houver qualquer inconsistência, fallback ou '[object Object]', LANÇA EXCEÇÃO e impede
 * a assinatura digital com ICP-Brasil.
 */
export function validateAndComputeReportHash(
  reportInput: Omit<StandardizedAuditReport, 'auditHash'>
): string {
  const { serviceId, sectionsPayload, tenantId, tenantCnpj, reportId } = reportInput;

  if (!serviceId) {
    throw new EmissionGuardError(
      'Identificador de serviço (serviceId) não fornecido para emissão.',
      serviceId || 'UNKNOWN'
    );
  }

  if (!tenantId || !tenantCnpj) {
    throw new EmissionGuardError(
      'Identificação do contribuinte (tenantId / tenantCnpj) ausente no laudo.',
      serviceId
    );
  }

  // 1. Sanity Check contra corrupção de stringificação '[object Object]'
  if (containsObjectStringification(sectionsPayload)) {
    throw new EmissionGuardError(
      `[EmissionGuard] Emissão abortada: o payload do laudo '${reportId}' contém valores serializados como '[object Object]'. Assinatura ICP-Brasil bloqueada.`,
      serviceId
    );
  }

  // 2. Validação Zod conforme o serviço
  if (serviceId === 'tax_recovery' || serviceId === 'legal_tax_recovery') {
    if (!sectionsPayload || typeof sectionsPayload !== 'object') {
      throw new EmissionGuardError(
        `[EmissionGuard] Erro Crítico: sectionsPayload ausente para o serviço '${serviceId}'.`,
        serviceId
      );
    }

    const parseResult = TaxRecoverySectionsPayloadSchema.safeParse(sectionsPayload);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        i => `Seção/Campo '${i.path.join('.')}': ${i.message}`
      );
      throw new EmissionGuardError(
        `[EmissionGuard] Falha de validação Zod no laudo '${reportId}':\n` + issues.join('\n'),
        serviceId,
        issues
      );
    }
  } else if (sectionsPayload) {
    // Para outros serviços com sectionsPayload, garante que nenhuma seção é nula ou [object Object]
    guardReportEmission(serviceId, sectionsPayload);
  }

  // 3. P28 — Esteiras de serviço: o laudo não pode afirmar o que não aconteceu.
  //    Assinatura ICP-Brasil só depois da assinatura real; integridade só com origem declarada.
  if (ESTEIRAS_COM_RESPONSAVEL.has(serviceId)) {
    const { signer, pipelineSnapshot } = reportInput;
    if (!signer?.name?.trim() || !signer?.credentialNumber?.trim()) {
      throw new EmissionGuardError(`[EmissionGuard] Laudo '${reportId}' sem responsável técnico identificado (nome e registro no conselho).`, serviceId);
    }
    if (SIGNATARIO_FABRICADO.test(signer.name) || REGISTRO_FABRICADO.test(signer.credentialNumber)) {
      throw new EmissionGuardError(`[EmissionGuard] Laudo '${reportId}' com signatário gerado pelo sistema. O responsável técnico deve ser informado por quem assina.`, serviceId);
    }
    if (signer.signatureType !== 'PENDENTE_ASSINATURA_ICP') {
      throw new EmissionGuardError(`[EmissionGuard] Laudo '${reportId}' declara assinatura '${signer.signatureType}' na emissão. A assinatura ICP-Brasil ocorre depois, no fluxo de assinatura.`, serviceId);
    }
    if (pipelineSnapshot?.dataSourceIntegrity === '100% REAL VERIFICADO') {
      throw new EmissionGuardError(`[EmissionGuard] Laudo '${reportId}' afirma '100% REAL VERIFICADO' sem verificação rastreável. Use ARQUIVOS_AUDITADOS, CONEXAO_ERP_ASSINADA ou DEMONSTRACAO_SEM_VALIDADE.`, serviceId);
    }
  }

  // 4. Serialização Canônica Estrita
  const canonicalPayload = JSON.stringify({
    reportId,
    serviceId,
    tenantId,
    tenantCnpj,
    issuedAt: reportInput.issuedAt,
    signer: reportInput.signer,
    sectionsPayload,
    pipelineSnapshot: reportInput.pipelineSnapshot,
    lgpdCompliance: reportInput.lgpdCompliance
  });

  // 5. Cálculo Criptográfico SHA-256 (mesmo algoritmo/saída do computeSha256Sync; testado contra node:crypto)
  const hash = sha256HexSync(canonicalPayload);
  return `0x${hash}`;
}
