import { getErpConnection, createErpEventLog, ErpConnectionDto } from '../repositories/erpRepository';
import { ErpCredentialVault } from './erpCredentialVault';

export interface OutboundDispatchResult {
  success: boolean;
  attempts: number;
  statusCode?: number;
  statusText?: string;
  responseData?: any;
  error?: string;
  targetUrl: string;
}

export class ErpOutboundClient {
  private static instance: ErpOutboundClient;

  public static getInstance(): ErpOutboundClient {
    if (!ErpOutboundClient.instance) {
      ErpOutboundClient.instance = new ErpOutboundClient();
    }
    return ErpOutboundClient.instance;
  }

  /**
   * Dispatches a status update to the tenant's configured ERP.
   * Never logs credentials or secrets to output or database.
   */
  public async sendStatusUpdate(
    tenantId: string,
    payload: any,
    endpointPath: string = '/status'
  ): Promise<OutboundDispatchResult> {
    const connection = await getErpConnection(tenantId);

    if (!connection) {
      const err = `Conexão ERP não encontrada para o tenant ${tenantId}.`;
      await createErpEventLog({
        tenantId,
        provider: 'UNKNOWN',
        direction: 'OUTBOUND',
        eventType: 'ERP_OUTBOUND_STATUS_UPDATE',
        rawPayload: payload,
        status: 'ERRO',
        errorMessage: err,
      });
      return { success: false, attempts: 0, error: err, targetUrl: 'UNKNOWN' };
    }

    if (connection.status !== 'ATIVO') {
      const err = `Conexão ERP para o tenant ${tenantId} está em status '${connection.status}' (requer 'ATIVO').`;
      await createErpEventLog({
        tenantId,
        connectionId: connection.id,
        provider: connection.provider,
        direction: 'OUTBOUND',
        eventType: 'ERP_OUTBOUND_STATUS_UPDATE',
        rawPayload: payload,
        status: 'ERRO',
        errorMessage: err,
      });
      return { success: false, attempts: 0, error: err, targetUrl: connection.baseUrl };
    }

    const secret = ErpCredentialVault.resolveAuthSecret(tenantId, connection.credentialRef) || '';
    const cleanBaseUrl = connection.baseUrl.replace(/\/+$/, '');
    const targetUrl = endpointPath.startsWith('http') 
      ? endpointPath 
      : `${cleanBaseUrl}${endpointPath.startsWith('/') ? '' : '/'}${endpointPath}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Velatrix-AOS-Outbound/2.4',
      'X-Tenant-ID': tenantId,
      'X-Origin': 'Velatrix Autonomous Operating System',
    };

    const bodyString = JSON.stringify(payload);

    // Mount headers without ever leaking secret in logs
    if (connection.authType === 'API_KEY') {
      headers['X-API-Key'] = secret;
      headers['Authorization'] = `ApiKey ${secret}`;
    } else if (connection.authType === 'OAUTH2') {
      headers['Authorization'] = `Bearer ${secret}`;
    } else if (connection.authType === 'HMAC_SIGNATURE') {
      const signature = ErpCredentialVault.signPayload(secret, bodyString);
      headers['X-Signature'] = signature;
      headers['X-Timestamp'] = new Date().toISOString();
    }

    let lastError: any = null;
    let lastStatusCode = 0;
    let lastResponseData: any = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: bodyString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        lastStatusCode = response.status;

        const responseText = await response.text();
        try {
          lastResponseData = JSON.parse(responseText);
        } catch {
          lastResponseData = responseText.substring(0, 500);
        }

        if (response.ok) {
          // Log success to audit table (NO secrets logged)
          await createErpEventLog({
            tenantId,
            connectionId: connection.id,
            provider: connection.provider,
            direction: 'OUTBOUND',
            eventType: 'ERP_OUTBOUND_STATUS_UPDATE',
            rawPayload: payload,
            normalizedPayload: {
              targetUrl,
              authType: connection.authType,
              httpStatus: response.status,
              attempts: attempt,
            },
            status: 'PROCESSADO',
          });

          return {
            success: true,
            attempts: attempt,
            statusCode: response.status,
            statusText: response.statusText,
            responseData: lastResponseData,
            targetUrl,
          };
        } else {
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err: any) {
        lastError = err;
      }

      // Exponential backoff before next attempt
      if (attempt < maxAttempts) {
        const backoffMs = attempt === 1 ? 1000 : 2000;
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }

    const failureReason = lastError?.message || `Falha após ${maxAttempts} tentativas com HTTP ${lastStatusCode}`;

    // Record error in Dead-Letter Queue (ErpEventLog with status ERRO)
    await createErpEventLog({
      tenantId,
      connectionId: connection.id,
      provider: connection.provider,
      direction: 'OUTBOUND',
      eventType: 'ERP_OUTBOUND_STATUS_UPDATE',
      rawPayload: payload,
      normalizedPayload: {
        targetUrl,
        authType: connection.authType,
        httpStatus: lastStatusCode,
        attempts: maxAttempts,
      },
      status: 'ERRO',
      errorMessage: failureReason,
    });

    return {
      success: false,
      attempts: maxAttempts,
      statusCode: lastStatusCode,
      error: failureReason,
      responseData: lastResponseData,
      targetUrl,
    };
  }
}

export const erpOutboundClient = ErpOutboundClient.getInstance();
