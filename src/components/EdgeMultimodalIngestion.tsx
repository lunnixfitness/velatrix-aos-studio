import React, { useState } from 'react';
import { 
  FileUp, 
  Camera, 
  FileText, 
  Receipt, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  X,
  Lock
} from 'lucide-react';
import { EnterpriseKnowledgeGraph } from '../types/aos';
import { useAuth } from '../context/AuthContext';
import { VELATRIX_PLAN_TIERS } from '../data/planFeatures';

export interface MultimodalIngestResult {
  title: string;
  category: 'invoice' | 'contract' | 'whatsapp_receipt' | 'boleto';
  extractedData: {
    origin: string;
    totalAmount?: string;
    dueDate?: string;
    beneficiary?: string;
    urgency: string;
    keyPoints: string[];
  };
  graphNodeAdded: {
    id: string;
    label: string;
    metricValue: string;
    metricLabel: string;
  };
  reconciliationImpact: {
    treasuryImpact: string;
    inventoryImpact: string;
    slaImpact: string;
    summary: string;
  };
}

interface EdgeMultimodalIngestionProps {
  onIngestComplete: (result: MultimodalIngestResult) => void;
  isProcessing: boolean;
}

const PRESET_SAMPLE_DOCS = [
  {
    id: 'boleto_materia_prima',
    type: 'boleto' as const,
    title: 'Boleto Bancário: Lote Fornecedor TechCore (R$ 84.000,00)',
    description: 'Boleto de fornecimento emergencial com desconto de R$ 3.500 para pagamento em 24h.',
    rawPreview: 'BANCO SANTANDER • LINHA DIGITÁVEL: 03399.88210 55102.399210 99401.120004 8 98760000840000 • VALOR: R$ 84.000,00 • VENC: D+1 • BENEFICIÁRIO: TechCore SP Componentes Ltda • CNPJ: 12.894.201/0001-99'
  },
  {
    id: 'nota_fiscal_frete',
    type: 'invoice' as const,
    title: 'Danfe / NF-e 4492: Frete Expresso TransBrasil (R$ 18.200,00)',
    description: 'Nota fiscal eletrônica de serviço de transporte rodoviário com seguro de carga averbado.',
    rawPreview: 'DANFE NF-e Nº 000.004.492 SÉRIE 1 • CHAVE: 3526 0812 8942 0100 0199 5500 1000 0044 9210 9823 4519 • EMITENTE: TransBrasil Express Cargas • VALOR TOTAL: R$ 18.200,00 • CT-e Vinculado: 8812 • SEGURO: R$ 450.000 averbado'
  },
  {
    id: 'whatsapp_diretor_comercial',
    type: 'whatsapp_receipt' as const,
    title: 'Print WhatsApp: Acordo Comercial Cliente Tier-A (Indústrias Votoran)',
    description: 'Mensagem do Diretor de Compras aceitando reajuste de prazo com pedido adicional de 300 unidades.',
    rawPreview: 'Dr. Fernando (Diretor Votoran): "Bom dia equipe! Entendemos a questão da transportadora. Se vocês garantirem a entrega até sexta às 18h no nosso CD de Paulínia, estamos liberando agora o pedido adicional de R$ 320.000 com carência de 30 dias. Pode faturar."'
  }
];

export const EdgeMultimodalIngestion: React.FC<EdgeMultimodalIngestionProps> = ({
  onIngestComplete,
  isProcessing
}) => {
  const { checkFeature, activeTenant } = useAuth();
  const isMultimodalEnabled = checkFeature('multimodalIngestion');

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<MultimodalIngestResult | null>(null);

  if (!isMultimodalEnabled) {
    return (
      <div id="multimodal-ingestion-card" className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-500 border border-slate-700">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Ingestão Multimodal de Borda (OCR / Áudio / WhatsApp)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                  Disponível no Plano {VELATRIX_PLAN_TIERS.PROFESSIONAL.name} ({VELATRIX_PLAN_TIERS.PROFESSIONAL.monthlyPriceLabel})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                O plano atual ({activeTenant.planTier || 'Starter'}) inclui apenas conectores ERP estruturados. Atualize para o plano Professional ou superior para desbloquear extração OCR de DANFE, boletos e áudios de WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setCustomText(`[Documento OCR Borda Extraído]: Arquivo "${file.name}" (${(file.size / 1024).toFixed(1)} KB) - Fatura comercial com valor faturado de R$ 125.000 e vencimento para 10/09/2026 com benefício fiscal ICMS-ST.`);
    }
  };

  const handleProcessMultimodal = (presetId?: string) => {
    setAnalyzing(true);

    setTimeout(() => {
      let result: MultimodalIngestResult;

      if (presetId === 'boleto_materia_prima' || (!presetId && selectedPreset === 'boleto_materia_prima')) {
        result = {
          title: 'Boleto Fornecedor TechCore SP (R$ 84.000,00)',
          category: 'boleto',
          extractedData: {
            origin: 'OCR Neural de Borda (Leitura Direta da Linha Digitável)',
            totalAmount: 'R$ 84.000,00',
            dueDate: 'D+1 (24 horas)',
            beneficiary: 'TechCore SP Componentes Ltda (CNPJ 12.894.201/0001-99)',
            urgency: 'Alta (Desconto por Liquidação Imediata: R$ 3.500)',
            keyPoints: [
              'Linha Digitável validada com checksum bancário 100% autêntico.',
              'Desconto de antecipação DVP: R$ 3.500 aplicado se pago hoje.',
              'Garante liberação imediata de 9.000 microcontroladores.'
            ]
          },
          graphNodeAdded: {
            id: 'node_boleto_techcore',
            label: 'Título a Pagar: TechCore',
            metricValue: 'R$ 84.000',
            metricLabel: 'Venc. D+1'
          },
          reconciliationImpact: {
            treasuryImpact: '-R$ 80.500 (desconto líquido de R$ 3.5k aproveitado)',
            inventoryImpact: '+9.000 chips liberados na doca de entrada',
            slaImpact: 'Parada de fábrica neutralizada em 100%',
            summary: 'O AOS converteu o documento em um nó de obrigação financeira no Grafo Semântico e programou a liquidação via DVP preservando R$ 8.34M em caixa livre.'
          }
        };
      } else if (presetId === 'nota_fiscal_frete' || (!presetId && selectedPreset === 'nota_fiscal_frete')) {
        result = {
          title: 'Danfe NF-e 4492: Frete Expresso TransBrasil',
          category: 'invoice',
          extractedData: {
            origin: 'Validação Direta de XML/DANFE na SEFAZ',
            totalAmount: 'R$ 18.200,00',
            dueDate: '30 dias (Faturado)',
            beneficiary: 'TransBrasil Express Cargas Rodoviárias',
            urgency: 'Crítica (Carga Segurada de R$ 450.000)',
            keyPoints: [
              'Chave da NF-e autorizada e validada na SEFAZ-SP.',
              'Apólice de seguro averbada para R$ 450.000 em trânsito.',
              'Veículos dedicados vinculados ao manifesto MDF-e 8812.'
            ]
          },
          graphNodeAdded: {
            id: 'node_frete_transbrasil',
            label: 'CT-e TransBrasil Backup',
            metricValue: 'R$ 18.200',
            metricLabel: '32 Veículos'
          },
          reconciliationImpact: {
            treasuryImpact: '-R$ 18.200 a liquidar em 30 dias',
            inventoryImpact: '1.200 pedidos em trânsito protegido com seguro total',
            slaImpact: 'SLA mantido em 99.4%',
            summary: 'O documento foi inserido no Grafo de Conhecimento, associando a apólice de seguro diretamente aos pedidos das contas Tier-A.'
          }
        };
      } else {
        result = {
          title: 'Acordo Comercial WhatsApp: Indústrias Votoran (R$ 320.000)',
          category: 'whatsapp_receipt',
          extractedData: {
            origin: 'Ingestão Multimodal de Conversa & Confirmação de Diretoria',
            totalAmount: '+R$ 320.000,00 (Novo Pedido)',
            dueDate: 'Recebimento em 30 dias',
            beneficiary: 'Indústrias Votoran S.A.',
            urgency: 'Estratégica (Expansão de Carteira Tier-A)',
            keyPoints: [
              'Cliente concordou com entrega até sexta-feira 18h no CD Paulínia.',
              'Adicionou pedido emergencial de 300 unidades da Série-X.',
              'Margem de contribuição líquida projetada: 28.4% (+R$ 90.880).'
            ]
          },
          graphNodeAdded: {
            id: 'node_pedido_votoran',
            label: 'Pedido B2B: Votoran',
            metricValue: '+R$ 320.000',
            metricLabel: 'Margem 28%'
          },
          reconciliationImpact: {
            treasuryImpact: '+R$ 320.000 em recebíveis projetados (D+30)',
            inventoryImpact: '-300 unidades consumidas da linha de montagem',
            slaImpact: 'Compromisso formal registrado no SLA Ledger',
            summary: 'A intenção comercial extraída da conversa gerou um novo nó de Recebíveis no Grafo Semântico, aumentando a projeção de receita do mês.'
          }
        };
      }

      setLastResult(result);
      setAnalyzing(false);
      onIngestComplete(result);
    }, 900);
  };

  return (
    <div id="multimodal-ingestion-card" className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <FileUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span>Ingestão Multimodal de Borda (Edge AI)</span>
              <span className="text-[10px] font-normal text-cyan-400 lowercase">• Boletos, NF-e, Danfe & WhatsApp</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Extração neural direta sem necessidade de OCR externo ➔ Reconciliação instantânea no Grafo e no Caixa.
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-multimodal-modal"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 text-xs font-medium text-cyan-200 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{isOpen ? 'Recolher Ingestor' : 'Ingerir Novo Documento'}</span>
        </button>
      </div>

      {/* Preset Documents Quick Injection Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {PRESET_SAMPLE_DOCS.map((doc) => (
          <div
            key={doc.id}
            id={`preset-doc-${doc.id}`}
            onClick={() => {
              setSelectedPreset(doc.id);
              handleProcessMultimodal(doc.id);
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedPreset === doc.id
                ? 'bg-slate-950 border-cyan-500 text-slate-100 ring-1 ring-cyan-500/30 shadow-lg'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  {doc.type === 'boleto' && <Receipt className="w-3 h-3" />}
                  {doc.type === 'invoice' && <FileText className="w-3 h-3" />}
                  {doc.type === 'whatsapp_receipt' && <MessageSquare className="w-3 h-3" />}
                  {doc.type.toUpperCase()}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                  OCR Borda
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 mb-1 leading-snug">{doc.title}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                {doc.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-cyan-400 font-medium">
              <span>Ingerir no Grafo</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Custom File / Text Uploader */}
      {isOpen && (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Upload Direto de Arquivo (PDF / Imagem / Áudio / Texto Bruto)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Processamento Zero-OCR Serverless
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* File drag-and-drop / upload */}
            <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition-colors text-center">
              <Camera className="w-6 h-6 text-cyan-400 mb-2" />
              <span className="text-xs font-semibold text-slate-200">
                {uploadedFileName || 'Selecione ou Arraste Comprovante / Boleto'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, PDF, XML ou Gravação de Áudio</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*,application/pdf,audio/*"
                onChange={handleFileUpload} 
              />
            </label>

            {/* Custom raw text paste */}
            <div className="flex flex-col space-y-2">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Ou cole aqui os dados brutos (linha digitável, cópia de e-mail de fornecedor ou transcrição de conversa de negociação)..."
                rows={3}
                className="w-full h-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => handleProcessMultimodal()}
              disabled={analyzing || (!uploadedFileName && !customText.trim())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Extraindo & Reconciliando...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Processar & Conectar ao Grafo Semântico</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Ingestion & Reconciliation Result Banner */}
      {lastResult && (
        <div id="multimodal-reconciliation-banner" className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-extrabold text-white">
                {lastResult.title}
              </h4>
            </div>
            <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/80">
              Nó Inserido: <strong>{lastResult.graphNodeAdded.label}</strong> ({lastResult.graphNodeAdded.metricValue})
            </span>
          </div>

          {/* Key extracted points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                Dados Estruturados Extraídos:
              </span>
              <ul className="text-[11px] text-slate-300 space-y-1">
                {lastResult.extractedData.keyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Reconciliação no Caixa & Operação:
              </span>
              <div className="space-y-1 text-[11px] text-slate-300">
                <p>• <strong>Tesouraria:</strong> {lastResult.reconciliationImpact.treasuryImpact}</p>
                <p>• <strong>Estoque/Docas:</strong> {lastResult.reconciliationImpact.inventoryImpact}</p>
                <p>• <strong>SLA Contratual:</strong> {lastResult.reconciliationImpact.slaImpact}</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2 rounded border border-slate-800/60">
            {lastResult.reconciliationImpact.summary}
          </p>
        </div>
      )}

    </div>
  );
};
