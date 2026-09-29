import { z, type ZodType } from 'zod'
import type { ContentTypeDefinition, FieldDefinition } from './define'

const SLUG_REGEX = /^[a-z0-9-]+$/
const MAX_MARKDOWN_LENGTH = 50000
const MAX_TAG_LENGTH = 200

// Field types whose blank input ('') means "no value". Admin forms initialise
// optional inputs to '' and send them as-is, so for optional fields we store
// null instead of rejecting '' (e.g. '' is not a valid URL, date, enum or number).
// Slugs are deliberately excluded: a blank slug is always an error.
const BLANK_IS_NULL_TYPES = new Set<FieldDefinition['type']>([
  'text', 'textarea', 'markdown', 'url', 'number', 'select', 'date',
])

function isBlankString(value: unknown): boolean {
  return typeof value === 'string' && value.trim() === ''
}

/**
 * Normalise raw input before validation:
 * - optional string-ish fields: '' → null
 * - required string-ish fields: '' → undefined (so it fails as "required")
 * - number fields: numeric strings → number (admin forms bind number inputs
 *   to plain <Input> elements, so values arrive as strings like "2019")
 */
function preprocessorFor(field: FieldDefinition): ((value: unknown) => unknown) | null {
  if (!BLANK_IS_NULL_TYPES.has(field.type)) return null

  return (value: unknown) => {
    if (isBlankString(value)) return field.required ? undefined : null
    if (field.type === 'number' && typeof value === 'string') {
      const n = Number(value.trim())
      return Number.isNaN(n) ? value : n
    }
    return value
  }
}

function baseSchema(field: FieldDefinition): ZodType {
  const requiredMessage = `${field.name} is required`

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'markdown': {
      const defaultMax = field.type === 'text' ? 500 : field.type === 'textarea' ? 5000 : MAX_MARKDOWN_LENGTH
      let str = z.string({ error: requiredMessage }).max(field.maxLength ?? defaultMax)
      if (field.required) str = str.min(1, requiredMessage)
      return str
    }
    case 'slug':
      return z.string({ error: requiredMessage }).regex(SLUG_REGEX, 'Slug must contain only lowercase letters, numbers, and hyphens')
    case 'url':
      // Note: z.string().url() is deprecated in Zod v4 (prefer z.url()), but still works.
      return z.string({ error: requiredMessage }).url(`${field.name} must be a valid URL`)
    case 'number': {
      let num = z.number({ error: `${field.name} must be a number` })
      if (field.min !== undefined) num = num.min(field.min)
      if (field.max !== undefined) num = num.max(field.max)
      return num
    }
    case 'select':
      return z.enum(field.options as [string, ...string[]])
    case 'boolean':
      return z.boolean()
    case 'date':
      return z.string({ error: requiredMessage }).date()
    case 'tags':
      // text[] columns (e.g. algorithms.use_cases, personas.expertise, blog_posts.tags)
      return z.array(z.string().max(field.maxLength ?? MAX_TAG_LENGTH))
    case 'json':
      // jsonb columns (e.g. case_studies.resource_links). Any JSON value is accepted;
      // shape-specific validation lives in the editing component.
      return z.json()
    default:
      return z.string()
  }
}

function fieldToZod(field: FieldDefinition): ZodType {
  let schema = baseSchema(field)
  if (!field.required) schema = schema.nullable()

  const preprocess = preprocessorFor(field)
  if (preprocess) schema = z.preprocess(preprocess, schema)

  // .optional() is applied outermost so a missing key is always allowed for
  // optional fields (undefined never reaches the preprocessor).
  if (!field.required) schema = schema.optional()

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
