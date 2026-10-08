import React from 'react';
import { SupportedCurrency, SupportedLanguage, FiscalJurisdiction } from '../types/aos';
import { GlobalTaxEngineCard } from './GlobalTaxEngineCard';

export interface BrazilianTaxEngineCardProps {
  jurisdiction?: FiscalJurisdiction;
  onChangeJurisdiction?: (jur: FiscalJurisdiction) => void;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
  onAuditFiscalInvariants?: () => void;
}

export const BrazilianTaxEngineCard: React.FC<BrazilianTaxEngineCardProps> = (props) => {
  return <GlobalTaxEngineCard {...props} />;
};
