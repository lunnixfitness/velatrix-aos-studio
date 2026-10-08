#!/usr/bin/env bash
# P-BE2 · Gera a migration do schema atual (modelos Lead/Caso/Consentimento/... + LedgerEntry etc.)
# a partir do histórico em prisma/migrations e anexa o trigger append-only do LedgerEntry.
# Uso: npm run db:migration -- p_be2_persistencia_real
# Requer: dependências instaladas (npx prisma) e SHADOW_DATABASE_URL apontando para um Postgres
# descartável (ex.: docker run --rm -p 55432:5432 -e POSTGRES_PASSWORD=x postgres:16).
set -euo pipefail
cd "$(dirname "$0")/../.."

NOME="${1:-p_be2_persistencia_real}"
: "${SHADOW_DATABASE_URL:?defina SHADOW_DATABASE_URL (Postgres descartável)}"
DIR="prisma/migrations/$(date -u +%Y%m%d%H%M%S)_${NOME}"

mkdir -p "$DIR"
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema prisma/schema.prisma \
  --script > "$DIR/migration.sql"

if ! grep -q '"LedgerEntry"' "$DIR/migration.sql" && ! grep -rqs 'velatrix_ledger_valida_encadeamento' prisma/migrations/*/migration.sql; then
  echo "⚠️  LedgerEntry não aparece na migration gerada nem nas anteriores — verifique o schema." >&2
fi

if ! grep -rqs 'velatrix_ledger_valida_encadeamento' prisma/migrations/*/migration.sql; then
  printf '\n' >> "$DIR/migration.sql"
  cat prisma/sql/ledger_append_only.sql >> "$DIR/migration.sql"
fi

if [ ! -s "$DIR/migration.sql" ]; then
  echo "Schema já sincronizado com as migrations — nada a gerar." >&2
  rm -rf "$DIR"; exit 0
fi
echo "✔ Migration gerada em $DIR"
echo "  Aplicar: DATABASE_URL=... npx prisma migrate deploy"
