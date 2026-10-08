import { z } from 'zod';

/**
 * DTOs Tipados e Validados via Zod para Laudos Oficiais e Padronizados do Velatrix AOS
 * Protocolo de Emissão Zero-Ficção (disallowSyntheticData = true)
 */

/* ========================================================================= */
/* 1. SEÇÃO 1: CRÉDITO TRIBUTÁRIO EFETIVAMENTE APURADO                       */
/* ========================================================================= */

export const TributoFiscalEnum = z.enum(['PIS', 'COFINS', 'ICMS', 'IRPJ', 'CSLL']);
export type TributoFiscal = z.infer<typeof TributoFiscalEnum>;

export const CreditoTributarioApuradoSchema = z.object({
  competencia: z.string().regex(/^(\d{4}-(0[1-9]|1[0-2])|(0[1-9]|1[0-2])\/\d{4})$/, 'Competência deve estar no formato YYYY-MM ou MM/AAAA'),
  tributo: TributoFiscalEnum,
  valorPrincipal: z.number().nonnegative('Valor principal não pode ser negativo'),
  selicAcumulada: z.number().nonnegative('Taxa SELIC acumulada não pode ser negativa'),
  valorAtualizado: z.number().nonnegative('Valor atualizado não pode ser negativo'),
  fonteSped: z.string().min(1, 'Fonte SPED / Registro obrigatório')
});

export type CreditoTributarioApurado = z.infer<typeof CreditoTributarioApuradoSchema>;

/* ========================================================================= */
/* 2. SEÇÃO 2: EVIDÊNCIAS DE CRUZAMENTO (SPED x PGDAS x DCTFWEB)             */
/* ========================================================================= */

export const OrigemEvidenciaEnum = z.enum(['SPED_EFD', 'PGDAS-D', 'DCTFWEB']);
export type OrigemEvidencia = z.infer<typeof OrigemEvidenciaEnum>;

export const EvidenciaCruzamentoSchema = z.object({
  origem: OrigemEvidenciaEnum,
  divergenciaTipo: z.string().min(1, 'Tipo de divergência obrigatório'),
  valorSped: z.number().nonnegative('Valor apurado no SPED não pode ser negativo'),
  valorDeclarado: z.number().nonnegative('Valor declarado na obrigação não pode ser negativo'),
  delta: z.number(),
  competencia: z.string().min(1, 'Competência da divergência obrigatória')
});

export type EvidenciaCruzamento = z.infer<typeof EvidenciaCruzamentoSchema>;

/* ========================================================================= */
/* 3. SEÇÃO 3: BASE LEGAL APLICADA & TESES VINCULANTES                       */
/* ========================================================================= */

export const BaseLegalRefSchema = z.object({
  law: z.string().min(1, 'Identificação da norma / lei obrigatória'),
  article: z.string().optional(),
  description: z.string().min(1, 'Descrição ou sumário da tese obrigatório')
});

export type BaseLegalRef = z.infer<typeof BaseLegalRefSchema>;

/* ========================================================================= */
/* 4. SEÇÃO 4: MEMÓRIA DE CÁLCULO MÊS A MÊS (ATÉ 60 COMPETÊNCIAS)             */
/* ========================================================================= */

export const MemoriaCalculoCompetenciaSchema = z.object({
  competencia: z.string().min(1, 'Competência obrigatória'),
  baseCalculo: z.number().nonnegative('Base de cálculo não pode ser negativa'),
  aliquotaAplicada: z.number().nonnegative('Alíquota aplicada não pode ser negativa'),
  valorDevido: z.number().nonnegative('Valor devido não pode ser negativo'),
  valorRecolhido: z.number().nonnegative('Valor recolhido não pode ser negativo'),
  indebito: z.number(),
  evidenciaSpedLinha: z.number().int().positive('Número de linha da EFD deve ser positivo')
});

export type MemoriaCalculoCompetencia = z.infer<typeof MemoriaCalculoCompetenciaSchema>;

/* ========================================================================= */
/* 5. SEÇÃO 5: PARECER TÉCNICO CONCLUSIVO & RESPONSABILIDADE TÉCNICA         */
/* ========================================================================= */

export const ParecerTecnicoSchema = z.object({
  conclusao: z.string().min(10, 'Conclusão pericial deve ser substanciada e clara'),
  responsavelTecnico: z.string().min(3, 'Nome do perito / responsável técnico obrigatório'),
  registroProfissional: z.string().min(3, 'Registro de classe profissional obrigatório (ex: CRC/OAB)'),
  orgaoClasse: z.string().min(2, 'Órgão de classe obrigatório'),
  dataAssinatura: z.string().min(1, 'Data de emissão e assinatura obrigatória'),
  parecerFavoravel: z.boolean(),
  fundamentoResumido: z.string().optional(),
  observacoes: z.array(z.string()).optional()
});

export type ParecerTecnico = z.infer<typeof ParecerTecnicoSchema>;

/* ========================================================================= */
/* 6. SEÇÃO 6: PRÓXIMOS PASSOS & ROTEIRO OPERACIONAL DE COMPENSAÇÃO          */
/* ========================================================================= */

export const EtapaProximoPassoSchema = z.object({
  ordem: z.number().int().positive(),
  titulo: z.string().min(1, 'Título da etapa obrigatório'),
  descricao: z.string().min(1, 'Descrição operacional da etapa obrigatória'),
  prazoEstimadoDias: z.number().optional(),
  responsavel: z.string().optional(),
  sistemaDestino: z.string().optional()
});

export const ProximosPassosSchema = z.object({
  etapas: z.array(EtapaProximoPassoSchema).min(1, 'Deve conter pelo menos uma etapa nos próximos passos'),
  recomendacaoFinal: z.string().optional()
});

export type EtapaProximoPasso = z.infer<typeof EtapaProximoPassoSchema>;
export type ProximosPassos = z.infer<typeof ProximosPassosSchema>;

/* ========================================================================= */
/* SCHEMA COMPLETO DO PAYLOAD DE SEÇÕES PARA RECUPERAÇÃO TRIBUTÁRIA          */
/* ========================================================================= */

export const TaxRecoverySectionsPayloadSchema = z.object({
  credito_apurado: z.array(CreditoTributarioApuradoSchema).min(1, 'Seção 1 (credito_apurado) não pode ser vazia.'),
  cruzamento_evidencias: z.array(EvidenciaCruzamentoSchema).min(1, 'Seção 2 (cruzamento_evidencias) deve conter confrontos analíticos reais.'),
  base_legal_aplicada: z.array(BaseLegalRefSchema).min(1, 'Seção 3 (base_legal_aplicada) deve conter fundamentação legal aplicável.'),
  memoria_calculo: z.array(MemoriaCalculoCompetenciaSchema).min(1, 'Seção 4 (memoria_calculo) deve conter a memória mês a mês.'),
  parecer_tecnico: ParecerTecnicoSchema,
  proximos_passos: ProximosPassosSchema
});

export type TaxRecoverySectionsPayload = z.infer<typeof TaxRecoverySectionsPayloadSchema>;

/* ========================================================================= */
/* GUARD DE VALIDAÇÃO E SANIDADE CONTRA '[object Object]'                    */
/* ========================================================================= */

export function containsObjectStringification(obj: any): boolean {
  if (obj === null || obj === undefined) return false;
  if (typeof obj === 'string') {
    return obj.includes('[object Object]');
  }
  if (typeof obj === 'object') {
    try {
      const str = JSON.stringify(obj);
      return str.includes('[object Object]');
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Validação pré-assinatura e pré-cálculo do hash SHA-256.
 * LANÇA ERRO se qualquer seção cair em fallback ou estiver inválida.
 */
export function guardReportEmission(serviceId: string, sectionsPayload: any): void {
  if (!sectionsPayload || typeof sectionsPayload !== 'object') {
    throw new Error(
      `[EmissionGuard] Bloqueio Crítico: sectionsPayload ausente ou nulo para o serviço '${serviceId}'. Emissão cancelada.`
    );
  }

  // Sanity check contra stringificação corrompida
  if (containsObjectStringification(sectionsPayload)) {
    throw new Error(
      `[EmissionGuard] Bloqueio Crítico: Foi detectada serialização '[object Object]' no payload do laudo. Violação grave de integridade.`
    );
  }

  // Validação estrita para Recuperação Tributária
  if (serviceId === 'tax_recovery' || serviceId === 'legal_tax_recovery') {
    const parseResult = TaxRecoverySectionsPayloadSchema.safeParse(sectionsPayload);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        iss => `• Campo '${iss.path.join('.')}': ${iss.message}`
      );
      throw new Error(
        `[EmissionGuard] Laudo rejeitado pelo validador Zod do serviço '${serviceId}':\n${issues.join('\n')}`
      );
    }
  }
}

/**
 * Validador individual de seção para renderers da UI
 */
export function validateSectionData(sectionId: string, data: any): { success: boolean; error?: string } {
  if (data === undefined || data === null) {
    return { success: false, error: `Dados da seção '${sectionId}' estão indefinidos ou vazios.` };
  }

  if (containsObjectStringification(data)) {
    return { success: false, error: `Dados da seção '${sectionId}' contêm serialização corrupta '[object Object]'.` };
  }

  switch (sectionId) {
    case 'credito_apurado': {
      const res = z.array(CreditoTributarioApuradoSchema).min(1).safeParse(data);
      return res.success ? { success: true } : { success: false, error: res.error.issues[0]?.message };
    }
    case 'cruzamento_evidencias': {
      const res = z.array(EvidenciaCruzamentoSchema).min(1).safeParse(data);
      return res.success ? { success: true } : { success: false, error: res.error.issues[0]?.message };
    }
    case 'base_legal_aplicada': {
      const res = z.array(BaseLegalRefSchema).min(1).safeParse(data);
      return res.success ? { success: true } : { success: false, error: res.error.issues[0]?.message };
    }
    case 'memoria_calculo': {
      const res = z.array(MemoriaCalculoCompetenciaSchema).min(1).safeParse(data);
      return res.success ? { success: true } : { success: false, error: res.error.issues[0]?.message };
    }
    case 'parecer_tecnico': {
      const res = ParecerTecnicoSchema.safeParse(data);
      return res.success ? { success: true } : { success: false, error: res.error.issues[0]?.message };
    }
    case 'proximos_passos': {
      const res = ProximosPassosSchema.safeParse(data);
      return res.success ? { success: true } : { success: false, error: res.error.issues[0]?.message };
    }
    default:
      return { success: true };
  }
}
