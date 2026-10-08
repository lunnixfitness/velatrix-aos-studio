import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  MessageSquare, 
  Mail, 
  Copy, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Target, 
  ChevronRight,
  TrendingUp,
  Share2,
  FileCheck
} from 'lucide-react';
import { 
  AOS_ACADEMY_MODULES, 
  SALES_SCRIPTS_COLLECTION, 
  AcademyModule, 
  SalesScriptCopy,
  PartnerGrowthService,
  PartnerProfile
} from '../../services/partnerGrowthService';

export const PartnerAcademySection: React.FC = () => {
  const [profile] = useState<PartnerProfile>(() => PartnerGrowthService.getProfile());
  const [modules, setModules] = useState<AcademyModule[]>(AOS_ACADEMY_MODULES);
  const [selectedModule, setSelectedModule] = useState<AcademyModule>(modules[0]);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<'ALL' | 'WHATSAPP' | 'EMAIL' | 'REUNIAO'>('ALL');
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({
    'mod-1': true
  });

  const toggleModuleCompleted = (id: string) => {
    setCompletedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getCustomizedScriptText = (templateText: string) => {
    return templateText
      .replace(/\[SEU_NOME\]/g, profile.lawyerName || 'Dr. Marcelo Vasconcelos')
      .replace(/\[SEU_ESCRITORIO\]/g, profile.firmName || 'Vasconcelos Advocacia')
      .replace(/\[SEU_REGISTRO_OAB\]/g, profile.oabOrCrc || 'OAB/SP 284.910')
      .replace(/\[SEU_EMAIL\]/g, profile.email || 'contato@escritorio.adv.br')
      .replace(/\[SEU_TELEFONE\]/g, profile.phone || '(11) 98412-4400')
      .replace(/\[NOME_EMPRESA\]/g, 'Vortex Manufatura S.A.')
      .replace(/\[CNPJ_EMPRESA\]/g, '33.041.260/0001-88')
      .replace(/\[VALOR_ESTIMADO\]/g, 'R$ 2.485.000,00')
      .replace(/\[NOME_CONTATO\]/g, 'Diretor Financeiro');
  };

  const handleCopyScript = (script: SalesScriptCopy) => {
    const customized = getCustomizedScriptText(script.templateText);
    navigator.clipboard.writeText(customized);
    setCopiedScriptId(script.id);
    setTimeout(() => setCopiedScriptId(null), 2500);
  };

  const filteredScripts = SALES_SCRIPTS_COLLECTION.filter(s => {
    if (selectedChannelFilter === 'ALL') return true;
    return s.channel === selectedChannelFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner Top */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-tight">AOS Academy — Capacitação &amp; Central de Vendas</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                Trilha Prática B2B
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              Metodologia consultiva, roteiros de fechamento de contrato de êxito e scripts prontos para prospecção de carteira de clientes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            Módulos Concluídos: <strong className="text-emerald-400">{Object.values(completedModules).filter(Boolean).length} / {modules.length}</strong>
          </span>
        </div>
      </div>

      {/* Part 1: Training Tracks (Modules) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Modules List (Sidebar) */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 px-1">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Módulos de Formação Prática</span>
          </div>

          <div className="space-y-2">
            {modules.map((mod, idx) => {
              const isSelected = selectedModule.id === mod.id;
              const isDone = !!completedModules[mod.id];

              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800">
                        AULA 0{idx + 1}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mod.durationMinutes} min
                      </span>
                    </div>
                    <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {mod.title}
                    </h4>
                  </div>

                  <div className="shrink-0 mt-1">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Module Detail Canvas */}
        <div className="lg:col-span-2 bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Conteúdo da Trilha</span>
              <h3 className="text-base font-bold text-white mt-0.5">{selectedModule.title}</h3>
              <p className="text-xs text-slate-300 mt-1">{selectedModule.description}</p>
            </div>

            <button
              onClick={() => toggleModuleCompleted(selectedModule.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                completedModules[selectedModule.id]
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
              }`}
            >
              {completedModules[selectedModule.id] ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Módulo Concluído</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar como Concluído</span>
                </>
              )}
            </button>
          </div>

          {/* Objectives Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Competências &amp; Objetivos Práticos:</span>
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {selectedModule.objectives.map((obj, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{obj}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Box */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <h5 className="text-xs font-mono font-bold text-indigo-300 uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Dicas de Ouro para Fechamento de Contrato:</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedModule.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* Part 2: Sales Scripts & Ready Copys */}
      <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-6 space-y-5">
        
        {/* Scripts Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <span>Central de Scripts &amp; Copys de Vendas Prontas</span>
            </h3>
            <p className="text-xs text-slate-400">
              Textos customizados com os dados do seu escritório ({profile.firmName}) para envio rápido em 1 clique.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', 'WHATSAPP', 'EMAIL', 'REUNIAO'] as const).map(ch => (
              <button
                key={ch}
                onClick={() => setSelectedChannelFilter(ch)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer ${
                  selectedChannelFilter === ch
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {ch === 'ALL' ? 'Todos os Canais' : ch}
              </button>
            ))}
          </div>
        </div>

        {/* Scripts Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredScripts.map((script) => {
            const isCopied = copiedScriptId === script.id;
            const previewText = getCustomizedScriptText(script.templateText);

            return (
              <div
                key={script.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      script.channel === 'WHATSAPP'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : script.channel === 'EMAIL'
                        ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        : 'bg-purple-950 text-purple-300 border-purple-800'
                    }`}>
                      {script.channel}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{script.targetAudience}</span>
                  </div>

                  <h4 className="text-xs font-bold text-white">{script.title}</h4>
                  <p className="text-[11px] text-slate-400 italic">Gancho: {script.hook}</p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {previewText}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyScript(script)}
                  className={`w-full mt-2 px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Script Customizado</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
