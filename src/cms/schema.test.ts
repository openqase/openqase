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
