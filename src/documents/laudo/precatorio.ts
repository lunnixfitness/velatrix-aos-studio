/**
 * Emissão do laudo de Precatório (P28) — due diligence do crédito para cessão/compensação.
 * KYC e due diligence simulados (conectores não ligados) não sustentam laudo oficial. Função pura.
 */
import { validarCPF, validarCNPJ, lerProcessoCNJ } from '../extracao/validadores.ts';
import {
  type BaseEmissao, type Conselho, type ResponsavelTecnico,
  pendenciasBase, pendenciasResponsavel, pendenciasTexto, lerDataIso,
} from './comum.ts';

export const CONSELHOS_PRECATORIO: readonly Conselho[] = ['OAB', 'CRC'];

export type NaturezaPrecatorio = 'alimentar' | 'comum' | '';
export type StatusVerificacao = 'pendente' | 'concluida' | 'simulada' | 'reprovada';

export interface EstadoPrecatorio extends BaseEmissao {
  cnjOrigem: string;
  numeroPrecatorio: string;
  enteDevedor: string;
  natureza: NaturezaPrecatorio;
  /** Valor de face lido do ofício requisitório, em R$. */
  valorFace: number | null;
  credorDocumento: string; // CPF ou CNPJ
  dueDiligence: StatusVerificacao;
  kyc: StatusVerificacao;
  /** Trânsito em julgado da fase de conhecimento, AAAA-MM-DD (lido da certidão, nunca presumido). */
  dataTransitoJulgado: string;
  /** Data de hoje (AAAA-MM-DD), injetada para a função seguir pura. */
  hoje: string;
}

export interface ConteudoPrecatorio {
  responsavel: ResponsavelTecnico;
  parecer: string;
}

function pendenciaVerificacao(nome: string, s: StatusVerificacao, demo: boolean): string | null {
  if (s === 'pendente') return `Conclua ${nome}.`;
  if (s === 'reprovada') return `${nome[0].toUpperCase()}${nome.slice(1)} reprovada: o crédito não pode ser laudado.`;
  if (s === 'simulada' && !demo) return `${nome[0].toUpperCase()}${nome.slice(1)} foi simulada (conector não ligado): execute com o provedor real.`;
  return null;
}

export function pendenciasLaudoPrecatorio(e: EstadoPrecatorio, c: ConteudoPrecatorio): string[] {
  const p = pendenciasBase(e);

  if (!e.cnjOrigem.trim()) p.push('Informe o número CNJ do processo de origem.');
  else if (!lerProcessoCNJ(e.cnjOrigem).valido) p.push(`Número CNJ ${e.cnjOrigem.trim()} com dígito verificador inválido.`);
  if (!e.numeroPrecatorio.trim()) p.push('Informe o número do precatório / ofício requisitório.');
  if (!e.enteDevedor.trim()) p.push('Informe o ente devedor.');
  if (!e.natureza) p.push('Informe a natureza do crédito (alimentar ou comum).');
  if (e.valorFace === null || !Number.isFinite(e.valorFace) || e.valorFace <= 0) p.push('Informe o valor de face do ofício requisitório.');
  if (!validarCPF(e.credorDocumento) && !validarCNPJ(e.credorDocumento)) p.push('CPF/CNPJ do credor ausente ou inválido.');

  const transito = lerDataIso(e.dataTransitoJulgado);
  const hoje = lerDataIso(e.hoje);
  if (!transito) p.push('Informe a data do trânsito em julgado (AAAA-MM-DD), conforme a certidão.');
  else if (hoje && transito > hoje) p.push('Data do trânsito em julgado no futuro.');

  for (const x of [pendenciaVerificacao('a due diligence', e.dueDiligence, e.modoDemonstracao), pendenciaVerificacao('a verificação KYC do credor', e.kyc, e.modoDemonstracao)]) {
    if (x) p.push(x);
  }

  p.push(...pendenciasResponsavel(c.responsavel, CONSELHOS_PRECATORIO));
  p.push(...pendenciasTexto('o parecer sobre o crédito', c.parecer, 40));
  return p;
}
