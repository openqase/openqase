import { describe, it, expect } from 'vitest'
import { parseFormData } from './parse-form-data'
import { defineContentType } from './define'

const testType = defineContentType({
  slug: 'test',
  tableName: 'test',
  label: { singular: 'Test', plural: 'Tests' },
  basePath: '/test',
  adminPath: '/admin/test',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'count', type: 'number' },
    { name: 'active', type: 'boolean' },
    { name: 'website', type: 'url' },
    { name: 'description', type: 'textarea' },
  ],
  relationships: [
    { name: 'industries', targetType: 'industries', junction: 'test_industry', foreignKey: 'test_id', targetKey: 'industry_id' },
  ],
  metadata: { titleField: 'name', descriptionField: 'description' },
})

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.append(k, v)
  return fd
}

describe('parseFormData', () => {
  it('extracts text fields as strings', () => {
    const fd = makeFormData({ name: 'Hello', slug: 'hello' })
    const { data } = parseFormData(fd, testType)
    expect(data.name).toBe('Hello')
    expect(data.slug).toBe('hello')
  })

  it('coerces number fields from strings', () => {
    const fd = makeFormData({ name: 'Test', slug: 'test', count: '42' })
    const { data } = parseFormData(fd, testType)
    expect(data.count).toBe(42)
  })

  it('coerces boolean fields from strings', () => {
    const fd = makeFormData({ name: 'Test', slug: 'test', active: 'true' })
    const { data } = parseFormData(fd, testType)
    expect(data.active).toBe(true)
  })

  it('treats empty strings as null for optional fields', () => {
    const fd = makeFormData({ name: 'Test', slug: 'test', website: '', description: '' })
    const { data } = parseFormData(fd, testType)
    expect(data.website).toBeNull()
    expect(data.description).toBeNull()
  })

  it('extracts relationship IDs from JSON arrays', () => {
    const fd = makeFormData({
      name: 'Test',
      slug: 'test',
      'rel:industries': JSON.stringify(['id-1', 'id-2']),
    })
    const { relationships } = parseFormData(fd, testType)
    expect(relationships.industries).toEqual(['id-1', 'id-2'])
  })

  it('ignores system fields and unknown fields', () => {
    const fd = makeFormData({ name: 'Test', slug: 'test', id: 'abc', unknown_field: 'value' })
    const { data } = parseFormData(fd, testType)
    expect(data).not.toHaveProperty('id')
    expect(data).not.toHaveProperty('unknown_field')
  })
})
