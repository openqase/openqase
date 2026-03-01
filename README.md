# OpenQase

OpenQase is a curated collection of quantum computing business cases, with a cross-reference of the industries, algorithms, and personas that are most relevant to each. This GitHub repository features the underlying OpenQase CMS, built from scratch to serve the needs to the cross-referencing of these metadata relationships, and provided as open source for any teams looking to create their own such libraries. Note that the software is open source, but the case studies and other data are accessible via the website, the API, or (upcoming) MCP.

## Overview

OpenQase provides:
- **Case Studies**: Real-world quantum computing implementations and business impact
- **Algorithms**: Detailed explanations of quantum algorithms with implementation steps
- **Industries**: Industry-specific applications and use cases
- **Personas**: Role-based descriptions of relevant users

## Performance

**OpenQase v0.5.0 delivers the requisite "blazing-fast" performance:**
- **50-100ms page loads** (due to static renders)
- **145+ static pages** pre-generated at build time
- **Zero runtime database calls** for public content
- **300x performance improvement** through hybrid architecture

## Architecture

OpenQase uses a **hybrid architecture** that combines:

- **📊 Static Generation** for public content (case studies, algorithms, personas, industries)
- **🔄 Dynamic Generation** for admin CMS and user management
- **🚀 Unified Content Fetching** system eliminates prior N+1 query processes
- **🛡️ Zero Breaking Changes** - all existing functionality preserved (touch wood)

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org) 15.x with App Router
- **Database**: [Supabase](https://supabase.com) for data and authentication
- **Newsletter**: [Beehiiv](https://beehiiv.com/) integration for professional newsletter management
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) for consistent design
- **Content**: Unified content fetching system with relationship management
- **Styling**: Tailwind CSS for responsive design
- **Deployment**: Vercel with static generation

## Getting Started

### Prerequisites
- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/local-development) (for local development)
- Docker (required by Supabase CLI)

### Setup

1. **Clone and install:**
```bash
git clone https://github.com/openqase/openqase.git
cd openqase
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```
Edit `.env.local` with your Supabase credentials (get these from Supabase Dashboard → Settings → API).

3. **Set up local database:**
```bash
# Start local Supabase
supabase start

# Link to production project (get project ref from Supabase dashboard URL)
supabase link --project-ref <your-project-ref>

# Pull schema and data from production
supabase db pull
```

4. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

### Syncing with Production

To update your local database with the latest production data:
```bash
supabase db pull
```

### Build for Production
```bash
npm run build
```

## 📚 Documentation

### Getting Started
- **[Installation Guide](./docs/installation.md)** - Complete setup and local development guide
- **[Environment Variables](./docs/environment-variables.md)** - All configuration options explained
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute with commit conventions

### API & Development
- **[API Reference](./docs/api-reference.md)** - Complete REST API documentation (all 26 endpoints)
- **[OpenAPI Specification](./docs/openapi.yaml)** - Swagger/Postman compatible specification
- **[Unified Content Fetching](./docs/unified-content-fetching.md)** - Server-side content API system
- **[API Architecture](./docs/api-architecture.md)** - Architectural patterns and best practices

### Architecture & Features
- **[API & Relationships Architecture](./docs/api-relationships-architecture.md)** - How content types connect
- **[Email System](./docs/email-system.md)** - Beehiiv and Resend integration
- **[Import System](./docs/import-system.md)** - Bulk content import tools
- **[Admin CMS Guide](./docs/admin-cms-guide.md)** - Content management interface
- **[Authentication](./docs/authentication.md)** - Auth patterns and RLS policies

### Project Planning
- **[Project Plan](./docs/openqase-project-plan.md)** - Vision, strategy, roadmap, and business model
- **[Release Notes](./docs/release-notes.md)** - Version history and changes
- **[Content Strategy](./docs/content-strategy.md)** - Content approach and guidelines

## 🔧 Content Management

Content is managed through the professional OpenQase CMS with:

**📝 Content Types:**
- Case Studies (`/case-study/[slug]`) with featured content support
- Algorithms (`/paths/algorithm/[slug]`)
- Personas (`/paths/persona/[slug]`)
- Industries (`/paths/industry/[slug]`)
- Blog Posts (`/blog/[slug]`) with featured content support

**⚡ Unified API:**
```typescript
import { getStaticContentWithRelationships } from '@/lib/content-fetchers';

const algorithm = await getStaticContentWithRelationships('algorithms', 'quantum-phase-estimation');
```

**🔄 Admin Interface:**
- Real-time content editing at `/admin`
- **Professional soft delete system** - safely delete content with recovery options
- **Featured content management** - showcase important content on homepage
- Relationship management
- Publishing workflows
- User management

**🗑️ Soft Delete System:**
- Safe content deletion with recovery capability
- Admin-only delete operations with proper authentication
- Audit trail tracking who deleted what and when
- 30-day retention before permanent deletion

**⭐ Featured Content:**
- Mark case studies and blog posts as featured
- Automatic homepage integration
- Performance-optimized with database indexes

**📥 Import System:**
OpenQase includes a comprehensive case study import system for handling JSON exports:

```bash
# Import case studies from JSON files
tsx scripts/import-case-studies-with-mapping.ts /path/to/json/files --commit

# Available import utilities:
# - import-case-studies-with-mapping.ts: Main importer with entity mapping
# - batch-name-generator.ts: Generates batch names (QK-001, QK-002, etc.)
# - entity-mapping.json: Predefined mappings for algorithms/industries/personas
# - populate-entities.ts: Utility for seeding reference entities
```

The import system features:
- **Entity Mapping**: Intelligent matching of algorithms, industries, and personas
- **Batch Tracking**: Human-readable batch names for admin management
- **Duplicate Detection**: Prevents importing the same content twice
- **Comprehensive Reporting**: Detailed statistics and unmapped entity reports

## 📊 Performance Metrics

| Metric | Before v0.4.0 | After v0.5.0 | Improvement |
|--------|---------------|--------------|-------------|
| Page Load Time | 30+ seconds | 50-100ms | **300x faster** |
| Database Queries | 3-5 per page | 0 (static) | **100% reduction** |
| Build Time | 2-3 minutes | 23 seconds | **87% faster** |
| Static Pages | 0 | 145+ | **Full static generation** |

## 🚀 Deployment

**Development:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm run start
```

**Static Export:**
```bash
NEXT_STATIC_EXPORT=true npm run build
```

## 🤝 Contributing

1. **Read the documentation** - Start with the [Contributing Guide](./CONTRIBUTING.md)
2. **Follow the patterns** - Use unified content fetching for public content
3. **Preserve admin functionality** - Keep dynamic patterns for admin features
4. **Test performance** - Ensure changes don't impact build times

## 📋 Project Structure

```
openqase/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── admin/             # Admin CMS (dynamic)
│   │   ├── api/               # API routes (dynamic)
│   │   ├── case-study/        # Case studies (static)
│   │   └── paths/             # Learning paths (static)
│   ├── components/            # Reusable React components
│   ├── lib/
│   │   ├── content-fetchers.ts # Unified content fetching system
│   │   └── supabase-server.ts # Database clients
│   └── types/                 # TypeScript definitions
├── docs/                      # Documentation
├── migrations/                # Database migrations
└── scripts/                   # Build and deployment scripts
    ├── import-case-studies-with-mapping.ts    # Main case study importer
    ├── batch-name-generator.ts               # Batch naming utility (QK-001, etc.)
    ├── entity-mapping.json                   # Entity mapping definitions
    ├── populate-entities.ts                  # Entity population utility
    ├── setup-admin.ts                        # Admin user setup
    ├── setup-local.sh                        # Local environment setup
    ├── get-schema.ts                          # Database schema extraction
    ├── enable-dev-mode.js                    # Development mode toggle
    ├── performance-monitor.ts                # Performance monitoring tools
    └── page-load-performance.js              # Page performance testing
```

## 🔄 Roadmap

OpenQase is on track for a **v1.0.0 production release by July 1, 2026**, with monthly milestone releases.

### Current Status
- 📍 **You are here**: v0.5.0 (January 2026)
- 🎯 **Next**: v0.6.0 - Content Quality & Cleanup (February 1, 2026)
- 🚀 **Target**: v1.0.0 - Production Ready (July 1, 2026)

### Monthly Milestones
- **v0.6.0** (Feb 1): Content quality, legacy cleanup, database fixes
- **v0.7.0** (Mar 1): CMS enhancements, bulk import, newsletter, multi-admin
- **v0.8.0** (Apr 1): Visualizations, LaTeX formulas, enhanced search
- **v0.9.0** (May 1): Infrastructure scaling, Redis, performance optimization
- **v1.0.0** (Jul 1): Testing, documentation, security audit, production ready

### Track Our Progress
- 📊 [View Milestones](https://github.com/openqase/openqase/milestones) - Release planning and progress
- 🎯 [View Issues](https://github.com/openqase/openqase/issues) - Detailed task tracking
- 📋 [Project Plan](./docs/openqase-project-plan.md) - Vision, strategy, and roadmap

For detailed project planning, user personas, business model, and strategic vision, see our comprehensive [**Project Plan**](./docs/openqase-project-plan.md).

## Support

- **Documentation**: Comprehensive guides in `/docs/`
- **Issues**: [GitHub Issues](https://github.com/openqase/openqase/issues) for bug reports and feature requests
- **Performance**: Build logs and performance monitoring included
