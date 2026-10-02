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
