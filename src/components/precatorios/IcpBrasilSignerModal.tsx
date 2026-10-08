import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Key,
  ShieldCheck,
  X,
  AlertCircle,
  ExternalLink,
  Cpu
} from 'lucide-react';
import {
  CertificadoDigitalInfo,
  AssinaturaDigitalPkiResult
} from '../../services/precatorios/adapters/types';
import { lacunaWebPkiService } from '../../services/precatorios/pki/lacunaWebPkiService';
import { complianceEngine } from '../../services/precatorios/complianceClient';

interface IcpBrasilSignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentoId: string;
  conteudoDocumento: string;
  cessaoId?: string;
  onAssinaturaConcluida?: (resultado: AssinaturaDigitalPkiResult) => void;
}

export const IcpBrasilSignerModal: React.FC<IcpBrasilSignerModalProps> = ({
  isOpen,
  onClose,
  documentoId,
  conteudoDocumento,
  cessaoId,
  onAssinaturaConcluida
}) => {
  const [certificados, setCertificados] = useState<CertificadoDigitalInfo[]>([]);
  const [certSelecionado, setCertSelecionado] = useState<CertificadoDigitalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [assinando, setAssinando] = useState(false);
  const [resultado, setResultado] = useState<AssinaturaDigitalPkiResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const carregar = async () => {
      setLoading(true);
      try {
        const certs = await lacunaWebPkiService.listarCertificadosIcpBrasil();
        if (isMounted) {
          setCertificados(certs);
          if (certs.length > 0) setCertSelecionado(certs[0]);
        }
      } catch (err) {
        console.error('Erro ao listar certificados ICP-Brasil:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    carregar();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssinar = async () => {
    if (!certSelecionado) return;
    setAssinando(true);

    try {
      const res = await complianceEngine.assinarComIcpBrasilA1({
        documentoId,
        conteudoDocumento,
        cessaoId,
        certificado: certSelecionado
      });

      setResultado(res);
      if (onAssinaturaConcluida) {
        onAssinaturaConcluida(res);
      }
    } catch (err) {
      console.error('Erro ao assinar com ICP-Brasil:', err);
    } finally {
      setAssinando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono text-xs">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase">
                Assinador Digital ICP-Brasil A1 (Lacuna Web PKI)
              </h3>
              <p className="text-[10px] text-slate-400">
                Padrão PAdES com carimbo do tempo oficial (Medida Provisória nº 2.200-2/2001)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {resultado ? (
          /* Tela de Sucesso na Assinatura */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Assinatura Digital ICP-Brasil A1 Concluída!</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                O documento foi assinado digitalmente com sucesso e o pacote PAdES com carimbo do tempo foi encadeado na cadeia Merkle de cessões.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
              <div>
                <span className="text-slate-500 block uppercase text-[9px]">Signatário</span>
                <span className="text-white font-bold">{resultado.certificado.subjectName}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px]">Autoridade Certificadora</span>
                <span className="text-cyan-300">{resultado.certificado.emissorAC}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px]">Carimbo do Tempo ICP</span>
                <span className="text-slate-300">{resultado.carimboDoTempoIcpBrasil}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px]">Hash SHA-256 do Pacote Assinado</span>
                <code className="text-emerald-400 text-[10px] break-all">{resultado.pacotePadesCadesHash}</code>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        ) : (
          /* Formulário de Seleção de Certificado e Assinatura */
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-300">
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Selecione o certificado digital instalado na sua máquina (A1 ou token A3 via extensão Lacuna Web PKI).
              </span>
            </div>

            {loading ? (
              <div className="p-6 text-center text-slate-400 animate-pulse">
                Procurando certificados digitais ICP-Brasil...
              </div>
            ) : certificados.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                Nenhum certificado digital detectado no repositório.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-400 font-bold block">
                  Certificados Disponíveis ({certificados.length})
                </label>
                <div className="space-y-2">
                  {certificados.map((c, i) => {
                    const isSelected = certSelecionado?.serialNumber === c.serialNumber;
                    return (
                      <div
                        key={i}
                        onClick={() => setCertSelecionado(c)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <strong className="text-xs text-white">{c.subjectName}</strong>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-bold">
                            ICP-Brasil ({c.tipo})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Emissor: {c.emissorAC} • Válido até: {new Date(c.validadeAte).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAssinar}
                disabled={assinando || !certSelecionado}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 cursor-pointer"
              >
                {assinando ? (
                  <span className="animate-pulse">Assinando com Lacuna PKI...</span>
                ) : (
                  <>
                    <FileCheck2 className="w-4 h-4" />
                    <span>Assinar Digitalmente com A1</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
