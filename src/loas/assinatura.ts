/**
 * VELATRIX AOS · P28 · Assinatura de peças LOAS
 *
 * REGRA INEGOCIÁVEL: cada petição é assinada pelo ADVOGADO CONSTITUÍDO na
 * procuração do caso, com o certificado ICP-Brasil DELE (Lei 11.419/2006,
 * MP 2.200-2/2001). Não existe certificado do escritório/plataforma assinando
 * por terceiros — o guard abaixo rejeita isso em todos os providers.
 *
 * Providers:
 *  - DemoSigner        → DEMO_MODE; assinatura marcada "sem validade".
 *  - CloudPscSigner    → stub: assinatura em nuvem por PSC credenciado; exige
 *                        autenticação do titular por lote (token com validade).
 *  - HsmPkcs11Signer   → stub: A1 do próprio advogado em HSM; exige
 *                        consentimento registrado e titular == signatário.
 */
import type { Aprovacao } from './aprovacao.ts';
import { aprovacaoValida } from './aprovacao.ts';

export interface AdvogadoProcuracao { id: string; oab: string; cpf: string; }

export interface SolicitacaoAssinatura {
  casoId: string;
  tenantId: string;
  documentoHash: string;         // = minuta.hash
  anexosHash: string;
  signatarioId: string;
  procuracao: { advogados: AdvogadoProcuracao[] };
  aprovacao: Aprovacao | undefined;
  autenticacaoLote?: { titularId: string; expiraEm: string }; // CloudPsc
}

export interface AssinaturaEmitida {
  provider: 'DEMO' | 'CLOUD_PSC' | 'HSM_PKCS11';
  signatarioId: string;
  oab: string;
  documentoHash: string;
  assinadoEm: string;
  valorJuridico: boolean;
  envelope: string;              // CMS/PAdES em base64 (stub)
}

export class ErroAssinatura extends Error {
  readonly codigo: 'NAO_CONSTITUIDO' | 'SEM_APROVACAO_VALIDA' | 'TITULAR_DIVERGENTE' | 'AUTENTICACAO_EXPIRADA' | 'SEM_CONSENTIMENTO' | 'NAO_CONFIGURADO' | 'DEMO_DESLIGADO';
  readonly httpStatus: number;
  constructor(codigo: ErroAssinatura['codigo'], msg: string, httpStatus = 403) {
    super(msg); this.codigo = codigo; this.httpStatus = httpStatus; this.name = 'ErroAssinatura';
  }
}

export interface SignerProvider {
  readonly id: AssinaturaEmitida['provider'];
  assinar(req: SolicitacaoAssinatura): Promise<AssinaturaEmitida>;
}

/** Guard comum a TODOS os providers. Retorna o advogado constituído. */
export function validarSignatario(req: SolicitacaoAssinatura): AdvogadoProcuracao {
  const adv = req.procuracao.advogados.find((a) => a.id === req.signatarioId);
  if (!adv) throw new ErroAssinatura('NAO_CONSTITUIDO', 'Signatário não consta na procuração do caso.');
  if (!aprovacaoValida(req.aprovacao, req.documentoHash, req.anexosHash)) {
    throw new ErroAssinatura('SEM_APROVACAO_VALIDA', 'Peça sem aprovação válida para este hash (editada após aprovação?).', 409);
  }
  return adv;
}

export class DemoSigner implements SignerProvider {
  readonly id = 'DEMO' as const;
  private readonly demoMode: boolean;
  constructor(demoMode: boolean) { this.demoMode = demoMode; }
  async assinar(req: SolicitacaoAssinatura): Promise<AssinaturaEmitida> {
    if (!this.demoMode) throw new ErroAssinatura('DEMO_DESLIGADO', 'DemoSigner só opera com DEMO_MODE=true.', 500);
    const adv = validarSignatario(req);
    return {
      provider: this.id, signatarioId: adv.id, oab: adv.oab, documentoHash: req.documentoHash,
      assinadoEm: new Date().toISOString(), valorJuridico: false,
      envelope: `DEMO-SEM-VALIDADE:${req.documentoHash.slice(0, 16)}`,
    };
  }
}

export class CloudPscSigner implements SignerProvider {
  readonly id = 'CLOUD_PSC' as const;
  private readonly configurado: boolean;
  constructor(cfg?: { endpoint: string; clientId: string }) { this.configurado = !!cfg?.endpoint && !!cfg?.clientId; }
  async assinar(req: SolicitacaoAssinatura): Promise<AssinaturaEmitida> {
    const adv = validarSignatario(req);
    const auth = req.autenticacaoLote;
    if (!auth || auth.titularId !== adv.id) throw new ErroAssinatura('TITULAR_DIVERGENTE', 'Autenticação do lote não pertence ao signatário.');
    if (Date.parse(auth.expiraEm) <= Date.now()) throw new ErroAssinatura('AUTENTICACAO_EXPIRADA', 'Autenticação do titular expirada — reautenticar.', 401);
    if (!this.configurado) throw new ErroAssinatura('NAO_CONFIGURADO', 'PSC de assinatura em nuvem não configurado.', 501);
    throw new ErroAssinatura('NAO_CONFIGURADO', 'Integração PSC pendente de contrato.', 501);
  }
}

export interface CertificadoHsm { alias: string; titularId: string; consentimentoRegistradoEm?: string; }

export class HsmPkcs11Signer implements SignerProvider {
  readonly id = 'HSM_PKCS11' as const;
  private readonly certificados: ReadonlyMap<string, CertificadoHsm>;
  constructor(certs: CertificadoHsm[] = []) { this.certificados = new Map(certs.map((c) => [c.titularId, c])); }
  async assinar(req: SolicitacaoAssinatura): Promise<AssinaturaEmitida> {
    const adv = validarSignatario(req);
    const cert = this.certificados.get(adv.id);
    if (!cert || cert.titularId !== adv.id) throw new ErroAssinatura('TITULAR_DIVERGENTE', 'Não há certificado do próprio signatário no HSM.');
    if (!cert.consentimentoRegistradoEm) throw new ErroAssinatura('SEM_CONSENTIMENTO', 'Titular não registrou consentimento para custódia do A1.');
    throw new ErroAssinatura('NAO_CONFIGURADO', 'Módulo PKCS#11 não configurado neste ambiente.', 501);
  }
}
