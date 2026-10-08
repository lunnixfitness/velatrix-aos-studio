import {
  KycProvider,
  ProvaDeVidaResult,
  PEPResult,
  ListaResult
} from '../types';
import { assertSimulatedAllowed, SIMULATED_PREFIX } from '../../../../lib/demoMode';

/**
 * Adapter de Referência: IDWALL
 * Background Check automatizado, Face Match, OCR de documentos e varredura em 250+ fontes judiciais e restritivas.
 */
export class IdWallAdapter implements KycProvider {
  readonly providerId = 'IDWALL';
  readonly providerName = 'Idwall Compliance & Background Check';

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async verificarProvaDeVida(cpf: string, _fotoBase64?: string): Promise<ProvaDeVidaResult> {

    assertSimulatedAllowed(this.providerName);
    const limpo = cpf.replace(/\D/g, '');
    const agora = new Date().toISOString();
    const protocolo = `IDWALL-PRV-${limpo.slice(0, 6)}-${Date.now()}`;

    return {
      status: 'VALIDADO',
      scoreBiometrico: 95.5,
      livenessConfidence: 97.9,
      provider: this.providerName,
      simulado: true,
      protocolo,
      timestamp: agora,
      detalhes: SIMULATED_PREFIX + 'Face Match e Liveness passivo aprovados no pipeline de OCR & Biometria Idwall.',
      hashEvidencia: `hash_idwall_${protocolo}`
    };
  }

  async consultarPEP(cpfCnpj: string): Promise<PEPResult> {

    assertSimulatedAllowed(this.providerName);
    const limpo = cpfCnpj.replace(/\D/g, '');
    const agora = new Date().toISOString();
    const protocolo = `IDWALL-PEP-${limpo.slice(0, 6)}-${Date.now()}`;

    return {
      isPep: false,
      provider: this.providerName,
      simulado: true,
      consultadoEm: agora,
      protocolo
    };
  }

  async consultarListasRestritivas(cpfCnpj: string): Promise<ListaResult> {

    assertSimulatedAllowed(this.providerName);
    const limpo = cpfCnpj.replace(/\D/g, '');
    const agora = new Date().toISOString();
    const protocolo = `IDWALL-LST-${limpo.slice(0, 6)}-${Date.now()}`;

    return {
      irregular: false,
      fontesConsultadas: {
        ofac: true,
        onu: true,
        coaf: true,
        bndesCaged: true,
        cguCeisCnep: true,
        tcuInabilitados: true
      },
      ocorrencias: [],
      provider: this.providerName,
      simulado: true,
      consultadoEm: agora,
      protocolo
    };
  }
}
