# OpenQase - Claude Context

## Project Overview

OpenQase is a quantum computing case study CMS built with Next.js 15, Supabase, and TypeScript. It uses a **hybrid architecture** that combines static generation for public content with dynamic generation for admin features.

**Key Performance Metrics:**
- 50-100ms page loads (static generation)
- 145+ static pages pre-generated at build time
- Zero runtime database queries for public content
- 23-second build time (watch this!)

## Critical Architectural Constraints

### 🚨 MUST PRESERVE: Hybrid Architecture

**Static Routes (DO NOT make dynamic):**
- `/case-study/[slug]` - Case studies
- `/paths/algorithm/[slug]` - Algorithms
- `/paths/persona/[slug]` - Personas
- `/paths/industry/[slug]` - Industries
- `/blog/[slug]` - Blog posts
- `/` - Homepage

**Dynamic Routes (DO NOT make static):**
- `/admin/*` - Admin CMS
- `/api/*` - API endpoints
- `/auth/*` - Authentication
- `/profile` - User profiles

### 🎯 Content Fetching Patterns

**For Public Content (Static):**
```typescript
// ALWAYS use unified content fetchers
import { getStaticContentWithRelationships } from '@/lib/content-fetchers';

const content = await getStaticContentWithRelationships('case_studies', slug);
```

**For Admin Content (Dynamic):**
```typescript
// Use direct Supabase queries with createClient
import { createClient } from '@/lib/supabase-server';

const supabase = await createClient();
const { data } = await supabase.from('case_studies').select('*');
```

**NEVER mix patterns** - Static pages must use unified fetchers, admin must use direct queries.

## Key File Locations

### Core System Files
- `src/lib/content-fetchers.ts` - Unified content fetching system (use this!)
- `src/lib/supabase-server.ts` - Database clients
- `src/types/` - TypeScript definitions
- `next.config.ts` - Build configuration

### Content Management
- `src/app/admin/` - Admin CMS (dynamic)
- `src/app/case-study/` - Case studies (static)
- `src/app/paths/` - Learning paths (static)
- `src/components/` - Reusable React components

### Scripts & Utilities
- `scripts/import-case-studies-with-mapping.ts` - Main importer
- `scripts/setup-admin.ts` - Admin user setup
- `scripts/entity-mapping.json` - Entity mappings

### Documentation
- `docs/unified-content-fetching.md` - Complete API docs
- `docs/api-relationships-architecture.md` - How content types connect
- `docs/data-fetching.md` - Patterns and best practices

## Common Workflows

### Adding New Content Types
1. Add database table with RLS policies
2. Add TypeScript types in `src/types/`
3. Add fetcher in `src/lib/content-fetchers.ts`
4. Create static page in `src/app/`
5. Add admin CRUD in `src/app/admin/`

### Modifying Content Display
1. Read the existing page component
2. Check `getStaticContentWithRelationships` call
3. Modify the component rendering
4. Test build time (`npm run build`)

### Database Changes
1. Create migration in `supabase/migrations/`
2. Test locally with `supabase start`
3. Update TypeScript types
4. Update RLS policies if needed

## Security Requirements

### Always Check For:
- **SQL Injection** - Use parameterized queries
- **XSS** - Sanitize user input, use proper escaping
- **CSRF** - Use Supabase auth tokens
- **RLS Policies** - Ensure proper row-level security
- **API Rate Limiting** - Already implemented for /api routes

### Authentication Patterns
- Admin routes check `user?.is_admin === true`
- Use Supabase RLS for data-level security
- Never expose admin functions in public API

## Important Conventions

### Git Workflow (CRITICAL)
- 🚨 **NEVER push to `main` without explicit user approval**
- 🚨 **ALWAYS ask before making commits** - explain what will be committed
- ✅ Work on `develop` branch by default
- ✅ Ask permission before pushing to any branch
- ✅ Explain changes before committing
- ❌ Never force push
- ❌ Never bypass branch protection (even if technically possible)

### DO:
- ✅ Use unified content fetchers for public pages
- ✅ Preserve static generation patterns
- ✅ Keep admin functionality dynamic
- ✅ Test build times after changes
- ✅ Follow soft delete patterns (use `deleted_at` field)
- ✅ Use TypeScript strictly
- ✅ Check for breaking changes to static generation
- ✅ Ask before committing or pushing code

### DON'T:
- ❌ Make admin routes static
- ❌ Make public routes dynamic
- ❌ Use direct Supabase queries in static pages
- ❌ Hard delete content (use soft delete)
- ❌ Add unnecessary dependencies
- ❌ Break the 30-second build time
- ❌ Skip RLS policy updates
- ❌ Push to main without permission
- ❌ Commit without asking first

## Common Gotchas

### Static Generation Issues
- **Problem**: Page becomes dynamic unintentionally
- **Cause**: Using `cookies()`, `headers()`, or dynamic Supabase queries
- **Solution**: Use unified content fetchers, avoid dynamic Next.js APIs

### Build Time Increases
- **Problem**: Build time exceeds 30 seconds
- **Cause**: Too many pages, inefficient queries, N+1 problems
- **Solution**: Check unified fetchers, optimize database queries

### Soft Delete Confusion
- **Problem**: Content still appears after "deletion"
- **Cause**: Not filtering by `deleted_at IS NULL`
- **Solution**: All queries must filter deleted content except in trash views

### Relationship Loading
- **Problem**: Missing related content
- **Cause**: Not using `getStaticContentWithRelationships`
- **Solution**: Use unified fetchers which handle all relationships

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with RLS
- **UI**: shadcn/ui + Tailwind CSS
- **Styling**: Tailwind CSS 3.x
- **Icons**: Lucide React
- **Monitoring**: Sentry
- **Newsletter**: Beehiiv integration
- **Email**: Resend for transactional emails
- **Deployment**: Vercel

## Quick Commands

```bash
# Development
npm run dev                    # Start dev server
supabase start                 # Start local Supabase

# Build & Test
npm run build                  # Production build (watch time!)
npm run build:analyze          # Analyze bundle size
npm run lint                   # Lint code

# Database
supabase db pull              # Pull production schema
supabase db push              # Push migrations

# Scripts
tsx scripts/setup-admin.ts    # Create admin user
tsx scripts/import-case-studies-with-mapping.ts # Import case studies
```

## When Making Changes

1. **Read existing code first** - Understand patterns before modifying
2. **Check documentation** - Especially `docs/unified-content-fetching.md`
3. **Test build locally** - Ensure build time stays under 30s
4. **Verify static generation** - Check `.next/server/app/` for static HTML
5. **Test admin functionality** - Ensure dynamic features still work
6. **Check security** - Review OWASP top 10 considerations

## Current Project Status (v0.5.0)

**Recently Completed:**
- Unified content fetching system
- Professional soft delete with trash/restore
- Featured content functionality
- Homepage redesign
- Security hardening

**Known Issues:**
- Content language checking tool needs database connection debugging
- 9 SECURITY DEFINER functions need `SET search_path` (low priority)

**Next Priorities:**
- Add Company pages
- Add Software and Hardware pages
- Enhanced search functionality

## Need Help?

- Check `/docs/` for detailed documentation
- Review `README.md` for architecture overview
- See `CONTRIBUTING.md` for contribution guidelines
- Check recent commits for patterns: `git log --oneline -10`
