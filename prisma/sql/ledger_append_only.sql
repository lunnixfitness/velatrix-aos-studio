-- P-BE2 · LedgerEntry append-only (anexado pelo scripts/db/gerar-migration.sh ao final da migration gerada)
-- Regras:
--   1. UPDATE e DELETE são sempre rejeitados (inclusive via ON DELETE CASCADE de Tenant:
--      um tenant com ledger não pode ser apagado fisicamente — use status SUSPENDED).
--   2. INSERT exige seq contíguo por tenant (seq = max+1, começando em 1) e
--      prevHash = hash do seq-1 do mesmo tenant (genesis = 64 zeros, igual a GENESIS_HEX).
--   3. pg_advisory_xact_lock por tenant serializa inserções concorrentes do mesmo tenant
--      (o @@unique([tenantId, seq]) continua sendo a última linha de defesa).

CREATE OR REPLACE FUNCTION velatrix_ledger_bloqueia_mutacao() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_LEVEL = 'ROW' THEN
    RAISE EXCEPTION 'LedgerEntry é append-only: % proibido (id=%)', TG_OP, OLD."id"
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RAISE EXCEPTION 'LedgerEntry é append-only: % proibido', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE OR REPLACE FUNCTION velatrix_ledger_valida_encadeamento() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  ultimo_seq  integer;
  ultimo_hash text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('ledger:' || NEW."tenantId", 0));

  SELECT "seq", "hash" INTO ultimo_seq, ultimo_hash
    FROM "LedgerEntry"
   WHERE "tenantId" = NEW."tenantId"
   ORDER BY "seq" DESC
   LIMIT 1;

  IF ultimo_seq IS NULL THEN
    IF NEW."seq" <> 1 OR NEW."prevHash" <> repeat('0', 64) THEN
      RAISE EXCEPTION 'LedgerEntry: primeira entrada do tenant % deve ter seq=1 e prevHash genesis', NEW."tenantId"
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW."seq" <> ultimo_seq + 1 OR NEW."prevHash" <> ultimo_hash THEN
    RAISE EXCEPTION 'LedgerEntry: encadeamento inválido para tenant % (esperado seq=% prevHash=%)',
      NEW."tenantId", ultimo_seq + 1, ultimo_hash
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "LedgerEntry_append_only_mutacao" ON "LedgerEntry";
CREATE TRIGGER "LedgerEntry_append_only_mutacao"
  BEFORE UPDATE OR DELETE ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION velatrix_ledger_bloqueia_mutacao();

DROP TRIGGER IF EXISTS "LedgerEntry_append_only_encadeamento" ON "LedgerEntry";
CREATE TRIGGER "LedgerEntry_append_only_encadeamento"
  BEFORE INSERT ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION velatrix_ledger_valida_encadeamento();

-- TRUNCATE não dispara triggers de linha: bloqueia no nível de statement.
DROP TRIGGER IF EXISTS "LedgerEntry_append_only_truncate" ON "LedgerEntry";
CREATE TRIGGER "LedgerEntry_append_only_truncate"
  BEFORE TRUNCATE ON "LedgerEntry"
  FOR EACH STATEMENT EXECUTE FUNCTION velatrix_ledger_bloqueia_mutacao();
