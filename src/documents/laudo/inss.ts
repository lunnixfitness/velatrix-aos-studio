/**
 * Emissão do laudo previdenciário (P28).
 * O cross-check CNIS × CTC precisa ter rodado sobre períodos extraídos dos documentos —
 * resultado sobre períodos simulados não sustenta laudo oficial. Função pura.
 */
import { validarCPF } from '../extracao/validadores.ts';
import {
  type BaseEmissao, type Conselho, type ResponsavelTecnico,
  pendenciasBase, pendenciasResponsavel, pendenciasTexto, lerDataIso,
} from './comum.ts';

export type StatusCrossCheck = 'nao_executado' | 'sem_divergencia' | 'divergencia' | 'dados_simulados';

export interface EstadoInss extends BaseEmissao {
  cpf: string;
  dataNascimento: string; // AAAA-MM-DD
  der: string; // Data de Entrada do Requerimento, AAAA-MM-DD
  cnisCustodiado: boolean;
  crossCheck: StatusCrossCheck;
  /** Conselhos que habilitam o benefício escolhido (BENEFICIO_CONSELHOS_MAP). */
  conselhosAceitos: readonly Conselho[];
  /** Data de hoje (AAAA-MM-DD), injetada para a função seguir pura. */
  hoje: string;
}

export interface ConteudoInss {
  responsavel: ResponsavelTecnico;
  analise: string;
  conclusao: string;
}

export function pendenciasLaudoInss(e: EstadoInss, c: ConteudoInss): string[] {
  const p = pendenciasBase(e);

  if (!validarCPF(e.cpf)) p.push('CPF do segurado ausente ou com dígito verificador inválido.');

  const nasc = lerDataIso(e.dataNascimento);
  const der = lerDataIso(e.der);
  const hoje = lerDataIso(e.hoje);
  if (!nasc) p.push('Informe a data de nascimento do segurado (AAAA-MM-DD).');
  if (!der) p.push('Informe a DER (AAAA-MM-DD).');
  if (nasc && hoje && nasc > hoje) p.push('Data de nascimento no futuro.');
  if (der && hoje && der > hoje) p.push('DER no futuro.');
  if (nasc && der && der <= nasc) p.push('DER anterior ao nascimento.');

  if (!e.cnisCustodiado) p.push('Anexe o extrato CNIS à cadeia de custódia.');

  if (e.crossCheck === 'nao_executado') p.push('Execute o cruzamento CNIS × CTC.');
  else if (e.crossCheck === 'divergencia') p.push('Cruzamento CNIS × CTC com divergência acima de 30 dias: saneie os vínculos antes de emitir.');
  else if (e.crossCheck === 'dados_simulados' && !e.modoDemonstracao) {
    p.push('Cruzamento CNIS × CTC rodou sobre períodos simulados: extraia os vínculos reais dos documentos.');
  }

  p.push(...pendenciasResponsavel(c.responsavel, e.conselhosAceitos));
  p.push(...pendenciasTexto('a análise dos vínculos e do tempo de contribuição', c.analise, 40));
  p.push(...pendenciasTexto('a conclusão do laudo', c.conclusao, 40));
  return p;
}
