import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Download, 
  Database, 
  EyeOff, 
  Key, 
  Sparkles,
  Server,
  UserCheck,
  Check,
  Eye
} from 'lucide-react';
import { TaxRecoveryDocPreviewModal } from '../legal/TaxRecoveryDocPreviewModal';
import { generateRipdDpiaPdf } from '../../services/pdfReportService';

export interface LgpdBankingComplianceCardProps {
  onOpenRipdPreview?: () => void;
  companyName?: string;
  cnpj?: string;
}

export const LgpdBankingComplianceCard: React.FC<LgpdBankingComplianceCardProps> = ({
  onOpenRipdPreview,
  companyName = 'Vortex Logística & Manufatura S.A.',
  cnpj = '33.041.260/0001-88'
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDownloadingDirectPdf, setIsDownloadingDirectPdf] = useState<boolean>(false);

  const handleOpenPreviewOrDownload = () => {
    if (onOpenRipdPreview) {
      onOpenRipdPreview();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleDirectPdfDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloadingDirectPdf(true);
    try {
      generateRipdDpiaPdf({
        companyName,
        cnpj,
        dpoEmail: 'dpo@velatrix.com.br',
        dpoName: 'Conselho de Governança & DPO Velatrix AOS',
        signatoryName: 'Dr. Marcelo Vasconcelos Ribeiro',
        signatoryRole: 'Encarregado de Proteção de Dados (DPO) • Art. 41 da LGPD'
      });
    } finally {
      setTimeout(() => setIsDownloadingDirectPdf(false), 800);
    }
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Governança LGPD &amp; Sigilo Bancário / Fiscal</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% Conforme (Lei 13.709/18 &amp; LC 105/01)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Blindagem jurídica dos dados transacionais do ERP, notas fiscais e extratos bancários sob enclaves de processamento soberanos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenPreviewOrDownload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold border border-emerald-400/40 transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer"
              title="Abrir Pré-visualização Oficial do Relatório RIPD (DPIA) com Protocolo e Hash SHA-256"
            >
              <Eye className="w-4 h-4 text-emerald-200" />
              <span>Baixar Relatório RIPD (DPIA)</span>
            </button>
            <button
              type="button"
              onClick={handleDirectPdfDownload}
              disabled={isDownloadingDirectPdf}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Baixar Diretamente em PDF (ICP-Brasil)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isDownloadingDirectPdf ? 'Gerando...' : 'PDF Direto'}</span>
            </button>
          </div>
        </div>

      {/* Grid of 3 Safeguards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Sigilo Bancário (LC 105/2001)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Extratos bancários (.OFX) e conciliações financeiras nunca são expostos a terceiros. O motor utiliza processamento local criptografado em memória volátil.
          </p>
          <div className="text-[10px] text-cyan-400 font-mono pt-1">
            • Criptografia AES-256-GCM em Repouso
          </div>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <EyeOff className="w-4 h-4 text-indigo-400" />
            <span>Sigilo Fiscal (Art. 198 CTN)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Arquivos SPED, EFD, ECF e notas fiscais trafegam com isolamento de tenant. Nenhum dado concorrencial ou comercial é cruzado entre clientes.
          </p>
          <div className="text-[10px] text-indigo-400 font-mono pt-1">
            • Chaves de Criptografia Segregadas por CNPJ
          </div>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Bases Legais LGPD (Art. 7º)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Tratamento respaldado para exercício regular de direitos em processos tributários e cumprimento de obrigações perante a Receita Federal do Brasil.
          </p>
          <div className="text-[10px] text-emerald-400 font-mono pt-1">
            • Termo de Custódia Pericial Auditável
          </div>
        </div>
      </div>
    </div>

    {isModalOpen && (
      <TaxRecoveryDocPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentType="relatorio_ripd"
        tenantData={{
          companyName: companyName,
          cnpj: cnpj,
          totalPotentialCredit: 1293334
        } as any}
      />
    )}
  </>
);
};
