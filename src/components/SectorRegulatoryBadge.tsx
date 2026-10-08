import React from 'react';
import { 
  Factory, 
  HeartPulse, 
  ShoppingBag, 
  Briefcase, 
  Building2,
  ShieldCheck, 
  Scale,
  Wheat,
  HardHat,
  Zap,
  Truck,
  Globe,
  Landmark
} from 'lucide-react';
import { IndustrySector } from '../types/aos';

export interface SectorConfig {
  id: IndustrySector;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  regulatoryBody: string;
  complianceRule: string;
  primaryKpis: string[];
  colorClasses: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
}

export const SECTORS_CONFIG: Record<IndustrySector, SectorConfig> = {
  manufacturing: {
    id: 'manufacturing',
    name: 'Indústria & Manufatura',
    shortName: 'Manufatura',
    icon: Factory,
    regulatoryBody: 'ISO 9001 / IATF 16949',
    complianceRule: 'Controle de OEE, Insumos Críticos & Manutenção Preditiva',
    primaryKpis: ['OEE Linhas', 'Lead Time Suprimentos', 'Custo Parada Fábrica', 'Taxa de Refugo'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-amber-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  },
  healthcare: {
    id: 'healthcare',
    name: 'Saúde, Clínicas & Hospitais',
    shortName: 'Saúde & Farma',
    icon: HeartPulse,
    regulatoryBody: 'LGPD Médica / HIPAA / Anvisa RDC 430',
    complianceRule: 'Proteção de Prontuários, Rastreabilidade de Lotes & Cadeia de Frio',
    primaryKpis: ['Cadeia de Frio (2°C-8°C)', 'Compliance LGPD/HIPAA', 'Lotes Críticos', 'SLA Atendimento UTI'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-rose-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  },
  retail: {
    id: 'retail',
    name: 'Varejo Físico & Redes',
    shortName: 'Varejo & Redes',
    icon: ShoppingBag,
    regulatoryBody: 'PCI-DSS / CDC / SLA 24h',
    complianceRule: 'Margem Contribuição por SKU, Frete Dinâmico & Retenção de Churn',
    primaryKpis: ['Margem por SKU', 'Custo Frete Real-Time', 'Taxa de Churn', 'Conversão de Checkout'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-indigo-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  },
  services: {
    id: 'services',
    name: 'Serviços, Consultoria & Tech',
    shortName: 'Serviços / Tech',
    icon: Briefcase,
    regulatoryBody: 'SOC 2 Type II / SLA 99.9%',
    complianceRule: 'Alocação de Horas Faturáveis, Ocupação de Squads & Fluxo Projetado',
    primaryKpis: ['Ocupação de Equipe', 'Horas Faturáveis', 'Runway Financeiro', 'SLA Contratos'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-sky-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  },
  real_estate: {
    id: 'real_estate',
    name: 'Real Estate & High-End Sales',
    shortName: 'Real Estate',
    icon: Building2,
    regulatoryBody: 'CRECI / RGI Cartórios / BACEN Escrow',
    complianceRule: 'Due Diligence Imobiliária, Custódia Escrow & Split de Comissões',
    primaryKpis: ['VGV em Negociação', 'Cap Rate Líquido', 'Split CRECI (6%)', 'Status Escrow'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-emerald-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  },
  agribusiness: {
    id: 'agribusiness',
    name: 'Agronegócio & Commodities',
    shortName: 'Agro / Grãos',
    icon: Wheat,
    regulatoryBody: 'MAPA / IAGRO / CPR Digital',
    complianceRule: 'Rastreabilidade de Safra, Hedging Futuro & Barter CPR',
    primaryKpis: ['Hedge Dólar/Soja', 'Capacidade Silos', 'Status CPR Registrada', 'Umidade Grãos'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-lime-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  },
  construction: {
    id: 'construction',
    name: 'Construção Civil & Infraestrutura',
    shortName: 'Construção Civil',
    icon: HardHat,
    regulatoryBody: 'PBQP-H / CREA / Caixa Econômica',
    complianceRule: 'Avanço Físico-Financeiro, Curva S & Suprimentos de Concreto',
    primaryKpis: ['Curva S Obra', 'Avanço Medição', 'Índice INCC Repasse', 'Acidentes Zero'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-amber-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  },
  energy: {
    id: 'energy',
    name: 'Energia & Utilities',
    shortName: 'Energia / CCEE',
    icon: Zap,
    regulatoryBody: 'ANEEL / CCEE / ONS',
    complianceRule: 'Despacho Mercado Livre (ACL), PLD Horário & Lastro Contratual',
    primaryKpis: ['Exposição PLD', 'Lastro Energia', 'Fator Disponibilidade', 'Geração MWh'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-amber-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  },
  logistics: {
    id: 'logistics',
    name: 'Logística, Frotas & Supply Chain',
    shortName: 'Logística & Frotas',
    icon: Truck,
    regulatoryBody: 'ANTT / CONTRAN / Anvisa RDC 430',
    complianceRule: 'Telemetria IoT em Tempo Real, Cadeia Fria & Monitoramento de Geofencing',
    primaryKpis: ['SLA On-Time', 'Temperatura Cadeia Fria', 'Ociosidade Dwell Time', 'Desvios de Rota'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-cyan-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce & Marketplace Omnichannel',
    shortName: 'E-commerce / D2C',
    icon: Globe,
    regulatoryBody: 'PCI-DSS / LGPD / CDC',
    complianceRule: 'Prevenção de Fraudes de Pagamento, SLA de Despacho & Margem Líquida',
    primaryKpis: ['Taxa de Aprovação Pagamentos', 'Chargeback Ratio', 'CAC/LTV Ratio', 'Tempo de Separação'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-violet-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  },
  financial_services: {
    id: 'financial_services',
    name: 'Instituições Financeiras, Tesouraria & Fintechs',
    shortName: 'Finanças & Bancos',
    icon: Landmark,
    regulatoryBody: 'BACEN / CVM / Resolução 4.893',
    complianceRule: 'Segregação de Funções, Limites de Exposição Intradiária & Conciliação SPB/PIX',
    primaryKpis: ['Índice de Basileia', 'Runway de Liquidez', 'Exposição Cambial Líquida', 'Taxa de Inadimplência'],
    colorClasses: {
      bg: 'bg-slate-900/90',
      border: 'border-slate-800',
      text: 'text-emerald-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }
};

interface SectorRegulatoryBadgeProps {
  currentSector: IndustrySector;
  onSelectSector?: (sector: IndustrySector) => void;
  interactive?: boolean;
}

export const SectorRegulatoryBadge: React.FC<SectorRegulatoryBadgeProps> = ({
  currentSector,
  onSelectSector,
  interactive = false
}) => {
  const config = SECTORS_CONFIG[currentSector] || SECTORS_CONFIG.manufacturing;
  const Icon = config.icon;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div 
        id="sector-regulatory-pill"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.colorClasses.bg} ${config.colorClasses.border} text-xs shadow-sm`}
      >
        <div className={`p-1 rounded-md bg-slate-900/80 ${config.colorClasses.text}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-100">{config.name}</span>
            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${config.colorClasses.badge}`}>
              {config.regulatoryBody}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {config.complianceRule}
          </span>
        </div>
      </div>

      {/* Optional interactive sector selector buttons */}
      {interactive && onSelectSector && (
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(Object.keys(SECTORS_CONFIG) as IndustrySector[]).map((secKey) => {
            const sec = SECTORS_CONFIG[secKey];
            const SecIcon = sec.icon;
            const isSelected = secKey === currentSector;

            return (
              <button
                key={secKey}
                id={`btn-sector-${secKey}`}
                onClick={() => onSelectSector(secKey)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                title={`Alternar para segmento: ${sec.name} (${sec.regulatoryBody})`}
              >
                <SecIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{sec.shortName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
