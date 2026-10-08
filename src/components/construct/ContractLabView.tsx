import React from 'react';
import {
  FileText,
  Cpu,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { PageHead } from '../console/PageHead';

export const ContractLabView: React.FC = () => {
  // 9 Canonical Specialized Domain Agents from Architectural Mock
  const domainAgents = [
    { id: 'societario', name: 'Contratual Societário', role: 'M&A, acordo de sócios, compra e venda', domain: 'Societário & Corporate' },
    { id: 'imobiliario', name: 'Imobiliário', role: 'Aluguel, compra, incorporação e garantia real', domain: 'Real Estate' },
    { id: 'trabalhista', name: 'Trabalhista', role: 'CLT, contratos de prestação de serviços PJ, terceirização', domain: 'Trabalhista' },
    { id: 'fornecimento', name: 'Fornecimento & Suprimentos', role: 'Contratos B2B, SLA, multas e condições comerciais', domain: 'Supply Chain' },
    { id: 'tecnologia', name: 'Tecnologia & SaaS', role: 'Licença de software, hosting, EULA e propriedade intelectual', domain: 'Tech & IP' },
    { id: 'financeiro', name: 'Financeiro & Bancário', role: 'CCB, cessão de crédito fiduciário, covenants', domain: 'Bancário' },
    { id: 'regulatorio', name: 'Regulatório & Compliance', role: 'Adequação LGPD, ANVISA, BACEN e agências setoriais', domain: 'Compliance' },
    { id: 'publico', name: 'Público & Licitações', role: 'Lei 14.133/21, contratos administrativos e termos aditivos', domain: 'Direito Público' },
    { id: 'agro', name: 'Rural & Agroindustrial', role: 'Cédula de Produto Rural (CPR), arrendamento, parcerias agrícolas', domain: 'Agro & Commodities' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      <PageHead
        eyebrow="Motores Cognitivos · Roadmap Fase 2"
        title="Contract Lab · 9 Agentes de Análise Contratual"
        description="Fine-tuning contínuo de agentes especializados em análise contratual por domínio de atuação jurídica e corporativa."
        actions={
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-warn-soft text-warn border border-warn/30 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>EM CONSTRUÇÃO · ROADMAP FASE 2</span>
            </span>
          </div>
        }
      />

      {/* Under Construction Notice Banner */}
      <div className="bg-warn-soft/60 border border-warn/30 rounded-xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warn shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-ink">
              Módulo em Fase de Parametrização Cognitiva
            </h3>
            <p className="text-xs text-ink-mute leading-relaxed max-w-2xl">
              O Contract Lab reúne a arquitetura de 9 sub-agentes LLM dedicados à revisão minuciosa de cláusulas leoninas, riscos de breach e conformidade contratual. A integração ativa com a base de minutas está programada para a Fase 2 do Rollout.
            </p>
          </div>
        </div>
        <div className="shrink-0 text-xs font-mono text-ink-mute bg-canvas px-3 py-1.5 rounded-md border border-hairline">
          Status: Treinamento LoRA / Avaliação
        </div>
      </div>

      {/* 9 Specialized Agents Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink font-normal">
            9 Agentes Especializados de Domínio
          </h2>
          <span className="text-xs font-mono text-ink-mute">
            Arquitetura Neural Core
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domainAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-canvas border border-hairline rounded-xl p-5 space-y-4 hover:border-hairline-strong transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-serif font-medium text-base text-ink">
                    {agent.name}
                  </h4>
                  <p className="text-xs text-ink-mute mt-1 leading-snug">
                    {agent.role}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface text-ink-soft border border-hairline shrink-0">
                  {agent.domain}
                </span>
              </div>

              <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs">
                <span className="text-ink-soft">Motor Cognitivo</span>
                <span className="font-mono text-accent font-medium">Gemini 3.7 Base</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
