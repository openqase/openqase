# OpenQase Documentation

Complete documentation for the OpenQase quantum computing case study platform.

---

## Getting Started

- **[Installation Guide](./installation.md)** — Setup, local development, and deployment
- **[Environment Variables](./environment-variables.md)** — Configuration reference
- **[Contributing Guide](../CONTRIBUTING.md)** — Commit conventions and standards
- **[Troubleshooting](./troubleshooting.md)** — Common issues and solutions

---

## API & Development

- **[API Reference](./api-reference.md)** — All REST endpoints with examples, auth, rate limiting, and error codes
- **[OpenAPI Specification](./openapi.yaml)** — Swagger/Postman compatible spec
- **[API Architecture](./api-architecture.md)** — Architectural patterns and best practices

---

## Architecture

### Core Systems
- **[Unified Content Fetching](./unified-content-fetching.md)** — Static content fetching with `React.cache()` deduplication
- **[API & Relationships Architecture](./api-relationships-architecture.md)** — Junction tables, cross-references, and content discovery
- **[App Structure](./app-structure.md)** — Application organisation and routing
- **[Schema Overview](./schema-overview.md)** — Database schema documentation
- **[Tech Stack](./tech-stack.md)** — Technologies, frameworks, and libraries

### Infrastructure
- **[Authentication](./authentication.md)** — Auth patterns, RLS policies, and user management
- **[Caching](./caching.md)** — Redis caching with Upstash, LRU in-memory fallback
- **[Rate Limiting](./rate-limiting.md)** — Request rate limiting for API endpoints
- **[Deployment](./deployment.md)** — Production deployment guide

### UI
- **[Component Library](./component-library.md)** — UI components and patterns
- **[View Switcher Feature](./view-switcher-feature.md)** — Grid/list view implementation

---

## Content Management

- **[Admin CMS Guide](./admin-cms-guide.md)** — Content management interface and workflows
- **[Import System](./import-system.md)** — Bulk content import tools
- **[Content Strategy](./content-strategy.md)** — Content approach and guidelines
- **[Content Style Guide](./content-style-guide.md)** — Writing standards and formatting
- **[Content Taxonomy](./content-taxonomy.md)** — Categories and classification
- **[Case Study Style Guide](./case-study-style-guide.md)** — Case study writing standards
- **[Case Study Quality Rubric](./case-study-quality-rubric.md)** — Quality assessment criteria
- **[Email System](./email-system.md)** — Beehiiv newsletter + Resend transactional email

---

## Project Planning

- **[Project Plan](./openqase-project-plan.md)** — Vision, strategy, roadmap, and business model
- **[Overview](./overview.md)** — High-level project overview
- **[Release Notes](./release-notes.md)** — Version history and changes
- **[Changelog](../CHANGELOG.md)** — Detailed change log

---

## Archive

Historical planning documents from earlier development phases: [./archive/](./archive/)

---

## Contributing to Documentation

1. Keep docs current when code changes
2. Include code examples where helpful
3. Cross-reference related documentation
4. Test all links before committing

See [Contributing Guide](../CONTRIBUTING.md) for full guidelines.

---

**Last Updated:** March 2026
