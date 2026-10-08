/**
 * VELATRIX AOS · P28 · Fracionador de anexos por tribunal (estágio Execução)
 *
 * PLANEJADOR puro: decide quais páginas de quais documentos vão em cada arquivo
 * de upload, respeitando o limite de MB do sistema/tribunal. A execução física
 * (cortar/juntar PDF) roda em worker_thread no P29, consumindo este plano —
 * nada de manipular PDF no event loop.
 *
 * Valores dos perfis são SEED marcado 'PREENCHER_E_VALIDAR': conferir com o
 * manual de cada tribunal antes de produção.
 */

export type SistemaProcessual = 'PJE' | 'EPROC' | 'PROJUDI';

export interface PerfilTribunal {
  sistema: SistemaProcessual;
  tribunal: string;          // ex.: 'TRF1', 'TRF3', '*'
  maxBytesPorArquivo: number;
  formatosAceitos: readonly string[];
  fonte: 'PREENCHER_E_VALIDAR' | 'VALIDADO';
}

const MB = 1024 * 1024;

export const PERFIS_TRIBUNAL: readonly PerfilTribunal[] = [
  { sistema: 'PJE', tribunal: '*', maxBytesPorArquivo: 5 * MB, formatosAceitos: ['application/pdf'], fonte: 'PREENCHER_E_VALIDAR' },
  { sistema: 'EPROC', tribunal: '*', maxBytesPorArquivo: 10 * MB, formatosAceitos: ['application/pdf'], fonte: 'PREENCHER_E_VALIDAR' },
  { sistema: 'PROJUDI', tribunal: '*', maxBytesPorArquivo: 5 * MB, formatosAceitos: ['application/pdf'], fonte: 'PREENCHER_E_VALIDAR' },
];

export function perfilPara(sistema: SistemaProcessual, tribunal: string, perfis = PERFIS_TRIBUNAL): PerfilTribunal {
  const p = perfis.find((x) => x.sistema === sistema && x.tribunal === tribunal)
    ?? perfis.find((x) => x.sistema === sistema && x.tribunal === '*');
  if (!p) throw new Error(`Sem perfil de upload para ${sistema}/${tribunal}`);
  return p;
}

/** Ordem de juntada exigida pela esteira. */
export const ORDEM_GRUPOS = ['PESSOAIS', 'CADUNICO', 'INSS_CNIS', 'LAUDOS', 'DESPESAS', 'OUTROS'] as const;
export type GrupoDoc = (typeof ORDEM_GRUPOS)[number];

export interface DocAnexo {
  id: string;
  grupo: GrupoDoc;
  nome: string;
  mime: string;
  bytes: number;
  paginas: number;
}

export interface FatiaDoc { docId: string; paginaInicial: number; paginaFinal: number; bytesEstimados: number; }

export interface ArquivoPlanejado {
  ordem: number;
  nome: string;           // 01_PESSOAIS.pdf, 03_LAUDOS_parte2.pdf ...
  grupo: GrupoDoc;
  fatias: FatiaDoc[];
  bytesEstimados: number;
}

export interface PlanoFracionamento {
  perfil: PerfilTribunal;
  arquivos: ArquivoPlanejado[];
  rejeitados: Array<{ docId: string; motivo: 'FORMATO_NAO_ACEITO' | 'PAGINA_ACIMA_DO_LIMITE' | 'DOC_VAZIO' }>;
}

/**
 * Margem de segurança: overhead de reescrita do PDF (xref, fontes repetidas).
 * Planeja com 90% do limite.
 */
const MARGEM = 0.9;

export function planejarFracionamento(docs: DocAnexo[], perfil: PerfilTribunal): PlanoFracionamento {
  const limite = Math.floor(perfil.maxBytesPorArquivo * MARGEM);
  const rejeitados: PlanoFracionamento['rejeitados'] = [];
  const arquivos: ArquivoPlanejado[] = [];

  for (const grupo of ORDEM_GRUPOS) {
    const doGrupo = docs.filter((d) => d.grupo === grupo);
    if (!doGrupo.length) continue;

    const partes: Array<{ fatias: FatiaDoc[]; bytes: number }> = [];
    let atual = { fatias: [] as FatiaDoc[], bytes: 0 };
    const fechar = () => { if (atual.fatias.length) partes.push(atual); atual = { fatias: [], bytes: 0 }; };

    for (const d of doGrupo) {
      if (!perfil.formatosAceitos.includes(d.mime)) { rejeitados.push({ docId: d.id, motivo: 'FORMATO_NAO_ACEITO' }); continue; }
      if (d.paginas <= 0 || d.bytes <= 0) { rejeitados.push({ docId: d.id, motivo: 'DOC_VAZIO' }); continue; }

      const bytesPorPagina = Math.ceil(d.bytes / d.paginas);
      if (bytesPorPagina > limite) { rejeitados.push({ docId: d.id, motivo: 'PAGINA_ACIMA_DO_LIMITE' }); continue; }

      if (d.bytes <= limite - atual.bytes) {
        atual.fatias.push({ docId: d.id, paginaInicial: 1, paginaFinal: d.paginas, bytesEstimados: d.bytes });
        atual.bytes += d.bytes;
        continue;
      }
      // Documento não cabe no arquivo corrente: corta por páginas.
      let pag = 1;
      while (pag <= d.paginas) {
        const cabem = Math.floor((limite - atual.bytes) / bytesPorPagina);
        if (cabem <= 0) { fechar(); continue; }
        const fim = Math.min(d.paginas, pag + cabem - 1);
        const b = (fim - pag + 1) * bytesPorPagina;
        atual.fatias.push({ docId: d.id, paginaInicial: pag, paginaFinal: fim, bytesEstimados: b });
        atual.bytes += b;
        pag = fim + 1;
        if (pag <= d.paginas) fechar();
      }
    }
    fechar();

    partes.forEach((p, i) => {
      const ordem = arquivos.length + 1;
      const sufixo = partes.length > 1 ? `_parte${i + 1}` : '';
      arquivos.push({
        ordem,
        nome: `${String(ordem).padStart(2, '0')}_${grupo}${sufixo}.pdf`,
        grupo,
        fatias: p.fatias,
        bytesEstimados: p.bytes,
      });
    });
  }

  return { perfil, arquivos, rejeitados };
}
