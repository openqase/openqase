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
  const keyMissing = allFields.filter(f => f.status === '❌' && f.isKey).length
  const nonKeyMissing = allFields.filter(f => f.status === '❌' && !f.isKey).length
  const keyMismatch = allFields.filter(f => f.status === '⚠️' && f.isKey).length
  const nonKeyMismatch = allFields.filter(f => f.status === '⚠️' && !f.isKey).length
  const junctionFails = allRels.filter(r => r.status === '❌').length

  lines.push('## Summary')
  lines.push('')
  lines.push(`- ✅ Matches: ${matches}`)
  lines.push(`- ❌ Missing from DB: ${missing} (key: ${keyMissing}, non-key: ${nonKeyMissing})`)
  lines.push(`- ⚠️ Type mismatches: ${mismatches} (key: ${keyMismatch}, non-key: ${nonKeyMismatch})`)
  lines.push(`- ~ Extra DB columns (informational): ${extra}`)
  lines.push(`- ❌ Junction table failures: ${junctionFails}`)
  lines.push('')
  lines.push(`**Gate result:** ${gate.pass ? 'PASS' : 'FAIL'}`)
  if (!gate.pass) lines.push(`**Reason:** ${gate.reason}`)

  return lines.join('\n')
}
