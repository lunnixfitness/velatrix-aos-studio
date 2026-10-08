import { StandardizedAuditReport, StandardizedReportType } from '../types/standardizedPipeline';
import { computeSha256Sync } from './expertTaxEngineService';
import { generateTaxRecoveryPayload } from './registry/definitions/taxRecoveryService';
import { validateAndComputeReportHash } from './reportEmissionGuardService';
import { 
  invalidateContaminatedReports, 
  RUN_LAUDO_INVALIDATION_MIGRATION_2026_09_21 
} from './centralAuditReports/invalidateContaminatedReports';
import { UnifiedTenantService } from './unifiedTenantService';

const STORAGE_KEY = 'vx_central_standardized_reports_v2';

export class CentralAuditReportService {
  private static reports: StandardizedAuditReport[] = [];
  private static listeners: Array<() => void> = [];
  private static isInitialized = false;

  private static initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    if (typeof window !== 'undefined') {
      UnifiedTenantService.subscribe(() => {
        this.notifyListeners();
      });
    }
    // P20: laudos persistidos vêm do IndexedDB (assíncrono); mescla quando chegar.
    // P29: depois, o registro central do servidor (laudos de todo o escritório) — IndexedDB vira cache.
    void Promise.resolve()
      .then(() => this.hydrateFromIndexedDB())
      .then(() => this.refreshFromServer());

    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.reports = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('[CentralAuditReportService] Falha ao carregar do localStorage:', e);
    }

    // Se estiver vazio ou sem o laudo de referência LDO-REC-2026-69189, inicializa/mescla com laudos base auditados
    const hasVanguardaReport = this.reports.some(r => r.reportId === 'LDO-REC-2026-69189');
    if (this.reports.length === 0 || !hasVanguardaReport) {
      const seedReports = this.generateSeedReports();
      if (this.reports.length === 0) {
        this.reports = seedReports;
      } else if (!hasVanguardaReport) {
        const vanguarda = seedReports.find(r => r.reportId === 'LDO-REC-2026-69189');
        if (vanguarda) this.reports.unshift(vanguarda);
      }
      this.persist();
    }

    // Migration de Invalidação de Laudos Contaminados (Bugfix P1)
    if (RUN_LAUDO_INVALIDATION_MIGRATION_2026_09_21) {
      const { updatedReports, invalidatedCount } = invalidateContaminatedReports(this.reports);
      // Se algum laudo foi invalidado e ainda não estava marcado como tal
      const needsPersist = updatedReports.some((rep, idx) => {
        return rep.status !== this.reports[idx]?.status || rep.auditHash !== this.reports[idx]?.auditHash;
      });
      if (needsPersist || invalidatedCount > 0) {
        this.reports = updatedReports;
        this.persist();
      }
    }
  }

  private static generateSeedReports(): StandardizedAuditReport[] {
    const now = new Date();
    const formatDate = (d: Date) => {
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const d1 = new Date(now.getTime() - 3600 * 1000 * 4);
    const d2 = new Date(now.getTime() - 3600 * 1000 * 24);
    const d3 = new Date(now.getTime() - 3600 * 1000 * 48);

    const report1: StandardizedAuditReport = {
      reportId: 'LDO-RISK-2026-88412',
      serviceId: 'risk_roi_diagnosis',
      serviceName: 'Diagnóstico & Proposta (Raio-X de Risco & ROI)',
      reportType: 'risk_roi',
      reportTypeLabel: 'Laudo de Risco & ROI',
      issuedAt: d1.toISOString(),
      issuedAtFormatted: formatDate(d1),
      tenantId: 'tenant_nortex_industrial',
      tenantName: 'Nortex Industrial Têxtil S.A.',
      tenantCnpj: '18.492.301/0001-88',
      lgpdCompliance: {
        isCompliant: true,
        dataProtectionOfficer: 'DPO Velatrix Privacy Office (privacidade@velatrix.com.br)',
        dataMaskingApplied: true,
        retentionPeriodDays: 1825, // 5 anos fiscais
        legalBasis: 'Art. 7º, II e IX da Lei 13.709/2018 (Obrigação Legal & Legítimo Interesse)',
        anonymizedFields: ['CPFs de Fornecedores', 'Chaves PIX Pessoais', 'Salários Individuais']
      },
      auditHash: computeSha256Sync('LDO-RISK-2026-88412-18492301000188-REAL-VERIFIED'),
      signer: {
        // P28: seed de demonstração — sem nome/registro de profissional real e sem ICP presumida.
        name: 'Responsável Técnico (demonstração)',
        role: 'Contador — exemplo fictício',
        credentialNumber: 'DEMO — sem registro profissional',
        signatureType: 'PENDENTE_ASSINATURA_ICP'
      },
      pipelineSnapshot: {
        verifiedRealSources: [
          'Extrato_Bancario_Consolidado_2025.ofx (exemplo fictício)',
          'Balancete_Analitico_DRE_2024_2025.xlsx (exemplo fictício)',
          'SPED_EFD_Contribuicoes_2025.txt (Chave Hash Validada)'
        ],
        executionTimeMs: 1420,
        dataSourceIntegrity: 'DEMONSTRACAO_SEM_VALIDADE'
      },
      riskRoiPayload: {
        overallZScore: 3.42,
        solvencyStatus: 'Z-Prime Excelente',
        annualRevenueReal: 42000000,
        monthlyRevenueReal: 3500000,
        ebitdaMarginReal: 14.8,
        calculatedRoiMultiplier: 5.2,
        identifiedSavingsBrl: 1840250,
        totalTaxCreditsBrl: 2485000,
        sourceDocuments: [
          'Extrato Bancário Bradesco/Itaú (OFX)',
          'Balancete DRE Analítico (XLSX)',
          'SPED Fiscal EFD ICMS/IPI'
        ],
        topVulnerabilities: [
          'Exclusão de ICMS da Base PIS/COFINS (Tema 69 STF) com cálculo subestimado no ERP',
          'Alíquota RAT/FAP majorada indevidamente na folha de pagamento fabril',
          'Bitributação de insumos essenciais de tecelagem (créditos glosados)'
        ],
        strategicRecommendations: [
          'Compensação administrativa via PER/DCOMP Web com validação A1 imediata',
          'Ajuste do multiplicador FAP perante a RFB para desoneração do FPAS',
          'Ativação do conector mTLS ERP para expurgo em tempo real de notas duplicadas'
        ]
      }
    };

    const report2: StandardizedAuditReport = {
      reportId: 'LDO-SEC-2026-10492',
      serviceId: 'cyberspy_edge',
      serviceName: 'AOS CyberSpy & ZeroVision Threat Intelligence',
      reportType: 'security_threat',
      reportTypeLabel: 'Laudo de Segurança / Ameaça',
      issuedAt: d2.toISOString(),
      issuedAtFormatted: formatDate(d2),
      tenantId: 'tenant_nortex_industrial',
      tenantName: 'Nortex Industrial Têxtil S.A.',
      tenantCnpj: '18.492.301/0001-88',
      lgpdCompliance: {
        isCompliant: true,
        dataProtectionOfficer: 'Security Incident Response Team (sirt@velatrix.com.br)',
        dataMaskingApplied: true,
        retentionPeriodDays: 365,
        legalBasis: 'Art. 7º, IX da Lei 13.709/2018 (Prevenção à Fraude e Segurança do Titular)',
        anonymizedFields: ['Credenciais Vazadas (SHA-256 Mascaradas)', 'IP de Origem da Rede Tor']
      },
      auditHash: computeSha256Sync('LDO-SEC-2026-10492-DARK-WEB-ACTIVE-BLOCK'),
      signer: {
        name: 'AOS ZeroVision Autonomous Guard',
        role: 'Motor de Resposta a Incidentes Criptográficos e Edge AI',
        credentialNumber: 'ENCLAVE-SECP256K1-NODE-01',
        signatureType: 'SECP256K1_ENCLAVE'
      },
      pipelineSnapshot: {
        verifiedRealSources: [
          'Dark Web Deep Crawl Onion Mirror #8821',
          'ERP Protheus Session Tokens Database',
          'ZeroVision Hardware Enclave Audit Ledger'
        ],
        executionTimeMs: 380,
        dataSourceIntegrity: 'ARQUIVOS_AUDITADOS'
      },
      securityThreatPayload: {
        threatId: 'CS-8891-DARKWEB',
        threatType: 'DARK_WEB_LEAK',
        threatTypeLabel: 'Vazamento de Credenciais em Fórum Cibernético',
        severity: 'CRITICAL',
        targetEntity: 'ERP Protheus Admin Token & Token mTLS A1',
        channelOrigin: 'Dark Web Tor Crawl (BreachForums Mirror #4)',
        status: 'ACTIVE_BLOCK',
        mitigationAction: 'Revogação imediata da chave de sessão, expurgo do par de chaves e bloqueio de IP via ZeroVision Active Block.',
        anomalySignature: 'SHA256: 0x9f88c3a1024b8109d73e9124a919010029318b76',
        rawPayloadSnippet: '{"dump_target": "nortex.com.br", "leaked_hashes": 14, "risk": "IMMEDIATE_TAKEOVER"}',
        resolutionNotes: 'Ameaça mitigada de forma 100% autônoma antes de qualquer acesso não autorizado ao ERP ou cofre bancário.'
      }
    };

    const report3: StandardizedAuditReport = {
      reportId: 'LDO-FISC-2026-30219',
      serviceId: 'legal_tax_recovery',
      serviceName: 'Defesa & Recuperação Fiscal PGFN / PER/DCOMP',
      reportType: 'fiscal_recovery',
      reportTypeLabel: 'Laudo Fiscal & Tributário',
      issuedAt: d3.toISOString(),
      issuedAtFormatted: formatDate(d3),
      tenantId: 'tenant_nortex_industrial',
      tenantName: 'Nortex Industrial Têxtil S.A.',
      tenantCnpj: '18.492.301/0001-88',
      lgpdCompliance: {
        isCompliant: true,
        dataProtectionOfficer: 'Tax Compliance Office (tributario@velatrix.com.br)',
        dataMaskingApplied: true,
        retentionPeriodDays: 1825,
        legalBasis: 'Art. 7º, II da Lei 13.709/2018 (Cumprimento de Obrigação Legal Tributária)',
        anonymizedFields: ['Identificadores Pessoais de DARF']
      },
      auditHash: computeSha256Sync('LDO-FISC-2026-30219-PERDCOMP-HOMOLOGADO'),
      signer: {
        name: 'Responsável Técnico (demonstração)',
        role: 'Advogada tributarista — exemplo fictício',
        credentialNumber: 'DEMO — sem registro profissional',
        signatureType: 'PENDENTE_ASSINATURA_ICP'
      },
      pipelineSnapshot: {
        verifiedRealSources: [
          'PER/DCOMP — protocolo de exemplo (fictício)',
          'Certidão Negativa de Débitos PGFN/RFB Webhook',
          'Extrato de Compensação D-0 Integrado'
        ],
        executionTimeMs: 2100,
        dataSourceIntegrity: 'DEMONSTRACAO_SEM_VALIDADE'
      },
      fiscalRecoveryPayload: {
        totalCreditsIdentifiedBrl: 1840250,
        monitoredCompetencesCount: 60,
        primaryTheses: [
          'Exclusão do ICMS da Base de Cálculo do PIS/COFINS (Tema 69)',
          'Não incidência de contribuição previdenciária sobre terço de férias',
          'Exclusão do DIFAL e PIS/COFINS sobre energia elétrica (TUSD/TUST)'
        ],
        darfCompensationsBrl: 890400,
        pgfnCapagRating: 'CAPAG B+ (Apto à Transação Tributária)',
        receiptPerDcomp: 'REC-RFB-2026-881290310'
      },
      sectionsPayload: generateTaxRecoveryPayload({
        monthsCount: 60,
        tenantCnpj: '18.492.301/0001-88',
        tenantName: 'Nortex Industrial Têxtil S.A.'
      })
    };

    // Laudo de Referência P0: LDO-REC-2026-69189 (Recuperação Tributária, Grupo Vanguarda)
    const vanguardaSections = generateTaxRecoveryPayload({
      monthsCount: 60,
      tenantCnpj: '03.847.192/0001-44',
      tenantName: 'Grupo Vanguarda Agroindustrial S.A.'
    });

    const reportVanguardaInput = {
      reportId: 'LDO-REC-2026-69189',
      serviceId: 'tax_recovery',
      serviceName: 'Recuperação Tributária Federal & Estadual',
      reportType: 'fiscal_recovery' as StandardizedReportType,
      reportTypeLabel: 'Laudo Pericial de Recuperação Tributária',
      issuedAt: d3.toISOString(),
      issuedAtFormatted: formatDate(d3),
      tenantId: 'tenant_vanguarda_agro',
      tenantName: 'Grupo Vanguarda Agroindustrial S.A.',
      tenantCnpj: '03.847.192/0001-44',
      lgpdCompliance: {
        isCompliant: true,
        dataProtectionOfficer: 'DPO Velatrix Trust & Security Enclave',
        dataMaskingApplied: true,
        retentionPeriodDays: 1825,
        legalBasis: 'Código Tributário Nacional (Lei 5.172/1966); LC 118/2005; IN RFB 2.055/2021',
        anonymizedFields: ['Dados bancários parciais', 'Hash de procuração']
      },
      signer: {
        name: 'Responsável Técnico (demonstração)',
        role: 'Perito contábil — exemplo fictício',
        credentialNumber: 'DEMO — sem registro profissional',
        signatureType: 'PENDENTE_ASSINATURA_ICP' as const
      },
      pipelineSnapshot: {
        verifiedRealSources: [
          'SPED EFD-Contribuições (exemplo fictício)',
          'Extrato PGDAS-D Oficial RFB',
          'Declarações DCTFWeb e Guias DARF Quinquenais'
        ],
        executionTimeMs: 1840,
        dataSourceIntegrity: 'DEMONSTRACAO_SEM_VALIDADE' as const
      },
      sectionsPayload: vanguardaSections
    };

    const vanguardaHash = validateAndComputeReportHash(reportVanguardaInput);

    const reportVanguarda: StandardizedAuditReport = {
      ...reportVanguardaInput,
      auditHash: vanguardaHash
    };

    return [reportVanguarda, report1, report2, report3];
  }

  public static generateSeedReportsForTenant(tenant: { id: string; name: string; cnpj: string }): StandardizedAuditReport[] {
    const now = new Date();
    const formatDate = (d: Date) => {
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const d1 = new Date(now.getTime() - 3600 * 1000 * 4);
    const d3 = new Date(now.getTime() - 3600 * 1000 * 48);
    const shortId = tenant.id.replace(/^tenant_/, '').slice(0, 8).toUpperCase();

    const sections = generateTaxRecoveryPayload({
      monthsCount: 60,
      tenantCnpj: tenant.cnpj,
      tenantName: tenant.name,
    });

    const reportTaxInput = {
      reportId: `LDO-REC-${shortId}-${now.getFullYear()}-101`,
      serviceId: 'tax_recovery',
      serviceName: 'Recuperação Tributária Federal & Estadual',
      reportType: 'fiscal_recovery' as StandardizedReportType,
      reportTypeLabel: 'Laudo Pericial de Recuperação Tributária',
      issuedAt: d3.toISOString(),
      issuedAtFormatted: formatDate(d3),
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantCnpj: tenant.cnpj,
      lgpdCompliance: {
        isCompliant: true,
        dataProtectionOfficer: 'DPO Velatrix Trust & Security Enclave',
        dataMaskingApplied: true,
        retentionPeriodDays: 1825,
        legalBasis: 'Código Tributário Nacional (Lei 5.172/1966); LC 118/2005; IN RFB 2.055/2021',
        anonymizedFields: ['Dados bancários parciais', 'Hash de procuração']
      },
      signer: {
        name: 'Responsável Técnico (demonstração)',
        role: 'Perito contábil — exemplo fictício',
        credentialNumber: 'DEMO — sem registro profissional',
        signatureType: 'PENDENTE_ASSINATURA_ICP' as const
      },
      pipelineSnapshot: {
        verifiedRealSources: [
          'SPED EFD-Contribuições (exemplo fictício)',
          'Extrato PGDAS-D Oficial RFB',
          'Declarações DCTFWeb e Guias DARF Quinquenais'
        ],
        executionTimeMs: 1840,
        dataSourceIntegrity: 'DEMONSTRACAO_SEM_VALIDADE' as const
      },
      sectionsPayload: sections
    };

    const taxHash = validateAndComputeReportHash(reportTaxInput);
    const reportTax: StandardizedAuditReport = {
      ...reportTaxInput,
      auditHash: taxHash
    };

    const reportRisk: StandardizedAuditReport = {
      reportId: `LDO-RISK-${shortId}-${now.getFullYear()}-202`,
      serviceId: 'risk_roi_diagnosis',
      serviceName: 'Diagnóstico & Proposta (Raio-X de Risco & ROI)',
      reportType: 'risk_roi',
      reportTypeLabel: 'Laudo de Risco & ROI',
      issuedAt: d1.toISOString(),
      issuedAtFormatted: formatDate(d1),
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantCnpj: tenant.cnpj,
      lgpdCompliance: {
        isCompliant: true,
        dataProtectionOfficer: 'DPO Velatrix Privacy Office (privacidade@velatrix.com.br)',
        dataMaskingApplied: true,
        retentionPeriodDays: 1825,
        legalBasis: 'Art. 7º, II e IX da Lei 13.709/2018 (Obrigação Legal & Legítimo Interesse)',
        anonymizedFields: ['CPFs de Fornecedores', 'Chaves PIX Pessoais', 'Salários Individuais']
      },
      auditHash: computeSha256Sync(`LDO-RISK-${shortId}-${tenant.cnpj}-REAL-VERIFIED`),
      signer: {
        name: 'Responsável Técnico (demonstração)',
        role: 'Contador — exemplo fictício',
        credentialNumber: 'DEMO — sem registro profissional',
        signatureType: 'PENDENTE_ASSINATURA_ICP'
      },
      pipelineSnapshot: {
        verifiedRealSources: [
          'Extrato_Bancario_Consolidado_2025.ofx (exemplo fictício)',
          'Balancete_Analitico_DRE_2024_2025.xlsx (exemplo fictício)',
          'SPED_EFD_Contribuicoes_2025.txt (Chave Hash Validada)'
        ],
        executionTimeMs: 1420,
        dataSourceIntegrity: 'DEMONSTRACAO_SEM_VALIDADE'
      },
      riskRoiPayload: {
        overallZScore: 2.85,
        solvencyStatus: 'Z-Prime Excelente',
        annualRevenueReal: 25200000,
        monthlyRevenueReal: 2100000,
        ebitdaMarginReal: 15.2,
        calculatedRoiMultiplier: 4.9,
        identifiedSavingsBrl: 490000,
        totalTaxCreditsBrl: 980000,
        sourceDocuments: [
          'Extrato Bancário Integrado (OFX)',
          'Balancete DRE Analítico (XLSX)',
          'SPED Fiscal EFD'
        ],
        topVulnerabilities: [
          'Exclusão de ICMS da Base PIS/COFINS (Tema 69 STF) com cálculo subestimado no ERP',
          'Alíquota RAT/FAP majorada indevidamente na folha de pagamento fabril'
        ],
        strategicRecommendations: [
          'Compensação administrativa via PER/DCOMP Web com validação A1 imediata',
          'Ajuste do multiplicador FAP perante a RFB para desoneração do FPAS'
        ]
      }
    };

    return [reportTax, reportRisk];
  }

  // ───────── Persistência (P20): IndexedDB em vez de localStorage ─────────
  // localStorage tem ~5 MB por origem e os laudos (60 competências + seções) estouravam a cota
  // em silêncio. IndexedDB guarda o array por structured clone, sem JSON.stringify e com cota
  // de centenas de MB. A chave legada do localStorage só é LIDA (migração) e apagada após
  // a primeira gravação bem-sucedida no IndexedDB.
  private static readonly IDB_NAME = 'velatrix_aos';
  private static readonly IDB_STORE = 'kv';
  private static persistTimer: ReturnType<typeof setTimeout> | null = null;
  private static sessionUpserts = new Set<string>();
  private static sessionDeletes = new Set<string>();
  private static idbDisabled = false;
  /** Nada é gravado antes de ler o IndexedDB — senão o seed da memória sobrescreveria os laudos salvos. */
  private static hydrated = false;

  private static openIdb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB indisponível')); return; }
      const req = indexedDB.open(this.IDB_NAME, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(this.IDB_STORE)) req.result.createObjectStore(this.IDB_STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('falha ao abrir IndexedDB'));
    });
  }

  private static async idbGet<T>(key: string): Promise<T | undefined> {
    const db = await this.openIdb();
    try {
      return await new Promise<T | undefined>((resolve, reject) => {
        const r = db.transaction(this.IDB_STORE, 'readonly').objectStore(this.IDB_STORE).get(key);
        r.onsuccess = () => resolve(r.result as T | undefined);
        r.onerror = () => reject(r.error);
      });
    } finally { db.close(); }
  }

  private static async idbPut(key: string, value: unknown): Promise<void> {
    const db = await this.openIdb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(this.IDB_STORE, 'readwrite');
        tx.objectStore(this.IDB_STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('transação abortada'));
      });
    } finally { db.close(); }
  }

  /** Carrega o que está no IndexedDB e mescla com o estado em memória (alterações desta sessão vencem). */
  private static async hydrateFromIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return;
    let stored: StandardizedAuditReport[] | undefined;
    try {
      stored = await this.idbGet<StandardizedAuditReport[]>(STORAGE_KEY);
    } catch (e) {
      this.idbDisabled = true;
      this.hydrated = true;
      console.warn('[CentralAuditReportService] IndexedDB indisponível; laudos ficam só nesta sessão:', e);
      return;
    }
    this.hydrated = true;
    if (!Array.isArray(stored) || stored.length === 0) { this.persist(); return; } // primeira execução: grava o estado atual
    const byId = new Map(stored.map((r) => [r.reportId, r]));
    for (const r of this.reports) {
      if (this.sessionUpserts.has(r.reportId) || !byId.has(r.reportId)) byId.set(r.reportId, r); // novos nesta sessão + seeds ausentes
    }
    for (const id of this.sessionDeletes) byId.delete(id);
    this.reports = [...byId.values()];
    if (RUN_LAUDO_INVALIDATION_MIGRATION_2026_09_21) this.reports = invalidateContaminatedReports(this.reports).updatedReports;
    this.persist();
    this.notifyListeners();
  }

  private static persist(): void {
    if (typeof window === 'undefined') return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => { void this.flush(); }, 200);
  }

  private static async flush(): Promise<void> {
    this.persistTimer = null;
    if (this.idbDisabled || !this.hydrated) return; // hydrate chama persist() de novo ao terminar
    try {
      await this.idbPut(STORAGE_KEY, this.reports);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* sem localStorage */ }
    } catch (e) {
      console.warn('[CentralAuditReportService] Erro ao persistir laudos no IndexedDB:', e);
    }
  }

  private static notifyListeners(): void {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error(e); }
    });
  }

  public static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public static getAllReports(tenantId?: string): StandardizedAuditReport[] {
    this.initialize();
    const effectiveTenantId = tenantId !== undefined
      ? tenantId
      : (typeof window !== 'undefined' ? UnifiedTenantService.getActiveTenant()?.id : undefined);

    if (effectiveTenantId && effectiveTenantId !== 'ALL') {
      const hasTenantReports = this.reports.some(r => r.tenantId === effectiveTenantId);
      if (!hasTenantReports) {
        const activeT = UnifiedTenantService.getActiveTenant();
        if (activeT && activeT.id === effectiveTenantId) {
          const seeds = this.generateSeedReportsForTenant(activeT);
          this.reports.push(...seeds);
          this.persist();
        }
      }
      return this.reports
        .filter(r => r.tenantId === effectiveTenantId)
        .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
    }

    return [...this.reports].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  public static getReportById(reportId: string, tenantId?: string): StandardizedAuditReport | undefined {
    this.initialize();
    const effectiveTenantId = tenantId !== undefined
      ? tenantId
      : (typeof window !== 'undefined' ? UnifiedTenantService.getActiveTenant()?.id : undefined);
    const report = this.reports.find(r => r.reportId === reportId);
    if (!report) return undefined;
    if (effectiveTenantId && effectiveTenantId !== 'ALL' && report.tenantId && report.tenantId !== effectiveTenantId) {
      return undefined;
    }
    return report;
  }

  public static registerReport(report: StandardizedAuditReport): StandardizedAuditReport {
    this.initialize();
    this.sessionUpserts.add(report.reportId);
    this.sessionDeletes.delete(report.reportId);
    // Substitui se já existir, senão adiciona no topo
    const index = this.reports.findIndex(r => r.reportId === report.reportId);
    if (index >= 0) {
      this.reports[index] = report;
    } else {
      this.reports.unshift(report);
    }
    this.persist();
    this.notifyListeners();
    return report;
  }

  public static saveReport(report: StandardizedAuditReport): StandardizedAuditReport {
    const saved = this.registerReport(report);
    void this.enviarAoServidor(saved);
    return saved;
  }

  // ───────── P29 · Registro central (servidor) ─────────

  /** reportId → estado de sincronização com o registro central (para a UI mostrar "pendente"). */
  private static syncStatus = new Map<string, 'sincronizado' | 'pendente' | string>();

  public static getSyncStatus(reportId: string): string | undefined {
    return this.syncStatus.get(reportId);
  }

  /** Envia o laudo ao servidor, que recalcula o hash e o torna visível para o escritório. */
  private static async enviarAoServidor(report: StandardizedAuditReport): Promise<void> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    this.syncStatus.set(report.reportId, 'pendente');
    try {
      const res = await fetch('/api/enterprise/laudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });
      if (res.ok || res.status === 409) {
        this.syncStatus.set(report.reportId, 'sincronizado');
      } else {
        const body = await res.json().catch(() => ({}));
        this.syncStatus.set(report.reportId, `erro: ${(body as { error?: string }).error || res.status}`);
        console.warn('[CentralAuditReportService] servidor recusou o laudo', report.reportId, body);
      }
    } catch (e) {
      // Offline/servidor fora: fica 'pendente' e é reenviado no próximo refreshFromServer().
      console.warn('[CentralAuditReportService] laudo não sincronizado (tentará de novo):', report.reportId, e);
    }
    this.notifyListeners();
  }

  /** Busca os laudos do escritório (paginado) e mescla; reenvia os que ficaram pendentes. */
  public static async refreshFromServer(maxPaginas = 5): Promise<void> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    try {
      const byId = new Map(this.reports.map((r) => [r.reportId, r]));
      let antes: string | null = null;
      for (let i = 0; i < maxPaginas; i++) {
        const qs = new URLSearchParams({ limit: '200' });
        if (antes) qs.set('antes', antes);
        const res = await fetch(`/api/enterprise/laudos?${qs.toString()}`);
        if (!res.ok) return; // sem sessão/servidor: segue com o cache local
        const pagina = (await res.json()) as { itens: { report: StandardizedAuditReport }[]; proximo: string | null };
        for (const it of pagina.itens) {
          byId.set(it.report.reportId, it.report); // servidor é a fonte de verdade
          this.syncStatus.set(it.report.reportId, 'sincronizado');
        }
        antes = pagina.proximo;
        if (!antes) break;
      }
      this.reports = [...byId.values()];
      this.persist();
      this.notifyListeners();
      for (const [id, st] of this.syncStatus) {
        if (st === 'pendente') {
          const r = this.reports.find((x) => x.reportId === id);
          if (r) void this.enviarAoServidor(r);
        }
      }
    } catch (e) {
      console.warn('[CentralAuditReportService] registro central indisponível; usando cache local:', e);
    }
  }

  public static deleteReport(reportId: string): boolean {
    this.initialize();
    this.sessionDeletes.add(reportId);
    this.sessionUpserts.delete(reportId);
    const initialLen = this.reports.length;
    this.reports = this.reports.filter(r => r.reportId !== reportId);
    if (this.reports.length !== initialLen) {
      this.persist();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public static filterReports(filters: {
    reportType?: StandardizedReportType | 'ALL';
    tenantCnpj?: string;
    searchQuery?: string;
  }): StandardizedAuditReport[] {
    let list = this.getAllReports();

    if (filters.reportType && filters.reportType !== 'ALL') {
      list = list.filter(r => r.reportType === filters.reportType);
    }

    if (filters.tenantCnpj && filters.tenantCnpj.trim() !== '') {
      const cleanFilter = filters.tenantCnpj.replace(/\D/g, '');
      list = list.filter(r => r.tenantCnpj.replace(/\D/g, '').includes(cleanFilter));
    }

    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(r => 
        r.reportId.toLowerCase().includes(q) ||
        r.tenantName.toLowerCase().includes(q) ||
        r.serviceName.toLowerCase().includes(q) ||
        r.auditHash.toLowerCase().includes(q)
      );
    }

    return list;
  }
}
