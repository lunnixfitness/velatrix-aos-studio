import { PrecatorioLogger } from './precatorioLogger';

interface CircuitState {
  failures: number;
  lastFailureAt: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  nextAttemptAllowedAt: number;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export class ResilientTribunalClient {
  private circuitStates: Map<string, CircuitState> = new Map();
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTimeoutMs: number = 15000;
  private defaultTtlMs: number = 4 * 60 * 60 * 1000; // 4 horas conforme especificação
  private maxFailuresBeforeOpen: number = 5;
  private failureWindowMs: number = 60000; // 60 segundos
  private cooldownMs: number = 30000; // 30s para half-open

  private getCircuit(tribunalKey: string): CircuitState {
    let circuit = this.circuitStates.get(tribunalKey);
    if (!circuit) {
      circuit = {
        failures: 0,
        lastFailureAt: 0,
        state: 'CLOSED',
        nextAttemptAllowedAt: 0
      };
      this.circuitStates.set(tribunalKey, circuit);
    }
    return circuit;
  }

  public getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.cachedAt > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  public setCache<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      cachedAt: Date.now(),
      ttlMs: ttlMs || this.defaultTtlMs
    });
  }

  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  public async executeWithResilience<T>(
    tribunalKey: string,
    operationName: string,
    action: (signal: AbortSignal) => Promise<T>,
    logger: PrecatorioLogger,
    customTimeoutMs?: number
  ): Promise<{ data: T | null; isCircuitOpen: boolean; isFallback: boolean }> {
    const circuit = this.getCircuit(tribunalKey);
    const now = Date.now();

    // Checar estado do circuit breaker
    if (circuit.state === 'OPEN') {
      if (now >= circuit.nextAttemptAllowedAt) {
        circuit.state = 'HALF_OPEN';
        logger.info(`Circuit Breaker para ${tribunalKey} migrando para HALF_OPEN`, { tribunalKey });
      } else {
        logger.warn(`Circuit Breaker ABERTO para ${tribunalKey}. Rejeição imediata.`, { tribunalKey });
        return { data: null, isCircuitOpen: true, isFallback: true };
      }
    }

    const timeout = customTimeoutMs || this.defaultTimeoutMs;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      try {
        logger.debug(`Executando ${operationName} em ${tribunalKey} (Tentativa ${attempt}/${maxRetries})`);
        const result = await action(controller.signal);
        clearTimeout(timer);

        // Sucesso — resetar circuit breaker
        circuit.failures = 0;
        circuit.state = 'CLOSED';
        return { data: result, isCircuitOpen: false, isFallback: false };
      } catch (err: any) {
        clearTimeout(timer);
        const isAbort = err.name === 'AbortError' || controller.signal.aborted;
        logger.warn(`Falha na tentativa ${attempt} para ${tribunalKey}: ${isAbort ? 'Timeout' : err.message}`);

        if (attempt === maxRetries) {
          // Registrar falha no circuito
          const nowFail = Date.now();
          if (nowFail - circuit.lastFailureAt <= this.failureWindowMs) {
            circuit.failures += 1;
          } else {
            circuit.failures = 1;
          }
          circuit.lastFailureAt = nowFail;

          if (circuit.failures >= this.maxFailuresBeforeOpen || circuit.state === 'HALF_OPEN') {
            circuit.state = 'OPEN';
            circuit.nextAttemptAllowedAt = nowFail + this.cooldownMs;
            logger.error(`Circuit Breaker para ${tribunalKey} foi ABERTO após ${circuit.failures} falhas.`);
          }

          return { data: null, isCircuitOpen: circuit.state === 'OPEN', isFallback: true };
        }

        // Exponential backoff: 300ms, 600ms, etc.
        const delay = Math.pow(2, attempt) * 150;
        await new Promise(r => setTimeout(r, delay));
      }
    }

    return { data: null, isCircuitOpen: (circuit.state as string) === 'OPEN', isFallback: true };
  }
}

export const tribunalResilientClient = new ResilientTribunalClient();
