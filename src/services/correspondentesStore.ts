/**
 * VELATRIX AOS · Store de acordos de Correspondentes & Parcerias (P23).
 * localStorage por enquanto (Firebase adiado), contrato subscribe/getSnapshot.
 */
import {
  ativarAcordo,
  encerrarAcordo,
  payloadSelo,
  validarAcordo,
  AcordoInvalido,
  type AcordoParceria,
  type CienciaCliente,
  type ClasseProfissional,
  type Participante,
} from '../enterprise/correspondentes';
import { hashCanonical } from '../enterprise/canonicalJson';
import { DEMO_LAW_FIRM_TENANT_ID } from '../data/demoLawFirm';

const CHAVE = 'velatrix.correspondentes.v1';
const ouvintes = new Set<() => void>();

function carregar(): AcordoParceria[] {
  try {
    const raw = localStorage.getItem(CHAVE);
    const v = raw ? JSON.parse(raw) : null;
    if (Array.isArray(v)) return v as AcordoParceria[];
  } catch { /* memória */ }
  return seedDemo();
}

let acordos: AcordoParceria[] = carregar();

function gravar(novos: AcordoParceria[]) {
  acordos = novos;
  try { localStorage.setItem(CHAVE, JSON.stringify(acordos)); } catch { /* memória */ }
  ouvintes.forEach((f) => f());
}

export const subscribe = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };
export const getSnapshot = () => acordos;

const novoId = () => `ACP-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

export function criarRascunho(
  tenantId: string,
  dados: { titulo: string; classe: ClasseProfissional; participantes: Participante[] },
  por: string,
): AcordoParceria {
  const erros = validarAcordo(dados);
  if (erros.length) throw new AcordoInvalido(erros);
  const a: AcordoParceria = {
    id: novoId(),
    tenantId,
    titulo: dados.titulo.trim(),
    classe: dados.classe,
    participantes: dados.participantes.map((p) => ({ ...p, registro: p.registro.trim().toUpperCase() })),
    ciencia: null,
    status: 'rascunho',
    criadoEm: new Date().toISOString(),
    criadoPor: por,
    selo: null,
  };
  gravar([a, ...acordos]);
  return a;
}

export async function ativar(id: string, ciencia: CienciaCliente): Promise<AcordoParceria> {
  const a = acordos.find((x) => x.id === id);
  if (!a) throw new AcordoInvalido(['Acordo não encontrado.']);
  const selo = await hashCanonical(payloadSelo({ ...a, ciencia }));
  const vigente = ativarAcordo(a, ciencia, selo);
  gravar(acordos.map((x) => (x.id === id ? vigente : x)));
  return vigente;
}

export function encerrar(id: string) {
  const a = acordos.find((x) => x.id === id);
  if (!a) return;
  gravar(acordos.map((x) => (x.id === id ? encerrarAcordo(a) : x)));
}

export function excluirRascunho(id: string) {
  gravar(acordos.filter((x) => !(x.id === id && x.status === 'rascunho')));
}

/** Recalcula o selo e compara com o gravado (detecta adulteração no storage). */
export async function verificarSelo(a: AcordoParceria): Promise<boolean> {
  if (!a.selo) return false;
  return (await hashCanonical(payloadSelo(a))) === a.selo;
}

function seedDemo(): AcordoParceria[] {
  const t = DEMO_LAW_FIRM_TENANT_ID;
  const helena: Participante = { id: 'mv_socio_helena', nome: 'Dra. Helena Monteiro', registro: 'OAB/SP 118.204', classe: 'OAB', papel: 'titular', percentual: 70, interno: true };
  const seeds: AcordoParceria[] = [
    {
      id: 'ACP-DEMO-001', tenantId: t, titulo: 'Correspondência · TRF1 / Brasília (Alpha Construções)', classe: 'OAB',
      participantes: [helena, { id: 'ext_paulo_andrade', nome: 'Dr. Paulo Andrade', registro: 'OAB/DF 52.310', classe: 'OAB', papel: 'correspondente', percentual: 30, interno: false }],
      ciencia: null, status: 'rascunho', criadoEm: '2026-09-22T14:00:00.000Z', criadoPor: 'Dra. Helena Monteiro', selo: null,
    },
    {
      id: 'ACP-DEMO-002', tenantId: t, titulo: 'Coautoria · Arbitragem societária (Nexa Telecom)', classe: 'OAB',
      participantes: [
        { ...helena, id: 'mv_socio_ricardo', nome: 'Dr. Ricardo Vasconcelos', registro: 'OAB/SP 132.977', percentual: 60 },
        { id: 'ext_lucia_ferraz', nome: 'Dra. Lúcia Ferraz', registro: 'OAB/RJ 98.441', classe: 'OAB', papel: 'coautor', percentual: 40, interno: false },
      ],
      ciencia: null, status: 'rascunho', criadoEm: '2026-09-15T10:30:00.000Z', criadoPor: 'Dr. Ricardo Vasconcelos', selo: null,
    },
  ];
  // Ativa o segundo exemplo de forma assíncrona (selo real), sem bloquear o carregamento.
  queueMicrotask(() => {
    ativar('ACP-DEMO-002', { cliente: 'Nexa Telecomunicações S.A.', documento: '90.712.045/0001-60', meio: 'aditivo', em: '2026-09-16T09:00:00.000Z' })
      .catch(() => { /* seed opcional */ });
  });
  return seeds;
}
