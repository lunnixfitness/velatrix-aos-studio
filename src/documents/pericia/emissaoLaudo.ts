/**
 * Regras de emissão do laudo pericial (P27).
 *
 * O laudo só sai quando a esteira terminou e o PERITO escreveu o conteúdo:
 * nada de quesitos, metodologia, conclusão ou depósito presumidos pelo sistema.
 * Função pura — testada em __tests__/emissaoLaudo.nodetest.ts.
 */
import { lerProcessoCNJ } from '../extracao/validadores.ts';

export type KindPericia = 'judicial' | 'arbitral' | 'contratual';
export type StatusImpugnacao = 'sem_impugnacao' | 'em_impugnacao' | 'homologado';

export interface Quesito {
  id: string;
  origem: string; // Juízo, Autor, Réu, Assistente…
  pergunta: string;
  resposta: string;
}

export interface ConteudoPerito {
  peritoNome: string;
  peritoRegistro: string; // ex.: CRC-SP 123456/O-7
  objeto: string;
  metodologia: string;
  quesitos: Quesito[];
  conclusao: string;
}

export interface EstadoEsteiraLaudo {
  kind: KindPericia;
  cnj: string;
  juizo: string;
  camara: string;
  procedimento: string;
  clausula: string;
  /** Estágios não terminais, não dispensados e ainda não concluídos (ex.: "#3 Vistoria"). */
  estagiosPendentes: string[];
  impugnacao: StatusImpugnacao;
  depositoRegistradoEm: string | null;
  arquivosCustodia: number;
}

export const CONTEUDO_VAZIO: ConteudoPerito = {
  peritoNome: '',
  peritoRegistro: '',
  objeto: '',
  metodologia: '',
  quesitos: [],
  conclusao: '',
};

const preenchido = (s: string, min = 1) => s.trim().length >= min;

export function pendenciasEmissaoLaudo(e: EstadoEsteiraLaudo, c: ConteudoPerito): string[] {
  const p: string[] = [];

  if (e.estagiosPendentes.length) {
    p.push(`Conclua os estágios da esteira: ${e.estagiosPendentes.join(', ')}.`);
  }

  if (e.kind === 'judicial') {
    if (!preenchido(e.cnj)) p.push('Informe o número CNJ do processo.');
    else if (!lerProcessoCNJ(e.cnj).valido) p.push(`Número CNJ ${e.cnj.trim()} com dígito verificador inválido.`);
    if (!preenchido(e.juizo)) p.push('Informe o juízo / vara.');
    if (e.impugnacao === 'em_impugnacao') p.push('Honorários sob impugnação (CPC art. 465 §3º): aguarde a decisão do juízo.');
    if (!e.depositoRegistradoEm) p.push('Registre o depósito prévio dos honorários na esteira.');
  } else if (e.kind === 'arbitral') {
    if (!preenchido(e.camara)) p.push('Informe a câmara arbitral.');
    if (!preenchido(e.procedimento)) p.push('Informe o número do procedimento arbitral.');
  } else if (!preenchido(e.clausula)) {
    p.push('Informe a cláusula contratual que prevê a perícia.');
  }

  if (e.arquivosCustodia < 1) p.push('Anexe ao menos um documento examinado (cadeia de custódia).');

  if (!preenchido(c.peritoNome, 5)) p.push('Informe o nome completo do perito responsável.');
  if (!preenchido(c.peritoRegistro, 4) || !/\d/.test(c.peritoRegistro)) p.push('Informe o registro profissional do perito (ex.: CRC-SP 123456/O-7).');
  if (!preenchido(c.objeto, 20)) p.push('Descreva o objeto da perícia (mín. 20 caracteres).');
  if (!preenchido(c.metodologia, 20)) p.push('Descreva a metodologia empregada (mín. 20 caracteres).');

  const validos = c.quesitos.filter((q) => preenchido(q.pergunta));
  if (!validos.length) p.push('Cadastre ao menos um quesito.');
  const semResposta = validos.filter((q) => !preenchido(q.resposta)).length;
  if (semResposta) p.push(`${semResposta} quesito(s) sem resposta.`);

  if (!preenchido(c.conclusao, 40)) p.push('Escreva a conclusão pericial (mín. 40 caracteres).');

  return p;
}

/** Texto do status de honorários — só afirma o que foi registrado na esteira. */
export function textoHonorarios(s: StatusImpugnacao): string {
  if (s === 'homologado') return 'Honorários homologados (registrado na esteira)';
  if (s === 'em_impugnacao') return 'Honorários sob impugnação';
  return 'Nenhuma impugnação registrada na esteira';
}
