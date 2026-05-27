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
    const contentType = (mod.default ?? Object.values(mod)[0]) as {
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
      contentType: path.basename(file, '.ts'),
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
