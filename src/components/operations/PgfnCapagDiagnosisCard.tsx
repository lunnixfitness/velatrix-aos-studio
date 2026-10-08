import React, { useState, useMemo, useEffect } from 'react';
import {
  Scale,
  ShieldAlert,
  ShieldCheck,
  Calculator,
  TrendingDown,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  SlidersHorizontal,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Building2
} from 'lucide-react';
import { SupportedCurrency, SupportedLanguage, AuditRecord } from '../../types/aos';
import { formatCurrency } from '../../utils/i18n';
import { sha256Hex } from '../../shared/crypto/hash';
import { UnifiedTenantService } from '../../services/unifiedTenantService';

export type CapagRating = 'A' | 'B' | 'C' | 'D';

export interface PgfnDebtItem {
  id: string;
  cdaNumber: string;
  tributo: string;
  inscricaoDate: string;
  originalValue: number;
  jurosMultas: number;
  totalValue: number;
  status: 'EM_COBRANCA' | 'SUSPENSO' | 'AJUIZADO';
}

interface PgfnCapagDiagnosisCardProps {
  currency?: SupportedCurrency;
  language?: SupportedLanguage;
  companyName?: string;
  cnpj?: string;
  onAddAuditRecord?: (record: any) => void;
  onNavigateToTaxRecovery?: () => void;
  className?: string;
}

export const PgfnCapagDiagnosisCard: React.FC<PgfnCapagDiagnosisCardProps> = ({
  currency = 'BRL',
  language = 'pt',
  companyName = 'Indústria Metalúrgica & Manufatura Velatrix S.A.',
  cnpj = '18.492.301/0001-88',
  onAddAuditRecord,
  onNavigateToTaxRecovery,
  className = ''
}) => {
  const initialTenant = UnifiedTenantService.getActiveTenant();
  const [currentCompany, setCurrentCompany] = useState<string>(initialTenant?.name || companyName);
  const [currentCnpj, setCurrentCnpj] = useState<string>(initialTenant?.cnpj || cnpj);

  // Input parameters for CAPAG simulation
  const [totalPgfnDebt, setTotalPgfnDebt] = useState<number>(() => {
    const rev = initialTenant?.annualRevenue || 42000000;
    return Math.round(rev * 0.082);
  });
  const [faturamentoAnual, setFaturamentoAnual] = useState<number>(() => initialTenant?.annualRevenue || 42000000);
  const [massaSalarialAnual, setMassaSalarialAnual] = useState<number>(() => Math.round((initialTenant?.annualRevenue || 42000000) * 0.22));
  const [empresaPorte, setEmpresaPorte] = useState<'ME_EPP' | 'DEMAIS' | 'RECUPERACAO_JUDICIAL'>('DEMAIS');
  const [percentualJurosMultas, setPercentualJurosMultas] = useState<number>(55); // % da dívida que é juros/multa
  const [manualOverrideCapag, setManualOverrideCapag] = useState<CapagRating | null>(null);

  // Modal simulation state
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Debts details list dynamically tied to active tenant
  const [debtsList, setDebtsList] = useState<PgfnDebtItem[]>(() => {
    const clean = UnifiedTenantService.normalizeCnpj(initialTenant?.cnpj || '18492301000188').slice(0, 6);
    const baseDebt = Math.round((initialTenant?.annualRevenue || 42000000) * 0.082);
    return [
      {
        id: 'CDA-2024-001',
        cdaNumber: `00.4.24.${clean}-52`,
        tributo: 'IRPJ & CSLL Consolidado',
        inscricaoDate: '14/03/2024',
        originalValue: Math.round(baseDebt * 0.40),
        jurosMultas: Math.round(baseDebt * 0.24),
        totalValue: Math.round(baseDebt * 0.40) + Math.round(baseDebt * 0.24),
        status: 'AJUIZADO'
      },
      {
        id: 'CDA-2024-002',
        cdaNumber: `00.6.24.${clean}-44`,
        tributo: 'PIS / COFINS Não-Cumulativo',
        inscricaoDate: '22/08/2024',
        originalValue: Math.round(baseDebt * 0.30),
        jurosMultas: Math.round(baseDebt * 0.16),
        totalValue: Math.round(baseDebt * 0.30) + Math.round(baseDebt * 0.16),
        status: 'EM_COBRANCA'
      },
      {
        id: 'CDA-2024-003',
        cdaNumber: `00.1.25.${clean}-19`,
        tributo: 'Contribuições Previdenciárias (INSS)',
        inscricaoDate: '10/02/2025',
        originalValue: Math.round(baseDebt * 0.20),
        jurosMultas: Math.round(baseDebt * 0.10),
        totalValue: Math.round(baseDebt * 0.20) + Math.round(baseDebt * 0.10),
        status: 'AJUIZADO'
      }
    ];
  });

  // Reagir em tempo real ao Fluxo Único do UnifiedTenantService
  useEffect(() => {
    const syncWithTenant = (tenant: any) => {
      if (!tenant) return;
      setCurrentCompany(tenant.name);
      setCurrentCnpj(tenant.cnpj);

      const rev = tenant.annualRevenue || 42000000;
      setFaturamentoAnual(rev);
      setMassaSalarialAnual(Math.round(rev * 0.22));

      const debt = Math.round(rev * 0.082);
      setTotalPgfnDebt(debt);

      const clean = UnifiedTenantService.normalizeCnpj(tenant.cnpj || '18492301000188').slice(0, 6);
      setDebtsList([
        {
          id: 'CDA-2024-001',
          cdaNumber: `00.4.24.${clean}-52`,
          tributo: 'IRPJ & CSLL Consolidado',
          inscricaoDate: '14/03/2024',
          originalValue: Math.round(debt * 0.40),
          jurosMultas: Math.round(debt * 0.24),
          totalValue: Math.round(debt * 0.40) + Math.round(debt * 0.24),
          status: 'AJUIZADO'
        },
        {
          id: 'CDA-2024-002',
          cdaNumber: `00.6.24.${clean}-44`,
          tributo: 'PIS / COFINS Não-Cumulativo',
          inscricaoDate: '22/08/2024',
          originalValue: Math.round(debt * 0.30),
          jurosMultas: Math.round(debt * 0.16),
          totalValue: Math.round(debt * 0.30) + Math.round(debt * 0.16),
          status: 'EM_COBRANCA'
        },
        {
          id: 'CDA-2024-003',
          cdaNumber: `00.1.25.${clean}-19`,
          tributo: 'Contribuições Previdenciárias (INSS)',
          inscricaoDate: '10/02/2025',
          originalValue: Math.round(debt * 0.20),
          jurosMultas: Math.round(debt * 0.10),
          totalValue: Math.round(debt * 0.20) + Math.round(debt * 0.10),
          status: 'AJUIZADO'
        }
      ]);
    };

    const unsubscribe = UnifiedTenantService.subscribe(syncWithTenant);
    return () => unsubscribe();
  }, []);

  const [simulationHash, setSimulationHash] = useState<string>('calculando selo…');

  // CAPAG Calculation Engine based on Portaria PGFN 14.404/2020
  const calculationResults = useMemo(() => {
    // Ratio of debt to annual revenue
    const debtToRevenueRatio = totalPgfnDebt / (faturamentoAnual || 1);

    // Baseline CAPAG rating
    let calculatedRating: CapagRating = 'B';
    if (debtToRevenueRatio < 0.25) {
      calculatedRating = 'A';
    } else if (debtToRevenueRatio < 0.55) {
      calculatedRating = 'B';
    } else if (debtToRevenueRatio < 0.90) {
      calculatedRating = 'C';
    } else {
      calculatedRating = 'D';
    }

    const rating = manualOverrideCapag || calculatedRating;

    // Rules according to Portaria PGFN 14.404 & Lei 13.988
    let maxDiscountJurosMultasPct = 0;
    let maxParcelas = 60;
    let entradaMinimaPct = 4;
    let entradaParcelas = 12;

    switch (rating) {
      case 'A':
        maxDiscountJurosMultasPct = 0; // Alta capacidade, sem descontos extraordinários
        maxParcelas = 60;
        entradaMinimaPct = 5;
        entradaParcelas = 6;
        break;
      case 'B':
        maxDiscountJurosMultasPct = 30;
        maxParcelas = empresaPorte === 'DEMAIS' ? 84 : 100;
        entradaMinimaPct = 4;
        entradaParcelas = 12;
        break;
      case 'C':
        maxDiscountJurosMultasPct = 50;
        maxParcelas = empresaPorte === 'DEMAIS' ? 120 : 133;
        entradaMinimaPct = 2;
        entradaParcelas = 12;
        break;
      case 'D':
        // Faixa D permite desconto máximo de até 70% sobre juros/multas/encargos e 145 parcelas para ME/EPP
        maxDiscountJurosMultasPct = 70;
        maxParcelas = empresaPorte === 'DEMAIS' ? 120 : 145;
        entradaMinimaPct = 1;
        entradaParcelas = 12;
        break;
    }

    // Money calculations
    const estimatedJurosMultasTotal = (totalPgfnDebt * percentualJurosMultas) / 100;
    const estimatedPrincipal = totalPgfnDebt - estimatedJurosMultasTotal;

    const discountAmount = (estimatedJurosMultasTotal * maxDiscountJurosMultasPct) / 100;
    const consolidatedDebtAfterDiscount = totalPgfnDebt - discountAmount;

    // Entry calculation
    const entradaTotal = (consolidatedDebtAfterDiscount * entradaMinimaPct) / 100;
    const valorParcelaEntrada = entradaTotal / entradaParcelas;

    // Remaining installments
    const saldoRemanescente = consolidatedDebtAfterDiscount - entradaTotal;
    const parcelasRestantes = Math.max(1, maxParcelas - entradaParcelas);
    const valorParcelaOrdinaria = saldoRemanescente / parcelasRestantes;

    // Overall discount percentage on total debt
    const overallDiscountPct = totalPgfnDebt > 0 ? (discountAmount / totalPgfnDebt) * 100 : 0;

    return {
      rating,
      debtToRevenueRatio,
      estimatedPrincipal,
      estimatedJurosMultasTotal,
      maxDiscountJurosMultasPct,
      overallDiscountPct,
      discountAmount,
      consolidatedDebtAfterDiscount,
      maxParcelas,
      entradaMinimaPct,
      entradaParcelas,
      entradaTotal,
      valorParcelaEntrada,
      parcelasRestantes,
      valorParcelaOrdinaria,
      simulationHash
    };
  }, [totalPgfnDebt, faturamentoAnual, empresaPorte, percentualJurosMultas, manualOverrideCapag, simulationHash]);

  useEffect(() => {
    let active = true;
    setSimulationHash('calculando selo…');
    sha256Hex(
      `PGFN_CAPAG_${calculationResults.rating}_${totalPgfnDebt}_${calculationResults.discountAmount}_${calculationResults.maxParcelas}`
    ).then((h) => {
      if (active) setSimulationHash(h);
    });
    return () => { active = false; };
  }, [calculationResults.rating, totalPgfnDebt, calculationResults.discountAmount, calculationResults.maxParcelas]);

  const handleOpenSimulator = () => {
    setIsSimulatorModalOpen(true);
    if (onAddAuditRecord) {
      onAddAuditRecord({
        id: `AUDIT-CAPAG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'PGFN_CAPAG_SIMULATION',
        actor: 'Agente Fiscal PGFN HUB-01',
        details: `Simulação de Transação Excepcional CAPAG Faixa ${calculationResults.rating}. Desconto: ${calculationResults.maxDiscountJurosMultasPct}%. Saldo: ${formatCurrency(calculationResults.consolidatedDebtAfterDiscount, currency, language)}.`,
        hash: calculationResults.simulationHash,
        status: 'executed'
      });
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(calculationResults.simulationHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[var(--vx-deep)] via-[var(--vx-deep)] to-[var(--vx-deep)] border border-emerald-500/30 shadow-xl space-y-6 ${className}`}>
      
      {/* Header do Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Scale className="w-3 h-3" />
              HUB-01-FISCAL • MÓDULO PGFN / CAPAG
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <ShieldCheck className="w-3 h-3" />
              PORTARIA PGFN Nº 14.404/2020
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              LEI Nº 13.988/2020
            </span>
          </div>

          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span>Diagnóstico PGFN / CAPAG • Transação Excepcional de Dívida Ativa</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Classificação algorítmica da <strong className="text-slate-200">Capacidade de Pagamento (CAPAG)</strong> para obter descontos legais de até <strong className="text-emerald-400">70% sobre juros/multas</strong> e parcelamento estendido em até <strong className="text-cyan-300">145 meses</strong> perante a Procuradoria-Geral da Fazenda Nacional.
          </p>

          {/* Active Tenant Linking Banner */}
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium bg-slate-900/90 text-slate-300 border border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tenant Ativo Vinculado:</span>
              <strong className="text-white font-bold">{currentCompany}</strong>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-300">CNPJ: {currentCnpj}</span>
            </span>
          </div>
        </div>

        {/* Action Button Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenSimulator}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-mono text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Simular Transação Excepcional</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Principal de Informações & Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Classificação CAPAG */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Classificação CAPAG</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${
              calculationResults.rating === 'D'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : calculationResults.rating === 'C'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : calculationResults.rating === 'B'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              FAIXA {calculationResults.rating}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black font-mono ${
              calculationResults.rating === 'D' ? 'text-rose-400' :
              calculationResults.rating === 'C' ? 'text-amber-400' :
              calculationResults.rating === 'B' ? 'text-cyan-400' : 'text-emerald-400'
            }`}>
              {calculationResults.rating}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {calculationResults.rating === 'D' ? '(Crédito Irrecuperável - Desconto Máximo)' :
               calculationResults.rating === 'C' ? '(Baixa Recuperabilidade)' :
               calculationResults.rating === 'B' ? '(Média Recuperabilidade)' : '(Alta Recuperabilidade)'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-mono leading-tight">
            Grau de comprometimento: <strong className="text-slate-200">{(calculationResults.debtToRevenueRatio * 100).toFixed(1)}%</strong> da receita anual.
          </p>
        </div>

        {/* Card 2: Desconto Máximo Elegível */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Desconto em Juros/Multas</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded font-bold">
              Até {calculationResults.maxDiscountJurosMultasPct}%
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-emerald-400">
              {calculationResults.maxDiscountJurosMultasPct}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({calculationResults.overallDiscountPct.toFixed(1)}% do total)
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Economia Projetada:</span>
            <strong className="text-emerald-300 font-bold">
              {formatCurrency(calculationResults.discountAmount, currency, language)}
            </strong>
          </div>
        </div>

        {/* Card 3: Saldo Consolidado Pós-Transação */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dívida Consolidada</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
              Pós-Desconto
            </span>
          </div>

          <div className="text-2xl font-black font-mono text-white truncate">
            {formatCurrency(calculationResults.consolidatedDebtAfterDiscount, currency, language)}
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Débito Bruto Original:</span>
            <span className="text-slate-400 line-through">
              {formatCurrency(totalPgfnDebt, currency, language)}
            </span>
          </div>
        </div>

        {/* Card 4: Prazo & Parcelamento */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-purple-400" />
              <span>Prazo de Parcelamento</span>
            </span>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded font-bold">
              Transação Excepcional
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-purple-400">
              {calculationResults.maxParcelas}
            </span>
            <span className="text-xs font-mono text-slate-400">meses</span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Parcela Média Estimada:</span>
            <strong className="text-cyan-300 font-bold">
              {formatCurrency(calculationResults.valorParcelaOrdinaria, currency, language)}/mês
            </strong>
          </div>
        </div>

      </div>

      {/* Tabela de Inscrições em Dívida Ativa Mapeadas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Certidões de Dívida Ativa (CDAs) Cadastradas no Regularize / PGFN</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {debtsList.length} Processos Inscritos
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Número CDA / Processo</th>
                <th className="py-2.5 px-3">Tributo Originário</th>
                <th className="py-2.5 px-3">Data Inscrição</th>
                <th className="py-2.5 px-3 text-right">Principal</th>
                <th className="py-2.5 px-3 text-right">Juros &amp; Multas</th>
                <th className="py-2.5 px-3 text-right">Total Consolidado</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/50">
              {debtsList.map((debt) => (
                <tr key={debt.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-2.5 px-3 text-cyan-300 font-bold">{debt.cdaNumber}</td>
                  <td className="py-2.5 px-3 text-slate-200">{debt.tributo}</td>
                  <td className="py-2.5 px-3 text-slate-400">{debt.inscricaoDate}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatCurrency(debt.originalValue, currency, language)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300">
                    {formatCurrency(debt.jurosMultas, currency, language)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-white font-bold">
                    {formatCurrency(debt.totalValue, currency, language)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      debt.status === 'AJUIZADO' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {debt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900/80 border-t border-slate-800 font-bold text-slate-200">
              <tr>
                <td colSpan={3} className="py-2.5 px-3 text-slate-300">
                  TOTAL CONSOLIDADO EM COBRANÇA PGFN
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300">
                  {formatCurrency(2180000, currency, language)}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-400">
                  {formatCurrency(1270000, currency, language)}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400 text-sm">
                  {formatCurrency(totalPgfnDebt, currency, language)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Regras e Fundamentação Jurídica da Transação Excepcional */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <Info className="w-4 h-4" />
          <span>Diretrizes e Condições da Transação Excepcional (PGFN / Regularize):</span>
        </div>
        <ul className="text-slate-300 space-y-1 text-[11px] list-disc list-inside leading-relaxed">
          <li>
            <strong>Desconto sobre Acréscimos Legais:</strong> Os descontos de até 70% incidem exclusivamente sobre juros, multas de mora/ofício e encargos legais (Decreto-Lei 1.025/69), sendo vedada a redução do valor principal da dívida (Art. 11, Lei 13.988/2020).
          </li>
          <li>
            <strong>Condição de Adesão:</strong> Entrada facilitada de 1% a 4% do valor consolidado, parcelada em até 12 meses, com o saldo remanescente dividido em até 133 ou 145 prestações mensais (ME/EPP e empresas em recuperação judicial).
          </li>
          <li>
            <strong>Suspensão da Execução Fiscal:</strong> A homologação do acordo no portal REGULARIZE suspende os atos de constrição patrimonial (SISBAJUD / RENAJUD / Penhora no rosto dos autos) e viabiliza a emissão de Certidão Positiva com Efeitos de Negativa (CPEN).
          </li>
        </ul>
      </div>

      {/* MODAL: Simulador Avançado de Transação Excepcional */}
      {isSimulatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white font-mono">
                    Simulador Interativo • Transação Excepcional PGFN
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Ajuste os parâmetros contábeis para recalcular o score CAPAG e a proposta de acordo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulatorModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Valor Total da Dívida Ativa PGFN:</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">R$</span>
                  <input
                    type="number"
                    value={totalPgfnDebt}
                    onChange={(e) => setTotalPgfnDebt(Math.max(10000, Number(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Faturamento Bruto Anual (Últimos 12M):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">R$</span>
                  <input
                    type="number"
                    value={faturamentoAnual}
                    onChange={(e) => setFaturamentoAnual(Math.max(10000, Number(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Porte da Pessoa Jurídica:</label>
                <select
                  value={empresaPorte}
                  onChange={(e) => setEmpresaPorte(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ME_EPP">Microempresa ou EPP (Até 145 parcelas)</option>
                  <option value="RECUPERACAO_JUDICIAL">Em Recuperação Judicial (Até 145 parcelas)</option>
                  <option value="DEMAIS">Demais Pessoas Jurídicas (Até 120 parcelas)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">
                  Forçar Classificação CAPAG (Simulação):
                </label>
                <select
                  value={manualOverrideCapag || ''}
                  onChange={(e) => setManualOverrideCapag((e.target.value as CapagRating) || null)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Cálculo Automático (Algoritmo Portaria 14.404)</option>
                  <option value="D">Forçar Faixa D (Desconto Máximo 70%)</option>
                  <option value="C">Forçar Faixa C (Desconto 50%)</option>
                  <option value="B">Forçar Faixa B (Desconto 30%)</option>
                  <option value="A">Forçar Faixa A (Sem Desconto Extraordinário)</option>
                </select>
              </div>
            </div>

            {/* Resultado do Acordo Simulado */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  Cronograma de Pagamento Estimado • Transação PGFN
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  CAPAG Faixa {calculationResults.rating}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Desconto em Juros/Multas:</span>
                  <strong className="text-emerald-400 text-base">{calculationResults.maxDiscountJurosMultasPct}%</strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Economia em R$:</span>
                  <strong className="text-emerald-400 text-sm">
                    {formatCurrency(calculationResults.discountAmount, currency, language)}
                  </strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Entrada ({calculationResults.entradaMinimaPct}% em 12x):</span>
                  <strong className="text-amber-400 text-sm">
                    {formatCurrency(calculationResults.valorParcelaEntrada, currency, language)}/mês
                  </strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Demais Prestações ({calculationResults.parcelasRestantes}x):</span>
                  <strong className="text-cyan-300 text-sm">
                    {formatCurrency(calculationResults.valorParcelaOrdinaria, currency, language)}/mês
                  </strong>
                </div>
              </div>

              {/* Hash Audit */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] font-mono flex items-center justify-between gap-2">
                <span className="text-slate-400 truncate">
                  Hash de Auditoria SHA-256: <code className="text-slate-200">{calculationResults.simulationHash}</code>
                </span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 shrink-0"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHash ? 'Copiado' : 'Copiar Hash'}</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsSimulatorModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
              >
                Fechar Simulador
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSimulatorModalOpen(false);
                  onNavigateToTaxRecovery?.();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-mono text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <span>Avançar para Homologação Regularize PGFN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
