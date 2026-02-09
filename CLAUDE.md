# Claude Code Development Guidelines for OpenQase

This file contains development guidelines and practices specific to the OpenQase project. Claude Code should follow these guidelines when working on the codebase.

## CHANGELOG Maintenance

### When to Update CHANGELOG.md
Update the CHANGELOG for these types of changes:
- **Fixed**: Bug fixes that affect user experience or content display
- **Added**: New features, components, or significant functionality
- **Changed**: Modifications to existing features that change behavior
- **Security**: Fixes for security vulnerabilities or content exposure issues
- **Removed**: Features or functionality that has been removed

### CHANGELOG Update Process
1. **During development**: Add entries to the `[Unreleased]` section
2. **Before major commits**: Ensure CHANGELOG reflects the changes being committed
3. **Format**: Use clear, user-focused descriptions that explain the impact, not just the technical details

### CHANGELOG Entry Examples
```markdown
### Fixed
- **CMS Content Filtering**: Fixed unpublished case studies appearing on public pages

### Added
- **New Component**: Added particle field animation for homepage background

### Changed
- **Search Functionality**: Improved search performance and added type filtering
```

## Commit Practices

### Commit Message Format
- Use conventional commit format: `type: description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Keep first line under 50 characters
- Add detailed explanation in body if needed

### Before Committing
1. Update CHANGELOG.md if the change is notable
2. Ensure code follows existing patterns and conventions
3. Test changes don't break existing functionality

## Content Management System (CMS) Guidelines

### Published Content Filtering
- Always filter relationships for `published: true` in runtime queries
- Preserve preview mode functionality for team access to drafts
- Maintain static site generation architecture for performance
- Never expose unpublished content in public queries

### Database Query Patterns
- Use `getStaticContentWithRelationships()` for single content items
- Use `getStaticContentList()` for content lists
- Include `published` field in relationship queries when filtering is needed
- Apply published filters conditionally based on preview mode

### Supabase Client Types
Two client factories exist in `src/lib/supabase-server.ts`. Use the right one for the context:

- **`createServiceRoleSupabaseClient()`** — Bypasses RLS. Required for:
  - Build-time static generation (no user session exists)
  - ISR revalidation (no user session exists)
  - Admin server actions (write operations)
  - This is safe because the service role key is server-only (`SUPABASE_SERVICE_ROLE_KEY`, never `NEXT_PUBLIC_`)

- **`createServerSupabaseClient()`** — Respects RLS, uses the current user's session. Use for:
  - Auth checks (verifying the user is logged in / is admin)
  - Any future user-scoped queries where RLS should apply

**Do not** use the service role client in client components or expose the key via `NEXT_PUBLIC_` env vars. See GitHub issue #144 for the full audit.

### Deletion System
- **Soft delete**: Use `soft_delete_content()` database function
- **Recovery**: Use `recover_content()` database function
- Content has `content_status` field: 'draft', 'published', 'archived', 'deleted'
- 30-day retention period for soft-deleted content before permanent deletion
- **Note**: The `public_*`, `admin_*`, and `trash_*` database views were planned but **do not exist**. Filtering is done via `.eq('published', true)` in queries and JS-level filtering. See `/docs/deletion-system-implementation.md` for the original design.

## Architecture Principles

### Static Site Generation & Revalidation (ISR)

The site uses **static site generation with on-demand revalidation** — a two-layer caching strategy:

#### Layer 1: On-Demand Revalidation (primary)
When content is saved/published/unpublished in the admin CMS, server actions call `revalidatePath()` to immediately invalidate the affected pages:
- **Category listing pages** (e.g., `/case-study`, `/paths/algorithm`) are revalidated so new/removed items appear
- **Individual detail pages** (e.g., `/case-study/my-slug`) are revalidated so content changes appear
- Server actions are in `src/app/admin/*/[id]/actions.ts`

Every save/publish/unpublish action must revalidate:
1. The admin listing page (e.g., `/admin/case-studies`)
2. The public listing page (e.g., `/paths/algorithm` or `/case-study`)
3. The individual page by slug (e.g., `/paths/algorithm/${slug}`)

#### Layer 2: ISR Safety Net (fallback)
All dynamic `[slug]/page.tsx` files export `revalidate = 3600` (1 hour). This catches **cross-entity staleness** — when a related entity changes (e.g., an algorithm's name is updated), pages that display that algorithm won't be directly revalidated by the algorithm's save action. The 1-hour ISR ensures these pages refresh eventually.

#### When Adding New Content Types
1. Create admin server actions with proper `revalidatePath()` calls for save/publish/unpublish
2. Add `export const revalidate = 3600` to the public `[slug]/page.tsx`
3. Use `generateStaticParams()` with `generateStaticParamsForContentType()` for build-time generation

#### Request-Scoped Deduplication
`getStaticContentWithRelationships()` is wrapped with `React.cache()` so that `generateMetadata()` and the page component share a single database call per request, not two.

### Two Relationship-Fetching Patterns (intentional)
The codebase has two different patterns for fetching entity relationships. **This is intentional — do not try to consolidate them.**

1. **Single-item nested joins** (`src/lib/content-fetchers.ts`, config: `RELATIONSHIP_MAPS`) — used by static pages to fetch one item with all its relationships in a single Supabase query. Returns nested shapes like `{ case_study_industry_relations: [{ industries: { id, name, slug } }] }`.

2. **Batch junction table queries** (`src/lib/relationship-queries.ts` + API routes, config: `relationshipConfigs`) — used by API routes and admin pages to fetch relationships for a *list* of items efficiently. Uses `.in('case_study_id', ids)` to batch, returns flat arrays like `{ related_industries: [{ id, slug, name }] }`.

These serve different query patterns (single-item vs. list) with different output shapes (nested vs. flat). The configs are not interchangeable. See GitHub issue #141 for the full analysis.

### Bidirectional Junction Tables
**CRITICAL**: The CMS uses bidirectional junction tables for relationships. These tables are used differently depending on the content type context:

#### Junction Table Mappings
- `algorithm_case_study_relations`:
  - On case study pages: contains algorithms (use nested key: 'algorithms')
  - On algorithm pages: contains case studies (use nested key: 'case_studies')

- `case_study_industry_relations`:
  - On case study pages: contains industries (use nested key: 'industries')
  - On industry pages: contains case studies (use nested key: 'case_studies')

- `case_study_persona_relations`:
  - On case study pages: contains personas (use nested key: 'personas')
  - On persona pages: contains case studies (use nested key: 'case_studies')

- `algorithm_industry_relations`:
  - On algorithm pages: contains industries (use nested key: 'industries')
  - On industry pages: contains algorithms (use nested key: 'algorithms')

- `persona_algorithm_relations`:
  - On persona pages: contains algorithms (use nested key: 'algorithms')
  - On algorithm pages: contains personas (use nested key: 'personas')

- `persona_industry_relations`:
  - On persona pages: contains industries (use nested key: 'industries')
  - On industry pages: contains personas (use nested key: 'personas')

#### Implementation Notes
- The `filterRelationships()` function in `content-fetchers.ts` handles context detection
- Content type is determined by checking unique properties (e.g., `quantum_advantage` for algorithms)
- NEVER filter the same relationship data multiple times - it will destroy the data
- Currently, published field filtering is disabled for relationships due to inconsistent data
- **Relationship filtering happens in JS, not at the DB level.** PostgREST nested joins cannot filter on related entity fields (e.g., `industries.published`). This is a known limitation. The data volumes per item are small (3-10 relations), so the JS filtering cost is negligible. See GitHub issue #143 for the full analysis.

### Code Quality
- Follow existing code patterns and conventions
- Prefer editing existing files over creating new ones
- Use TypeScript types consistently
- Keep security best practices (never expose secrets/keys)

## Testing and Validation

### Before Deployment
- Run build process to ensure compilation
- Test affected pages in development environment
- Verify CHANGELOG accurately reflects changes
- Ensure no unpublished content appears in public views

## Documentation Standards

- Update CHANGELOG.md for user-facing changes
- Add inline comments for complex logic
- Document architectural decisions in code comments
- Keep README.md current with setup/deployment instructions
