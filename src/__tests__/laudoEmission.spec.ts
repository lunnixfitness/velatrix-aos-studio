import { describe, it, expect } from 'vitest';
import { 
  containsObjectStringification, 
  CreditoTributarioApuradoSchema,
  EvidenciaCruzamentoSchema
} from '../types/reportDtos';
import { validateAndComputeReportHash, EmissionGuardError } from '../services/reportEmissionGuardService';
import { generateTaxRecoveryPayload } from '../services/registry/definitions/taxRecoveryService';

describe('Laudo de Auditoria — Testes de Emissão e Integridade Criptográfica (P0)', () => {

  describe('1. Detecção de Serialização Corrompida ([object Object])', () => {
    it('deve retornar falso para dados legítimos e limpos', () => {
      expect(containsObjectStringification('Texto limpo e regular')).toBe(false);
      expect(containsObjectStringification(12345.67)).toBe(false);
      expect(containsObjectStringification({ chave: 'valor', numero: 10 })).toBe(false);
      expect(containsObjectStringification([{ id: 1, label: 'SPED Fiscal' }])).toBe(false);
    });

    it('deve identificar e bloquear string literal contendo [object Object]', () => {
      expect(containsObjectStringification('[object Object]')).toBe(true);
      expect(containsObjectStringification('Erro ao processar: [object Object] na linha 42')).toBe(true);
    });

    it('deve identificar e bloquear [object Object] aninhado em estruturas profundas', () => {
      const payloadComObjetoCorrompido = {
        credito_apurado: [
          {
            competencia: '01/2024',
            tributo: 'PIS',
            valorPrincipal: 1000,
            selicAcumulada: 1.2,
            valorAtualizado: 1012,
            fonteSped: 'Registro C170: [object Object]'
          }
        ]
      };
      expect(containsObjectStringification(payloadComObjetoCorrompido)).toBe(true);
    });
  });

  describe('2. Validação Zod dos DTOs de Seção', () => {
    it('deve validar com sucesso um item de CreditoTributarioApurado nos formatos MM/AAAA e YYYY-MM', () => {
      const itemValidoMMAAAA = {
        competencia: '03/2024',
        tributo: 'COFINS',
        valorPrincipal: 85200.5,
        selicAcumulada: 8.45,
        valorAtualizado: 92400.0,
        fonteSped: 'SPED EFD C100/C170'
      };
      expect(CreditoTributarioApuradoSchema.safeParse(itemValidoMMAAAA).success).toBe(true);

      const itemValidoYYYYMM = {
        competencia: '2024-03',
        tributo: 'PIS',
        valorPrincipal: 25000.0,
        selicAcumulada: 5.2,
        valorAtualizado: 26300.0,
        fonteSped: 'SPED EFD Bloco C170'
      };
      expect(CreditoTributarioApuradoSchema.safeParse(itemValidoYYYYMM).success).toBe(true);
    });

    it('deve rejeitar competência em formato inválido no DTO', () => {
      const itemInvalido = {
        competencia: '2024/99', // Mês inexistente
        tributo: 'COFINS',
        valorPrincipal: 85200.5,
        selicAcumulada: 8.45,
        valorAtualizado: 92400.0,
        fonteSped: 'SPED EFD'
      };
      const result = CreditoTributarioApuradoSchema.safeParse(itemInvalido);
      expect(result.success).toBe(false);
    });

    it('deve validar e calcular cruzamento de evidências (SPED vs PGDAS)', () => {
      const evidenciaValida = {
        competencia: '05/2024',
        origem: 'SPED_EFD' as const,
        divergenciaTipo: 'Exclusão de ICMS da Base de Cálculo do PIS',
        valorSped: 150000.0,
        valorDeclarado: 120000.0,
        delta: 30000.0
      };
      const result = EvidenciaCruzamentoSchema.safeParse(evidenciaValida);
      expect(result.success).toBe(true);
    });
  });

  describe('3. Guard de Emissão Criptográfica e Cálculo do Hash SHA-256', () => {
    it('deve emitir com sucesso o payload canônico da Recuperação Tributária e gerar hash SHA-256 válido', () => {
      const sectionsPayload = generateTaxRecoveryPayload({ monthsCount: 60 });
      
      const auditHash = validateAndComputeReportHash({
        reportId: 'LDO-REC-2026-69189',
        tenantId: 'tenant-vanguarda-agro',
        tenantCnpj: '02.491.782/0001-44',
        serviceId: 'tax_recovery',
        signer: {
          name: 'Dr. Roberto Silveira',
          credentialNumber: 'CRC/SP 123456/O-0',
          role: 'Contador Responsável Técnico',
          signatureType: 'PENDENTE_ASSINATURA_ICP'
        },
        sectionsPayload
      } as any);

      expect(auditHash).toBeDefined();
      expect(auditHash.startsWith('0x')).toBe(true);
      expect(auditHash.length).toBe(66); // '0x' + 64 hex chars = 66
      expect(auditHash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('deve BLOQUEAR a emissão e assinatura se houver [object Object] no payload', () => {
      const sectionsPayload = generateTaxRecoveryPayload({ monthsCount: 60 });
      // Injeta corrupção na seção de parecer
      (sectionsPayload.parecer_tecnico as any).conclusao = 'Laudo homologado com [object Object]';

      expect(() => {
        validateAndComputeReportHash({
          reportId: 'LDO-REC-2026-69189',
          tenantId: 'tenant-vanguarda-agro',
          tenantCnpj: '02.491.782/0001-44',
          serviceId: 'tax_recovery',
          sectionsPayload
        } as any);
      }).toThrowError(EmissionGuardError);
    });

    it('deve BLOQUEAR a emissão se faltar uma seção obrigatória do schema', () => {
      const sectionsPayload = generateTaxRecoveryPayload({ monthsCount: 60 });
      // Remove a seção de memória de cálculo
      delete (sectionsPayload as any).memoria_calculo;

      expect(() => {
        validateAndComputeReportHash({
          reportId: 'LDO-REC-2026-69189',
          tenantId: 'tenant-vanguarda-agro',
          tenantCnpj: '02.491.782/0001-44',
          serviceId: 'tax_recovery',
          sectionsPayload
        } as any);
      }).toThrowError(EmissionGuardError);
    });
  });

  describe('4. Regra de Negócio: Memória de Cálculo Dinâmica (N de 60 competências)', () => {
    it('o gerador de payload deve popular a memória de cálculo de acordo com os meses disponíveis', () => {
      const payloadCompleto = generateTaxRecoveryPayload({ monthsCount: 60 });
      expect(payloadCompleto.memoria_calculo.length).toBe(60);

      const payloadParcial = generateTaxRecoveryPayload({ monthsCount: 24 });
      expect(payloadParcial.memoria_calculo.length).toBe(24);
      expect(payloadParcial.credito_apurado.length).toBe(24);
    });

    it('nenhuma seção deve conter mapeamento invertido (evidenciasCruzamento vs legalBasis)', () => {
      const payload = generateTaxRecoveryPayload({ monthsCount: 60 });
      
      // Evidências de cruzamento devem ter campos de divergência fiscal
      expect(payload.cruzamento_evidencias[0]).toHaveProperty('divergenciaTipo');
      expect(payload.cruzamento_evidencias[0]).toHaveProperty('delta');
      expect(payload.cruzamento_evidencias[0]).not.toHaveProperty('theses');

      // Base legal deve conter leis e artigos, e não divergências
      expect(payload.base_legal_aplicada[0]).toHaveProperty('law');
      expect(payload.base_legal_aplicada[0]).toHaveProperty('article');
      expect(payload.base_legal_aplicada[0]).not.toHaveProperty('divergenciaTipo');
    });
  });

});
