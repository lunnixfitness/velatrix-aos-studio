import React from 'react';
import { ScoreJuridicoBadge } from '../components/precatorios/ScoreJuridicoBadge';
import { PropostaCessaoCard } from '../components/precatorios/PropostaCessaoCard';
import { CadeiaCessoesTimeline } from '../components/precatorios/CadeiaCessoesTimeline';
import { MonitoramentoDashboard } from '../components/precatorios/MonitoramentoDashboard';
import { CompensacaoSimulatorForm } from '../components/precatorios/CompensacaoSimulatorForm';
import { BifurcacaoKindSelector } from '../components/precatorios/BifurcacaoKindSelector';
import { PropostaCessaoTerm, CessaoLedgerNode } from '../types/precatorios';

// Storybook Component Stubs
export default {
  title: 'Precatorios & Liquidez Judicial v3.0',
  parameters: {
    layout: 'padded',
  },
};

export const ScoreJuridicoBadgeTripleA = () => (
  <div className="p-6 bg-slate-950 text-white space-y-4">
    <h3 className="text-sm font-mono text-slate-400">Score Jurídico Triple-A (95/100)</h3>
    <ScoreJuridicoBadge score={95} size="lg" />
  </div>
);

export const ScoreJuridicoBadgeBlocked = () => (
  <div className="p-6 bg-slate-950 text-white space-y-4">
    <h3 className="text-sm font-mono text-slate-400">Score Jurídico Bloqueado (Penhora SisbaJud)</h3>
    <ScoreJuridicoBadge
      score={0}
      bloqueadoAutomatico={true}
      motivoBloqueio="Consta 1 penhora ativa (SisbaJud) sobre o precatório no TRF3."
      showDetails={true}
      size="lg"
    />
  </div>
);

const MOCK_PROPOSTA: PropostaCessaoTerm = {
  propostaId: 'PROP-CES-TRF3-98214',
  precatorioId: 'PREC-ORIG-001',
  numeroOficio: 'OF-REQ-2026-TRF3-98214',
  credorNome: 'Maria A. S.***',
  credorCpfCnpj: '123.***.***-00',
  valorFaceAtualizado: 428750.00,
  desagioPercentual: 32.50,
  valorLiquidoCredor: 289406.25,
  expectativaMeses: 14,
  taxaDescontoAplicadaAa: 11.00,
  vplCalculado: 256800.00,
  validadeData: '2026-10-15',
  hashSha256Termo: '3a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
  assinaturaDigitalRequerida: 'ICP_BRASIL_A1'
};

export const PropostaCessaoCardDemo = () => (
  <div className="p-6 bg-slate-950 text-white max-w-3xl">
    <PropostaCessaoCard proposta={MOCK_PROPOSTA} onAceitarProposta={(id) => alert(`Aceite: ${id}`)} />
  </div>
);

const MOCK_CHAIN: CessaoLedgerNode[] = [
  {
    sequencia: 1,
    previousHash: 'GENESIS_PRECAT_001_ROOT',
    currentHash: '3a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
    cessaoId: 'CESS-ORIG-001',
    documentoPayload: { tipo: 'OFICIO_REQUISITORIO_ORIGINARIO', valor: 350000 },
    assinadoPor: 'TRF3 - Secretaria de Precatórios',
    timestamp: '2025-06-15T10:00:00.000Z'
  },
  {
    sequencia: 2,
    previousHash: '3a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
    currentHash: 'b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8',
    cessaoId: 'CESS-ORIG-001',
    documentoPayload: { tipo: 'ESCRITURA_PUBLICA_CESSAO', cartorio: '14º Tabelião de Notas' },
    assinadoPor: 'Cartório Notarial & Cedente (ICP-Brasil)',
    timestamp: '2025-08-20T14:30:00.000Z'
  }
];

export const CadeiaCessoesTimelineDemo = () => (
  <div className="p-6 bg-slate-950 text-white max-w-2xl">
    <CadeiaCessoesTimeline hashesEncadeados={MOCK_CHAIN} />
  </div>
);

export const MonitoramentoDashboardDemo = () => (
  <div className="p-6 bg-slate-950 text-white max-w-4xl">
    <MonitoramentoDashboard precatorioId="PREC-ORIG-001" tribunal="TRF3" numeroProcesso="5002145-12.2021.4.03.6100" />
  </div>
);

export const CompensacaoSimulatorFormDemo = () => (
  <div className="p-6 bg-slate-950 text-white max-w-3xl">
    <CompensacaoSimulatorForm valorPrecatorioPadrao={428750.00} />
  </div>
);

export const BifurcacaoKindSelectorDemo = () => {
  const [kind, setKind] = React.useState<any>('originacao_para_cessao');
  return (
    <div className="p-6 bg-slate-950 text-white max-w-5xl">
      <BifurcacaoKindSelector selectedKind={kind} onSelectKind={setKind} />
    </div>
  );
};
