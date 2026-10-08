/**
 * Velatrix AOS Core API Service
 * Sincronização com endpoints do backend Express / Prisma
 */

import { TenantModel, StatusTenant, CyberSpyRiskLevel, CyberSpyThreatType } from '../types/database';
import { getSessionToken, authFetch as fetch } from './authClient';

export interface SuperAdminSummary {
  totalTenants: number;
  totalMRR: number;
  consumoTotalGeminiGb: number;
  clusterStatus: string;
}

export interface TenantsApiResponse {
  summary: SuperAdminSummary;
  data: TenantModel[];
}

export interface ProvisionTenantPayload {
  nomeEmpresa: string;
  cnpj: string;
  plano: string;
  conectorERP: string;
  mrr: number;
  agentesAtivos: number;
}

export interface CLevelSosPayload {
  tenantId: string;
  autorizador?: string;
  motivo?: string;
}

export interface CyberSpyThreatPayload {
  tenantId: string;
  tipoAmeaca: CyberSpyThreatType;
  nivelRisco: CyberSpyRiskLevel;
  detalhes: Record<string, any>;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getSessionToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const superAdminApi = {
  /**
   * Listar todos os tenants e métricas consolidadas
   */
  async getTenants(): Promise<TenantsApiResponse> {
    try {
      const response = await fetch('/api/v1/super-admin/tenants', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn('[superAdminApi] Erro ao buscar tenants da API, usando fallback local:', err);
      throw err;
    }
  },

  /**
   * Provisionar novo Tenant no cluster
   */
  async provisionTenant(payload: ProvisionTenantPayload): Promise<TenantModel> {
    const response = await fetch('/api/v1/super-admin/tenants', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha ao provisionar tenant no backend.');
    }
    return await response.json();
  },

  /**
   * Acionar Botão SOS Global (C-Level Lockdown)
   */
  async triggerCLevelSos(payload: CLevelSosPayload): Promise<{
    status: string;
    message: string;
    tenant: string;
    timestamp: string;
  }> {
    const response = await fetch('/api/v1/security/c-level-sos', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha ao acionar C-Level SOS.');
    }
    return await response.json();
  },

  /**
   * Registrar evento de ameaça do CyberSpy
   */
  async recordCyberSpyThreat(payload: CyberSpyThreatPayload): Promise<any> {
    const response = await fetch('/api/v1/cyberspy/threat-event', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha ao registrar ameaça no CyberSpy.');
    }
    return await response.json();
  }
};
