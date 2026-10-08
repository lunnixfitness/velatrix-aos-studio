import { IncomingBusEvent } from '../../services/swarmRouterService';

/**
 * Normalizes a raw payload from TOTVS Protheus / RM / Datasul
 * into the Velatrix standard IncomingBusEvent.
 */
export function mapTotvsPayload(raw: any): IncomingBusEvent {
  const docId = raw.numDoc || raw.chaveDoc || raw.numeroDocumento || raw.cDoc || raw.docNum || `totvs-${Date.now()}`;
  const eventName = raw.evento || raw.event || raw.tipoOperacao || raw.transacao || raw.title || 'Evento Operacional Protheus';
  const filial = raw.filial || raw.branch || raw.codigoFilial || '01';
  const ufDestino = raw.ufDestino || raw.uf || raw.estadoDestino || raw.targetUf;
  const categoria = raw.categoria || raw.modulo || raw.targetCategory || 'Fiscal';
  const valor = Number(raw.valorTotal || raw.valorBruto || raw.valMercadoria || raw.valueBrl || raw.valor || 0);

  const descricao = raw.descricao || raw.description || 
    `Transação ERP TOTVS Protheus [Filial: ${filial}] - Doc: ${docId}`;

  return {
    id: `totvs-${docId}`,
    title: `[TOTVS Protheus] ${eventName}`,
    description: descricao,
    sourceSystem: 'ERP_TOTVS',
    payload: {
      ...raw,
      erpProvider: 'TOTVS',
      docId,
      filial,
    },
    targetUf: ufDestino,
    targetCategory: categoria,
    valueBrl: isNaN(valor) ? 0 : valor,
    forceTimeoutFailure: Boolean(raw.forceTimeoutFailure || raw._simulateTimeout),
  };
}

/**
 * Normalizes a raw payload from SAP S/4HANA / ECC / Business One
 * into the Velatrix standard IncomingBusEvent.
 */
export function mapSapPayload(raw: any): IncomingBusEvent {
  const docNum = raw.docNum || raw.DocNum || raw.DocumentNumber || raw.Belnr || raw.document_id || raw.id || `sap-${Date.now()}`;
  const eventType = raw.eventCode || raw.eventType || raw.IdocType || raw.MessageName || raw.BapiName || raw.title || 'Business Event SAP';
  const companyCode = raw.companyCode || raw.CompanyCode || raw.Bukrs || raw.company_code || '1000';
  
  let taxRegion = raw.Region || raw.TaxJurisdiction || raw.taxJurisdictionCode || raw.taxJurisdiction || raw.uf || raw.targetUf;
  if (taxRegion && typeof taxRegion === 'string' && taxRegion.includes('-')) {
    taxRegion = taxRegion.split('-')[0].trim();
  }

  const category = raw.Category || raw.targetCategory || (eventType.includes('INVOICE') ? 'Fiscal' : 'Tesouraria Antifraude');
  const amount = Number(
    raw.totalGrossAmount ?? 
    raw.TotalGrossAmount ?? 
    raw.Amount ?? 
    raw.Wrbtr ?? 
    raw.TotalAmount ?? 
    raw.valueBrl ?? 
    raw.valor ?? 
    0
  );

  const description = raw.description || raw.Description || raw.itemText ||
    `Mensagem SAP S/4HANA OData/IDoc [Empresa: ${companyCode}] - Documento: ${docNum}`;

  return {
    id: `sap-${docNum}`,
    title: `[SAP S/4HANA] ${eventType} - Doc #${docNum}`,
    description,
    sourceSystem: 'ERP_SAP',
    payload: {
      ...raw,
      erpProvider: 'SAP',
      docNum,
      companyCode,
    },
    targetUf: taxRegion,
    targetCategory: category,
    valueBrl: isNaN(amount) ? 0 : amount,
    forceTimeoutFailure: Boolean(raw.forceTimeoutFailure || raw._simulateTimeout),
  };
}

/**
 * Normalizes a generic or custom REST payload into IncomingBusEvent.
 */
export function mapCustomPayload(raw: any): IncomingBusEvent {
  const id = raw.id || raw.eventId || `custom-${Date.now()}`;
  const title = raw.title || raw.evento || raw.action || 'Evento Customizado ERP';
  const description = raw.description || raw.descricao || 'Integração via Conector Customizado Webhook';
  const value = Number(raw.valueBrl || raw.valor || raw.amount || 0);

  return {
    id: String(id),
    title,
    description,
    sourceSystem: raw.sourceSystem || 'ERP_CUSTOM',
    payload: {
      ...raw,
      erpProvider: 'CUSTOM',
    },
    targetUf: raw.targetUf || raw.uf,
    targetCategory: raw.targetCategory || raw.categoria,
    targetAsset: raw.targetAsset,
    valueBrl: isNaN(value) ? 0 : value,
    forceTimeoutFailure: Boolean(raw.forceTimeoutFailure || raw._simulateTimeout),
  };
}

/**
 * Universal payload normalizer routing by ERP Provider.
 */
export function normalizeErpPayload(provider: string, raw: any): IncomingBusEvent {
  const p = (provider || '').toUpperCase();
  if (p === 'TOTVS') {
    return mapTotvsPayload(raw);
  }
  if (p === 'SAP') {
    return mapSapPayload(raw);
  }
  return mapCustomPayload(raw);
}
