# CMS Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 9 duplicated content type implementations with a config-driven CMS engine where content types are defined once and operations/validation/metadata are derived from that definition.

**Architecture:** A `src/cms/` module containing content type definitions, a registry, auto-generated Zod schemas, a transport-agnostic operations layer, and thin Server Action/API route wrappers. Public pages consume the registry for metadata and static params but keep per-type layout components.

**Tech Stack:** TypeScript, Zod v4, Supabase, Next.js App Router (Server Actions + Route Handlers), Vitest

**Spec:** `docs/superpowers/specs/2026-03-23-cms-engine-design.md`

---

## File Structure

### New Files (src/cms/)

| File | Responsibility |
|------|---------------|
| `src/cms/define.ts` | `defineContentType()` function + TypeScript types (`ContentTypeDefinition`, `FieldDefinition`, `RelationshipDefinition`) |
| `src/cms/registry.ts` | Collects all content types into a Map, provides `getContentType()`, `getAllContentTypes()`, `getContentTypeByTableName()` |
| `src/cms/schema.ts` | `generateZodSchema(contentType)` — builds a Zod object schema from field definitions |
| `src/cms/parse-form-data.ts` | `parseFormData(formData, contentType)` — extracts and coerces form values using field definitions |
| `src/cms/page-helpers.ts` | `generateStaticParamsFor(type)`, `generateMetadataFor(type)` — shared public page plumbing |
| `src/cms/actions.ts` | `'use server'` — `saveContentAction()`, `publishAction()`, `unpublishAction()`, `deleteAction()` |
| `src/cms/operations/index.ts` | Re-exports all operations |
| `src/cms/operations/fetch.ts` | `fetchContent()`, `fetchContentBySlug()`, `listContent()` |
| `src/cms/operations/create.ts` | `createContent()` |
| `src/cms/operations/update.ts` | `updateContent()` |
| `src/cms/operations/publish.ts` | `publishContent()`, `unpublishContent()` |
| `src/cms/operations/delete.ts` | `deleteContent()` |
| `src/cms/operations/relationships.ts` | `fetchRelationships()`, `saveRelationships()`, `buildRelationshipSelect()` |
| `src/cms/operations/revalidate.ts` | `revalidateContentType(type, slug?)` — centralized path revalidation |
| `src/cms/types/industries.ts` | Industries content type definition (migration pilot) |
| `src/cms/types/personas.ts` | Personas content type definition |
| `src/cms/types/blog-posts.ts` | Blog posts content type definition |
| `src/cms/types/quantum-software.ts` | Quantum software content type definition |
| `src/cms/types/quantum-hardware.ts` | Quantum hardware content type definition |
| `src/cms/types/quantum-companies.ts` | Quantum companies content type definition |
| `src/cms/types/partner-companies.ts` | Partner companies content type definition |
| `src/cms/types/algorithms.ts` | Algorithms content type definition |
| `src/cms/types/case-studies.ts` | Case studies content type definition |
| `src/cms/operations/case-study-extras.ts` | `bulkUpdateStatus()`, `softDeleteContent()`, `recoverContent()` |

### New Test Files

| File | Tests |
|------|-------|
| `src/cms/define.test.ts` | `defineContentType()` validates config, rejects invalid definitions |
| `src/cms/schema.test.ts` | `generateZodSchema()` produces correct Zod schemas for all field types |
| `src/cms/parse-form-data.test.ts` | `parseFormData()` correctly extracts/coerces values from FormData |
| `src/cms/registry.test.ts` | Registry lookup, duplicate slug detection, getByTableName |
| `src/cms/operations/fetch.test.ts` | `listContent()`, `fetchContentBySlug()` with mocked Supabase |
| `src/cms/operations/mutations.test.ts` | `createContent()`, `updateContent()` validation, auth, relationship handling |
| `src/cms/operations/publish.test.ts` | `publishContent()`, `unpublishContent()` |
| `src/cms/operations/relationships.test.ts` | Junction table CRUD, bidirectional relationships |
| `src/cms/page-helpers.test.ts` | `generateStaticParamsFor()`, `generateMetadataFor()` |

### Files Modified During Migration

- `src/app/admin/industries/[id]/actions.ts` → replaced by `src/cms/actions.ts`
- `src/app/api/industries/route.ts` → replaced by operations layer calls
- `src/app/paths/industry/[slug]/page.tsx` → use `page-helpers` + `fetchContentBySlug`
- (Same pattern for all 9 content types)

### Files Deleted After Full Migration

- 9 × `src/app/admin/[type]/[id]/actions.ts`
- 9 × `src/app/api/[type]/route.ts`
- `src/utils/content-management.ts`
- `src/lib/relationship-queries.ts`
- RELATIONSHIP_MAPS from `src/lib/content-fetchers.ts`
- Content-specific schemas from `src/lib/validation/schemas.ts`

---

## Tasks

### Task 1: Content Type Definition System

**Files:**
- Create: `src/cms/define.ts`
- Test: `src/cms/define.test.ts`

- [ ] **Step 1: Write failing tests for defineContentType**

```typescript
// src/cms/define.test.ts
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
    expect(ct.fields).toHaveLength(2)
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/cms/define.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement defineContentType and TypeScript types**

```typescript
// src/cms/define.ts

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
  selectFields?: string[]          // fields to select from target table (default: ['id', 'name', 'slug'])
  junctionForeignKeyHint?: string  // PostgREST !fk_name hint for self-referential joins
  targetForeignKeyHint?: string    // PostgREST !fk_name hint for target side of self-referential joins
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/cms/define.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/cms/define.ts src/cms/define.test.ts
git commit -m "feat(cms): add content type definition system"
```

---

### Task 2: Zod Schema Generation

**Files:**
- Create: `src/cms/schema.ts`
- Test: `src/cms/schema.test.ts`

- [ ] **Step 1: Write failing tests for generateZodSchema**

```typescript
// src/cms/schema.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/cms/schema.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement generateZodSchema**

```typescript
// src/cms/schema.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/cms/schema.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/cms/schema.ts src/cms/schema.test.ts
git commit -m "feat(cms): add Zod schema generation from field definitions"
```

---

### Task 3: FormData Parser

**Files:**
- Create: `src/cms/parse-form-data.ts`
- Test: `src/cms/parse-form-data.test.ts`

- [ ] **Step 1: Write failing tests for parseFormData**

```typescript
// src/cms/parse-form-data.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/cms/parse-form-data.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement parseFormData**

```typescript
// src/cms/parse-form-data.ts
import type { ContentTypeDefinition } from './define'

const SYSTEM_FIELD_NAMES = new Set(['id', 'published', 'created_at', 'updated_at'])

interface ParsedFormData {
  data: Record<string, unknown>
  relationships: Record<string, string[]>
}

export function parseFormData(formData: FormData, contentType: ContentTypeDefinition): ParsedFormData {
  const data: Record<string, unknown> = {}
  const relationships: Record<string, string[]> = {}

  // Extract field values
  for (const field of contentType.fields) {
    if (SYSTEM_FIELD_NAMES.has(field.name)) continue

    const raw = formData.get(field.name) as string | null
    if (raw === null || raw === undefined) continue

    // Empty strings become null for optional fields
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
      default:
        data[field.name] = raw
    }
  }

  // Extract relationship IDs (prefixed with "rel:")
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/cms/parse-form-data.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/cms/parse-form-data.ts src/cms/parse-form-data.test.ts
git commit -m "feat(cms): add generic FormData parser with type coercion"
```

---

### Task 4: Registry

**Files:**
- Create: `src/cms/registry.ts`
- Create: `src/cms/types/industries.ts` (first content type — migration pilot)
- Test: `src/cms/registry.test.ts`

- [ ] **Step 1: Write the industries content type definition**

Read the current `src/app/admin/industries/[id]/actions.ts` (lines 9-16) and `src/lib/content-fetchers.ts` (RELATIONSHIP_MAPS for industries) to get the exact fields and relationships. Then write:

```typescript
// src/cms/types/industries.ts
import { defineContentType } from '../define'

export const industries = defineContentType({
  slug: 'industries',
  tableName: 'industries',
  label: { singular: 'Industry', plural: 'Industries' },
  basePath: '/paths/industry',
  adminPath: '/admin/industries',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'description', type: 'textarea', maxLength: 1000 },
    { name: 'main_content', type: 'markdown' },
    { name: 'icon', type: 'text' },
  ],
  relationships: [
    {
      name: 'algorithms',
      targetType: 'algorithms',
      junction: 'algorithm_industry_relations',
      foreignKey: 'industry_id',
      targetKey: 'algorithm_id',
    },
    {
      name: 'case_studies',
      targetType: 'case-studies',
      junction: 'case_study_industry_relations',
      foreignKey: 'industry_id',
      targetKey: 'case_study_id',
    },
    {
      name: 'personas',
      targetType: 'personas',
      junction: 'persona_industry_relations',
      foreignKey: 'industry_id',
      targetKey: 'persona_id',
    },
  ],
  metadata: {
    titleField: 'name',
    descriptionField: 'description',
  },
})
```

- [ ] **Step 2: Write failing tests for registry**

```typescript
// src/cms/registry.test.ts
import { describe, it, expect } from 'vitest'
import { getContentType, getAllContentTypes, getContentTypeByTableName } from './registry'

describe('registry', () => {
  it('looks up content type by slug', () => {
    const ct = getContentType('industries')
    expect(ct).toBeDefined()
    expect(ct!.tableName).toBe('industries')
  })

  it('returns undefined for unknown slug', () => {
    expect(getContentType('nonexistent')).toBeUndefined()
  })

  it('looks up by table name', () => {
    const ct = getContentTypeByTableName('industries')
    expect(ct).toBeDefined()
    expect(ct!.slug).toBe('industries')
  })

  it('returns all registered content types', () => {
    const all = getAllContentTypes()
    expect(all.length).toBeGreaterThanOrEqual(1)
    expect(all.some(ct => ct.slug === 'industries')).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/cms/registry.test.ts`
Expected: FAIL

- [ ] **Step 4: Implement registry**

```typescript
// src/cms/registry.ts
import type { ContentTypeDefinition } from './define'
import { industries } from './types/industries'

// Add content types here as they are migrated
const contentTypes: ContentTypeDefinition[] = [
  industries,
]

const bySlug = new Map(contentTypes.map(ct => [ct.slug, ct]))
const byTable = new Map(contentTypes.map(ct => [ct.tableName, ct]))

export function getContentType(slug: string): ContentTypeDefinition | undefined {
  return bySlug.get(slug)
}

export function getAllContentTypes(): ContentTypeDefinition[] {
  return contentTypes
}

export function getContentTypeByTableName(tableName: string): ContentTypeDefinition | undefined {
  return byTable.get(tableName)
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/cms/registry.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/cms/registry.ts src/cms/registry.test.ts src/cms/types/industries.ts
git commit -m "feat(cms): add registry and industries type definition"
```

---

### Task 5: Relationship Operations

**Files:**
- Create: `src/cms/operations/relationships.ts`
- Test: `src/cms/operations/relationships.test.ts`

- [ ] **Step 1: Write failing tests for relationship operations**

```typescript
// src/cms/operations/relationships.test.ts
import { describe, it, expect, vi } from 'vitest'
import { buildRelationshipSelect, flattenRelationships } from './relationships'
import { defineContentType } from '../define'

const testType = defineContentType({
  slug: 'test',
  tableName: 'test',
  label: { singular: 'Test', plural: 'Tests' },
  basePath: '/test',
  adminPath: '/admin/test',
  fields: [{ name: 'name', type: 'text', required: true }],
  relationships: [
    { name: 'industries', targetType: 'industries', junction: 'test_industry_relations', foreignKey: 'test_id', targetKey: 'industry_id' },
    { name: 'case_studies', targetType: 'case-studies', junction: 'test_case_study_relations', foreignKey: 'test_id', targetKey: 'case_study_id' },
  ],
  metadata: { titleField: 'name', descriptionField: 'name' },
})

describe('buildRelationshipSelect', () => {
  it('builds a Supabase select string with nested joins', () => {
    const select = buildRelationshipSelect(testType)
    expect(select).toContain('test_industry_relations(industries(id, name, slug))')
    expect(select).toContain('test_case_study_relations(case_studies(id, title, slug))')
    expect(select).toStartWith('*,')
  })

  it('uses custom selectFields when specified', () => {
    const customType = defineContentType({
      slug: 'custom',
      tableName: 'custom',
      label: { singular: 'Custom', plural: 'Customs' },
      basePath: '/custom',
      adminPath: '/admin/custom',
      fields: [{ name: 'name', type: 'text', required: true }],
      relationships: [
        {
          name: 'algorithms',
          targetType: 'algorithms',
          junction: 'custom_algorithm_relations',
          foreignKey: 'custom_id',
          targetKey: 'algorithm_id',
          selectFields: ['id', 'name', 'slug', 'quantum_advantage', 'use_cases'],
        },
      ],
      metadata: { titleField: 'name', descriptionField: 'name' },
    })
    const select = buildRelationshipSelect(customType)
    expect(select).toContain('custom_algorithm_relations(algorithms(id, name, slug, quantum_advantage, use_cases))')
  })

  it('handles self-referential relationships with FK hints', () => {
    const blogType = defineContentType({
      slug: 'blog-posts',
      tableName: 'blog_posts',
      label: { singular: 'Blog Post', plural: 'Blog Posts' },
      basePath: '/blog',
      adminPath: '/admin/blog-posts',
      fields: [{ name: 'title', type: 'text', required: true }],
      relationships: [
        {
          name: 'related_posts',
          targetType: 'blog-posts',
          junction: 'blog_post_relations',
          foreignKey: 'blog_post_id',
          targetKey: 'related_blog_post_id',
          junctionForeignKeyHint: 'blog_post_relations_blog_post_id_fkey',
          targetForeignKeyHint: 'blog_post_relations_related_blog_post_id_fkey',
          selectFields: ['id', 'title', 'slug', 'published_at', 'author', 'category'],
        },
      ],
      metadata: { titleField: 'title', descriptionField: 'title' },
    })
    const select = buildRelationshipSelect(blogType)
    expect(select).toContain('blog_post_relations!blog_post_relations_blog_post_id_fkey')
    expect(select).toContain('blog_posts!blog_post_relations_related_blog_post_id_fkey')
  })

  it('returns just * for types with no relationships', () => {
    const noRels = defineContentType({
      slug: 'simple',
      tableName: 'simple',
      label: { singular: 'Simple', plural: 'Simples' },
      basePath: '/simple',
      adminPath: '/admin/simple',
      fields: [{ name: 'name', type: 'text', required: true }],
      relationships: [],
      metadata: { titleField: 'name', descriptionField: 'name' },
    })
    expect(buildRelationshipSelect(noRels)).toBe('*')
  })
})

describe('flattenRelationships', () => {
  it('extracts related entities from nested Supabase join shape', () => {
    const raw = {
      id: '1',
      name: 'Test',
      test_industry_relations: [
        { industries: { id: 'ind-1', name: 'Finance', slug: 'finance' } },
        { industries: { id: 'ind-2', name: 'Healthcare', slug: 'healthcare' } },
      ],
      test_case_study_relations: [
        { case_studies: { id: 'cs-1', title: 'Study 1', slug: 'study-1' } },
      ],
    }

    const result = flattenRelationships(raw, testType)
    expect(result.industries).toEqual([
      { id: 'ind-1', name: 'Finance', slug: 'finance' },
      { id: 'ind-2', name: 'Healthcare', slug: 'healthcare' },
    ])
    expect(result.case_studies).toEqual([
      { id: 'cs-1', title: 'Study 1', slug: 'study-1' },
    ])
  })

  it('returns empty arrays when junction data is missing', () => {
    const raw = { id: '1', name: 'Test' }
    const result = flattenRelationships(raw, testType)
    expect(result.industries).toEqual([])
    expect(result.case_studies).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/cms/operations/relationships.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement relationship operations**

Read `src/lib/content-fetchers.ts` lines 9-63 (RELATIONSHIP_MAPS) and lines 69-206 (filterRelationships) to understand the current nested join shape. Then implement:

```typescript
// src/cms/operations/relationships.ts
import type { ContentTypeDefinition, RelationshipDefinition } from '../define'
import { getContentType } from '../registry'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'

/**
 * Builds a Supabase select string with nested joins for all relationships.
 * e.g., "*, algorithm_industry_relations(industries(id, name, slug))"
 */
export function buildRelationshipSelect(contentType: ContentTypeDefinition): string {
  if (contentType.relationships.length === 0) return '*'

  const joins = contentType.relationships.map(rel => {
    // Determine the target table name from the registry
    const targetType = getContentType(rel.targetType)
    const targetTable = targetType?.tableName ?? rel.targetType.replace(/-/g, '_')

    // Use custom selectFields if provided, otherwise default to id + name/title + slug
    const defaultTitleField = targetTable === 'case_studies' || targetTable === 'blog_posts' ? 'title' : 'name'
    const fields = rel.selectFields?.join(', ') ?? `id, ${defaultTitleField}, slug`

    // Handle self-referential joins needing PostgREST FK disambiguation
    if (rel.junctionForeignKeyHint) {
      const junctionRef = `${rel.junction}!${rel.junctionForeignKeyHint}`
      const targetRef = rel.targetForeignKeyHint
        ? `${targetTable}!${rel.targetForeignKeyHint}`
        : targetTable
      return `${junctionRef}(${rel.targetKey}, ${targetRef}(${fields}))`
    }

    return `${rel.junction}(${targetTable}(${fields}))`
  })

  return `*, ${joins.join(', ')}`
}

/**
 * Flattens nested Supabase join results into clean arrays.
 * Input:  { test_industry_relations: [{ industries: { id, name, slug } }] }
 * Output: { industries: [{ id, name, slug }] }
 */
export function flattenRelationships(
  raw: Record<string, unknown>,
  contentType: ContentTypeDefinition
): Record<string, Record<string, unknown>[]> {
  const result: Record<string, Record<string, unknown>[]> = {}

  for (const rel of contentType.relationships) {
    const targetType = getContentType(rel.targetType)
    const targetTable = targetType?.tableName ?? rel.targetType.replace(/-/g, '_')
    const junctionData = raw[rel.junction] as Array<Record<string, unknown>> | undefined

    if (!junctionData || !Array.isArray(junctionData)) {
      result[rel.name] = []
      continue
    }

    result[rel.name] = junctionData
      .map(row => row[targetTable] as Record<string, unknown>)
      .filter(Boolean)
  }

  return result
}

/**
 * Saves relationship data by deleting existing junction rows and inserting new ones.
 */
export async function saveRelationships(
  contentType: ContentTypeDefinition,
  contentId: string,
  relationships: Record<string, string[]>
): Promise<void> {
  const supabase = createServiceRoleSupabaseClient()

  for (const rel of contentType.relationships) {
    const ids = relationships[rel.name]
    if (ids === undefined) continue

    // Delete existing
    await supabase
      .from(rel.junction)
      .delete()
      .eq(rel.foreignKey, contentId)

    // Insert new
    if (ids.length > 0) {
      const rows = ids.map(targetId => ({
        [rel.foreignKey]: contentId,
        [rel.targetKey]: targetId,
      }))
      await supabase.from(rel.junction).insert(rows)
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/cms/operations/relationships.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/cms/operations/relationships.ts src/cms/operations/relationships.test.ts
git commit -m "feat(cms): add relationship operations — select builder, flattener, save"
```

---

### Task 6: Fetch Operations

**Files:**
- Create: `src/cms/operations/fetch.ts`
- Test: `src/cms/operations/fetch.test.ts`

- [ ] **Step 1: Write failing tests for fetch operations**

```typescript
// src/cms/operations/fetch.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockOrder = vi.fn(() => ({ range: vi.fn(() => ({ data: [], count: 0 })) }))
const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockOrder }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
}))

// Must import after mocks
const { fetchContentBySlug, listContent } = await import('./fetch')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchContentBySlug', () => {
  it('returns flattened item when found', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: '1', name: 'Finance', slug: 'finance',
        case_study_industry_relations: [
          { case_studies: { id: 'cs-1', title: 'Study 1', slug: 'study-1' } },
        ],
      },
      error: null,
    })
    const result = await fetchContentBySlug('industries', 'finance')
    expect(result).toBeDefined()
    expect(result!.case_studies).toEqual([{ id: 'cs-1', title: 'Study 1', slug: 'study-1' }])
  })

  it('returns null when not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    const result = await fetchContentBySlug('industries', 'nonexistent')
    expect(result).toBeNull()
  })

  it('returns null for unknown content type', async () => {
    const result = await fetchContentBySlug('nonexistent', 'slug')
    expect(result).toBeNull()
  })
})

describe('listContent', () => {
  it('queries with published filter by default', async () => {
    await listContent('industries')
    expect(mockSelect).toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('published', true)
  })
})
```

Reference `src/lib/content-fetchers.ts` lines 217-253 (`getStaticContentWithRelationships`) and lines 259-313 (`getStaticContentList`) for current query patterns.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/cms/operations/fetch.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement fetch operations**

Key implementation details:
- `fetchContentBySlug(type, slug)`: looks up content type from registry, calls `supabase.from(tableName).select(buildRelationshipSelect(ct)).eq('slug', slug).single()`, then flattens with `flattenRelationships()`. Wrap the exported function in `React.cache()` for request deduplication (this is the single caching layer — page-helpers does NOT add another).
- `listContent(type, options)`: supports pagination (`page`, `pageSize`), search (`search` param searches name/title + description), published filter (default: published only). Returns `{ items, total }`.
- `fetchContent(type, id)`: by ID, same pattern as bySlug but with `.eq('id', id)`.

Reference `src/utils/content-management.ts` lines 25-91 (`fetchContentItems`) for the existing list pattern.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/cms/operations/fetch.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cms/operations/fetch.ts src/cms/operations/fetch.test.ts
git commit -m "feat(cms): add fetch operations with relationship flattening"
```

---

### Task 7: Create and Update Operations

**Files:**
- Create: `src/cms/operations/create.ts`
- Create: `src/cms/operations/update.ts`
- Create: `src/cms/operations/revalidate.ts`
- Test: `src/cms/operations/mutations.test.ts`

- [ ] **Step 1: Write failing tests for createContent and updateContent**

```typescript
// src/cms/operations/mutations.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase
const mockSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }))
const mockUpdate = vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) })) }))
const mockDelete = vi.fn(() => ({ eq: vi.fn() }))
const mockFrom = vi.fn((table: string) => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
}))

const { createContent } = await import('./create')
const { updateContent } = await import('./update')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createContent', () => {
  it('rejects invalid data with validation errors', async () => {
    const result = await createContent('industries', { name: '' })
    expect(result.error).toBeDefined()
  })

  it('creates content and returns data on success', async () => {
    mockSingle.mockResolvedValue({
      data: { id: '1', name: 'Finance', slug: 'finance' },
      error: null,
    })
    const result = await createContent('industries', {
      name: 'Finance',
      slug: 'finance',
    })
    expect(result.data).toBeDefined()
    expect(result.data?.name).toBe('Finance')
  })

  it('returns error for unknown content type', async () => {
    const result = await createContent('nonexistent', { name: 'x' })
    expect(result.error).toBeDefined()
  })
})

describe('updateContent', () => {
  it('updates existing content by ID', async () => {
    mockSingle.mockResolvedValue({
      data: { id: '1', name: 'Updated Finance', slug: 'finance' },
      error: null,
    })
    const result = await updateContent('industries', '1', {
      name: 'Updated Finance',
      slug: 'finance',
    })
    expect(result.data).toBeDefined()
  })
})
```

Reference `src/app/admin/industries/[id]/actions.ts` lines 22-61 (`saveIndustry`) for the current create/update pattern.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/cms/operations/mutations.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement revalidate utility**

```typescript
// src/cms/operations/revalidate.ts
import { revalidatePath } from 'next/cache'
import { getContentType } from '../registry'

export function revalidateContentType(typeSlug: string, slug?: string): void {
  const ct = getContentType(typeSlug)
  if (!ct) return

  revalidatePath(ct.adminPath)
  revalidatePath(ct.basePath)

  if (slug) {
    revalidatePath(`${ct.basePath}/${slug}`)
  }
}
```

- [ ] **Step 4: Implement createContent and updateContent**

Key implementation details:
- Look up content type from registry
- Validate data with `generateZodSchema(ct).safeParse(data)`
- On validation failure: return `{ error: formatted message }`
- Insert/update via `supabase.from(ct.tableName).upsert(data).select().single()`
- Call `saveRelationships()` if relationships provided
- Call `revalidateContentType()`
- Return `{ data: result }`

Reference `src/utils/content-management.ts` lines 155-237 (`saveContentItem`) for the existing upsert pattern.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/cms/operations/mutations.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/cms/operations/create.ts src/cms/operations/update.ts src/cms/operations/revalidate.ts src/cms/operations/mutations.test.ts
git commit -m "feat(cms): add create, update, and revalidate operations"
```

---

### Task 8: Publish and Delete Operations

**Files:**
- Create: `src/cms/operations/publish.ts`
- Create: `src/cms/operations/delete.ts`
- Test: `src/cms/operations/publish.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/cms/operations/publish.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }))
const mockUpdate = vi.fn(() => ({ eq: mockEq }))
const mockDelete = vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))
const mockFrom = vi.fn(() => ({ update: mockUpdate, delete: mockDelete }))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
}))

const { publishContent, unpublishContent } = await import('./publish')
const { deleteContent } = await import('./delete')

beforeEach(() => { vi.clearAllMocks() })

describe('publishContent', () => {
  it('sets published=true and returns success', async () => {
    mockSingle.mockResolvedValue({ data: { id: '1', slug: 'finance', published: true }, error: null })
    const result = await publishContent('industries', '1')
    expect(result.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({ published: true })
  })

  it('returns error for unknown type', async () => {
    const result = await publishContent('nonexistent', '1')
    expect(result.error).toBeDefined()
  })
})

describe('unpublishContent', () => {
  it('sets published=false and returns success', async () => {
    mockSingle.mockResolvedValue({ data: { id: '1', slug: 'finance', published: false }, error: null })
    const result = await unpublishContent('industries', '1')
    expect(result.success).toBe(true)
  })
})

describe('deleteContent', () => {
  it('deletes the row and returns success', async () => {
    const result = await deleteContent('industries', '1')
    expect(result.success).toBe(true)
  })
})
```

Reference `src/app/admin/industries/[id]/actions.ts` lines 63-109 for publish/unpublish pattern.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement publish and delete operations**

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```bash
git add src/cms/operations/publish.ts src/cms/operations/delete.ts src/cms/operations/publish.test.ts
git commit -m "feat(cms): add publish, unpublish, and delete operations"
```

---

### Task 9: Operations Index + Server Actions

**Files:**
- Create: `src/cms/operations/index.ts`
- Create: `src/cms/actions.ts`

- [ ] **Step 1: Create operations index**

```typescript
// src/cms/operations/index.ts
export { createContent } from './create'
export { updateContent } from './update'
export { publishContent, unpublishContent } from './publish'
export { deleteContent } from './delete'
export { fetchContent, fetchContentBySlug, listContent } from './fetch'
```

- [ ] **Step 2: Create unified Server Actions**

```typescript
// src/cms/actions.ts
'use server'

import { getContentType } from './registry'
import { parseFormData } from './parse-form-data'
import { createContent, updateContent, publishContent, unpublishContent, deleteContent } from './operations'

export async function saveContentAction(type: string, formData: FormData) {
  const contentType = getContentType(type)
  if (!contentType) return { error: `Unknown content type: ${type}` }

  const { data, relationships } = parseFormData(formData, contentType)
  const id = formData.get('id') as string | null

  if (id) {
    return updateContent(type, id, data, relationships)
  }
  return createContent(type, data, relationships)
}

export async function publishAction(type: string, id: string) {
  return publishContent(type, id)
}

export async function unpublishAction(type: string, id: string) {
  return unpublishContent(type, id)
}

export async function deleteAction(type: string, id: string) {
  return deleteContent(type, id)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/cms/operations/index.ts src/cms/actions.ts
git commit -m "feat(cms): add operations index and unified server actions"
```

---

### Task 10: Page Helpers

**Files:**
- Create: `src/cms/page-helpers.ts`
- Test: `src/cms/page-helpers.test.ts`

- [ ] **Step 1: Write failing tests for page helpers**

Test: `generateStaticParamsFor` returns a function that produces `{ slug }[]`. `generateMetadataFor` returns a function that produces `{ title, description, openGraph }`. Both use the content type config for field mapping.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement page helpers**

```typescript
// src/cms/page-helpers.ts
import { cache } from 'react'
import { getContentType } from './registry'
import { fetchContentBySlug } from './operations'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'

export function generateStaticParamsFor(typeSlug: string) {
  return async function generateStaticParams() {
    const ct = getContentType(typeSlug)
    if (!ct) return []

    const supabase = createServiceRoleSupabaseClient()
    const { data } = await supabase
      .from(ct.tableName)
      .select('slug')
      .eq('published', true)

    return (data ?? []).map((item: { slug: string }) => ({ slug: item.slug }))
  }
}

// fetchContentBySlug is already wrapped in React.cache() inside fetch.ts
// so we use it directly — no additional caching layer needed

export function generateMetadataFor(typeSlug: string) {
  return async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const ct = getContentType(typeSlug)
    if (!ct) return {}

    const item = await fetchContentBySlug(typeSlug, slug)
    if (!item) return {}

    const title = (item as Record<string, unknown>)[ct.metadata.titleField] as string
    const description = (item as Record<string, unknown>)[ct.metadata.descriptionField] as string

    return {
      title: `${title} | OpenQase`,
      description: description || '',
      openGraph: { title, description: description || '' },
    }
  }
}

// Re-export fetchContentBySlug for page components (already React.cache'd in fetch.ts)
export { fetchContentBySlug } from './operations'
```

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```bash
git add src/cms/page-helpers.ts src/cms/page-helpers.test.ts
git commit -m "feat(cms): add page helpers for staticParams and metadata generation"
```

---

### Task 11: Migrate Industries (End-to-End Pilot)

**Files:**
- Modify: `src/app/admin/industries/[id]/actions.ts` — replace with calls to `cms/actions.ts`
- Modify: `src/app/admin/industries/[id]/client.tsx` — update form to use generic actions
- Modify: `src/app/api/industries/route.ts` — replace with operations layer calls
- Modify: `src/app/paths/industry/[slug]/page.tsx` — use page helpers + fetchContentBySlug

This is the critical validation step. If this works end-to-end, the engine is proven.

- [ ] **Step 1: Update industries Server Actions to use CMS engine**

Replace `src/app/admin/industries/[id]/actions.ts` content with thin wrappers:

```typescript
// src/app/admin/industries/[id]/actions.ts
'use server'

import { saveContentAction, publishAction, unpublishAction } from '@/cms/actions'

export async function saveIndustry(formData: FormData) {
  return saveContentAction('industries', formData)
}

export async function publishIndustry(id: string) {
  return publishAction('industries', id)
}

export async function unpublishIndustry(id: string) {
  return unpublishAction('industries', id)
}
```

- [ ] **Step 2: Update industries API route to use operations**

Replace the GET handler in `src/app/api/industries/route.ts` to use `listContent` and `fetchContentBySlug` from the operations layer. Keep the same URL and response shape. Reference the current handler (lines 19-86) for the exact query parameters it supports.

- [ ] **Step 3: Update industries public page to use page helpers**

```typescript
// src/app/paths/industry/[slug]/page.tsx
import { generateStaticParamsFor, generateMetadataFor, fetchContentBySlug } from '@/cms/page-helpers'

export const generateStaticParams = generateStaticParamsFor('industries')
export const generateMetadata = generateMetadataFor('industries')
export const revalidate = 86400

export default async function IndustryPage({ params }) {
  const { slug } = await params
  const industry = await fetchContentBySlug('industries', slug)
  if (!industry) notFound()

  // Rest of the rendering stays the same, but use flattened relationship shape:
  // industry.case_studies instead of industry.case_study_industry_relations
  // industry.algorithms instead of industry.algorithm_industry_relations
  // industry.personas instead of industry.persona_industry_relations
}
```

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`
- Visit `/paths/industry` — verify list page loads
- Visit `/paths/industry/[any-slug]` — verify detail page renders with relationships
- Visit `/admin/industries` — verify admin list loads
- Visit `/admin/industries/[any-id]` — verify form loads, save works, publish/unpublish works

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(cms): migrate industries to CMS engine (pilot)"
```

---

### Task 12: Migrate Remaining Simple Types

Migrate personas, blog-posts, quantum-software, quantum-hardware, quantum-companies, partner-companies using the same pattern as Task 11.

**For each type:**

- [ ] **Step 1: Create content type definition in `src/cms/types/[type].ts`**

Read the current actions.ts, content-fetchers.ts RELATIONSHIP_MAPS entry, and the database schema (via `src/types/supabase.ts`) to get the exact fields and relationships for this type. Write the `defineContentType()` config.

- [ ] **Step 2: Add to registry**

Import and add to the `contentTypes` array in `src/cms/registry.ts`.

- [ ] **Step 3: Update Server Actions**

Replace the type-specific actions file with thin wrappers calling the generic CMS actions (same pattern as industries in Task 11).

- [ ] **Step 4: Update API route**

Replace GET/POST/DELETE/PATCH handlers with operations layer calls.

- [ ] **Step 5: Update public detail page**

Switch to `generateStaticParamsFor()`, `generateMetadataFor()`, `fetchContentBySlug()`. Update relationship destructuring to use flattened shape.

- [ ] **Step 6: Run tests + manual smoke test**

Run: `npx vitest run`
Smoke test: public page loads, admin form saves, publish/unpublish works.

- [ ] **Step 7: Commit each type individually**

```bash
git commit -m "feat(cms): migrate [type-name] to CMS engine"
```

**Migration order:**
1. personas (similar to industries, 3 relationships)
2. blog-posts (self-referential relationship — **must use `junctionForeignKeyHint`/`targetForeignKeyHint`/`selectFields` on the `blog_post_relations` relationship**. See the self-referential test case in Task 5 for the exact pattern. This validates that `buildRelationshipSelect` handles PostgREST FK disambiguation correctly.)
3. quantum-software (simplest quantum type)
4. quantum-hardware
5. quantum-companies
6. partner-companies

---

### Task 13: Migrate Algorithms

**Files:**
- Create: `src/cms/types/algorithms.ts`
- Modify: `src/app/admin/algorithms/[id]/actions.ts`
- Modify: `src/app/api/algorithms/route.ts`
- Modify: `src/app/paths/algorithm/[slug]/page.tsx`

Algorithms have more fields (steps, use_cases, complexity_class, quantum_volume_required, classical_preprocessing, error_mitigation_required) and the `adminExtensions` for CitationHelper. Read `src/app/admin/algorithms/[id]/client.tsx` and `src/app/admin/algorithms/[id]/actions.ts` for the complete field list.

- [ ] **Step 1: Create algorithms type definition with all fields**

Read `src/types/supabase.ts` for the `algorithms` table definition to get the complete list of database columns. Map each to the appropriate field type.

- [ ] **Step 2: Add to registry**

- [ ] **Step 3: Update Server Actions, API route, public page**

Same pattern as Task 11.

- [ ] **Step 4: Run tests + smoke test**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(cms): migrate algorithms to CMS engine"
```

---

### Task 14: Migrate Case Studies + Type-Specific Operations

**Files:**
- Create: `src/cms/types/case-studies.ts`
- Create: `src/cms/operations/case-study-extras.ts`
- Modify: `src/app/admin/case-studies/[id]/actions.ts`
- Modify: `src/app/api/case-studies/route.ts`
- Modify: `src/app/paths/case-study/[slug]/page.tsx`

Case studies are the most complex: 7 relationships, bulk operations (PATCH handler in API route), soft delete with audit logging, trash management, ResourceLinksEditor admin extension.

- [ ] **Step 0: Investigate case_study_relations self-referential table**

Check whether `case_study_relations` (self-referential, like `blog_post_relations`) is actively used. Search for references in `content-fetchers.ts`, `relationship-queries.ts`, admin components, and API routes. If in use, the type definition needs `junctionForeignKeyHint`/`targetForeignKeyHint` (same pattern as blog-posts). If unused, document that it's deprecated and exclude from the type definition.

Run: `grep -r "case_study_relations" src/ --include="*.ts" --include="*.tsx" -l`

- [ ] **Step 1: Create case-studies type definition**

Read `src/types/supabase.ts` for complete field list. Read `src/app/api/case-studies/route.ts` for all 7 relationship junction tables. Include `adminExtensions` for ResourceLinksEditor. If Step 0 found `case_study_relations` in use, add it as a self-referential relationship with FK hints.

- [ ] **Step 2: Implement case-study-extras operations**

```typescript
// src/cms/operations/case-study-extras.ts
// bulkUpdateStatus(ids, status) — from current PATCH handler (lines 566-590)
// softDeleteContent(type, id, userId) — from deleteContentItem() in content-management.ts
// recoverContent(type, id) — from recoverContentItem() in content-management.ts
```

Reference `src/utils/content-management.ts` lines 239-372 (deleteContentItem) and 373-464 (recoverContentItem) for audit trail and soft delete logic.

- [ ] **Step 3: Add to registry**

- [ ] **Step 4: Update Server Actions, API route, public page**

The API route keeps bulk operations via case-study-extras. The PATCH handler calls `bulkUpdateStatus()`. Delete calls `softDeleteContent()`.

- [ ] **Step 5: Run tests + smoke test**

Extra smoke test: bulk publish/unpublish from admin list, soft delete + trash + recover.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(cms): migrate case-studies to CMS engine with bulk/trash operations"
```

---

### Task 15: Delete Old Code

After all 9 types are migrated and verified:

- [ ] **Step 1: Remove old per-type Server Actions**

Delete the bodies of all 9 `admin/[type]/[id]/actions.ts` files that now just wrap the generic CMS actions. Or remove them entirely if the admin forms have been updated to import directly from `@/cms/actions`.

- [ ] **Step 2: Remove old API route logic**

The 9 API route files should now be thin wrappers. Verify each one delegates to the operations layer, then remove any leftover dead code.

- [ ] **Step 3: Remove old shared utilities**

- Delete `src/utils/content-management.ts` (replaced by `src/cms/operations/`)
- Delete `src/lib/relationship-queries.ts` (replaced by `src/cms/operations/relationships.ts`)
- Remove `RELATIONSHIP_MAPS` from `src/lib/content-fetchers.ts` (keep the file — it still has `fetchSearchData` and other utilities)
- Remove content-type-specific schemas from `src/lib/validation/schemas.ts` (keep `newsletterSubscriptionSchema`, `paginationSchema`, `searchParamsSchema`)

- [ ] **Step 4: Verify no imports reference deleted code**

Run: `npx tsc --noEmit --skipLibCheck`
Run: `npx vitest run`
Expected: No type errors, all tests pass

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(cms): remove old per-type actions, API routes, and shared utilities"
```

---

### Task 16: Final Validation

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit --skipLibCheck`
Expected: No errors (beyond pre-existing ones in node_modules)

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No new lint errors

- [ ] **Step 4: Full manual smoke test**

For each of the 9 content types:
- Public list page loads
- Public detail page loads with relationships
- Admin list page loads
- Admin edit form loads, save works
- Publish/unpublish works
- (Case studies only) Bulk operations, trash, recover work

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat(cms): complete CMS engine migration — all 9 content types"
```

- [ ] **Step 6: Update CHANGELOG.md**

Add entry under `[Unreleased]` → `### Changed`:
```markdown
- **CMS Engine**: Replaced 9 duplicated content type implementations with config-driven CMS engine. Content types defined via central registry; validation, relationships, and metadata derived from definitions. ~4,000 lines removed, ~800 lines of engine code added.
```

- [ ] **Step 7: Commit CHANGELOG**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for CMS engine migration"
```
