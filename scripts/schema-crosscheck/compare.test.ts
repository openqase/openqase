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
