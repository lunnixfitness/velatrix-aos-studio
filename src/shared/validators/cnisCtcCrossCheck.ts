/**
 * Validador de Conciliação Cruzada entre CTC (Certidão de Tempo de Contribuição)
 * e o Histórico de Remunerações/Vínculos do CNIS.
 * 
 * FIX 7: compara períodos declarados na CTC com recolhimentos no CNIS.
 * Se divergência > 30 dias em qualquer vínculo, acusa divergência e bloqueia o estágio.
 */

export interface VinculoPrevidenciarioPeriodo {
  id: string;
  origem: 'CTC' | 'CNIS';
  empregadorOuOrgao: string;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;    // YYYY-MM-DD
  diasComputados: number;
}

export interface CnisCtcCrossCheckResult {
  hasDivergencia: boolean;
  maxDivergenciaDias: number;
  vinculosAuditados: {
    orgaoOuEmpregador: string;
    diasCtc: number;
    diasCnis: number;
    divergenciaDias: number;
    divergente: boolean;
    motivo?: string;
  }[];
  mensagemStatus: string;
}

/**
 * Calcula a diferença em dias entre duas datas ISO YYYY-MM-DD
 */
function calcularDiferencaDias(inicioStr: string, fimStr: string): number {
  const dInicio = new Date(inicioStr);
  const dFim = new Date(fimStr);
  const diffMs = Math.abs(dFim.getTime() - dInicio.getTime());
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Validador cruzado CNIS x CTC
 */
export function auditCnisCtcCrossCheck(
  periodosCtc: VinculoPrevidenciarioPeriodo[],
  periodosCnis: VinculoPrevidenciarioPeriodo[]
): CnisCtcCrossCheckResult {
  let maxDivergencia = 0;
  const vinculosAuditados: CnisCtcCrossCheckResult['vinculosAuditados'] = [];

  for (const ctc of periodosCtc) {
    const cnisMatch = periodosCnis.find(
      c => c.empregadorOuOrgao.toLowerCase().trim() === ctc.empregadorOuOrgao.toLowerCase().trim()
    );

    const diasCtc = ctc.diasComputados || calcularDiferencaDias(ctc.dataInicio, ctc.dataFim);
    const diasCnis = cnisMatch
      ? (cnisMatch.diasComputados || calcularDiferencaDias(cnisMatch.dataInicio, cnisMatch.dataFim))
      : 0;

    const diff = Math.abs(diasCtc - diasCnis);
    if (diff > maxDivergencia) {
      maxDivergencia = diff;
    }

    const divergente = diff > 30;

    vinculosAuditados.push({
      orgaoOuEmpregador: ctc.empregadorOuOrgao,
      diasCtc,
      diasCnis,
      divergenciaDias: diff,
      divergente,
      motivo: divergente
        ? `Período declarado na CTC (${diasCtc} dias) diverge em ${diff} dias dos recolhimentos registrados no CNIS (${diasCnis} dias). Limite de tolerância: 30 dias.`
        : undefined
    });
  }

  const hasDivergencia = vinculosAuditados.some(v => v.divergente);

  return {
    hasDivergencia,
    maxDivergenciaDias: maxDivergencia,
    vinculosAuditados,
    mensagemStatus: hasDivergencia
      ? 'DIVERGÊNCIA CNIS×CTC — vínculo controvertido'
      : 'CONCILIAÇÃO CNIS×CTC VÁLIDA — sem divergências superiores a 30 dias'
  };
}
