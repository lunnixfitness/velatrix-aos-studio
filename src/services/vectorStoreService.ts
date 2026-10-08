import { VectorDocumentPayload, VectorDocumentCategory } from '../types/aos';

export const INITIAL_VECTOR_STORE: VectorDocumentPayload[] = [
  {
    vector_id: 'vec_doc_001',
    text: 'Instrução Normativa RFB nº 2.121/2023 & Lei 10.833/2003: Permissão de creditamento integral de PIS (1,65%) e COFINS (7,60%) sobre insumos essenciais de produção e serviços de frete na aquisição interestadual. Não se aplica a mercadorias destinadas à revenda sob regime monofásico.',
    metadata: {
      tenant_id: 'global',
      category: 'tax_law',
      updated_at: '2026-08-15T08:30:00Z',
      entity_id: 'RFB_IN_2121_2023',
      title: 'Créditos PIS/COFINS sobre Insumos & Fretes',
      tags: ['tributário', 'pis', 'cofins', 'insumos', 'crédito_fiscal']
    },
    tokens_count: 58,
    status: 'active'
  },
  {
    vector_id: 'vec_doc_002',
    text: 'Política Corporativa de Compras e Fornecedores Tier-1: Todo pedido de compra emergencial superior a R$ 50.000,00 ou equivalente a 15% do custo da BOM exige quórum de aprovação Multi-Sig Secp256k1 (CEO + CFO + Gerente de Suprimentos). Fornecedores com certidão fiscal vencida na SEFAZ são automaticamente bloqueados para emissão de PO.',
    metadata: {
      tenant_id: 'global',
      category: 'supplier_policy',
      updated_at: '2026-08-16T11:45:00Z',
      entity_id: 'POL_COMPRAS_TIER1_2026',
      title: 'Governança de Compras & Quórum Multi-Sig',
      tags: ['compras', 'fornecedores', 'multi-sig', 'limite_alçada', 'sefaz']
    },
    tokens_count: 72,
    status: 'active'
  },
  {
    vector_id: 'vec_doc_003',
    text: 'Protocolo de Autonomia Zero-GUI e Despacho Tático: O Enxame de Agentes VELATRIX tem autorização prévia para despachar decisões táticas autônomas até o teto orçamentário de R$ 25.000,00 sem requisição de assinatura biométrica, desde que a invariante Saldo_Caixa_Minimo >= R$ 2.0M e SLA >= 98.0% permaneçam comprovadamente intactos.',
    metadata: {
      tenant_id: 'global',
      category: 'zero_gui_approval',
      updated_at: '2026-08-17T09:15:00Z',
      entity_id: 'ZERO_GUI_SLA_POLICY_48',
      title: 'Teto de Autonomia Zero-GUI & Invariantes',
      tags: ['zero-gui', 'autonomia', 'invariantes', 'teto_orçamentário', 'sla']
    },
    tokens_count: 68,
    status: 'active'
  },
  {
    vector_id: 'vec_doc_004',
    text: 'Procedimento Operacional Padrão (POP-IND-042 - Resiliência de Suprimentos): Em caso de greve portuária, embargo aduaneiro ou ruptura de fornecimento de microchips/semicondutores, acionar imediatamente fornecedores secundários homologados em raio de até 500km com modal rodoviário expresso, amortizando frete spot em até +8% do custo padrão.',
    metadata: {
      tenant_id: 'global',
      category: 'SOP',
      updated_at: '2026-08-17T14:20:00Z',
      entity_id: 'POP_IND_042_SUPPLY_CHAIN',
      title: 'POP-042: Ruptura de Suprimentos & Frete Spot',
      tags: ['sop', 'supply_chain', 'ruptura', 'modal_expresso', 'contingência']
    },
    tokens_count: 65,
    status: 'active'
  },
  {
    vector_id: 'vec_doc_005',
    text: 'Emenda Constitucional 132/2023 - Reforma Tributária sobre o Consumo: Implementação do Imposto sobre Bens e Serviços (IBS - estadual/municipal) e Contribuição sobre Bens e Serviços (CBS - federal). Previsão de split payment na liquidação financeira de duplicatas eletrônicas e cashback para baixa renda.',
    metadata: {
      tenant_id: 'global',
      category: 'tax_law',
      updated_at: '2026-08-18T07:00:00Z',
      entity_id: 'EC_132_2023_REFORMA_TRIB',
      title: 'Reforma Tributária IBS/CBS & Split Payment',
      tags: ['reforma_tributária', 'ibs', 'cbs', 'split_payment', 'ec132']
    },
    tokens_count: 59,
    status: 'active'
  }
];

const LOCAL_STORAGE_KEY = 'velatrix_vector_store_v1';

export class VectorStoreService {
  private static store: VectorDocumentPayload[] = [];
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        this.store = JSON.parse(saved);
      } else {
        this.store = [...INITIAL_VECTOR_STORE];
        this.persist();
      }
    } catch {
      this.store = [...INITIAL_VECTOR_STORE];
    }
    this.initialized = true;
  }

  private static persist(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.store));
    } catch (e) {
      console.warn('Failed to persist vector store locally:', e);
    }
  }

  public static getAll(): VectorDocumentPayload[] {
    this.initialize();
    return [...this.store];
  }

  public static getByTenant(tenantId: string): VectorDocumentPayload[] {
    this.initialize();
    return this.store.filter(
      doc => doc.metadata.tenant_id === tenantId || doc.metadata.tenant_id === 'global'
    );
  }

  public static getByCategory(category: VectorDocumentCategory): VectorDocumentPayload[] {
    this.initialize();
    return this.store.filter(doc => doc.metadata.category === category);
  }

  public static ingest(payload: {
    vector_id?: string;
    text: string;
    metadata: {
      tenant_id?: string;
      category: 'tax_law' | 'supplier_policy' | 'zero_gui_approval' | 'SOP' | string;
      updated_at?: string;
      entity_id?: string;
      tags?: string[];
      title?: string;
    };
  }): { success: boolean; document: VectorDocumentPayload; error?: string } {
    this.initialize();

    if (!payload.text || !payload.text.trim()) {
      return { success: false, document: null as any, error: 'O campo "text" é obrigatório.' };
    }

    const vector_id = payload.vector_id || `vec_doc_${String(this.store.length + 1).padStart(3, '0')}`;
    const updated_at = payload.metadata?.updated_at || new Date().toISOString();
    const tenant_id = payload.metadata?.tenant_id || 'global';
    const category = payload.metadata?.category || 'SOP';
    const tokens_count = Math.round(payload.text.split(/\s+/).length * 1.3);

    const newDoc: VectorDocumentPayload = {
      vector_id,
      text: payload.text.trim(),
      metadata: {
        tenant_id,
        category,
        updated_at,
        entity_id: payload.metadata?.entity_id || `ENT_${Date.now()}`,
        tags: payload.metadata?.tags || [category.toLowerCase()],
        title: payload.metadata?.title || `Documento Vetorial ${vector_id}`
      },
      tokens_count,
      status: 'active'
    };

    // Replace if exists, or append
    const existingIndex = this.store.findIndex(d => d.vector_id === vector_id);
    if (existingIndex >= 0) {
      this.store[existingIndex] = newDoc;
    } else {
      this.store.unshift(newDoc);
    }

    this.persist();
    return { success: true, document: newDoc };
  }

  // Index Audit Ledger & Office Events into RAG semantic bus automatically
  public static ingestAuditEvent(event: {
    id: string;
    timestamp: string;
    employeeName?: string;
    employeeRole?: string;
    actionType?: string;
    actionSummary?: string;
    details: string;
    tenantId?: string;
  }): { success: boolean; document: VectorDocumentPayload } {
    this.initialize();

    const title = event.actionSummary || `Evento de Auditoria ${event.actionType || 'SISTEMA'}`;
    const textContent = `[REGISTRO DE AUDITORIA VELATRIX] Timestamp: ${event.timestamp} | Operador: ${event.employeeName || 'Meta-Agente AOS'} (${event.employeeRole || 'Sistema'}) | Ação: ${event.actionType || 'EXEC_LEDGER'} | Resumo: ${event.actionSummary || ''} | Detalhes: ${event.details}`;

    return this.ingest({
      vector_id: `vec_audit_${event.id.replace(/[^a-zA-Z0-9_]/g, '_')}`,
      text: textContent,
      metadata: {
        tenant_id: event.tenantId || 'global',
        category: 'zero_gui_approval',
        updated_at: new Date().toISOString(),
        entity_id: event.id,
        title: `[Auditoria] ${title}`,
        tags: ['auditoria', 'ledger', event.actionType?.toLowerCase() || 'operacao', 'historico']
      }
    });
  }

  public static delete(vector_id: string): boolean {
    this.initialize();
    const initialLen = this.store.length;
    this.store = this.store.filter(d => d.vector_id !== vector_id);
    if (this.store.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public static resetToDefaults(): VectorDocumentPayload[] {
    this.store = [...INITIAL_VECTOR_STORE];
    this.persist();
    return [...this.store];
  }

  // Semantic similarity scoring algorithm (Term Overlap, Keyword Expansion & Jaccard Cosine approximation)
  public static search(query: string, options?: {
    tenant_id?: string;
    category?: string;
    minScore?: number;
    limit?: number;
  }): { document: VectorDocumentPayload; score: number }[] {
    this.initialize();
    if (!query || !query.trim()) {
      return this.store.map(doc => ({ document: doc, score: 1.0 }));
    }

    const queryTokens = this.tokenize(query.toLowerCase());
    const tenant = options?.tenant_id || 'global';
    const limit = options?.limit || 5;
    const minScore = options?.minScore || 0.05;

    const scored = this.store
      .filter(doc => {
        if (tenant !== 'global' && doc.metadata.tenant_id !== tenant && doc.metadata.tenant_id !== 'global') {
          return false;
        }
        if (options?.category && options.category !== 'all' && doc.metadata.category !== options.category) {
          return false;
        }
        return true;
      })
      .map(doc => {
        const docText = `${doc.text} ${doc.metadata.title || ''} ${doc.metadata.tags?.join(' ') || ''} ${doc.metadata.category} ${doc.metadata.entity_id || ''}`.toLowerCase();
        const docTokens = this.tokenize(docText);

        // Token intersection & weight calculations
        let matches = 0;
        queryTokens.forEach(t => {
          if (docTokens.has(t)) matches += 2.0;
          else {
            // Substring partial match
            for (const dt of docTokens) {
              if (dt.includes(t) || t.includes(dt)) {
                matches += 0.8;
                break;
              }
            }
          }
        });

        // Similarity calculation
        const baseScore = queryTokens.size > 0 ? matches / (queryTokens.size + Math.sqrt(docTokens.size)) : 0;
        const normalizedScore = Math.min(0.99, Math.max(0.01, baseScore));

        return {
          document: {
            ...doc,
            metadata: {
              ...doc.metadata,
              similarity_score: Math.round(normalizedScore * 100) / 100
            }
          },
          score: normalizedScore
        };
      })
      .filter(res => res.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  private static tokenize(text: string): Set<string> {
    const clean = text
      .toLowerCase()
      .replace(/[^\w\sà-ú]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    return new Set(clean);
  }
}
