import { secureId } from '../../lib/demoMode';
// Logger estruturado compatível com o formato Pino e propagação de correlationId

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const LEVEL_NUMBERS: Record<LogLevel, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50
};

export interface StructuredLog {
  level: number;
  time: number;
  pid?: number;
  hostname?: string;
  correlationId: string;
  engine: string;
  msg: string;
  context?: Record<string, any>;
  err?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export class PrecatorioLogger {
  private engine: string;
  private correlationId: string;

  constructor(engine: string, correlationId?: string) {
    this.engine = engine;
    this.correlationId = correlationId || `prec-${Date.now().toString(36)}-${secureId('', 4)}`;
  }

  public getCorrelationId(): string {
    return this.correlationId;
  }

  public child(subScope: string): PrecatorioLogger {
    return new PrecatorioLogger(`${this.engine}:${subScope}`, this.correlationId);
  }

  private log(level: LogLevel, msg: string, context?: Record<string, any>, error?: Error): void {
    const entry: StructuredLog = {
      level: LEVEL_NUMBERS[level],
      time: Date.now(),
      correlationId: this.correlationId,
      engine: this.engine,
      msg,
      context,
      err: error ? { message: error.message, stack: error.stack } : undefined
    };

    const serialized = JSON.stringify(entry);
    if (level === 'error') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  public info(msg: string, context?: Record<string, any>): void {
    this.log('info', msg, context);
  }

  public warn(msg: string, context?: Record<string, any>): void {
    this.log('warn', msg, context);
  }

  public error(msg: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', msg, context, error);
  }

  public debug(msg: string, context?: Record<string, any>): void {
    this.log('debug', msg, context);
  }
}
