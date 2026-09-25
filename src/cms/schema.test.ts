import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { generateZodSchema } from './schema'
import { defineContentType } from './define'

const testType = defineContentType({
  slug: 'test',
  tableName: 'test',
  label: { singular: 'Test', plural: 'Tests' },
  basePath: '/test',
  adminPath: '/admin/test',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'description', type: 'textarea', maxLength: 500 },
    { name: 'content', type: 'markdown' },
    { name: 'website', type: 'url' },
    { name: 'year', type: 'number', min: 1900, max: 2100 },
    { name: 'status', type: 'select', options: ['draft', 'review', 'final'] },
    { name: 'featured', type: 'boolean' },
  ],
  relationships: [],
  metadata: { titleField: 'name', descriptionField: 'description' },
})

describe('generateZodSchema', () => {
  const schema = generateZodSchema(testType)

  it('validates a complete valid object', () => {
    const result = schema.safeParse({
      name: 'Test Item',
      slug: 'test-item',
      description: 'A description',
      content: '# Markdown',
      website: 'https://example.com',
      year: 2025,
      status: 'draft',
      featured: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = schema.safeParse({ slug: 'test' })
    expect(result.success).toBe(false)
  })

  it('enforces maxLength on text fields', () => {
    const result = schema.safeParse({
      name: 'x'.repeat(201),
      slug: 'test',
    })
    expect(result.success).toBe(false)
  })

  it('enforces slug format', () => {
    const result = schema.safeParse({
      name: 'Test',
      slug: 'Invalid Slug!',
    })
    expect(result.success).toBe(false)
  })

  it('enforces number min/max', () => {
    const result = schema.safeParse({
      name: 'Test',
      slug: 'test',
      year: 1800,
    })
    expect(result.success).toBe(false)
  })

  it('enforces select options', () => {
    const result = schema.safeParse({
      name: 'Test',
      slug: 'test',
      status: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('makes non-required fields optional', () => {
    const result = schema.safeParse({
      name: 'Test',
      slug: 'test',
    })
    expect(result.success).toBe(true)
  })

  it('validates URL format', () => {
    const result = schema.safeParse({
      name: 'Test',
      slug: 'test',
      website: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })
})

describe('generateZodSchema — blank and required handling', () => {
  const schema = generateZodSchema(testType)

  it('normalises blank optional url/number/select/text fields to null', () => {
    const result = schema.safeParse({
      name: 'Test',
      slug: 'test',
      description: '',
      content: '',
      website: '',
      year: '',
      status: '',
    })
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      description: null,
      content: null,
      website: null,
      year: null,
      status: null,
    })
  })

  it('treats whitespace-only optional url as blank', () => {
    const result = schema.safeParse({ name: 'Test', slug: 'test', website: '   ' })
    expect(result.success).toBe(true)
    expect(result.data?.website).toBeNull()
  })

  it('normalises blank optional date fields to null', () => {
    const dated = defineContentType({
      ...testType,
      fields: [{ name: 'name', type: 'text', required: true }, { name: 'when', type: 'date' }],
    })
    const result = generateZodSchema(dated).safeParse({ name: 'x', when: '' })
    expect(result.success).toBe(true)
    expect(result.data?.when).toBeNull()
  })

  it('rejects empty string on required text fields', () => {
    const result = schema.safeParse({ name: '', slug: 'test' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['name'])
  })

  it('rejects empty string on required number/url fields', () => {
    const strict = defineContentType({
      ...testType,
      fields: [
        { name: 'year', type: 'number', required: true },
        { name: 'site', type: 'url', required: true },
      ],
    })
    const s = generateZodSchema(strict)
    expect(s.safeParse({ year: '', site: 'https://example.com' }).success).toBe(false)
    expect(s.safeParse({ year: 2020, site: '' }).success).toBe(false)
    expect(s.safeParse({ year: 2020, site: 'https://example.com' }).success).toBe(true)
  })

  it('rejects blank slug', () => {
    expect(schema.safeParse({ name: 'Test', slug: '' }).success).toBe(false)
  })

  it('coerces numeric strings on number fields and rejects non-numeric strings', () => {
    const ok = schema.safeParse({ name: 'Test', slug: 'test', year: '2019' })
    expect(ok.success).toBe(true)
    expect(ok.data?.year).toBe(2019)
    expect(schema.safeParse({ name: 'Test', slug: 'test', year: 'abc' }).success).toBe(false)
  })

  it('still validates non-blank urls', () => {
    expect(schema.safeParse({ name: 'Test', slug: 'test', website: 'nope' }).success).toBe(false)
  })

  it('allows optional fields to be omitted or null', () => {
    expect(schema.safeParse({ name: 'Test', slug: 'test', website: null, year: null }).success).toBe(true)
  })
})

describe('generateZodSchema — tags and json fields', () => {
  const t = defineContentType({
    ...testType,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'keywords', type: 'tags' },
      { name: 'links', type: 'json' },
    ],
  })
  const schema = generateZodSchema(t)

  it('accepts string arrays for tags fields', () => {
    const result = schema.safeParse({ name: 'x', keywords: ['a', 'b'] })
    expect(result.success).toBe(true)
    expect(result.data?.keywords).toEqual(['a', 'b'])
  })

  it('accepts empty arrays and null for tags', () => {
    expect(schema.safeParse({ name: 'x', keywords: [] }).success).toBe(true)
    expect(schema.safeParse({ name: 'x', keywords: null }).success).toBe(true)
  })

  it('rejects non-string tag entries and plain strings', () => {
    expect(schema.safeParse({ name: 'x', keywords: [1, 2] }).success).toBe(false)
    expect(schema.safeParse({ name: 'x', keywords: 'a,b' }).success).toBe(false)
  })

  it('accepts JSON arrays of objects for json fields', () => {
    const links = [{ url: 'https://example.com', label: 'Example', order: 1 }]
    const result = schema.safeParse({ name: 'x', links })
    expect(result.success).toBe(true)
    expect(result.data?.links).toEqual(links)
  })

  it('rejects non-JSON values for json fields', () => {
    expect(schema.safeParse({ name: 'x', links: () => 1 }).success).toBe(false)
  })
})
