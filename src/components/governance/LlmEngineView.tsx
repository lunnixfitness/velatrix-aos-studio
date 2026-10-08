import React, { useState } from 'react';
import { PageHead } from '../console/PageHead';
import { SubTabBar, SubTabItem } from '../console/SubTabBar';
import { Sparkles, Cpu, Activity, ShieldCheck, Zap, Sliders, CheckCircle2 } from 'lucide-react';

interface LlmEngineViewProps {
  activeEngine?: string;
}

export const LlmEngineView: React.FC<LlmEngineViewProps> = ({
  activeEngine = 'Gemini 3.7 Flash'
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [temperature, setTemperature] = useState<number>(0.2);
  const [maxTokens, setMaxTokens] = useState<number>(4096);
  const [topP, setTopP] = useState<number>(0.95);

  const tabs: SubTabItem[] = [
    { id: 'overview', label: 'Visão Geral do Modelo Ativo', badge: 'Online' },
    { id: 'parameters', label: 'Hiperparâmetros & Raciocínio', badge: 'Config' },
    { id: 'benchmark', label: 'Latência & SLA de Produção', badge: '< 350ms' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      <PageHead
        eyebrow="Governança · Motores Cognitivos"
        title="LLM Engine · Orquestração de Modelos Fundacionais"
        description="Gestão de inferência em tempo real com barramento server-side, garantindo isolamento de chaves de API, controle estrito de alucinações e prompt caching."
        actions={
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-good-soft text-good border border-good/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-good animate-pulse" />
              <span>MOTOR ATIVO: {activeEngine}</span>
            </span>
          </div>
        }
      />

      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-hairline space-y-1">
              <div className="flex items-center justify-between text-xs text-ink-mute font-mono">
                <span>MODELO BASE</span>
                <Cpu className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="text-base font-bold text-ink font-mono">{activeEngine}</div>
              <p className="text-[11px] text-ink-mute">Multimodal 1M tokens context</p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-hairline space-y-1">
              <div className="flex items-center justify-between text-xs text-ink-mute font-mono">
                <span>LATÊNCIA MÉDIA P95</span>
                <Zap className="w-3.5 h-3.5 text-good" />
              </div>
              <div className="text-xl font-bold text-ink font-mono">248 ms</div>
              <p className="text-[11px] text-good font-medium">99.98% de disponibilidade</p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-hairline space-y-1">
              <div className="flex items-center justify-between text-xs text-ink-mute font-mono">
                <span>TAXA DE AUDITORIA AST</span>
                <ShieldCheck className="w-3.5 h-3.5 text-accent-bright" />
              </div>
              <div className="text-xl font-bold text-ink font-mono">100% VALIDADE</div>
              <p className="text-[11px] text-ink-mute font-mono">Zero JSON schema drift</p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-hairline space-y-1">
              <div className="flex items-center justify-between text-xs text-ink-mute font-mono">
                <span>PROMPT CACHING</span>
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="text-xl font-bold text-ink font-mono">ATIVO (85% HIT)</div>
              <p className="text-[11px] text-good font-medium">Redução de custo de 70%</p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-hairline space-y-4">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-good" />
              <span>Diretrizes e Invariantes do Sistema (System Instruction)</span>
            </h3>
            <p className="text-xs text-ink-mute leading-relaxed">
              O motor opera sob a política de deliberação determinística do Velatrix AOS. Todas as saídas de perícia, cálculos tributários e despachos operacionais são verificadas matematicamente contra leis vigentes e normas contábeis antes da liberação ao usuário.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'parameters' && (
        <div className="p-6 rounded-xl bg-surface border border-hairline space-y-6">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <span>Parametrização da Inferência</span>
          </h3>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ink">Temperatura de Amostragem</span>
                <span className="font-mono text-ink-mute">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[11px] text-ink-soft">Valores baixos garantem respostas conservadoras e reprodutíveis para cálculos fiscais.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ink">Tokens Máximos de Resposta</span>
                <span className="font-mono text-ink-mute">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="512"
                max="8192"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ink">Top-P Nucleus Sampling</span>
                <span className="font-mono text-ink-mute">{topP}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'benchmark' && (
        <div className="p-6 rounded-xl bg-surface border border-hairline space-y-4">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Activity className="w-4 h-4 text-good" />
            <span>Métricas de Performance do Cluster</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-canvas border border-hairline font-mono text-xs">
              <div className="text-ink-mute">Time-to-First-Token:</div>
              <div className="text-base font-bold text-ink mt-1">112 ms</div>
            </div>
            <div className="p-3 rounded-lg bg-canvas border border-hairline font-mono text-xs">
              <div className="text-ink-mute">Tokens por Segundo:</div>
              <div className="text-base font-bold text-ink mt-1">142 tps</div>
            </div>
            <div className="p-3 rounded-lg bg-canvas border border-hairline font-mono text-xs">
              <div className="text-ink-mute">Fator de Caching:</div>
              <div className="text-base font-bold text-good mt-1">92.4%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LlmEngineView;
