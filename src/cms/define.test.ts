import { describe, it, expect } from 'vitest'
import { defineContentType } from './define'

describe('defineContentType', () => {
  it('returns a frozen content type definition', () => {
    const ct = defineContentType({
      slug: 'industries',
      tableName: 'industries',
      label: { singular: 'Industry', plural: 'Industries' },
      basePath: '/paths/industry',
      adminPath: '/admin/industries',
      fields: [
        { name: 'name', type: 'text', required: true, maxLength: 200 },
        { name: 'slug', type: 'slug', from: 'name' },
      ],
      relationships: [],
      metadata: { titleField: 'name', descriptionField: 'description' },
    })

    expect(ct.slug).toBe('industries')
    expect(ct.tableName).toBe('industries')
    expect(ct.fields).toHaveLength(6) // 4 system fields + 2 user fields
    expect(ct.label.singular).toBe('Industry')
    expect(Object.isFrozen(ct)).toBe(true)
  })

  it('includes system fields (id, published, created_at, updated_at) automatically', () => {
    const ct = defineContentType({
      slug: 'test',
      tableName: 'test',
      label: { singular: 'Test', plural: 'Tests' },
      basePath: '/test',
      adminPath: '/admin/test',
      fields: [{ name: 'name', type: 'text', required: true }],
      relationships: [],
      metadata: { titleField: 'name', descriptionField: 'name' },
    })

    const fieldNames = ct.fields.map(f => f.name)
    expect(fieldNames).toContain('id')
    expect(fieldNames).toContain('published')
    expect(fieldNames).toContain('created_at')
    expect(fieldNames).toContain('updated_at')
  })

  it('defaults optional properties', () => {
    const ct = defineContentType({
      slug: 'test',
      tableName: 'test',
      label: { singular: 'Test', plural: 'Tests' },
      basePath: '/test',
      adminPath: '/admin/test',
      fields: [],
      relationships: [],
      metadata: { titleField: 'name', descriptionField: 'name' },
    })

    expect(ct.adminExtensions).toEqual([])
  })
})
