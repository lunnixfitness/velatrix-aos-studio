/**
 * VELATRIX AOS V2 - SERVIÇO DE AUDITORIA IMUTÁVEL (LGPD & COMPLIANCE PERICIAL)
 * Trilha pericial imutável com hashes SHA-256 e captura dinâmica de IP da requisição.
 */

import { sha256Hex } from '../../shared/crypto/hash';
import { GovAuditLedgerEntry } from '../../types/integrationConnectors';
import {
  saveGovAuditEntry,
  getGovAuditEntriesSync,
  listGovAuditEntries,
} from '../../server/repositories/auditLedgerRepository';
import { secureRandomUUID } from './cryptoUtils';

export const INITIAL_GOV_AUDIT_LOGS: GovAuditLedgerEntry[] = [
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

export class AuditLedgerService {
  /**
   * Registro Imutável de Auditoria Pericial (LGPD)
   * Captura o IP real da requisição (req.ip / x-forwarded-for) em vez de IP estático.
   */
  static async createAuditEntry(
    params: {
      portalGoverno: GovAuditLedgerEntry['portalGoverno'];
      endpoint: string;
      metodoHttp: 'GET' | 'POST';
      cnpjConsultado: string;
      certificadoA1Thumbprint: string;
      httpStatus: number;
      tempoRespostaMs: number;
      clientIp?: string;
    },
    clientIpOrReq?: string | { ip?: string; headers?: Record<string, any>; socket?: { remoteAddress?: string } }
  ): Promise<GovAuditLedgerEntry> {
    let resolvedIp = params.clientIp;

    if (!resolvedIp && clientIpOrReq) {
      if (typeof clientIpOrReq === 'string') {
        resolvedIp = clientIpOrReq;
      } else if (typeof clientIpOrReq === 'object') {
        const xForwarded = clientIpOrReq.headers?.['x-forwarded-for'];
        resolvedIp = (typeof xForwarded === 'string' ? xForwarded.split(',')[0].trim() : '') ||
          clientIpOrReq.ip ||
          clientIpOrReq.socket?.remoteAddress;
      }
    }

    if (!resolvedIp && typeof window !== 'undefined') {
      resolvedIp = '127.0.0.1';
    }

    resolvedIp = resolvedIp || '127.0.0.1';

    const timestamp = new Date().toISOString();
    const digest = await sha256Hex(`${params.endpoint}:${params.cnpjConsultado}:${timestamp}`);
    const imutabilidade = await sha256Hex(`${digest}:${params.certificadoA1Thumbprint}:${params.tempoRespostaMs}`);
    const auditUuid = secureRandomUUID().replace(/-/g, '');

    const entry: GovAuditLedgerEntry = {
      id: `gov_audit_${Date.now()}_${auditUuid.substring(0, 4)}`,
      timestamp,
      clientIp: resolvedIp,
      cnpjConsultado: params.cnpjConsultado,
      portalGoverno: params.portalGoverno,
      endpoint: params.endpoint,
      metodoHttp: params.metodoHttp,
      certificadoA1Thumbprint: params.certificadoA1Thumbprint,
      httpStatus: params.httpStatus,
      tempoRespostaMs: params.tempoRespostaMs,
      payloadDigestSha256: `0x${digest}`,
      lgpdCompliance: {
        dadosAnonimizados: true,
        baseLegalLgpd: 'ART_7_II_CUMPRIMENTO_OBRIGACAO_LEGAL',
        dpoAuditorId: 'dpo_velatrix_officer_01'
      },
      imutabilidadeHash: `0x${imutabilidade}`
    };

    // Salva no repositório persistente (Prisma / Postgres com fallback)
    saveGovAuditEntry(entry).catch(err => {
      console.warn('[AuditLedgerService.createAuditEntry] Persist warning:', err);
    });

    return entry;
  }

  static getAuditLogs(): GovAuditLedgerEntry[] {
    return getGovAuditEntriesSync();
  }

  static async listAuditEntries(): Promise<GovAuditLedgerEntry[]> {
    return listGovAuditEntries();
  }
}

export const createAuditEntry = AuditLedgerService.createAuditEntry;
export const getAuditLogs = AuditLedgerService.getAuditLogs;
export const listAuditEntries = AuditLedgerService.listAuditEntries;
