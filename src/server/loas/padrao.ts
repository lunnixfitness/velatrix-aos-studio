/**
 * VELATRIX AOS · P29 · Montagem padrão do serviço LOAS (produção/demo).
 * Mantido separado para que os testes injetem dependências sem tocar nisto.
 */
import type { Express } from 'express';
import { IS_DEMO_MODE } from '../../lib/demoMode.ts';
import { calcularLoas } from '../../loas/calcLoas.ts';
import { REGRAS_LOAS_V1 } from '../../loas/regrasLoas.ts';
import { gerarMinuta } from '../../loas/drafter.ts';
import { FilaJusta, comRetentativa } from '../autos/filaJusta.ts';
import { MemoriaLoasRepository } from './repositorio.ts';
import { GatewayProtocolo, DemoAdapter, MniAdapter, ErroTribunal } from './tribunal.ts';
import { HubSse } from './webhookSse.ts';
import { ServicoLoas } from './servicoLoas.ts';
import { registerLoasRoutes } from './routes.ts';
import { DemoSigner, CloudPscSigner } from '../../loas/assinatura.ts';

const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);

export function criarServicoLoasPadrao(): { servico: ServicoLoas; hub: HubSse } {
  const hub = new HubSse();
  // Fila dedicada ao protocolo (I/O): separada da fila de OCR/IA da Leitura de Autos.
  const fila = new FilaJusta({
    concorrenciaGlobal: num(process.env.LOAS_FILA_GLOBAL, 64),
    concorrenciaPorTenant: num(process.env.LOAS_FILA_TENANT, 16),
    concorrenciaPorUsuario: num(process.env.LOAS_FILA_USUARIO, 2),
    maxPendentesPorTenant: num(process.env.LOAS_FILA_PEND_TENANT, 5000),
    maxPendentesGlobal: num(process.env.LOAS_FILA_PEND_GLOBAL, 50000),
  });
  const gateway = new GatewayProtocolo(IS_DEMO_MODE ? new DemoAdapter() : new MniAdapter(), {
    rps: num(process.env.LOAS_TRIBUNAL_RPS, 5),
    rajada: num(process.env.LOAS_TRIBUNAL_RAJADA, 10),
    timeoutMs: 30_000,
  });
  const servico = new ServicoLoas({
    repo: new MemoriaLoasRepository(),
    fila,
    gateway,
    hub,
    calcular: (caso, competencia) => calcularLoas(caso, REGRAS_LOAS_V1, competencia),
    gerarMinuta,
    versaoRegras: REGRAS_LOAS_V1.versao,
    tesesAtivas: () => REGRAS_LOAS_V1.teses.filter((t) => t.ativa),
    // Produção: PSC de assinatura em nuvem (stub → 501 até contrato). Demo: assinatura sem valor jurídico.
    signer: IS_DEMO_MODE ? new DemoSigner(true) : new CloudPscSigner(),
    retentativa: (fn) => comRetentativa(fn, {
      tentativas: 4,
      baseMs: 500,
      ehTransitorio: (e) => e instanceof ErroTribunal ? e.transitorio && e.httpStatus !== 503 : false, // circuito aberto não re-tenta em loop
    }),
  });
  servico.iniciarDispatcher();
  return { servico, hub };
}

export function registerLoasRoutesPadrao(app: Express): ServicoLoas {
  const { servico, hub } = criarServicoLoasPadrao();
  registerLoasRoutes(app, servico, { hub });
  return servico;
}
