/**
 * Validador Semântico de Ingestão de Anexos & Cadeia de Custódia Criptográfica
 * Módulo Compartilhado: Perícia Judicial & Extrajudicial Oficial e Auditoria Previdenciária INSS
 */
import { ArquivoCustodia, registrarCustodiaArquivo, formatShortSha256 } from '../upload/sha256Store';

export { registrarCustodiaArquivo, formatShortSha256 };
export type { ArquivoCustodia };

// Compatibilidade de interface com CustodiaItem
export type CustodiaItem = ArquivoCustodia;

export interface ValidacaoAnexoResultado {
  ok: boolean;
  motivo?: 'anexo_cadastral_em_slot_probatorio' | 'anexo_comercial_em_slot_probatorio' | 'anexo_invalido' | 'conteudo_vazio';
  detalhes?: string;
  naturezaDetectada?: 'probatorio' | 'cadastral' | 'comercial' | 'contratual' | 'fiscal' | 'desconhecido';
  score?: number;
}

// Dicionário ponderado de termos cadastrais e societários (não probatórios)
const CADASTRAL_PATTERNS: { regex: RegExp; peso: number }[] = [
  { regex: /cart[aã]o\s+cnpj/i, peso: 4 },
  { regex: /comprovante\s+de\s+inscri[cç][aã]o\s+e\s+de\s+situa[cç][aã]o\s+cadastral/i, peso: 5 },
  { regex: /situa[cç][aã]o\s+cadastral:\s*ativa/i, peso: 4 },
  { regex: /quadro\s+de\s+s[oó]cios\s+e\s+administradores/i, peso: 4 },
  { regex: /\bqsa\b/i, peso: 3 },
  { regex: /junta\s+comercial/i, peso: 3 },
  { regex: /contrato\s+social/i, peso: 3 },
  { regex: /estatuto\s+social/i, peso: 3 },
  { regex: /altera[cç][aã]o\s+contratual/i, peso: 3 },
  { regex: /certid[aã]o\s+negativa\s+de\s+d[eé]bitos/i, peso: 3 },
  { regex: /cnd\s+conjunta/i, peso: 3 }
];

// Termos comerciais e propostas que não comprovam atividade/fato
const COMERCIAL_PATTERNS: { regex: RegExp; peso: number }[] = [
  { regex: /proposta\s+comercial/i, peso: 5 },
  { regex: /or[cç]amento/i, peso: 4 },
  { regex: /tabela\s+de\s+pre[cç]os/i, peso: 4 },
  { regex: /pedido\s+de\s+venda/i, peso: 4 },
  { regex: /termo\s+de\s+ades[aã]o\s+comercial/i, peso: 4 }
];

// Termos legítimos de documentação probatória técnica e previdenciária
const PROBATORIO_PATTERNS: { regex: RegExp; peso: number }[] = [
  { regex: /livro\s+di[aá]rio/i, peso: 4 },
  { regex: /livro\s+raz[aã]o/i, peso: 4 },
  { regex: /balancete\s+de\s+verifica[cç][aã]o/i, peso: 4 },
  { regex: /demonstra[cç][aã]o\s+do\s+resultado/i, peso: 3 },
  { regex: /nota\s+fiscal\s+eletr[oô]nica/i, peso: 3 },
  { regex: /termo\s+de\s+vistoria/i, peso: 4 },
  { regex: /laudo\s+pericial/i, peso: 3 },
  { regex: /quesito/i, peso: 3 },
  { regex: /mem[oó]ria\s+de\s+c[aá]lculo/i, peso: 4 },
  { regex: /extrato\s+banc[aá]rio/i, peso: 3 },
  { regex: /medi[cç][aã]o\s+de\s+obra/i, peso: 4 },
  // Termos probatórios previdenciários
  { regex: /perfil\s+profissiogr[aá]fico\s+previdenci[aá]rio/i, peso: 5 },
  { regex: /\bppp\b/i, peso: 4 },
  { regex: /\bltcat\b/i, peso: 5 },
  { regex: /laudo\s+t[eé]cnico\s+das\s+condi[cç][oõ]es\s+ambientais/i, peso: 5 },
  { regex: /carteira\s+de\s+trabalho/i, peso: 4 },
  { regex: /\bctps\b/i, peso: 4 },
  { regex: /holerite|recibo\s+de\s+pagamento\s+de\s+sal[aá]rio/i, peso: 4 },
  { regex: /ficha\s+de\s+registro\s+de\s+empregado/i, peso: 4 },
  { regex: /extrato\s+previdenci[aá]rio\s+cnis/i, peso: 5 },
  { regex: /certid[aã]o\s+de\s+tempo\s+de\s+contribui[cç][aã]o/i, peso: 5 },
  { regex: /\bctc\b/i, peso: 4 }
];

export type SlotNatureza = 'probatorio' | 'probatorio_previdenciario' | 'cadastral' | 'comercial' | 'contratual' | 'peticao';

/**
 * Validação Semântica Heurística do primeiro 1KB do arquivo
 */
export function validarPrimeiroKbSemantico(
  primeiro1KbTexto: string,
  slotNatureza: SlotNatureza = 'probatorio',
  fileName: string = ''
): ValidacaoAnexoResultado {
  if (!primeiro1KbTexto || primeiro1KbTexto.trim().length === 0) {
    return {
      ok: false,
      motivo: 'conteudo_vazio',
      detalhes: 'O arquivo anexado está vazio ou ilegível.',
      naturezaDetectada: 'desconhecido'
    };
  }

  // Amostra dos primeiros 1024 caracteres
  const amostra = (primeiro1KbTexto + ' ' + fileName).slice(0, 1500);

  // Calcula peso de termos cadastrais
  let scoreCadastral = 0;
  for (const { regex, peso } of CADASTRAL_PATTERNS) {
    if (regex.test(amostra)) {
      scoreCadastral += peso;
    }
  }

  // Calcula peso de termos comerciais
  let scoreComercial = 0;
  for (const { regex, peso } of COMERCIAL_PATTERNS) {
    if (regex.test(amostra)) {
      scoreComercial += peso;
    }
  }

  // Calcula peso de termos probatórios
  let scoreProbatorio = 0;
  for (const { regex, peso } of PROBATORIO_PATTERNS) {
    if (regex.test(amostra)) {
      scoreProbatorio += peso;
    }
  }

  // FIX 6: Adicionar slot 'probatorio_previdenciario' com heurística que rejeita anexo
  // cuja natureza é 'cadastral' ou 'comercial'.
  if (slotNatureza === 'probatorio_previdenciario') {
    if (scoreCadastral >= 4 && scoreCadastral > scoreProbatorio) {
      return {
        ok: false,
        motivo: 'anexo_cadastral_em_slot_probatorio',
        detalhes: 'Anexo rejeitado no slot probatório previdenciário: documento de natureza cadastral (ex: Cartão CNPJ, Quadro Societário). Requer-se prova material de atividade/contribuição (ex: PPP, LTCAT, CTPS, Holerites).',
        naturezaDetectada: 'cadastral',
        score: scoreCadastral
      };
    }

    if (scoreComercial >= 4 && scoreComercial > scoreProbatorio) {
      return {
        ok: false,
        motivo: 'anexo_comercial_em_slot_probatorio',
        detalhes: 'Anexo rejeitado no slot probatório previdenciário: documento de natureza estritamente comercial/orçamentária. Não constitui prova material de exercício de atividade ou remuneração recolhida.',
        naturezaDetectada: 'comercial',
        score: scoreComercial
      };
    }
  }

  // Se o slot declarado for 'probatorio' genérico
  if (slotNatureza === 'probatorio') {
    if (scoreCadastral >= 4 && scoreCadastral > scoreProbatorio) {
      return {
        ok: false,
        motivo: 'anexo_cadastral_em_slot_probatorio',
        detalhes: 'Anexo rejeitado: o conteúdo analisado possui natureza estritamente cadastral/societária (ex: Cartão CNPJ, QSA, Contrato Social), divergindo da natureza probatória da lide (ex: Diário, Razão, Notas, Vistorias).',
        naturezaDetectada: 'cadastral',
        score: scoreCadastral
      };
    }
  }

  let naturezaFinal: 'probatorio' | 'cadastral' | 'comercial' = 'probatorio';
  if (scoreCadastral > scoreProbatorio && scoreCadastral > scoreComercial) {
    naturezaFinal = 'cadastral';
  } else if (scoreComercial > scoreProbatorio && scoreComercial > scoreCadastral) {
    naturezaFinal = 'comercial';
  }

  return {
    ok: true,
    naturezaDetectada: naturezaFinal,
    score: Math.max(scoreProbatorio, scoreCadastral, scoreComercial)
  };
}

/**
 * Validador assíncrono para objetos File reais ou Blobs
 */
export async function validarAnexoSemantico(
  file: File | Blob | string,
  slotNatureza: SlotNatureza = 'probatorio'
): Promise<ValidacaoAnexoResultado> {
  let texto1Kb = '';
  let fileName = '';

  if (typeof file === 'string') {
    texto1Kb = file.slice(0, 1024);
  } else if (file && typeof file === 'object') {
    if ('name' in file && typeof file.name === 'string') {
      fileName = file.name;
    }
    if ('slice' in file) {
      const slice = file.slice(0, 1024);
      try {
        texto1Kb = await slice.text();
      } catch {
        texto1Kb = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsText(slice);
        });
      }
    }
  }

  return validarPrimeiroKbSemantico(texto1Kb, slotNatureza, fileName);
}
