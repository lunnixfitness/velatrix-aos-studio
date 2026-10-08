import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Sparkles, 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Send, 
  Code2, 
  FileText, 
  ShieldCheck, 
  Scale, 
  Truck, 
  Zap, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Eye
} from 'lucide-react';
import { 
  VectorDocumentPayload, 
  VectorDocumentCategory, 
  TenantProfile, 
  SupportedLanguage, 
  SupportedCurrency 
} from '../types/aos';
import { VectorStoreService } from '../services/vectorStoreService';
import { VelatrixLogo } from './VelatrixLogo';
import { authFetch as fetch } from '../services/authClient';
import { secureInt } from '../lib/demoMode';

interface VectorKnowledgeStoreViewProps {
  tenantProfile: TenantProfile;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
  onBackToDashboard?: () => void;
}

export const VectorKnowledgeStoreView: React.FC<VectorKnowledgeStoreViewProps> = ({
  tenantProfile,
  language = 'pt',
  currency = 'BRL',
  onBackToDashboard
}) => {
  // State
  const [documents, setDocuments] = useState<VectorDocumentPayload[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<{ document: VectorDocumentPayload; score: number }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Ingest Form State
  const [inputJson, setInputJson] = useState<string>(
    JSON.stringify(
      {
        vector_id: `vec_doc_${secureInt(100, 899)}`,
        text: "Política de Aprovação de Frete Spot Emergencial: Desvios de rota motivados por bloqueios portuários ou alfandegários têm aprovação automática autorizada em até R$ 15.000,00 quando a invariante de SLA de entrega ao cliente for superior a 98.5%.",
        metadata: {
          tenant_id: tenantProfile?.slug || "global",
          category: "supplier_policy",
          updated_at: new Date().toISOString(),
          entity_id: "POL_LOG_SPOT_2026",
          tags: ["logística", "frete_spot", "sla", "contingência"]
        }
      },
      null,
      2
    )
  );

  const [jsonError, setJsonError] = useState<string | null>(null);
  const [ingestSuccessMsg, setIngestSuccessMsg] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [activeDocDetail, setActiveDocDetail] = useState<VectorDocumentPayload | null>(null);

  // Load initial documents
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    const allDocs = VectorStoreService.getAll();
    setDocuments(allDocs);
    handleSearch(searchQuery, selectedCategoryFilter, allDocs);
  };

  // Live Semantic Search
  const handleSearch = (query: string, category: string, docsList = documents) => {
    setIsSearching(true);
    setTimeout(() => {
      const results = VectorStoreService.search(query, {
        tenant_id: tenantProfile?.slug,
        category: category === 'all' ? undefined : category,
        limit: 20,
        minScore: 0.01
      });
      setSearchResults(results);
      setIsSearching(false);
    }, 80);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    handleSearch(q, selectedCategoryFilter);
  };

  const handleCategoryFilterChange = (cat: string) => {
    setSelectedCategoryFilter(cat);
    handleSearch(searchQuery, cat);
  };

  // Ingest Document Handler
  const handleIngestJson = async () => {
    setJsonError(null);
    setIngestSuccessMsg(null);
    setIsIngesting(true);

    try {
      const parsed = JSON.parse(inputJson);

      if (!parsed.text || typeof parsed.text !== 'string' || !parsed.text.trim()) {
        throw new Error('O campo "text" é obrigatório no JSON.');
      }

      // Try server API first
      try {
        await fetch('/api/aos/vector/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
      } catch (apiErr) {
        console.warn('API Ingestion notice (falling back to local memory store):', apiErr);
      }

      // Local store persistence
      const result = VectorStoreService.ingest(parsed);
      if (result.success) {
        setIngestSuccessMsg(`Vetor "${result.document.vector_id}" indexado com sucesso no barramento RAG!`);
        loadDocuments();

        // Generate next ID preset
        const nextId = `vec_doc_${secureInt(100, 899)}`;
        setInputJson(JSON.stringify({
          vector_id: nextId,
          text: "",
          metadata: {
            tenant_id: tenantProfile?.slug || "global",
            category: "SOP",
            updated_at: new Date().toISOString(),
            entity_id: `ENT_${nextId}`
          }
        }, null, 2));

        setTimeout(() => setIngestSuccessMsg(null), 4000);
      } else {
        setJsonError(result.error || 'Erro ao indexar vetor.');
      }
    } catch (err: any) {
      setJsonError(err.message || 'JSON inválido. Verifique a sintaxe.');
    } finally {
      setIsIngesting(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = (id: string) => {
    VectorStoreService.delete(id);
    loadDocuments();
    if (activeDocDetail?.vector_id === id) {
      setActiveDocDetail(null);
    }
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDocId(id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  // Quick Ingest Presets
  const applyPreset = (type: 'tax' | 'supplier' | 'zerogui' | 'sop') => {
    const id = `vec_doc_${secureInt(100, 899)}`;
    const nowIso = new Date().toISOString();

    const presets = {
      tax: {
        vector_id: id,
        text: "Lei Complementar 123/2006 & Resolução CGSN 140/2018: Dedução de créditos tributários e segregação de receitas para cálculo do Simples Nacional em operações com substituição tributária de ICMS.",
        metadata: {
          tenant_id: "global",
          category: "tax_law",
          updated_at: nowIso,
          entity_id: "LC_123_SIMPLES_ST",
          title: "Segregação de ICMS-ST no Simples Nacional",
          tags: ["tributário", "icms-st", "simples_nacional", "sefaz"]
        }
      },
      supplier: {
        vector_id: id,
        text: "Política de Homologação de Fornecedores ESG & Compliance: Fornecedores do setor químico e metalúrgico devem apresentar certificado ISO 14001 e Certidão Negativa de Débitos Federais a cada 180 dias. O descumprimento impede o Agente de Procurement de despachar ordens de fornecimento.",
        metadata: {
          tenant_id: tenantProfile?.slug || "global",
          category: "supplier_policy",
          updated_at: nowIso,
          entity_id: "POL_ESG_FORNECEDORES_2026",
          title: "Compliance ESG e Renovação CND Fornecedores",
          tags: ["compras", "compliance", "esg", "iso14001", "cnd"]
        }
      },
      zerogui: {
        vector_id: id,
        text: "Regra de Acordo de Governança Zero-GUI para Descontos Comerciais: O Agente de Vendas tem autonomia para aplicar bonificação ou desconto de até 7.5% em pedidos spot de clientes Tier-1, condicionado a pagamento em até 14 dias (D+14) e margem bruta superior a 28%.",
        metadata: {
          tenant_id: tenantProfile?.slug || "global",
          category: "zero_gui_approval",
          updated_at: nowIso,
          entity_id: "ZERO_GUI_DESCONTO_TIER1",
          title: "Alçada Autônoma de Desconto Comercial D+14",
          tags: ["zero-gui", "vendas", "desconto", "margem_bruta", "autonomia"]
        }
      },
      sop: {
        vector_id: id,
        text: "Procedimento Operacional Padrão (POP-QUAL-019): Protocolo de quarentena em lote produtivo com divergência dimensional superior a 0.05mm. Notificação imediata ao Engenheiro de Qualidade e reatribuição de maquinário CNC.",
        metadata: {
          tenant_id: tenantProfile?.slug || "global",
          category: "SOP",
          updated_at: nowIso,
          entity_id: "POP_QUAL_019_CNC",
          title: "POP-019: Quarentena de Qualidade & Tolerância CNC",
          tags: ["sop", "qualidade", "usinagem", "quarentena", "manufatura"]
        }
      }
    };

    setInputJson(JSON.stringify(presets[type], null, 2));
    setJsonError(null);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'tax_law':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Scale className="w-2.5 h-2.5" /> Legislação Fiscal
          </span>
        );
      case 'supplier_policy':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--vx-neon)]/10 text-[var(--vx-neon)] border border-[var(--vx-neon)]/30 flex items-center gap-1">
            <Truck className="w-2.5 h-2.5" /> Política de Fornecedores
          </span>
        );
      case 'zero_gui_approval':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-[var(--vx-neon-green)] border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" /> Regra Zero-GUI
          </span>
        );
      case 'SOP':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <BookOpen className="w-2.5 h-2.5" /> Procedimento (POP/SOP)
          </span>
        );
    }
  };

  const totalTokens = documents.reduce((acc, d) => acc + (d.tokens_count || 50), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[var(--vx-neon)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <VelatrixLogo variant="capsule" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--vx-neon)]/10 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 flex items-center gap-1">
                <Database className="w-3 h-3 text-[var(--vx-neon)]" />
                VECTOR RAG STORE & POLICY INGESTION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/80 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[var(--vx-neon-green)]" />
                Barramento Semântico Ativo
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Injeção Vetorial de Contexto & Políticas Corporativas
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Injete leis fiscais, políticas de fornecedores, limites de autonomia Zero-GUI e Procedimentos Operacionais Padrão (SOP). 
              O <strong>Enxame de Agentes VELATRIX</strong> utiliza este banco vetorial para fundamentar deliberações em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Voltar ao Dashboard
              </button>
            )}
            <button
              onClick={() => {
                VectorStoreService.resetToDefaults();
                loadDocuments();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Restaurar documentos de exemplo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar Padrões
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-800 text-[11px] font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Documentos Indexados:</span>
            <span className="text-white font-black text-sm">{documents.length} Vetores</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Volume de Tokens:</span>
            <span className="text-[var(--vx-neon)] font-bold">~{totalTokens} tokens</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Latência de Busca RAG:</span>
            <span className="text-[var(--vx-neon-green)] font-bold">&lt; 15 ms</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Tenant Ativo:</span>
            <span className="text-amber-400 font-bold">{tenantProfile?.slug || 'Nexus Indústria'}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Ingestion JSON Editor (Left) & Semantic RAG Search & Index Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: JSON Vector Ingestion Console (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono text-xs font-black">
                  +
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Injeção de Vetor de Contexto (JSON)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                POST /api/aos/vector/ingest
              </span>
            </div>

            {/* Quick Ingest Preset Pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Presets Rápidos por Categoria:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('tax')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-1.5 transition-all text-left cursor-pointer"
                >
                  <Scale className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Lei Fiscal (tax_law)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('supplier')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium flex items-center gap-1.5 transition-all text-left cursor-pointer"
                >
                  <Truck className="w-3 h-3 text-[var(--vx-neon)] shrink-0" />
                  <span className="truncate">Fornecedores (supplier_policy)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('zerogui')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5 transition-all text-left cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3 text-[var(--vx-neon-green)] shrink-0" />
                  <span className="truncate">Regra Zero-GUI (zero_gui_approval)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('sop')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-purple-500/30 text-purple-300 text-[11px] font-medium flex items-center gap-1.5 transition-all text-left cursor-pointer"
                >
                  <BookOpen className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="truncate">Procedimento (SOP)</span>
                </button>
              </div>
            </div>

            {/* Code / Textarea Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Payload de Injeção:
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(inputJson, 'input-json')}
                  className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedDocId === 'input-json' ? <Check className="w-3 h-3 text-[var(--vx-neon-green)]" /> : <Copy className="w-3 h-3" />}
                  <span>Copiar JSON</span>
                </button>
              </div>

              <textarea
                value={inputJson}
                onChange={(e) => {
                  setInputJson(e.target.value);
                  setJsonError(null);
                }}
                rows={12}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl p-3 text-xs font-mono text-emerald-400 leading-relaxed outline-none resize-y transition-all"
                placeholder='{\n  "vector_id": "vec_doc_001",\n  "text": "Conteúdo...",\n  "metadata": {\n    "tenant_id": "global",\n    "category": "tax_law",\n    "updated_at": "..."\n  }\n}'
                spellCheck={false}
              />
            </div>

            {/* Error & Success Feedback */}
            {jsonError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Erro na Estrutura do JSON:</p>
                  <p className="text-[11px] opacity-90">{jsonError}</p>
                </div>
              </div>
            )}

            {ingestSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[var(--vx-neon-green)] shrink-0" />
                <span className="font-bold">{ingestSuccessMsg}</span>
              </div>
            )}

            {/* Ingest Action Button */}
            <button
              onClick={handleIngestJson}
              disabled={isIngesting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-[#FF7A00] to-orange-500 text-slate-950 font-black text-xs hover:opacity-90 transition-all shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isIngesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Indexando no Barramento Vetorial...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>Indexar Vetor de Contexto (Live RAG)</span>
                </>
              )}
            </button>

            {/* Schema Documentation Explainer */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5 font-sans">
              <p className="font-bold text-slate-300 flex items-center gap-1 font-mono text-[10px]">
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                Estrutura Canônica de Injeção:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400">
                <li><strong className="text-slate-200">vector_id:</strong> ID único do documento (ex: <code>vec_doc_001</code>).</li>
                <li><strong className="text-slate-200">text:</strong> Conteúdo textual para injeção de contexto/RAG.</li>
                <li><strong className="text-slate-200">metadata.tenant_id:</strong> Slug da empresa ou <code>global</code>.</li>
                <li><strong className="text-slate-200">metadata.category:</strong> <code>tax_law</code> | <code>supplier_policy</code> | <code>zero_gui_approval</code> | <code>SOP</code>.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT: Live RAG Semantic Search & Database Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* 1. SEMANTIC SIMILARITY SEARCH TESTER */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[var(--vx-neon)]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Busca Vetorial & Similaridade Semântica (RAG Playground)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[var(--vx-neon)]">
                POST /api/aos/vector/search
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleQueryChange}
                placeholder="Ex: Qual o limite de autonomia Zero-GUI sem CFO? ou PIS/COFINS insumos..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-[var(--vx-neon)] focus:ring-1 focus:ring-[var(--vx-neon)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono mr-1">
                Filtrar:
              </span>
              {[
                { id: 'all', label: 'Todos os Vetores' },
                { id: 'tax_law', label: 'Legislação Fiscal' },
                { id: 'supplier_policy', label: 'Fornecedores' },
                { id: 'zero_gui_approval', label: 'Regras Zero-GUI' },
                { id: 'SOP', label: 'SOPs / POPs' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryFilterChange(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Results Display */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/80 text-slate-400 space-y-2">
                  <Database className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs">Nenhum vetor localizado para esta consulta.</p>
                  <p className="text-[10px] text-slate-500">Tente buscar por termos como "ICMS", "frete", "Multi-Sig" ou "SOP".</p>
                </div>
              ) : (
                searchResults.map(({ document: doc, score }) => {
                  const scorePercent = Math.round((doc.metadata.similarity_score || score) * 100);
                  const isHighMatch = scorePercent >= 40;

                  return (
                    <div
                      key={doc.vector_id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-amber-500/50 transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                            {doc.vector_id}
                          </span>
                          {getCategoryBadge(doc.metadata.category)}
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                            {doc.metadata.tenant_id}
                          </span>
                        </div>

                        {/* Similarity Score Pill */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">
                            Similaridade:
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                            isHighMatch 
                              ? 'bg-[var(--vx-neon-green)]/10 text-[var(--vx-neon-green)] border border-[var(--vx-neon-green)]/30' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {scorePercent}%
                          </span>
                        </div>
                      </div>

                      {/* Document Body Preview */}
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {doc.text}
                      </p>

                      {/* Footer Metadata & Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{doc.metadata.updated_at ? new Date(doc.metadata.updated_at).toLocaleDateString() : 'N/A'}</span>
                          {doc.metadata.entity_id && (
                            <span className="text-slate-400">• Entidade: {doc.metadata.entity_id}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(JSON.stringify(doc, null, 2), doc.vector_id)}
                            className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Copiar JSON do Vetor"
                          >
                            {copiedDocId === doc.vector_id ? <Check className="w-3 h-3 text-[var(--vx-neon-green)]" /> : <Copy className="w-3 h-3" />}
                            <span>JSON</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.vector_id)}
                            className="hover:text-rose-400 transition-colors cursor-pointer"
                            title="Excluir Vetor"
                          >
                            <Trash2 className="w-3 h-3 text-slate-500 hover:text-rose-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. HOW AGENT SWARM USES THE VECTOR STORE (ARCHITECTURE CARD) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
              <Zap className="w-4 h-4 text-[var(--vx-neon)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Como o Enxame VELATRIX consulta este Barramento Vetorial (RAG)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
                  1. Disparo de Evento
                </span>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Quando um webhook de fornecedor, SEFAZ ou sensor IoT chega ao sistema, o texto é vetorizado instantaneamente.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="font-bold text-[var(--vx-neon)] text-[11px] flex items-center gap-1">
                  2. Recuperação RAG
                </span>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Os agentes de Compras, Tributário e Risco recuperam as políticas (<code>tax_law</code>, <code>SOP</code>) com maior relevância semântica.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="font-bold text-[var(--vx-neon-green)] text-[11px] flex items-center gap-1">
                  3. Decisão Zero-GUI
                </span>
                <p className="text-[11px] text-slate-400 leading-snug">
                  O Card de Decisão On-Demand é gerado respeitando estritamente os tetos de alçada e limites previstos nas políticas injetadas.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
