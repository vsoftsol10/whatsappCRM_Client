// ============================================
// KNOWLEDGE BASE - SEARCH INDEX SETUP
// ============================================
// The AI search reads KbEntry."searchVector" (a PostgreSQL full-text vector
// with a GIN index, declared in schema.prisma so `prisma db push` creates
// the column and the index).
//
// This file installs the part Prisma cannot describe: a trigger that keeps
// the vector in sync whenever an entry is inserted or its title / keywords /
// content change, and fills the vector for rows that don't have one yet.
//
// It is idempotent (safe to run any number of times) and runs automatically
// when the server starts. Also available as:  npm run kb:setup-search

const prisma = require("../../config/prisma");

// Any number; makes two servers starting at the same moment take turns.
const ADVISORY_LOCK_KEY = 727001;

const STATEMENTS = [
  `CREATE OR REPLACE FUNCTION kb_entry_search_vector_update() RETURNS trigger AS $fn$
   BEGIN
     NEW."searchVector" :=
       setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
       setweight(to_tsvector('simple', coalesce(NEW.keywords, '')), 'A') ||
       setweight(to_tsvector('simple', coalesce(NEW.content, '')), 'C');
     RETURN NEW;
   END
   $fn$ LANGUAGE plpgsql`,

  `DROP TRIGGER IF EXISTS kb_entry_search_vector_trg ON "KbEntry"`,

  `CREATE TRIGGER kb_entry_search_vector_trg
   BEFORE INSERT OR UPDATE OF title, keywords, content ON "KbEntry"
   FOR EACH ROW EXECUTE FUNCTION kb_entry_search_vector_update()`,
];

// Rows created before the trigger existed (or while it was missing).
// Setting a column to itself still fires "UPDATE OF" triggers.
const BACKFILL = `UPDATE "KbEntry" SET title = title WHERE "searchVector" IS NULL`;

const ensureKbSearchSetup = async () => {
  await prisma.$transaction(
    async (tx) => {
      // executeRaw (not queryRaw): the lock function returns "void", which queryRaw cannot read
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_KEY})`);

      for (const statement of STATEMENTS) {
        await tx.$executeRawUnsafe(statement);
      }

      return tx.$executeRawUnsafe(BACKFILL);
    },
    { timeout: 120000, maxWait: 30000 }
  );
};

// True when the trigger exists (used by the tests).
const isKbSearchSetupInstalled = async () => {
  const rows = await prisma.$queryRaw`
    SELECT 1 AS ok FROM pg_trigger
    WHERE tgname = 'kb_entry_search_vector_trg' AND NOT tgisinternal
  `;

  return rows.length > 0;
};

module.exports = { ensureKbSearchSetup, isKbSearchSetupInstalled };
