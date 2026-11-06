# API and Relationships Architecture

How OpenQase content types link to each other, how those links are read and written, and what the public content API looks like. Verified against the code on 2026-10-15.

## Content types and the registry

The nine content types (case studies, algorithms, industries, personas, blog posts, quantum software, quantum hardware, quantum companies, partner companies) are declared with `defineContentType()` in `src/cms/types/<type>.ts` and collected in `src/cms/registry.ts` (`getContentType(slug)`, `getAllContentTypes()`).

Each definition's `relationships` array (type `RelationshipDefinition` in `src/cms/define.ts`) describes one link to another type:

| Field | Meaning |
|-------|---------|
| `name` | Key the related items appear under after flattening, and the key `saveRelationships()` reads (e.g. `industries`) |
| `targetType` | Registry slug of the related type (e.g. `case-studies`) |
| `junction` | Junction table name |
| `foreignKey` / `targetKey` | Junction column pointing at this item / at the related item |
| `selectFields` | Columns to select on the related item (default `id`, `title` or `name`, `slug`) |
| `junctionForeignKeyHint` / `targetForeignKeyHint` | PostgREST `!fk` hints, needed only for the self-referential `blog_post_relations` |
| `extraJunctionFields` | Extra columns written on insert (blog posts set `relation_type: 'related'`) |

## Bidirectional junction tables

A link is one row in one junction table. Both sides declare the same table with `foreignKey` and `targetKey` swapped, so a link saved from either side shows up on both pages:

```typescript
// src/cms/types/case-studies.ts
{ name: 'algorithms', targetType: 'algorithms', junction: 'algorithm_case_study_relations',
  foreignKey: 'case_study_id', targetKey: 'algorithm_id' }

// src/cms/types/algorithms.ts
{ name: 'case_studies', targetType: 'case-studies', junction: 'algorithm_case_study_relations',
  foreignKey: 'algorithm_id', targetKey: 'case_study_id' }
```

Junction tables used by the registry:

| Junction table | Links |
|----------------|-------|
| `algorithm_case_study_relations` | algorithms ↔ case studies |
| `algorithm_industry_relations` | algorithms ↔ industries |
| `case_study_industry_relations` | case studies ↔ industries |
| `case_study_persona_relations` | case studies ↔ personas |
| `persona_algorithm_relations` | personas ↔ algorithms |
| `persona_industry_relations` | personas ↔ industries |
| `case_study_quantum_software_relations` | case studies ↔ quantum software |
| `case_study_quantum_hardware_relations` | case studies ↔ quantum hardware |
| `case_study_quantum_company_relations` | case studies ↔ quantum companies |
| `case_study_partner_company_relations` | case studies ↔ partner companies |
| `blog_post_relations` | blog posts → related blog posts (self-referential) |

The schema also has `case_study_relations`, `quantum_company_hardware_relations` and `quantum_company_software_relations`. They are not in the registry, so nothing reads or writes links through them. The only exception is cleanup: permanently deleting a case study also removes its `case_study_relations` rows (`src/app/api/case-studies/permanent-delete/route.ts`).

## Reading relationships: two patterns

There are two ways to fetch relationships. They serve different query shapes and are intentionally kept separate (GitHub issue #141).

### 1. Single item with nested joins

Used by every `[slug]` detail page and by `GET /api/<type>?slug=…`.

- `buildRelationshipSelect()` (`src/cms/operations/relationships.ts`) turns the type's `relationships` config into one PostgREST select with a nested join per relationship, e.g. `*, case_study_industry_relations(industries(id, name, slug, published, deleted_at)), …`. It always adds `published` and `deleted_at` on the related side.
- `fetchContentBySlug()` (`src/cms/operations/fetch.ts`) runs that select for one published, non-deleted row. `fetchPreviewContentBySlug()` does the same but includes drafts when Next.js draft mode is on. Both are wrapped in `React.cache()`.
- `flattenRelationships()` replaces the nested junction data with flat arrays keyed by relationship `name`:

```typescript
// raw:       { title, case_study_industry_relations: [{ industries: { id, name, slug, … } }] }
// flattened: { title, industries: [{ id, name, slug, … }] }
```

### 2. Batch junction queries for lists

Used where relationships are needed for many items at once. Lives in `src/lib/relationship-queries.ts`; the junction table and columns are passed inline to an internal `getRelatedEntities()` helper (there is no shared config object).

- `getCaseStudyRelationshipMap(caseStudyIds)` returns `{ [caseStudyId]: { industries, algorithms, personas } }`. Used by the homepage (`src/app/page.tsx`) and `/case-study` for filters and tag pills.
- `getRelatedQuantumSoftware()`, `getRelatedQuantumHardware()`, `getRelatedQuantumCompanies()`, `getRelatedPartnerCompanies()`, `getRelatedIndustries()`, `getRelatedAlgorithms()`, `getRelatedPersonas()` take a list of case study ids and return a de-duplicated flat array of `RelatedEntity` (`id`, `name`, `slug`, `description`, plus a type-specific column for companies). The quantum software, hardware, company and partner company pages use them to show the rest of the ecosystem reached through their case studies.

Each query is `.in('case_study_id', ids)` on the junction table followed by `.in('id', …)` on the target table, so the cost is a fixed number of queries regardless of list length.

## Hiding drafts and deleted items

All of these reads use the service-role client, which bypasses RLS, so visibility is enforced in code:

- **The item itself**: `fetchContentBySlug()` and `listContent()` (by default) filter `published = true` and `deleted_at IS NULL`. The preview path drops only the `published` filter.
- **Related items on single-item reads**: `flattenRelationships(raw, ct, { publishedOnly: true })` drops related rows with `published === false` or `deleted_at` set. `fetchContentBySlug()` passes `publishedOnly: true`; the preview path does not, so editors see draft relations.
- **Related items on batch reads**: `filterVisibleEntities()` applies the same rule and strips the `published` / `deleted_at` columns from the result.

`published = null` (legacy rows) is kept on purpose rather than risk emptying relationship lists. PostgREST cannot filter a nested join on the related row's columns, so this filtering happens in JS (GitHub issue #143); with 3 to 10 relations per item the cost is negligible.

Visibility is decided by the related item's own columns. Neither read path looks at a junction row's `deleted_at`.

## Writing relationships

Admin forms submit through server actions in `src/app/admin/<type>/[id]/actions.ts`, which call `createContent()` / `updateContent()` from `@/cms/operations` with a `relationships` map of `{ [relationshipName]: string[] }`. Both send the row and the links to one Postgres function, `public.save_content_with_relationships()` (migration `*_atomic_content_save.sql`), which runs as a single transaction. `saveRelationships()` calls the same function without row data to sync links only.

- A key that is **omitted** (`undefined`) leaves that relationship untouched.
- An **empty array** removes all links for that relationship.
- Otherwise the function deletes only removed ids and inserts only added ids; unchanged links keep their rows.
- **All or nothing.** If any step fails (for example a target id that does not exist), the whole call is rolled back: a new row is not created, an edited row keeps its old values, and every junction table is left as it was. `createContent()` / `updateContent()` then return `error` with no `data`, so retrying is safe and cannot create a duplicate. They no longer set `warning` (the field stays in the result type).
- The function only accepts the (table, junction, foreign key, target key) tuples on an allow-list inside the SQL. A unit test in `src/cms/operations/relationships.test.ts` fails if that list and the `relationships` in `src/cms/types/*.ts` drift apart, so **adding a relationship needs a migration that updates the allow-list**.
- It is `SECURITY INVOKER`, executable by `service_role` only.

Unlinking hard-deletes the junction row. Soft-deleting an item (`deleteContent()`) sets `deleted_at` on its junction rows in the four `case_study_*` company/software/hardware tables that have that column (`JUNCTIONS_WITH_DELETED_AT` in `src/cms/operations/delete.ts`), `restoreContent()` clears it, and `permanentlyDeleteContent()` deletes all of the item's junction rows before deleting the item.

## Standardized API pattern

Each content type has a route at `src/app/api/<type>/route.ts` built on the CMS operations layer:

```typescript
import {
  listContent,          // Paginated list (published, non-deleted by default)
  fetchContentBySlug,   // One published item with flattened relationships
  deleteContent,        // Soft delete (sets deleted_at, unpublishes, revalidates)
  deleteContentMany,    // Bulk soft delete
  publishContent,       // Publish (refuses trashed rows, stamps published_at)
  unpublishContent,
} from '@/cms/operations'
```

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/<type>?page=1&pageSize=10` | public | Published items, `{ items, pagination }`; `pageSize` is capped at 100 |
| GET | `/api/<type>?slug=…` | public | One published item with relationships, or 404 |
| PATCH | `/api/<type>?id=…` with `{ published: boolean }` | admin | Publish or unpublish |
| DELETE | `/api/<type>?id=…` | admin | Soft delete one item |
| POST | `/api/<type>/delete` with `{ id }` or `{ ids }` | admin | Soft delete one or many |
| POST | `/api/<type>/restore` with `{ id }` or `{ ids }` | admin | Restore from trash as a draft |
| POST | `/api/<type>/permanent-delete` with `{ id }` or `{ ids }` | admin | Hard delete items already in the trash |

`/api/case-studies` PATCH also accepts `{ bulk: true, operation: 'publish' | 'unpublish' | 'delete', ids }`. The restore and permanent-delete routes are one-liners over `createRestoreHandler()` / `createPermanentDeleteHandler()` in `src/lib/trash-route-handlers.ts`. Admin checks use `requireAdmin()` from `src/lib/auth.ts`.

There is no create or update endpoint: content is created and edited only through the admin server actions above. Drafts are viewed through `/api/preview`, which turns on draft mode and redirects to the page, not through a `preview` query parameter.

Errors are returned as `{ error: string }` with status 400 (bad input), 401/403 (not signed in / not an admin), 404 (not found) or 500.
