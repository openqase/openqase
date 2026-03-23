export type FieldType = 'text' | 'textarea' | 'markdown' | 'slug' | 'url' | 'number' | 'select' | 'boolean' | 'date'

export interface FieldDefinition {
  name: string
  type: FieldType
  required?: boolean
  maxLength?: number
  min?: number
  max?: number
  from?: string          // for slug fields: source field name
  options?: string[]     // for select fields
}

export interface RelationshipDefinition {
  name: string
  targetType: string
  junction: string
  foreignKey: string
  targetKey: string
  selectFields?: string[]                          // fields to select from target table (default: ['id', 'name', 'slug'])
  junctionForeignKeyHint?: string                  // PostgREST !fk_name hint for self-referential joins
  targetForeignKeyHint?: string                    // PostgREST !fk_name hint for target side of self-referential joins
  extraJunctionFields?: Record<string, unknown>    // extra fields required by the junction table (e.g. { relation_type: 'related' })
}

export interface AdminExtension {
  position: string       // e.g. 'after:main_content'
  component: string      // component name to render
}

export interface ContentTypeDefinition {
  slug: string
  tableName: string
  label: { singular: string; plural: string }
  basePath: string
  adminPath: string
  fields: FieldDefinition[]
  relationships: RelationshipDefinition[]
  metadata: {
    titleField: string
    descriptionField: string
  }
  adminExtensions: AdminExtension[]
}

const SYSTEM_FIELDS: FieldDefinition[] = [
  { name: 'id', type: 'text', required: true },
  { name: 'published', type: 'boolean' },
  { name: 'created_at', type: 'text' },
  { name: 'updated_at', type: 'text' },
]

export function defineContentType(
  config: Omit<ContentTypeDefinition, 'adminExtensions'> & { adminExtensions?: AdminExtension[] }
): ContentTypeDefinition {
  const definition: ContentTypeDefinition = {
    ...config,
    adminExtensions: config.adminExtensions ?? [],
    fields: [...SYSTEM_FIELDS, ...config.fields],
  }

  return Object.freeze(definition)
}
