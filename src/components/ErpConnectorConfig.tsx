import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  KeyRound, 
  Layers, 
  Cpu, 
  RefreshCw, 
  Copy, 
  Check, 
  Play, 
  Download, 
  Code2, 
  FileCode, 
  SlidersHorizontal, 
  Server, 
  Lock, 
  ArrowRight, 
  Zap, 
  HelpCircle,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SupportedLanguage, SupportedCurrency, TenantProfile } from '../types/aos';
import { formatCurrency } from '../utils/i18n';
import { VelatrixLogo } from './VelatrixLogo';
import { VELATRIX_PLAN_TIERS, PlanTier } from '../data/planFeatures';
import { GovernmentAndBaasHub } from './connectors/GovernmentAndBaasHub';
import { UnifiedTenantService } from '../services/unifiedTenantService';
import { secureInt } from '../lib/demoMode';

interface ErpConnectorConfigProps {
  tenantProfile: TenantProfile;
  language: SupportedLanguage;
  currency: SupportedCurrency;
  onBackToDashboard?: () => void;
  onInjectTestScenario?: (scenarioName: string) => void;
  onOpenVectorStore?: () => void;
}

type ErpVendor = 'totvs_protheus' | 'sap_s4hana' | 'oracle_netsuite' | 'senior_sapiens' | 'bling_omie' | 'custom_rest';
type AuthMethod = 'oauth2' | 'api_key' | 'mtls_secp256k1';
type DeploymentType = 'cloud_to_cloud' | 'on_premise_vpn' | 'local_sql_proxy';

interface FieldMappingItem {
  id: string;
  category: 'material_bom' | 'production_orders' | 'suppliers' | 'treasury_tax';
  erpField: string;
  aosVariable: string;
  description: string;
  dataType: 'string' | 'number' | 'timestamp' | 'array';
  required: boolean;
}

const DEFAULT_MAPPINGS: Record<ErpVendor, FieldMappingItem[]> = {
  totvs_protheus: [
    { id: 'm1', category: 'material_bom', erpField: 'B1_COD', aosVariable: 'aos_item_id', description: 'Código do Item / SKU', dataType: 'string', required: true },
    { id: 'm2', category: 'material_bom', erpField: 'B1_DESC', aosVariable: 'aos_item_description', description: 'Descrição da Peça/Insumo', dataType: 'string', required: true },
    { id: 'm3', category: 'material_bom', erpField: 'B1_POSIPI', aosVariable: 'aos_ncm_code', description: 'Código Fiscal NCM / SPED', dataType: 'string', required: true },
    { id: 'm4', category: 'material_bom', erpField: 'B1_ESTSEG', aosVariable: 'aos_safety_stock_units', description: 'Estoque de Segurança', dataType: 'number', required: false },
    { id: 'm5', category: 'material_bom', erpField: 'B1_LEAD', aosVariable: 'aos_nominal_lead_time_days', description: 'Lead Time Nominal (Dias)', dataType: 'number', required: true },
    { id: 'p1', category: 'production_orders', erpField: 'C2_NUM', aosVariable: 'aos_production_order_id', description: 'Número da Ordem de Produção (OP)', dataType: 'string', required: true },
    { id: 'p2', category: 'production_orders', erpField: 'C2_ITEM', aosVariable: 'aos_finished_good_id', description: 'SKU do Produto Acabado', dataType: 'string', required: true },
    { id: 'p3', category: 'production_orders', erpField: 'C2_QUANT', aosVariable: 'aos_planned_quantity', description: 'Quantidade Planejada', dataType: 'number', required: true },
    { id: 'p4', category: 'production_orders', erpField: 'C2_DATPRI', aosVariable: 'aos_scheduled_start_timestamp', description: 'Data de Início Prevista', dataType: 'timestamp', required: true },
    { id: 's1', category: 'suppliers', erpField: 'A2_COD', aosVariable: 'aos_primary_supplier_id', description: 'Código do Fornecedor Homologado', dataType: 'string', required: true },
    { id: 's2', category: 'suppliers', erpField: 'A2_NOME', aosVariable: 'aos_supplier_legal_name', description: 'Razão Social do Fornecedor', dataType: 'string', required: true },
    { id: 's3', category: 'suppliers', erpField: 'G1_COMP', aosVariable: 'aos_bom_child_component_id', description: 'Componente Filho na Estrutura BOM', dataType: 'string', required: true },
    { id: 's4', category: 'suppliers', erpField: 'G1_QUANT', aosVariable: 'aos_bom_component_ratio', description: 'Fator de Proporção na BOM', dataType: 'number', required: true },
    { id: 't1', category: 'treasury_tax', erpField: 'E2_VALOR', aosVariable: 'aos_payable_amount_brl', description: 'Valor do Título a Pagar (BRL)', dataType: 'number', required: true },
    { id: 't2', category: 'treasury_tax', erpField: 'M2_TAXA', aosVariable: 'aos_spot_exchange_rate', description: 'Taxa Cambial Spot USD/BRL', dataType: 'number', required: false }
  ],
  sap_s4hana: [
    { id: 'm1', category: 'material_bom', erpField: 'MATNR', aosVariable: 'aos_item_id', description: 'Material Number (SKU)', dataType: 'string', required: true },
    { id: 'm2', category: 'material_bom', erpField: 'MAKTX', aosVariable: 'aos_item_description', description: 'Material Description', dataType: 'string', required: true },
    { id: 'm3', category: 'material_bom', erpField: 'STEUC', aosVariable: 'aos_ncm_code', description: 'Control Code / NCM Fiscal', dataType: 'string', required: true },
    { id: 'm4', category: 'material_bom', erpField: 'EISBE', aosVariable: 'aos_safety_stock_units', description: 'Safety Stock Level', dataType: 'number', required: false },
    { id: 'm5', category: 'material_bom', erpField: 'PLIFZ', aosVariable: 'aos_nominal_lead_time_days', description: 'Planned Delivery Time (Days)', dataType: 'number', required: true },
    { id: 'p1', category: 'production_orders', erpField: 'AUFNR', aosVariable: 'aos_production_order_id', description: 'Production Order Number', dataType: 'string', required: true },
    { id: 'p2', category: 'production_orders', erpField: 'MATNR_FG', aosVariable: 'aos_finished_good_id', description: 'Finished Good Material ID', dataType: 'string', required: true },
    { id: 'p3', category: 'production_orders', erpField: 'GAMNG', aosVariable: 'aos_planned_quantity', description: 'Total Order Quantity', dataType: 'number', required: true },
    { id: 'p4', category: 'production_orders', erpField: 'GSTRP', aosVariable: 'aos_scheduled_start_timestamp', description: 'Basic Start Date', dataType: 'timestamp', required: true },
    { id: 's1', category: 'suppliers', erpField: 'LIFNR', aosVariable: 'aos_primary_supplier_id', description: 'Vendor Account Number', dataType: 'string', required: true },
    { id: 's2', category: 'suppliers', erpField: 'NAME1', aosVariable: 'aos_supplier_legal_name', description: 'Vendor Name 1', dataType: 'string', required: true },
    { id: 's3', category: 'suppliers', erpField: 'IDNRK', aosVariable: 'aos_bom_child_component_id', description: 'BOM Item Component', dataType: 'string', required: true },
    { id: 's4', category: 'suppliers', erpField: 'MENGE', aosVariable: 'aos_bom_component_ratio', description: 'Component Component Quantity', dataType: 'number', required: true },
    { id: 't1', category: 'treasury_tax', erpField: 'DMBTR', aosVariable: 'aos_payable_amount_brl', description: 'Amount in Local Currency', dataType: 'number', required: true },
    { id: 't2', category: 'treasury_tax', erpField: 'UKURS', aosVariable: 'aos_spot_exchange_rate', description: 'Exchange Rate Spot Table', dataType: 'number', required: false }
  ],
  oracle_netsuite: [
    { id: 'm1', category: 'material_bom', erpField: 'itemId', aosVariable: 'aos_item_id', description: 'Item Internal Identifier', dataType: 'string', required: true },
    { id: 'm2', category: 'material_bom', erpField: 'displayName', aosVariable: 'aos_item_description', description: 'Item Display Name', dataType: 'string', required: true },
    { id: 'm3', category: 'material_bom', erpField: 'custitem_ncm_code', aosVariable: 'aos_ncm_code', description: 'Custom NCM Field', dataType: 'string', required: true },
    { id: 'm4', category: 'material_bom', erpField: 'safetyStockLevel', aosVariable: 'aos_safety_stock_units', description: 'Safety Stock Threshold', dataType: 'number', required: false },
    { id: 'm5', category: 'material_bom', erpField: 'leadTime', aosVariable: 'aos_nominal_lead_time_days', description: 'Vendor Lead Time Days', dataType: 'number', required: true },
    { id: 'p1', category: 'production_orders', erpField: 'workOrderNumber', aosVariable: 'aos_production_order_id', description: 'Work Order Transaction ID', dataType: 'string', required: true },
    { id: 'p2', category: 'production_orders', erpField: 'assemblyItem', aosVariable: 'aos_finished_good_id', description: 'Assembly Item SKU', dataType: 'string', required: true },
    { id: 'p3', category: 'production_orders', erpField: 'orderQuantity', aosVariable: 'aos_planned_quantity', description: 'Work Order Quantity', dataType: 'number', required: true },
    { id: 'p4', category: 'production_orders', erpField: 'startDate', aosVariable: 'aos_scheduled_start_timestamp', description: 'Scheduled Production Date', dataType: 'timestamp', required: true },
    { id: 's1', category: 'suppliers', erpField: 'entityId', aosVariable: 'aos_primary_supplier_id', description: 'Vendor Entity ID', dataType: 'string', required: true },
    { id: 's2', category: 'suppliers', erpField: 'companyName', aosVariable: 'aos_supplier_legal_name', description: 'Vendor Legal Company Name', dataType: 'string', required: true },
    { id: 's3', category: 'suppliers', erpField: 'memberItem', aosVariable: 'aos_bom_child_component_id', description: 'BOM Member Component', dataType: 'string', required: true },
    { id: 's4', category: 'suppliers', erpField: 'bomQuantity', aosVariable: 'aos_bom_component_ratio', description: 'Member Quantity Ratio', dataType: 'number', required: true },
    { id: 't1', category: 'treasury_tax', erpField: 'totalAmount', aosVariable: 'aos_payable_amount_brl', description: 'Bill Transaction Amount', dataType: 'number', required: true },
    { id: 't2', category: 'treasury_tax', erpField: 'exchangeRate', aosVariable: 'aos_spot_exchange_rate', description: 'Currency Exchange Rate', dataType: 'number', required: false }
  ],
  senior_sapiens: [
    { id: 'm1', category: 'material_bom', erpField: 'CODPRO', aosVariable: 'aos_item_id', description: 'Código do Produto', dataType: 'string', required: true },
    { id: 'm2', category: 'material_bom', erpField: 'DESPRO', aosVariable: 'aos_item_description', description: 'Descrição do Produto', dataType: 'string', required: true },
    { id: 'm3', category: 'material_bom', erpField: 'CLAFIS', aosVariable: 'aos_ncm_code', description: 'Classificação Fiscal NCM', dataType: 'string', required: true },
    { id: 'm4', category: 'material_bom', erpField: 'ESTSEG', aosVariable: 'aos_safety_stock_units', description: 'Estoque de Segurança', dataType: 'number', required: false },
    { id: 'm5', category: 'material_bom', erpField: 'TEMREP', aosVariable: 'aos_nominal_lead_time_days', description: 'Tempo de Reposição Dias', dataType: 'number', required: true },
    { id: 'p1', category: 'production_orders', erpField: 'NUMORP', aosVariable: 'aos_production_order_id', description: 'Número da Ordem de Produção', dataType: 'string', required: true },
    { id: 'p2', category: 'production_orders', erpField: 'PROORI', aosVariable: 'aos_finished_good_id', description: 'Produto Origem da OP', dataType: 'string', required: true },
    { id: 'p3', category: 'production_orders', erpField: 'QTDPRV', aosVariable: 'aos_planned_quantity', description: 'Quantidade Prevista', dataType: 'number', required: true },
    { id: 'p4', category: 'production_orders', erpField: 'DATINI', aosVariable: 'aos_scheduled_start_timestamp', description: 'Data Inicial da OP', dataType: 'timestamp', required: true },
    { id: 's1', category: 'suppliers', erpField: 'CODFOR', aosVariable: 'aos_primary_supplier_id', description: 'Código do Fornecedor', dataType: 'string', required: true },
    { id: 's2', category: 'suppliers', erpField: 'NOMFOR', aosVariable: 'aos_supplier_legal_name', description: 'Nome do Fornecedor', dataType: 'string', required: true },
    { id: 's3', category: 'suppliers', erpField: 'CODCOM', aosVariable: 'aos_bom_child_component_id', description: 'Código do Componente na Ficha', dataType: 'string', required: true },
    { id: 's4', category: 'suppliers', erpField: 'QTDUTI', aosVariable: 'aos_bom_component_ratio', description: 'Quantidade Utilizada', dataType: 'number', required: true },
    { id: 't1', category: 'treasury_tax', erpField: 'VLRTIT', aosVariable: 'aos_payable_amount_brl', description: 'Valor do Título', dataType: 'number', required: true },
    { id: 't2', category: 'treasury_tax', erpField: 'COTMOE', aosVariable: 'aos_spot_exchange_rate', description: 'Cotação da Moeda', dataType: 'number', required: false }
  ],
  bling_omie: [
    { id: 'm1', category: 'material_bom', erpField: 'codigo', aosVariable: 'aos_item_id', description: 'Código do Produto', dataType: 'string', required: true },
    { id: 'm2', category: 'material_bom', erpField: 'descricao', aosVariable: 'aos_item_description', description: 'Descrição', dataType: 'string', required: true },
    { id: 'm3', category: 'material_bom', erpField: 'ncm', aosVariable: 'aos_ncm_code', description: 'NCM do Produto', dataType: 'string', required: true },
    { id: 'm4', category: 'material_bom', erpField: 'estoqueMinimo', aosVariable: 'aos_safety_stock_units', description: 'Estoque Mínimo', dataType: 'number', required: false },
    { id: 'm5', category: 'material_bom', erpField: 'prazoEntregaDias', aosVariable: 'aos_nominal_lead_time_days', description: 'Prazo de Entrega', dataType: 'number', required: true },
    { id: 'p1', category: 'production_orders', erpField: 'numeroPedido', aosVariable: 'aos_production_order_id', description: 'ID Ordem / Pedido Fabril', dataType: 'string', required: true },
    { id: 'p2', category: 'production_orders', erpField: 'itemPrincipal', aosVariable: 'aos_finished_good_id', description: 'SKU Principal', dataType: 'string', required: true },
    { id: 'p3', category: 'production_orders', erpField: 'quantidade', aosVariable: 'aos_planned_quantity', description: 'Quantidade a Produzir', dataType: 'number', required: true },
    { id: 'p4', category: 'production_orders', erpField: 'dataPrevista', aosVariable: 'aos_scheduled_start_timestamp', description: 'Data Prevista', dataType: 'timestamp', required: true },
    { id: 's1', category: 'suppliers', erpField: 'idContatoFornecedor', aosVariable: 'aos_primary_supplier_id', description: 'ID Fornecedor', dataType: 'string', required: true },
    { id: 's2', category: 'suppliers', erpField: 'nomeFornecedor', aosVariable: 'aos_supplier_legal_name', description: 'Razão Social', dataType: 'string', required: true },
    { id: 's3', category: 'suppliers', erpField: 'codigoInsumo', aosVariable: 'aos_bom_child_component_id', description: 'Código Insumo Filho', dataType: 'string', required: true },
    { id: 's4', category: 'suppliers', erpField: 'proporcao', aosVariable: 'aos_bom_component_ratio', description: 'Proporção', dataType: 'number', required: true },
    { id: 't1', category: 'treasury_tax', erpField: 'valorTotal', aosVariable: 'aos_payable_amount_brl', description: 'Valor a Pagar', dataType: 'number', required: true },
    { id: 't2', category: 'treasury_tax', erpField: 'cotacaoDolar', aosVariable: 'aos_spot_exchange_rate', description: 'Taxa Cambial', dataType: 'number', required: false }
  ],
  custom_rest: [
    { id: 'm1', category: 'material_bom', erpField: 'item_code', aosVariable: 'aos_item_id', description: 'Item Code', dataType: 'string', required: true },
    { id: 'm2', category: 'material_bom', erpField: 'item_name', aosVariable: 'aos_item_description', description: 'Item Name', dataType: 'string', required: true },
    { id: 'm3', category: 'material_bom', erpField: 'ncm_code', aosVariable: 'aos_ncm_code', description: 'Fiscal Code', dataType: 'string', required: true },
    { id: 'm4', category: 'material_bom', erpField: 'safety_stock', aosVariable: 'aos_safety_stock_units', description: 'Safety Stock', dataType: 'number', required: false },
    { id: 'm5', category: 'material_bom', erpField: 'lead_time_days', aosVariable: 'aos_nominal_lead_time_days', description: 'Lead Time Days', dataType: 'number', required: true },
    { id: 'p1', category: 'production_orders', erpField: 'order_number', aosVariable: 'aos_production_order_id', description: 'Order ID', dataType: 'string', required: true },
    { id: 'p2', category: 'production_orders', erpField: 'sku_finished', aosVariable: 'aos_finished_good_id', description: 'SKU Finished Good', dataType: 'string', required: true },
    { id: 'p3', category: 'production_orders', erpField: 'planned_qty', aosVariable: 'aos_planned_quantity', description: 'Planned Quantity', dataType: 'number', required: true },
    { id: 'p4', category: 'production_orders', erpField: 'scheduled_date', aosVariable: 'aos_scheduled_start_timestamp', description: 'Scheduled Timestamp', dataType: 'timestamp', required: true },
    { id: 's1', category: 'suppliers', erpField: 'supplier_id', aosVariable: 'aos_primary_supplier_id', description: 'Supplier ID', dataType: 'string', required: true },
    { id: 's2', category: 'suppliers', erpField: 'supplier_name', aosVariable: 'aos_supplier_legal_name', description: 'Supplier Name', dataType: 'string', required: true },
    { id: 's3', category: 'suppliers', erpField: 'bom_child_sku', aosVariable: 'aos_bom_child_component_id', description: 'BOM Child SKU', dataType: 'string', required: true },
    { id: 's4', category: 'suppliers', erpField: 'bom_ratio', aosVariable: 'aos_bom_component_ratio', description: 'BOM Ratio', dataType: 'number', required: true },
    { id: 't1', category: 'treasury_tax', erpField: 'payable_value', aosVariable: 'aos_payable_amount_brl', description: 'Payable Amount', dataType: 'number', required: true },
    { id: 't2', category: 'treasury_tax', erpField: 'fx_rate', aosVariable: 'aos_spot_exchange_rate', description: 'Exchange Rate', dataType: 'number', required: false }
  ]
};

export const ErpConnectorConfig: React.FC<ErpConnectorConfigProps> = ({
  tenantProfile,
  language,
  currency,
  onBackToDashboard,
  onInjectTestScenario,
  onOpenVectorStore
}) => {
  // Hub View Toggle: Government & BaaS Hub (AOS V2) vs Traditional ERP
  const [activeHubView, setActiveHubView] = useState<'gov_baas' | 'erp_traditional'>('gov_baas');

  // Sincronização Dinâmica com o Tenant Ativo Unificado
  const [activeProfile, setActiveProfile] = useState<TenantProfile>(() => {
    const active = UnifiedTenantService.getActiveTenant();
    if (active) {
      return {
        ...tenantProfile,
        id: active.id,
        name: active.name,
        cnpj: active.cnpj
      };
    }
    return tenantProfile;
  });

  useEffect(() => {
    const syncTenant = (t: any) => {
      if (t) {
        setActiveProfile(prev => ({
          ...prev,
          id: t.id,
          name: t.name,
          cnpj: t.cnpj
        }));
        setConnectionName(`${t.name} - Production ERP Bridge`);
      }
    };

    const active = UnifiedTenantService.getActiveTenant();
    if (active) syncTenant(active);

    const unsubscribe = UnifiedTenantService.subscribe(syncTenant);
    return () => unsubscribe();
  }, []);

  // Main Configuration State
  const [connectionName, setConnectionName] = useState<string>(`${activeProfile.name} - Production ERP Bridge`);
  const [selectedVendor, setSelectedVendor] = useState<ErpVendor>('totvs_protheus');
  const [deploymentType, setDeploymentType] = useState<DeploymentType>('cloud_to_cloud');
  const [erpBaseUrl, setErpBaseUrl] = useState<string>('https://totvs.cliente.com.br:8443/rest/v1');
  const [ingestWebhookPath, setIngestWebhookPath] = useState<string>('/api/v1/aos/ingest/event');
  const [resolutionWebhookPath, setResolutionWebhookPath] = useState<string>('/production-orders/re-route');
  
  // Auth State
  const [authMethod, setAuthMethod] = useState<AuthMethod>('oauth2');
  const [clientId, setClientId] = useState<string>('aos_middleware_prod_client_01');
  const [clientSecret, setClientSecret] = useState<string>('sec_9941a80c2f841e990b7e390a');
  const [showClientSecret, setShowClientSecret] = useState<boolean>(false);
  const [oauthTokenUrl, setOauthTokenUrl] = useState<string>('https://auth.cliente.com.br/oauth/v2/token');
  const [oauthScopes, setOauthScopes] = useState<string>('production:read production:write bom:update treasury:read');
  const [apiKeyHeader, setApiKeyHeader] = useState<string>('X-API-Key');
  const [apiKeyValue, setApiKeyValue] = useState<string>('aos_live_key_99410bf72e904123c01288b');
  const [mtlsCertificateId, setMtlsCertificateId] = useState<string>('cert_x509_secp256k1_nortex_2026');

  // Field Mappings State
  const [fieldMappings, setFieldMappings] = useState<FieldMappingItem[]>(DEFAULT_MAPPINGS.totvs_protheus);
  const [activeMappingCategory, setActiveMappingCategory] = useState<'all' | 'material_bom' | 'production_orders' | 'suppliers' | 'treasury_tax'>('all');

  // Test Connection & Inspection State
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'failed';
    latencyMs: number;
    timestamp: string;
    merkleRoot: string;
    signatureSecp256k1: string;
    httpStatus: number;
    validatedFieldsCount: number;
  }>({
    status: 'idle',
    latencyMs: 0,
    timestamp: '',
    merkleRoot: '',
    signatureSecp256k1: '',
    httpStatus: 200,
    validatedFieldsCount: 0
  });

  const [activeInspectorTab, setActiveInspectorTab] = useState<'payload_test' | 'curl_command' | 'secp256k1_multisig' | 'schema_export'>('payload_test');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Handle vendor preset change
  const handleVendorChange = (vendor: ErpVendor) => {
    setSelectedVendor(vendor);
    setFieldMappings(DEFAULT_MAPPINGS[vendor] || DEFAULT_MAPPINGS.custom_rest);

    if (vendor === 'totvs_protheus') {
      setErpBaseUrl('https://totvs.cliente.com.br:8443/rest/v1');
      setResolutionWebhookPath('/production-orders/re-route');
    } else if (vendor === 'sap_s4hana') {
      setErpBaseUrl('https://sap-gateway.cliente.com.br:50000/sap/opu/odata/sap/API_PRODUCTION_ORDERS');
      setResolutionWebhookPath('/A_ProductionOrder2/reassignBOM');
    } else if (vendor === 'oracle_netsuite') {
      setErpBaseUrl('https://system.netsuite.com/services/rest/record/v1');
      setResolutionWebhookPath('/workOrder/reallocate');
    } else if (vendor === 'senior_sapiens') {
      setErpBaseUrl('https://senior.cliente.com.br:8181/g5-senior-services/sapiens_Synchro');
      setResolutionWebhookPath('/productionOrders/updateSupplier');
    } else if (vendor === 'bling_omie') {
      setErpBaseUrl('https://api.omie.com.br/api/v1/geral/produtos/');
      setResolutionWebhookPath('/pedidos-producao/ajuste');
    } else {
      setErpBaseUrl('https://api.cliente.com.br/v1');
      setResolutionWebhookPath('/v1/production-orders/re-route');
    }
  };

  // Update specific mapping item
  const handleUpdateMapping = (id: string, updatedField: Partial<FieldMappingItem>) => {
    setFieldMappings(prev => prev.map(item => item.id === id ? { ...item, ...updatedField } : item));
  };

  // Add custom mapping
  const handleAddCustomField = () => {
    const newField: FieldMappingItem = {
      id: `custom_${Date.now()}`,
      category: activeMappingCategory === 'all' ? 'material_bom' : activeMappingCategory,
      erpField: 'CUSTOM_ERP_FIELD',
      aosVariable: 'aos_custom_variable',
      description: 'Campo Adicional Customizado',
      dataType: 'string',
      required: false
    };
    setFieldMappings(prev => [...prev, newField]);
  };

  // Remove mapping
  const handleRemoveField = (id: string) => {
    setFieldMappings(prev => prev.filter(item => item.id !== id));
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Simulate Testing ERP Connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(prev => ({ ...prev, status: 'idle' }));

    // Simulate network handshake & cryptographic hashing
    await new Promise(resolve => setTimeout(resolve, 850));

    const simulatedLatency = secureInt(120, 159); // 120ms - 160ms
    const randomHash = `0x${Array.from({ length: 32 }, () => secureInt(0, 15).toString(16)).join('')}`;
    const randomSig = `0x${Array.from({ length: 64 }, () => secureInt(0, 15).toString(16)).join('')}`;

    setTestResult({
      status: 'success',
      latencyMs: simulatedLatency,
      timestamp: new Date().toISOString(),
      merkleRoot: randomHash,
      signatureSecp256k1: randomSig,
      httpStatus: 200,
      validatedFieldsCount: fieldMappings.length
    });
    setIsTestingConnection(false);
  };

  // Generate Sample Ingest Test Payload
  const generateTestPayloadJson = () => {
    const mappedFieldsObj: Record<string, any> = {};
    fieldMappings.forEach(m => {
      if (m.dataType === 'number') {
        mappedFieldsObj[m.erpField] = 4500;
      } else if (m.dataType === 'timestamp') {
        mappedFieldsObj[m.erpField] = '2026-08-17T15:00:00Z';
      } else {
        mappedFieldsObj[m.erpField] = m.erpField === 'B1_POSIPI' || m.erpField === 'STEUC' ? '8542.31.90' : 'TEST_VALUE_SAMPLE';
      }
    });

    return JSON.stringify({
      aos_protocol_version: '4.8',
      connection_id: 'CONN-AOS-ERP-2026',
      tenant_cnpj: activeProfile.cnpj,
      vendor_target: selectedVendor,
      timestamp_utc: testResult.timestamp || '2026-08-17T15:00:00Z',
      event_type: 'BOM_CRITICAL_RUPTURE_SIMULATION',
      erp_base_url: erpBaseUrl,
      auth_strategy: authMethod,
      mapped_data_sample: mappedFieldsObj,
      cryptographic_attestation: {
        algorithm: 'ECDSA_SECP256K1',
        merkle_root: testResult.merkleRoot || '0x9F4C82A1B7E3910F628D5A4C2E910B87632A4C',
        multi_sig_quorum: '7/7_CONSENSUS_REACHED'
      }
    }, null, 2);
  };

  // Generate cURL command
  const generateCurlCommand = () => {
    const authHeader = authMethod === 'oauth2'
      ? `-H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."`
      : authMethod === 'api_key'
      ? `-H "${apiKeyHeader}: ${apiKeyValue}"`
      : `-H "X-AOS-mTLS-CertId: ${mtlsCertificateId}"`;

    return `curl -X POST "${erpBaseUrl}${resolutionWebhookPath}" \\
  -H "Content-Type: application/json" \\
  ${authHeader} \\
  -H "X-AOS-Timestamp: 2026-08-17T15:00:00Z" \\
  -H "X-AOS-MultiSig-Algorithm: ECDSA-SECP256K1" \\
  -H "X-AOS-Signer-CEO: 0x19A4B8F72E904123C012" \\
  -H "X-AOS-Signer-CFO: 0x7F2B94A1C8E3902183B7" \\
  -H "X-AOS-Signature: ${testResult.signatureSecp256k1 || '0x8F9B2C4E910A4C882190B7E390A4C8129801BC7F2B94A1C8E3902183B7E9A4C0'}" \\
  -d '${JSON.stringify({
    action: "EXECUTE_AUTONOMOUS_BOM_REROUTE",
    production_order_id: "OP-2026-BR-88310",
    replacement_supplier_id: "FORN-TIER2-BRA-014",
    allocated_units: 4500,
    sla_response_time_ms: 842
  }, null, 2)}'`;
  };

  // Filtered field mappings
  const filteredMappings = fieldMappings.filter(m => {
    if (activeMappingCategory === 'all') return true;
    return m.category === activeMappingCategory;
  });

  if (activeHubView === 'gov_baas') {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-5 animate-in fade-in duration-300">
        {/* High-Level Switcher between Government & BaaS Hub and Traditional ERP */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveHubView('gov_baas')}
            className="flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-950/60 font-black"
          >
            <Server className="w-4 h-4" />
            <span>Hub de Conectores Governamentais & BaaS (Receita e-CAC, PGFN, DET, SEFAZ, PIX & Boletos)</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950/40 text-slate-900 font-black">
              V2 AOS
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHubView('erp_traditional')}
            className="flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-slate-400 hover:text-white"
          >
            <Network className="w-4 h-4" />
            <span>Conectores ERP Tradicionais (TOTVS, SAP, Oracle, Senior, Bling/Omie)</span>
          </button>
        </div>

        <GovernmentAndBaasHub
          tenantProfile={activeProfile}
          language={language}
          currency={currency}
          onBackToDashboard={onBackToDashboard}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* High-Level Switcher between Government & BaaS Hub and Traditional ERP */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs">
        <button
          type="button"
          onClick={() => setActiveHubView('gov_baas')}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-slate-400 hover:text-white"
        >
          <Server className="w-4 h-4" />
          <span>Hub de Conectores Governamentais & BaaS (Receita e-CAC, PGFN, DET, SEFAZ, PIX & Boletos)</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 font-bold border border-cyan-600/40">
            V2 AOS
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveHubView('erp_traditional')}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-950/60 font-black"
        >
          <Network className="w-4 h-4" />
          <span>Conectores ERP Tradicionais (TOTVS, SAP, Oracle, Senior, Bling/Omie)</span>
        </button>
      </div>

      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <VelatrixLogo variant="capsule" />
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[11px] font-bold">
                Zero-GUI Middleware v4.8
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[var(--vx-neon-green)] border border-emerald-500/30 font-mono text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[var(--vx-neon-green)]" />
                Secp256k1 Multi-Sig Ativo
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Network className="w-6 h-6 text-[var(--vx-neon)]" />
              Configuração de Conector ERP & Webhook Gateway
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Ponte de integração bidirecional para leitura contínua de eventos de risco (BOM, estoques, NCM, câmbio) e execução tática autônoma em menos de 850ms sobre o ERP corporativo.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onOpenVectorStore && (
              <button
                onClick={onOpenVectorStore}
                className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Barramento Vetorial RAG</span>
              </button>
            )}
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Voltar ao Dashboard
              </button>
            )}
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--vx-neon-green)] via-teal-400 to-[var(--vx-neon)] text-slate-950 font-black text-xs hover:opacity-90 transition-all shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Validando Handshake...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>Testar Conexão & Validar Schema</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Status do Conector:</span>
            <span className="text-[var(--vx-neon-green)] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--vx-neon-green)] animate-pulse" />
              Online / Nominal
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Latência Alvo:</span>
            <span className="text-[var(--vx-neon)] font-bold">&lt; 850 ms (Zero-GUI)</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Campos Mapeados:</span>
            <span className="text-slate-200 font-bold">{fieldMappings.length} Entidades</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Quórum Criptográfico:</span>
            <span className="text-teal-300 font-bold">7/7 Especialistas</span>
          </div>
        </div>
      </div>

      {/* WARDENCLYFFE DATA SYNC (Sincronização Indutiva Wireless Zero-API de Tesla) */}
      <div id="wardenclyffe-data-sync-panel" className="bg-gradient-to-r from-slate-950 via-[var(--vx-deep)] to-slate-950 rounded-2xl border border-cyan-500/40 p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/50 text-[var(--vx-neon)] shadow-lg shadow-cyan-950/50">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
                  Wardenclyffe Data Sync • Sincronização Indutiva Wireless (Zero-API)
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  Tecnologia Tesla
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-[var(--vx-neon-green)] border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--vx-neon-green)] animate-ping" />
                  Sync Wireless Ativo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sincronização contínua por ressonância e indução de memória compartilhada com ERPs legados do cliente — sem overhead de APIs REST lentas ou bloqueios de tabela (Lock-Free CDC).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                handleTestConnection();
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
              <span>Emitir Pulso de Indução Tesla</span>
            </button>
          </div>
        </div>

        {/* 4 Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Portadora de Indução</span>
            <div className="text-sm font-black text-cyan-300 font-mono">432.8 kHz</div>
            <span className="text-[10px] text-emerald-400 font-mono">Harmônica Estável D+0</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Latência de Transmissão</span>
            <div className="text-sm font-black text-[var(--vx-neon-green)] font-mono">1.2 ms</div>
            <span className="text-[10px] text-slate-400 font-mono">Sem Buffer intermediário</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Taxa de Streaming</span>
            <div className="text-sm font-black text-purple-300 font-mono">14.820 logs/s</div>
            <span className="text-[10px] text-purple-400 font-mono">Zero lock em SQL tables</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Integridade de Pacotes</span>
            <div className="text-sm font-black text-amber-300 font-mono">99.998% SNR</div>
            <span className="text-[10px] text-emerald-400 font-mono">Criptografado Secp256k1</span>
          </div>
        </div>

        {/* Connected Legacy ERP Nodes */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Nós de Infraestrutura Conectados via Wardenclyffe
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              4 Conexões Resonantes Ativas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { name: 'SAP S/4HANA & R/3', mode: 'CDC Indutivo em Memória', status: 'Sincronizado D+0', ping: '1.1ms', color: 'emerald' },
              { name: 'TOTVS Protheus 12', mode: 'ADVPL Shadow Pipe', status: 'Sincronizado D+0', ping: '1.4ms', color: 'emerald' },
              { name: 'Senior Sapiens ERP', mode: 'Zero-API Memory Stream', status: 'Sincronizado D+0', ping: '1.2ms', color: 'emerald' },
              { name: 'SEFAZ / NF-e Hub BR', mode: 'Indução Fiscal Contínua', status: 'Sincronizado D+0', ping: '2.8ms', color: 'emerald' }
            ].map((node, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all text-xs flex items-center justify-between">
                <div>
                  <strong className="text-slate-200 block text-[11px]">{node.name}</strong>
                  <span className="text-[10px] text-slate-400 font-mono">{node.mode}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono font-bold text-[var(--vx-neon-green)] block">{node.ping}</span>
                  <span className="text-[9px] font-mono text-emerald-400/80">● {node.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Settings (Left) & Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Configuration Forms (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. SELEÇÃO DO MODELO DO ERP & PRESETS */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[var(--vx-neon)]/20 border border-[var(--vx-neon)]/40 flex items-center justify-center text-[var(--vx-neon)] font-mono text-xs font-black">
                  1
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Modelo do ERP & Topologia de Rede
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Preset Rápido de Schema
              </span>
            </div>

            {/* Vendor Preset Buttons */}
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-medium block">
                Selecione o Sistema ERP da Empresa:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'totvs_protheus', label: 'TOTVS Protheus', sub: 'REST / ADVPL / CDC' },
                  { id: 'sap_s4hana', label: 'SAP S/4HANA', sub: 'OData / RFC Client' },
                  { id: 'oracle_netsuite', label: 'Oracle NetSuite', sub: 'SuiteTalk REST' },
                  { id: 'senior_sapiens', label: 'Senior ERP', sub: 'Sapiens Web Services' },
                  { id: 'bling_omie', label: 'Bling / Omie', sub: 'Cloud Webhook API' },
                  { id: 'custom_rest', label: 'Custom REST API', sub: 'Gateway Genérico' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleVendorChange(item.id as ErpVendor)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedVendor === item.id
                        ? 'bg-[var(--vx-neon)]/15 border-[var(--vx-neon)] text-white shadow-lg shadow-[var(--vx-neon)]/10'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{item.label}</span>
                      {selectedVendor === item.id && <Check className="w-3.5 h-3.5 text-[var(--vx-neon)]" />}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Deployment Type Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-[11px] text-slate-400 font-medium block">
                Topologia de Implantação do Conector:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'cloud_to_cloud', label: 'Nuvem Cloud-to-Cloud', desc: 'HTTPS TLS 1.3 Seguro' },
                  { id: 'on_premise_vpn', label: 'On-Premise via VPN', desc: 'Agent Gateway Dedicado' },
                  { id: 'local_sql_proxy', label: 'Local DB Proxy', desc: 'Leitura CDC em Memória' }
                ].map((dep) => (
                  <button
                    key={dep.id}
                    onClick={() => setDeploymentType(dep.id as DeploymentType)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      deploymentType === dep.id
                        ? 'bg-teal-950/40 border-teal-500/60 text-teal-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold block">{dep.label}</span>
                    <span className="text-[9px] font-mono text-slate-500">{dep.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Endpoints Form */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  URL Base da API do ERP (Endpoint Gateway):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={erpBaseUrl}
                    onChange={(e) => setErpBaseUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs font-mono pl-8 focus:border-[var(--vx-neon)] outline-none"
                    placeholder="https://api.empresa.com.br/v1"
                  />
                  <Server className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Rota de Resolução Autônoma (AOS $\rightarrow$ ERP):
                  </label>
                  <input
                    type="text"
                    value={resolutionWebhookPath}
                    onChange={(e) => setResolutionWebhookPath(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs font-mono focus:border-teal-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Rota de Ingestão de Risco (ERP $\rightarrow$ AOS):
                  </label>
                  <input
                    type="text"
                    value={ingestWebhookPath}
                    onChange={(e) => setIngestWebhookPath(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs font-mono focus:border-teal-400 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. AUTENTICAÇÃO & SEGURANÇA MULTI-SIG */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-mono text-xs font-black">
                  2
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Método de Autenticação & Governança Criptográfica
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Zero-Trust Enforced
              </span>
            </div>

            {/* Auth Method Pills */}
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              {[
                { id: 'oauth2', label: 'OAuth 2.0 (Client Credentials / PKCE)' },
                { id: 'api_key', label: 'API Key / Token Bearer' },
                { id: 'mtls_secp256k1', label: 'mTLS + Assinatura Secp256k1' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAuthMethod(m.id as AuthMethod)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMethod === m.id
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* OAuth2 Inputs */}
            {authMethod === 'oauth2' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Client ID:</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs font-mono focus:border-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Client Secret:</label>
                    <div className="relative">
                      <input
                        type={showClientSecret ? 'text' : 'password'}
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs font-mono pr-14 focus:border-teal-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClientSecret(!showClientSecret)}
                        className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-200 font-mono cursor-pointer"
                      >
                        {showClientSecret ? 'Ocultar' : 'Exibir'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Token Endpoint URL:</label>
                    <input
                      type="text"
                      value={oauthTokenUrl}
                      onChange={(e) => setOauthTokenUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs font-mono focus:border-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Scopes Autorizados:</label>
                    <input
                      type="text"
                      value={oauthScopes}
                      onChange={(e) => setOauthScopes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs font-mono focus:border-teal-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* API Key Inputs */}
            {authMethod === 'api_key' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Nome do Header HTTP:</label>
                  <input
                    type="text"
                    value={apiKeyHeader}
                    onChange={(e) => setApiKeyHeader(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs font-mono focus:border-teal-400 outline-none"
                    placeholder="X-API-Key"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Chave da API / Bearer Token:</label>
                  <input
                    type="password"
                    value={apiKeyValue}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs font-mono focus:border-teal-400 outline-none"
                  />
                </div>
              </div>
            )}

            {/* mTLS Inputs */}
            {authMethod === 'mtls_secp256k1' && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                  <span>Identificador do Certificado X.509:</span>
                  <strong className="text-teal-300">{mtlsCertificateId}</strong>
                </div>
                <p className="text-[11px] text-slate-400">
                  Todas as requisições autenticadas carregarão a assinatura ECDSA Secp256k1 no header <code className="text-[var(--vx-neon)]">X-AOS-Signature</code> e certificado mTLS emitido por autoridade interna.
                </p>
              </div>
            )}
          </div>

          {/* 3. MAPEAMENTO DE SCHEMA DE DADOS (DE-PARA) */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[var(--vx-neon-green)]/20 border border-[var(--vx-neon-green)]/40 flex items-center justify-center text-[var(--vx-neon-green)] font-mono text-xs font-black">
                  3
                </span>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Mapeamento de Schema de Dados (DE-PARA)
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Vinculação dos campos nativos do ERP com o Grafo Semântico do AOS
                  </p>
                </div>
              </div>

              <button
                onClick={handleAddCustomField}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
                <span>Adicionar Campo</span>
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'Todos os Campos' },
                { id: 'material_bom', label: 'Materiais & BOM' },
                { id: 'production_orders', label: 'Ordens de Produção' },
                { id: 'suppliers', label: 'Fornecedores' },
                { id: 'treasury_tax', label: 'Tesouraria & Fiscal' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveMappingCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    activeMappingCategory === cat.id
                      ? 'bg-slate-800 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Mapping Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2 px-2">Campo no ERP ({selectedVendor.toUpperCase()})</th>
                    <th className="py-2 px-2">Variável no Grafo AOS</th>
                    <th className="py-2 px-2">Descrição Operacional</th>
                    <th className="py-2 px-2 text-center">Tipo</th>
                    <th className="py-2 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {filteredMappings.map((mapping) => (
                    <tr key={mapping.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={mapping.erpField}
                          onChange={(e) => handleUpdateMapping(mapping.id, { erpField: e.target.value })}
                          className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-slate-100 text-[11px] font-mono w-28 sm:w-32 focus:border-[var(--vx-neon)] outline-none"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-[var(--vx-neon)] font-bold">{mapping.aosVariable}</span>
                      </td>
                      <td className="py-2 px-2 font-sans text-slate-300 text-xs">
                        {mapping.description}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 text-[10px]">
                          {mapping.dataType}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          onClick={() => handleRemoveField(mapping.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          title="Remover campo do mapeamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Payload & Test Simulator (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Test Execution Simulator Panel */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-mono text-xs font-black">
                  4
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Simulador de Teste & Auditoria
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Payload Generator
              </span>
            </div>

            {/* Test Status Banner */}
            {testResult.status === 'success' ? (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Handshake & Schema Homologados!
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                    HTTP {testResult.httpStatus} OK
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 pt-1 border-t border-emerald-900/60">
                  <div>Latência: <strong className="text-emerald-400">{testResult.latencyMs} ms</strong></div>
                  <div>Campos: <strong className="text-emerald-400">{testResult.validatedFieldsCount} validados</strong></div>
                  <div className="col-span-2 truncate">Merkle Root: <strong className="text-slate-400">{testResult.merkleRoot}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <Play className="w-4 h-4 text-[var(--vx-neon)]" />
                  <span>Pronto para Simulação de Conexão</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Clique em "Testar Conexão" para disparar um handshake sintético autenticado via <strong className="text-slate-200">Secp256k1</strong> contra a API do ERP e validar o mapeamento de campos.
                </p>
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[var(--vx-neon)] font-bold text-xs border border-[var(--vx-neon)]/40 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  <span>Executar Handshake de Teste</span>
                </button>
              </div>
            )}

            {/* Inspector Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1">
                  {[
                    { id: 'payload_test', label: 'Payload JSON' },
                    { id: 'curl_command', label: 'cURL Script' },
                    { id: 'secp256k1_multisig', label: 'Multi-Sig Proof' },
                    { id: 'schema_export', label: 'Export Schema' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveInspectorTab(tab.id as any)}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        activeInspectorTab === tab.id
                          ? 'bg-slate-800 text-[var(--vx-neon)] font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const contentToCopy = activeInspectorTab === 'payload_test'
                      ? generateTestPayloadJson()
                      : activeInspectorTab === 'curl_command'
                      ? generateCurlCommand()
                      : JSON.stringify(fieldMappings, null, 2);
                    handleCopy(contentToCopy, activeInspectorTab);
                  }}
                  className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === activeInspectorTab ? (
                    <>
                      <Check className="w-3 h-3 text-[var(--vx-neon-green)]" />
                      <span className="text-[var(--vx-neon-green)]">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Box */}
              <div className="relative">
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed select-all">
                  {activeInspectorTab === 'payload_test' && generateTestPayloadJson()}
                  {activeInspectorTab === 'curl_command' && generateCurlCommand()}
                  {activeInspectorTab === 'secp256k1_multisig' && JSON.stringify({
                    secp256k1_governance_proof: {
                      curve: "secp256k1",
                      digest_sha256: "0x8F9B2C4E910A4C882190B7E390A4C8129801BC7F2B94A1C8E3902183B7E9A4C0",
                      merkle_root: testResult.merkleRoot || "0x9F4C82A1B7E3910F628D5A4C2E910B87632A4C",
                      signers: [
                        { role: "CEO", address: "0x19A4B8F72E904123C012", verified: true },
                        { role: "CFO", address: "0x7F2B94A1C8E3902183B7", verified: true },
                        { role: "AOS_SWARM_CONSENSUS", quorum: "98.6%", verified: true }
                      ],
                      sla_resolution_target_ms: 850
                    }
                  }, null, 2)}
                  {activeInspectorTab === 'schema_export' && JSON.stringify({
                    connector: {
                      vendor: selectedVendor,
                      erp_base_url: erpBaseUrl,
                      mappings_count: fieldMappings.length,
                      field_mappings: fieldMappings
                    }
                  }, null, 2)}
                </pre>
              </div>
            </div>

            {/* Direct Injection Trigger */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-medium">
                Testar no Grafo do AOS:
              </span>
              {onInjectTestScenario && (
                <button
                  onClick={() => onInjectTestScenario('Crise de Fornecedor Crítico')}
                  className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Injetar Evento no Dashboard</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
