import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Package, 
  Truck, 
  Users, 
  Factory, 
  ShieldAlert, 
  Network, 
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Zap,
  Activity,
  Server,
  Layers,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Table,
  Eye
} from 'lucide-react';
import { EnterpriseKnowledgeGraph, GraphNode, GraphTensionBridge } from '../types/aos';

interface SemanticGraphViewerProps {
  graph: EnterpriseKnowledgeGraph;
  isProcessing: boolean;
  onRefreshGraph: () => void;
  onSimulateTension?: (tensionBridge: GraphTensionBridge) => void;
  onSelectNodeEvent?: (node: GraphNode) => void;
}

export const SemanticGraphViewer: React.FC<SemanticGraphViewerProps> = ({
  graph,
  isProcessing,
  onRefreshGraph,
  onSimulateTension,
  onSelectNodeEvent
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all' | 'tensions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'alert' | 'nominal' | 'optimized'>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'matrix' | 'tensions'>('graph');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullView, setIsFullView] = useState(false);

  // Compact 6 to 8 high relevance / risk nodes for the default dashboard preview
  const compactNodes = useMemo(() => {
    const prioritized: GraphNode[] = [];
    const addedIds = new Set<string>();

    // 1. Critical & Alert nodes first
    for (const n of graph.nodes) {
      if (n.status === 'critical' || n.status === 'alert') {
        if (!addedIds.has(n.id)) {
          prioritized.push(n);
          addedIds.add(n.id);
        }
      }
    }

    // 2. Nodes connected to active tension bridges
    if (graph.tensionBridges) {
      for (const b of graph.tensionBridges) {
        if (b.isTriggered) {
          const s = graph.nodes.find(n => n.id === b.sourceNodeId);
          const t = graph.nodes.find(n => n.id === b.targetNodeId);
          if (s && !addedIds.has(s.id)) { prioritized.push(s); addedIds.add(s.id); }
          if (t && !addedIds.has(t.id)) { prioritized.push(t); addedIds.add(t.id); }
        }
      }
    }

    // 3. Anchor core business domain nodes
    const anchorCodes = ['NO_01', 'NO_09', 'NO_17', 'NO_25', 'NO_33', 'NO_41', 'NO_29', 'NO_48'];
    for (const code of anchorCodes) {
      const found = graph.nodes.find(n => (n.nodeCode || '').startsWith(code));
      if (found && !addedIds.has(found.id)) {
        prioritized.push(found);
        addedIds.add(found.id);
      }
      if (prioritized.length >= 8) break;
    }

    // 4. Fallback if needed
    for (const n of graph.nodes) {
      if (!addedIds.has(n.id)) {
        prioritized.push(n);
        addedIds.add(n.id);
      }
      if (prioritized.length >= 8) break;
    }

    // Carefully distributed non-overlapping positions for compact view
    const compactPositions = [
      { x: 18, y: 24 },
      { x: 50, y: 18 },
      { x: 82, y: 24 },
      { x: 84, y: 74 },
      { x: 50, y: 80 },
      { x: 16, y: 74 },
      { x: 34, y: 49 },
      { x: 66, y: 49 },
    ];

    return prioritized.slice(0, 8).map((node, idx) => ({
      ...node,
      displayX: compactPositions[idx % compactPositions.length].x,
      displayY: compactPositions[idx % compactPositions.length].y
    }));
  }, [graph.nodes, graph.tensionBridges]);

  const categories = [
    { id: 'all', label: 'Todos os 50 Nós', num: null, icon: Network, color: 'text-slate-300' },
    { id: 1, label: '1. Tesouraria & Open Finance', num: 1, count: 8, icon: DollarSign, color: 'text-cyan-400' },
    { id: 2, label: '2. Fiscal & Tax Compliance', num: 2, count: 8, icon: ShieldAlert, color: 'text-slate-300' },
    { id: 3, label: '3. Comercial & Clientes Tier-A', num: 3, count: 8, icon: Users, color: 'text-slate-300' },
    { id: 4, label: '4. Estoque & Supply Chain', num: 4, count: 8, icon: Package, color: 'text-cyan-400' },
    { id: 5, label: '5. Produção & Manufatura (BOM)', num: 5, count: 8, icon: Factory, color: 'text-slate-300' },
    { id: 6, label: '6. RH, Jurídico & Risco', num: 6, count: 10, icon: Activity, color: 'text-amber-400' },
    { id: 'tensions', label: '⚡ Pontes de Tensão', num: null, count: graph.tensionBridges?.length || 8, icon: Zap, color: 'text-rose-400' }
  ];

  const effectiveFull = isExpanded || isFullView;

  const filteredNodes = useMemo(() => {
    if (!effectiveFull) {
      return compactNodes;
    }

    return graph.nodes.filter(node => {
      // Category filter
      if (selectedCategory !== 'all' && selectedCategory !== 'tensions') {
        if (node.categoryNumber !== selectedCategory) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && node.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = (node.nodeCode || '').toLowerCase().includes(q);
        const matchLabel = node.label.toLowerCase().includes(q);
        const matchDesc = node.description.toLowerCase().includes(q);
        const matchErp = (node.erpBridge || '').toLowerCase().includes(q);
        const matchMetric = node.metricValue.toLowerCase().includes(q);
        return matchCode || matchLabel || matchDesc || matchErp || matchMetric;
      }

      return true;
    }).map(n => ({
      ...n,
      displayX: n.x,
      displayY: n.y
    }));
  }, [graph.nodes, selectedCategory, statusFilter, searchQuery, effectiveFull, compactNodes]);

  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'treasury':
        return <DollarSign className="w-3.5 h-3.5 text-cyan-400" />;
      case 'fiscal':
        return <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />;
      case 'supply_chain':
        return <Package className="w-3.5 h-3.5 text-cyan-400" />;
      case 'logistics':
        return <Truck className="w-3.5 h-3.5 text-slate-300" />;
      case 'customers':
        return <Users className="w-3.5 h-3.5 text-slate-300" />;
      case 'production':
        return <Factory className="w-3.5 h-3.5 text-slate-300" />;
      case 'risk':
        return <Activity className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />;
    }
  };

  const getStatusBadge = (status: GraphNode['status']) => {
    switch (status) {
      case 'nominal':
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"><CheckCircle2 className="w-3 h-3" /> Nominal</span>;
      case 'alert':
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60 animate-pulse"><AlertTriangle className="w-3 h-3" /> Alerta</span>;
      case 'critical':
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60 animate-bounce"><Zap className="w-3 h-3" /> Crítico</span>;
      case 'optimized':
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60"><Sparkles className="w-3 h-3" /> Otimizado</span>;
    }
  };

  const getStatusBorder = (status: GraphNode['status']) => {
    switch (status) {
      case 'nominal':
        return 'border-emerald-500/30 hover:border-emerald-400 bg-slate-900/90 text-slate-200';
      case 'alert':
        return 'border-amber-500 bg-amber-950/60 text-amber-100 ring-2 ring-amber-500/40 animate-pulse';
      case 'critical':
        return 'border-rose-500 bg-rose-950/80 text-rose-100 ring-2 ring-rose-500/60';
      case 'optimized':
        return 'border-cyan-500/40 bg-slate-900 text-slate-100 ring-1 ring-cyan-500/30';
      default:
        return 'border-slate-800 bg-slate-900 text-slate-300';
    }
  };

  const handleSimulateTensionClick = (bridge: GraphTensionBridge) => {
    if (onSimulateTension) {
      onSimulateTension(bridge);
    }
  };

  return (
    <div 
      id="semantic-knowledge-graph-card"
      className={`bg-slate-900/95 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 flex flex-col bg-slate-950 shadow-2xl' : 'relative'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800/90 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Grafo Semântico de Negócios (AOS v4.8)
              </h2>
              {effectiveFull ? (
                <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full font-semibold">
                  50 Nós Operacionais Vivos (Visualização Completa)
                </span>
              ) : (
                <span className="text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-semibold">
                  Prévia: 8 Nós Críticos / Risco
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Server className="w-3 h-3 text-slate-500" />
              <span>Sincronizado: TOTVS · SAP S/4HANA · Senior · SEFAZ · Open Finance BACEN</span>
            </p>
          </div>
        </div>

        {/* View Mode & Control Buttons */}
        <div className="flex items-center gap-2">
          {/* In compact mode, show clear button to open full 50 nodes graph */}
          {!effectiveFull ? (
            <button
              id="btn-open-full-graph"
              onClick={() => {
                setIsFullView(true);
                setIsExpanded(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Ver Grafo Completo (50 Nós)</span>
            </button>
          ) : (
            <>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                <button
                  onClick={() => { setViewMode('graph'); setSelectedCategory('all'); }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'graph' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Constelação 2D</span>
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'matrix' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Table className="w-3 h-3" />
                  <span>Matriz 50 Nós</span>
                </button>
                <button
                  onClick={() => { setViewMode('tensions'); setSelectedCategory('tensions'); }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'tensions' ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3 h-3 text-rose-400" />
                  <span>Pontes de Tensão ({graph.tensionBridges?.length || 8})</span>
                </button>
              </div>

              <button 
                id="btn-collapse-compact-graph"
                onClick={() => {
                  setIsFullView(false);
                  setIsExpanded(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                title="Recolher para Prévia"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recolher</span>
              </button>
            </>
          )}

          <button 
            id="btn-refresh-graph"
            onClick={onRefreshGraph}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer"
            title="Reconciliar nós do grafo agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Pills & Filter Bar (Shown in Full View or Expand) */}
      {effectiveFull && (
        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/70 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id as any);
                    if (cat.id === 'tensions') setViewMode('tensions');
                    else if (viewMode === 'tensions') setViewMode('graph');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-800 text-white border-teal-500/50 shadow-sm' 
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${cat.color}`} />
                  <span>{cat.label}</span>
                  {cat.count !== undefined && (
                    <span className="text-[9px] px-1 rounded bg-slate-800/80 text-slate-300 font-mono">
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Live Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar nós (ex: NO_01, ICMS, BOM, OEE)..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/60 w-48 sm:w-60"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-teal-500/60"
            >
              <option value="all">Status: Todos</option>
              <option value="critical">Crítico</option>
              <option value="alert">Alerta</option>
              <option value="optimized">Otimizado</option>
              <option value="nominal">Nominal</option>
            </select>
          </div>
        </div>
      )}

      {/* VIEW 1: CONSTELLATION 2D GRAPH CANVAS */}
      {viewMode === 'graph' && (
        <div className={`relative w-full ${isExpanded ? 'flex-1 min-h-[520px]' : 'h-96 sm:h-[420px]'} bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950 select-none overflow-hidden p-4`}>
          
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

          {/* Compact View Guidance Overlay */}
          {!effectiveFull && (
            <div className="absolute top-3 left-4 z-20 pointer-events-none flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded-md border border-slate-800 backdrop-blur-sm">
                Exibindo top 8 nós prioritários sem sobreposição. Clique em &quot;Ver Grafo Completo&quot; para todos os 50 nós.
              </span>
            </div>
          )}

          {/* SVG Tension Links */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {graph.edges.map(edge => {
              const sourceNode = filteredNodes.find(n => n.id === edge.source);
              const targetNode = filteredNodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const sx = sourceNode.displayX ?? sourceNode.x;
              const sy = sourceNode.displayY ?? sourceNode.y;
              const tx = targetNode.displayX ?? targetNode.x;
              const ty = targetNode.displayY ?? targetNode.y;

              const isStrained = edge.status === 'strained';

              return (
                <g key={edge.id}>
                  <line
                    x1={`${sx}%`}
                    y1={`${sy}%`}
                    x2={`${tx}%`}
                    y2={`${ty}%`}
                    className={
                      isStrained 
                        ? 'stroke-rose-500 stroke-[2.5] stroke-dasharray-[4,4] animate-pulse' 
                        : edge.isTensionBridge
                          ? 'stroke-amber-500/60 stroke-[1.5]'
                          : 'stroke-slate-800/80 stroke-[1.2]'
                    }
                  />
                  {edge.activePulse && (
                    <circle r="3" className="fill-teal-400 animate-ping">
                      <animateMotion
                        path={`M ${sx}% ${sy}% L ${tx}% ${ty}%`}
                        dur="3.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes Layer */}
          {filteredNodes.map(node => (
            <div
              key={node.id}
              id={`node-${node.id}`}
              onClick={() => {
                setSelectedNode(node);
                if (onSelectNodeEvent) onSelectNodeEvent(node);
              }}
              style={{ left: `${node.displayX ?? node.x}%`, top: `${node.displayY ?? node.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-105 hover:z-30 ${getStatusBorder(node.status)} p-2 rounded-xl border shadow-lg max-w-[155px] sm:max-w-[180px] z-10`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="p-1 rounded-md bg-slate-800/90 shrink-0">
                  {getNodeIcon(node.category)}
                </div>
                <div className="min-w-0">
                  {node.nodeCode && (
                    <div className="text-[8px] font-mono text-teal-400 font-bold truncate">
                      {node.nodeCode}
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-200 truncate leading-tight block">
                    {node.label}
                  </span>
                </div>
              </div>
              <div className="text-xs font-extrabold tracking-tight text-white pl-0.5">
                {node.metricValue}
              </div>
              <div className="text-[8px] text-slate-400 truncate pl-0.5 font-medium mt-0.5">
                {node.metricLabel}
              </div>
            </div>
          ))}

          {/* Selected Node Details Drawer */}
          {selectedNode && (
            <div 
              id="node-detail-popover"
              className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 p-4 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md z-40 max-h-[90%] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800">
                    {getNodeIcon(selectedNode.category)}
                  </div>
                  <div>
                    {selectedNode.nodeCode && (
                      <span className="text-[9px] font-mono text-teal-400 font-bold bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/50">
                        {selectedNode.nodeCode}
                      </span>
                    )}
                    <h3 className="text-xs font-bold text-slate-100 mt-1">{selectedNode.label}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 mb-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Leitura Telemetria D+0:</span>
                  <span className="font-bold text-white text-xs">{selectedNode.metricValue}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Parâmetro de Controle:</span>
                  <span className="text-slate-300 font-medium">{selectedNode.metricLabel}</span>
                </div>
                {selectedNode.erpBridge && (
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-900">
                    <span className="text-slate-400">Origem ERP / Feed:</span>
                    <span className="text-teal-300 font-mono text-[9px]">{selectedNode.erpBridge}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                {selectedNode.description}
              </p>

              {selectedNode.tensionRule && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 mb-3 text-[10px]">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Regra de Disparo de Tensão:</span>
                  </div>
                  <p className="text-amber-200/90">{selectedNode.tensionRule}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Status Semântico:</span>
                  {getStatusBadge(selectedNode.status)}
                </div>

                {/* Trigger button if there's a connected tension */}
                {graph.tensionBridges?.some(b => b.sourceNodeId === selectedNode.id || b.targetNodeId === selectedNode.id) && (
                  <button
                    onClick={() => {
                      const bridge = graph.tensionBridges?.find(b => b.sourceNodeId === selectedNode.id || b.targetNodeId === selectedNode.id);
                      if (bridge && onSimulateTension) onSimulateTension(bridge);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[10px] transition-all shadow-md"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Simular Tensão</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: FULL 50 NODES OPERATIONAL MATRIX (TABLE) */}
      {viewMode === 'matrix' && (
        <div className={`w-full ${isExpanded ? 'flex-1' : 'max-h-[420px]'} overflow-y-auto bg-slate-950 p-3`}>
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0 z-20">
                <th className="py-2.5 px-3">Código Nó</th>
                <th className="py-2.5 px-3">Domínio & Categoria</th>
                <th className="py-2.5 px-3">Nó de Inteligência</th>
                <th className="py-2.5 px-3">Leitura Tempo Real</th>
                <th className="py-2.5 px-3">Limiar de Controle</th>
                <th className="py-2.5 px-3">Origem ERP / Sistema</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredNodes.map(node => (
                <tr 
                  key={node.id} 
                  className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                  onClick={() => setSelectedNode(node)}
                >
                  <td className="py-2 px-3 font-mono font-bold text-teal-400 whitespace-nowrap">
                    {node.nodeCode || node.id}
                  </td>
                  <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      {getNodeIcon(node.category)}
                      <span>{node.categoryName || node.category}</span>
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-200">
                    {node.label}
                  </td>
                  <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                    {node.metricValue}
                  </td>
                  <td className="py-2 px-3 text-slate-400 text-[10px]">
                    {node.metricLabel}
                  </td>
                  <td className="py-2 px-3 text-slate-400 font-mono text-[9px]">
                    {node.erpBridge || 'TOTVS / SAP'}
                  </td>
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    {getStatusBadge(node.status)}
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium"
                    >
                      Inspecionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: TENSION BRIDGES PANEL */}
      {viewMode === 'tensions' && (
        <div className={`w-full ${isExpanded ? 'flex-1' : 'max-h-[420px]'} overflow-y-auto bg-slate-950 p-4 space-y-3`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-rose-400" />
                <span>Matriz de Pontes de Tensão & Conflitos Operacionais (AOS Neural Swarm)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sempre que dois nós entram em desacordo operacional (ex: Compras automáticas vs Reserva mínima de caixa), o Enxame é acionado e gera o Card Zero-GUI para o CEO.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800/60 px-2.5 py-1 rounded-full font-semibold">
              {graph.tensionBridges?.length || 8} Pontes Mapeadas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(graph.tensionBridges || []).map(bridge => (
              <div 
                key={bridge.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  bridge.isTriggered 
                    ? 'bg-rose-950/40 border-rose-500/80 ring-2 ring-rose-500/30' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold bg-slate-800 text-teal-300 px-1.5 py-0.5 rounded border border-slate-700">
                      {bridge.sourceCode}
                    </span>
                    <span className="text-rose-400 font-extrabold text-xs">⚡ VS ⚡</span>
                    <span className="text-[9px] font-mono font-bold bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700">
                      {bridge.targetCode}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    bridge.severity === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {bridge.severity}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 mb-1">
                  {bridge.tensionTitle}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                  {bridge.tensionDescription}
                </p>

                <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 mb-3 text-[10px] space-y-1">
                  <div className="text-slate-400">
                    <strong className="text-slate-300">Gatilho de Conflito:</strong> {bridge.triggerCondition}
                  </div>
                  <div className="text-teal-300">
                    <strong className="text-slate-300">Resolução do Enxame:</strong> {bridge.recommendedResolution}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] text-slate-500">
                    Sub-rotinas: TOTVS Compras · SAP FI · BACEN
                  </span>
                  <button
                    onClick={() => handleSimulateTensionClick(bridge)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-[11px] transition-all shadow-md active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Disparar Simulação no Enxame</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Bar with Real-Time ERP Latencies */}
      <div className="px-4 py-2 bg-slate-950 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/90">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-teal-400 font-semibold">50 Nós Reconciliados (100% Online)</span>
          <span className="text-slate-700">•</span>
          <span>8 Pontes de Tensão Monitoradas</span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-400">TOTVS (4ms) · SAP S/4HANA (8ms) · Senior (6ms) · SEFAZ (12ms) · Open Finance (5ms)</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Info className="w-3 h-3 text-slate-500" />
          <span>Invariantes Zero-Trust ativas em todos os 50 nós</span>
        </div>
      </div>
    </div>
  );
};
