/**
 * Precatório · motivos concretos das pendências de KYC e de documento do cedente.
 *
 * A pendência genérica ("Conclua a verificação KYC do credor") não diz o que fazer. Aqui cada
 * causa vira uma instrução acionável. Função pura (hoje injetado), sem I/O.
 */
import { validarCPF, validarCNPJ } from '../extracao/validadores.ts';

export const PENDENCIA_KYC_GENERICA = 'Conclua a verificação KYC do credor.';
export const PENDENCIA_DOC_GENERICA = 'CPF/CNPJ do credor ausente ou inválido.';
export const VALIDADE_COMPROVANTE_DIAS = 90;
export const VALOR_MINIMO_KYC = 50_000; // R$ — abaixo disso o KYC é dispensado pelo motor de compliance

export interface ResultadoKycResumo {
  aprovado: boolean;
  pepIdentificado: boolean;
  provaDeVidaStatus: 'VERIFICADO_SERPRO' | 'PENDENTE' | 'FALHA';
}

export interface EntradaMotivosKyc {
  kyc: ResultadoKycResumo | null;
  declaracaoAnexada: boolean;
  comprovanteAnexado: boolean;
  /** Data de emissão do comprovante (AAAA-MM-DD) como digitada; vazio se não informada. */
  comprovanteEmissao: string;
  hoje: string;
}

const dataBr = (iso: string) => iso.split('-').reverse().join('/');
const isoValida = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
const diasEntre = (de: string, ate: string) => Math.floor((Date.parse(ate + 'T00:00:00Z') - Date.parse(de + 'T00:00:00Z')) / 86_400_000);

/** Por que o KYC não está aprovado — na ordem em que o advogado deve resolver. */
export function motivosKycPendente(e: EntradaMotivosKyc): string[] {
  if (e.kyc?.aprovado) return [];
  const m: string[] = [];
  if (!e.declaracaoAnexada) m.push('KYC: anexe a declaração de origem lícita assinada pelo cedente.');
  if (!e.comprovanteAnexado) m.push('KYC: anexe o comprovante de endereço do cedente.');
  else if (!e.comprovanteEmissao) m.push('KYC: informe a data de emissão do comprovante de endereço.');
  else if (!isoValida(e.comprovanteEmissao)) m.push('KYC: data de emissão do comprovante de endereço inválida.');
  else {
    const dias = diasEntre(e.comprovanteEmissao, e.hoje);
    if (dias < 0) m.push(`KYC: a data de emissão do comprovante (${dataBr(e.comprovanteEmissao)}) está no futuro.`);
    else if (dias > VALIDADE_COMPROVANTE_DIAS) {
      m.push(`KYC: o comprovante de endereço foi emitido em ${dataBr(e.comprovanteEmissao)} (há ${dias} dias). O limite é ${VALIDADE_COMPROVANTE_DIAS} dias — anexe um comprovante mais recente.`);
    }
  }
  if (m.length || !e.kyc) return m;
  // Documentos em ordem e mesmo assim reprovado: o motivo vem do provedor.
  if (e.kyc.pepIdentificado) m.push('KYC: cedente identificado como pessoa politicamente exposta (PEP) — exige diligência reforçada e aprovação manual (Circular BCB 3.978/2020).');
  if (e.kyc.provaDeVidaStatus === 'FALHA') m.push('KYC: a prova de vida falhou no provedor — refaça a captura com o cedente.');
  if (e.kyc.provaDeVidaStatus === 'PENDENTE') m.push('KYC: prova de vida ainda pendente no provedor — aguarde ou reenvie o link ao cedente.');
  if (!m.length) m.push('KYC não aprovado pelo provedor (listas restritivas ou dados divergentes) — consulte o relatório de compliance.');
  return m;
}

/** Mensagem específica para o CPF/CNPJ completo do cedente; null se estiver ok. */
export function motivoDocumentoCedente(documento: string, mascaraCadastro: string): string | null {
  const d = documento.replace(/\D/g, '');
  if (!d) return `Informe o CPF/CNPJ completo do cedente (o cadastro mostra só a máscara ${mascaraCadastro}).`;
  if (d.length !== 11 && d.length !== 14) return `CPF/CNPJ do cedente com ${d.length} dígitos — CPF tem 11 e CNPJ tem 14.`;
  const ok = d.length === 11 ? validarCPF(d) : validarCNPJ(d);
  return ok ? null : `${d.length === 11 ? 'CPF' : 'CNPJ'} ${d} com dígito verificador inválido — confira no documento do cedente.`;
}

/** Troca as pendências genéricas pelas específicas, mantendo a posição na lista. */
export function detalharPendencias(pendencias: string[], kyc: string[], doc: string | null): string[] {
  const out: string[] = [];
  for (const p of pendencias) {
    if (p === PENDENCIA_KYC_GENERICA && kyc.length) out.push(...kyc);
    else if (p === PENDENCIA_DOC_GENERICA && doc) out.push(doc);
    else out.push(p);
  }
  if (kyc.length && !pendencias.includes(PENDENCIA_KYC_GENERICA)) {
    for (const k of kyc) if (!out.includes(k)) out.push(k);
  }
  return out;
}
