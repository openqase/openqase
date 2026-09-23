import type { ContentTypeDefinition } from './define'

const SYSTEM_FIELD_NAMES = new Set(['id', 'published', 'created_at', 'updated_at'])

interface ParsedFormData {
  data: Record<string, unknown>
  relationships: Record<string, string[]>
}

/**
 * Parse a tags field: accepts a JSON array of strings (preferred) or a
 * comma-separated list. Blank entries are dropped.
 */
function parseTags(raw: string): string[] {
  const trimmed = raw.trim()
  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map(v => String(v).trim()).filter(Boolean)
      }
    } catch {
      // fall through to comma-separated parsing
    }
  }
  return trimmed.split(',').map(v => v.trim()).filter(Boolean)
}

export function parseFormData(formData: FormData, contentType: ContentTypeDefinition): ParsedFormData {
  const data: Record<string, unknown> = {}
  const relationships: Record<string, string[]> = {}

  for (const field of contentType.fields) {
    if (SYSTEM_FIELD_NAMES.has(field.name)) continue

    const raw = formData.get(field.name) as string | null
    if (raw === null || raw === undefined) continue

    if (raw === '' && !field.required) {
      data[field.name] = null
      continue
    }

    switch (field.type) {
      case 'number':
        data[field.name] = raw === '' ? null : Number(raw)
        break
      case 'boolean':
        data[field.name] = raw === 'true'
        break
      case 'tags':
        data[field.name] = parseTags(raw)
        break
      case 'json':
        try {
          data[field.name] = JSON.parse(raw)
        } catch {
          throw new Error(`${field.name} must be valid JSON`)
        }
        break
      default:
        data[field.name] = raw
    }
  }

  for (const rel of contentType.relationships) {
    const raw = formData.get(`rel:${rel.name}`) as string | null
    if (raw) {
      try {
        relationships[rel.name] = JSON.parse(raw)
      } catch {
        relationships[rel.name] = []
      }
    }
  }

  return { data, relationships }
}
