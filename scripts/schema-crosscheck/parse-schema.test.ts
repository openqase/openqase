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
