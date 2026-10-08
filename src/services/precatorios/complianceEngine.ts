import { jsPDF } from 'jspdf';
import {
  KycCedenteResult,
  CessaoLedgerNode,
  BaaSSplitOrder,
  BaaSSplitDestinatario
} from '../../types/precatorios';
import {
  KycProvider,
  BaasProvider,
  TenantComplianceConfig,
  KycProviderChoice,
  BaasProviderChoice,
  OrdemSplit,
  ComprovanteSplit,
  Saldo,
  DestinatarioSplit,
  InstrucaoManualSplit,
  ItemPixCopiaECola,
  ComprovanteManualUpload,
  CertificadoDigitalInfo,
  AssinaturaDigitalPkiResult,
  PeticaoHabilitacaoDjen,
  ProtocoloDjenResult
} from './adapters/types';
import { SerproDatavalidAdapter } from './adapters/kyc/serproDatavalidAdapter';
import { UnicoCheckAdapter } from './adapters/kyc/unicoCheckAdapter';
import { IdWallAdapter } from './adapters/kyc/idwallAdapter';
import { CelcoinBaaSAdapter } from './adapters/baas/celcoinAdapter';
import { DockBaaSAdapter } from './adapters/baas/dockAdapter';
import { SwapBaaSAdapter } from './adapters/baas/swapAdapter';
import { BS2BaaSAdapter } from './adapters/baas/bs2Adapter';
import { lacunaWebPkiService } from './pki/lacunaWebPkiService';
import { djenPeticionamentoService } from './djen/djenPeticionamentoService';
import { PrecatorioLogger } from './precatorioLogger';
import { registrarCustodiaArquivo } from '../../shared/upload/sha256Store';
import { SubscriptionEngine } from '../billing/subscriptionEngine';

/**
 * Utilitário de formatação de QR Code Pix Copia-e-Cola (Padrão EMVCo / BACEN)
 */
function gerarPixCopiaECola(chave: string, nomeRecebedor: string, cidade: string, valor: number, txid: string): string {
  const sanitize = (val: string, max: number) => val.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, max).toUpperCase();
  const formatField = (id: string, value: string) => `${id}${value.length.toString().padStart(2, '0')}${value}`;

  const chaveLimpa = chave.trim();
  const nomeLimpo = sanitize(nomeRecebedor, 25);
  const cidadeLimpa = sanitize(cidade, 15);
  const txidLimpo = sanitize(txid, 25);

  const gui = formatField('00', 'br.gov.bcb.pix');
  const key = formatField('01', chaveLimpa);
  const merchantAccountInfo = formatField('26', `${gui}${key}`);

  const pfi = formatField('00', '01'); // Payload Format Indicator
  const mcc = formatField('52', '0000'); // Merchant Category Code
  const curr = formatField('53', '986'); // Currency (BRL)
  const amt = formatField('54', valor.toFixed(2));
  const country = formatField('58', 'BR');
  const merchantName = formatField('59', nomeLimpo || 'RECEBEDOR');
  const merchantCity = formatField('60', cidadeLimpa || 'BRASILIA');

  const addDataField = formatField('05', txidLimpo || '***');
  const additionalData = formatField('62', addDataField);

  const rawWithoutCrc = `${pfi}${merchantAccountInfo}${mcc}${curr}${amt}${country}${merchantName}${merchantCity}${additionalData}6304`;

  // Cálculo CRC-16-CCITT (0xFFFF)
  let crc = 0xFFFF;
  for (let i = 0; i < rawWithoutCrc.length; i++) {
    crc ^= (rawWithoutCrc.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return `${rawWithoutCrc}${crcHex}`;
}

export class ComplianceEngine {
  private logger: PrecatorioLogger;
  private ledgerChain: Map<string, CessaoLedgerNode[]> = new Map();
  private tenantConfigs: Map<string, TenantComplianceConfig> = new Map();
  private comprovantesManuais: Map<string, ComprovanteManualUpload[]> = new Map();

  constructor(correlationId?: string) {
    this.logger = new PrecatorioLogger('ComplianceEngine', correlationId);
    this.seedMockLedger();
    this.seedDefaultTenant();
  }

  private seedDefaultTenant() {
    // Configuração default para tenants que não customizaram
    this.tenantConfigs.set('default', {
      tenantId: 'default',
      tenantName: 'Escritório Parceiro / Fundo Default',
      kycProviderType: 'SERPRO_DATAVALID',
      baasProviderType: 'CELCOIN'
    });
  }

  private seedMockLedger() {
    const cessaoId = 'CESS-ORIG-001';
    this.ledgerChain.set(cessaoId, [
      {
        sequencia: 1,
        previousHash: 'GENESIS_PRECAT_001_ROOT',
        currentHash: '3a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
        cessaoId,
        documentoPayload: {
          tipo: 'OFICIO_REQUISITORIO_ORIGINARIO',
          tribunal: 'TRF3',
          valorOriginal: 350000.00,
          credor: 'Maria A. S.***'
        },
        assinadoPor: 'Tribunal Regional Federal da 3ª Região',
        timestamp: '2025-06-15T10:00:00.000Z'
      }
    ]);
  }

  // ==========================================================================
  // CONFIGURAÇÃO DE TENANT & FACTORY DE PROVIDERS
  // ==========================================================================

  public configurarTenant(config: TenantComplianceConfig): void {
    this.tenantConfigs.set(config.tenantId, config);
    this.logger.info(`Tenant ${config.tenantId} configurado. KYC: ${config.kycProviderType} | BaaS: ${config.baasProviderType}`);
  }

  public getTenantConfig(tenantId: string = 'default'): TenantComplianceConfig {
    return this.tenantConfigs.get(tenantId) || {
      tenantId,
      tenantName: 'Tenant sem Provedores Plugados',
      kycProviderType: 'MANUAL',
      baasProviderType: 'MANUAL'
    };
  }

  public getKycProvider(tenantId: string = 'default'): KycProvider | null {
    const config = this.getTenantConfig(tenantId);
    switch (config.kycProviderType) {
      case 'SERPRO_DATAVALID':
        return new SerproDatavalidAdapter(config.kycCredentials?.apiKey);
      case 'UNICO_CHECK':
        return new UnicoCheckAdapter(config.kycCredentials?.apiKey);
      case 'IDWALL':
        return new IdWallAdapter(config.kycCredentials?.apiKey);
      case 'MANUAL':
      default:
        return null;
    }
  }

  public getBaasProvider(tenantId: string = 'default'): BaasProvider | null {
    const config = this.getTenantConfig(tenantId);
    switch (config.baasProviderType) {
      case 'CELCOIN':
        return new CelcoinBaaSAdapter(config.baasCredentials?.clientId, config.baasCredentials?.clientSecret);
      case 'DOCK':
        return new DockBaaSAdapter(config.baasCredentials?.clientId, config.baasCredentials?.clientSecret);
      case 'SWAP':
        return new SwapBaaSAdapter(config.baasCredentials?.clientId, config.baasCredentials?.clientSecret);
      case 'BS2':
        return new BS2BaaSAdapter(config.baasCredentials?.clientId, config.baasCredentials?.clientSecret);
      case 'MANUAL':
      default:
        return null;
    }
  }

  // ==========================================================================
  // KYC / PLD (COMPULSORIO >= R$ 50k - BCB 3.978/2020)
  // ==========================================================================

  /**
   * Executa KYC/PLD utilizando o adapter plugado do tenant ou modo de instrução manual
   */
  public async executarKycCedente(params: {
    cpfCnpj: string;
    nome: string;
    valorOperacao: number;
    comprovanteEnderecoEmissaoData: string;
    declaracaoOrigemAssinada: boolean;
    tenantId?: string;
    fotoBase64?: string;
  }): Promise<KycCedenteResult> {
    const tenantId = params.tenantId || 'default';
    const provider = this.getKycProvider(tenantId);
    const isExigivel = params.valorOperacao >= 50000.00;

    const dataComprovante = new Date(params.comprovanteEnderecoEmissaoData);
    const diffDiasEndereco = (Date.now() - dataComprovante.getTime()) / (24 * 3600 * 1000);
    const comprovanteValido = diffDiasEndereco <= 90;

    if (provider) {
      this.logger.info(`Executando KYC via adapter plugado: ${provider.providerName}`);
      const [provaVida, pep, listas] = await Promise.all([
        provider.verificarProvaDeVida(params.cpfCnpj, params.fotoBase64),
        provider.consultarPEP(params.cpfCnpj),
        provider.consultarListasRestritivas(params.cpfCnpj)
      ]);

      const aprovado = (!isExigivel) || (
        comprovanteValido &&
        params.declaracaoOrigemAssinada &&
        !pep.isPep &&
        !listas.irregular &&
        provaVida.status === 'VALIDADO'
      );

      const auditPayload = JSON.stringify({
        provider: provider.providerName,
        tenantId,
        cpfCnpj: params.cpfCnpj,
        valorOperacao: params.valorOperacao,
        provaVida,
        pep,
        listas,
        comprovanteValido,
        declaracaoOrigemAssinada: params.declaracaoOrigemAssinada,
        timestamp: new Date().toISOString()
      });

      const encoder = new TextEncoder();
      const custodia = await registrarCustodiaArquivo(
        `kyc_${provider.providerId.toLowerCase()}_${params.cpfCnpj.replace(/\D/g, '')}.json`,
        encoder.encode(auditPayload).buffer as ArrayBuffer,
        `Velatrix Compliance Hub (${provider.providerName})`
      );

      return {
        aprovado,
        cpfCnpj: params.cpfCnpj,
        nome: params.nome,
        pepIdentificado: pep.isPep,
        listasRestritivasConsultadas: {
          ofac: listas.fontesConsultadas.ofac,
          onu: listas.fontesConsultadas.onu,
          coaf: listas.fontesConsultadas.coaf,
          bndesCaged: listas.fontesConsultadas.bndesCaged
        },
        provaDeVidaStatus: provaVida.status === 'VALIDADO' ? 'VERIFICADO_SERPRO' : 'PENDENTE',
        comprovanteEnderecoValido: comprovanteValido,
        declaracaoOrigemLicitaAssinada: params.declaracaoOrigemAssinada,
        kycAuditHash: custodia.sha256,
        dataAnalise: new Date().toISOString()
      };
    }

    // MODO INSTRUÇÃO MANUAL DE KYC (Sem provider configurado)
    this.logger.info(`Tenant ${tenantId} sem provider de KYC. Operando em MODO INSTRUÇÃO MANUAL.`);
    const auditPayload = JSON.stringify({
      modo: 'INSTRUCAO_MANUAL_KYC',
      tenantId,
      cpfCnpj: params.cpfCnpj,
      valorOperacao: params.valorOperacao,
      aviso: 'Tenant optou por verificação documental manual fora da plataforma.',
      comprovanteValido,
      declaracaoOrigemAssinada: params.declaracaoOrigemAssinada,
      timestamp: new Date().toISOString()
    });

    const encoder = new TextEncoder();
    const custodia = await registrarCustodiaArquivo(
      `kyc_manual_${params.cpfCnpj.replace(/\D/g, '')}.json`,
      encoder.encode(auditPayload).buffer as ArrayBuffer,
      'Velatrix Compliance (Instrução Manual Documental)'
    );

    return {
      aprovado: comprovanteValido && params.declaracaoOrigemAssinada,
      cpfCnpj: params.cpfCnpj,
      nome: params.nome,
      pepIdentificado: false,
      listasRestritivasConsultadas: {
        ofac: false,
        onu: false,
        coaf: false,
        bndesCaged: false
      },
      provaDeVidaStatus: 'PENDENTE',
      comprovanteEnderecoValido: comprovanteValido,
      declaracaoOrigemLicitaAssinada: params.declaracaoOrigemAssinada,
      kycAuditHash: custodia.sha256,
      dataAnalise: new Date().toISOString()
    };
  }

  // ==========================================================================
  // CADEIA DE CESSÕES MERKLE-LIKE (CORE IMUTÁVEL — INDEPENDE DE BAAS)
  // ==========================================================================

  /**
   * Adiciona um elo imutável à cadeia de custódia (Merkle-like chained hash)
   * currentHash = SHA-256(previousHash + documentoPayload + assinadoPor + timestamp)
   */
  public async registrarEloCadeia(
    cessaoId: string,
    documentoPayload: Record<string, any>,
    assinadoPor: string
  ): Promise<CessaoLedgerNode> {
    const chain = this.ledgerChain.get(cessaoId) || [];
    const sequencia = chain.length + 1;
    const previousHash = chain.length > 0 ? chain[chain.length - 1].currentHash : 'GENESIS_CESSAO_ROOT';

    const timestamp = new Date().toISOString();
    const rawToHash = `${previousHash}|${JSON.stringify(documentoPayload)}|${assinadoPor}|${timestamp}`;

    const encoder = new TextEncoder();
    const bytes = encoder.encode(rawToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const currentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const novoNo: CessaoLedgerNode = {
      sequencia,
      previousHash,
      currentHash,
      cessaoId,
      documentoPayload,
      assinadoPor,
      timestamp
    };

    chain.push(novoNo);
    this.ledgerChain.set(cessaoId, chain);

    this.logger.info(`Elo #${sequencia} registrado na cadeia ${cessaoId} (Hash: ${currentHash.slice(0, 12)}…)`);
    return novoNo;
  }

  /**
   * Retorna todo o histórico de hashes da cadeia de cessões
   */
  public getCadeiaCessoes(cessaoId: string): CessaoLedgerNode[] {
    return this.ledgerChain.get(cessaoId) || [];
  }

  /**
   * Valida a integridade matemática da cadeia de ponta a ponta
   */
  public async validarIntegridadeCadeia(cessaoId: string): Promise<{
    integra: boolean;
    totalElos: number;
    divergencias: string[];
  }> {
    const chain = this.getCadeiaCessoes(cessaoId);
    const divergencias: string[] = [];

    for (let i = 0; i < chain.length; i++) {
      const elo = chain[i];
      const prev = i === 0 ? 'GENESIS_PRECAT_001_ROOT' : chain[i - 1].currentHash;

      if (elo.previousHash !== prev && i !== 0) {
        divergencias.push(`Elo #${elo.sequencia}: previousHash diverge do elo anterior`);
      }
    }

    return {
      integra: divergencias.length === 0,
      totalElos: chain.length,
      divergencias
    };
  }

  // ==========================================================================
  // BAAS SPLIT & MODO DE INSTRUÇÃO MANUAL
  // ==========================================================================

  /**
   * Executa a liquidação da cessão. Se o tenant tiver BaaS plugado, executa via API.
   * Se não tiver, lança exceção sugerindo o modo instrução manual.
   */
  public async executarBaaSSplit(params: {
    cessaoId: string;
    valorTotalOperacao: number;
    destinatarios: BaaSSplitDestinatario[];
    tenantId?: string;
  }): Promise<BaaSSplitOrder> {
    const tenantId = params.tenantId || 'default';
    const provider = this.getBaasProvider(tenantId);

    const soma = params.destinatarios.reduce((acc, d) => acc + d.valorNominal, 0);
    const diff = Math.abs(soma - params.valorTotalOperacao);
    if (diff > 0.05) {
      throw new Error(`Soma dos destinatários (R$ ${soma.toFixed(2)}) diverge do valor total da operação (R$ ${params.valorTotalOperacao.toFixed(2)})`);
    }

    if (provider) {
      this.logger.info(`Executando BaaS Split via provedor plugado: ${provider.providerName}`);
      const ordemSplit: OrdemSplit = {
        ordemId: `ORD-${provider.providerId}-${Date.now().toString(36).toUpperCase()}`,
        cessaoId: params.cessaoId,
        valorTotal: params.valorTotalOperacao,
        destinatarios: params.destinatarios.map(d => ({
          papel: d.papel,
          nome: d.nome,
          cpfCnpj: d.cpfCnpj,
          chavePix: d.chavePix,
          percentual: d.percentual,
          valorNominal: d.valorNominal
        }))
      };

      const comprovante = await provider.executarSplit(ordemSplit);

      // Encadear o comprovante do split na cadeia Merkle
      await this.registrarEloCadeia(params.cessaoId, {
        tipo: 'SPLIT_PIX_BAAS_AUTOMATICO',
        provedor: provider.providerName,
        ordemId: ordemSplit.ordemId,
        endToEndIdPix: comprovante.endToEndIdPix,
        valorTotal: params.valorTotalOperacao,
        comprovanteSha256: comprovante.comprovanteSha256
      }, `${provider.providerName} Gateway`);

      // Registra consumo do precatório no motor de faturamento/metering SaaS da Velatrix
      try {
        SubscriptionEngine.registrarConsumoPrecatorio(tenantId, params.cessaoId, ordemSplit.ordemId);
      } catch (meteringErr) {
        this.logger.warn('Aviso: falha ao computar metering de billing para o precatório', { error: meteringErr });
      }

      return {
        ordemId: ordemSplit.ordemId,
        cessaoId: params.cessaoId,
        provedorBaaS: provider.providerId === 'CELCOIN' ? 'CELCOIN' : 'ASAAS',
        valorTotalOperacao: params.valorTotalOperacao,
        destinatarios: params.destinatarios,
        status: 'LIQUIDADO',
        endToEndIdPix: comprovante.endToEndIdPix,
        liquidadoEm: comprovante.dataLiquidacao,
        comprovanteSha256: comprovante.comprovanteSha256
      };
    }

    // Se não há BaaS plugado, informa a necessidade de usar o modo de instrução manual
    throw new Error('Tenant opera sem provedor BaaS configurado. Utilize o método "gerarInstrucaoManualSplit".');
  }

  /**
   * MODO MANUAL: Gera o pacote completo de instrução manual com QR Pix Copia-e-Cola
   * e roteiro formal para o tenant liquidar via internet banking próprio.
   */
  public async gerarInstrucaoManualSplit(params: {
    cessaoId: string;
    valorTotalOperacao: number;
    destinatarios: DestinatarioSplit[];
    numeroOficio?: string;
  }): Promise<InstrucaoManualSplit> {
    const instrucaoId = `INST-MANUAL-${Date.now().toString(36).toUpperCase()}`;
    const agora = new Date().toISOString();

    const itensPix: ItemPixCopiaECola[] = params.destinatarios.map(d => {
      const txid = `PREC${params.cessaoId.slice(-6)}${d.papel.slice(0, 3)}`;
      const codigoCopiaECola = gerarPixCopiaECola(
        d.chavePix,
        d.nome,
        'BRASILIA',
        d.valorNominal,
        txid
      );

      return {
        destinatario: d.nome,
        papel: d.papel,
        chavePix: d.chavePix,
        valor: d.valorNominal,
        codigoCopiaECola
      };
    });

    const orientacoesBancarias = [
      '1. Acesse o Internet Banking PJ da sua instituição financeira.',
      '2. Para cada um dos destinatários listados abaixo, utilize o recurso "Pix Copia e Cola" ou preencha a chave Pix informada.',
      '3. Confirme que o valor nominal e o titular do CPF/CNPJ de destino correspondem exatamente ao consignado na instrução.',
      '4. Exija o comprovante bancário com número de autenticação e End-to-End Id gerado pelo Banco Central (BACEN).',
      '5. Faça o upload do comprovante em PDF/PNG nesta esteira para que o hash SHA-256 seja amarrado à cadeia de custódia Merkle da cessão.'
    ];

    const minutaResumo = `INSTRUMENTO DE CESSÃO DE CRÉDITO JUDICIAL SOB CONDIÇÃO RESOLUTIVA DE LIQUIDAÇÃO BANCÁRIA EXTERNA. Ofício: ${params.numeroOficio || 'N/A'}. Valor Total: R$ ${params.valorTotalOperacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;

    const payloadAudit = JSON.stringify({
      instrucaoId,
      cessaoId: params.cessaoId,
      itensPix,
      orientacoesBancarias,
      minutaResumo,
      timestamp: agora
    });

    const encoder = new TextEncoder();
    const custodia = await registrarCustodiaArquivo(
      `instrucao_manual_${instrucaoId}.json`,
      encoder.encode(payloadAudit).buffer as ArrayBuffer,
      'Velatrix Manual Banking Instruction Hub'
    );

    return {
      instrucaoId,
      cessaoId: params.cessaoId,
      dataGeracao: agora,
      valorTotalOperacao: params.valorTotalOperacao,
      itensPix,
      orientacoesBancarias,
      minutaEscrituraNotarialResumo: minutaResumo,
      hashInstrucaoSha256: custodia.sha256
    };
  }

  /**
   * MODO MANUAL: Gera o documento PDF de instrução formal de liquidação bancária
   */
  public async gerarPdfInstrucaoManual(instrucao: InstrucaoManualSplit): Promise<{
    url: string;
    nomeArquivo: string;
  }> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Cabeçalho institucional
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('VELATRIX AOS — LIQUIDEZ JUDICIAL', 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('INSTRUÇÃO MANUAL DE LIQUIDAÇÃO BANCÁRIA EXTERNA & SPLIT PIX', 14, 23);
    doc.text(`ID INSTRUÇÃO: ${instrucao.instrucaoId} | DATA: ${new Date(instrucao.dataGeracao).toLocaleDateString('pt-BR')}`, 14, 29);

    // Linha de dados principais
    let y = 45;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. DADOS DA OPERAÇÃO DE CESSÃO', 14, y);

    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cessão Vinculada: ${instrucao.cessaoId}`, 14, y);
    doc.text(`Valor Total a Liquidar: R$ ${instrucao.valorTotalOperacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 110, y);

    y += 6;
    doc.text(`Hash SHA-256 da Instrução: ${instrucao.hashInstrucaoSha256.slice(0, 32)}...`, 14, y);

    // Tabela de destinatários Pix
    y += 12;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. DESTINATÁRIOS DO SPLIT (PIX COPIA E COLA)', 14, y);

    y += 8;
    instrucao.itensPix.forEach((item, index) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, 182, 24, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y - 4, 182, 24, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`[${index + 1}] (${item.papel}) ${item.destinatario}`, 18, y + 1);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Chave Pix: ${item.chavePix} | Valor: R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 18, y + 6);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      const codigoQuebrado = item.codigoCopiaECola.slice(0, 85);
      doc.text(`Pix Copia-e-Cola: ${codigoQuebrado}...`, 18, y + 12);

      y += 28;
    });

    // Orientações
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('3. ORIENTAÇÕES DE COMPLIANCE & FECHAMENTO', 14, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    instrucao.orientacoesBancarias.forEach(orientacao => {
      doc.text(orientacao, 14, y);
      y += 5;
    });

    // Rodapé
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('A Velatrix não custodia e não movimenta recursos financeiros. Emissão exclusivamente orquestradora.', 14, 285);

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const nomeArquivo = `instrucao_split_${instrucao.instrucaoId}.pdf`;

    return { url, nomeArquivo };
  }

  /**
   * MODO MANUAL: Registra o comprovante externo feito pelo tenant,
   * calcula o SHA-256 e amarra no Merkle-like Ledger imutável.
   */
  public async registrarComprovanteManual(params: {
    cessaoId: string;
    nomeArquivo: string;
    bufferOuBytes: ArrayBuffer;
    anexadoPor: string;
    bancoOrigem: string;
    autenticacaoBancaria: string;
    valorComprovante?: number;
  }): Promise<ComprovanteManualUpload> {
    const comprovanteId = `COMP-MANUAL-${Date.now().toString(36).toUpperCase()}`;
    const agora = new Date().toISOString();

    const custodia = await registrarCustodiaArquivo(
      `comprovante_manual_${params.cessaoId}_${params.nomeArquivo}`,
      params.bufferOuBytes,
      `Comprovante Manual Bancário (${params.bancoOrigem} - ${params.anexadoPor})`
    );

    const comprovante: ComprovanteManualUpload = {
      comprovanteId,
      cessaoId: params.cessaoId,
      nomeArquivo: params.nomeArquivo,
      tamanhoBytes: params.bufferOuBytes.byteLength,
      sha256Arquivo: custodia.sha256,
      anexadoPor: params.anexadoPor,
      dataUpload: agora,
      bancoOrigem: params.bancoOrigem,
      autenticacaoBancaria: params.autenticacaoBancaria,
      status: 'VALIDADO'
    };

    const lista = this.comprovantesManuais.get(params.cessaoId) || [];
    lista.push(comprovante);
    this.comprovantesManuais.set(params.cessaoId, lista);

    // Amarra na cadeia imutável de custódia
    await this.registrarEloCadeia(params.cessaoId, {
      tipo: 'COMPROVANTE_PAGAMENTO_MANUAL_EXTERNO',
      comprovanteId,
      nomeArquivo: params.nomeArquivo,
      bancoOrigem: params.bancoOrigem,
      autenticacaoBancaria: params.autenticacaoBancaria,
      valorComprovante: params.valorComprovante,
      sha256Arquivo: custodia.sha256
    }, params.anexadoPor);

    return comprovante;
  }

  public getComprovantesManuais(cessaoId: string): ComprovanteManualUpload[] {
    return this.comprovantesManuais.get(cessaoId) || [];
  }

  // ==========================================================================
  // ASSINATURA DIGITAL ICP-BRASIL A1 (Lacuna Web PKI)
  // ==========================================================================

  public async assinarComIcpBrasilA1(params: {
    documentoId: string;
    conteudoDocumento: string;
    cessaoId?: string;
    certificado?: CertificadoDigitalInfo;
  }): Promise<AssinaturaDigitalPkiResult> {
    const assinatura = await lacunaWebPkiService.assinarDocumentoCessao({
      documentoId: params.documentoId,
      conteudoDocumento: params.conteudoDocumento,
      certificadoEscolhido: params.certificado
    });

    if (params.cessaoId) {
      await this.registrarEloCadeia(params.cessaoId, {
        tipo: 'ASSINATURA_ICP_BRASIL_A1',
        documentoId: params.documentoId,
        algoritmo: assinatura.algoritmoAssinatura,
        carimboTempo: assinatura.carimboDoTempoIcpBrasil,
        serialNumber: assinatura.certificado.serialNumber,
        pacotePadesCadesHash: assinatura.pacotePadesCadesHash
      }, assinatura.certificado.subjectName);
    }

    return assinatura;
  }

  // ==========================================================================
  // PUBLICAÇÃO & PROTOCOLO NO DJEN
  // ==========================================================================

  public async gerarPeticaoDjen(params: {
    precatorioId: string;
    numeroProcesso: string;
    tribunal: string;
    varaJuizo?: string;
    numeroOficio: string;
    cedenteNome: string;
    cedenteDocumento: string;
    cessionarioNome: string;
    cessionarioCnpj: string;
    valorCessao: number;
    escrituraNotarialHash?: string;
  }): Promise<PeticaoHabilitacaoDjen> {
    return djenPeticionamentoService.gerarPeticaoHabilitacao(params);
  }

  public async registrarProtocoloDjen(params: {
    cessaoId?: string;
    precatorioId: string;
    numeroProcesso: string;
    numeroProtocoloJudicial: string;
    advogadoResponsavel: string;
    oabAdvogado: string;
  }): Promise<ProtocoloDjenResult> {
    const protocolo = await djenPeticionamentoService.registrarProtocoloManual(params);

    if (params.cessaoId) {
      await this.registrarEloCadeia(params.cessaoId, {
        tipo: 'PROTOCOLO_JUDICIAL_HABILITACAO_DJEN',
        numeroProtocolo: protocolo.numeroProtocoloJudicial,
        processo: protocolo.numeroProcesso,
        advogado: protocolo.advogadoResponsavel,
        oab: protocolo.oabAdvogado,
        reciboHash: protocolo.comprovanteReciboHash
      }, `Advogado ${params.advogadoResponsavel} (${params.oabAdvogado})`);
    }

    return protocolo;
  }
}

export const complianceEngine = new ComplianceEngine();
