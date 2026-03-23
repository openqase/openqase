import { z, type ZodType } from 'zod'
import type { ContentTypeDefinition, FieldDefinition } from './define'

const SLUG_REGEX = /^[a-z0-9-]+$/
const MAX_MARKDOWN_LENGTH = 50000

function fieldToZod(field: FieldDefinition): ZodType {
  let schema: ZodType

  switch (field.type) {
    case 'text':
      schema = z.string().max(field.maxLength ?? 500)
      break
    case 'textarea':
      schema = z.string().max(field.maxLength ?? 5000)
      break
    case 'markdown':
      schema = z.string().max(field.maxLength ?? MAX_MARKDOWN_LENGTH)
      break
    case 'slug':
      schema = z.string().regex(SLUG_REGEX, 'Slug must contain only lowercase letters, numbers, and hyphens')
      break
    case 'url':
      // Note: z.string().url() is deprecated in Zod v4 (prefer z.url()), but still works.
      // Using the chained form here for consistency with .optional()/.nullable() chaining.
      schema = z.string().url()
      break
    case 'number': {
      let num = z.number()
      if (field.min !== undefined) num = num.min(field.min)
      if (field.max !== undefined) num = num.max(field.max)
      schema = num
      break
    }
    case 'select':
      schema = z.enum(field.options as [string, ...string[]])
      break
    case 'boolean':
      schema = z.boolean()
      break
    case 'date':
      schema = z.string().date()
      break
    default:
      schema = z.string()
  }

  if (!field.required) {
    schema = schema.optional().nullable() as ZodType
  }

  return schema
}

// System fields (id, published, created_at, updated_at) are excluded from
// validation schemas — they are managed by the database/operations layer
const SYSTEM_FIELD_NAMES = new Set(['id', 'published', 'created_at', 'updated_at'])

export function generateZodSchema(contentType: ContentTypeDefinition): z.ZodObject<any> {
  const shape: Record<string, ZodType> = {}

  for (const field of contentType.fields) {
    if (SYSTEM_FIELD_NAMES.has(field.name)) continue
    shape[field.name] = fieldToZod(field)
  }

  return z.object(shape)
}
