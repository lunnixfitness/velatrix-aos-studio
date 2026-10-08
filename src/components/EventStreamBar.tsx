import React, { useState, useRef } from 'react';
import { 
  Radio, 
  Send, 
  AlertTriangle, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Anchor, 
  DollarSign, 
  RefreshCw, 
  ShieldAlert, 
  HeartPulse, 
  Briefcase,
  Paperclip,
  FileText,
  ScanLine,
  CheckCircle2,
  X,
  FileCode,
  Image as ImageIcon
} from 'lucide-react';
import { PRESET_SCENARIOS, ScenarioDefinition } from '../data/mockScenarios';
import { SemanticEvent, SupportedCurrency, SupportedLanguage } from '../types/aos';
import { TRANSLATIONS, formatCurrency } from '../utils/i18n';
import { Target } from 'lucide-react';

interface EventStreamBarProps {
  currentEvent: SemanticEvent | null;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  onSubmitCustomEvent: (eventText: string, rawPayload?: Record<string, any>) => void;
  isProcessing: boolean;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
  onOpenDiagnosisSimulator?: () => void;
}

export const EventStreamBar: React.FC<EventStreamBarProps> = ({
  currentEvent,
  onSelectScenario,
  onSubmitCustomEvent,
  isProcessing,
  language = 'pt',
  currency = 'BRL',
  onOpenDiagnosisSimulator
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.pt;
  const [inputText, setInputText] = useState('');
  
  // OCR & Attachment State
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrFileName, setOcrFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSubmitCustomEvent(inputText.trim());
    setInputText('');
  };

  const handleTriggerOcrFile = (fileName: string, simulatedDescription: string, payload: Record<string, any>) => {
    setShowAttachMenu(false);
    setIsScanningOcr(true);
    setOcrFileName(fileName);

    setTimeout(() => {
      setIsScanningOcr(false);
      setOcrFileName(null);
      onSubmitCustomEvent(simulatedDescription, payload);
    }, 1800);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowAttachMenu(false);
    setIsScanningOcr(true);
    setOcrFileName(file.name);

    setTimeout(() => {
      setIsScanningOcr(false);
      setOcrFileName(null);
      const simulatedText = language === 'pt' 
        ? `[OCR ARQUIVO: ${file.name}] Documento de ${file.size} bytes processado via OCR em borda e reconciliado com o Grafo Semântico.`
        : language === 'es'
        ? `[OCR ARCHIVO: ${file.name}] Documento de ${file.size} bytes procesado vía OCR en borde y reconciliado con el Grafo Semántico.`
        : `[OCR FILE: ${file.name}] Document of ${file.size} bytes processed via edge OCR and reconciled with Semantic Graph.`;
      onSubmitCustomEvent(simulatedText, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString()
      });
    }, 1800);
  };

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'fraud_pix_intercept':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'supplier_disruption':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'b2b_demand_surge':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      case 'customs_clearance_hold':
        return <Anchor className="w-3.5 h-3.5 text-cyan-400" />;
      case 'forex_shock_hedge':
        return <DollarSign className="w-3.5 h-3.5 text-amber-400" />;
      case 'carrier_ransomware_attack':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'pharma_cold_chain_breach':
        return <HeartPulse className="w-3.5 h-3.5 text-amber-400" />;
      case 'services_capacity_crunch':
        return <Briefcase className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getLocalizedScenarioName = (scenario: ScenarioDefinition) => {
    switch (scenario.id) {
      case 'fraud_pix_intercept':
        return t.scenarios.fraud;
      case 'supplier_disruption':
        return t.scenarios.supplier;
      case 'b2b_demand_surge':
        return t.scenarios.demand;
      case 'customs_clearance_hold':
        return t.scenarios.customs;
      case 'forex_shock_hedge':
        return t.scenarios.fx;
      case 'carrier_ransomware_attack':
        return t.scenarios.ransomware;
      case 'pharma_cold_chain_breach':
        return t.scenarios.healthcare;
      case 'services_capacity_crunch':
        return t.scenarios.services;
      default:
        return scenario.badge || scenario.title;
    }
  };

  return (
    <div id="event-stream-bar-root" className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4">
      
      {/* Preset Injections & Scenarios Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--vx-neon)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--vx-neon)]" />
          </span>
          <span className="text-xs font-bold tracking-wider uppercase text-slate-200 font-mono">
            {t.eventStream}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">({t.realTimeStream})</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDiagnosisSimulator && (
            <button
              id="btn-open-diagnosis-simulator-bar"
              onClick={onOpenDiagnosisSimulator}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-[11px] font-bold text-rose-300 transition-colors shadow-sm cursor-pointer"
              title="Acessar Simulador de Diagnóstico e Raio-X de Risco"
            >
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulador de Diagnóstico</span>
            </button>
          )}
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            {t.injectScenario}
          </span>
        </div>
      </div>

      {/* Preset Scenarios Carousel */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="flex items-center gap-2 w-max">
          {PRESET_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              disabled={isProcessing || isScanningOcr}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                currentEvent?.id.includes(scenario.id)
                  ? 'bg-slate-900 border-[var(--vx-neon)] text-[var(--vx-neon)] shadow-md shadow-[var(--vx-neon)]/10 ring-1 ring-[var(--vx-neon)]/40'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              {getScenarioIcon(scenario.id)}
              <span className="whitespace-nowrap font-sans">{getLocalizedScenarioName(scenario)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hidden File Input for Custom Attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCustomFileUpload}
        accept=".pdf,.png,.jpg,.jpeg,.xml,.txt,.json"
        className="hidden"
      />

      {/* Natural Language & Document Event Injector */}
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="flex items-center gap-2 bg-slate-950 rounded-xl border border-slate-800 p-1.5 focus-within:border-[var(--vx-neon)]/60 transition-colors">
          <div className="pl-3 text-slate-500">
            <Radio className="w-4 h-4 text-[var(--vx-neon)]" />
          </div>

          <input
            id="input-custom-enterprise-event"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.eventPlaceholder}
            disabled={isProcessing || isScanningOcr}
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none px-2 py-1.5"
          />

          {/* Attach Document / OCR Button (Paperclip) */}
          <div className="relative">
            <button
              type="button"
              id="btn-attach-document-ocr"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              disabled={isProcessing || isScanningOcr}
              className="p-2 rounded-lg text-slate-400 hover:text-[var(--vx-neon)] hover:bg-slate-800 transition-colors cursor-pointer"
              title={t.attachDocument}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Attach Dropdown Menu */}
            {showAttachMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-72 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <ScanLine className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
                    <span>{t.attachDocTitle}</span>
                  </span>
                  <button 
                    onClick={() => setShowAttachMenu(false)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleTriggerOcrFile(
                      'Danfe_NFe_089821_Insumos.pdf',
                      language === 'pt' ? '[OCR SEFAZ] Nota Fiscal Eletrônica Danfe #089821 de R$ 145.000,00 emitida pela Metalúrgica ABC para entrega urgente de insumos.' : language === 'es' ? '[OCR FACTURA] Factura Electrónica Danfe #089821 de R$ 145.000,00 emitida para entrega urgente.' : '[OCR INVOICE] Electronic Invoice Danfe #089821 of R$ 145,000.00 issued by Metalúrgica ABC.',
                      { nfe_number: '089821', amount: 145000, supplier: 'Metalúrgica ABC', type: 'inbound_invoice' }
                    )}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-200 text-[11px]">Danfe NF-e #089821 (PDF)</div>
                      <div className="text-[9px] text-slate-400 font-mono">{formatCurrency(145000, (currency as SupportedCurrency) || 'BRL', (language as SupportedLanguage) || 'pt')} • Insumos</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerOcrFile(
                      'Contrato_Fornecimento_Clausula12.pdf',
                      language === 'pt' ? '[OCR CONTRATO] Contrato de Fornecimento Anual com Cláusula de Repasse Automático de Inflação de 12% a partir do próximo fechamento.' : language === 'es' ? '[OCR CONTRATO] Contrato con Cláusula de Reajuste Automático de Inflación del 12%.' : '[OCR CONTRACT] Annual Supply Agreement with 12% Inflation Indexing Clause.',
                      { contract_id: 'CTR-2026-99', index_clause: 0.12, type: 'legal_contract' }
                    )}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs transition-colors flex items-center gap-2"
                  >
                    <FileCode className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-200 text-[11px]">Contrato Fornecedor (PDF)</div>
                      <div className="text-[9px] text-slate-400 font-mono">Cláusula de Reajuste 12%</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-teal-800/60 text-xs transition-colors flex items-center gap-2 text-[var(--vx-neon)]"
                  >
                    <ImageIcon className="w-4 h-4 text-[var(--vx-neon)] shrink-0" />
                    <div>
                      <div className="font-bold text-[11px]">{t.uploadLocalFile}</div>
                      <div className="text-[9px] text-slate-400">{t.uploadSubtext}</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-submit-semantic-event"
            disabled={!inputText.trim() || isProcessing || isScanningOcr}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--vx-neon)] hover:bg-[#00d8e4] disabled:opacity-40 disabled:hover:bg-[var(--vx-neon)] text-slate-950 text-xs font-black transition-all shadow-lg shadow-[var(--vx-neon)]/20 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                <span>{t.processing}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>{t.processAos}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* OCR Scanning Overlay Indicator */}
      {isScanningOcr && (
        <div className="p-3 bg-slate-950 border border-[var(--vx-neon)]/60 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <ScanLine className="w-5 h-5 text-[var(--vx-neon)] animate-pulse" />
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <span>{t.ocrScanningTitle} {ocrFileName}</span>
                <span className="w-2 h-2 rounded-full bg-[var(--vx-neon)] animate-ping" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {t.ocrScanningSub}
              </p>
            </div>
          </div>
          <RefreshCw className="w-4 h-4 text-[var(--vx-neon)] animate-spin" />
        </div>
      )}

      {/* Current Ingested Event Display */}
      {currentEvent && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                currentEvent.severity === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                currentEvent.severity === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                'bg-blue-950 text-blue-300 border border-blue-800'
              }`}>
                {currentEvent.severity}
              </span>
              <span className="font-bold text-slate-200">{currentEvent.title}</span>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
              <span>{t.source}: <strong className="text-slate-300">{currentEvent.source}</strong></span>
              <span>{currentEvent.timestamp}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {currentEvent.description}
          </p>

          {/* Metrics Affected Delta Badges */}
          {currentEvent.metricsAffected && currentEvent.metricsAffected.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">{t.immediateImpacts}</span>
              {currentEvent.metricsAffected.map((m, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5 ${
                    m.negativeImpact
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-900/60'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
                  }`}
                >
                  <span>{m.name}:</span>
                  <span className="font-bold">{m.current} → {m.projected}</span>
                  <span className="opacity-80">({m.delta})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
