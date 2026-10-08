import { prisma, isPrismaActive } from '../../lib/prisma';
import { AuditRecord } from '../../types/aos';
import { GovAuditLedgerEntry } from '../../types/integrationConnectors';
import { exigirDemoOuFalhar } from '../http/erroBanco';

const inMemoryLedger: AuditRecord[] = [];

// Base seed for Gov Audit Logs
const INITIAL_GOV_AUDIT_LOGS_SEED: GovAuditLedgerEntry[] = [
  {
    id: 'gov_audit_01',
    timestamp: '2026-09-16T10:45:12.410Z',
    clientIp: '177.136.210.45',
    cnpjConsultado: '18.492.301/0001-84',
    portalGoverno: 'RECEITA_FEDERAL_ECAC',
    endpoint: 'https://cav.receita.fazenda.gov.br/api/v1/perdcomp/transmitir',
    metodoHttp: 'POST',
    certificadoA1Thumbprint: '9f82c4b8e21a0d3f8c5b6a719283e401b2a3c4d5e6f708192a3b4c5d6e7f8091',
    httpStatus: 200,
    tempoRespostaMs: 342,
    payloadDigestSha256: '0x8899aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
    lgpdCompliance: {
      dadosAnonimizados: true,
      baseLegalLgpd: 'ART_7_II_CUMPRIMENTO_OBRIGACAO_LEGAL',
      dpoAuditorId: 'dpo_velatrix_officer_01'
    },
    imutabilidadeHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b'
  },
  {
    id: 'gov_audit_02',
    timestamp: '2026-09-16T11:00:00.120Z',
    clientIp: '177.136.210.45',
    cnpjConsultado: '18.492.301/0001-84',
    portalGoverno: 'PGFN_REGULARIZE',
    endpoint: 'https://regularize.pgfn.gov.br/api/consulta/cda/extrato',
    metodoHttp: 'GET',
    certificadoA1Thumbprint: '9f82c4b8e21a0d3f8c5b6a719283e401b2a3c4d5e6f708192a3b4c5d6e7f8091',
    httpStatus: 200,
    tempoRespostaMs: 188,
    payloadDigestSha256: '0x112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00',
    lgpdCompliance: {
      dadosAnonimizados: true,
      baseLegalLgpd: 'ART_7_VI_EXERCICIO_REGULAR_DIREITO',
      dpoAuditorId: 'dpo_velatrix_officer_01'
    },
    imutabilidadeHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
  },
  {
    id: 'gov_audit_03',
    timestamp: '2026-09-16T11:15:20.900Z',
    clientIp: '186.220.198.12',
    cnpjConsultado: '18.492.301/0001-84',
    portalGoverno: 'BAAS_BACEN',
    endpoint: 'https://api.asaas.com/v3/payments/split_chg_2026_9941/settle',
    metodoHttp: 'POST',
    certificadoA1Thumbprint: '3e4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef01',
    httpStatus: 200,
    tempoRespostaMs: 95,
    payloadDigestSha256: '0x4455667788990011223344556677889900112233445566778899001122334455',
    lgpdCompliance: {
      dadosAnonimizados: true,
      baseLegalLgpd: 'ART_7_VI_EXERCICIO_REGULAR_DIREITO',
      dpoAuditorId: 'dpo_velatrix_officer_01'
    },
    imutabilidadeHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d'
  }
];

let inMemoryGovAuditLogs: GovAuditLedgerEntry[] = [...INITIAL_GOV_AUDIT_LOGS_SEED];

function mapPrismaLedgerToAuditRecord(e: any): AuditRecord {
  return {
    id: e.id,
    chainIndex: e.chainIndex ? Number(e.chainIndex) : 1,
    timestamp: e.timestamp ? e.timestamp.toISOString() : new Date().toISOString(),
    eventId: e.eventId,
    eventTitle: e.eventTitle,
    sector: e.sector || 'Geral',
    jurisdiction: e.jurisdiction || 'BR_FEDERAL_SEFAZ',
    agentsInvolved: e.agentsInvolved || [],
    decisionSummary: e.decisionSummary,
    decisionAst: e.decisionAstJson as any,
    execution_payload: e.executionPayloadJson as any,
    status: (e.status.toLowerCase() as any) || 'executed',
    signatures: (e.signatures as any) || [],
    executionReceipt: e.executionReceipt || `TX-${e.id}`,
    invariantSnapshot: e.invariantSnapshot || [],
    recordHash: e.recordHash,
    previousRecordHash: e.previousRecordHash,
    requiredSignatures: e.requiredSignatures || 1,
  };
}

export async function listAuditLedgerEntries(tenantId?: string): Promise<AuditRecord[]> {
  if (!isPrismaActive) {
    return inMemoryLedger;
  }
  try {
    const entries = await prisma.auditLedgerEntry.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { timestamp: 'desc' },
    });
    if (entries && entries.length > 0) {
      return entries.map(mapPrismaLedgerToAuditRecord);
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'auditLedgerRepository.listAuditLedgerEntries');
    console.warn('[auditLedgerRepository.listAuditLedgerEntries] Prisma fallback:', err);
  }
  return inMemoryLedger;
}

export const getAuditLedgerEntries = listAuditLedgerEntries;

export async function createAuditLedgerEntry(record: AuditRecord): Promise<AuditRecord> {
  const existingIdx = inMemoryLedger.findIndex(e => e.id === record.id);
  if (existingIdx >= 0) {
    inMemoryLedger[existingIdx] = record;
  } else {
    inMemoryLedger.unshift(record);
  }

  if (!isPrismaActive) {
    return record;
  }

  try {
    const saved = await prisma.auditLedgerEntry.upsert({
      where: { id: record.id },
      update: {},
      create: {
        id: record.id,
        chainIndex: record.chainIndex ? BigInt(record.chainIndex) : undefined,
        eventId: record.eventId,
        eventTitle: record.eventTitle,
        sector: record.sector,
        jurisdiction: record.jurisdiction || 'BR',
        agentsInvolved: record.agentsInvolved || [],
        decisionSummary: record.decisionSummary,
        decisionAstJson: record.decisionAst as any,
        executionPayloadJson: record.execution_payload as any,
        status: (record.status.toUpperCase() as any) || 'EXECUTED',
        signatures: record.signatures as any,
        executionReceipt: record.executionReceipt,
        invariantSnapshot: record.invariantSnapshot || [],
        recordHash: record.recordHash || '0xHASH',
        previousRecordHash: record.previousRecordHash || '0xPREV',
        requiredSignatures: record.requiredSignatures || 1,
        timestamp: new Date(record.timestamp),
      },
    });
    return mapPrismaLedgerToAuditRecord(saved);
  } catch (err) {
    exigirDemoOuFalhar(err, 'auditLedgerRepository.createAuditLedgerEntry');
    console.warn('[auditLedgerRepository.createAuditLedgerEntry] Prisma fallback:', err);
    return record;
  }
}

export function getGovAuditEntriesSync(): GovAuditLedgerEntry[] {
  return inMemoryGovAuditLogs;
}

export async function listGovAuditEntries(): Promise<GovAuditLedgerEntry[]> {
  if (!isPrismaActive) {
    return inMemoryGovAuditLogs;
  }
  try {
    const entries = await prisma.auditLedgerEntry.findMany({
      where: { sector: 'CONECTORES_GOVERNAMENTAIS' },
      orderBy: { timestamp: 'desc' },
    });
    if (entries && entries.length > 0) {
      const mapped: GovAuditLedgerEntry[] = entries.map((e: any) => {
        if (e.executionPayloadJson && typeof e.executionPayloadJson === 'object' && 'portalGoverno' in e.executionPayloadJson) {
          return e.executionPayloadJson as GovAuditLedgerEntry;
        }
        return {
          id: e.id,
          timestamp: e.timestamp ? e.timestamp.toISOString() : new Date().toISOString(),
          clientIp: '177.136.210.45',
          cnpjConsultado: '18.492.301/0001-84',
          portalGoverno: (e.jurisdiction as any) || 'RECEITA_FEDERAL_ECAC',
          endpoint: e.eventTitle || '/api/v1/gov',
          metodoHttp: 'POST',
          certificadoA1Thumbprint: '9f82c4b8e21a0d3f8c5b6a719283e401b2a3c4d5e6f708192a3b4c5d6e7f8091',
          httpStatus: 200,
          tempoRespostaMs: 150,
          payloadDigestSha256: e.executionReceipt || '0xDIGEST',
          lgpdCompliance: {
            dadosAnonimizados: true,
            baseLegalLgpd: 'ART_7_II_CUMPRIMENTO_OBRIGACAO_LEGAL',
            dpoAuditorId: 'dpo_velatrix_officer_01'
          },
          imutabilidadeHash: e.recordHash || '0xHASH'
        };
      });
      inMemoryGovAuditLogs = mapped;
      return mapped;
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'auditLedgerRepository.listGovAuditEntries');
    console.warn('[auditLedgerRepository.listGovAuditEntries] Prisma fallback:', err);
  }
  return inMemoryGovAuditLogs;
}

export async function saveGovAuditEntry(entry: GovAuditLedgerEntry): Promise<GovAuditLedgerEntry> {
  const existingIdx = inMemoryGovAuditLogs.findIndex(e => e.id === entry.id);
  if (existingIdx >= 0) {
    inMemoryGovAuditLogs[existingIdx] = entry;
  } else {
    inMemoryGovAuditLogs.unshift(entry);
  }

  if (!isPrismaActive) {
    return entry;
  }

  try {
    await prisma.auditLedgerEntry.upsert({
      where: { id: entry.id },
      update: {
        executionReceipt: entry.payloadDigestSha256,
        recordHash: entry.imutabilidadeHash,
        executionPayloadJson: entry as any,
      },
      create: {
        id: entry.id,
        chainIndex: BigInt(Date.now()),
        eventId: entry.id,
        eventTitle: `[${entry.portalGoverno}] ${entry.metodoHttp} ${entry.endpoint}`,
        sector: 'CONECTORES_GOVERNAMENTAIS',
        jurisdiction: entry.portalGoverno,
        agentsInvolved: ['GovConnectorService', entry.portalGoverno],
        decisionSummary: `Operação ${entry.metodoHttp} no endpoint ${entry.endpoint} para CNPJ ${entry.cnpjConsultado}. HTTP ${entry.httpStatus} (${entry.tempoRespostaMs}ms). Base Legal LGPD: ${entry.lgpdCompliance.baseLegalLgpd}`,
        decisionAstJson: {
          portal: entry.portalGoverno,
          endpoint: entry.endpoint,
          httpStatus: entry.httpStatus,
          clientIp: entry.clientIp,
          cnpjConsultado: entry.cnpjConsultado,
          certificadoA1Thumbprint: entry.certificadoA1Thumbprint,
        } as any,
        executionPayloadJson: entry as any,
        status: entry.httpStatus >= 200 && entry.httpStatus < 300 ? 'EXECUTED' : 'REJECTED',
        executionReceipt: entry.payloadDigestSha256,
        invariantSnapshot: ['LGPD_ART_7', 'ICP_BRASIL_A1', 'MTLS_TLS13'],
        recordHash: entry.imutabilidadeHash,
        previousRecordHash: '0xGENESIS_RFB',
        requiredSignatures: 1,
        timestamp: new Date(entry.timestamp),
      },
    });
  } catch (err) {
    exigirDemoOuFalhar(err, 'auditLedgerRepository.saveGovAuditEntry');
    console.warn('[auditLedgerRepository.saveGovAuditEntry] Prisma write fallback:', err);
  }

  return entry;
}
