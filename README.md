# OpenQase

OpenQase is a curated collection of quantum computing business cases, cross-referenced by industry, algorithm, and persona. The CMS is built from scratch to manage these metadata relationships and is provided as open source. The case studies and other data are accessible via the [website](https://openqase.com), the [REST API](./docs/api-reference.md), or (upcoming) MCP.

## Quick Start

### Prerequisites
- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/local-development) + Docker

### Setup

```bash
git clone https://github.com/openqase/openqase.git
cd openqase
npm install
cp .env.example .env.local   # then add your Supabase credentials
```

Start local Supabase and pull the schema:

```bash
supabase start
supabase link --project-ref <your-project-ref>
supabase db pull
```

Run the dev server:

```bash
npm run dev           # http://localhost:3000
```

Build for production:

```bash
npm run build
npm run start
```

## Architecture

OpenQase uses a **hybrid static/dynamic architecture**:

- **Static generation** for all public content (case studies, algorithms, personas, industries, blog)
- **Dynamic rendering** for admin CMS and API routes
- **On-demand revalidation** when content is published/updated, with 1-hour ISR safety net
- **Unified content fetching** with `React.cache()` deduplication

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (Postgres + Auth + RLS) |
| UI | shadcn/ui + Tailwind CSS |
| Email | Beehiiv (newsletter) + Resend (transactional) |
| Caching | Redis (Upstash) with in-memory fallback |
| Deployment | Vercel |
| Testing | Vitest (235+ tests) |

## Content Types

| Type | Public URL | Admin |
|------|-----------|-------|
| Case Studies | `/case-study/[slug]` | `/admin/case-studies` |
| Algorithms | `/paths/algorithm/[slug]` | `/admin/algorithms` |
| Industries | `/paths/industry/[slug]` | `/admin/industries` |
| Personas | `/paths/persona/[slug]` | `/admin/personas` |
| Blog Posts | `/blog/[slug]` | `/admin/blog` |
| Quantum Software | `/paths/quantum-software/[slug]` | `/admin/quantum-software` |
| Quantum Hardware | `/paths/quantum-hardware/[slug]` | `/admin/quantum-hardware` |
| Quantum Companies | `/paths/quantum-companies/[slug]` | `/admin/quantum-companies` |
| Partner Companies | `/paths/partner-companies/[slug]` | `/admin/partner-companies` |

Content is cross-referenced via bidirectional junction tables — see [API & Relationships Architecture](./docs/api-relationships-architecture.md) for details.

## Project Structure

```
openqase/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── admin/        # Admin CMS (dynamic)
│   │   ├── api/          # REST API routes
│   │   ├── case-study/   # Case studies (static)
│   │   ├── paths/        # Algorithms, industries, personas, etc. (static)
│   │   └── blog/         # Blog (static)
│   ├── components/       # React components
│   └── lib/              # Content fetchers, Supabase clients, utilities
├── docs/                 # Documentation
├── scripts/              # Import, migration, and admin scripts
└── supabase/             # Database migrations
```

## Documentation

### Getting Started
- [Installation Guide](./docs/installation.md) — setup and local development
- [Environment Variables](./docs/environment-variables.md) — configuration reference
- [Contributing Guide](./CONTRIBUTING.md) — commit conventions and standards

### API
- [API Reference](./docs/api-reference.md) — all REST endpoints with examples
- [OpenAPI Spec](./docs/openapi.yaml) — Swagger/Postman compatible
- [API Architecture](./docs/api-architecture.md) — patterns and best practices

### Architecture
- [Unified Content Fetching](./docs/unified-content-fetching.md) — static content system
- [API & Relationships](./docs/api-relationships-architecture.md) — junction tables and cross-references
- [Authentication](./docs/authentication.md) — auth patterns and RLS policies
- [Caching](./docs/caching.md) — Redis caching and rate limiting
- [Schema Overview](./docs/schema-overview.md) — database schema

### Content
- [Admin CMS Guide](./docs/admin-cms-guide.md) — content management workflows
- [Import System](./docs/import-system.md) — bulk content import
- [Content Strategy](./docs/content-strategy.md) — content approach and guidelines
- [Email System](./docs/email-system.md) — newsletter and transactional email

### Project
- [Project Plan](./docs/openqase-project-plan.md) — vision, strategy, and roadmap
- [Changelog](./CHANGELOG.md) — version history
- [Roadmap](https://openqase.com/roadmap) — public roadmap

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines. In brief:

1. Fork the repo and create a feature branch
2. Follow existing patterns — use unified content fetching for public content
3. Run `npm test` and `npm run lint` before submitting
4. Open a PR against `main`

## Links

- [Website](https://openqase.com)
- [GitHub Issues](https://github.com/openqase/openqase/issues)
- [GitHub Milestones](https://github.com/openqase/openqase/milestones)

## License

This project is open source. The software code is freely available; case study content is accessible via the website and API.
