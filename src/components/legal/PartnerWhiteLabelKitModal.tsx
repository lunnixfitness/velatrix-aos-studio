import React, { useState } from 'react';
import { 
  FileDown, 
  Palette, 
  Sparkles, 
  FileText, 
  Check, 
  X, 
  Eye, 
  Download, 
  Scale, 
  Building2, 
  ShieldCheck, 
  Fingerprint,
  Layers
} from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { 
  PartnerProfile, 
  PartnerAuditedClient, 
  PartnerGrowthService 
} from '../../services/partnerGrowthService';
import { 
  generateWhiteLabelPartnerDossierPdf, 
  generatePartnerSuccessFeeContractPdf 
} from '../../services/pdfReportService';
import { TaxRecoveryDocPreviewModal, TaxDocPreviewType } from './TaxRecoveryDocPreviewModal';
import { TenantTaxRecoveryBridge, SharedTenantTaxData } from '../../services/tenantTaxRecoveryBridge';

interface PartnerWhiteLabelKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient?: PartnerAuditedClient | null;
}

export const PartnerWhiteLabelKitModal: React.FC<PartnerWhiteLabelKitModalProps> = ({
  isOpen,
  onClose,
  selectedClient
}) => {
  const [profile, setProfile] = useState<PartnerProfile>(() => PartnerGrowthService.getProfile());
  const [firmName, setFirmName] = useState<string>(profile.firmName);
  const [lawyerName, setLawyerName] = useState<string>(profile.lawyerName);
  const [oabOrCrc, setOabOrCrc] = useState<string>(profile.oabOrCrc);
  const [brandColor, setBrandColor] = useState<string>(profile.brandPrimaryColor || '#4F46E5');
  const [isGeneratingDossier, setIsGeneratingDossier] = useState<boolean>(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  
  // Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewDocType, setPreviewDocType] = useState<TaxDocPreviewType>('white_label_dossier');

  if (!isOpen) return null;

  const client = selectedClient || {
    id: 'sample',
    cnpj: '33.041.260/0001-88',
    companyName: 'Vortex Logística & Manufatura S.A.',
    sector: 'Manufatura & Indústria Metalmecânica',
    taxRegime: 'Lucro Real' as const,
    estimatedRecovery60Months: 2485000.00,
    successFeeEstimated: 497000.00,
    partnerShare70Pct: 347900.00,
    velatrixShare30Pct: 149100.00,
    status: 'HOMOLOGADO' as const,
    statusLabel: 'Homologado RFB (DCOMP Pronto)',
    lastAuditDate: '2026-08-30 14:20',
    opportunitySummary: 'Tema 69 STF (Exclusão ICMS PIS/COFINS) e créditos sobre fretes de insumos.',
    proofHash: '0x8f2a91c0e5b742aa39f9411dc8219c44b931fae812d46e01a87b32091c77f24d'
  };

  const handleUpdateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = PartnerGrowthService.saveProfile({
      firmName,
      lawyerName,
      oabOrCrc,
      brandPrimaryColor: brandColor
    });
    setProfile(updated);
    setSuccessToast('Identidade visual e logotipo atualizados com sucesso!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDownloadDossier = () => {
    setIsGeneratingDossier(true);
    setTimeout(() => {
      generateWhiteLabelPartnerDossierPdf({
        companyName: client.companyName,
        cnpj: client.cnpj,
        sectorName: client.sector,
        totalCredits: client.estimatedRecovery60Months,
        partnerFirmName: firmName,
        partnerLawyerName: lawyerName,
        partnerOabOrCrc: oabOrCrc,
        partnerEmail: profile.email,
        partnerPhone: profile.phone,
        brandPrimaryColor: brandColor,
        hashSha256: client.proofHash,
        teses: [
          {
            code: 'TEMA 69 STF',
            title: 'Exclusão do ICMS destacado da base de cálculo do PIS e da COFINS (60 meses)',
            court: 'STF Repercussão Geral',
            estimatedCredit: client.estimatedRecovery60Months * 0.65
          },
          {
            code: 'INSUMOS & FRETES',
            title: 'Créditos extemporâneos de PIS/COFINS sobre insumos diretos e fretes de distribuição',
            court: 'STJ Tema 986',
            estimatedCredit: client.estimatedRecovery60Months * 0.35
          }
        ]
      });
      setIsGeneratingDossier(false);
      setSuccessToast('Dossiê Pericial White-Label em PDF gerado com sucesso!');
      setTimeout(() => setSuccessToast(null), 3500);
    }, 600);
  };

  const handleDownloadContract = () => {
    setIsGeneratingContract(true);
    setTimeout(() => {
      generatePartnerSuccessFeeContractPdf({
        clientCompanyName: client.companyName,
        clientCnpj: client.cnpj,
        partnerFirmName: firmName,
        partnerLawyerName: lawyerName,
        partnerOabOrCrc: oabOrCrc,
        totalEstimatedBenefit: client.estimatedRecovery60Months,
        successFeePercent: 20,
        partnerSplitPercent: 70,
        velatrixSplitPercent: 30,
        hashSha256: client.proofHash
      });
      setIsGeneratingContract(false);
      setSuccessToast('Contrato de Honorários de Êxito gerado em PDF!');
      setTimeout(() => setSuccessToast(null), 3500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--vx-deep)] border border-slate-700/80 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Kit de Vendas White-Label &amp; Gerador de Dossiê</span>
              </h3>
              <p className="text-xs text-slate-400">
                Aplique a identidade do seu escritório sobre os laudos periciais e contratos de êxito com split pactuado.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {successToast && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Target Client Info */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Empresa Alvo do Dossiê</span>
              <h4 className="text-sm font-bold text-white">{client.companyName}</h4>
              <p className="text-xs text-slate-400 font-mono">CNPJ: {client.cnpj} • Setor: {client.sector}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-mono block">Créditos 60 Meses</span>
              <span className="text-base font-mono font-bold text-emerald-400">
                {formatCurrency(client.estimatedRecovery60Months, 'BRL')}
              </span>
            </div>
          </div>

          {/* White-Label Customization Form */}
          <form onSubmit={handleUpdateBrand} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-white uppercase">
                  Personalização da Marca do Escritório
                </span>
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-mono cursor-pointer transition-colors"
              >
                Salvar Marca
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Nome do Escritório</label>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Patrono / OAB</label>
                <input
                  type="text"
                  value={oabOrCrc}
                  onChange={(e) => setOabOrCrc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Cor Primária do Dossiê</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-9 h-8 bg-transparent rounded cursor-pointer border border-slate-700"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Generation Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card 1: Dossiê Pericial White-Label */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    FORMATO PDF A4
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">Dossiê Técnico Pericial (White-Label)</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Relatório oficial de 60 meses com a sua logomarca/cor, fundamentação em teses do STF/STJ e hash de anterioridade pericial.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPreviewDocType('white_label_dossier');
                  setIsPreviewModalOpen(true);
                }}
                className="w-full mt-3 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Eye className="w-4 h-4 text-indigo-200" />
                <span>Pré-visualizar &amp; Baixar Dossiê (PDF)</span>
              </button>
            </div>

            {/* Card 2: Contrato Digital de Êxito */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Scale className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    SPLIT DE HONORÁRIOS
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">Contrato de Êxito Digital ("Zero Pro-Labore")</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Minuta contratual com a divisão formalizada de honorários de êxito pactuada no deal, termo de exclusividade e campos para assinatura digital.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPreviewDocType('success_contract');
                  setIsPreviewModalOpen(true);
                }}
                className="w-full mt-3 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Eye className="w-4 h-4 text-emerald-200" />
                <span>Pré-visualizar &amp; Gerar Contrato (PDF)</span>
              </button>
            </div>

          </div>

          {/* Cryptographic Compliance Notice */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Registro de Prova de Anterioridade Criptográfica: {client.proofHash.slice(0, 24)}...</span>
            </div>
            <span className="text-slate-500 font-mono">SHA-256 Validado</span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold cursor-pointer transition-colors"
          >
            Fechar Kit de Vendas
          </button>
        </div>

      </div>

      {/* Tax Recovery Document Preview Modal */}
      {isPreviewModalOpen && (() => {
        const baseBridgeData = TenantTaxRecoveryBridge.get();
        const effectiveTenantData: SharedTenantTaxData = {
          ...baseBridgeData,
          companyName: client.companyName,
          cnpj: client.cnpj,
          sectorName: client.sector,
          taxRegime: (client.taxRegime === 'Simples Nacional'
            ? 'simples_nacional'
            : client.taxRegime === 'Lucro Presumido'
            ? 'lucro_presumido'
            : 'lucro_real'),
          annualRevenue: client.estimatedRecovery60Months * 10,
          preliminaryScan: {
            ...baseBridgeData.preliminaryScan,
            totalEstimatedCredits: client.estimatedRecovery60Months,
            hashSha256: client.proofHash,
            teses: [
              {
                ...baseBridgeData.preliminaryScan.teses[0],
                id: 'tese-1',
                code: 'TEMA 69 STF',
                title: 'Exclusão do ICMS destacado da base de cálculo do PIS e da COFINS (60 meses)',
                court: 'STF Repercussão Geral',
                estimatedCredit: client.estimatedRecovery60Months * 0.65,
                status: 'HABILITADO_RFB'
              },
              {
                ...baseBridgeData.preliminaryScan.teses[1],
                id: 'tese-2',
                code: 'INSUMOS & FRETES',
                title: 'Créditos extemporâneos de PIS/COFINS sobre insumos diretos e fretes',
                court: 'STJ Tema 986',
                estimatedCredit: client.estimatedRecovery60Months * 0.35,
                status: 'HABILITADO_RFB'
              }
            ]
          }
        };

        return (
          <TaxRecoveryDocPreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            documentType={previewDocType}
            tenantData={effectiveTenantData}
            partnerData={{
              firmName,
              lawyerName,
              oabOrCrc,
              email: profile.email,
              phone: profile.phone,
              brandPrimaryColor: brandColor,
              partnerSplitPercent: 70,
              velatrixSplitPercent: 30,
              successFeePercent: 20
            }}
          />
        );
      })()}
    </div>
  );
};
