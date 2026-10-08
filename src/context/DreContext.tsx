import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import {
  DetailedDreWaterfallInput,
  DetailedDreCalculatedResults,
  NonRecurringLegalCompliance,
  HospitalEquiparationCompliance,
  PatrimonialBalanceSheetInput
} from '../types/patrimonial';
import {
  VelatrixDreCascadeEngine,
  RecurrentVsAdjustedAnalysis
} from '../utils/dreCascadeEngine';
import { UnifiedTenantService } from '../services/unifiedTenantService';

export interface DreContextType {
  dreInput: DetailedDreWaterfallInput;
  dreResults: DetailedDreCalculatedResults;
  recurrentVsAdjusted: RecurrentVsAdjustedAnalysis;
  companyName: string;
  cnpj: string;
  sectorKey: string;
  annualRevenue: number;
  ebitdaMarginTarget: number;
  lastUpdatedSource: 'wizard_step1' | 'manual_dre' | 'document_upload' | 'default';

  // Synchronization methods
  syncFromWizardStep1: (params: {
    cnpj?: string;
    companyName?: string;
    revenue: number;
    isMonthly?: boolean;
    ebitdaMargin?: number;
    sectorKey?: string;
  }) => void;

  syncFromUploadedDocument: (parsed: {
    grossRevenue?: number;
    ebitdaMargin?: number;
    ebitdaValue?: number;
    netIncome?: number;
    fileName?: string;
  }) => void;

  // Granular update methods
  updateDreField: <K extends keyof DetailedDreWaterfallInput>(
    field: K,
    value: DetailedDreWaterfallInput[K]
  ) => void;

  updateComplianceHospitalar: (
    field: keyof HospitalEquiparationCompliance,
    value?: boolean
  ) => void;

  updateNonRecurringCompliance: (
    type: 'estornoPis' | 'inssPatronal' | 'selic',
    field: keyof NonRecurringLegalCompliance,
    value: any
  ) => void;

  resetToDefaults: (customRevenue?: number) => void;
}

const DreContext = createContext<DreContextType | undefined>(undefined);

export const DreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialTenant = UnifiedTenantService.getActiveTenant();
  const [companyName, setCompanyName] = useState<string>(initialTenant?.name || 'Vortex Logística & Manufatura S.A.');
  const [cnpj, setCnpj] = useState<string>(initialTenant?.cnpj || '33.041.260/0001-88');
  const [sectorKey, setSectorKey] = useState<string>(initialTenant?.sector || 'manufacturing');
  const [annualRevenue, setAnnualRevenue] = useState<number>(initialTenant?.annualRevenue || 54000000);
  const [ebitdaMarginTarget, setEbitdaMarginTarget] = useState<number>(initialTenant?.ebitdaMargin || 16.5);
  const [lastUpdatedSource, setLastUpdatedSource] = useState<
    'wizard_step1' | 'manual_dre' | 'document_upload' | 'default'
  >('default');

  // Single Source of Truth for DRE Waterfall inputs
  const [dreInput, setDreInput] = useState<DetailedDreWaterfallInput>(() =>
    VelatrixDreCascadeEngine.generateDefaultDreInput(
      initialTenant?.annualRevenue || 54000000,
      initialTenant?.sector || 'manufacturing',
      initialTenant?.ebitdaMargin || 16.5
    )
  );

  // Subscribe to UnifiedTenantService changes across all platform tabs
  useEffect(() => {
    const unsub = UnifiedTenantService.subscribe((tenant) => {
      if (tenant) {
        setCompanyName(tenant.name);
        setCnpj(tenant.cnpj);
        const effectiveSector = tenant.sector || 'manufacturing';
        const effectiveRev = tenant.annualRevenue || 54000000;
        const effectiveMargin = tenant.ebitdaMargin || 16.5;
        setSectorKey(effectiveSector);
        setAnnualRevenue(effectiveRev);
        setEbitdaMarginTarget(effectiveMargin);
        setDreInput(VelatrixDreCascadeEngine.generateDefaultDreInput(effectiveRev, effectiveSector, effectiveMargin));
      }
    });
    return unsub;
  }, []);

  // Computes cascade whenever dreInput changes
  const dreResults: DetailedDreCalculatedResults = useMemo(() => {
    return VelatrixDreCascadeEngine.computeCascade(dreInput);
  }, [dreInput]);

  // Computes comparative analysis (Recurrent Operational vs Adjusted with Non-Recurring Tax Credits)
  const recurrentVsAdjusted: RecurrentVsAdjustedAnalysis = useMemo(() => {
    return VelatrixDreCascadeEngine.computeRecurrentVsAdjustedMetrics(dreResults);
  }, [dreResults]);

  // Synchronization from Wizard Step 1 (Inputs CNPJ, Razão Social, Faturamento, Slider EBITDA, Setor)
  const syncFromWizardStep1 = useCallback((params: {
    cnpj?: string;
    companyName?: string;
    revenue: number;
    isMonthly?: boolean;
    ebitdaMargin?: number;
    sectorKey?: string;
  }) => {
    const calculatedAnnualRevenue = params.isMonthly ? params.revenue * 12 : params.revenue;
    const resolvedSector = params.sectorKey || sectorKey;
    const resolvedEbitda = params.ebitdaMargin !== undefined ? params.ebitdaMargin : ebitdaMarginTarget;

    if (params.companyName) setCompanyName(params.companyName);
    if (params.cnpj) setCnpj(params.cnpj);
    if (params.sectorKey) setSectorKey(params.sectorKey);
    setAnnualRevenue(calculatedAnnualRevenue);
    if (params.ebitdaMargin !== undefined) setEbitdaMarginTarget(params.ebitdaMargin);
    setLastUpdatedSource('wizard_step1');

    setDreInput(prev =>
      VelatrixDreCascadeEngine.generateDefaultDreInput(
        calculatedAnnualRevenue,
        resolvedSector,
        resolvedEbitda,
        {
          complianceEstornoPisCofins: prev.complianceEstornoPisCofins,
          complianceInssPatronal: prev.complianceInssPatronal,
          complianceAtualizacaoSelic: prev.complianceAtualizacaoSelic,
          complianceHospitalar: prev.complianceHospitalar
        }
      )
    );
  }, [sectorKey, ebitdaMarginTarget]);

  // Synchronization from Uploaded DRE / Balancete Document
  const syncFromUploadedDocument = useCallback((parsed: {
    grossRevenue?: number;
    ebitdaMargin?: number;
    ebitdaValue?: number;
    netIncome?: number;
    fileName?: string;
  }) => {
    const targetRevenue = parsed.grossRevenue && parsed.grossRevenue > 0 ? parsed.grossRevenue : annualRevenue;
    const targetEbitda = parsed.ebitdaMargin && parsed.ebitdaMargin > 0 ? parsed.ebitdaMargin : ebitdaMarginTarget;

    setAnnualRevenue(targetRevenue);
    if (parsed.ebitdaMargin) setEbitdaMarginTarget(parsed.ebitdaMargin);
    setLastUpdatedSource('document_upload');

    setDreInput(prev =>
      VelatrixDreCascadeEngine.generateDreFromParsedDocument(
        parsed,
        targetRevenue,
        sectorKey,
        prev
      )
    );
  }, [annualRevenue, ebitdaMarginTarget, sectorKey]);

  // Granular update of any DRE input field
  const updateDreField = useCallback(<K extends keyof DetailedDreWaterfallInput>(
    field: K,
    value: DetailedDreWaterfallInput[K]
  ) => {
    setLastUpdatedSource('manual_dre');
    setDreInput(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Toggle compliance hospitalar checklist & safeguards
  const updateComplianceHospitalar = useCallback((
    field: keyof HospitalEquiparationCompliance,
    value?: boolean
  ) => {
    setLastUpdatedSource('manual_dre');
    setDreInput(prev => ({
      ...prev,
      complianceHospitalar: {
        ...prev.complianceHospitalar,
        [field]: value !== undefined ? value : !prev.complianceHospitalar[field]
      }
    }));
  }, []);

  // Update non-recurring compliance process / PER-DCOMP details
  const updateNonRecurringCompliance = useCallback((
    type: 'estornoPis' | 'inssPatronal' | 'selic',
    field: keyof NonRecurringLegalCompliance,
    value: any
  ) => {
    setLastUpdatedSource('manual_dre');
    setDreInput(prev => {
      const key =
        type === 'estornoPis'
          ? 'complianceEstornoPisCofins'
          : type === 'inssPatronal'
          ? 'complianceInssPatronal'
          : 'complianceAtualizacaoSelic';

      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value
        }
      };
    });
  }, []);

  // Reset to default
  const resetToDefaults = useCallback((customRevenue?: number) => {
    const rev = customRevenue || annualRevenue;
    setLastUpdatedSource('default');
    setDreInput(VelatrixDreCascadeEngine.generateDefaultDreInput(rev, sectorKey, ebitdaMarginTarget));
  }, [annualRevenue, sectorKey, ebitdaMarginTarget]);

  return (
    <DreContext.Provider
      value={{
        dreInput,
        dreResults,
        recurrentVsAdjusted,
        companyName,
        cnpj,
        sectorKey,
        annualRevenue,
        ebitdaMarginTarget,
        lastUpdatedSource,
        syncFromWizardStep1,
        syncFromUploadedDocument,
        updateDreField,
        updateComplianceHospitalar,
        updateNonRecurringCompliance,
        resetToDefaults
      }}
    >
      {children}
    </DreContext.Provider>
  );
};

export const useDre = (): DreContextType => {
  const context = useContext(DreContext);
  if (!context) {
    throw new Error('useDre must be used within a DreProvider');
  }
  return context;
};
