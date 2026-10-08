import React, { useState } from 'react';
import { RouterDispatchResult, StrategicHub } from '../../types/autonomousSwarm';
import { STRATEGIC_HUBS } from '../../data/swarmHubsCatalog';
import { swarmRouter, IncomingBusEvent } from '../../services/swarmRouterService';
import { 
  X, 
  Play, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  Terminal,
  Activity,
  Send,
  Zap,
  RotateCcw
} from 'lucide-react';

interface SwarmEventRouterSimulatorModalProps {
  onClose: () => void;
  onDispatchEvent: (result: RouterDispatchResult) => void;
}

const PRESET_EVENT_TEMPLATES: IncomingBusEvent[] = [
  {
    title: 'Divergência de MVA e Alíquota Interna de ICMS-ST em NF-e Interestadual (SP -> MG)',
    description: 'Rascunho de NF-e #59201 com destino a Minas Gerais emitida com MVA original (40%) ao invés da MVA Ajustada (54,2%), gerando risco de retenção de carga na barreira fiscal SEFAZ-MG.',
    sourceSystem: 'SEFAZ_HOOK',
    targetUf: 'MG',
    targetCategory: 'Fiscal',
    valueBrl: 84500,
    payload: { nfe: 59201, emitente: 'Matriz SP', destinatario: 'Filial Contagem MG', ufOrigem: 'SP', ufDestino: 'MG' }
  },
  {
    title: 'Disparo de RFQ Emergencial: Compra de Semicondutores e Microcontroladores ARM',
    description: 'Estoque mínimo de segurança atingido na fábrica de eletrônicos. Necessidade de disparo automatizado de cotação para 4 distribuidores globais com equalização tributária.',
    sourceSystem: 'ERP_TOTVS',
    targetCategory: 'Eletrônicos',
    valueBrl: 120000,
    payload: { sku: 'IC-STM32-H7', quantidade: 5000, criticidade: 'ALTA_PARADA_LINHA' }
  },
  {
    title: 'Detecção de Adulteração de Código de Barras de Boleto de Fornecedor',
    description: 'Boleto no valor de R$ 98.400,00 anexado para pagamento apresentando divergência entre a linha digitável e o código de barras lido no PDF (conta beneficiária alterada para terceiro).',
    sourceSystem: 'ERP_SAP',
    targetCategory: 'Tesouraria Antifraude',
    valueBrl: 98400,
    payload: { docNum: 'FAT-2026-991', banco: '341', cnpjEsperado: '12.345.678/0001-90', contaDivergente: true }
  },
  {
    title: 'Alerta Preditivo IoT: Espectro de Vibração Anômalo em Compressor de Parafuso 02',
    description: 'Sensor piezoelétrico registrou velocidade RMS de 8.9 mm/s e aquecimento nos rolamentos de apoio a 94°C (curva de degradação acelerada ISO 10816).',
    sourceSystem: 'IOT_GATEWAY',
    targetAsset: 'Compressor',
    valueBrl: 45000,
    payload: { assetId: 'COMP-IND-02', rmsMmS: 8.9, tempCelsius: 94, setor: 'Utilidades Fabris' }
  },
  {
    title: 'Detecção de Tentativa de Criptografia Massiva (DejaVu Anti-Ransomware)',
    description: 'Gatilho de Honeytoken acionado: processo não homologado executou mais de 120 operações de escrita por segundo em diretório compartilhado com alteração de extensões.',
    sourceSystem: 'CYBER_AGENT',
    targetCategory: 'Segurança',
    valueBrl: 350000,
    payload: { honeypotHit: true, host: 'SRV-FILE-01', rateIoPerSec: 124, lockdownRecommended: true }
  },
  {
    title: 'Auditoria de Minuta de Contrato de Fornecimento: Cláusula Penal sem Teto',
    description: 'Análise de documento contratual de prestação de serviços logísticos com identificação de multa compensatória desproporcional (100% do contrato) e índice IGP-M sem cap.',
    sourceSystem: 'ERP_TOTVS',
    targetCategory: 'Jurídico',
    valueBrl: 150000,
    payload: { contractType: 'LOGISTICA_LONG_TERM', clausesAnalyzed: 34, riskFlag: 'MULTA_ABUSIVA' }
  }
];

export const SwarmEventRouterSimulatorModal: React.FC<SwarmEventRouterSimulatorModalProps> = ({
  onClose,
  onDispatchEvent
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<IncomingBusEvent>(PRESET_EVENT_TEMPLATES[0]);
  const [customTitle, setCustomTitle] = useState<string>(PRESET_EVENT_TEMPLATES[0].title);
  const [customDesc, setCustomDesc] = useState<string>(PRESET_EVENT_TEMPLATES[0].description || '');
  const [customUf, setCustomUf] = useState<string>(PRESET_EVENT_TEMPLATES[0].targetUf || '');
  const [customValue, setCustomValue] = useState<number>(PRESET_EVENT_TEMPLATES[0].valueBrl || 50000);
  const [simulateTimeout, setSimulateTimeout] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<RouterDispatchResult | null>(null);

  const handleSelectTemplate = (tpl: IncomingBusEvent) => {
    setSelectedTemplate(tpl);
    setCustomTitle(tpl.title);
    setCustomDesc(tpl.description || '');
    setCustomUf(tpl.targetUf || '');
    setCustomValue(tpl.valueBrl || 50000);
    setResult(null);
  };

  const handleRunRouter = () => {
    setIsProcessing(true);

    setTimeout(async () => {
      const dispatchResult = await swarmRouter.dispatchEvent({
        title: customTitle,
        description: customDesc,
        targetUf: customUf || undefined,
        valueBrl: customValue,
        sourceSystem: selectedTemplate.sourceSystem || 'ERP_BUS',
        forceTimeoutFailure: simulateTimeout
      });

      setResult(dispatchResult);
      onDispatchEvent(dispatchResult);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  ROUTER AGENT PIPELINE
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Orquestração Hierárquica em 4 Etapas
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Simulador de Barramento de Eventos (300 Agentes)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* 4-Step Orchestration Pipeline Concept Visual */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
              Pipeline de Execução Autônoma por Evento
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-cyan-400 font-bold block">1. Router Agent</span>
                <span className="text-[10px] text-slate-400">Ingestão Barramento ERP</span>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-amber-400 font-bold block">2. Hub Dispatcher</span>
                <span className="text-[10px] text-slate-400">Seleção de 1 dos 8 Hubs</span>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-purple-400 font-bold block">3. Micro-Agent</span>
                <span className="text-[10px] text-slate-400">Execução Serverless On-Demand</span>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-emerald-400 font-bold block">4. Ledger Imutável</span>
                <span className="text-[10px] text-slate-400">Quórum & Hash SHA-256</span>
              </div>
            </div>
          </div>

          {/* Preset Event Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Escolha um Evento Pré-Configurado de Negócios:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_EVENT_TEMPLATES.map((tpl, idx) => {
                const isSelected = selectedTemplate.title === tpl.title;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-semibold text-white truncate block text-[11px]">
                      {tpl.title}
                    </span>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>Origem: {tpl.sourceSystem}</span>
                      <span>R$ {tpl.valueBrl?.toLocaleString('pt-BR')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Parameters */}
          <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-3 text-xs">
            <div>
              <label className="text-slate-300 block font-medium mb-1">Título do Evento:</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block font-medium mb-1">Descrição / Detalhes Operacionais:</label>
              <textarea
                rows={2}
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block font-medium mb-1">UF Destino (Hub 1 ICMS-ST):</label>
                <input
                  type="text"
                  placeholder="Ex: MG, SP, RJ, RS..."
                  value={customUf}
                  onChange={(e) => setCustomUf(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white uppercase font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block font-medium mb-1">Valor Envolvido (R$):</label>
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={simulateTimeout}
                  onChange={(e) => setSimulateTimeout(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/20"
                />
                <span className="flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Simular Falha de SLA/Timeout (Testar Redirecionamento ao Core Master & Human-In-The-Loop)
                </span>
              </label>

              <button
                type="button"
                onClick={handleRunRouter}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                  isProcessing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 active:scale-95'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Roteando no Enxame...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Disparar Evento no Barramento</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Output Display */}
          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
              <div className={`p-4 rounded-xl border text-xs ${
                result.executionStatus === 'REDIRECTED_TO_CORE_MASTER'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  : result.executionStatus === 'MULTI_SIG_TRIGGERED'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {result.executionStatus === 'REDIRECTED_TO_CORE_MASTER' ? (
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold">
                        {result.executionStatus === 'REDIRECTED_TO_CORE_MASTER'
                          ? 'SLA Timeout Excedido: Redirecionado com Segurança ao Velatrix Core Master'
                          : 'Roteamento & Execução Concluídos com Sucesso'}
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5 font-mono">
                        {result.formattedLiveLog}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 shrink-0">
                    Latência: {result.executionTimeMs}ms
                  </span>
                </div>

                {/* Router Execution Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">HUB SELECIONADO:</span>
                    <span className="text-white font-bold">{result.routedHubName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">MICRO-AGENTE DESTINO:</span>
                    <span className="text-cyan-400 font-bold">{result.routedAgentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">MODO RUNTIME:</span>
                    <span className="text-emerald-400 font-bold">{result.runtimeMode}</span>
                  </div>
                </div>

                {/* Cryptographic Ledger Block */}
                <div className="mt-3 p-2 bg-slate-950/80 rounded-lg font-mono text-[10px] space-y-1 text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>HASH DO BLOCO (SHA-256):</span>
                    <span className="text-cyan-300">{result.ledgerHash}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ENCADEAMENTO ANTERIOR:</span>
                    <span className="text-slate-500">{result.previousLedgerHash}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            Barramento Assíncrono com Validação de Quórum e Invariantes Pré-ERP.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Fechar Simulador
          </button>
        </div>

      </div>
    </div>
  );
};
