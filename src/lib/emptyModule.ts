// Browser-safe stub for Node-only modules (pg, @prisma/adapter-pg)
export class Pool {
  on() { return this; }
  connect() { return Promise.resolve(); }
  query() { return Promise.resolve({ rows: [] }); }
  end() { return Promise.resolve(); }
}

export class PrismaPg {
  constructor(_pool?: any) {}
}

export class PrismaClient {
  $connect = async () => {};
  $disconnect = async () => {};
  $transaction = async (cb: any) => (typeof cb === 'function' ? cb(this) : cb);
  $on = () => {};
}

export default {
  Pool,
  PrismaPg,
  PrismaClient
};
