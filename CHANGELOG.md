# Changelog

All notable changes to OpenQase will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- **CSP Tightening**: Removed `unsafe-eval` from `script-src` Content Security Policy (`unsafe-inline` retained — required by Next.js hydration)
- **RLS Cleanup**: Removed 6 broken admin write RLS policies that checked a non-existent JWT claim; redacted internal security architecture details from public docs
- **Rate Limiting**: Added rate limiting to `/api/search-data` public endpoint (100 req/15 min)
- **Security Headers**: Added `X-Permitted-Cross-Domain-Policies: none` and `Cross-Origin-Opener-Policy: same-origin`
- **Preview Auth Hardening**: Preview endpoint now always requires secret (removed dev-mode bypass); quantum entity GET endpoints require admin auth for `?preview=true`
- **Input Validation**: Added Zod schema validation to all 5 admin server actions (algorithms, blog, case studies, industries, personas) and bulk operations with UUID + size limits
- **Error Message Sanitization**: Removed `error.message` leaks from 8 API routes — generic messages to clients, full details logged server-side only
- **Defense-in-Depth**: Added `requireAdmin()` checks to audit-log export and all admin API write routes (17 route handlers) as defense-in-depth beyond middleware
- **Script Injection**: Escaped `</script>` breakout in AutoSchema JSON-LD output via `\u003c` encoding
- **Attack Surface**: Removed Sentry example API route and page (unnecessary test endpoints in production)

### Fixed
- **Accessibility**: Fixed nested `<main>` elements on 6 pages — replaced inner `<main>` with `<div>` to ensure valid HTML landmark structure
- **Dead Code**: Removed 13 unused files (components, lib utilities) identified during health check
- **Broken Links**: Fixed 7 broken or redirected URLs in documentation and source code

### Added
- **Test Coverage**: Added 93 new unit tests across 5 files covering cache (LRU, TTL, cache-aside, wrap), SEO schema generators, markdown processing, content metadata extraction, and quantum dictionary
- **Coverage Tooling**: Added `test:coverage` script with v8 provider and 80% threshold on tested files

### Changed
- **Dependencies**: Migrated Zod from v3 to v4 — updated deprecated `.merge()` → `.extend()`, `.errors` → `.issues`, `ZodSchema` → `ZodType`
- **Dependencies**: Updated `@types/node` (patch), `framer-motion` (minor), `supabase` CLI (patch) to latest within semver range
- **Bundle Size**: Removed unused `prism-react-renderer` dependency (~5-10KB)
- **Bundle Size**: Deleted unused `organic-shapes.tsx` component (dead code with framer-motion dependency)
- **Bundle Size**: Replaced `date-fns` with native `Intl.DateTimeFormat` across 4 files, removing the dependency entirely
- **Bundle Size**: Deleted unused `AuthForm.tsx` component (never imported, pulled in `@supabase/auth-ui-react`)
- **Type Safety**: Added `TablesInsert<>` types to 5 server action files (algorithms, quantum-hardware, quantum-software, quantum-companies, partner-companies), replacing `any` params and return types
- **Type Safety**: Typed case study layout component with `CaseStudyWithRelations` interface, replacing `caseStudy: any` and 12 `(rel: any)` casts
- **Type Safety**: Replaced `baseSchema: any` with `Record<string, unknown>` in schema.ts

### Changed
- **Type Safety**: Centralized ~48 `as any` casts into `fromTable()` helper for untyped Supabase tables, replacing scattered casts across 7 files
- **Type Safety**: Converted all 18 `catch (error: any)` patterns to `catch (error: unknown)` with proper `instanceof Error` checks across 6 admin action files
- **Type Safety**: Replaced remaining non-`.from()` `as any` casts with `Record<string, unknown>` and proper type annotations
- **Type Safety**: Removed ~25 `as any` casts from API routes, newsletter services, and utility files by adding proper type annotations (`ContentType`, `RelationshipConfig`, `PerformanceNavigationTiming`, `DbCaseStudy`)
- **Type Safety**: Added `newsletter_subscriptions` table definition to Supabase database types, enabling type-safe newsletter queries
- **Bundle Size**: Removed framer-motion (42KB gzipped) from Card component — the `animated` prop was unused dead code pulling a heavy dependency into 30+ pages
- **Bundle Size**: Added framer-motion to `optimizePackageImports` for better tree-shaking where still used
- **Bundle Size**: Wired up `webpack-bundle-analyzer` for `build:analyze` script
- **Code Quality**: Removed dead code files (`content-management-example.ts`, `api/template/route.ts`)
- **Code Quality**: Removed duplicate `cn()` utility from design-system.ts (canonical version is in utils.ts)

### Added
- **Testing Infrastructure**: Vitest test framework with 138 unit tests covering form validation, redirect security, UK spelling patterns, Zod schemas, and content validation
- **CI/CD**: GitHub Actions workflow running lint, build, and test on push/PR to main and develop
- Comprehensive API reference documentation (905 lines) covering all 26 endpoints
- OpenAPI 3.0.3 specification for Swagger/Postman compatibility
- Complete environment variables guide with security best practices
- Enhanced CONTRIBUTING.md with commit conventions and security guidelines
- Documentation archive folder for historical planning documents
- Improved documentation index in docs/README.md
- Built-in content validation system (replaces LanguageTool API)
- Real-time UK English spelling validation in admin forms
- Comprehensive authentication patterns documentation with troubleshooting guide
- Production-ready Redis-based rate limiting with Upstash support
- Hybrid rate limiter with automatic fallback to in-memory for development
- Comprehensive rate limiting documentation with usage patterns and troubleshooting
- Production-ready Redis-based caching with Upstash support
- Hybrid cache with LRU in-memory fallback for development
- Cache-aside pattern, function wrapping, and batch operations support
- Comprehensive caching documentation with usage patterns and best practices

### Changed
- Renamed api-documentation.md to api-architecture.md for clarity
- Reorganized README.md documentation links for better discoverability
- Moved planning documents to docs/archive/
- Cleaned up TODO comments and created tracking issues (#129, #130, #131, #132)
- **Code Quality**: Consolidated 4 duplicate relationship query functions into generic parameterized implementation
- **Code Quality**: Removed dead code — unused test file, legacy validation module, unused components (InteractiveJourney, PathDiagram, AuthErrorBoundary, ContentErrorBoundary), unused utility functions
- **Dependencies**: Updated all minor/patch dependencies; replaced radix-ui meta-package with individual component packages
- **Performance**: Fixed N+1 query pattern in case-studies API — batch queries reduce 30+ sequential calls to 3 parallel ones
- **Performance**: Parallelized 14 sequential database queries in admin case study edit page with `Promise.all()`
- **Performance**: Added `React.cache()` to deduplicate content fetches shared between `generateMetadata()` and page components across 9 dynamic pages
- **Performance**: Added `React.memo` to search result components; replaced `useEffect`+state with `useMemo` in RelationshipSelector
- **Performance**: Converted contact page from client to server component (removed unnecessary `'use client'`)

### Fixed
- **Revalidation**: Fixed missing `revalidatePath()` calls in publish/unpublish server actions for algorithms, industries, blog posts, personas, quantum software, quantum hardware, quantum companies, and partner companies — content changes now immediately invalidate affected public pages
- **ISR Safety Net**: Added `revalidate = 3600` to all 9 dynamic content pages to catch cross-entity staleness within 1 hour
- **CLAUDE.md**: Restored project guidelines file accidentally removed in prior security cleanup; added revalidation architecture documentation

### Fixed
- Added \`SET search_path = ''\` to SECURITY DEFINER functions to prevent search_path attacks
- Removed legacy TEXT[] field references from codebase

### Security
- Fixed SECURITY DEFINER functions (recover_content, soft_delete_content)
- Database migration applied to production
- **API Authorization**: Added defense-in-depth auth checks to case study delete, permanent-delete, and restore routes
- **Input Validation**: Wired up Zod schema validation to all CRUD API routes (algorithms, case studies, blog posts, industries, personas)
- **Search Injection**: Sanitized search term input in PostgREST filter to prevent query manipulation
- **Preview Mode**: Removed hardcoded fallback secret; preview mode now requires `PREVIEW_SECRET` env var in production
- **Email Config**: Sender email now configurable via `RESEND_FROM_EMAIL` env var
- **Dependencies**: Resolved all npm audit vulnerabilities (tar, next, diff)

## [0.5.0] - 2026-01-05

### Added
- Unified content fetching system for static generation
- Hybrid architecture (static public pages, dynamic admin)
- Professional soft delete system with restore capability
- Featured content management for homepage
- Comprehensive case study import system
- Newsletter integration with Beehiiv and Resend
- Trash view for deleted content management
- Project plan document with vision, roadmap, and business model

### Changed
- Complete migration from TEXT[] arrays to relationship tables
- Improved performance: 50-100ms page loads (300x faster)
- Build time reduced to 23 seconds (87% faster)
- 145+ static pages pre-generated at build time
- Zero runtime database calls for public content

### Removed
- Legacy TEXT[] fields (quantum_software, quantum_hardware, etc.)
- N+1 query problems through unified content fetching

### Fixed
- Filtered deleted case studies from admin list
- Infinite recursion errors in relationship queries
- Module resolution issues in Sentry integration

### Security
- Comprehensive security audit completed
- Package updates for all dependencies
- 0 production vulnerabilities

## [0.4.0] - 2025-12-XX

### Added
- Next.js 15 upgrade with App Router
- Supabase integration for database and auth
- Admin CMS with content management
- shadcn/ui component library
- Tailwind CSS styling system

### Changed
- Migration from pages router to app router
- Improved routing structure
- Enhanced component organization

---

## Versioning Guide

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR** (1.0.0): Breaking changes, major architectural shifts
- **MINOR** (0.X.0): New features, monthly milestone releases
- **PATCH** (0.0.X): Bug fixes, minor improvements

### Milestone Releases

- **v0.6.0**: Content Quality & Cleanup (in progress)
- **v0.7.0**: CMS Power Features
- **v0.8.0**: Visualization & Technical Content
- **v0.9.0**: Infrastructure & Scale
- **v1.0.0** (Jul 2026): Production Ready

### Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

## Links

- [Project Plan](./docs/openqase-project-plan.md) - Detailed roadmap and strategy
- [Release Notes](./docs/release-notes.md) - Technical release details
- [GitHub Releases](https://github.com/openqase/openqase/releases) - Release tags
- [GitHub Milestones](https://github.com/openqase/openqase/milestones) - Progress tracking

---

**Note**: This CHANGELOG started with v0.5.0. Previous versions are documented with approximate dates and may be incomplete.
