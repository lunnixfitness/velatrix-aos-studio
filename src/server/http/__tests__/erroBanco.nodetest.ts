import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isErroDeBanco, responderErroBanco, encaminharErrosAsync, BancoIndisponivelError } from '../erroBanco.ts';

test('isErroDeBanco reconhece códigos Prisma/infra e ignora erros de domínio', () => {
  assert.equal(isErroDeBanco({ code: 'P1001' }), true);
  assert.equal(isErroDeBanco({ name: 'PrismaClientInitializationError' }), true);
  assert.equal(isErroDeBanco({ code: 'ECONNREFUSED' }), true);
  assert.equal(isErroDeBanco(new BancoIndisponivelError('x')), true);
  assert.equal(isErroDeBanco({ code: 'P2002' }), false); // unique violation = erro de domínio (409), não 503
  assert.equal(isErroDeBanco(new Error('validação')), false);
  assert.equal(isErroDeBanco(null), false);
});

function resFake() {
  const r: any = { headersSent: false, headers: {} as Record<string, string>, code: 0, body: undefined };
  r.setHeader = (n: string, v: string) => { r.headers[n] = v; };
  r.status = (c: number) => { r.code = c; return { json: (b: unknown) => { r.body = b; r.headersSent = true; } }; };
  return r;
}

test('responderErroBanco → 503 BANCO_INDISPONIVEL com Retry-After', () => {
  const res = resFake();
  assert.equal(responderErroBanco(res, { code: 'P1001' }), true);
  assert.equal(res.code, 503);
  assert.deepEqual(res.body, { erro: 'BANCO_INDISPONIVEL' });
  assert.equal(res.headers['Retry-After'], '5');
  const res2 = resFake();
  assert.equal(responderErroBanco(res2, new Error('outro')), false);
  assert.equal(res2.code, 0);
});

test('encaminharErrosAsync repassa rejeição async para next e preserva app.get(setting)', async () => {
  const registrados: any[] = [];
  const app: any = {
    get: (...a: any[]) => { registrados.push(a); return a.length === 1 ? 'valor-setting' : app; },
    post: (...a: any[]) => { registrados.push(a); return app; },
    put() {}, patch() {}, delete() {}, all() {}, use: (...a: any[]) => { registrados.push(a); return app; },
  };
  encaminharErrosAsync(app);
  assert.equal(app.get('trust proxy'), 'valor-setting');

  const erro = new BancoIndisponivelError('rota');
  app.post('/x', async () => { throw erro; });
  const handler = registrados.at(-1)[1];
  const recebido = await new Promise((resolve) => handler({}, {}, resolve));
  assert.equal(recebido, erro);

  const subApp: any = Object.assign((_q: any, _r: any, _n: any) => {}, { handle() {}, stack: [] });
  app.use(subApp);
  assert.equal(registrados.at(-1)[0], subApp, 'sub-app não pode ser envolvido');

  const errorHandler = (_e: any, _q: any, _r: any, _n: any) => {};
  app.use(errorHandler);
  assert.equal(registrados.at(-1)[0], errorHandler, 'error handler (aridade 4) não pode ser envolvido');
});
