import { prisma, isPrismaActive } from '../../lib/prisma';
import { secureId } from '../../lib/demoMode';
import { exigirDemoOuFalhar } from '../http/erroBanco';

export type ErpProviderType = 'TOTVS' | 'SAP' | 'CUSTOM';
export type ErpAuthType = 'API_KEY' | 'OAUTH2' | 'HMAC_SIGNATURE';
export type ErpConnectionStatusType = 'ATIVO' | 'PENDENTE' | 'ERRO';
export type ErpEventStatusType = 'RECEBIDO' | 'PROCESSADO' | 'ERRO';
export type ErpDirectionType = 'INBOUND' | 'OUTBOUND';

export interface ErpConnectionDto {
  id: string;
  tenantId: string;
  provider: ErpProviderType;
  baseUrl: string;
  authType: ErpAuthType;
  credentialRef: string; // Alias or ref ONLY, never plaintext secret
  webhookSecretHash: string; // SHA-256 hash
  status: ErpConnectionStatusType;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ErpEventLogDto {
  id: string;
  tenantId: string;
  connectionId?: string | null;
  provider: string;
  direction: ErpDirectionType;
  eventType?: string | null;
  rawPayload: any;
  normalizedPayload?: any | null;
  status: ErpEventStatusType;
  errorMessage?: string | null;
  attempts: number;
  lastAttemptAt: string;
  ledgerHash?: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-Memory store fallback
const inMemoryConnections: ErpConnectionDto[] = [];
const inMemoryEventLogs: ErpEventLogDto[] = [];

// Seed an initial demo active connection for tenant-001 if empty
if (inMemoryConnections.length === 0) {
  inMemoryConnections.push({
    id: 'conn_demo_totvs_01',
    tenantId: 'tenant-001',
    provider: 'TOTVS',
    baseUrl: 'https://protheus.autometal.com.br/api/v1',
    authType: 'HMAC_SIGNATURE',
    credentialRef: 'ERP_SECRET_REF_TENANT_001',
    webhookSecretHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Sha256 of empty/demo
    status: 'ATIVO',
    lastSyncAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

function mapPrismaConnection(c: any): ErpConnectionDto {
  return {
    id: c.id,
    tenantId: c.tenantId,
    provider: c.provider as ErpProviderType,
    baseUrl: c.baseUrl,
    authType: c.authType as ErpAuthType,
    credentialRef: c.credentialRef,
    webhookSecretHash: c.webhookSecretHash,
    status: c.status as ErpConnectionStatusType,
    lastSyncAt: c.lastSyncAt ? new Date(c.lastSyncAt).toISOString() : null,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapPrismaEventLog(l: any): ErpEventLogDto {
  return {
    id: l.id,
    tenantId: l.tenantId,
    connectionId: l.connectionId,
    provider: l.provider,
    direction: l.direction as ErpDirectionType,
    eventType: l.eventType,
    rawPayload: l.rawPayload,
    normalizedPayload: l.normalizedPayload,
    status: l.status as ErpEventStatusType,
    errorMessage: l.errorMessage,
    attempts: Number(l.attempts || 1),
    lastAttemptAt: l.lastAttemptAt ? new Date(l.lastAttemptAt).toISOString() : new Date().toISOString(),
    ledgerHash: l.ledgerHash,
    createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: l.updatedAt ? new Date(l.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export async function listErpConnections(tenantId?: string): Promise<ErpConnectionDto[]> {
  if (!isPrismaActive) {
    if (tenantId) {
      return inMemoryConnections.filter(c => c.tenantId === tenantId);
    }
    return [...inMemoryConnections];
  }

  try {
    const list = await (prisma as any).erpConnection.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
    if (list && list.length > 0) {
      return list.map(mapPrismaConnection);
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'erpRepository.listErpConnections');
    console.warn('[erpRepository.listErpConnections] Prisma fallback:', err);
  }

  if (tenantId) {
    return inMemoryConnections.filter(c => c.tenantId === tenantId);
  }
  return [...inMemoryConnections];
}

export async function getErpConnection(tenantId: string, provider?: ErpProviderType): Promise<ErpConnectionDto | null> {
  if (!isPrismaActive) {
    const conn = inMemoryConnections.find(c => 
      c.tenantId === tenantId && (!provider || c.provider === provider)
    );
    return conn ? { ...conn } : null;
  }

  try {
    const conn = await (prisma as any).erpConnection.findFirst({
      where: {
        tenantId,
        ...(provider ? { provider } : {})
      }
    });
    if (conn) {
      return mapPrismaConnection(conn);
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'erpRepository.getErpConnection');
    console.warn(`[erpRepository.getErpConnection] Prisma fallback for ${tenantId}:`, err);
  }

  const fallback = inMemoryConnections.find(c => 
    c.tenantId === tenantId && (!provider || c.provider === provider)
  );
  return fallback ? { ...fallback } : null;
}

export async function upsertErpConnection(input: {
  tenantId: string;
  provider: ErpProviderType;
  baseUrl: string;
  authType: ErpAuthType;
  credentialRef: string;
  webhookSecretHash: string;
  status: ErpConnectionStatusType;
}): Promise<ErpConnectionDto> {
  const now = new Date().toISOString();
  const existingIdx = inMemoryConnections.findIndex(
    c => c.tenantId === input.tenantId && c.provider === input.provider
  );

  let inMemoryItem: ErpConnectionDto;
  if (existingIdx >= 0) {
    inMemoryItem = {
      ...inMemoryConnections[existingIdx],
      ...input,
      updatedAt: now
    };
    inMemoryConnections[existingIdx] = inMemoryItem;
  } else {
    inMemoryItem = {
      id: `conn_${Date.now()}_${secureId('', 4)}`,
      ...input,
      lastSyncAt: now,
      createdAt: now,
      updatedAt: now
    };
    inMemoryConnections.unshift(inMemoryItem);
  }

  if (!isPrismaActive) {
    return inMemoryItem;
  }

  try {
    const saved = await (prisma as any).erpConnection.upsert({
      where: {
        tenantId_provider: {
          tenantId: input.tenantId,
          provider: input.provider
        }
      },
      update: {
        baseUrl: input.baseUrl,
        authType: input.authType,
        credentialRef: input.credentialRef,
        webhookSecretHash: input.webhookSecretHash,
        status: input.status,
        lastSyncAt: new Date()
      },
      create: {
        id: inMemoryItem.id,
        tenantId: input.tenantId,
        provider: input.provider,
        baseUrl: input.baseUrl,
        authType: input.authType,
        credentialRef: input.credentialRef,
        webhookSecretHash: input.webhookSecretHash,
        status: input.status,
        lastSyncAt: new Date()
      }
    });
    return mapPrismaConnection(saved);
  } catch (err) {
    exigirDemoOuFalhar(err, 'erpRepository.upsertErpConnection');
    console.warn('[erpRepository.upsertErpConnection] Prisma fallback:', err);
    return inMemoryItem;
  }
}

export async function createErpEventLog(input: {
  tenantId: string;
  connectionId?: string | null;
  provider: string;
  direction?: ErpDirectionType;
  eventType?: string | null;
  rawPayload: any;
  normalizedPayload?: any | null;
  status?: ErpEventStatusType;
  errorMessage?: string | null;
  ledgerHash?: string | null;
}): Promise<ErpEventLogDto> {
  const now = new Date().toISOString();
  const id = `erplog_${Date.now()}_${secureId('', 4)}`;
  const item: ErpEventLogDto = {
    id,
    tenantId: input.tenantId,
    connectionId: input.connectionId || null,
    provider: input.provider,
    direction: input.direction || 'INBOUND',
    eventType: input.eventType || null,
    rawPayload: input.rawPayload,
    normalizedPayload: input.normalizedPayload || null,
    status: input.status || 'RECEBIDO',
    errorMessage: input.errorMessage || null,
    attempts: 1,
    lastAttemptAt: now,
    ledgerHash: input.ledgerHash || null,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryEventLogs.unshift(item);
  if (inMemoryEventLogs.length > 500) {
    inMemoryEventLogs.pop();
  }

  if (!isPrismaActive) {
    return item;
  }

  try {
    const created = await (prisma as any).erpEventLog.create({
      data: {
        id,
        tenantId: input.tenantId,
        connectionId: input.connectionId || undefined,
        provider: input.provider,
        direction: input.direction || 'INBOUND',
        eventType: input.eventType || undefined,
        rawPayload: input.rawPayload,
        normalizedPayload: input.normalizedPayload || undefined,
        status: input.status || 'RECEBIDO',
        errorMessage: input.errorMessage || undefined,
        attempts: 1,
        lastAttemptAt: new Date(),
        ledgerHash: input.ledgerHash || undefined
      }
    });
    return mapPrismaEventLog(created);
  } catch (err) {
    exigirDemoOuFalhar(err, 'erpRepository.createErpEventLog');
    console.warn('[erpRepository.createErpEventLog] Prisma fallback:', err);
    return item;
  }
}

export async function updateErpEventLog(
  id: string,
  update: Partial<ErpEventLogDto>
): Promise<ErpEventLogDto | null> {
  const now = new Date().toISOString();
  const idx = inMemoryEventLogs.findIndex(l => l.id === id);
  if (idx >= 0) {
    inMemoryEventLogs[idx] = {
      ...inMemoryEventLogs[idx],
      ...update,
      updatedAt: now
    };
  }

  if (!isPrismaActive) {
    return idx >= 0 ? inMemoryEventLogs[idx] : null;
  }

  try {
    const updated = await (prisma as any).erpEventLog.update({
      where: { id },
      data: {
        ...(update.status ? { status: update.status } : {}),
        ...(update.normalizedPayload !== undefined ? { normalizedPayload: update.normalizedPayload } : {}),
        ...(update.errorMessage !== undefined ? { errorMessage: update.errorMessage } : {}),
        ...(update.attempts !== undefined ? { attempts: update.attempts } : {}),
        ...(update.ledgerHash !== undefined ? { ledgerHash: update.ledgerHash } : {}),
        lastAttemptAt: new Date(),
      }
    });
    return mapPrismaEventLog(updated);
  } catch (err) {
    exigirDemoOuFalhar(err, 'erpRepository.updateErpEventLog');
    console.warn(`[erpRepository.updateErpEventLog] Prisma fallback for ${id}:`, err);
    return idx >= 0 ? inMemoryEventLogs[idx] : null;
  }
}

export async function listErpEventLogs(tenantId?: string, limit: number = 50): Promise<ErpEventLogDto[]> {
  if (!isPrismaActive) {
    const filtered = tenantId 
      ? inMemoryEventLogs.filter(l => l.tenantId === tenantId)
      : inMemoryEventLogs;
    return filtered.slice(0, limit);
  }

  try {
    const logs = await (prisma as any).erpEventLog.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    if (logs && logs.length > 0) {
      return logs.map(mapPrismaEventLog);
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'erpRepository.listErpEventLogs');
    console.warn('[erpRepository.listErpEventLogs] Prisma fallback:', err);
  }

  const filtered = tenantId 
    ? inMemoryEventLogs.filter(l => l.tenantId === tenantId)
    : inMemoryEventLogs;
  return filtered.slice(0, limit);
}

export async function getErpEventLogById(id: string): Promise<ErpEventLogDto | null> {
  const inMem = inMemoryEventLogs.find(l => l.id === id);
  if (!isPrismaActive) {
    return inMem ? { ...inMem } : null;
  }

  try {
    const log = await (prisma as any).erpEventLog.findUnique({
      where: { id }
    });
    if (log) {
      return mapPrismaEventLog(log);
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'erpRepository.getErpEventLogById');
    console.warn(`[erpRepository.getErpEventLogById] Prisma fallback for ${id}:`, err);
  }

  return inMem ? { ...inMem } : null;
}
