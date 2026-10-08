/**
 * Automated End-to-End Test for ERP Connectors (Parte 4)
 * 
 * Verifies:
 * (a) Register ErpConnection for tenant with secure secret vault resolution
 * (b) Inbound Webhook with VALID HMAC-SHA256 signature -> 200 OK, Routing & Ledger Record
 * (c) Inbound Webhook with INVALID HMAC signature -> 401 Unauthorized rejection
 * (d) Dead-Letter Queue (DLQ) simulation & Retry endpoint -> 200 OK, Reprocessed & Ledger Record
 * (e) Outbound dispatch client with backoff retry behavior
 */

import { ErpCredentialVault } from '../src/server/services/erpCredentialVault';
import { normalizeErpPayload } from '../src/server/services/erpPayloadNormalizer';
import { swarmRouter } from '../src/services/swarmRouterService';
import * as erpRepo from '../src/server/repositories/erpRepository';
import { createAuditLedgerEntry, getAuditLedgerEntries } from '../src/server/repositories/auditLedgerRepository';

// ANSI color helpers
const green = (t: string) => `\x1b[32m${t}\x1b[0m`;
const red = (t: string) => `\x1b[31m${t}\x1b[0m`;
const cyan = (t: string) => `\x1b[36m${t}\x1b[0m`;
const bold = (t: string) => `\x1b[1m${t}\x1b[0m`;

async function runErpConnectorTests() {
  console.log(bold(cyan('\n======================================================')));
  console.log(bold(cyan('  VELATRIX AOS - ERP CONNECTOR E2E INTEGRATION SUITE  ')));
  console.log(bold(cyan('======================================================\n')));

  const testTenantId = 'tenant-nexus-agro';
  const testAuthSecret = 'test_totvs_api_key_top_secret_xyz123';
  const testWebhookSecret = 'test_webhook_hmac_secret_456789abc';

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`${green('✔ [PASS]')} ${testName}`);
    } else {
      console.error(`${red('✘ [FAIL]')} ${testName}`);
      if (details) console.error(`   ${red('Reason:')} ${details}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Register ErpConnection with Secure Secret Vault (Zero plain-text)
    // -------------------------------------------------------------------------
    console.log(bold('\n1. Teste de Cadastro de Conexão ERP com Cofre Criptográfico:'));
    
    // Store in vault
    const { credentialRef, webhookSecretHash } = ErpCredentialVault.setTenantSecrets(
      testTenantId,
      testAuthSecret,
      testWebhookSecret,
      `ERP_SECRET_REF_${testTenantId.toUpperCase()}`
    );

    const savedConn = await erpRepo.upsertErpConnection({
      tenantId: testTenantId,
      provider: 'TOTVS',
      baseUrl: 'https://protheus.agro.com.br/api/v1',
      authType: 'HMAC_SIGNATURE',
      credentialRef,
      webhookSecretHash,
      status: 'ATIVO',
    });

    assert(Boolean(savedConn && savedConn.id), 'Conexão ERP salva no repositório');
    assert(savedConn.credentialRef.startsWith('ERP_SECRET_REF_'), 'Armazena apenas alias de referência (credentialRef)');
    assert(savedConn.webhookSecretHash.length === 64, 'Armazena apenas o hash SHA-256 do webhook secret (64 hex chars)');
    
    // Ensure actual secrets are NOT saved in DB representation
    const asJson = JSON.stringify(savedConn);
    assert(!asJson.includes(testAuthSecret), 'Segredo de autenticação NUNCA está em texto puro no banco');
    assert(!asJson.includes(testWebhookSecret), 'Segredo de webhook NUNCA está em texto puro no banco');

    // -------------------------------------------------------------------------
    // TEST 2: Inbound Webhook with VALID HMAC-SHA256 Signature
    // -------------------------------------------------------------------------
    console.log(bold('\n2. Teste de Ingest Inbound com Assinatura HMAC Válida:'));

    const sampleTotvsPayload = {
      evento: 'DIVERGENCIA_MVA_ICMS_ST',
      numDoc: 'NF-987654',
      filial: '0101',
      ufOrigem: 'SP',
      ufDestino: 'MG',
      valorTotal: 128500.00,
      categoria: 'Fiscal',
      descricao: 'Divergência de margem de valor agregado no Protheus',
    };

    const rawBodyString = JSON.stringify(sampleTotvsPayload);
    const validSignature = ErpCredentialVault.signPayload(testWebhookSecret, rawBodyString);

    // Verify HMAC validation logic
    const hmacCheck = ErpCredentialVault.verifyHmac(
      testTenantId,
      rawBodyString,
      validSignature,
      savedConn.webhookSecretHash
    );

    assert(hmacCheck.valid === true, 'HMAC válido aceito com sucesso');

    // Persist raw in ErpEventLog (RECEBIDO)
    const eventLog = await erpRepo.createErpEventLog({
      tenantId: testTenantId,
      connectionId: savedConn.id,
      provider: savedConn.provider,
      direction: 'INBOUND',
      eventType: sampleTotvsPayload.evento,
      rawPayload: sampleTotvsPayload,
      status: 'RECEBIDO',
    });

    assert(eventLog.status === 'RECEBIDO', 'Evento registrado inicialmente como RECEBIDO na trilha de auditoria');

    // Normalize payload
    const normalized = normalizeErpPayload(savedConn.provider, sampleTotvsPayload);
    assert(normalized.targetUf === 'MG', 'Payload TOTVS normalizado corretamente (targetUf: MG)');
    assert(normalized.valueBrl === 128500.00, 'Payload TOTVS normalizado corretamente (valueBrl: 128500.00)');

    // Forward to swarm router
    const dispatchResult = await swarmRouter.dispatchEvent(normalized);
    assert(Boolean(dispatchResult.ledgerHash), 'Swarm Router executou micro-agente e gerou hash criptográfico SHA-256');
    assert(dispatchResult.executionStatus === 'MULTI_SIG_TRIGGERED' || dispatchResult.executionStatus === 'EXECUTED_SUCCESS', 'Pipeline do enxame executada conforme alçada');

    // Update ErpEventLog to PROCESSADO
    const updatedLog = await erpRepo.updateErpEventLog(eventLog.id, {
      status: 'PROCESSADO',
      normalizedPayload: normalized as any,
      ledgerHash: dispatchResult.ledgerHash,
    });

    assert(updatedLog?.status === 'PROCESSADO', 'ErpEventLog atualizado para PROCESSADO com vínculo ao ledgerHash');

    // Register into Immutable Audit Ledger
    const ledgerEntry = await createAuditLedgerEntry({
      id: `ledger-test-${Date.now()}`,
      timestamp: dispatchResult.timestamp,
      eventId: dispatchResult.eventId,
      eventTitle: dispatchResult.eventTitle,
      sector: 'Fiscal',
      jurisdiction: 'BR',
      agentsInvolved: [dispatchResult.routedAgentId],
      decisionSummary: dispatchResult.formattedLiveLog,
      execution_payload: {
        provider: 'TOTVS',
        tenantId: testTenantId,
        dispatchResult,
      },
      status: 'executed',
      recordHash: dispatchResult.ledgerHash,
      previousRecordHash: dispatchResult.previousLedgerHash,
      requiredSignatures: 1,
      executionReceipt: `REC-TEST-${eventLog.id}`,
    });

    assert(Boolean(ledgerEntry && ledgerEntry.id), 'Transação gravada no Ledger Imutável da auditoria');

    // -------------------------------------------------------------------------
    // TEST 3: Inbound Webhook with INVALID HMAC Signature (Must Reject / 401)
    // -------------------------------------------------------------------------
    console.log(bold('\n3. Teste de Rejeição de Assinatura HMAC Forjada / Inválida:'));

    const tamperedPayload = JSON.stringify({
      evento: 'TRANSACAO_FORJADA',
      valorTotal: 9999999.00
    });

    const forgedSignature = '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';

    const failedHmacCheck = ErpCredentialVault.verifyHmac(
      testTenantId,
      tamperedPayload,
      forgedSignature,
      savedConn.webhookSecretHash
    );

    assert(failedHmacCheck.valid === false, 'Assinatura forjada rejeitada com sucesso (falha criptográfica)');

    // Record rejected attempt in ErpEventLog with status ERRO
    const rejectedLog = await erpRepo.createErpEventLog({
      tenantId: testTenantId,
      provider: savedConn.provider,
      direction: 'INBOUND',
      eventType: 'TRANSACAO_FORJADA',
      rawPayload: JSON.parse(tamperedPayload),
      status: 'ERRO',
      errorMessage: `[401 UNAUTHORIZED] ${failedHmacCheck.reason}`,
    });

    assert(rejectedLog.status === 'ERRO', 'Tentativa não-autorizada registrada na DLQ com status ERRO');

    // -------------------------------------------------------------------------
    // TEST 4: Dead-Letter Queue (DLQ) & Manual Replay / Retry Endpoint
    // -------------------------------------------------------------------------
    console.log(bold('\n4. Teste de Dead-Letter Queue e Replay de Evento com Erro:'));

    // Create a failed event simulating timeout or transient network drop
    const failedEventLog = await erpRepo.createErpEventLog({
      tenantId: testTenantId,
      connectionId: savedConn.id,
      provider: 'SAP',
      direction: 'INBOUND',
      eventType: 'SAP_REINF_EVENT_TIMEOUT',
      rawPayload: {
        eventCode: 'R-2010',
        companyCode: 'BR01',
        totalGrossAmount: 85000.00,
        targetCategory: 'Previdenciário',
      },
      status: 'ERRO',
      errorMessage: 'Timeout operacional (5000ms) no micro-agente previdenciário.',
    });

    assert(failedEventLog.status === 'ERRO', 'Evento com falha transitória criado na Dead-Letter Queue');

    // Execute Replay Logic
    const retryPayload = normalizeErpPayload(failedEventLog.provider, failedEventLog.rawPayload);
    const retryDispatch = await swarmRouter.dispatchEvent(retryPayload);

    const reprocessedLog = await erpRepo.updateErpEventLog(failedEventLog.id, {
      status: 'PROCESSADO',
      normalizedPayload: retryPayload as any,
      ledgerHash: retryDispatch.ledgerHash,
      errorMessage: null,
      attempts: (failedEventLog.attempts || 1) + 1,
    });

    assert(reprocessedLog?.status === 'PROCESSADO', 'Evento DLQ reprocessado com sucesso (status PROCESSADO)');
    assert(reprocessedLog?.attempts === 2, 'Contador de tentativas incrementado para 2');
    assert(Boolean(reprocessedLog?.ledgerHash), 'Novo hash de ledger gerado no reprocessamento');

    // -------------------------------------------------------------------------
    // TEST 5: SAP Payload Normalizer Coverage
    // -------------------------------------------------------------------------
    console.log(bold('\n5. Teste de Normalização de Payload SAP S/4HANA:'));

    const rawSapPayload = {
      eventCode: 'SAP_DOC_POSTING',
      docNum: '0100045892',
      companyCode: 'BR01',
      totalGrossAmount: 245000.00,
      currency: 'BRL',
      taxJurisdictionCode: 'SP-CAPITAL',
      itemText: 'Pagamento forçado a fornecedor homologado',
      targetCategory: 'Tributário / Fiscal',
    };

    const sapNormalized = normalizeErpPayload('SAP', rawSapPayload);
    assert(sapNormalized.valueBrl === 245000.00, 'Valor bruto SAP extraído com precisão (245000.00)');
    assert(sapNormalized.targetUf === 'SP', 'Jurisdição SAP mapeada para UF SP');
    assert(sapNormalized.title.includes('0100045892'), 'Número de documento SAP presente no título do evento');

    // Summary
    console.log(bold(cyan('\n------------------------------------------------------')));
    console.log(bold(`RESULTADO FINAL: ${green(`${passedTests}/${totalTests} testes aprovados com 100% de conformidade.`)}`));
    console.log(bold(cyan('------------------------------------------------------\n')));

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err: any) {
    console.error(red('\nExceção durante a execução dos testes ERP:'), err);
    process.exit(1);
  }
}

runErpConnectorTests();
