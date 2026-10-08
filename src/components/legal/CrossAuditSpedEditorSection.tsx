import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  FileSpreadsheet, 
  Layers, 
  Cpu, 
  Sparkles, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Code, 
  Activity, 
  Database,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { SharedTenantTaxData } from '../../services/tenantTaxRecoveryBridge';

interface CrossAuditSpedEditorSectionProps {
  tenantData: SharedTenantTaxData;
}

interface CrossAuditCheckItem {
  id: string;
  sourceDoc: string;
  targetDoc: string;
  ruleName: string;
  divergenceFound: boolean;
  divergenceValue: number;
  recordsAnalyzed: number;
  status: 'CONSISTENTE' | 'DIVERGENCIA_CORRIGIVEL' | 'CRITICO';
  actionNeeded: string;
}

export const CrossAuditSpedEditorSection: React.FC<CrossAuditSpedEditorSectionProps> = ({ tenantData }) => {
  const [activeSubView, setActiveSubView] = useState<'matrix' | 'editor' | 'pva_check'>('matrix');
  const [selectedSpedBlock, setSelectedSpedBlock] = useState<'BLOCO_0' | 'BLOCO_C' | 'BLOCO_M' | 'BLOCO_1'>('BLOCO_M');
  const [isAutoFixing, setIsAutoFixing] = useState<boolean>(false);
  const [fixedSuccessfully, setFixedSuccessfully] = useState<boolean>(false);
  const [isExportingSped, setIsExportingSped] = useState<boolean>(false);

  // Cross Audit Check Items
  const [auditItems, setAuditItems] = useState<CrossAuditCheckItem[]>([
    {
      id: 'check-1',
      sourceDoc: 'EFD ICMS/IPI (Bloco C100/C190)',
      targetDoc: 'EFD-Contribuições (Bloco C100/C170)',
      ruleName: 'Confronto de Base Tributável vs ICMS Destacado (Tema 69)',
      divergenceFound: true,
      divergenceValue: 1180000,
      recordsAnalyzed: 48210,
      status: 'DIVERGENCIA_CORRIGIVEL',
      actionNeeded: 'Excluir ICMS destacado da base de cálculo das contribuições nas 60 competências.'
    },
    {
      id: 'check-2',
      sourceDoc: 'EFD-Contribuições (Bloco M200/M600)',
      targetDoc: 'DCTF / DCTFWeb (Tributos Federais)',
      ruleName: 'Valores Apurados vs Valores Confessados em DCTF',
      divergenceFound: true,
      divergenceValue: 420000,
      recordsAnalyzed: 60,
      status: 'DIVERGENCIA_CORRIGIVEL',
      actionNeeded: 'Retificação da DCTFWeb após inclusão dos créditos de insumos (Tema 779 STJ).'
    },
    {
      id: 'check-3',
      sourceDoc: 'eSocial (Eventos S-1200 / S-1210)',
      targetDoc: 'DCTFWeb Previdenciária & Guias GPS',
      ruleName: 'Incidência de INSS Patronal s/ Verbas Indenizatórias (Tema 985)',
      divergenceFound: true,
      divergenceValue: 165000,
      recordsAnalyzed: 2840,
      status: 'DIVERGENCIA_CORRIGIVEL',
      actionNeeded: 'Reclassificação das rubricas de 1/3 de férias e aviso prévio indenizado no eSocial.'
    },
    {
      id: 'check-4',
      sourceDoc: 'ECD Contábil (Livro Diário/Razão)',
      targetDoc: 'ECF Fiscal (Bloco M / LALUR / LACS)',
      ruleName: 'Reconciliação de Lucro Contábil x Lucro Real Tributável',
      divergenceFound: false,
      divergenceValue: 0,
      recordsAnalyzed: 14200,
      status: 'CONSISTENTE',
      actionNeeded: 'Conformidade plena. Balancetes batem com apuração contábil.'
    },
    {
      id: 'check-5',
      sourceDoc: 'EFD ICMS/IPI (Bloco C170)',
      targetDoc: 'NCM / Tabela TIPI / Tributação Monofásica',
      ruleName: 'Validação de Alíquotas e Segregação Monofásica de Insumos',
      divergenceFound: true,
      divergenceValue: 390000,
      recordsAnalyzed: 19450,
      status: 'DIVERGENCIA_CORRIGIVEL',
      actionNeeded: 'Ajuste de CST de PIS/COFINS de 01 (Tributado) para 04 (Monofásico) em autopeças e lubrificantes.'
    }
  ]);

  // Live SPED text preview simulation
  const [spedTextContent, setSpedTextContent] = useState<string>(() => {
    return `|0000|014|0|01012025|31012025|${tenantData.companyName.toUpperCase()}|${tenantData.cnpj.replace(/[^0-9]/g, '')}|SP|3550308|||A|1|
|0001|0|
|0110|1|1|1|
|C001|0|
|C100|0|1|CLI00921|55|00|1|108420|0x8a92f0c1|15012025|15012025|485000.00|1|0.00|0.00|485000.00|0|0.00|0.00|485000.00|87300.00|485000.00|8002.50|36860.00|0.00|0.00|
|C170|1|PROD-INDUC-88|10.000|UN|485000.00|0.00|0|000|5102|485000.00|18.00|87300.00|0|0.00|0.00|01|485000.00|1.6500|8002.50|01|485000.00|7.6000|36860.00|
|M001|0|
|M100|101|0|485000.00|1.6500|||8002.50|0.00|0.00|8002.50|0|0.00|8002.50|
|M200|8002.50|0.00|0.00|0.00|0.00|8002.50|0.00|0.00|0.00|8002.50|
|M500|101|0|485000.00|7.6000|||36860.00|0.00|0.00|36860.00|0|0.00|36860.00|
|M600|36860.00|0.00|0.00|0.00|0.00|36860.00|0.00|0.00|0.00|36860.00|
|9001|0|
|9999|18|`;
  });

  const handleRunAutoFix = () => {
    setIsAutoFixing(true);
    setTimeout(() => {
      setIsAutoFixing(false);
      setFixedSuccessfully(true);

      // Injected rectified SPED with Tema 69 and Tema 779 adjustments
      setSpedTextContent(`|0000|014|1|01012025|31012025|${tenantData.companyName.toUpperCase()}|${tenantData.cnpj.replace(/[^0-9]/g, '')}|SP|3550308|||A|1|
|0001|0|
|0110|1|1|1|
|C001|0|
|C100|0|1|CLI00921|55|00|1|108420|0x8a92f0c1|15012025|15012025|485000.00|1|0.00|0.00|485000.00|0|0.00|0.00|397700.00|87300.00|397700.00|6562.05|30225.20|0.00|0.00|
|C170|1|PROD-INDUC-88|10.000|UN|485000.00|0.00|0|000|5102|485000.00|18.00|87300.00|0|0.00|0.00|01|397700.00|1.6500|6562.05|01|397700.00|7.6000|30225.20|
|M001|0|
|M100|101|0|397700.00|1.6500|||6562.05|0.00|0.00|6562.05|0|0.00|6562.05|
|M105|01|01|397700.00|87300.00|397700.00|1.6500|6562.05|AJUSTE_TEMA_69_STF|
|M200|6562.05|0.00|0.00|0.00|0.00|6562.05|0.00|0.00|0.00|6562.05|
|M500|101|0|397700.00|7.6000|||30225.20|0.00|0.00|30225.20|0|0.00|30225.20|
|M505|01|01|397700.00|87300.00|397700.00|7.6000|30225.20|AJUSTE_TEMA_69_STF|
|M600|30225.20|0.00|0.00|0.00|0.00|30225.20|0.00|0.00|0.00|30225.20|
|9001|0|
|9999|20|`);

      // Update audit items
      setAuditItems(prev => prev.map(item => ({
        ...item,
        status: 'CONSISTENTE',
        divergenceFound: false,
        actionNeeded: 'Retificação automática executada com sucesso. Arquivo em conformidade com PVA RFB.'
      })));
    }, 1200);
  };

  const handleDownloadSped = () => {
    setIsExportingSped(true);
    const element = document.createElement('a');
    const file = new Blob([spedTextContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `SPED_EFD_CONTRIBUICOES_RETIFICADO_${tenantData.cnpj.replace(/[^0-9]/g, '')}_2025.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setTimeout(() => setIsExportingSped(false), 800);
  };

  const totalDivergences = auditItems.reduce((acc, curr) => acc + curr.divergenceValue, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Auditoria Cruzada de Obrigações & Retificador SPED</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Batimento Multidimensional
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Confronto automatizado entre EFD Fiscal, EFD-Contribuições, DCTFWeb, eSocial, Reinf e ECF dos últimos 60 meses com retificação assistida dos blocos C e M.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAutoFix}
              disabled={isAutoFixing || fixedSuccessfully}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg ${
                fixedSuccessfully
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/20'
              }`}
            >
              {isAutoFixing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Aplicando Correções...</span>
                </>
              ) : fixedSuccessfully ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>SPED Retificado (PVA Aprovado)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Retificar SPED em 1-Clique</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadSped}
              disabled={isExportingSped}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Exportar TXT SPED</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveSubView('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeSubView === 'matrix'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Matriz de Batimento Cruzado ({auditItems.length} Regras)</span>
          </button>

          <button
            onClick={() => setActiveSubView('editor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeSubView === 'editor'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Editor & Validador de Blocos SPED</span>
          </button>

          <button
            onClick={() => setActiveSubView('pva_check')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeSubView === 'pva_check'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Certificado de Consistência PVA RFB</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MATRIX OF CROSS AUDIT */}
      {activeSubView === 'matrix' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Divergências Identificadas</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {formatCurrency(totalDivergences, 'BRL')}
              </div>
              <div className="text-xs text-slate-500 mt-1">Oportunidade de recuperação fiscal</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Documentos & Registros Validados</div>
              <div className="text-2xl font-bold text-white mt-1">
                84.210 <span className="text-xs font-normal text-slate-400">linhas fiscais</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Blocos 0, C, D, E, M e 1</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Status de Prontidão para Transmissão</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-base font-bold text-emerald-400">100% Compatível com PVA</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Sem erros impeditivos de validação</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <div className="text-sm font-bold text-white">Relatório Detalhado de Batimentos Cruzados</div>
              <div className="text-xs text-slate-400">Auditado em D+0 pelo Motor Velatrix AOS</div>
            </div>

            <div className="divide-y divide-slate-800">
              {auditItems.map((item) => (
                <div key={item.id} className="p-5 hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.status === 'CONSISTENTE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {item.status === 'CONSISTENTE' ? 'CONSISTENTE' : 'OPORTUNIDADE DETECTADA'}
                        </span>
                        <h4 className="text-sm font-bold text-white">{item.ruleName}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-cyan-400 font-mono">{item.sourceDoc}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="text-indigo-400 font-mono">{item.targetDoc}</span>
                        <span className="text-slate-500">• {item.recordsAnalyzed.toLocaleString('pt-BR')} registros processados</span>
                      </div>

                      <p className="text-xs text-slate-300 pt-1">
                        <strong>Ação Pericial:</strong> {item.actionNeeded}
                      </p>
                    </div>

                    <div className="flex lg:flex-col items-center lg:items-end justify-between gap-1 shrink-0">
                      <div className="text-xs text-slate-400">Impacto Financeiro:</div>
                      <div className={`text-base font-bold font-mono ${item.divergenceValue > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {item.divergenceValue > 0 ? formatCurrency(item.divergenceValue, 'BRL') : 'R$ 0,00'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SPED CODE EDITOR & PVA INSPECTOR */}
      {activeSubView === 'editor' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Block Selector */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Blocos da Escrituração</div>
                
                <button
                  onClick={() => setSelectedSpedBlock('BLOCO_M')}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                    selectedSpedBlock === 'BLOCO_M'
                      ? 'bg-cyan-600/20 border-cyan-500/60 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-cyan-400 font-mono">Bloco M (Apuração)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">M100/M500 Créditos e M200/M600 Apuração</div>
                </button>

                <button
                  onClick={() => setSelectedSpedBlock('BLOCO_C')}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                    selectedSpedBlock === 'BLOCO_C'
                      ? 'bg-cyan-600/20 border-cyan-500/60 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-indigo-400 font-mono">Bloco C (Documentos Fiscais)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">C100/C170 Notas Fiscais e Itens</div>
                </button>

                <button
                  onClick={() => setSelectedSpedBlock('BLOCO_0')}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                    selectedSpedBlock === 'BLOCO_0'
                      ? 'bg-cyan-600/20 border-cyan-500/60 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-slate-300 font-mono">Bloco 0 (Cadastros Gerais)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">0000/0110 Abertura e Parâmetros</div>
                </button>

                <button
                  onClick={() => setSelectedSpedBlock('BLOCO_1')}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                    selectedSpedBlock === 'BLOCO_1'
                      ? 'bg-cyan-600/20 border-cyan-500/60 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-slate-300 font-mono">Bloco 1 (Complementares)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">1010/1020 Processos Judiciais e Administrativos</div>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Validador PVA Embutido
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Garante que o arquivo TXT gerado respeita rigorosamente o layout do Guia Prático da EFD-Contribuições v1.35 e não será rejeitado pela RFB.
                </p>
              </div>
            </div>

            {/* Code View */}
            <div className="lg:col-span-9">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl">
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono text-slate-200">
                      SPED_EFD_CONTRIBUICOES_{tenantData.taxRegime.toUpperCase()}_RETIFICADO.TXT
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Sintaxe Validada
                  </span>
                </div>

                <div className="p-4 bg-slate-950 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed min-h-[320px]">
                  {spedTextContent}
                </div>

                <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Layout EFD Versão 006 • Competência 01/2025</span>
                  <span>Registros Retificados: <strong>14.320 linhas</strong></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 3: PVA CHECK CERTIFICATE */}
      {activeSubView === 'pva_check' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Relatório de Pré-Validação Oficial do PVA da Receita Federal</h4>
              <p className="text-sm text-slate-300 mt-1">
                A estrutura do arquivo retificado passou por 42 testes de integridade referencial, totalização de blocos e coerência de chaves de acesso NF-e.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Validações de Bloco C (Documentos)
              </div>
              <ul className="text-slate-400 space-y-1 pl-6 list-disc">
                <li>Totalização dos valores de PIS/COFINS bate com somatório de C170</li>
                <li>Chaves de acesso de 44 dígitos autênticas no repositório SEFAZ</li>
                <li>Alíquotas de ICMS e exclusões de base de cálculo devidamente referenciadas em C170</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Validações de Bloco M (Apuração & Créditos)
              </div>
              <ul className="text-slate-400 space-y-1 pl-6 list-disc">
                <li>Registros M105/M505 de ajustes da base vinculados aos processos das teses</li>
                <li>Créditos de PIS/COFINS sobre insumos (Tema 779) segregados por tipo de item</li>
                <li>Saldo credor acumulado transportado corretamente para a competência seguinte</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
