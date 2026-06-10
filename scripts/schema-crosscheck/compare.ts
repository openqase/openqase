export type EngineFieldType = 'text' | 'textarea' | 'markdown' | 'slug' | 'boolean' | 'number' | 'date' | 'json' | 'url' | 'select'

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
  url: ['string'],
  select: ['string'], // enum stored as text in DB
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
