import {
  KycProvider,
  ProvaDeVidaResult,
  PEPResult,
  ListaResult
} from '../types';
import { assertSimulatedAllowed, SIMULATED_PREFIX } from '../../../../lib/demoMode';

/**
 * Adapter de Referência: ÚNICO CHECK
 * Reconhecimento facial com prova de vida ativa/passiva (SmartLive) e Score Biométrico de Fraude.
 */
export class UnicoCheckAdapter implements KycProvider {
  readonly providerId = 'UNICO_CHECK';
  readonly providerName = 'Único Check Biometria';

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async verificarProvaDeVida(cpf: string, _fotoBase64?: string): Promise<ProvaDeVidaResult> {

    assertSimulatedAllowed(this.providerName);
    const limpo = cpf.replace(/\D/g, '');
    const agora = new Date().toISOString();
    const protocolo = `UNICO-CHK-${limpo.slice(0, 6)}-${Date.now()}`;

    return {
      status: 'VALIDADO',
      scoreBiometrico: 96.8,
      livenessConfidence: 98.7,
      provider: this.providerName,
      simulado: true,
      protocolo,
      timestamp: agora,
      detalhes: SIMULATED_PREFIX + 'Liveness SmartLive validado com sucesso. Índice de similaridade 96.8%. Ausência de spoofing.',
      hashEvidencia: `hash_unico_${protocolo}`
    };
  }

  async consultarPEP(cpfCnpj: string): Promise<PEPResult> {

    assertSimulatedAllowed(this.providerName);
    const limpo = cpfCnpj.replace(/\D/g, '');
    const agora = new Date().toISOString();
    const protocolo = `UNICO-PEP-${limpo.slice(0, 6)}-${Date.now()}`;

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
    const protocolo = `UNICO-REST-${limpo.slice(0, 6)}-${Date.now()}`;

    return {
      irregular: false,
      fontesConsultadas: {
        ofac: true,
        onu: true,
        coaf: true,
        bndesCaged: false,
        cguCeisCnep: true
      },
      ocorrencias: [],
      provider: this.providerName,
      simulado: true,
      consultadoEm: agora,
      protocolo
    };
  }
}
