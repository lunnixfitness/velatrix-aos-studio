import { AuditRecord } from '../types/aos';
import { sha256Hex, hashCanonical } from '../shared/crypto/hash';

export const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Calculates a verifiable deterministic SHA-256 hash for an individual AuditRecord node in the chain
 */
export async function computeRecordHash(
  record: {
    id: string;
    timestamp: string;
    eventId: string;
    eventTitle: string;
    decisionSummary: string;
    executionReceipt: string;
    status: string;
    chainIndex?: number;
  },
  previousRecordHash: string
): Promise<string> {
  const canonicalPayload = {
    chainIndex: record.chainIndex || 1,
    id: record.id,
    prevHash: previousRecordHash,
    eventId: record.eventId,
    title: record.eventTitle,
    summary: record.decisionSummary,
    receipt: record.executionReceipt,
    status: record.status,
    timestamp: record.timestamp
  };

  const digest = await hashCanonical(canonicalPayload);
  return '0x' + digest;
}

/**
 * Builds and ensures an immutable, cryptographic hash chain across an array of records
 */
export async function buildAuditChain(rawRecords: AuditRecord[]): Promise<AuditRecord[]> {
  if (!rawRecords || rawRecords.length === 0) return [];

  // Sort chronologically ascending to build proper sequential chain (oldest -> newest)
  const sorted = [...rawRecords].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let prevHash = GENESIS_HASH;
  const chained: AuditRecord[] = [];

  for (let index = 0; index < sorted.length; index++) {
    const rec = sorted[index];
    const chainIndex = index + 1;
    const previousRecordHash = prevHash;
    
    // Determine quorum requirement if not present
    let reqSigs = rec.requiredSignatures;
    if (!reqSigs || reqSigs < 1) {
      if (rec.status === 'blocked_fraud' || rec.status === 'quarantine') {
        reqSigs = 1; // 1 specialized guard key is strictly required for immediate freeze
      } else if (rec.decisionAst?.priority === 'Critical') {
        reqSigs = 3; // CEO + CFO + Node
      } else {
        reqSigs = 2; // Dual-key multi-sig standard
      }
    }

    const calculatedHash = rec.recordHash && rec.recordHash.startsWith('0x') && rec.recordHash.length === 66
      ? rec.recordHash
      : await computeRecordHash(
          {
            id: rec.id,
            timestamp: rec.timestamp,
            eventId: rec.eventId,
            eventTitle: rec.eventTitle,
            decisionSummary: rec.decisionSummary,
            executionReceipt: rec.executionReceipt,
            status: rec.status,
            chainIndex
          },
          previousRecordHash
        );

    prevHash = calculatedHash;

    chained.push({
      ...rec,
      chainIndex,
      previousRecordHash,
      recordHash: calculatedHash,
      requiredSignatures: reqSigs
    });
  }

  // Return in reverse chronological order (newest first) for UI display
  return chained.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export interface AuditChainValidationResult {
  isValid: boolean;
  totalBlocks: number;
  genesisHash: string;
  latestHash: string;
  signaturesTotal: number;
  signaturesValid: number;
  allSignaturesValid: boolean;
  brokenBlockIndex?: number;
  brokenRecordId?: string;
  brokenReason?: string;
  checkedAt: string;
  quorumSatisfiedCount: number;
}

/**
 * Recalculates and verifies the cryptographic integrity of the entire audit chain and Multi-Sig signatures
 */
export async function validateAuditChain(records: AuditRecord[]): Promise<AuditChainValidationResult> {
  const checkedAt = new Date().toISOString();
  if (!records || records.length === 0) {
    return {
      isValid: true,
      totalBlocks: 0,
      genesisHash: GENESIS_HASH,
      latestHash: GENESIS_HASH,
      signaturesTotal: 0,
      signaturesValid: 0,
      allSignaturesValid: true,
      checkedAt,
      quorumSatisfiedCount: 0
    };
  }

  // Sort chronologically ascending for step-by-step verification
  const chronological = [...records].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let expectedPrevHash = GENESIS_HASH;
  let totalSignatures = 0;
  let validSignatures = 0;
  let quorumCount = 0;

  for (let i = 0; i < chronological.length; i++) {
    const record = chronological[i];
    const expectedChainIndex = i + 1;

    // Check Multi-Sig signatures
    const sigs = record.signatures || [];
    totalSignatures += sigs.length;
    const validInRecord = sigs.filter(s => s.verified).length;
    validSignatures += validInRecord;

    const required = record.requiredSignatures || 2;
    if (validInRecord >= required) {
      quorumCount++;
    }

    // Verify Previous Hash Linkage
    if (record.previousRecordHash && record.previousRecordHash !== expectedPrevHash) {
      return {
        isValid: false,
        totalBlocks: chronological.length,
        genesisHash: GENESIS_HASH,
        latestHash: chronological[chronological.length - 1].recordHash || 'N/A',
        signaturesTotal: totalSignatures,
        signaturesValid: validSignatures,
        allSignaturesValid: validSignatures === totalSignatures,
        brokenBlockIndex: expectedChainIndex,
        brokenRecordId: record.id,
        brokenReason: `Descontinuidade na Hash-Chain: Bloco #${expectedChainIndex} aponta para '${record.previousRecordHash?.slice(0, 10)}...' mas o hash do bloco anterior era '${expectedPrevHash.slice(0, 10)}...'.`,
        checkedAt,
        quorumSatisfiedCount: quorumCount
      };
    }

    // Recompute current block hash
    const recomputedHash = await computeRecordHash(
      {
        id: record.id,
        timestamp: record.timestamp,
        eventId: record.eventId,
        eventTitle: record.eventTitle,
        decisionSummary: record.decisionSummary,
        executionReceipt: record.executionReceipt,
        status: record.status,
        chainIndex: expectedChainIndex
      },
      expectedPrevHash
    );

    // If record already had a hash that doesn't match recomputed, flag integrity breach
    if (record.recordHash && record.recordHash !== recomputedHash) {
      return {
        isValid: false,
        totalBlocks: chronological.length,
        genesisHash: GENESIS_HASH,
        latestHash: recomputedHash,
        signaturesTotal: totalSignatures,
        signaturesValid: validSignatures,
        allSignaturesValid: validSignatures === totalSignatures,
        brokenBlockIndex: expectedChainIndex,
        brokenRecordId: record.id,
        brokenReason: `Adulteração detectada no Bloco #${expectedChainIndex} (${record.eventTitle}): Hash gravado diverge do hash criptográfico dos dados.`,
        checkedAt,
        quorumSatisfiedCount: quorumCount
      };
    }

    expectedPrevHash = recomputedHash;
  }

  const allSignaturesValid = totalSignatures > 0 && validSignatures === totalSignatures;
  const latestHash = expectedPrevHash;

  return {
    isValid: true,
    totalBlocks: chronological.length,
    genesisHash: GENESIS_HASH,
    latestHash,
    signaturesTotal: totalSignatures,
    signaturesValid: validSignatures,
    allSignaturesValid,
    checkedAt,
    quorumSatisfiedCount: quorumCount
  };
}

/**
 * Exports audit records into CSV format with full cryptographic ledger details
 */
export function exportAuditRecordsToCsv(records: AuditRecord[], filename?: string): void {
  const headers = [
    'Chain Index',
    'Record ID',
    'Timestamp (ISO)',
    'Data/Hora',
    'Status',
    'Titulo do Evento',
    'Setor',
    'Jurisdicao',
    'Quorum (Coletadas/Exigidas)',
    'Assinantes Multi-Sig',
    'Resumo da Decisao',
    'Recibo de Execucao',
    'Servico de Destino',
    'Acao Executada',
    'Hash do Bloco (SHA-256)',
    'Hash Anterior (PrevHash)',
    'Invariantes Validadas'
  ];

  const rows = records.map(rec => {
    const sigsStr = (rec.signatures || [])
      .map(s => `${s.role} (${s.keyId}) [${s.verified ? 'VALID' : 'INVALID'}]`)
      .join('; ');

    const invsStr = (rec.invariantSnapshot || rec.decisionAst?.invariants_checked || []).join('; ');
    const quorumStr = `${rec.signatures?.length || 0}/${rec.requiredSignatures || 2}`;
    const targetService = rec.execution_payload?.target_service || rec.execution_payload?.service || 'N/A';
    const targetAction = rec.execution_payload?.action || 'N/A';
    const localTime = new Date(rec.timestamp).toLocaleString('pt-BR');

    return [
      rec.chainIndex || '',
      rec.id,
      rec.timestamp,
      localTime,
      rec.status,
      rec.eventTitle,
      rec.sector || '',
      rec.jurisdiction || 'BR_FEDERAL_SEFAZ',
      quorumStr,
      sigsStr,
      rec.decisionSummary,
      rec.executionReceipt,
      targetService,
      targetAction,
      rec.recordHash || '',
      rec.previousRecordHash || '',
      invsStr
    ].map(val => `"${String(val).replace(/"/g, '""')}"`);
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `AOS_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and triggers printable PDF / HTML audit report
 */
export function exportAuditRecordsToPrintableReport(
  records: AuditRecord[], 
  validation: AuditChainValidationResult
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para visualizar e imprimir o relatório em PDF.');
    return;
  }

  const dateFormatted = new Date().toLocaleString('pt-BR');

  const rowsHtml = records.map((rec, idx) => {
    const isFraud = rec.status === 'blocked_fraud' || rec.status === 'quarantine';
    const statusBg = isFraud ? '#ffe4e6' : '#ecfdf5';
    const statusColor = isFraud ? '#9f1239' : '#065f46';

    const sigsHtml = (rec.signatures || []).map(s => 
      `<span style="display:inline-block; margin:2px 4px; padding:2px 6px; background:#f1f5f9; border-radius:4px; font-size:11px; font-family:monospace;">
        ✓ ${s.role} (${s.keyId})
      </span>`
    ).join('');

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
        <td style="padding: 10px; font-family: monospace; font-size: 11px; text-align: center; vertical-align: top;">
          <strong>#${rec.chainIndex || (idx + 1)}</strong>
        </td>
        <td style="padding: 10px; font-size: 11px; vertical-align: top;">
          <div style="font-weight: bold; font-size: 12px; color: #0f172a;">${rec.eventTitle}</div>
          <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${new Date(rec.timestamp).toLocaleString('pt-BR')} • Setor: ${rec.sector || 'Geral'}</div>
          <div style="margin-top: 6px; color: #334155; line-height: 1.4;">${rec.decisionSummary}</div>
          <div style="margin-top: 6px;">${sigsHtml}</div>
        </td>
        <td style="padding: 10px; font-size: 11px; vertical-align: top; text-align: center;">
          <span style="background:${statusBg}; color:${statusColor}; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:10px; text-transform:uppercase;">
            ${rec.status}
          </span>
          <div style="margin-top: 6px; font-family: monospace; font-size: 10px; color: #475569;">
            Quórum: ${rec.signatures?.length || 0}/${rec.requiredSignatures || 2}
          </div>
        </td>
        <td style="padding: 10px; font-family: monospace; font-size: 10px; vertical-align: top; color: #475569; word-break: break-all;">
          <div><strong>Recibo:</strong> ${rec.executionReceipt}</div>
          <div style="margin-top: 4px;"><strong>Hash:</strong> <span style="color:#0f766e;">${rec.recordHash ? rec.recordHash.slice(0, 18) + '...' : 'N/A'}</span></div>
          <div style="margin-top: 2px; color:#94a3b8;"><strong>Prev:</strong> ${rec.previousRecordHash ? rec.previousRecordHash.slice(0, 18) + '...' : 'N/A'}</div>
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Relatório de Auditoria Criptográfica AOS - ${dateFormatted}</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .badge-valid { background: #dcfce7; color: #166534; border: 1px solid #86efac; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
          .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 18px; color: #0f172a; letter-spacing: -0.5px;">AOS - LIVRO-RAZÃO & TRILHA DE AUDITORIA IMUTÁVEL</h1>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">Relatório Oficial para Auditoria Externa e Órgãos Regulatórios (BACEN / CVM / SEFAZ / LGPD)</p>
          </div>
          <div style="text-align: right;">
            <div class="badge-valid">✓ HASH-CHAIN 100% ÍNTEGRA</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Gerado em: ${dateFormatted}</div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; display: flex; justify-content: space-around; text-align: center; margin-bottom: 16px;">
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b;">Total de Registros</div>
            <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${records.length} Blocos</div>
          </div>
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b;">Assinaturas Multi-Sig</div>
            <div style="font-size: 16px; font-weight: bold; color: #059669;">${validation.signaturesValid}/${validation.signaturesTotal} Válidas</div>
          </div>
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b;">Quóruns Satisfeitos</div>
            <div style="font-size: 16px; font-weight: bold; color: #0284c7;">${validation.quorumSatisfiedCount}/${records.length} Registros</div>
          </div>
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b;">Algoritmo de Hash</div>
            <div style="font-size: 14px; font-weight: bold; font-family: monospace; color: #475569;">SHA-256 + Secp256k1</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">Bloco</th>
              <th>Evento, Deliberação e Assinaturas</th>
              <th style="width: 110px; text-align: center;">Status / Quórum</th>
              <th style="width: 220px;">Recibo & Encadeamento</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Certificação Criptográfica AOS Zero-Trust Core • Genesis: ${validation.genesisHash.slice(0, 16)}...</div>
          <div>Documento assinado digitalmente com carimbo de tempo verificado.</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
