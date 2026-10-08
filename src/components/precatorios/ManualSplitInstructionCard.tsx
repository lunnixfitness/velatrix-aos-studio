import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Upload,
  Download,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  InstrucaoManualSplit,
  ComprovanteManualUpload,
  ItemPixCopiaECola
} from '../../services/precatorios/adapters/types';
import { complianceEngine } from '../../services/precatorios/complianceClient';

interface ManualSplitInstructionCardProps {
  instrucao: InstrucaoManualSplit;
  cessaoId: string;
  onComprovanteRegistrado?: (comprovante: ComprovanteManualUpload) => void;
}

export const ManualSplitInstructionCard: React.FC<ManualSplitInstructionCardProps> = ({
  instrucao,
  cessaoId,
  onComprovanteRegistrado
}) => {
  const [copiadoIdx, setCopiadoIdx] = useState<number | null>(null);
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const [comprovantes, setComprovantes] = useState<ComprovanteManualUpload[]>(() =>
    complianceEngine.getComprovantesManuais(cessaoId)
  );

  // Estados de formulário de upload manual de comprovante
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [bancoOrigem, setBancoOrigem] = useState('Banco do Brasil S.A.');
  const [autenticacaoBancaria, setAutenticacaoBancaria] = useState('');
  const [valorComprovante, setValorComprovante] = useState(instrucao.valorTotalOperacao);
  const [anexando, setAnexando] = useState(false);

  const copiarPix = (codigo: string, idx: number) => {
    navigator.clipboard.writeText(codigo);
    setCopiadoIdx(idx);
    setTimeout(() => setCopiadoIdx(null), 2500);
  };

  const handleDownloadPdf = async () => {
    setBaixandoPdf(true);
    try {
      const { url, nomeArquivo } = await complianceEngine.gerarPdfInstrucaoManual(instrucao);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao gerar PDF de instrução:', err);
    } finally {
      setBaixandoPdf(false);
    }
  };

  const handleSimularUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeArquivo || !autenticacaoBancaria) return;

    setAnexando(true);
    try {
      const mockBytes = new TextEncoder().encode(
        `COMPROVANTE_BANCARIO_LIQUIDACAO_EXTERNA\nCESSAO:${cessaoId}\nBANCO:${bancoOrigem}\nAUTH:${autenticacaoBancaria}\nVALOR:${valorComprovante}\nDATA:${new Date().toISOString()}`
      );

      const comprovante = await complianceEngine.registrarComprovanteManual({
        cessaoId,
        nomeArquivo,
        bufferOuBytes: mockBytes.buffer as ArrayBuffer,
        anexadoPor: 'Operador / Analista Financeiro',
        bancoOrigem,
        autenticacaoBancaria,
        valorComprovante
      });

      setComprovantes(prev => [...prev, comprovante]);
      setShowUploadForm(false);
      setNomeArquivo('');
      setAutenticacaoBancaria('');
      if (onComprovanteRegistrado) {
        onComprovanteRegistrado(comprovante);
      }
    } catch (err) {
      console.error('Erro ao registrar comprovante:', err);
    } finally {
      setAnexando(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-5">
      {/* Header do Modo Manual */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase">
              Modo Instrução Manual (Sem BaaS)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Cessão: <strong className="text-slate-200">{cessaoId}</strong>
            </span>
          </div>
          <h4 className="text-base font-bold text-white font-mono mt-1">
            Instrução de Liquidação Bancária Externa & Pix Copia-e-Cola
          </h4>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={baixandoPdf}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-mono text-xs font-semibold transition-all cursor-pointer"
        >
          {baixandoPdf ? (
            <span className="animate-pulse">Gerando PDF...</span>
          ) : (
            <>
              <Download className="w-4 h-4 text-amber-400" />
              <span>Baixar PDF de Instrução</span>
            </>
          )}
        </button>
      </div>

      {/* Aviso de Não-Custódia */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 text-xs font-mono">
        <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-slate-300 text-[11px] leading-relaxed">
          <strong className="text-white">A Velatrix NÃO opera financeiramente e NÃO custodia valores.</strong> O tenant executa a liquidação diretamente através de sua conta bancária/internet banking, utilizando os códigos Pix Copia-e-Cola padronizados (EMVCo/BACEN) gerados abaixo. Ao final, realize o upload do comprovante para auditoria e amarração criptográfica.
        </p>
      </div>

      {/* Lista de Destinatários do Split com Pix Copia e Cola */}
      <div className="space-y-3">
        <h5 className="text-xs font-mono font-bold uppercase text-slate-400">
          Destinatários da Ordem de Pagamento ({instrucao.itensPix.length})
        </h5>

        <div className="grid grid-cols-1 gap-3">
          {instrucao.itensPix.map((item: ItemPixCopiaECola, idx: number) => {
            const isCopiado = copiadoIdx === idx;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all font-mono text-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-white text-xs">{item.destinatario}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {item.papel}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Valor Líquido</span>
                    <span className="text-sm font-bold text-emerald-400">
                      R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]">
                  <div className="truncate">
                    <span className="text-slate-500 mr-2">Chave Pix:</span>
                    <code className="text-cyan-300 font-bold">{item.chavePix}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copiarPix(item.codigoCopiaECola, idx)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                  >
                    {isCopiado ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Pix</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção de Upload e Registro do Comprovante Externo */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h5 className="text-xs font-mono font-bold uppercase text-slate-200">
              Comprovantes de Liquidação Externa Registrados ({comprovantes.length})
            </h5>
          </div>

          {!showUploadForm && (
            <button
              type="button"
              onClick={() => setShowUploadForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold cursor-pointer transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Anexar Comprovante do Banco</span>
            </button>
          )}
        </div>

        {/* Formulário de Anexação de Comprovante */}
        {showUploadForm && (
          <form
            onSubmit={handleSimularUpload}
            className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-emerald-400 text-[11px] uppercase">
                Registrar Comprovante de Pagamento Bancário
              </span>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="text-slate-500 hover:text-slate-300 text-[11px]"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Nome do Arquivo (PDF / Imagem)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: comprovante_ted_pix_credor.pdf"
                  value={nomeArquivo}
                  onChange={e => setNomeArquivo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Banco / Instituição de Origem
                </label>
                <select
                  value={bancoOrigem}
                  onChange={e => setBancoOrigem(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                >
                  <option value="Banco do Brasil S.A.">Banco do Brasil S.A. (001)</option>
                  <option value="Itaú Unibanco S.A.">Itaú Unibanco S.A. (341)</option>
                  <option value="Banco Bradesco S.A.">Banco Bradesco S.A. (237)</option>
                  <option value="Banco Santander Brasil">Banco Santander Brasil (033)</option>
                  <option value="BTG Pactual">BTG Pactual (208)</option>
                  <option value="Outro Internet Banking PJ">Outro Internet Banking PJ</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Código de Autenticação Bancária (Bacen / Comprovante)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: 8B9.2A1.4FF.009.E21"
                  value={autenticacaoBancaria}
                  onChange={e => setAutenticacaoBancaria(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Valor Comprovado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valorComprovante}
                  onChange={e => setValorComprovante(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={anexando}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                {anexando ? (
                  <span className="animate-pulse">Calculando SHA-256 e Registrando...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirmar & Encadear no Merkle Ledger</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Lista de Comprovantes Registrados */}
        {comprovantes.length === 0 ? (
          <div className="p-3 text-center rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs font-mono text-slate-500">
            Nenhum comprovante bancário manual anexado até o momento.
          </div>
        ) : (
          <div className="space-y-2">
            {comprovantes.map((comp: ComprovanteManualUpload, i: number) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-bold text-slate-200">{comp.nomeArquivo}</div>
                    <div className="text-[10px] text-slate-500">
                      {comp.bancoOrigem} • Auth: <span className="text-slate-300">{comp.autenticacaoBancaria}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-bold block mb-0.5">
                    Hash SHA-256 Encadeado
                  </span>
                  <code className="text-[9px] text-slate-500">
                    {comp.sha256Arquivo.slice(0, 16)}...
                  </code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
