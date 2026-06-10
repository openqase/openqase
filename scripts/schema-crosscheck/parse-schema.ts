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
      const typeText = colType.getText(sourceFile)

      // Detect nullable: either the type text contains '| null' / 'null |',
      // or (for aliased union types like Json) one of the union members is null
      const hasNullInText = typeText.includes('| null') || typeText.includes('null |')
      const hasNullUnionMember =
        colType.isUnion() &&
        colType.getUnionTypes().some(t => t.isNull() || t.isUndefined())
      const nullable = hasNullInText || hasNullUnionMember

      // Strip null from the text representation if it was explicit
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
