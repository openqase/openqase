# CMS Engine: Config-Driven Content Types, Shared Data Layer, Generic CRUD

**Date:** 2026-03-23
**Status:** Draft
**GitHub Issue:** #201
**Epic:** Unify CMS and improve for next release

---

## Problem

OpenQase has 9 content types implemented as independent copies with ~70% structural duplication (~3,000+ lines). Each content type has its own API route, Server Actions, admin form, Zod schema, and relationship config. The original types (algorithms, case-studies, industries, personas, blog-posts) diverge from newer quantum-* types in validation, API format, and relationship handling.

Adding a new content type requires creating 8+ files and ~1,300 lines of boilerplate. Bugs must be fixed in 9 places. Four content types lack Zod validation entirely. Only blog-posts call `revalidatePath()` in their API route — the others rely on a 24-hour ISR fallback.

## Goals

- Define content types via a central registry/config
- Derive Zod schemas, relationship configs, and metadata helpers from that definition
- Unify Server Actions and API route handlers into thin wrappers around a shared operations layer
- Make adding a new content type a ~30-line config file + database migration
- Fix cache invalidation so every mutation revalidates the right paths
- Maintain per-type flexibility for public page layouts and type-specific admin UI sections

## Non-Goals

- Building a releasable CMS product or framework
- Lifecycle hooks or plugin system (can be added later if needed)
- Custom field type components (use a fixed set covering actual usage)
- Changing the public page visual design
- Rebuilding the admin UI (that's issue #202, depends on this)

## Architecture

### Research: How Production CMS Platforms Do This

Every established CMS separates core logic from the transport layer:

| CMS | HTTP Layer | Core Logic | Internal Access |
|-----|-----------|------------|-----------------|
| Ghost | API Framework pipeline | Service classes | Services injected directly |
| Payload | Thin endpoint handlers (~20 lines) | Operation functions | Local API calls same operations |
| Strapi | Koa controllers | Document Service | `strapi.documents(uid).create()` |
| Directus | Express controllers | Service classes | `new ItemsService(collection, opts)` |
| KeystoneJS | GraphQL HTTP endpoint | GraphQL resolvers + core mutations | `context.query.List.createOne()` |

OpenQase follows this pattern. The operations layer is transport-agnostic. Server Actions and API routes are thin wrappers.

### Decision: Server Actions vs API Routes

Community consensus (as of 2025-2026): use Server Actions for UI-driven mutations (form saves, publish toggles), keep API routes for external consumers and read-only data. OpenQase's current architecture already approximates this.

The CMS engine builds core CRUD as plain async functions. Server Actions become one-liner wrappers (admin UI). API routes become one-liner wrappers (read-only by default, write-capable if external consumers are needed later).

---

## Design

### 1. Content Type Definition

Each content type is defined as a config object in a single file:

```typescript
// src/cms/types/algorithms.ts
import { defineContentType } from '../define'

export const algorithms = defineContentType({
  slug: 'algorithms',
  tableName: 'algorithms',
  label: { singular: 'Algorithm', plural: 'Algorithms' },

  basePath: '/paths/algorithm',
  adminPath: '/admin/algorithms',

  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'description', type: 'textarea', maxLength: 500 },
    { name: 'main_content', type: 'markdown' },
    { name: 'quantum_advantage', type: 'textarea' },
    { name: 'technical_details', type: 'textarea' },
    { name: 'academic_references', type: 'textarea' },
    { name: 'complexity_class', type: 'text' },
    { name: 'year_introduced', type: 'number', min: 1900, max: 2100 },
    { name: 'website_url', type: 'url' },
  ],

  relationships: [
    {
      name: 'case_studies',
      targetType: 'case-studies',
      junction: 'algorithm_case_study_relations',
      foreignKey: 'algorithm_id',
      targetKey: 'case_study_id',
    },
    {
      name: 'industries',
      targetType: 'industries',
      junction: 'algorithm_industry_relations',
      foreignKey: 'algorithm_id',
      targetKey: 'industry_id',
    },
    {
      name: 'personas',
      targetType: 'personas',
      junction: 'persona_algorithm_relations',
      foreignKey: 'algorithm_id',
      targetKey: 'persona_id',
    },
  ],

  metadata: {
    titleField: 'name',
    descriptionField: 'description',
  },

  // Optional: type-specific admin UI sections
  adminExtensions: [
    { position: 'after:academic_references', component: 'CitationHelper' },
  ],
})
```

#### Field Types

A fixed set covering actual usage:

| Type | Admin UI | Zod Rule |
|------|----------|----------|
| `text` | Text input | `z.string().max(maxLength)` |
| `textarea` | Textarea | `z.string().max(maxLength)` |
| `markdown` | Markdown editor | `z.string().max(50000)` |
| `slug` | Auto-generated slug input | `z.string().regex(/^[a-z0-9-]+$/)` |
| `url` | URL input | `z.string().url().optional()` |
| `number` | Number input | `z.number().min().max()` |
| `select` | Dropdown | `z.enum([...options])` |
| `boolean` | Checkbox | `z.boolean()` |
| `date` | Date picker | `z.string().date()` |

No plugin system or custom field types. Extensible later if needed.

### 2. Registry

Collects all content type definitions and provides lookup:

```typescript
// src/cms/registry.ts
const contentTypes = [
  algorithms, caseStudies, industries, personas, blogPosts,
  quantumSoftware, quantumHardware, quantumCompanies, partnerCompanies,
]

const registry = new Map(contentTypes.map(ct => [ct.slug, ct]))

export function getContentType(slug: string) { return registry.get(slug) }
export function getAllContentTypes() { return contentTypes }
export function getContentTypeByTableName(table: string) {
  return contentTypes.find(ct => ct.tableName === table)
}
```

### 3. Operations Layer

Transport-agnostic core CRUD. Both Server Actions and API routes call these.

```typescript
// Operation signatures
createContent(type, data, relationships?, options?)
  → { data: ContentItem } | { error: string }

updateContent(type, id, data, relationships?, options?)
  → { data: ContentItem } | { error: string }

publishContent(type, id)   → { success, error? }
unpublishContent(type, id) → { success, error? }
deleteContent(type, id)    → { success, error? }

fetchContent(type, id)           → ContentItem | null
fetchContentBySlug(type, slug)   → ContentItem | null
listContent(type, options?)      → { items, total }
```

Each operation internally:

1. Looks up content type from registry
2. Validates input using auto-generated Zod schema
3. Checks auth (is admin)
4. Executes Supabase query using `createServiceRoleSupabaseClient()`
5. Handles relationships (delete-and-reinsert junction rows)
6. Calls `revalidatePath()` for admin path, public list path, and individual slug path
7. Returns typed result object (`{ data, error }` — never throws)

#### Server Actions (one file replaces nine)

```typescript
// src/cms/actions.ts
'use server'

export async function saveContentAction(type: string, formData: FormData) {
  const contentType = registry.get(type)
  const { data, relationships } = parseFormData(formData, contentType)
  const id = formData.get('id') as string | null
  if (id) return updateContent(type, id, data, relationships)
  return createContent(type, data, relationships)
}

export async function publishAction(type: string, id: string) {
  return publishContent(type, id)
}

export async function unpublishAction(type: string, id: string) {
  return unpublishContent(type, id)
}
```

#### API Route (one file replaces nine)

```typescript
// src/app/api/content/[type]/route.ts — read-only
export async function GET(request, { params }) {
  const { type } = await params
  if (!registry.has(type)) return NextResponse.json({ error: 'Unknown type' }, { status: 404 })

  const slug = searchParams.get('slug')
  if (slug) return NextResponse.json(await fetchContentBySlug(type, slug))

  const options = parseListParams(searchParams)
  return NextResponse.json(await listContent(type, options))
}
```

#### Type-Specific Operations

Case studies need bulk operations, soft delete, and audit logging that other types don't. These live as additional operations, not in the generic core:

```
src/cms/operations/case-study-extras.ts
  bulkUpdateStatus(ids, status)
  softDeleteContent(type, id)
  recoverContent(type, id)
```

### 4. Public Page Consumption

Public pages keep per-type page components (layouts differ enough to warrant this). The shared plumbing becomes helpers:

```typescript
// src/cms/page-helpers.ts
export function generateStaticParamsFor(typeSlug: string) { ... }
export function generateMetadataFor(typeSlug: string) { ... }
```

A detail page after migration:

```typescript
// src/app/paths/algorithm/[slug]/page.tsx
export const generateStaticParams = generateStaticParamsFor('algorithms')
export const generateMetadata = generateMetadataFor('algorithms')
export const revalidate = 86400

export default async function AlgorithmPage({ params }) {
  const { slug } = await params
  const algorithm = await fetchContentBySlug('algorithms', slug)
  if (!algorithm) notFound()

  // Type-specific rendering stays here
  return (
    <ProfessionalAlgorithmDetailLayout algorithm={algorithm}>
      <div dangerouslySetInnerHTML={{ __html: processMarkdown(algorithm.main_content) }} />
      {algorithm.steps && <StepsRenderer stepsMarkup={algorithm.steps} />}
    </ProfessionalAlgorithmDetailLayout>
  )
}
```

---

## Module Structure

```
src/cms/
  define.ts              — defineContentType() + TypeScript types for config shape
  registry.ts            — collects all types, provides lookup
  schema.ts              — generates Zod schemas from field definitions
  parse-form-data.ts     — generic FormData → plain object using field definitions
  page-helpers.ts        — generateStaticParamsFor(), generateMetadataFor()
  actions.ts             — Server Actions (thin wrappers around operations)

  types/                 — one file per content type (~30-50 lines each)
    algorithms.ts
    case-studies.ts
    industries.ts
    personas.ts
    blog-posts.ts
    quantum-software.ts
    quantum-hardware.ts
    quantum-companies.ts
    partner-companies.ts

  operations/
    index.ts             — exports all operations
    create.ts            — createContent()
    update.ts            — updateContent()
    publish.ts           — publishContent(), unpublishContent()
    delete.ts            — deleteContent()
    fetch.ts             — fetchContent(), fetchContentBySlug(), listContent()
    relationships.ts     — generic junction table CRUD
    case-study-extras.ts — bulk operations, soft delete, audit log
```

## Migration Strategy

Incremental, not big-bang. Old and new code coexist during migration.

1. **Build the engine** — all `src/cms/` files. Unit test operations directly.
2. **Migrate industries first** — simplest type (293-line form, 232-line API route, 2 relationships). Proves the engine end-to-end.
3. **Migrate remaining simple types** — personas, blog-posts, then the four quantum-* types.
4. **Migrate algorithms** — more relationships, citation helper extension.
5. **Migrate case-studies last** — most complex. Build `case-study-extras.ts` here.
6. **Delete old code** — per-type actions, per-type API routes, `content-management.ts`, `RELATIONSHIP_MAPS`, `RELATIONSHIP_CONFIGS`, manual Zod schemas.

At each step the app keeps working. Migrated types use the engine. Unmigrated types use old code.

### API URL Migration

Old routes: `/api/algorithms/`, `/api/case-studies/`, etc.
New route: `/api/content/[type]/`

Options (decide during implementation):
- Keep old URL structure with `api/[type]/route.ts` catch-all
- Add redirect stubs at old paths
- Use new `/api/content/[type]` path (cleanest, but breaks any external references)

## Known Implementation Risks

### 1. Relationship data shape migration
Today, `getStaticContentWithRelationships` returns nested Supabase join shapes like `{ algorithm_case_study_relations: [{ case_studies: { id, name, slug } }] }`, and `filterRelationships()` flattens them. The new `fetchContentBySlug` should return a clean shape like `{ case_studies: [{ id, name, slug }] }`. Page components that destructure the nested shape need updating. Straightforward but touches every detail page.

### 2. Request-scoped deduplication
`fetchContentBySlug` is called from both `generateMetadata` and the page component. Today `React.cache()` deduplicates this. The operations layer must preserve that — either wrapping in `React.cache()` at the page-helpers level or relying on Next.js request deduplication. Easy to forget; if missed, every detail page doubles its database calls.

### 3. Case-studies complexity
Case studies have 7 relationships, bulk operations, trash management, and audit logging. Generic operations handle standard CRUD. Type-specific features live in `case-study-extras.ts` — not in the core operations.

## What Gets Deleted

| Current Files | Lines | Replaced By |
|---------------|-------|-------------|
| 9 × `admin/[type]/[id]/actions.ts` | ~1,400 | `cms/actions.ts` (~50 lines) |
| 9 × `api/[type]/route.ts` | ~3,100 | `api/content/[type]/route.ts` (~40 lines) |
| `utils/content-management.ts` | 593 | `cms/operations/` (~300 lines) |
| `lib/content-fetchers.ts` (RELATIONSHIP_MAPS) | ~200 | Derived from type definitions |
| `lib/relationship-queries.ts` | 107 | `cms/operations/relationships.ts` |
| `lib/validation/schemas.ts` (manual schemas) | 223 | `cms/schema.ts` (auto-generated) |

**Estimated net change: ~4,000+ lines deleted, ~800 lines of engine code added.**

## Success Criteria

- All 9 content types defined as config objects in `src/cms/types/`
- All CRUD operations go through `src/cms/operations/`
- Adding a new content type requires only a config file + migration
- Every mutation auto-revalidates the correct paths
- All existing tests pass; new tests cover the operations layer
- Zero regression in public page rendering or admin functionality
