import { PrismaClient, UserRole, StatusTenant, LeadStage, LeadOrigin, HubHealthStatus, AgentExecutionStatus, AgentRuntimeMode, AgentRiskLevel, LedgerStatus } from '@prisma/client';
import crypto from 'crypto';
import { INITIAL_MOCK_TENANTS } from '../src/data/mockSuperAdmin';
import { ENTERPRISE_USERS_REGISTRY } from '../src/data/mockUsers';
import { INITIAL_MOCK_PROSPECTS, INITIAL_MOCK_TAX_PROFESSIONALS } from '../src/data/mockOfficeData';
import { STRATEGIC_HUBS, ALL_300_MICRO_AGENTS } from '../src/data/swarmHubsCatalog';
import { GENESIS_HASH } from '../src/utils/auditChain';

const prisma = new PrismaClient();

function generateSafePasswordHash(saltKey: string): string {
  return crypto.createHash('sha256').update(`velatrix_secure_placeholder_salt_${saltKey}`).digest('hex');
}

export async function main() {
  console.log('🌱 Starting VELATRIX AOS Database Seeding...');

  // 1. Seed Strategic Hubs (8 Hubs)
  console.log(`📦 Seeding ${STRATEGIC_HUBS.length} Strategic Hubs...`);
  for (const hub of STRATEGIC_HUBS) {
    const rawHealth = String(hub.healthStatus).toUpperCase();
    let health: HubHealthStatus = HubHealthStatus.HEALTHY;
    if (rawHealth.includes('WARN')) health = HubHealthStatus.WARNING;
    if (rawHealth.includes('DEGRAD')) health = HubHealthStatus.DEGRADED;

    await prisma.strategicHub.upsert({
      where: { id: hub.id },
      update: {
        code: hub.code,
        name: hub.name,
        shortName: hub.shortName,
        description: hub.description,
        color: hub.color,
        accentBg: hub.accentBg,
        borderAccent: hub.borderAccent,
        iconName: hub.iconName,
        totalAgentsCount: hub.totalAgentsCount,
        activeAgentsCount: hub.activeAgentsCount,
        standbyAgentsCount: hub.standbyAgentsCount,
        eventsProcessedCount: BigInt(hub.eventsProcessedCount || 0),
        totalEconomyBrl: hub.totalEconomyBrl,
        totalBleedMitigatedBrl: hub.totalBleedMitigatedBrl,
        avgLatencyMs: hub.avgLatencyMs,
        healthStatus: health,
        subCategories: hub.subCategories,
      },
      create: {
        id: hub.id,
        code: hub.code,
        name: hub.name,
        shortName: hub.shortName,
        description: hub.description,
        color: hub.color,
        accentBg: hub.accentBg,
        borderAccent: hub.borderAccent,
        iconName: hub.iconName,
        totalAgentsCount: hub.totalAgentsCount,
        activeAgentsCount: hub.activeAgentsCount,
        standbyAgentsCount: hub.standbyAgentsCount,
        eventsProcessedCount: BigInt(hub.eventsProcessedCount || 0),
        totalEconomyBrl: hub.totalEconomyBrl,
        totalBleedMitigatedBrl: hub.totalBleedMitigatedBrl,
        avgLatencyMs: hub.avgLatencyMs,
        healthStatus: health,
        subCategories: hub.subCategories,
      },
    });
  }

  // 2. Seed Micro Agents (All 300 Agents)
  console.log(`🤖 Seeding ${ALL_300_MICRO_AGENTS.length} Autonomous Micro-Agents...`);
  for (const agent of ALL_300_MICRO_AGENTS) {
    const rawStatus = String(agent.status).toUpperCase();
    let status: AgentExecutionStatus = AgentExecutionStatus.ACTIVE;
    if (rawStatus.includes('STANDBY')) status = AgentExecutionStatus.STANDBY_ON_DEMAND;
    else if (rawStatus.includes('EXEC')) status = AgentExecutionStatus.EXECUTING;
    else if (rawStatus.includes('BLOCKED')) status = AgentExecutionStatus.BLOCKED_HUMAN_IN_THE_LOOP;

    const rawMode = String(agent.runtimeMode).toUpperCase();
    let runtimeMode: AgentRuntimeMode = AgentRuntimeMode.CONTAINER_WARM;
    if (rawMode.includes('COLD')) runtimeMode = AgentRuntimeMode.SERVERLESS_COLD;
    else if (rawMode.includes('STANDBY')) runtimeMode = AgentRuntimeMode.STANDBY_ON_DEMAND;

    const rawRisk = String((agent as any).riskLevel || 'medium').toUpperCase();
    let risk: AgentRiskLevel = AgentRiskLevel.MEDIUM;
    if (rawRisk.includes('LOW')) risk = AgentRiskLevel.LOW;
    else if (rawRisk.includes('HIGH')) risk = AgentRiskLevel.HIGH;
    else if (rawRisk.includes('CRITICAL')) risk = AgentRiskLevel.CRITICAL;

    await prisma.microAgent.upsert({
      where: { id: agent.id },
      update: {
        codeName: agent.codeName,
        hubId: agent.hubId,
        name: agent.name,
        subCategory: agent.subCategory,
        description: agent.description,
        triggerKeywords: agent.triggerKeywords || [],
        erpEndpoint: agent.erpEndpoint,
        status,
        runtimeMode,
        riskLevel: risk,
        processedEventsCount: BigInt(agent.processedEventsCount || 0),
        mitigatedBleedBrl: agent.mitigatedBleedBrl || 0,
        generatedEconomyBrl: agent.generatedEconomyBrl || 0,
        avgLatencyMs: agent.avgLatencyMs || 20,
        successRatePct: agent.successRatePct || 99.5,
        requiresMultiSigThresholdBrl: agent.requiresMultiSigThresholdBrl,
        sampleActionDescription: agent.sampleActionDescription,
      },
      create: {
        id: agent.id,
        codeName: agent.codeName,
        hubId: agent.hubId,
        name: agent.name,
        subCategory: agent.subCategory,
        description: agent.description,
        triggerKeywords: agent.triggerKeywords || [],
        erpEndpoint: agent.erpEndpoint,
        status,
        runtimeMode,
        riskLevel: risk,
        processedEventsCount: BigInt(agent.processedEventsCount || 0),
        mitigatedBleedBrl: agent.mitigatedBleedBrl || 0,
        generatedEconomyBrl: agent.generatedEconomyBrl || 0,
        avgLatencyMs: agent.avgLatencyMs || 20,
        successRatePct: agent.successRatePct || 99.5,
        requiresMultiSigThresholdBrl: agent.requiresMultiSigThresholdBrl,
        sampleActionDescription: agent.sampleActionDescription,
      },
    });
  }

  // 3. Seed Tenants (Empresas Clientes)
  console.log(`🏢 Seeding ${INITIAL_MOCK_TENANTS.length} Enterprise Tenants...`);
  for (const t of INITIAL_MOCK_TENANTS) {
    const rawStatus = String(t.status || 'ACTIVE').toUpperCase();
    let st: StatusTenant = StatusTenant.NORMAL;
    if (rawStatus.includes('WARN')) st = StatusTenant.WARNING;
    else if (rawStatus.includes('SUSPEND')) st = StatusTenant.SUSPENDED;
    else if (rawStatus.includes('SHADOW')) st = StatusTenant.SHADOW_MODE;
    else if (rawStatus.includes('ACTIVE')) st = StatusTenant.ACTIVE;

    const erp = (t as any).conectorERP || t.connectedErp || (t.connectedChannels?.[0] ?? 'TOTVS Protheus');
    const mrrVal = Number((t as any).mrr ?? t.mrrBrl ?? 19600);
    const geminiVal = Number((t as any).consumoGeminiGb ?? 18.4);
    const activeAgentsVal = Number((t as any).agentesAtivos ?? 12);
    const cityVal = (t as any).city || t.location?.city || 'São Paulo';
    const stateVal = (t as any).state || t.location?.state || 'SP';

    await prisma.tenant.upsert({
      where: { id: t.id },
      update: {
        slug: t.slug,
        nomeEmpresa: t.name,
        cnpj: t.cnpj,
        plano: t.planTier || 'PROFESSIONAL',
        status: st,
        conectorERP: erp,
        mrr: mrrVal,
        tokensConsumedMonthly: BigInt(t.tokensConsumedMonthly || 142000000),
        consumoGeminiGb: geminiVal,
        agentesAtivos: activeAgentsVal,
        sector: t.sector,
        sectorLabel: t.sectorLabel,
        city: cityVal,
        state: stateVal,
        connectedChannels: t.connectedChannels || [],
        enabledServices: t.enabledServices || [],
      },
      create: {
        id: t.id,
        slug: t.slug,
        nomeEmpresa: t.name,
        cnpj: t.cnpj,
        plano: t.planTier || 'PROFESSIONAL',
        status: st,
        conectorERP: erp,
        mrr: mrrVal,
        tokensConsumedMonthly: BigInt(t.tokensConsumedMonthly || 142000000),
        consumoGeminiGb: geminiVal,
        agentesAtivos: activeAgentsVal,
        sector: t.sector,
        sectorLabel: t.sectorLabel,
        city: cityVal,
        state: stateVal,
        connectedChannels: t.connectedChannels || [],
        enabledServices: t.enabledServices || [],
      },
    });
  }

  // 4. Seed Partner Offices (Escritórios Parceiros)
  console.log('⚖️ Seeding Partner Offices...');
  const office1 = await prisma.partnerOffice.upsert({
    where: { email: 'marcelo@vasconcelosadv.com.br' },
    update: {},
    create: {
      id: 'partner_adv_vasconcelos',
      name: 'Vasconcelos & Associados Advocacia Tributária',
      tradeName: 'Vasconcelos Tax Law',
      cnpj: '38.192.401/0001-77',
      oabOrCrc: 'OAB/SP 284.910',
      primaryLawyerOrAccountant: 'Dr. Marcelo Vasconcelos Ribeiro',
      email: 'marcelo@vasconcelosadv.com.br',
      phone: '(11) 98412-4400',
      brandPrimaryColor: '#4F46E5',
      brandSecondaryColor: '#06B6D4',
      defaultSplitPct: 70.0,
      defaultVelatrixPct: 30.0,
      pixKeyType: 'CNPJ',
      pixKey: '38192401000177',
      bankCode: '033',
      bankName: 'Banco Santander (Brasil) S.A.',
      agency: '1420',
      accountNumber: '992014-8',
      isVerified: true,
      status: 'ACTIVE',
    },
  });

  const office2 = await prisma.partnerOffice.upsert({
    where: { email: 'juliana@audixconsultoria.cnt.br' },
    update: {},
    create: {
      id: 'partner_contab_audix',
      name: 'Audix & Consultoria Contábil e Pericial S/S',
      tradeName: 'Audix Perícias Tributárias',
      cnpj: '14.882.193/0001-52',
      oabOrCrc: 'CRC/SP 1SP284560',
      primaryLawyerOrAccountant: 'Dra. Juliana Alencar',
      email: 'juliana@audixconsultoria.cnt.br',
      phone: '(11) 97120-3311',
      brandPrimaryColor: '#059669',
      brandSecondaryColor: '#10B981',
      defaultSplitPct: 70.0,
      defaultVelatrixPct: 30.0,
      pixKeyType: 'CNPJ',
      pixKey: '14882193000152',
      bankCode: '260',
      bankName: 'Nu Pagamentos S.A.',
      agency: '0001',
      accountNumber: '840192-3',
      isVerified: true,
      status: 'ACTIVE',
    },
  });

  // 5. Seed Users (RBAC)
  console.log(`👤 Seeding ${ENTERPRISE_USERS_REGISTRY.length} Core Users + Tax Professionals...`);
  for (const u of ENTERPRISE_USERS_REGISTRY) {
    const rawRole = String(u.role).toUpperCase();
    let role: UserRole = UserRole.OPERADOR;
    if (rawRole.includes('SUPER_ADMIN')) role = UserRole.SUPER_ADMIN;
    else if (rawRole.includes('ADMIN')) role = UserRole.ADMIN_VELATRIX;
    else if (rawRole.includes('ADVOGADO')) role = UserRole.ADVOGADO_PARCEIRO;
    else if (rawRole.includes('CONTADOR')) role = UserRole.CONTADOR_PARCEIRO;

    const tenantId = u.tenantId || (u.tenantName === 'Nexus Indústria' ? 'tenant_nexus_01' : null);
    const userPhone = (u as any).phone || undefined;
    const userActive = (u as any).active ?? true;

    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        role,
        department: u.department,
        avatar: u.avatar,
        phone: userPhone,
        active: userActive,
        tenantId,
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: generateSafePasswordHash(u.email),
        role,
        department: u.department,
        avatar: u.avatar,
        phone: userPhone,
        active: userActive,
        tenantId,
      },
    });
  }

  // Seed Tax Professionals as Partner Users
  for (const p of INITIAL_MOCK_TAX_PROFESSIONALS) {
    const isAdv = p.role === 'Advogado';
    const role = isAdv ? UserRole.ADVOGADO_PARCEIRO : UserRole.CONTADOR_PARCEIRO;
    const partnerOfficeId = isAdv ? office1.id : office2.id;

    await prisma.user.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        role,
        department: isAdv ? 'Jurídico Tributário' : 'Perícia Contábil & SPED',
        registrationNumber: p.registrationNumber,
        oabOrCrc: p.registrationNumber,
        partnerOfficeId,
      },
      create: {
        id: p.id,
        name: p.name,
        email: p.email,
        passwordHash: generateSafePasswordHash(p.email),
        role,
        department: isAdv ? 'Jurídico Tributário' : 'Perícia Contábil & SPED',
        registrationNumber: p.registrationNumber,
        oabOrCrc: p.registrationNumber,
        partnerOfficeId,
      },
    });
  }

  // 6. Seed Prospect Leads
  console.log(`🎯 Seeding ${INITIAL_MOCK_PROSPECTS.length} Prospect Leads...`);
  for (const lead of INITIAL_MOCK_PROSPECTS) {
    let stage: LeadStage = LeadStage.LEAD;
    if (lead.stage === 'proposal_sent') stage = LeadStage.PROPOSAL_SENT;
    if (lead.stage === 'negotiation') stage = LeadStage.NEGOTIATION;
    if (lead.stage === 'closed') stage = LeadStage.CLOSED;

    let origem: LeadOrigin = LeadOrigin.LANDING_PAGE;
    if (lead.origem === 'MAPS_MANUAL') origem = LeadOrigin.MAPS_MANUAL;
    if (lead.origem === 'INDICACAO_PARCEIRO') origem = LeadOrigin.INDICACAO_PARCEIRO;

    await prisma.prospectLead.upsert({
      where: { cnpj: lead.cnpj },
      update: {
        name: lead.name,
        sector: lead.sector,
        sectorLabel: lead.sectorLabel,
        stage,
        origem,
        responsibleName: lead.responsibleName,
        estimatedMrrBrl: lead.estimatedMrrBrl,
        cnae: lead.cnae,
        regimeTributarioEstimado: lead.regimeTributarioEstimado,
        tesesAplicaveis: lead.tesesAplicaveis || [],
        scoreAderencia: lead.scoreAderencia,
        faixaCreditoEstimado: lead.faixaCreditoEstimado,
        autoDiagnosticoCompleto: lead.autoDiagnosticoCompleto ?? false,
        notes: lead.notes,
        partnerOfficeId: office1.id,
        assignedUserId: lead.assignedProfessionalId || 'prof_01',
      },
      create: {
        id: lead.id,
        name: lead.name,
        cnpj: lead.cnpj,
        sector: lead.sector,
        sectorLabel: lead.sectorLabel,
        stage,
        origem,
        responsibleName: lead.responsibleName,
        estimatedMrrBrl: lead.estimatedMrrBrl,
        cnae: lead.cnae,
        regimeTributarioEstimado: lead.regimeTributarioEstimado,
        tesesAplicaveis: lead.tesesAplicaveis || [],
        scoreAderencia: lead.scoreAderencia,
        faixaCreditoEstimado: lead.faixaCreditoEstimado,
        autoDiagnosticoCompleto: lead.autoDiagnosticoCompleto ?? false,
        notes: lead.notes,
        partnerOfficeId: office1.id,
        assignedUserId: lead.assignedProfessionalId || 'prof_01',
      },
    });
  }

  // 7. Seed Swarm Live Logs (Initial 6 autonomous worker executions)
  console.log('⚡ Seeding Swarm Live Logs...');
  const initialLiveLogs = [
    {
      id: 'log-fisc-01',
      agentName: 'AG-FISC-01 (Auditoria Exclusão ICMS PIS/COFINS)',
      actionTitle: 'Conciliação EFD Contribuições C100/C170 vs SPED Fiscal E110',
      resultSummary: 'Apuração e exclusão de ICMS da base do PIS/COFINS executada em D+0 para 1.420 notas fiscais de entrada.',
      rawFormattedLog: '[SWARM_ROUTER] Triggered event EVT-TAX-EXCLUSION-ICMS via Protheus webhook. 1.420 items parsed. Divergences: 0.',
      economyBrl: 18450.00,
      bleedPreventedBrl: 42000.00,
      severity: 'SUCCESS',
      status: 'CONFORME',
      targetEntity: 'EFD-Contribuições M210 / M610',
      erpEndpoint: '/api/v1/protheus/tax-credit-reconciliation',
      erpResponseCode: 200,
      requiresMultiSig: false,
      ledgerHash: '0x8f192b49c01824192bce94109823141094812349018241092834190823419082',
      hubId: 'hub-fiscal',
      agentId: 'agent-001',
      tenantId: 'tenant_nexus_01',
    },
    {
      id: 'log-fisc-02',
      agentName: 'AG-FISC-14 (Mitigação de Bitributação Monofásica)',
      actionTitle: 'Segregação de Itens Farmacêuticos e Autopeças Monofásicas',
      resultSummary: 'Identificação de recolhimento indevido em itens sujeitos à alíquota zero. Ajuste automático de CST emitido.',
      rawFormattedLog: '[SWARM_EXEC] NCMs 3004.90 e 8708.29 reconciliados. Alíquota zero aplicada.',
      economyBrl: 9240.00,
      bleedPreventedBrl: 18900.00,
      severity: 'SUCCESS',
      status: 'CONFORME',
      targetEntity: 'SPED Fiscal C170',
      erpEndpoint: '/api/v1/protheus/cst-correction',
      erpResponseCode: 200,
      requiresMultiSig: false,
      ledgerHash: '0x9928410298341092834109238410923841092834109238410923841092834109',
      hubId: 'hub-fiscal',
      agentId: 'agent-014',
      tenantId: 'tenant_nexus_01',
    },
    {
      id: 'log-supp-01',
      agentName: 'AG-SUPP-04 (Ruptura Preditiva de Estoque)',
      actionTitle: 'Replanejamento MRP II e Ponto de Resuprimento Automático',
      resultSummary: 'Lead time de insumos críticos reduzido em 36 horas. Evitada parada de linha de montagem com impacto de R$ 380k.',
      rawFormattedLog: '[SWARM_EXEC] Sensor IoT Silo #4 indicou consumo acelerado (+28%). Ordem de compra pré-aprovada gerada no SAP.',
      economyBrl: 45000.00,
      bleedPreventedBrl: 380000.00,
      severity: 'SUCCESS',
      status: 'CONFORME',
      targetEntity: 'Linha Fabril #3 - Matéria Prima A1',
      erpEndpoint: '/api/v2/sap/mrp-replenishment',
      erpResponseCode: 200,
      requiresMultiSig: true,
      ledgerHash: '0x1029384756102938475610293847561029384756102938475610293847561029',
      hubId: 'hub-supply',
      agentId: 'agent-044',
      tenantId: 'tenant_nexus_01',
    },
    {
      id: 'log-tres-01',
      agentName: 'AG-TRES-02 (Arbitragem de Tesouraria e Descasamento CDI)',
      actionTitle: 'Antecipação de Recebíveis com Taxa Bonificada vs CDI Over',
      resultSummary: 'Otimização de liquidez com aplicação de excedente de caixa D+0 em compromissada Selic 100,5%.',
      rawFormattedLog: '[SWARM_EXEC] Saldo de R$ 2.4M remanejado para conta escrow de rendimento remunerado automático.',
      economyBrl: 12800.00,
      bleedPreventedBrl: 24000.00,
      severity: 'SUCCESS',
      status: 'CONFORME',
      targetEntity: 'Conta Tesouraria Santander Corporativo',
      erpEndpoint: '/api/v1/banking/open-finance-sweep',
      erpResponseCode: 200,
      requiresMultiSig: false,
      ledgerHash: '0x4918230918230918230918230918230918230918230918230918230918230918',
      hubId: 'hub-treasury',
      agentId: 'agent-078',
      tenantId: 'tenant_nexus_01',
    },
    {
      id: 'log-cyber-01',
      agentName: 'AG-CYBER-09 (Detecção Anti-Fraude PIX / Spoofer)',
      actionTitle: 'Bloqueio de Tentativa de Retificação de Chave PIX Fornecedor',
      resultSummary: 'Discrepância de IP e ausência de certificado digital detectada em alteração cadastral. Conta colocada em quarentena preventiva.',
      rawFormattedLog: '[SECURITY_INTERCEPT] Man-in-the-browser pattern identified from untrusted IP 185.220.101.5. Payload intercepted.',
      economyBrl: 0.00,
      bleedPreventedBrl: 145000.00,
      severity: 'CRITICAL',
      status: 'CONFORME',
      targetEntity: 'Portal Fornecedor Protheus #00412',
      erpEndpoint: '/api/v1/security/quarantine-freeze',
      erpResponseCode: 403,
      requiresMultiSig: true,
      ledgerHash: '0x7719283401928340192834019283401928340192834019283401928340192834',
      hubId: 'hub-cyber-compliance',
      agentId: 'agent-165',
      tenantId: 'tenant_nexus_01',
    },
    {
      id: 'log-legal-01',
      agentName: 'AG-LEGAL-03 (Alerta Preclusivo de Prazos Fiscais)',
      actionTitle: 'Varredura Diária de Intimações Eletrônicas Domicílio Tributário (DTE)',
      resultSummary: 'Intimação SEFAZ identificada com 8 dias de antecedência. Minuta de defesa automática pré-redigida pelo LLM tributário.',
      rawFormattedLog: '[LEGAL_SCANNER] DTE-SP Termo de Verificação Fiscal #8912/26 capturado. Prazo fatal: 21 dias.',
      economyBrl: 8500.00,
      bleedPreventedBrl: 95000.00,
      severity: 'INFO',
      status: 'CONFORME',
      targetEntity: 'SEFAZ/SP - Domicílio Eletrônico Tributário',
      erpEndpoint: '/api/v1/legal/dte-sync',
      erpResponseCode: 200,
      requiresMultiSig: false,
      ledgerHash: '0x6618293401928340192834019283401928340192834019283401928340192834',
      hubId: 'hub-legal-regulatory',
      agentId: 'agent-198',
      tenantId: 'tenant_nexus_01',
    },
  ];

  for (const log of initialLiveLogs) {
    await prisma.swarmLiveLog.upsert({
      where: { id: log.id },
      update: log,
      create: log,
    });
  }

  // 8. Seed Audit Ledger Entries (Imutabilidade Criptográfica)
  console.log('⛓️ Seeding Cryptographic Audit Ledger Entries...');
  const initialAuditEntries = [
    {
      id: 'rec_genesis_0001',
      chainIndex: BigInt(1),
      tenantId: 'tenant_nexus_01',
      userId: 'usr_marcos_secops',
      eventId: 'evt_genesis_anchor',
      eventTitle: 'Âncora Gênesis do Livro-Razão AOS (Genesis Anchor)',
      sector: 'Manufatura & Automação Industrial',
      jurisdiction: 'BR_FEDERAL_SEFAZ',
      agentsInvolved: ['AOS Multi-Tenant Gateway', 'Proof of Intent Seed', 'Motor Fiscal BR'],
      decisionSummary: 'Gênesis do nó de governança criptográfica ativado para o cluster Nexus Indústria S/A. Isolamento RLS e invariantes fiscais habilitados.',
      status: LedgerStatus.EXECUTED,
      signatures: [
        { role: 'SecOps Lead', keyId: 'secp256k1::0xSECOPS...GENESIS', signedAt: new Date().toISOString(), verified: true }
      ],
      executionReceipt: 'TX-GENESIS-NEXUS-001',
      invariantSnapshot: ['Genesis_Integrity_Check = OK', 'Tenant_Data_Isolation_RLS = OK'],
      recordHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      previousRecordHash: GENESIS_HASH,
      requiredSignatures: 1,
    },
    {
      id: 'rec_tax_0002',
      chainIndex: BigInt(2),
      tenantId: 'tenant_nexus_01',
      userId: 'usr_marcelo_vasconcelos',
      eventId: 'evt_tax_calc_t69',
      eventTitle: 'Homologação Laudo Tema 69 STF - ICMS PIS/COFINS',
      sector: 'Indústria & Manufatura',
      jurisdiction: 'BR_RECEITA_FEDERAL',
      agentsInvolved: ['AG-FISC-01', 'ExpertTaxCalculationEngine', 'Zero-Trust Risk Agent'],
      decisionSummary: 'Laudo pericial de apuração de créditos do Tema 69 homologado com valor apurado de R$ 1.284.910,00 com trava quinquenal validada.',
      status: LedgerStatus.EXECUTED,
      signatures: [
        { role: 'Advogado Tributarista', keyId: 'secp256k1::0xMARCELO...OABSP', signedAt: new Date().toISOString(), verified: true },
        { role: 'CFO Brain', keyId: 'secp256k1::0xCFO...BRAIN', signedAt: new Date().toISOString(), verified: true }
      ],
      executionReceipt: 'TX-TAX-T69-2026-NEXUS',
      invariantSnapshot: ['Quinquennial_Cutoff_5Years = OK', 'ICMS_Destacado_Exclusion = OK', 'MultiSig_DualKey = OK'],
      recordHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
      previousRecordHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      requiredSignatures: 2,
    }
  ];

  for (const entry of initialAuditEntries) {
    await prisma.auditLedgerEntry.upsert({
      where: { id: entry.id },
      update: entry,
      create: entry,
    });
  }

  console.log('✅ VELATRIX AOS Database Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
