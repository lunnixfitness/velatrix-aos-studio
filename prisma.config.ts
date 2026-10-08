import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
    // Necessário para `prisma migrate diff --from-migrations` (scripts/db/gerar-migration.sh):
    // Postgres descartável onde o Prisma reaplica o histórico para calcular o diff.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
