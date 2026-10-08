import React, { useState, useEffect } from 'react';
import { 
  Search, 
  AlertCircle, 
  Bell, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Layers, 
  ArrowUpRight, 
  ShieldAlert, 
  TrendingDown, 
  Send,
  Sparkles,
  Smartphone,
  Mail,
  Check,
  Building2,
  Info,
  ShieldCheck,
  Filter,
  Flame,
  HelpCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { SharedTenantTaxData, TenantTaxRecoveryBridge, MockTenantPresetId } from '../../services/tenantTaxRecoveryBridge';

interface NcmTaxMonitorPanelProps {
  tenantData: SharedTenantTaxData;
  onSwitchTenant?: (tenantId: MockTenantPresetId) => void;
}

export interface NcmTaxItem {
  id: string;
  ncmCode: string;
  description: string;
  currentIcms: number;
  currentPisCofins: string;
  currentIpi: number;
  pisCofinsRegimeType: 'BIFASICO_LEI_10485' | 'MONOFASICO' | 'NAO_CUMULATIVO';
  concentratedDetails?: {
    legalBasis: string;
    industryRate: string;
    retailRate: string;
    cstInd: string;
    cstRevenda: string;
  };
  recentAlert?: {
    type: 'ALERT_INCREASE' | 'ALERT_REDUCTION' | 'ALERT_MONOFASICO' | 'REFORMA_TRIBUTARIA';
    headline: string;
    source: string;
    publishedDate: string;
    impactDescription: string;
    actionRecommended: string;
  };
}

// 5 Produtos de Autopeças de Motocicleta com Tributação Concentrada Bifásica (Lei 10.485/2002, Art. 3º)
const MOTRIX_NCM_LIST: NcmTaxItem[] = [
  {
    id: 'ncm-motrix-1',
    ncmCode: '8714.10.10',
    description: 'Pastilhas de freio sinterizadas e semi-metálicas para motocicletas (freio dianteiro/traseiro)',
    currentIcms: 18.0,
    currentPisCofins: 'Bifásico (Lei 10.485/2002, Art. 3º)',
    currentIpi: 5.0,
    pisCofinsRegimeType: 'BIFASICO_LEI_10485',
    concentratedDetails: {
      legalBasis: 'Lei nº 10.485/2002, Art. 3º, caput e § 2º',
      industryRate: '2,30% PIS / 10,80% COFINS (Alíquota Concentrada na Indústria/Importador)',
      retailRate: 'Alíquota Zero (0,0%) — Isenção na Revenda / Varejo',
      cstInd: 'CST 02/03 (Operação Tributável Alíquota Diferenciada)',
      cstRevenda: 'CST 04 (Tributação Monofásica / Bifásica - Alíquota Zero)'
    },
    recentAlert: {
      type: 'ALERT_MONOFASICO',
      headline: 'Regime Concentrado Bifásico de Motopeças (Lei 10.485/02): Desoneração Total na Revenda',
      source: 'Receita Federal do Brasil / Solução de Consulta COSIT',
      publishedDate: 'Vigência Consolidada',
      impactDescription: 'Pela Lei nº 10.485/2002, a tributação de PIS/COFINS é concentrada na fase industrial/importação. Todas as saídas de pastilhas de freio promovidas por comerciantes atacadistas, lojas de motopeças e oficinas são desoneradas a Alíquota 0% (zero).',
      actionRecommended: 'Parametrizar cadastro do ERP TOTVS/SAP no CST 04 para saídas comerciais e habilitar levantamento de recolhimentos indevidos a 9,25% nos últimos 60 meses via PER/DCOMP.'
    }
  },
  {
    id: 'ncm-motrix-2',
    ncmCode: '8714.10.90',
    description: 'Correntes de transmissão de rolos mecânicos e elos de engrenagem para motocicletas (kits de relação)',
    currentIcms: 18.0,
    currentPisCofins: 'Bifásico (Lei 10.485/2002, Art. 3º)',
    currentIpi: 8.0,
    pisCofinsRegimeType: 'BIFASICO_LEI_10485',
    concentratedDetails: {
      legalBasis: 'Lei nº 10.485/2002, Art. 3º c/c NCM 8714.10.90 / 7315.11.00',
      industryRate: 'Tributação Concentrada na Fabricação / Montagem do Kit',
      retailRate: 'Alíquota Zero (0,0%) — Distribuição e Varejo de Reposição',
      cstInd: 'CST 02 (Alíquota Concentrada)',
      cstRevenda: 'CST 04 (Revenda com Alíquota 0%)'
    },
    recentAlert: {
      type: 'ALERT_MONOFASICO',
      headline: 'Solução de Consulta COSIT nº 74/2024: Enquadramento de Correntes de Transmissão',
      source: 'Diário Oficial da União (DOU)',
      publishedDate: 'Publicado recentemente',
      impactDescription: 'A RFB pacificou que correntes e elos de transmissão montados para veículos de duas rodas enquadram-se na lista de autopeças da Lei 10.485/2002 com incidência concentrada no fabricante e alíquota zero no comércio subsequente.',
      actionRecommended: 'Segregar faturamento de kits de transmissão no Bloco M da EFD-Contribuições, recuperando indébito médio estimado em R$ 38.200/ano em revendas indevidamente tributadas.'
    }
  },
  {
    id: 'ncm-motrix-3',
    ncmCode: '8409.91.90',
    description: 'Pistões forjados em liga de alumínio e anéis de segmento para motores de motocicleta',
    currentIcms: 18.0,
    currentPisCofins: 'Bifásico (Lei 10.485/2002, Art. 3º)',
    currentIpi: 4.0,
    pisCofinsRegimeType: 'BIFASICO_LEI_10485',
    concentratedDetails: {
      legalBasis: 'Lei nº 10.485/2002, Art. 3º, Anexo I (Peças de Motores Centelha)',
      industryRate: 'Incidência Concentrada na Saída do Fabricante / Importador',
      retailRate: 'Alíquota Zero (0,0%) nas Lojas de Peças e Retíficas',
      cstInd: 'CST 02/03',
      cstRevenda: 'CST 04 (Alíquota 0%)'
    },
    recentAlert: {
      type: 'ALERT_MONOFASICO',
      headline: 'Incidência Bifásica em Partes de Motores de Motocicletas (NCM 8409.91.90)',
      source: 'Coordenação-Geral de Tributação (COSIT/RFB)',
      publishedDate: 'Parecer Normativo Ativo',
      impactDescription: 'Pistões e anéis NCM 8409.91.90 destinados a motores de motocicletas sujeitam-se ao regime concentrado da Lei 10.485/2002, vedando a tributação de 9,25% de PIS/COFINS na cadeia de reposição e oficinas mecânicas.',
      actionRecommended: 'Auditar cadastro de itens no TOTVS Protheus para assegurar apropriação de créditos de insumos fabris na usinagem e alíquota zero nas saídas de reposição.'
    }
  },
  {
    id: 'ncm-motrix-4',
    ncmCode: '8714.10.20',
    description: 'Discos de freio ventilados e perfurados de aço inoxidável para motocicletas',
    currentIcms: 18.0,
    currentPisCofins: 'Bifásico (Lei 10.485/2002, Art. 3º)',
    currentIpi: 6.5,
    pisCofinsRegimeType: 'BIFASICO_LEI_10485',
    concentratedDetails: {
      legalBasis: 'Lei nº 10.485/2002, Art. 3º, § 1º e § 2º',
      industryRate: 'Tributação Concentrada no Fabricante de Freios',
      retailRate: 'Alíquota Zero (0,0%) no Varejo Aftermarket',
      cstInd: 'CST 02',
      cstRevenda: 'CST 04 (Alíquota 0%)'
    },
    recentAlert: {
      type: 'ALERT_REDUCTION',
      headline: 'Diferenciação Legal: Discos de Freio de Moto vs. Veículos Pesados',
      source: 'SEFAZ / Convênio ICMS & RFB',
      publishedDate: 'Acompanhamento Fiscal',
      impactDescription: 'Discos de freio sob NCM 8714.10.20 possuem tratamento específico bifásico sob a Lei 10.485/2002 com desoneração total de PIS/COFINS na revenda, além de impacto favorável no cálculo da base de ICMS-ST.',
      actionRecommended: 'Revisar formação do preço e emissão de NF-e para que revendedores não dupliquem a carga tributária federal de PIS/COFINS sobre o consumidor final.'
    }
  },
  {
    id: 'ncm-motrix-5',
    ncmCode: '8714.10.50',
    description: 'Conjunto de amortecedores telescópicos e suspensão monoshock para motocicletas',
    currentIcms: 18.0,
    currentPisCofins: 'Bifásico (Lei 10.485/2002, Art. 3º)',
    currentIpi: 5.0,
    pisCofinsRegimeType: 'BIFASICO_LEI_10485',
    concentratedDetails: {
      legalBasis: 'Lei nº 10.485/2002, Art. 3º, Anexo I',
      industryRate: 'Alíquota Concentrada na Saída Fabril',
      retailRate: 'Alíquota Zero (0,0%) no Mercado de Reposição',
      cstInd: 'CST 02',
      cstRevenda: 'CST 04 (Alíquota 0%)'
    },
    recentAlert: {
      type: 'REFORMA_TRIBUTARIA',
      headline: 'PLP 68/2024: Transição do Regime Concentrado de Motopeças para CBS/IBS',
      source: 'Comitê de Transição Tributária Nacional',
      publishedDate: 'Projeção 2026/2027',
      impactDescription: 'O regime concentrado bifásico de autopeças (Lei 10.485/2002) será gradualmente unificado no modelo não-cumulativo pleno do IBS/CBS, exigindo conciliação de créditos remanescentes de 5 anos antes do encerramento do regime atual.',
      actionRecommended: 'Manter apropriação dos créditos da Lei 10.485/2002 até o fim da vigência e retificar períodos passados para não perder o direito de compensação.'
    }
  }
];

// Lista Padrão de NCMs da Vortex Logística & Manufatura S.A.
const VORTEX_NCM_LIST: NcmTaxItem[] = [
  {
    id: 'ncm-1',
    ncmCode: '8413.70.90',
    description: 'Bombas centrífugas industriais e equipamentos eletromecânicos de fluxo',
    currentIcms: 18.0,
    currentPisCofins: '9.25% (Não-Cumulativo)',
    currentIpi: 5.0,
    pisCofinsRegimeType: 'NAO_CUMULATIVO',
    recentAlert: {
      type: 'ALERT_REDUCTION',
      headline: 'Decreto Estadual nº 68.240/2025: Redução de ICMS para Bens de Capital',
      source: 'Diário Oficial do Estado de São Paulo (DOE-SP)',
      publishedDate: 'Publicado há 3 dias',
      impactDescription: 'Alíquota efetiva de ICMS reduzida de 18% para 12% nas saídas internas industriais.',
      actionRecommended: 'Atualizar parametrização da TES (Tipo de Entrada/Saída) no TOTVS Protheus para evitar recolhimento a maior.'
    }
  },
  {
    id: 'ncm-2',
    ncmCode: '8708.29.99',
    description: 'Partes e acessórios de carroçarias para veículos automóveis e tratores',
    currentIcms: 18.0,
    currentPisCofins: '0% (Monofásico - Revenda)',
    currentIpi: 8.0,
    pisCofinsRegimeType: 'MONOFASICO',
    recentAlert: {
      type: 'ALERT_MONOFASICO',
      headline: 'Solução de Consulta COSIT nº 148/2025: Crédito Monofásico em Insumos',
      source: 'Diário Oficial da União (DOU)',
      publishedDate: 'Publicado há 1 semana',
      impactDescription: 'RFB autoriza expressamente crédito de PIS/COFINS na aquisição de autopeças utilizadas como insumo na prestação de serviços.',
      actionRecommended: 'Habilitar apropriação de crédito no Bloco M da EFD-Contribuições no valor estimado de R$ 14.500/mês.'
    }
  },
  {
    id: 'ncm-3',
    ncmCode: '2710.19.32',
    description: 'Óleos lubrificantes industriais e fluidos hidráulicos de alta viscosidade',
    currentIcms: 18.0,
    currentPisCofins: 'Tributação Monofásica',
    currentIpi: 0.0,
    pisCofinsRegimeType: 'MONOFASICO',
    recentAlert: {
      type: 'ALERT_INCREASE',
      headline: 'Portaria SEFAZ: Atualização da MVA de ICMS-ST para Lubrificantes',
      source: 'SEFAZ Nacional (Convênio ICMS)',
      publishedDate: 'Publicado há 12 dias',
      impactDescription: 'MVA ajustada de 42.5% para 48.2% para operações interestaduais com destino à região Sudeste.',
      actionRecommended: 'Revisar formação do preço de venda e cálculo da substituição tributária na emissão das NF-e.'
    }
  },
  {
    id: 'ncm-4',
    ncmCode: '3923.30.00',
    description: 'Garrafões, garrafas, frascos e recipientes plásticos industriais',
    currentIcms: 18.0,
    currentPisCofins: '9.25% (Não-Cumulativo)',
    currentIpi: 6.5,
    pisCofinsRegimeType: 'NAO_CUMULATIVO',
    recentAlert: {
      type: 'REFORMA_TRIBUTARIA',
      headline: 'PLP 68/2024 (Reforma Tributária): Regra de Transição IBS / CBS',
      source: 'Congresso Nacional',
      publishedDate: 'Em Acompanhamento Ativo',
      impactDescription: 'NCM elegível para creditamento integral imediato sob regime do IBS e CBS na fase de teste de 2026.',
      actionRecommended: 'Mapeamento preliminar para conciliação das novas guias digitais do Comitê Gestor do IBS.'
    }
  }
];

export const NcmTaxMonitorPanel: React.FC<NcmTaxMonitorPanelProps> = ({ 
  tenantData,
  onSwitchTenant 
}) => {
  const isMotrix = tenantData.cnpj?.includes('21.554.870') || tenantData.companyName?.toLowerCase().includes('motrix');

  const [searchFilter, setSearchFilter] = useState<string>('');
  const [regimeFilter, setRegimeFilter] = useState<'TODOS' | 'BIFASICO' | 'MONOFASICO' | 'NAO_CUMULATIVO'>('TODOS');
  const [whatsappAlertPhone, setWhatsappAlertPhone] = useState<string>(
    isMotrix 
      ? '+55 (11) 98721-3344 (Dr. Geraldo - Perito Tributário Motrix)' 
      : '+55 (11) 99841-7720 (Contador Chefe)'
  );
  const [emailAlertContact, setEmailAlertContact] = useState<string>(
    isMotrix ? 'fiscal@motrixauto.com.br' : 'fiscal@vortexlog.com.br'
  );
  const [isSendingTestAlert, setIsSendingTestAlert] = useState<boolean>(false);
  const [alertSentSuccess, setAlertSentSuccess] = useState<boolean>(false);

  // Atualizar contatos quando o tenant alternar
  useEffect(() => {
    if (isMotrix) {
      setWhatsappAlertPhone('+55 (11) 98721-3344 (Dr. Geraldo - Perito Tributário Motrix)');
      setEmailAlertContact('fiscal@motrixauto.com.br');
    } else {
      setWhatsappAlertPhone('+55 (11) 99841-7720 (Contador Chefe)');
      setEmailAlertContact('fiscal@vortexlog.com.br');
    }
  }, [isMotrix]);

  // Lista base dependente do tenant selecionado
  const currentNcmList = isMotrix ? MOTRIX_NCM_LIST : VORTEX_NCM_LIST;

  const filteredNcms = currentNcmList.filter(item => {
    const matchesSearch = 
      item.ncmCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.currentPisCofins.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;

    if (regimeFilter === 'BIFASICO') {
      return item.pisCofinsRegimeType === 'BIFASICO_LEI_10485';
    }
    if (regimeFilter === 'MONOFASICO') {
      return item.pisCofinsRegimeType === 'MONOFASICO';
    }
    if (regimeFilter === 'NAO_CUMULATIVO') {
      return item.pisCofinsRegimeType === 'NAO_CUMULATIVO';
    }

    return true;
  });

  const handleSwitchTenantInternal = (presetId: MockTenantPresetId) => {
    if (onSwitchTenant) {
      onSwitchTenant(presetId);
    } else {
      TenantTaxRecoveryBridge.setMockPreset(presetId);
    }
  };

  const handleSendTestAlert = () => {
    setIsSendingTestAlert(true);
    setTimeout(() => {
      setIsSendingTestAlert(false);
      setAlertSentSuccess(true);
      setTimeout(() => setAlertSentSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner com Seletor Integrado de Tenant */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white tracking-tight">Monitor Proativo de NCMs &amp; Radar Legislativo</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Radar DOU / SEFAZ 24/7
                </span>
                {isMotrix && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                    Tributação Concentrada Bifásica (Lei 10.485/02)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Varredura contínua de Diários Oficiais e alterações de alíquotas de ICMS, ST, IPI e PIS/COFINS incidentes sobre os produtos do tenant <strong className="text-white">{tenantData.companyName}</strong> ({tenantData.cnpj}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Seletor Rápido de Tenant no Monitor de NCMs */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-xl">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-mono uppercase font-bold leading-none">Empresa Monitorada:</span>
                <select
                  id="select-ncm-tenant-dropdown"
                  value={isMotrix ? 'motrix' : 'vortex'}
                  onChange={(e) => handleSwitchTenantInternal(e.target.value as MockTenantPresetId)}
                  className="bg-transparent text-white font-mono text-xs font-bold focus:outline-none cursor-pointer pr-2 pt-0.5"
                >
                  <option value="vortex" className="bg-slate-900 text-white">Vortex Logística &amp; Manufatura S.A. (Lucro Real Geral)</option>
                  <option value="motrix" className="bg-slate-900 text-cyan-300 font-bold">Motrix Componentes Automotivos Ltda. (Motopeças — Lei 10.485/02)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSendTestAlert}
              disabled={isSendingTestAlert}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer shrink-0"
            >
              {isSendingTestAlert ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando Alerta...</span>
                </>
              ) : alertSentSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Alerta Disparado no WhatsApp!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Disparar Alerta p/ Contador</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informative Callout sobre o Regime Concentrado Bifásico quando Motrix estiver ativa */}
        {isMotrix && (
          <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-xl flex items-start gap-3.5 text-xs text-slate-300">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="text-cyan-300 font-bold text-sm">
                  Regime Concentrado Bifásico de Autopeças de Motocicleta (Lei nº 10.485/2002, Art. 3º)
                </strong>
                <span className="px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-700 text-[10px] font-mono font-semibold">
                  Distinto do Monofásico Geral de Veículos &amp; Combustíveis
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Ao contrário do monofásico de combustíveis ou veículos acabados, as autopeças e motopeças são regidas pelo regime concentrado do <strong className="text-white">Art. 3º da Lei nº 10.485/2002</strong>: a incidência de PIS/COFINS é majorada na primeira etapa (indústria/importador), enquanto <strong className="text-emerald-300">todas as saídas de comerciantes atacadistas, varejistas e oficinas mecânicas têm alíquota ZERO (0,0%)</strong> (Art. 3º, § 2º - CST 04).
              </p>
              <p className="text-cyan-200 font-mono text-[11px] pt-1">
                ⚠️ <strong>Oportunidade de Recuperação Velatrix:</strong> Empresas distribuidoras e lojas de motopeças frequentemente tributam essas saídas com 9,25% por erro de cadastro fiscal no ERP. Esse indébito recolhido a maior é 100% recuperável nos últimos 60 meses via PER/DCOMP administrativo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Webhook & Notification Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Canais de Notificação Imediata (Alerta Fiscal Zero-Delay)</div>
              <div className="text-[11px] text-slate-400">Assim que um novo Decreto ou Solução de Consulta afeta um NCM, seu contador recebe a recomendação de ajuste.</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">WhatsApp:</span>
              <input
                type="text"
                value={whatsappAlertPhone}
                onChange={(e) => setWhatsappAlertPhone(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 font-mono text-xs w-68"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">E-mail:</span>
              <input
                type="text"
                value={emailAlertContact}
                onChange={(e) => setEmailAlertContact(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 font-mono text-xs w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* NCM Table with Filters and Bifásico Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por código NCM, produto ou classificação..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-72 md:w-84"
              />
            </div>

            {/* Filtro por Regime */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" />
                Regime:
              </span>
              <button
                onClick={() => setRegimeFilter('TODOS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  regimeFilter === 'TODOS'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              {isMotrix && (
                <button
                  onClick={() => setRegimeFilter('BIFASICO')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    regimeFilter === 'BIFASICO'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Bifásico (Lei 10.485/02)
                </button>
              )}
              <button
                onClick={() => setRegimeFilter('MONOFASICO')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  regimeFilter === 'MONOFASICO'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                Monofásico
              </button>
              <button
                onClick={() => setRegimeFilter('NAO_CUMULATIVO')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  regimeFilter === 'NAO_CUMULATIVO'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                Não-Cumulativo
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Monitorando <strong>{filteredNcms.length}</strong> produtos de {tenantData.companyName}
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredNcms.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-mono">
              Nenhum NCM encontrado para o filtro aplicado.
            </div>
          ) : (
            filteredNcms.map((item) => (
              <div key={item.id} className="p-5 hover:bg-slate-800/20 transition-colors space-y-3.5">
                {/* Linha Superior: NCM + Descrição + Alíquotas Rápidas */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-mono font-bold text-xs border border-amber-500/30 shrink-0">
                      NCM {item.ncmCode}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.description}</h4>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.pisCofinsRegimeType === 'BIFASICO_LEI_10485' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-950 text-cyan-300 border border-cyan-600/70">
                            ★ {item.currentPisCofins}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {item.currentPisCofins}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          ICMS: <strong className="text-slate-200">{item.currentIcms}%</strong>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          IPI: <strong className="text-slate-200">{item.currentIpi}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    {item.pisCofinsRegimeType === 'BIFASICO_LEI_10485' ? (
                      <div className="text-right">
                        <div className="text-cyan-400 font-bold text-xs">Regime Bifásico Concentrado</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">Revenda: Alíquota 0% (CST 04)</div>
                      </div>
                    ) : (
                      <div className="text-right text-slate-300">
                        <div>PIS/COFINS: <strong className="text-cyan-400">{item.currentPisCofins}</strong></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Box Específico de Tributação Concentrada Bifásica (Lei 10.485/2002) */}
                {item.concentratedDetails && (
                  <div className="p-3.5 bg-gradient-to-r from-cyan-950/30 via-slate-950 to-cyan-950/20 rounded-xl border border-cyan-500/30 text-xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <strong className="text-cyan-200 font-semibold">
                          Detalhamento Pericial: {item.concentratedDetails.legalBasis}
                        </strong>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                        EFD-Contribuições: {item.concentratedDetails.cstRevenda}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <span>1ª Etapa: Indústria &amp; Importador</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {item.concentratedDetails.industryRate}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Enquadramento: {item.concentratedDetails.cstInd}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 space-y-1">
                        <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>2ª Etapa: Varejo, Distribuição &amp; Aftermarket</span>
                        </div>
                        <div className="text-[11px] text-emerald-300 font-semibold">
                          {item.concentratedDetails.retailRate}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400/80">
                          Enquadramento obrigatório: {item.concentratedDetails.cstRevenda}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card de Alerta Legislativo Recente */}
                {item.recentAlert && (
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <strong className="text-amber-300 font-semibold">{item.recentAlert.headline}</strong>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.recentAlert.source} • {item.recentAlert.publishedDate}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed">
                      {item.recentAlert.impactDescription}
                    </p>

                    <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between text-[11px] flex-wrap gap-2">
                      <span className="text-emerald-400 font-medium">
                        💡 <strong>Recomendação Velatrix:</strong> {item.recentAlert.actionRecommended}
                      </span>
                      <button 
                        onClick={handleSendTestAlert}
                        className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        <span>Repassar ao ERP</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
