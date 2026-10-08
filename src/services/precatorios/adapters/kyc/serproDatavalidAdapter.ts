import {
  KycProvider,
  ProvaDeVidaResult,
  PEPResult,
  ListaResult
} from '../types';
import { assertSimulatedAllowed, SIMULATED_PREFIX } from '../../../../lib/demoMode';

/**
 * Adapter de Referência: SERPRO Datavalid
 * Validação biométrica facial e cadastral direta com a base governamental da CNH / Denatran / Receita Federal.
 */
export class SerproDatavalidAdapter implements KycProvider {
  readonly providerId = 'SERPRO_DATAVALID';
  readonly providerName = 'Serpro Datavalid (Governo Federal)';

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async verificarProvaDeVida(cpf: string, _fotoBase64?: string): Promise<ProvaDeVidaResult> {

    assertSimulatedAllowed(this.providerName);
    const limpo = cpf.replace(/\D/g, '');
    const agora = new Date().toISOString();
    const protocolo = `SERPRO-DV-${limpo.slice(0, 6)}-${Date.now()}`;

    // Simulação do match 1:1 biométrico facial no Datavalid
    return {
      status: 'VALIDADO',
      scoreBiometrico: 98.4,
      livenessConfidence: 99.1,
      provider: this.providerName,
      simulado: true,
      protocolo,
      timestamp: agora,
      detalhes: SIMULATED_PREFIX + 'Biometria facial validada com a base oficial da CNH/Denatran (Serpro Datavalid V3).',
      hashEvidencia: `hash_dv_${protocolo}`
    };
  }

  async consultarPEP(cpfCnpj: string): Promise<PEPResult> {

    assertSimulatedAllowed(this.providerName);
    const limpo = cpfCnpj.replace(/\D/g, '');
    const agora = new Date().toISOString();
    const protocolo = `SERPRO-PEP-${limpo.slice(0, 6)}-${Date.now()}`;

    // Consulta à base oficial do Portal da Transparência / CGU via Serpro
    return {
      isPep: false,
      provider: this.providerName,
      simulado: true,
      consultadoEm: agora,
      protocolo,
      parentesPep: []
    };
  }

  async consultarListasRestritivas(cpfCnpj: string): Promise<ListaResult> {

    assertSimulatedAllowed(this.providerName);
    const limpo = cpfCnpj.replace(/\D/g, '');
    const agora = new Date().toISOString();
    const protocolo = `SERPRO-LISTAS-${limpo.slice(0, 6)}-${Date.now()}`;

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
