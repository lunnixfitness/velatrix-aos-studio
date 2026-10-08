import React, { useState } from 'react';
import {
  FileText,
  Send,
  CheckCircle2,
  X,
  Copy,
  Check,
  Scale,
  ShieldCheck
} from 'lucide-react';
import {
  PeticaoHabilitacaoDjen,
  ProtocoloDjenResult
} from '../../services/precatorios/adapters/types';
import { complianceEngine } from '../../services/precatorios/complianceClient';

interface DjenPeticionamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  precatorioId: string;
  numeroProcesso: string;
  tribunal: string;
  numeroOficio: string;
  cedenteNome: string;
  cedenteDocumento: string;
  cessionarioNome: string;
  cessionarioCnpj: string;
  valorCessao: number;
  cessaoId?: string;
  onProtocoloRegistrado?: (protocolo: ProtocoloDjenResult) => void;
}

export const DjenPeticionamentoModal: React.FC<DjenPeticionamentoModalProps> = ({
  isOpen,
  onClose,
  precatorioId,
  numeroProcesso,
  tribunal,
  numeroOficio,
  cedenteNome,
  cedenteDocumento,
  cessionarioNome,
  cessionarioCnpj,
  valorCessao,
  cessaoId,
  onProtocoloRegistrado
}) => {
  const [peticao, setPeticao] = useState<PeticaoHabilitacaoDjen | null>(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Estados de Protocolo Manual do Advogado
  const [showProtocoloForm, setShowProtocoloForm] = useState(false);
  const [numeroProtocolo, setNumeroProtocolo] = useState('');
  const [advogado, setAdvogado] = useState('Dra. Beatriz Mendonça Alencar');
  const [oab, setOab] = useState('OAB/SP 412.980');
  const [registrando, setRegistrando] = useState(false);
  const [protocoloConcluido, setProtocoloConcluido] = useState<ProtocoloDjenResult | null>(null);

  if (!isOpen) return null;

  const handleGerarPeticao = async () => {
    setGerando(true);
    try {
      const res = await complianceEngine.gerarPeticaoDjen({
        precatorioId,
        numeroProcesso,
        tribunal,
        numeroOficio,
        cedenteNome,
        cedenteDocumento,
        cessionarioNome,
        cessionarioCnpj,
        valorCessao
      });
      setPeticao(res);
    } catch (err) {
      console.error('Erro ao gerar petição DJEN:', err);
    } finally {
      setGerando(false);
    }
  };

  const handleCopiarTexto = () => {
    if (!peticao) return;
    navigator.clipboard.writeText(peticao.textoPeticaoCompleto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleRegistrarProtocolo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroProtocolo) return;

    setRegistrando(true);
    try {
      const res = await complianceEngine.registrarProtocoloDjen({
        cessaoId,
        precatorioId,
        numeroProcesso,
        numeroProtocoloJudicial: numeroProtocolo,
        advogadoResponsavel: advogado,
        oabAdvogado: oab
      });

      setProtocoloConcluido(res);
      if (onProtocoloRegistrado) {
        onProtocoloRegistrado(res);
      }
    } catch (err) {
      console.error('Erro ao registrar protocolo judicial:', err);
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono text-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase">
                Publicação DJEN & Protocolo de Habilitação Judicial
              </h3>
              <p className="text-[10px] text-slate-400">
                Art. 100, § 14 da CF/88 c/c Art. 778, § 1º, III do CPC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {protocoloConcluido ? (
          /* Tela de Protocolo Concluído */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Protocolo Eletrônico Registrado com Sucesso!</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                A petição foi protocolada pelo advogado no sistema processual do tribunal. O recibo de juntada foi encadeado na cadeia Merkle de custódia.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Número do Protocolo Judicial:</span>
                <span className="text-white font-bold">{protocoloConcluido.numeroProtocoloJudicial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Advogado Responsável:</span>
                <span className="text-cyan-300 font-bold">{protocoloConcluido.advogadoResponsavel} ({protocoloConcluido.oabAdvogado})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hash SHA-256 do Recibo:</span>
                <code className="text-emerald-400 text-[10px]">{protocoloConcluido.comprovanteReciboHash.slice(0, 24)}...</code>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                Fechar & Prosseguir
              </button>
            </div>
          </div>
        ) : (
          /* Minuta de Petição e Formulário de Protocolo */
          <div className="space-y-4">
            {!peticao ? (
              <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <FileText className="w-8 h-8 text-cyan-400 mx-auto" />
                <p className="text-slate-300 text-xs">
                  Gere a minuta formal da Petição de Notificação de Cessão de Crédito com base na Resolução CNJ 303/2019 e Art. 100 § 14 da CF/88.
                </p>
                <button
                  type="button"
                  onClick={handleGerarPeticao}
                  disabled={gerando}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  {gerando ? 'Gerando Petição...' : 'Gerar Minuta da Petição'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">
                    Texto da Petição Estruturada
                  </span>
                  <button
                    type="button"
                    onClick={handleCopiarTexto}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] cursor-pointer"
                  >
                    {copiado ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 text-[11px] text-slate-300 font-mono max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {peticao.textoPeticaoCompleto}
                </div>

                {!showProtocoloForm ? (
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">
                      Após protocolar no PJe / e-Proc / DJEN do tribunal, registre o número abaixo:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowProtocoloForm(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Registrar Protocolo do Advogado</span>
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleRegistrarProtocolo}
                    className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3"
                  >
                    <div className="font-bold text-emerald-400 text-[11px] uppercase">
                      Informações da Juntada Judicial
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">
                          Número do Protocolo Judicial (Recibo)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="ex: 2026.0098231-TRF3"
                          value={numeroProtocolo}
                          onChange={e => setNumeroProtocolo(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">
                          Advogado Responsável & OAB
                        </label>
                        <input
                          type="text"
                          required
                          value={`${advogado} (${oab})`}
                          onChange={e => setAdvogado(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowProtocoloForm(false)}
                        className="px-3 py-1 rounded bg-slate-800 text-slate-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={registrando}
                        className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{registrando ? 'Gravando no Ledger...' : 'Gravar Protocolo na Cadeia'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
