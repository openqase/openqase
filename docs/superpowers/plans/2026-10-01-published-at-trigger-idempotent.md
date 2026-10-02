# Published-at Trigger Idempotency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a new migration that makes the `published_at` triggers safe to re-apply and makes them fire on INSERT as well as UPDATE, plus a regression test and a workflow rule so future trigger migrations are written idempotently.

**Architecture:** Migration `20260923161000` created 9 triggers but guarded only 2 with `DROP TRIGGER IF EXISTS`, and its function dereferences `OLD`, which does not exist in an INSERT trigger. Per `docs/database-workflow.md` a pushed migration is never edited, so a NEW migration redefines the function with a `TG_OP` branch and re-creates all 9 triggers as `DROP TRIGGER IF EXISTS … ; CREATE TRIGGER … BEFORE INSERT OR UPDATE`. The result is correct whether or not the earlier migration was applied. A source-level test asserts the new file guards every trigger and that every later migration follows the same rule. Nothing in this plan pushes to any database: the user applies migrations manually (standing rule).

**Tech Stack:** Supabase CLI 2.117.0 (`supabase migration new`), PostgreSQL plpgsql, Vitest.

**Spec:** `docs/superpowers/plans/2026-10-01-review-fixes-roadmap.md` row 6.

## Global Constraints

- Branch `fix/published-at-trigger-idempotent` from `main`.
- Create the migration file ONLY with `npx supabase migration new <name>`; never hand-write the timestamp. Never edit `20260923161000_published_at_triggers_all_types.sql` or any other existing migration.
- The migration is schema-only (no `UPDATE`/`INSERT` of rows), per the workflow doc.
- `npm test`, `npm run typecheck`, `npm run lint` green on every commit. The CI `db` job (fresh Postgres, `supabase db reset`, seed, typegen diff) is the apply-from-scratch proof; if Docker is available locally, `npx supabase db reset` is a bonus, not a gate.
- `src/types/supabase.ts` must not change (no new tables, columns or functions with a new signature) — if the typegen diff in CI fails, something went wrong.
- Commit messages: conventional, no attribution footer. Do not push or open the PR without the user's go-ahead. Do not run `supabase db push` against anything.

## Review Focus

1. Re-running the new migration must not fail with `trigger … already exists` — Task 1 test checks every `CREATE TRIGGER` in it is preceded by a matching `DROP TRIGGER IF EXISTS`.
2. Inserting a row with `published = true` and `published_at IS NULL` must get `published_at = NOW()`; inserting with a provided `published_at` must keep it — Task 1 function body, exercised by the integration smoke test if run (`npm run test:integration`), otherwise documented in the PR for the user's dev-apply check.
3. Updating a published row's unrelated column must not touch `published_at` — Task 1 function body (unchanged UPDATE branch).
4. The function must not raise on INSERT (`OLD` unassigned) — Task 1 `TG_OP` branch.
5. Every migration newer than the new file must keep the rule — Task 1 test's second block.

---

### Task 1: The migration and its guard test

**Files:**
- Create: `supabase/migrations/<timestamp>_published_at_triggers_insert_and_idempotent.sql` (via the CLI)
- Create: `src/__tests__/security/migrations-idempotent.test.ts`
- Modify: `docs/database-workflow.md` ("Rules for the SQL itself" list)

- [ ] **Step 1: Create the migration file with the CLI**

```bash
npx supabase migration new published_at_triggers_insert_and_idempotent
```

It prints the created path. Note the timestamp; the test below refers to the file by its suffix.

- [ ] **Step 2: Write the failing test**

```ts
// src/__tests__/security/migrations-idempotent.test.ts
/**
 * Trigger migrations must be re-runnable: every CREATE TRIGGER needs a matching
 * DROP TRIGGER IF EXISTS earlier in the same file (or CREATE OR REPLACE TRIGGER).
 * 20260923161000_published_at_triggers_all_types.sql guarded only 2 of 9 and is
 * superseded by *_published_at_triggers_insert_and_idempotent.sql, which must
 * guard all 9. The rule applies to every migration from that file onward.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { glob } from 'glob'

const SUPERSEDER_SUFFIX = '_published_at_triggers_insert_and_idempotent.sql'
const TRIGGERS_EXPECTED = [
  ['set_case_studies_published_at', 'case_studies'],
  ['set_algorithms_published_at', 'algorithms'],
  ['set_industries_published_at', 'industries'],
  ['set_personas_published_at', 'personas'],
  ['set_blog_posts_published_at', 'blog_posts'],
  ['set_quantum_hardware_published_at', 'quantum_hardware'],
  ['set_quantum_software_published_at', 'quantum_software'],
  ['set_quantum_companies_published_at', 'quantum_companies'],
  ['set_partner_companies_published_at', 'partner_companies'],
] as const

function createTriggers(sql: string): Array<{ name: string; table: string; index: number }> {
  const out: Array<{ name: string; table: string; index: number }> = []
  const re = /CREATE\s+TRIGGER\s+"?(\w+)"?\s+[\s\S]*?ON\s+"?(?:public"?\."?)?(\w+)"?/gi
  for (const m of sql.matchAll(re)) out.push({ name: m[1], table: m[2], index: m.index ?? 0 })
  return out
}

function hasDropBefore(sql: string, name: string, table: string, index: number): boolean {
  const re = new RegExp(`DROP\\s+TRIGGER\\s+IF\\s+EXISTS\\s+"?${name}"?\\s+ON\\s+"?(?:public"?\\."?)?${table}"?`, 'i')
  const m = sql.match(re)
  return !!m && (m.index ?? Infinity) < index
}

describe('published_at trigger migrations are idempotent', () => {
  const files = glob.sync('supabase/migrations/*.sql').sort()
  const superseder = files.find((f) => f.endsWith(SUPERSEDER_SUFFIX))

  it('the superseding migration exists', () => {
    expect(superseder, `no migration ending in ${SUPERSEDER_SUFFIX}`).toBeDefined()
  })

  it('re-creates all 9 triggers with DROP TRIGGER IF EXISTS before each CREATE, as BEFORE INSERT OR UPDATE', () => {
    const sql = readFileSync(superseder!, 'utf8')
    const created = createTriggers(sql)
    for (const [name, table] of TRIGGERS_EXPECTED) {
      const t = created.find((c) => c.name === name && c.table === table)
      expect(t, `${name} ON ${table} not created`).toBeDefined()
      expect(hasDropBefore(sql, name, table, t!.index), `${name}: no DROP TRIGGER IF EXISTS before CREATE`).toBe(true)
      const stmt = sql.slice(t!.index, sql.indexOf(';', t!.index))
      expect(stmt, `${name}: must fire BEFORE INSERT OR UPDATE`).toMatch(/BEFORE\s+INSERT\s+OR\s+UPDATE/i)
    }
  })

  it('every migration from the superseder onward guards each CREATE TRIGGER', () => {
    const start = files.indexOf(superseder!)
    for (const file of files.slice(start)) {
      const sql = readFileSync(file, 'utf8')
      for (const t of createTriggers(sql)) {
        const orReplace = /CREATE\s+OR\s+REPLACE\s+TRIGGER/i.test(sql.slice(Math.max(0, t.index - 20), t.index + 30))
        expect(orReplace || hasDropBefore(sql, t.name, t.table, t.index), `${file}: ${t.name} is not re-runnable`).toBe(true)
      }
    }
  })
})
```

(`glob` is already a dependency used by `findings.test.ts`; copy its import style exactly.)

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/__tests__/security/migrations-idempotent.test.ts`
Expected: the second test FAILS (file is empty, no triggers created).

- [ ] **Step 4: Write the migration**

Contents of the new file:

```sql
-- =============================================================================
-- published_at triggers: fire on INSERT too, and be safe to re-apply
-- =============================================================================
--
-- Supersedes 20260923161000_published_at_triggers_all_types.sql, which
--   (a) guarded only 2 of its 9 CREATE TRIGGER statements with DROP IF EXISTS,
--       so re-applying it by hand fails with "trigger already exists"; and
--   (b) attached the triggers BEFORE UPDATE only, so a row inserted already
--       published (imports, SQL console) never received a published_at, and
--       the function body would raise on INSERT because OLD is unassigned.
--
-- Safe whether or not 20260923161000 was applied: the function is replaced
-- and every trigger is dropped-if-exists then created.
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."set_published_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- New row created already published: stamp it unless a date was supplied.
        IF NEW.published IS TRUE AND NEW.published_at IS NULL THEN
            NEW.published_at = NOW();
        END IF;
    ELSIF NEW.published IS TRUE AND OLD.published IS DISTINCT FROM TRUE THEN
        -- First publish (or re-publish): keep the original date if there is one.
        NEW.published_at = COALESCE(OLD.published_at, NEW.published_at, NOW());
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_published_at_column"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."set_published_at_column"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."set_published_at_column"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."set_published_at_column"() FROM "authenticated";
GRANT ALL ON FUNCTION "public"."set_published_at_column"() TO "service_role";

DROP TRIGGER IF EXISTS "set_case_studies_published_at" ON "public"."case_studies";
CREATE TRIGGER "set_case_studies_published_at" BEFORE INSERT OR UPDATE ON "public"."case_studies" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_algorithms_published_at" ON "public"."algorithms";
CREATE TRIGGER "set_algorithms_published_at" BEFORE INSERT OR UPDATE ON "public"."algorithms" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_industries_published_at" ON "public"."industries";
CREATE TRIGGER "set_industries_published_at" BEFORE INSERT OR UPDATE ON "public"."industries" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_personas_published_at" ON "public"."personas";
CREATE TRIGGER "set_personas_published_at" BEFORE INSERT OR UPDATE ON "public"."personas" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_blog_posts_published_at" ON "public"."blog_posts";
CREATE TRIGGER "set_blog_posts_published_at" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_quantum_hardware_published_at" ON "public"."quantum_hardware";
CREATE TRIGGER "set_quantum_hardware_published_at" BEFORE INSERT OR UPDATE ON "public"."quantum_hardware" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_quantum_software_published_at" ON "public"."quantum_software";
CREATE TRIGGER "set_quantum_software_published_at" BEFORE INSERT OR UPDATE ON "public"."quantum_software" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_quantum_companies_published_at" ON "public"."quantum_companies";
CREATE TRIGGER "set_quantum_companies_published_at" BEFORE INSERT OR UPDATE ON "public"."quantum_companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_partner_companies_published_at" ON "public"."partner_companies";
CREATE TRIGGER "set_partner_companies_published_at" BEFORE INSERT OR UPDATE ON "public"."partner_companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();
```

- [ ] **Step 5: Add the workflow rule**

In `docs/database-workflow.md`, "Rules for the SQL itself", append a bullet:

```markdown
- **Triggers must be re-runnable.** Precede every `CREATE TRIGGER` with
  `DROP TRIGGER IF EXISTS <name> ON <table>;` (or use `CREATE OR REPLACE
  TRIGGER`). Trigger functions that run on INSERT must branch on `TG_OP`
  before touching `OLD`. `src/__tests__/security/migrations-idempotent.test.ts`
  enforces the first rule for every migration from October 2026 onward.
```

- [ ] **Step 6: Verify**

Run: `npx vitest run src/__tests__/security && npm run typecheck && npm run lint`
Expected: all pass. If Docker is available, also `npx supabase start && npx supabase db reset` → must apply the baseline, the three September migrations and this one without error; then `npx supabase stop`. Report whether this was run.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/*_published_at_triggers_insert_and_idempotent.sql src/__tests__/security/migrations-idempotent.test.ts docs/database-workflow.md
git commit -m "fix(db): re-runnable published_at triggers that fire on insert"
```

---

### Task 2: CHANGELOG and gates

- [ ] **Step 1: CHANGELOG** — under `### Fixed`:

```markdown
- **Publish date triggers (migration `*_published_at_triggers_insert_and_idempotent.sql`)**: the triggers now also fire on INSERT, so a row created already published gets a `published_at`, and the migration can be re-applied safely (every trigger is dropped-if-exists first). Supersedes the September trigger migration; apply to dev, then prod, after the three September migrations.
```

- [ ] **Step 2: Gates** — `npm test && npm run typecheck && npm run lint && npm run build`; all green.

- [ ] **Step 3: Commit, stop, report** — `git commit -m "docs: changelog for re-runnable publish-date triggers"`. Do not push. In the report, include the exact apply commands for the user (`npx supabase migration list --db-url "$DEV_DB_URL"` then `npx supabase db push --db-url "$DEV_DB_URL"`, then the same for prod), with the expected pending list.
