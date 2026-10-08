/**
 * VELATRIX AOS · Antecipação de Precatórios & RPVs — serviço (servidor)
 *
 * tenantId/userId SEMPRE da sessão. Regras do ciclo:
 *  - cadastro → triagem + ofertas automáticas (ANALISADO ou BLOQUEADO);
 *  - advogado escolhe oferta válida → hash da proposta;
 *  - aprovação interna por perfil aprovador, sobre o MESMO hash (4 olhos acima do limite);
 *  - aceite do cliente registrado sobre o MESMO hash (qualquer alteração invalida e volta para ANALISADO);
 *  - formalização com checklist (inclui comunicação da cessão — CF 100 §14);
 *  - pagamento confirmado pelo comprador (webhook HMAC) ou manualmente só em DEMO_MODE.
 */
import { randomUUID } from 'node:crypto';
import {
  analisarCredito, gerarOfertas, exigirTransicao, hashProposta, CHECKLIST_FORMALIZACAO, validarNumeroCnj,
} from '../../antecipacao/motor.ts';
import { REGRAS_ANTECIPACAO_V1 } from '../../antecipacao/regras.ts';
import type {
  AnaliseCredito, Comprador, CreditoJudicial, EventoCredito, ItemFormalizacao, ResultadoOfertas, StatusCredito,
} from '../../antecipacao/tipos.ts';
import { validarEntradaCredito, type EntradaCredito } from './validacao.ts';

export class ErroAntecipacao extends Error {
  readonly httpStatus: number;
  constructor(status: number, msg: string) { super(msg); this.httpStatus = status; this.name = 'ErroAntecipacao'; }
}

export interface CtxAntecipacao { tenantId: string; userId: string; papel?: string; }

export type CanalAceite = 'ASSINATURA_ELETRONICA' | 'PRESENCIAL' | 'EMAIL';

export interface RegistroCredito {
  credito: CreditoJudicial;
  analise: AnaliseCredito;
  ofertas: ResultadoOfertas;
  status: StatusCredito;
  ofertaEscolhidaId?: string;
  propostaHash?: string;
  escolhidaPor?: string;
  aprovadoPor?: string;
  aceite?: { em: string; canal: CanalAceite; registradoPor: string; hash: string };
  checklist: Partial<Record<ItemFormalizacao, { em: string; por: string; evidencia: string }>>;
  pagamento?: { em: string; comprovante: string; valorCentavos: number; origem: 'COMPRADOR' | 'DEMO' };
  eventos: EventoCredito[];
  criadoEm: string;
  atualizadoEm: string;
  demo?: boolean;
}

export interface PainelAntecipacao {
  porStatus: Record<StatusCredito, number>;
  totalCreditos: number;
  valorFaceCentavos: number;
  melhorOfertaTotalCentavos: number;
  pagoCentavos: number;
  aguardandoAcao: number;
}

const PAPEIS_APROVADORES = new Set(['tenant_admin', 'c_level_approver', 'super_admin']);
const STATUS: StatusCredito[] = ['ANALISADO', 'BLOQUEADO', 'OFERTA_ESCOLHIDA', 'APROVADO_INTERNO', 'ACEITO_CLIENTE', 'FORMALIZACAO', 'PAGO', 'CANCELADO'];

export interface OpcoesServico {
  compradores: () => Comprador[];
  /** Salário mínimo (centavos) da competência AAAA-MM; deve lançar se não houver. */
  salarioMinimo: (competencia: string) => number;
  agora?: () => Date;
  /** Exige aprovador ≠ quem escolheu a oferta quando o total passa do limite. */
  quatroOlhos?: boolean;
  limiteQuatroOlhosCentavos?: number;
  permitirPagamentoManual?: boolean;
  maxPorTenant?: number;
}

export class ServicoAntecipacao {
  private readonly porTenant = new Map<string, Map<string, RegistroCredito>>();
  private readonly o: Required<Omit<OpcoesServico, 'agora'>> & { agora: () => Date };

  constructor(o: OpcoesServico) {
    this.o = {
      agora: o.agora ?? (() => new Date()),
      quatroOlhos: o.quatroOlhos ?? true,
      limiteQuatroOlhosCentavos: o.limiteQuatroOlhosCentavos ?? 100_000_00,
      permitirPagamentoManual: o.permitirPagamentoManual ?? false,
      maxPorTenant: o.maxPorTenant ?? 50_000,
      compradores: o.compradores,
      salarioMinimo: o.salarioMinimo,
    };
  }

  private hoje(): string { return this.o.agora().toISOString().slice(0, 10); }
  private iso(): string { return this.o.agora().toISOString(); }
  private mapa(tenantId: string): Map<string, RegistroCredito> {
    let m = this.porTenant.get(tenantId);
    if (!m) { m = new Map(); this.porTenant.set(tenantId, m); }
    return m;
  }

  private registrar(r: RegistroCredito, por: string, tipo: string, detalhe?: string, hash?: string): void {
    r.eventos.push({ em: this.iso(), por, tipo, detalhe, hash });
    r.atualizadoEm = this.iso();
  }

  private analisar(credito: CreditoJudicial): { analise: AnaliseCredito; ofertas: ResultadoOfertas } {
    const competencia = credito.dataBase.slice(0, 7);
    let sm: number;
    try { sm = this.o.salarioMinimo(competencia); } catch { throw new ErroAntecipacao(422, `salário mínimo não cadastrado para ${competencia}: ajuste a data-base`); }
    const analise = analisarCredito({ credito, hoje: this.hoje(), salarioMinimoCentavos: sm, regras: REGRAS_ANTECIPACAO_V1 });
    const ofertas = gerarOfertas(credito, analise, this.o.compradores());
    return { analise, ofertas };
  }

  obter(c: CtxAntecipacao, id: string): RegistroCredito {
    const r = this.mapa(c.tenantId).get(id);
    if (!r) throw new ErroAntecipacao(404, 'crédito não encontrado');
    return r;
  }

  cadastrar(c: CtxAntecipacao, body: unknown, opts: { demo?: boolean } = {}): RegistroCredito {
    const e: EntradaCredito = validarEntradaCredito(body);
    const m = this.mapa(c.tenantId);
    if (m.size >= this.o.maxPorTenant) throw new ErroAntecipacao(429, 'limite de créditos por escritório atingido');
    const cnj = validarNumeroCnj(e.numeroProcesso);
    // Mesmo processo + credor + tipo já ativo no escritório: evita oferta duplicada ao mercado.
    for (const r of m.values()) {
      if (r.status !== 'CANCELADO' && r.status !== 'PAGO' && r.credito.tipo === e.tipo &&
        validarNumeroCnj(r.credito.numeroProcesso).normalizado === cnj.normalizado && r.credito.credor.documento === e.credor.documento) {
        throw new ErroAntecipacao(409, `crédito já cadastrado (${r.credito.id})`);
      }
    }
    const credito: CreditoJudicial = { ...e, numeroProcesso: cnj.normalizado, id: 'cj_' + randomUUID().replace(/-/g, '').slice(0, 16), tenantId: c.tenantId, advogadoId: c.userId };
    const { analise, ofertas } = this.analisar(credito);
    const r: RegistroCredito = {
      credito, analise, ofertas, status: analise.flag === 'RED' ? 'BLOQUEADO' : 'ANALISADO', checklist: {}, eventos: [],
      criadoEm: this.iso(), atualizadoEm: this.iso(), demo: opts.demo,
    };
    this.registrar(r, c.userId, 'CADASTRADO', `flag ${analise.flag} · ${ofertas.ofertas.length} oferta(s)`);
    m.set(credito.id, r);
    return r;
  }

  /** Corrige dados e refaz triagem/ofertas. Invalida escolha, aprovação e aceite. */
  reanalisar(c: CtxAntecipacao, id: string, body?: unknown): RegistroCredito {
    const r = this.obter(c, id);
    if (['ACEITO_CLIENTE', 'FORMALIZACAO', 'PAGO', 'CANCELADO'].includes(r.status)) throw new ErroAntecipacao(409, `não é possível reanalisar em ${r.status}`);
    if (body !== undefined) {
      const e = validarEntradaCredito({ ...r.credito, ...(body as object) });
      r.credito = { ...e, numeroProcesso: validarNumeroCnj(e.numeroProcesso).normalizado, id: r.credito.id, tenantId: r.credito.tenantId, advogadoId: r.credito.advogadoId };
    }
    const { analise, ofertas } = this.analisar(r.credito);
    const para: StatusCredito = analise.flag === 'RED' ? 'BLOQUEADO' : 'ANALISADO';
    Object.assign(r, { analise, ofertas, status: para, ofertaEscolhidaId: undefined, propostaHash: undefined, escolhidaPor: undefined, aprovadoPor: undefined });
    this.registrar(r, c.userId, 'REANALISADO', `flag ${analise.flag} · ${ofertas.ofertas.length} oferta(s)`);
    return r;
  }

  escolherOferta(c: CtxAntecipacao, id: string, ofertaId: unknown): RegistroCredito {
    const r = this.obter(c, id);
    exigirTransicao(r.status, 'OFERTA_ESCOLHIDA');
    const of = r.ofertas.ofertas.find((o) => o.id === ofertaId);
    if (!of) throw new ErroAntecipacao(404, 'oferta não encontrada para este crédito');
    if (of.validaAte < this.hoje()) throw new ErroAntecipacao(410, 'oferta expirada — reanalise para receber ofertas atualizadas');
    r.status = 'OFERTA_ESCOLHIDA';
    r.ofertaEscolhidaId = of.id;
    r.escolhidaPor = c.userId;
    r.propostaHash = hashProposta(r.credito, of, r.analise.versaoRegras);
    this.registrar(r, c.userId, 'OFERTA_ESCOLHIDA', `${of.compradorNome}`, r.propostaHash);
    return r;
  }

  aprovar(c: CtxAntecipacao, id: string, hashExibido: unknown): RegistroCredito {
    const r = this.obter(c, id);
    exigirTransicao(r.status, 'APROVADO_INTERNO');
    if (!PAPEIS_APROVADORES.has(c.papel ?? '')) throw new ErroAntecipacao(403, 'aprovação restrita a sócio/administrador do escritório');
    if (hashExibido !== r.propostaHash) throw new ErroAntecipacao(409, 'a proposta mudou desde que você abriu — recarregue e revise');
    const oferta = this.ofertaEscolhida(r);
    if (this.o.quatroOlhos && oferta.totalFaceCentavos > this.o.limiteQuatroOlhosCentavos && c.userId === r.escolhidaPor) {
      throw new ErroAntecipacao(403, 'quatro olhos: quem escolheu a oferta não pode aprovar sozinho acima do limite');
    }
    r.status = 'APROVADO_INTERNO';
    r.aprovadoPor = c.userId;
    this.registrar(r, c.userId, 'APROVADO_INTERNO', undefined, r.propostaHash);
    return r;
  }

  registrarAceite(c: CtxAntecipacao, id: string, body: unknown): RegistroCredito {
    const r = this.obter(c, id);
    exigirTransicao(r.status, 'ACEITO_CLIENTE');
    const b = (body ?? {}) as { canal?: unknown; hashApresentado?: unknown };
    if (b.canal !== 'ASSINATURA_ELETRONICA' && b.canal !== 'PRESENCIAL' && b.canal !== 'EMAIL') throw new ErroAntecipacao(400, 'canal: ASSINATURA_ELETRONICA | PRESENCIAL | EMAIL');
    if (b.hashApresentado !== r.propostaHash) throw new ErroAntecipacao(409, 'o cliente aceitou uma versão diferente da proposta aprovada');
    const oferta = this.ofertaEscolhida(r);
    if (oferta.validaAte < this.hoje()) throw new ErroAntecipacao(410, 'oferta expirou antes do aceite — reanalise');
    r.status = 'ACEITO_CLIENTE';
    r.aceite = { em: this.iso(), canal: b.canal, registradoPor: c.userId, hash: r.propostaHash! };
    this.registrar(r, c.userId, 'ACEITE_CLIENTE', b.canal, r.propostaHash);
    return r;
  }

  marcarChecklist(c: CtxAntecipacao, id: string, body: unknown): RegistroCredito {
    const r = this.obter(c, id);
    const b = (body ?? {}) as { item?: unknown; evidencia?: unknown };
    const def = CHECKLIST_FORMALIZACAO.find((x) => x.id === b.item);
    if (!def) throw new ErroAntecipacao(400, 'item de checklist inválido');
    if (typeof b.evidencia !== 'string' || b.evidencia.trim().length < 3 || b.evidencia.length > 300) throw new ErroAntecipacao(400, 'evidência obrigatória (3–300 caracteres): nº do protocolo, id do documento…');
    if (r.status === 'ACEITO_CLIENTE') { exigirTransicao(r.status, 'FORMALIZACAO'); r.status = 'FORMALIZACAO'; }
    if (r.status !== 'FORMALIZACAO') throw new ErroAntecipacao(409, `checklist só após o aceite do cliente (status atual ${r.status})`);
    r.checklist[def.id] = { em: this.iso(), por: c.userId, evidencia: b.evidencia.trim() };
    this.registrar(r, c.userId, 'CHECKLIST', `${def.id}: ${b.evidencia.trim()}`);
    return r;
  }

  confirmarPagamento(tenantId: string, id: string, body: unknown, origem: 'COMPRADOR' | 'DEMO', ator: string): RegistroCredito {
    if (origem === 'DEMO' && !this.o.permitirPagamentoManual) throw new ErroAntecipacao(403, 'pagamento é confirmado pelo comprador (webhook)');
    const r = this.obter({ tenantId, userId: ator }, id);
    const comp = (body as { comprovante?: unknown } | null)?.comprovante;
    if (r.status === 'PAGO' && r.pagamento?.comprovante === comp) return r; // reentrega do webhook: idempotente
    exigirTransicao(r.status, 'PAGO');
    const pendentes = CHECKLIST_FORMALIZACAO.filter((x) => !r.checklist[x.id]).map((x) => x.id);
    if (pendentes.length) throw new ErroAntecipacao(409, `formalização incompleta: ${pendentes.join(', ')}`);
    const b = (body ?? {}) as { comprovante?: unknown; valorCentavos?: unknown };
    const oferta = this.ofertaEscolhida(r);
    if (typeof b.comprovante !== 'string' || !/^[\w.:/-]{4,120}$/.test(b.comprovante)) throw new ErroAntecipacao(400, 'comprovante inválido');
    if (b.valorCentavos !== oferta.totalOfertaCentavos) throw new ErroAntecipacao(422, `valor pago diverge da oferta aceita (${oferta.totalOfertaCentavos} centavos)`);
    r.status = 'PAGO';
    r.pagamento = { em: this.iso(), comprovante: b.comprovante, valorCentavos: b.valorCentavos as number, origem };
    this.registrar(r, ator, 'PAGO', b.comprovante, r.propostaHash);
    return r;
  }

  cancelar(c: CtxAntecipacao, id: string, motivo: unknown): RegistroCredito {
    const r = this.obter(c, id);
    exigirTransicao(r.status, 'CANCELADO');
    if (typeof motivo !== 'string' || motivo.trim().length < 3) throw new ErroAntecipacao(400, 'motivo obrigatório');
    r.status = 'CANCELADO';
    this.registrar(r, c.userId, 'CANCELADO', motivo.trim().slice(0, 300));
    return r;
  }

  listar(c: CtxAntecipacao, f: { status?: string; limite?: number } = {}): RegistroCredito[] {
    const lim = Math.min(Math.max(1, f.limite ?? 200), 500);
    const st = STATUS.includes(f.status as StatusCredito) ? (f.status as StatusCredito) : undefined;
    return [...this.mapa(c.tenantId).values()]
      .filter((r) => !st || r.status === st)
      .sort((a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : -1))
      .slice(0, lim);
  }

  painel(c: CtxAntecipacao): PainelAntecipacao {
    const porStatus = Object.fromEntries(STATUS.map((s) => [s, 0])) as Record<StatusCredito, number>;
    let face = 0, melhor = 0, pago = 0;
    for (const r of this.mapa(c.tenantId).values()) {
      porStatus[r.status]++;
      if (r.status === 'CANCELADO') continue;
      face += r.credito.valorFaceCentavos;
      melhor += r.ofertas.ofertas[0]?.totalOfertaCentavos ?? 0;
      if (r.pagamento) pago += r.pagamento.valorCentavos;
    }
    const total = [...this.mapa(c.tenantId).values()].length;
    return {
      porStatus, totalCreditos: total, valorFaceCentavos: face, melhorOfertaTotalCentavos: melhor, pagoCentavos: pago,
      aguardandoAcao: porStatus.ANALISADO + porStatus.OFERTA_ESCOLHIDA + porStatus.APROVADO_INTERNO + porStatus.FORMALIZACAO,
    };
  }

  /** Localiza o crédito pela oferta (webhook do comprador não conhece o tenant). */
  localizarPorOferta(ofertaId: string, compradorId: string): { tenantId: string; id: string } | null {
    for (const [tenantId, m] of this.porTenant) {
      for (const r of m.values()) {
        if (r.ofertaEscolhidaId === ofertaId) {
          const o = r.ofertas.ofertas.find((x) => x.id === ofertaId);
          if (o && o.compradorId === compradorId) return { tenantId, id: r.credito.id };
        }
      }
    }
    return null;
  }

  private ofertaEscolhida(r: RegistroCredito) {
    const o = r.ofertas.ofertas.find((x) => x.id === r.ofertaEscolhidaId);
    if (!o) throw new ErroAntecipacao(409, 'nenhuma oferta escolhida');
    return o;
  }
}
