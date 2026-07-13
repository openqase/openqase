# A0 + A2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run a schema cross-check proving the CMS engine's type definitions match the live database (A0), then land the `feature/cms-engine` branch onto `develop` cleanly after A1 merges (A2).

**Architecture:** A0 writes a reusable TypeScript script that imports engine type definitions, parses `src/types/supabase.ts` with ts-morph, and compares them field-by-field. A2 rebases the engine branch onto post-A1 `develop`, migrates the operations layer from `supabase-untyped` to `internal-queries`, cleans up the deprecated barrel import, and verifies the three newly-migrated content types replaced their old implementations.

**Tech Stack:** TypeScript, ts-morph (type parsing), Vitest (tests), Supabase CLI (type regeneration), tsx (script runner), ESLint (module boundary enforcement post-A1)

---

> ⚠️ **SEQUENCING NOTE**
>
> **Tasks 1–7 (A0):** Run now on `develop`. Only requires a live Supabase connection and the `feature/cms-engine` worktree at `.worktrees/cms-engine/`.
>
> **Tasks 8–16 (A2):** Cannot start until `feature/a1-security-pr` has been merged to `develop`. A1 introduces `src/lib/internal-queries.ts` and the ESLint module boundary that A2 depends on. If A1 has not merged, stop after Task 7.
>
> **A0 freshness:** If more than ~2 weeks pass between completing Task 7 and starting Task 8, re-run `npx tsx scripts/schema-crosscheck.ts` before beginning A2 to confirm schema has not drifted.

---

## File Map

**Created by A0:**
- `scripts/schema-crosscheck/compare.ts` — pure comparison functions (testable)
- `scripts/schema-crosscheck/compare.test.ts` — tests for comparison functions
- `scripts/schema-crosscheck/parse-schema.ts` — ts-morph parser for `supabase.ts`
- `scripts/schema-crosscheck/parse-schema.test.ts` — tests for parser
- `scripts/schema-crosscheck/__fixtures__/test-database.types.ts` — minimal fixture for parser tests
- `scripts/schema-crosscheck/report.ts` — markdown report generator
- `scripts/schema-crosscheck.ts` — CLI entry point
- `docs/superpowers/research/2026-05-27-schema-crosscheck.md` — committed artifact (generated)

**Modified by A0:**
- `package.json` — add `ts-morph` dev dependency
- `vitest.config.ts` — add `scripts/**/*.test.ts` to include

**Modified/deleted by A2** (on `feature/cms-engine` after rebase):
- `src/cms/operations/fetch.ts` — `supabase-untyped` → `internal-queries`
- `src/cms/operations/create.ts` — `supabase-untyped` → `internal-queries`
- `src/cms/operations/update.ts` — `supabase-untyped` → `internal-queries`
- `src/cms/operations/delete.ts` — `supabase-untyped` → `internal-queries`
- `src/cms/operations/publish.ts` — `supabase-untyped` → `internal-queries`
- `src/cms/operations/relationships.ts` — `supabase-untyped` → `internal-queries`
- `eslint.config.mjs` — add operations files to `internal-queries` allow-list
- `src/app/auth/callback/route.ts` — `@/lib/supabase` → `@/lib/supabase-server`
- `src/app/admin/case-studies/page.tsx` — `@/lib/supabase` → `@/lib/supabase-server`
- `src/app/admin/audit-log/page.tsx` — `@/lib/supabase` → `@/lib/supabase-server`
- `src/app/admin/case-studies/trash/page.tsx` — `@/lib/supabase` → `@/lib/supabase-server`
- `src/app/api/case-studies/permanent-delete/route.ts` — `@/lib/supabase` → `@/lib/supabase-server`
- `src/app/api/case-studies/restore/route.ts` — `@/lib/supabase` → `@/lib/supabase-server`
- `src/app/api/audit-log/export/route.ts` — `@/lib/supabase` → `@/lib/supabase-server`
- `src/utils/content-management.ts` — `@/lib/supabase` → `@/lib/supabase-server`
- `src/lib/supabase.ts` — deleted after all importers updated
- `src/types/supabase-new.ts` — deleted after importers migrated

---

## Part 1: A0 — Schema Cross-Check

---

### Task 1: Install ts-morph and update Vitest config

**Files:**
- Modify: `package.json`
- Modify: `vitest.config.ts`

- [ ] **Install ts-morph as a dev dependency**

```bash
npm install --save-dev ts-morph
```

Expected: ts-morph appears in `devDependencies` in `package.json`.

- [ ] **Update vitest.config.ts to include scripts tests**

Change the `include` array from `['src/**/*.test.ts']` to:

```typescript
include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
```

- [ ] **Verify vitest picks up scripts tests (no tests yet, just check config)**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: same test count as before (no failures, no new tests yet).

- [ ] **Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add ts-morph dev dep, include scripts tests in vitest"
```

---

### Task 2: Write failing tests for comparison functions

**Files:**
- Create: `scripts/schema-crosscheck/compare.ts` (stub only)
- Create: `scripts/schema-crosscheck/compare.test.ts`

- [ ] **Create the stub module so tests can import it**

Create `scripts/schema-crosscheck/compare.ts` with only the type exports (no implementation):

```typescript
export type EngineFieldType = 'text' | 'textarea' | 'markdown' | 'slug' | 'boolean' | 'number' | 'date' | 'json'

export interface EngineField {
  name: string
  type: EngineFieldType
}

export interface EngineRelationship {
  junction: string
  foreignKey: string
  targetKey: string
}

export interface DBColumn {
  name: string
  tsType: string
  nullable: boolean
}

export interface DBSchema {
  [tableName: string]: { columns: DBColumn[] }
}

export type CheckStatus = '✅' | '❌' | '⚠️' | '~'

export interface FieldResult {
  field: string
  engineType: string
  dbType: string | null
  status: CheckStatus
  isKey: boolean
}

export interface RelationshipResult {
  junction: string
  foreignKey: string
  targetKey: string
  status: CheckStatus
  detail: string
}

export interface TypeCheckResult {
  contentType: string
  tableName: string
  fieldResults: FieldResult[]
  relationshipResults: RelationshipResult[]
}

export interface GateResult {
  pass: boolean
  exitCode: 0 | 1 | 2
  keyMismatches: number
  nonKeyMismatches: number
  reason: string
}

export function checkField(
  _field: EngineField,
  _tableColumns: DBColumn[],
  _fkColumnNames: string[]
): FieldResult {
  throw new Error('not implemented')
}

export function checkRelationship(
  _rel: EngineRelationship,
  _dbSchema: DBSchema
): RelationshipResult {
  throw new Error('not implemented')
}

export function evaluateGate(_results: TypeCheckResult[]): GateResult {
  throw new Error('not implemented')
}
```

- [ ] **Write the test file**

Create `scripts/schema-crosscheck/compare.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { checkField, checkRelationship, evaluateGate } from './compare'
import type { DBColumn, DBSchema, TypeCheckResult } from './compare'

const col = (name: string, tsType: string, nullable = false): DBColumn => ({ name, tsType, nullable })

describe('checkField', () => {
  it('returns ✅ for matching text field', () => {
    const result = checkField({ name: 'title', type: 'text' }, [col('title', 'string')], [])
    expect(result.status).toBe('✅')
    expect(result.isKey).toBe(false)
  })

  it('returns ❌ for field missing from DB', () => {
    const result = checkField({ name: 'title', type: 'text' }, [], [])
    expect(result.status).toBe('❌')
    expect(result.dbType).toBeNull()
  })

  it('returns ⚠️ for type mismatch on non-key field', () => {
    const result = checkField({ name: 'is_active', type: 'boolean' }, [col('is_active', 'string')], [])
    expect(result.status).toBe('⚠️')
    expect(result.isKey).toBe(false)
  })

  it('treats field named "id" as primary key', () => {
    const result = checkField({ name: 'id', type: 'text' }, [col('id', 'string')], [])
    expect(result.isKey).toBe(true)
    expect(result.status).toBe('✅')
  })

  it('treats field in fkColumnNames as a key', () => {
    const result = checkField({ name: 'industry_id', type: 'text' }, [col('industry_id', 'string')], ['industry_id'])
    expect(result.isKey).toBe(true)
    expect(result.status).toBe('✅')
  })

  it('maps date engine type to string DB type', () => {
    const result = checkField({ name: 'published_at', type: 'date' }, [col('published_at', 'string')], [])
    expect(result.status).toBe('✅')
  })

  it('maps json engine type to Json DB type', () => {
    const result = checkField({ name: 'metadata', type: 'json' }, [col('metadata', 'Json')], [])
    expect(result.status).toBe('✅')
  })

  it('returns ⚠️ for json field with wrong DB type', () => {
    const result = checkField({ name: 'metadata', type: 'json' }, [col('metadata', 'string')], [])
    expect(result.status).toBe('⚠️')
  })
})

describe('checkRelationship', () => {
  const schema: DBSchema = {
    algorithm_industry_relations: {
      columns: [col('algorithm_id', 'string'), col('industry_id', 'string')],
    },
  }

  it('returns ✅ when junction and both FK columns exist', () => {
    const result = checkRelationship(
      { junction: 'algorithm_industry_relations', foreignKey: 'algorithm_id', targetKey: 'industry_id' },
      schema
    )
    expect(result.status).toBe('✅')
  })

  it('returns ❌ when junction table is missing', () => {
    const result = checkRelationship(
      { junction: 'missing_junction', foreignKey: 'a_id', targetKey: 'b_id' },
      schema
    )
    expect(result.status).toBe('❌')
    expect(result.detail).toContain('not found')
  })

  it('returns ❌ when foreignKey column is missing from junction', () => {
    const result = checkRelationship(
      { junction: 'algorithm_industry_relations', foreignKey: 'wrong_id', targetKey: 'industry_id' },
      schema
    )
    expect(result.status).toBe('❌')
    expect(result.detail).toContain('wrong_id')
  })

  it('returns ❌ when targetKey column is missing from junction', () => {
    const result = checkRelationship(
      { junction: 'algorithm_industry_relations', foreignKey: 'algorithm_id', targetKey: 'wrong_id' },
      schema
    )
    expect(result.status).toBe('❌')
    expect(result.detail).toContain('wrong_id')
  })
})

describe('evaluateGate', () => {
  const makeTypeResult = (
    fieldStatus: '✅' | '❌' | '⚠️',
    isKey: boolean,
    count = 1
  ): TypeCheckResult => ({
    contentType: 'test',
    tableName: 'test',
    fieldResults: Array.from({ length: count }, (_, i) => ({
      field: `field_${i}`,
      engineType: 'text',
      dbType: fieldStatus === '✅' ? 'string' : null,
      status: fieldStatus,
      isKey,
    })),
    relationshipResults: [],
  })

  it('passes with all matches', () => {
    const gate = evaluateGate([makeTypeResult('✅', false)])
    expect(gate.pass).toBe(true)
    expect(gate.exitCode).toBe(0)
  })

  it('fails immediately on any key-field mismatch', () => {
    const gate = evaluateGate([makeTypeResult('❌', true, 1)])
    expect(gate.pass).toBe(false)
    expect(gate.exitCode).toBe(1)
    expect(gate.keyMismatches).toBe(1)
  })

  it('passes with exactly 3 non-key mismatches (at threshold)', () => {
    const gate = evaluateGate([makeTypeResult('❌', false, 3)])
    expect(gate.pass).toBe(true)
    expect(gate.nonKeyMismatches).toBe(3)
  })

  it('fails with 4 non-key mismatches (over threshold)', () => {
    const gate = evaluateGate([makeTypeResult('❌', false, 4)])
    expect(gate.pass).toBe(false)
    expect(gate.exitCode).toBe(1)
    expect(gate.nonKeyMismatches).toBe(4)
  })

  it('counts junction mismatches as key-level fails', () => {
    const result: TypeCheckResult = {
      contentType: 'algorithms',
      tableName: 'algorithms',
      fieldResults: [],
      relationshipResults: [{
        junction: 'missing_junction',
        foreignKey: 'a_id',
        targetKey: 'b_id',
        status: '❌',
        detail: 'Junction table missing',
      }],
    }
    const gate = evaluateGate([result])
    expect(gate.pass).toBe(false)
    expect(gate.keyMismatches).toBe(1)
  })

  it('passes with 0 mismatches across multiple types', () => {
    const gate = evaluateGate([
      makeTypeResult('✅', false, 5),
      makeTypeResult('✅', false, 3),
    ])
    expect(gate.pass).toBe(true)
  })
})
```

- [ ] **Run tests to confirm they fail**

```bash
npx vitest run scripts/schema-crosscheck/compare.test.ts 2>&1 | tail -10
```

Expected: tests fail with "not implemented" errors.

---

### Task 3: Implement comparison functions

**Files:**
- Modify: `scripts/schema-crosscheck/compare.ts`

- [ ] **Replace the stub implementations with working code**

Replace the entire content of `scripts/schema-crosscheck/compare.ts` with:

```typescript
export type EngineFieldType = 'text' | 'textarea' | 'markdown' | 'slug' | 'boolean' | 'number' | 'date' | 'json'

export interface EngineField {
  name: string
  type: EngineFieldType
}

export interface EngineRelationship {
  junction: string
  foreignKey: string
  targetKey: string
}

export interface DBColumn {
  name: string
  tsType: string
  nullable: boolean
}

export interface DBSchema {
  [tableName: string]: { columns: DBColumn[] }
}

export type CheckStatus = '✅' | '❌' | '⚠️' | '~'

export interface FieldResult {
  field: string
  engineType: string
  dbType: string | null
  status: CheckStatus
  isKey: boolean
}

export interface RelationshipResult {
  junction: string
  foreignKey: string
  targetKey: string
  status: CheckStatus
  detail: string
}

export interface TypeCheckResult {
  contentType: string
  tableName: string
  fieldResults: FieldResult[]
  relationshipResults: RelationshipResult[]
}

export interface GateResult {
  pass: boolean
  exitCode: 0 | 1 | 2
  keyMismatches: number
  nonKeyMismatches: number
  reason: string
}

// Maps engine field type → expected TypeScript base type in generated supabase.ts
// Dates are stored as strings in TypeScript; PKs/FKs use string (uuid) or number
const TS_COMPAT: Record<string, string[]> = {
  text: ['string'],
  textarea: ['string'],
  markdown: ['string'],
  slug: ['string'],
  boolean: ['boolean'],
  number: ['number'],
  date: ['string'],
  json: ['Json'],
}

const KEY_TS_TYPES = ['string', 'number']

export function checkField(
  field: EngineField,
  tableColumns: DBColumn[],
  fkColumnNames: string[]
): FieldResult {
  const isPK = field.name === 'id'
  const isFK = fkColumnNames.includes(field.name)
  const isKey = isPK || isFK

  const col = tableColumns.find(c => c.name === field.name)
  if (!col) {
    return { field: field.name, engineType: field.type, dbType: null, status: '❌', isKey }
  }

  const compatible = isKey
    ? KEY_TS_TYPES.includes(col.tsType)
    : (TS_COMPAT[field.type] ?? []).includes(col.tsType)

  return {
    field: field.name,
    engineType: field.type,
    dbType: col.tsType,
    status: compatible ? '✅' : '⚠️',
    isKey,
  }
}

export function checkRelationship(
  rel: EngineRelationship,
  dbSchema: DBSchema
): RelationshipResult {
  const junctionTable = dbSchema[rel.junction]
  if (!junctionTable) {
    return {
      junction: rel.junction,
      foreignKey: rel.foreignKey,
      targetKey: rel.targetKey,
      status: '❌',
      detail: `Junction table '${rel.junction}' not found in DB`,
    }
  }

  const colNames = junctionTable.columns.map(c => c.name)
  const missingCols = [rel.foreignKey, rel.targetKey].filter(c => !colNames.includes(c))

  if (missingCols.length > 0) {
    return {
      junction: rel.junction,
      foreignKey: rel.foreignKey,
      targetKey: rel.targetKey,
      status: '❌',
      detail: `Missing columns in '${rel.junction}': ${missingCols.join(', ')}`,
    }
  }

  return { junction: rel.junction, foreignKey: rel.foreignKey, targetKey: rel.targetKey, status: '✅', detail: '' }
}

export function evaluateGate(results: TypeCheckResult[]): GateResult {
  let keyMismatches = 0
  let nonKeyMismatches = 0

  for (const r of results) {
    for (const f of r.fieldResults) {
      if (f.status === '❌' || f.status === '⚠️') {
        if (f.isKey) keyMismatches++
        else nonKeyMismatches++
      }
    }
    for (const rel of r.relationshipResults) {
      if (rel.status === '❌') keyMismatches++
    }
  }

  if (keyMismatches > 0) {
    return {
      pass: false, exitCode: 1, keyMismatches, nonKeyMismatches,
      reason: `${keyMismatches} key-field/junction mismatch(es) — immediate fail`,
    }
  }
  if (nonKeyMismatches > 3) {
    return {
      pass: false, exitCode: 1, keyMismatches, nonKeyMismatches,
      reason: `${nonKeyMismatches} non-key mismatches exceeds threshold of 3`,
    }
  }
  return { pass: true, exitCode: 0, keyMismatches, nonKeyMismatches, reason: '' }
}
```

- [ ] **Run tests to confirm they pass**

```bash
npx vitest run scripts/schema-crosscheck/compare.test.ts 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add scripts/schema-crosscheck/compare.ts scripts/schema-crosscheck/compare.test.ts
git commit -m "feat(a0): add schema crosscheck comparison functions with tests"
```

---

### Task 4: Write failing tests for the DB schema parser

**Files:**
- Create: `scripts/schema-crosscheck/__fixtures__/test-database.types.ts`
- Create: `scripts/schema-crosscheck/parse-schema.ts` (stub)
- Create: `scripts/schema-crosscheck/parse-schema.test.ts`

- [ ] **Create the test fixture — a minimal valid supabase.ts**

Create `scripts/schema-crosscheck/__fixtures__/test-database.types.ts`:

```typescript
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      algorithms: {
        Row: {
          id: string
          name: string
          description: string | null
          published: boolean | null
          published_at: string | null
          main_content: string | null
          metadata: Json | null
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      algorithm_industry_relations: {
        Row: {
          algorithm_id: string
          industry_id: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
```

- [ ] **Create the stub parser**

Create `scripts/schema-crosscheck/parse-schema.ts`:

```typescript
import type { DBSchema } from './compare'

export function extractDBSchema(_supabaseTsPath: string): DBSchema {
  throw new Error('not implemented')
}
```

- [ ] **Write the parser test file**

Create `scripts/schema-crosscheck/parse-schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { extractDBSchema } from './parse-schema'
import path from 'path'

const FIXTURE = path.join(__dirname, '__fixtures__/test-database.types.ts')

describe('extractDBSchema', () => {
  it('extracts all table names', () => {
    const schema = extractDBSchema(FIXTURE)
    expect(Object.keys(schema)).toContain('algorithms')
    expect(Object.keys(schema)).toContain('algorithm_industry_relations')
  })

  it('extracts non-nullable column name and type', () => {
    const schema = extractDBSchema(FIXTURE)
    const id = schema['algorithms'].columns.find(c => c.name === 'id')
    expect(id).toBeDefined()
    expect(id!.tsType).toBe('string')
    expect(id!.nullable).toBe(false)
  })

  it('extracts nullable column with correct base type and nullable flag', () => {
    const schema = extractDBSchema(FIXTURE)
    const desc = schema['algorithms'].columns.find(c => c.name === 'description')
    expect(desc).toBeDefined()
    expect(desc!.tsType).toBe('string')
    expect(desc!.nullable).toBe(true)
  })

  it('extracts boolean column type', () => {
    const schema = extractDBSchema(FIXTURE)
    const published = schema['algorithms'].columns.find(c => c.name === 'published')
    expect(published!.tsType).toBe('boolean')
    expect(published!.nullable).toBe(true)
  })

  it('extracts Json column type', () => {
    const schema = extractDBSchema(FIXTURE)
    const metadata = schema['algorithms'].columns.find(c => c.name === 'metadata')
    expect(metadata!.tsType).toBe('Json')
    expect(metadata!.nullable).toBe(true)
  })

  it('extracts junction table FK columns', () => {
    const schema = extractDBSchema(FIXTURE)
    const cols = schema['algorithm_industry_relations'].columns.map(c => c.name)
    expect(cols).toContain('algorithm_id')
    expect(cols).toContain('industry_id')
  })

  it('throws for a path that does not exist', () => {
    expect(() => extractDBSchema('/nonexistent/path.ts')).toThrow()
  })
})
```

- [ ] **Run tests to confirm they fail**

```bash
npx vitest run scripts/schema-crosscheck/parse-schema.test.ts 2>&1 | tail -10
```

Expected: all tests fail with "not implemented".

---

### Task 5: Implement the DB schema parser

**Files:**
- Modify: `scripts/schema-crosscheck/parse-schema.ts`

- [ ] **Implement the parser using ts-morph**

Replace `scripts/schema-crosscheck/parse-schema.ts` with:

```typescript
import { Project } from 'ts-morph'
import path from 'path'
import type { DBSchema, DBColumn } from './compare'

export function extractDBSchema(supabaseTsPath: string): DBSchema {
  const project = new Project({ skipAddingFilesFromTsConfig: true })
  const absPath = path.resolve(supabaseTsPath)
  const sourceFile = project.addSourceFileAtPath(absPath)

  const dbAlias = sourceFile.getTypeAliasOrThrow('Database')
  const anchor = dbAlias.getNameNode()

  function getPropType(type: ReturnType<typeof dbAlias.getType>, propName: string) {
    const sym = type.getProperty(propName)
    return sym ? sym.getTypeAtLocation(anchor) : undefined
  }

  const dbType = dbAlias.getType()
  const publicType = getPropType(dbType, 'public')
  if (!publicType) return {}

  const tablesType = getPropType(publicType, 'Tables')
  if (!tablesType) return {}

  const result: DBSchema = {}

  for (const tableSym of tablesType.getProperties()) {
    const tableName = tableSym.getName()
    const tableType = tableSym.getTypeAtLocation(anchor)

    const rowSym = tableType.getProperty('Row')
    if (!rowSym) continue
    const rowType = rowSym.getTypeAtLocation(anchor)

    const columns: DBColumn[] = []
    for (const colSym of rowType.getProperties()) {
      const colType = colSym.getTypeAtLocation(anchor)
      const typeText = colType.getText()
      const nullable = typeText.includes('| null') || typeText.includes('null |')
      const baseType = typeText
        .replace(' | null', '')
        .replace('null | ', '')
        .trim()
      columns.push({ name: colSym.getName(), tsType: baseType, nullable })
    }

    result[tableName] = { columns }
  }

  return result
}
```

- [ ] **Run tests to confirm they pass**

```bash
npx vitest run scripts/schema-crosscheck/parse-schema.test.ts 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add scripts/schema-crosscheck/parse-schema.ts scripts/schema-crosscheck/parse-schema.test.ts scripts/schema-crosscheck/__fixtures__/test-database.types.ts
git commit -m "feat(a0): add ts-morph DB schema parser with tests"
```

---

### Task 6: Implement the report generator and CLI entry point

**Files:**
- Create: `scripts/schema-crosscheck/report.ts`
- Create: `scripts/schema-crosscheck.ts`

- [ ] **Create the report generator**

Create `scripts/schema-crosscheck/report.ts`:

```typescript
import type { TypeCheckResult, GateResult } from './compare'

export interface ReportMeta {
  typesRegenerated: boolean
  typesDiffLines: number
  unappliedMigrations: string[]
  scriptSha: string
}

export function generateReport(
  results: TypeCheckResult[],
  gate: GateResult,
  meta: ReportMeta
): string {
  const date = new Date().toISOString().split('T')[0]
  const lines: string[] = [
    `# Schema Cross-Check — ${date}`,
    '',
    `**Supabase types regenerated:** ${meta.typesRegenerated ? `yes (${meta.typesDiffLines} lines changed)` : 'no change'}`,
    `**Unapplied migrations:** ${meta.unappliedMigrations.length === 0 ? 'none' : meta.unappliedMigrations.join(', ')}`,
    `**Script version:** scripts/schema-crosscheck.ts @ ${meta.scriptSha}`,
    '',
  ]

  for (const r of results) {
    lines.push(`## ${r.contentType} (table: \`${r.tableName}\`)`)
    lines.push('')
    lines.push('| Field | Engine type | DB type | Status |')
    lines.push('|-------|------------|---------|--------|')
    for (const f of r.fieldResults) {
      lines.push(`| ${f.field} | ${f.engineType} | ${f.dbType ?? '—'} | ${f.status} |`)
    }

    if (r.relationshipResults.length > 0) {
      lines.push('')
      lines.push('**Relationships:**')
      lines.push('')
      lines.push('| Junction table | foreignKey | targetKey | Status | Detail |')
      lines.push('|---------------|-----------|----------|--------|--------|')
      for (const rel of r.relationshipResults) {
        lines.push(`| ${rel.junction} | ${rel.foreignKey} | ${rel.targetKey} | ${rel.status} | ${rel.detail} |`)
      }
    }
    lines.push('')
  }

  const allFields = results.flatMap(r => r.fieldResults)
  const allRels = results.flatMap(r => r.relationshipResults)
  const matches = allFields.filter(f => f.status === '✅').length
  const missing = allFields.filter(f => f.status === '❌').length
  const mismatches = allFields.filter(f => f.status === '⚠️').length
  const extra = allFields.filter(f => f.status === '~').length
  const keyIssues = allFields.filter(f => (f.status === '❌' || f.status === '⚠️') && f.isKey).length
  const nonKeyIssues = allFields.filter(f => (f.status === '❌' || f.status === '⚠️') && !f.isKey).length
  const junctionFails = allRels.filter(r => r.status === '❌').length

  lines.push('## Summary')
  lines.push('')
  lines.push(`- ✅ Matches: ${matches}`)
  lines.push(`- ❌ Missing from DB: ${missing} (key: ${keyIssues}, non-key: ${nonKeyIssues})`)
  lines.push(`- ⚠️ Type mismatches: ${mismatches}`)
  lines.push(`- ~ Extra DB columns (informational): ${extra}`)
  lines.push(`- ❌ Junction table failures: ${junctionFails}`)
  lines.push('')
  lines.push(`**Gate result:** ${gate.pass ? 'PASS' : 'FAIL'}`)
  if (!gate.pass) lines.push(`**Reason:** ${gate.reason}`)

  return lines.join('\n')
}
```

- [ ] **Create the CLI entry point**

Create `scripts/schema-crosscheck.ts`:

```typescript
#!/usr/bin/env npx tsx
import dotenv from 'dotenv'
import path from 'path'
import { execSync } from 'child_process'
import { readdirSync } from 'fs'
import { extractDBSchema } from './schema-crosscheck/parse-schema'
import { checkField, checkRelationship, evaluateGate } from './schema-crosscheck/compare'
import { generateReport } from './schema-crosscheck/report'
import type { TypeCheckResult } from './schema-crosscheck/compare'

dotenv.config({ path: '.env.local' })

const engineTypesArg = process.argv.find((_, i) => process.argv[i - 1] === '--engine-types')
const ENGINE_TYPES_DIR = engineTypesArg ?? '.worktrees/cms-engine/src/cms/types'
const SUPABASE_TYPES_PATH = 'src/types/supabase.ts'

async function main() {
  // Check for unapplied migrations — exit 2 if any found
  try {
    const diff = execSync('supabase db diff 2>&1', { encoding: 'utf8' })
    if (diff.trim() && !diff.includes('No schema changes found')) {
      process.stderr.write(`Unapplied migrations detected. Apply them before running A0.\n${diff}\n`)
      process.exit(2)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    process.stderr.write(`supabase db diff failed: ${msg}\nResolve unapplied migrations before running A0.\n`)
    process.exit(2)
  }

  // Parse DB schema from regenerated types
  const dbSchema = extractDBSchema(SUPABASE_TYPES_PATH)

  // Import engine type definitions
  const typeFiles = readdirSync(ENGINE_TYPES_DIR).filter(
    f => f.endsWith('.ts') && !f.includes('.test.')
  )

  const results: TypeCheckResult[] = []

  for (const file of typeFiles) {
    const mod = await import(path.resolve(ENGINE_TYPES_DIR, file))
    // Each file exports one content type definition as the default or first named export
    const contentType = Object.values(mod)[0] as {
      tableName: string
      fields?: Array<{ name: string; type: string }>
      relationships?: Array<{ junction: string; foreignKey: string; targetKey: string }>
    }
    if (!contentType?.tableName || !contentType?.fields) continue

    const { tableName, fields = [], relationships = [] } = contentType
    const tableInfo = dbSchema[tableName]
    const tableColumns = tableInfo?.columns ?? []
    const fkColNames = relationships.flatMap(r => [r.foreignKey, r.targetKey])

    const fieldResults = fields.map(f =>
      checkField({ name: f.name, type: f.type as never }, tableColumns, fkColNames)
    )

    // Mark DB columns not referenced in engine definition as (~)
    const engineFieldNames = new Set(fields.map(f => f.name))
    for (const col of tableColumns) {
      if (!engineFieldNames.has(col.name)) {
        fieldResults.push({
          field: col.name,
          engineType: '~',
          dbType: col.tsType,
          status: '~' as const,
          isKey: false,
        })
      }
    }

    const relationshipResults = relationships.map(r => checkRelationship(r, dbSchema))

    results.push({
      contentType: file.replace('.ts', ''),
      tableName,
      fieldResults,
      relationshipResults,
    })
  }

  const gate = evaluateGate(results)
  const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()

  const report = generateReport(results, gate, {
    typesRegenerated: false, // update manually in artifact header after running
    typesDiffLines: 0,
    unappliedMigrations: [],
    scriptSha: sha,
  })

  process.stdout.write(report + '\n')

  if (!gate.pass) {
    process.stderr.write(`\nGATE FAIL: ${gate.reason}\n`)
    process.exit(gate.exitCode)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
```

- [ ] **Run all tests to confirm nothing broke**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: all tests pass (same count as before — report.ts has no tests since it's pure string formatting that's verified by the integration run in Task 7).

- [ ] **Commit**

```bash
git add scripts/schema-crosscheck/report.ts scripts/schema-crosscheck.ts
git commit -m "feat(a0): add report generator and schema-crosscheck CLI entry point"
```

---

### Task 7: Run A0 and commit the artifact

**Files:**
- Modify: `src/types/supabase.ts` (if types have drifted)
- Create: `docs/superpowers/research/2026-05-27-schema-crosscheck.md`

- [ ] **Regenerate Supabase types from the live DB**

```bash
supabase gen types typescript --project-id <your-project-ref> > src/types/supabase.ts
```

Replace `<your-project-ref>` with the Supabase project ref (find it in the Supabase dashboard URL or in `.env.local` as part of `NEXT_PUBLIC_SUPABASE_URL`: `https://<project-ref>.supabase.co`).

Check if the file changed:

```bash
git diff --stat src/types/supabase.ts
```

If it changed, note the line count for the artifact header. Commit it:

```bash
git add src/types/supabase.ts
git commit -m "chore(a0): regenerate supabase types from live DB"
```

If it did not change, no commit needed — note "no change" in the artifact header.

- [ ] **Run the cross-check script**

```bash
npx tsx scripts/schema-crosscheck.ts > docs/superpowers/research/2026-05-27-schema-crosscheck.md
```

Check exit code:

```bash
echo $?
```

- Exit code `0` → PASS. Proceed.
- Exit code `1` → FAIL. Open the artifact, read the "Reason" field. Determine whether the fix is a new migration (DB is missing a column) or an engine type correction (engine definition is wrong). Do not start A2 until re-run returns exit code 0.
- Exit code `2` → Unapplied migrations detected. Apply them via `supabase db push`, then re-run.

- [ ] **Update the artifact header to reflect whether types were regenerated**

Open `docs/superpowers/research/2026-05-27-schema-crosscheck.md` and update the first few lines to accurately reflect whether the types were regenerated (yes/no and diff size).

- [ ] **Commit the artifact**

```bash
git add docs/superpowers/research/2026-05-27-schema-crosscheck.md
git commit -m "docs(a0): commit schema cross-check artifact"
```

- [ ] **Push to develop**

```bash
git push origin develop
```

---

## Part 2: A2 — CMS Engine Integration

> ⛔ **Do not start Task 8 until `feature/a1-security-pr` has been merged to `develop`.**
>
> Verify A1 is on develop before proceeding:
> ```bash
> git log --oneline develop | grep -i "a1\|security\|internal-queries" | head -5
> # or
> ls src/lib/internal-queries.ts
> ```
> If `src/lib/internal-queries.ts` does not exist on `develop`, A1 has not merged. Stop here.

---

### Task 8: Rebase feature/cms-engine onto post-A1 develop

**Files:**
- Worktree: `.worktrees/cms-engine/` (all changes happen here)

- [ ] **Fetch latest develop and start the rebase**

```bash
cd .worktrees/cms-engine
git fetch origin
git rebase origin/develop
```

- [ ] **Resolve conflicts — primary file: `src/lib/content-fetchers.ts`**

If conflicts arise in `content-fetchers.ts`: this file was heavily modified by both branches. Keep A1's version of any code that imports from `internal-queries.ts` or `public-query.ts`. Keep the engine branch's version of any simplifications to the relationship-fetching logic. When in doubt about a hunk, keep A1's version — the security architecture takes priority.

If conflicts arise in `src/lib/supabase-untyped.ts`: keep A1's version. The engine branch made a minor change here; A1's version is the one that matters.

If conflicts arise in layout components (`professional-case-study-layout.tsx`, `professional-industry-detail-layout.tsx`): these are UI-only changes with no security implications. Keep the engine branch's version.

After resolving each file:

```bash
git add <resolved-file>
git rebase --continue
```

- [ ] **Confirm the rebase completed cleanly**

```bash
git log --oneline -5
git status
```

Expected: clean working tree, recent commits are the engine branch's commits rebased on top of the A1 commits.

- [ ] **Run the test suite to check nothing is broken by the rebase alone**

```bash
npx vitest run 2>&1 | tail -10
```

Note: some tests may fail at this point because the operations layer still imports from `supabase-untyped` instead of `internal-queries`. Record any failures — they will be fixed in Task 9.

---

### Task 9: Update operations layer from supabase-untyped to internal-queries

**Files:**
- Modify: `src/cms/operations/fetch.ts`
- Modify: `src/cms/operations/create.ts`
- Modify: `src/cms/operations/update.ts`
- Modify: `src/cms/operations/delete.ts`
- Modify: `src/cms/operations/publish.ts`
- Modify: `src/cms/operations/relationships.ts`

All 6 files currently import `fromTable` from `@/lib/supabase-untyped`. After A1 merges, `@/lib/internal-queries` is the gated module with the same `fromTable` export. The change in each file is a one-line import swap.

- [ ] **Update all 6 files in one pass**

In each of the 6 files, change:

```typescript
import { fromTable } from '@/lib/supabase-untyped'
```

to:

```typescript
import { fromTable } from '@/lib/internal-queries'
```

- [ ] **Verify no remaining supabase-untyped imports in the operations layer**

```bash
grep -r "supabase-untyped" src/cms/operations/
```

Expected: no output.

- [ ] **Run the test suite**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add src/cms/operations/
git commit -m "feat(a2): migrate operations layer from supabase-untyped to internal-queries"
```

---

### Task 10: Add operations files to the ESLint allow-list

**Files:**
- Modify: `eslint.config.mjs`

A1 adds a `no-restricted-imports` rule that only allows files on an explicit allow-list to import from `internal-queries.ts`. All 6 operations files are legitimate admin/build-time paths and must be added to that allow-list.

- [ ] **Find the no-restricted-imports rule in eslint.config.mjs**

```bash
grep -n "restricted\|internal-queries" eslint.config.mjs
```

This rule was added by A1. It will look something like:

```javascript
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['**/internal-queries*'],
        message: 'Import from @/lib/internal-queries only from the allow-list.',
      }],
    }],
  },
  // files: allow-listed files go here as overrides
}
```

The exact shape depends on how A1 implemented it. Read the A1 spec at `docs/superpowers/specs/2026-04-28-a1-security-pr-design.md` for the exact ESLint config structure, then add the 6 operations files to the allow-list using the same pattern.

- [ ] **Run lint to confirm 0 errors**

```bash
npm run lint 2>&1 | grep -E "error|warning" | tail -20
```

Expected: 0 errors. Warnings may exist (pre-existing 459 warnings unchanged).

- [ ] **Commit**

```bash
git add eslint.config.mjs
git commit -m "feat(a2): add cms operations files to internal-queries ESLint allow-list"
```

---

### Task 11: Update 8 importers off @/lib/supabase barrel and delete it

**Files:**
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/app/admin/case-studies/page.tsx`
- Modify: `src/app/admin/audit-log/page.tsx`
- Modify: `src/app/admin/case-studies/trash/page.tsx`
- Modify: `src/app/api/case-studies/permanent-delete/route.ts`
- Modify: `src/app/api/case-studies/restore/route.ts`
- Modify: `src/app/api/audit-log/export/route.ts`
- Modify: `src/utils/content-management.ts`
- Delete: `src/lib/supabase.ts`

- [ ] **Update each file — change the import source**

In each file below, change `from '@/lib/supabase'` to `from '@/lib/supabase-server'`. The imported function names (`createServerSupabaseClient`, `createServiceRoleSupabaseClient`) stay the same — only the source path changes.

Files to update:
- `src/app/auth/callback/route.ts` — imports `createServerSupabaseClient`
- `src/app/admin/case-studies/page.tsx` — imports `createServiceRoleSupabaseClient`
- `src/app/admin/audit-log/page.tsx` — imports `createServiceRoleSupabaseClient`
- `src/app/admin/case-studies/trash/page.tsx` — imports `createServiceRoleSupabaseClient`
- `src/app/api/case-studies/permanent-delete/route.ts` — imports `createServiceRoleSupabaseClient`
- `src/app/api/case-studies/restore/route.ts` — imports `createServiceRoleSupabaseClient`
- `src/app/api/audit-log/export/route.ts` — imports `createServiceRoleSupabaseClient`
- `src/utils/content-management.ts` — imports `createServiceRoleSupabaseClient`

- [ ] **Confirm no remaining importers of @/lib/supabase (both quote styles)**

```bash
grep -rE "from ['\"]@/lib/supabase['\"]" src/
```

Expected: no output.

- [ ] **Delete the deprecated barrel**

```bash
rm src/lib/supabase.ts
```

- [ ] **Run tests and lint**

```bash
npx vitest run 2>&1 | tail -5
npm run lint 2>&1 | grep "error" | tail -10
```

Expected: all tests pass, 0 lint errors.

- [ ] **Commit**

```bash
git add -A src/
git commit -m "feat(a2): migrate 8 importers to supabase-server; delete deprecated barrel"
```

---

### Task 12: Resolve src/types/supabase-new.ts

**Files:**
- Delete: `src/types/supabase-new.ts`

- [ ] **Diff the two type snapshots to understand what differs**

```bash
diff src/types/supabase.ts src/types/supabase-new.ts | head -60
```

Known differences: `supabase-new.ts` has extra fields on `algorithms` (`partner_companies`, `quantum_companies`, `quantum_hardware`, `quantum_software`); `supabase.ts` has `deletion_audit_log` and `legacy_tags_backup` tables that `supabase-new.ts` lacks. The live-regenerated `supabase.ts` (updated in A0 Task 7) is the authoritative version.

- [ ] **Check for any remaining importers of supabase-new**

```bash
grep -rE "from ['\"].*supabase-new['\"]" src/
```

If any files import from `supabase-new`, update them to import from `@/types/supabase` instead. If any of the fields they use only exist in `supabase-new` and not in the regenerated `supabase.ts`, that is a schema gap that should have been caught in A0 — stop and investigate.

- [ ] **Delete supabase-new.ts**

```bash
rm src/types/supabase-new.ts
```

- [ ] **Run tests**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add -A src/types/
git commit -m "chore(a2): delete stale supabase-new.ts type snapshot"
```

---

### Task 13: Verify replaced admin components for the 3 migrated types

**Files:** (read-only verification, no changes expected)

- [ ] **Confirm all three actions.ts files import from @/cms/operations**

Note: `blog-posts` content type slug maps to `blog/` directory (confirmed from codebase inspection).

```bash
grep -l "from '@/cms/operations'" \
  src/app/admin/industries/[id]/actions.ts \
  src/app/admin/personas/[id]/actions.ts \
  src/app/admin/blog/[id]/actions.ts
```

Expected: all three file paths are listed in the output. If any file is missing, the rebase did not apply the engine migration for that type. Resolve the conflict manually by replacing that `actions.ts` with the engine-backed version from `.worktrees/cms-engine/src/app/admin/<type>/[id]/actions.ts`.

- [ ] **Confirm file structure for each type is complete**

```bash
find src/app/admin/industries src/app/admin/personas src/app/admin/blog -type f | sort
```

Expected output for each type:
```
src/app/admin/<type>/[id]/actions.ts
src/app/admin/<type>/[id]/client.tsx
src/app/admin/<type>/[id]/page.tsx
src/app/admin/<type>/client.tsx
src/app/admin/<type>/page.tsx
```

No `new/page.tsx` exists — the `[id]` route handles both create (`id === 'new'`) and edit.

---

### Task 14: Quality gates on the feature branch

- [ ] **Run the full quality gate suite**

```bash
npx vitest run 2>&1 | tail -10
npm run lint 2>&1 | grep -c "error"
npx tsc --noEmit --skipLibCheck 2>&1 | tail -10
npx next build 2>&1 | tail -20
```

Expected:
- All tests pass
- `grep -c "error"` returns `0`
- `tsc` produces no new errors (pre-existing errors in `node_modules/next` and `schema.test.ts` are acceptable — do not fix them here)
- Build succeeds; static page count should be similar to before (~367 pages)

If any gate fails, fix the issue before proceeding. Do not open a PR with failing gates.

---

### Task 15: Smoke test trash/restore lifecycle

- [ ] **Start the dev server**

```bash
npm run dev
```

Wait for "Ready" in the output, then open `http://localhost:3000/admin` in a browser. Log in as admin.

- [ ] **Test soft-delete**

1. Navigate to a case study in the admin.
2. Click the delete/archive button.
3. Confirm the case study disappears from the admin listing.
4. Navigate to the public case study URL — confirm it returns 404 or is not accessible.

- [ ] **Test trash listing**

Navigate to `http://localhost:3000/admin/case-studies/trash`. Confirm the soft-deleted case study appears in the trash list.

- [ ] **Test restore**

1. Click "Restore" on the soft-deleted case study.
2. Confirm it reappears in the admin listing (as a draft/unpublished record).
3. Confirm it is no longer in the trash list.

- [ ] **Test permanent delete**

1. Soft-delete a different case study (one you don't need).
2. Navigate to trash.
3. Click "Permanent Delete".
4. Confirm the record is gone from trash and cannot be restored.

- [ ] **Stop the dev server** (`Ctrl+C`)

If any of the above steps fail, the rebase broke the soft-delete lifecycle. Investigate the relevant route handler and fix before opening the PR.

---

### Task 16: Merge to develop and post-merge verification

- [ ] **Open a PR from feature/cms-engine to develop**

```bash
gh pr create \
  --title "feat: land CMS engine — all 9 content types on registry-driven operations layer" \
  --body "$(cat <<'EOF'
## Summary

- All 9 content types migrated to the registry-driven CMS engine (industries, personas, blog-posts complete the set)
- Operations layer migrated from \`supabase-untyped\` to \`internal-queries\` (A1 ESLint boundary compliance)
- Deprecated \`@/lib/supabase\` barrel removed; 8 importers updated to \`@/lib/supabase-server\`
- Stale \`src/types/supabase-new.ts\` removed
- A0 schema cross-check artifact committed confirming DB alignment

## Test plan

- [ ] All tests pass on the feature branch
- [ ] 0 lint errors
- [ ] Build succeeds
- [ ] Trash/restore/permanent-delete smoke test passed
- [ ] Post-merge quality gates run on \`develop\`
EOF
)"
```

- [ ] **Review and merge the PR**

- [ ] **Pull develop and run the full quality gate suite on the merged result**

```bash
git checkout develop
git pull origin develop
npx vitest run 2>&1 | tail -10
npm run lint 2>&1 | grep -c "error"
npx tsc --noEmit --skipLibCheck 2>&1 | tail -10
npx next build 2>&1 | tail -20
```

Expected: same results as Task 14. A merge-induced regression that was absent on either branch individually would surface here.

- [ ] **Push develop**

```bash
git push origin develop
```

---

## Acceptance Criteria Checklist

### A0
- [ ] `src/types/supabase.ts` regenerated from live DB on `develop` and committed if changed
- [ ] `supabase db diff` confirms no unapplied migrations
- [ ] `scripts/schema-crosscheck.ts` written, tested, and committed
- [ ] Artifact committed to `docs/superpowers/research/2026-05-27-schema-crosscheck.md`
- [ ] Gate result: PASS (no key-field/junction mismatches; ≤ 3 non-key mismatches)

### A2
- [ ] `feature/cms-engine` rebased cleanly onto post-A1 `develop`
- [ ] All 6 operations files import from `@/lib/internal-queries`; 0 lint errors
- [ ] All 8 `@/lib/supabase` importers updated; barrel deleted
- [ ] `src/types/supabase-new.ts` resolved and deleted
- [ ] `[id]/actions.ts` for industries, personas, blog confirmed importing from `@/cms/operations`
- [ ] Trash/restore/permanent-delete smoke test passed
- [ ] All tests pass, 0 lint errors, `tsc` clean, build succeeds on feature branch
- [ ] Merged to `develop` via PR
- [ ] Post-merge quality gates pass on `develop`
