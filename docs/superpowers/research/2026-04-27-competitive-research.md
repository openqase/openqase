# Competitive Research — Leading CMS Patterns

**Date:** 2026-04-27
**Scope:** Ghost, Sanity, Payload, Strapi, Directus, plus modern editor stacks
**Goal:** Identify patterns to steal for the OpenQase rebuild
**Status:** Discovery — research only

---

## 1. Ghost

**Architecture:** Monolithic Node.js (Express/Bookshelf, MySQL/SQLite) + Handlebars themed frontend + separate React admin SPA. Read-only Content API or Admin API. Often run headlessly behind Next.js.

**Schema/content model:** Shallow and fixed — Posts, Pages, Tags, Authors, Tiers, Settings. **No user-defined content types.** Deal-breaker for OpenQase's relational shape.

**Editor:** Koenig editor was rebuilt on **Lexical + React** in 2023–2024 (replacing Mobiledoc) — Ghost is the first major external Lexical adopter at scale. UX is "writer-first": minimal chrome, slash-menu cards (image, embed, callout, bookmark, gallery, HTML, markdown). Content stored as Lexical JSON.

**Publishing:** Drafts, scheduling, email newsletters tied to publish, member tiers, full subscriber/Stripe stack. v6.0 (Aug 2025) added networked publishing (ActivityPub), native analytics.

**Loved:** Editorial flow; "the only CMS that gets out of my way." Subscriber/paywall/email out of the box. No plugin sprawl.

**Painful:** Content model cannot be extended. No native AI authoring (as of 2026). Headless usage loses native membership UI.

**Steal:** Editor philosophy (minimal, focused, hides chrome). Koenig "card" pattern — slash menu inserts typed embeds. Compact publish/preview/schedule toolbar. **Don't copy the content model — it's a blog engine.**

---

## 2. Sanity

**Architecture:** Hosted "Content Lake" backend (proprietary store) + open-source **Studio** (Vite/React app you self-host). Consumers query via **GROQ** or GraphQL.

**Schema/content model:** Schema-as-code in TS/JS. Content types are JS objects with fields, validation, references. **Portable Text** is the rich-text primitive: a JSON array of blocks with marks, annotations, and arbitrary inline objects — fully queryable in GROQ.

**Editor:** Studio is highly customizable. **Presentation tool** (2024) introduced click-to-edit visual editing with overlays on a live Next.js preview; June 2025 added custom overlay components. Real-time collaboration with presence indicators (Figma-like).

**Publishing:** Drafts as separate documents (`drafts.foo`), real-time sync, scheduled publishing, releases (bundled changes), per-document version history.

**Loved:** Portable Text; structured-first model; GROQ; real-time multiplayer.

**Painful:** GROQ learning curve; doc gaps; weak i18n & TS ergonomics historically; vendor-hosted Content Lake (not your DB).

**Steal:**
- **Portable Text as body storage** for OpenQase. Switching from markdown to PT-style JSON unlocks queryable, mixed-content, structured rich text.
- **Schema-as-TypeScript-code** colocated with the app — generalize OpenQase's `RELATIONSHIP_MAPS` pattern.
- Click-to-edit visual editing is the right north star, but expensive to build. Defer.

---

## 3. Payload (3.0)

**Architecture:** Since 3.0 (Nov 2024), Payload **installs into your Next.js `/app` folder.** Same codebase, same TS types, same DB connection, same deployment. Postgres/SQLite/MongoDB via Drizzle. Admin UI is a Next.js route group it generates from your config. Consumers use Local API (no network hop in SSR), REST, or GraphQL.

**Schema/content model:** TypeScript-first **fields-as-code**. Collections (documents), Globals (singletons), and **Blocks** — a polymorphic field type where each entry chooses one of N typed schemas. Generates `payload-types.ts` you import in your frontend.

**Editor:** Default rich-text is **Lexical**, with custom Payload nodes for blocks, references, uploads, and link relationships. Slate supported as legacy.

**Publishing:** Drafts, autosave, versioning, scheduled publishing, prevention of concurrent editing, preview mode.

**Loved:** TS DX; tightest Next.js integration on the market; Local API kills round-trips. Wappalyzer shows ~30× growth in high-traffic site adoption Feb 2025–Feb 2026.

**Painful:** Plugin ecosystem younger than Strapi's; admin customization beyond field-level requires React work; Postgres schema is Payload-shaped (not human-friendly raw SQL).

**Steal:** Closest architectural match.
- **Blocks field pattern.** Body becomes `Block[]` instead of markdown string. Direct fit for case-study sections (Background, Quantum Approach, Results, References).
- **Fields-as-code with auto-generated types.** OpenQase manually maintains TS types — make config-driven.
- **Local API in SSR.** Maps onto OpenQase's `getStaticContentWithRelationships()` pattern; Payload formalizes it.
- **Drafts/autosave/versioning** as a baseline.

---

## 4. Strapi (5.x)

**Architecture:** Self-hosted Node.js monolith (or Strapi Cloud). React admin SPA bundled with the app. Any SQL DB. Auto-generated REST + GraphQL.

**Schema/content model:** Hybrid GUI **Content-Type Builder** (writes JSON schema files) + code. Collection types, single types, **Components** (reusable field groups; not the same as Payload Blocks). v5 added **Strapi AI** for type generation from prompts/Figma/screenshots.

**Editor:** Standard rich-text + markdown blocks. Less sophistication than Sanity or Payload.

**Publishing:** Draft & publish, basic scheduling, i18n (improving), role-based permissions.

**Loved:** GUI modeling approachable for non-devs; mature plugin ecosystem; data ownership.

**Painful:** Admin restarts on schema changes; deeply nested API responses awkward; major upgrades break plugins; i18n historically weak.

**Steal:** Limited. The GUI builder is non-goal for a single-dev project where schema-as-code is faster. Worth borrowing: **Components** concept (reusable field groups) for things like author bio or citation that repeat across content types.

---

## 5. Directus

**Architecture:** A "data platform on top of Postgres." Points at **your existing SQL database** without abstracting it — your column names, your tables. Adds `directus_*` system tables alongside. Admin UI auto-generates from introspected schema. Auto-generates REST + GraphQL + SDK.

**Schema/content model:** Database-first. Schema is the database schema; admin UI lets you create fields/relations/validations through a no-code interface that maps 1:1 to SQL.

**Editor:** Generic field editors, file/image management with transforms, basic WYSIWYG. Not class-leading.

**Publishing:** Workflows, revisions, comments, role-based permissions, no-code automation flows.

**Loved:** **This is the closest in spirit to OpenQase's current Supabase + custom admin setup.** You own your data; it's just Postgres. Granular RBAC. Fast time-to-admin for existing schemas. Open-source (BSL → GPL).

**Painful:** Editor experience for content-heavy work is generic ("relational model leaking through to editors"); BSL license worries some teams; cloud performance variable.

**Steal:**
- **Validates OpenQase's architecture.** Postgres + custom admin is legitimate.
- Auto-generate parts of the admin form layer from a single declarative schema (keep your custom React shell, reduce per-field boilerplate).
- **Important warning:** Directus's weakness — generic field editors that don't feel editorial — is exactly OpenQase's current weakness. Don't re-create it. Pair Directus-style data ownership with a Sanity/Payload-style authoring surface.

---

## Editor Stacks

### TipTap
Headless wrapper over **ProseMirror**. Bring your own UI. Massive extension catalog. Pro tier offers commercial collab. Right altitude for serious editor work — opinionated enough to be productive, headless enough to control everything. Has a Notion-like template now. **Painful:** You build the UI (slash menus, drag handles, floating toolbars).

### Lexical
Meta's framework. Used by Facebook/Messenger/WhatsApp/Instagram. Tree of `ElementNode` / `TextNode` / `DecoratorNode`. Plugin-based. Lower-level than TipTap; more code for the same result. Better performance characteristics on huge documents. Used by Ghost (Koenig) and Payload.

### BlockNote
React-only. Notion-style block editor built on TipTap built on ProseMirror. Slash menu, drag handles, floating toolbar, animations, collaboration via Yjs/Liveblocks — all out of the box. **Fastest path to a "Notion-style" editor.** Less customizable; deep customization pushes you back toward TipTap directly.

**Editor verdict for OpenQase:** **BlockNote** if you want it shipped this quarter; **TipTap** if willing to invest 4–6 weeks for a custom editorial surface that exactly fits OpenQase's content cards. Skip Lexical unless committing to its node model long-term.

---

## Honorable Mentions

- **Contentful** — enterprise structured-content SaaS. Strong modeling, weak visual preview, expensive. Wrong for OpenQase.
- **Keystone.js** — Node + Prisma + GraphQL admin. Reasonable Payload alternative if you prefer Prisma.
- **WordPress + Gutenberg** — block editor has improved but remains polarizing. Worth studying for block insertion UX and reusable blocks.
- **Notion** — not a CMS, but slash-menu, drag-handle, block-typing UX is the de facto modern standard. Treat as editorial UX reference.

---

## Patterns to Steal — Prioritized

1. **Replace markdown body with a typed-blocks model.** Steal Payload's Blocks pattern *or* Sanity's Portable Text. Body becomes `Block[]` (e.g., `RichTextBlock`, `CalloutBlock`, `AlgorithmReferenceBlock`, `CitationBlock`, `ImageBlock`). Single highest-leverage change — unlocks structured rendering, queryability, per-block UI.
2. **Adopt a Notion-style block editor.** Replace `<Textarea>` with **BlockNote** (fast) or **TipTap** (custom). Slash menu, drag handles, floating toolbar are non-negotiable in 2026.
3. **Schema-as-code with auto-generated TypeScript.** One config object per content type defines fields, relationships, validation, admin UI hints, and exports `Type` + `RelationshipMap`. OpenQase already has `RELATIONSHIP_MAPS` — formalize.
4. **Drafts, autosave, version history as baseline.** Steal from Payload. A `content_versions` table with `restore_version()` is a weekend's work and changes editorial confidence dramatically.
5. **Click-to-edit / live preview.** Steal Sanity Presentation pattern — split view with live Next.js page and click-to-edit overlays. Higher effort; high impact.
6. **Slash-menu "cards" for typed embeds.** Ghost Koenig's killer feature. In OpenQase: `/case-study` inserts a styled reference, `/algorithm` embeds a card, `/figure` adds a captioned image. Maps directly onto your relationship graph.
7. **Reusable Components / Blocks shared across content types.** Strapi Components / Payload Blocks. E.g., a `Citation` component used by case studies and algorithms.
8. **Generate admin forms from schema.** Directus's strongest idea. Stop hand-writing each `<Input>`; render from field config. Keep custom overrides for the editor surface.
9. **Scheduled publishing.** A `publish_at` timestamp + cron worker. Cheap; high editorial value.
10. **Per-relationship inline create.** When editing a case study, let editors create a missing industry inline rather than navigating away. Sanity, Payload, Strapi all do this; OpenQase doesn't.

---

## Stack Recommendation

For a single-developer Next.js + Supabase site that publishes structured editorial content with a relationship-heavy schema, the right architecture is **Payload-shaped, but built on what you already have.**

- **Editor:** **BlockNote** for v1 (ship in weeks). Migrate to custom **TipTap** later only if BlockNote's customization ceiling becomes painful. Skip Lexical.
- **Body storage:** A **Portable-Text-style JSON array of typed blocks** stored in a `jsonb` column in Supabase. Pick a small, opinionated set of block types up front (rich-text, callout, image, quote, citation, code, plus 3 OpenQase-specific cards: algorithm-ref, case-study-ref, industry-ref).
- **Schema-as-code:** Extend your `RELATIONSHIP_MAPS` into a full content-type registry (`contentTypes.ts`) that drives both runtime fetchers and admin form layer. Payload-style, DIY against Supabase.
- **Admin shell:** Keep custom `/admin` Next.js routes; replace per-field hand-wiring with a generic `<SchemaForm config={...}>` rendering inputs from registry. Directus idea, scoped.
- **Drafts / versions / scheduling:** Add `content_versions` table + `publish_at` column. Server actions write versions on every save; revalidation already exists.
- **Visual editing:** Defer. Simple split-pane preview iframe in v2. Sanity-style overlays in v3 if ever.
- **Don't:** Adopt Ghost (wrong content model). Self-host Directus on top of Supabase (two admin tools fighting). Migrate to Payload wholesale (rewrites your content layer when you only need to upgrade the authoring surface).

**The honest summary:** OpenQase needs a Payload-class authoring surface bolted onto its existing Supabase backend, not a CMS migration. Steal Ghost's writing-surface taste, Payload's blocks + schema-as-code, Sanity's Portable Text storage, and Notion's slash-menu UX — and leave the rest.
