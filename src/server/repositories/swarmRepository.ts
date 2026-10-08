import { prisma, isPrismaActive } from '../../lib/prisma';
import { StrategicHub, MicroAgentDefinition, SwarmLiveLog } from '../../types/autonomousSwarm';
import { STRATEGIC_HUBS, ALL_300_MICRO_AGENTS } from '../../data/swarmHubsCatalog';
import { INITIAL_SWARM_LOGS } from '../../services/autonomousSwarmService';
import { exigirDemoOuFalhar } from '../http/erroBanco';


export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface SwarmLiveLogDto {
  id: string;
  agentName: string;
  actionTitle: string;
  resultSummary: string;
  rawFormattedLog: string;
  economyBrl?: number;
  bleedPreventedBrl?: number;
  severity: string;
  status: string;
  targetEntity?: string;
  erpEndpoint?: string;
  erpResponseCode?: number;
  requiresMultiSig: boolean;
  ledgerHash: string;
  createdAt: string;
}

// Internal ledger buffer synced across server lifecycle
let inMemorySwarmLogs: SwarmLiveLog[] = [...INITIAL_SWARM_LOGS];

export function getHeadLedgerHash(): string {
  return inMemorySwarmLogs.length > 0 ? inMemorySwarmLogs[0].ledgerHash : GENESIS_HASH;
}

export function getSwarmTotalLogsCount(): number {
  return inMemorySwarmLogs.length;
}

export async function createSwarmLiveLog(log: SwarmLiveLog): Promise<void> {
  const existingIdx = inMemorySwarmLogs.findIndex(l => l.id === log.id);
  if (existingIdx >= 0) {
    inMemorySwarmLogs[existingIdx] = log;
  } else {
    inMemorySwarmLogs.unshift(log);
    if (inMemorySwarmLogs.length > 500) {
      inMemorySwarmLogs.pop();
    }
  }

  // Asynchronously persist to Prisma if database is connected
  if (isPrismaActive) {
    try {
      await prisma.swarmLiveLog.upsert({
        where: { id: log.id },
        update: {
          agentName: log.agentName,
          actionTitle: log.actionTitle,
          resultSummary: log.resultSummary,
          rawFormattedLog: log.rawFormattedLog,
          economyBrl: log.economyBrl,
          bleedPreventedBrl: log.bleedPreventedBrl,
          severity: log.severity,
          status: log.status,
          targetEntity: log.targetEntity,
          erpEndpoint: log.erpEndpoint,
          erpResponseCode: log.erpResponseCode,
          requiresMultiSig: Boolean(log.requiresMultiSig),
          ledgerHash: log.ledgerHash,
        },
        create: {
          id: log.id,
          agentName: log.agentName,
          actionTitle: log.actionTitle,
          resultSummary: log.resultSummary,
          rawFormattedLog: log.rawFormattedLog,
          economyBrl: log.economyBrl,
          bleedPreventedBrl: log.bleedPreventedBrl,
          severity: log.severity,
          status: log.status,
          targetEntity: log.targetEntity,
          erpEndpoint: log.erpEndpoint,
          erpResponseCode: log.erpResponseCode,
          requiresMultiSig: Boolean(log.requiresMultiSig),
          ledgerHash: log.ledgerHash,
        },
      });
    } catch (err) {
      exigirDemoOuFalhar(err, 'swarmRepository.createSwarmLiveLog');
      // Prisma fallback is transparent
    }
  }
}

export async function querySwarmLiveLogs(filters?: {
  agentId?: string;
  severity?: string;
  search?: string;
  limit?: number;
}): Promise<{ logs: SwarmLiveLog[]; total: number; filteredCount: number }> {
  let filtered = [...inMemorySwarmLogs];

  if (filters?.agentId && filters.agentId !== 'all') {
    filtered = filtered.filter(l => l.agentId === filters.agentId || l.routedHubId === filters.agentId);
  }

  if (filters?.severity && filters.severity !== 'all') {
    filtered = filtered.filter(l => l.severity === filters.severity);
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(l =>
      l.rawFormattedLog.toLowerCase().includes(q) ||
      (l.targetEntity && l.targetEntity.toLowerCase().includes(q)) ||
      l.ledgerHash.toLowerCase().includes(q) ||
      l.resultSummary.toLowerCase().includes(q)
    );
  }

  const maxLimit = filters?.limit && !isNaN(filters.limit) ? filters.limit : 100;
  const paginated = filtered.slice(0, maxLimit);

  return {
    logs: paginated,
    total: inMemorySwarmLogs.length,
    filteredCount: filtered.length,
  };
}

export async function getAgentsClusterStats(): Promise<{
  totalAgents: number;
  activeAgents: number;
  standbyAgents: number;
}> {
  const agents = await listMicroAgents();
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === 'ACTIVE' || a.runtimeMode === 'CONTAINER_WARM').length;
  const standbyAgents = totalAgents - activeAgents;
  return { totalAgents, activeAgents, standbyAgents };
}

export async function listStrategicHubs(): Promise<StrategicHub[]> {
  if (!isPrismaActive) {
    return [...STRATEGIC_HUBS];
  }
  try {
    const hubs = await prisma.strategicHub.findMany({
      orderBy: { code: 'asc' },
    });
    if (hubs && hubs.length > 0) {
      return hubs.map(h => ({
        id: h.id as any,
        code: h.code,
        name: h.name,
        shortName: h.shortName,
        description: h.description,
        color: h.color,
        accentBg: h.accentBg || 'bg-emerald-500/10',
        borderAccent: h.borderAccent || 'border-emerald-500/30',
        iconName: h.iconName,
        totalAgentsCount: h.totalAgentsCount,
        activeAgentsCount: h.activeAgentsCount,
        standbyAgentsCount: h.standbyAgentsCount,
        eventsProcessedCount: Number(h.eventsProcessedCount),
        totalEconomyBrl: Number(h.totalEconomyBrl),
        totalBleedMitigatedBrl: Number(h.totalBleedMitigatedBrl),
        avgLatencyMs: h.avgLatencyMs,
        healthStatus: (h.healthStatus.toUpperCase() as any) || 'HEALTHY',
        subCategories: h.subCategories,
      }));
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'swarmRepository.listStrategicHubs');
    console.warn('[swarmRepository.listStrategicHubs] Prisma fallback:', err);
  }
  return [...STRATEGIC_HUBS];
}

export async function listMicroAgents(hubId?: string): Promise<MicroAgentDefinition[]> {
  if (!isPrismaActive) {
    if (hubId) {
      return ALL_300_MICRO_AGENTS.filter(a => a.hubId === hubId);
    }
    return [...ALL_300_MICRO_AGENTS];
  }
  try {
    const agents = await prisma.microAgent.findMany({
      where: hubId ? { hubId } : undefined,
      orderBy: { codeName: 'asc' },
    });
    if (agents && agents.length > 0) {
      return agents.map(a => ({
        id: a.id,
        codeName: a.codeName,
        hubId: a.hubId as any,
        name: a.name,
        subCategory: a.subCategory,
        description: a.description,
        triggerKeywords: a.triggerKeywords,
        erpEndpoint: a.erpEndpoint || '',
        status: (a.status.toUpperCase() as any) || 'ACTIVE',
        runtimeMode: (a.runtimeMode.toUpperCase() as any) || 'CONTAINER_WARM',
        processedEventsCount: Number(a.processedEventsCount),
        mitigatedBleedBrl: Number(a.mitigatedBleedBrl),
        generatedEconomyBrl: Number(a.generatedEconomyBrl),
        avgLatencyMs: a.avgLatencyMs,
        lastHeartbeat: 'Agora (D+0 Real-Time)',
        successRatePct: Number(a.successRatePct),
        requiresMultiSigThresholdBrl: a.requiresMultiSigThresholdBrl ? Number(a.requiresMultiSigThresholdBrl) : undefined,
        sampleActionDescription: a.sampleActionDescription || undefined,
      }));
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'swarmRepository.listMicroAgents');
    console.warn('[swarmRepository.listMicroAgents] Prisma fallback:', err);
  }
  if (hubId) {
    return ALL_300_MICRO_AGENTS.filter(a => a.hubId === hubId);
  }
  return [...ALL_300_MICRO_AGENTS];
}

export async function listSwarmLiveLogs(limit = 20): Promise<SwarmLiveLogDto[]> {
  if (!isPrismaActive) {
    return inMemorySwarmLogs.slice(0, limit).map(l => ({
      id: l.id,
      agentName: l.agentName,
      actionTitle: l.actionTitle,
      resultSummary: l.resultSummary,
      rawFormattedLog: l.rawFormattedLog,
      economyBrl: l.economyBrl,
      bleedPreventedBrl: l.bleedPreventedBrl,
      severity: l.severity,
      status: l.status,
      targetEntity: l.targetEntity,
      erpEndpoint: l.erpEndpoint,
      erpResponseCode: l.erpResponseCode,
      requiresMultiSig: Boolean(l.requiresMultiSig),
      ledgerHash: l.ledgerHash,
      createdAt: new Date().toISOString(),
    }));
  }
  try {
    const logs = await prisma.swarmLiveLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    if (logs && logs.length > 0) {
      return logs.map(l => ({
        id: l.id,
        agentName: l.agentName,
        actionTitle: l.actionTitle,
        resultSummary: l.resultSummary,
        rawFormattedLog: l.rawFormattedLog,
        economyBrl: l.economyBrl ? Number(l.economyBrl) : undefined,
        bleedPreventedBrl: l.bleedPreventedBrl ? Number(l.bleedPreventedBrl) : undefined,
        severity: l.severity,
        status: l.status,
        targetEntity: l.targetEntity || undefined,
        erpEndpoint: l.erpEndpoint || undefined,
        erpResponseCode: l.erpResponseCode || undefined,
        requiresMultiSig: l.requiresMultiSig,
        ledgerHash: l.ledgerHash,
        createdAt: l.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'swarmRepository.listSwarmLiveLogs');
    console.warn('[swarmRepository.listSwarmLiveLogs] Prisma fallback:', err);
  }
  return inMemorySwarmLogs.slice(0, limit).map(l => ({
    id: l.id,
    agentName: l.agentName,
    actionTitle: l.actionTitle,
    resultSummary: l.resultSummary,
    rawFormattedLog: l.rawFormattedLog,
    economyBrl: l.economyBrl,
    bleedPreventedBrl: l.bleedPreventedBrl,
    severity: l.severity,
    status: l.status,
    targetEntity: l.targetEntity,
    erpEndpoint: l.erpEndpoint,
    erpResponseCode: l.erpResponseCode,
    requiresMultiSig: Boolean(l.requiresMultiSig),
    ledgerHash: l.ledgerHash,
    createdAt: new Date().toISOString(),
  }));
}

