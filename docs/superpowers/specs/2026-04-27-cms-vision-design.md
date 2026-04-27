# OpenQase CMS — Phase 1 Vision Spec

**Date:** 2026-04-27
**Status:** Proposed (Phase 1 vision; awaits owner approval)
**Companion:** `docs/superpowers/research/2026-04-27-cms-discovery-findings.md`

---

## What we are building

OpenQase is a structured editorial CMS for quantum-computing knowledge — case studies, algorithms, industries, personas, blog posts, plus four contextual entity types — published as a static site. The rebuild brings it from "custom CMS layered onto Supabase by accumulation" to "deliberate, Ghost-shaped editorial tool with structured content."

It is **a multi-author editorial CMS** where adding a content type is a config file, the body is typed blocks queryable from SQL, and the public site is statically generated. The admin should feel like Ghost; the schema model is closer to Payload; the storage is plain Postgres. It is not a framework, not a product, not a real-time collaborative tool. It is a working CMS owned by one person, with hooks for a small contributor team.

## Reference points

We are explicit about whose ideas we steal and which we deliberately don't.

| System | What we take | What we don't take |
|---|---|---|
| **Ghost CMS** | Editorial taste; writer-first surface; slash-menu cards; linear workflow; role gradations; scheduled publish; status flags | Its content model (too shallow); the membership/Stripe stack; Handlebars themes |
| **Payload CMS** | Schema-as-code (`defineContentType`); auto-generated TS types; admin form rendered from registry; blocks pattern for body | Self-hosted infrastructure surface; the full collection lifecycle hooks system |
| **Sanity (Portable Text)** | Body-as-typed-`Block[]` storage shape | Hosted Content Lake; GROQ; Studio as separate app; Presentation tool |
| **Notion / BlockNote** | Slash-menu authoring UX; drag handles; floating toolbar | Notion's data model; full Notion-style page hierarchy |

We do *not* take: Strapi's GUI content-type builder, Directus's generic admin, Lexical (BlockNote chosen instead), or anything from WordPress.

## Load-bearing decisions

These are the decisions whose reversal would ripple through everything else. Surfaced so future-self knows what's intentional vs. incidental.

1. **Stack: Next.js + Supabase, indefinitely.** DB choice is implementation detail under the Ghost pattern. The Ghost-pattern commitment makes the database choice less load-bearing, not more. No migration to AWS, Neon, or anywhere else without a concrete cost or feature reason.
2. **Security model: app-layer enforcement (the "Ghost pattern").** The database is private *by discipline*, not by network topology. Every public content read goes through a single `publicQuery()` chokepoint that applies `published=true` and `deleted_at IS NULL`. RLS on content tables is belt-and-braces, not load-bearing. Junction-table `USING (true)` policies stay; the leak surface (UUID metadata) is acceptable for an editorial knowledge base where content is intentionally findable.
3. **Workflow model: Ghost-shaped, linear.** Multi-author with role gradations (`admin`, `editor` for v1; extensible). Per-record `created_by` and `last_edited_by`. Last-write-wins with an "X edited this 30s ago" banner. No shadow-document drafts, no real-time collaboration, no concurrent-edit mutex.
4. **Content model: typed blocks as `jsonb`.** Body becomes `body jsonb` storing `Block[]`. v1 ships **three** block types — `RichTextBlock`, `HeadingBlock` (or heading-as-style; small modeling choice deferred to B1), `CitationBlock`. Future-authoring blocks (callout, image, code, algorithm-ref, case-study-ref, industry-ref) are layered in later as authoring need emerges, not pre-built.
5. **Editor: BlockNote, contingent on the B1 spike.** Half-day prototype of one OpenQase-specific custom block confirms the customisation ceiling. Pre-committed fallbacks if B1 fails: TipTap (4–6 weeks) or defer rich text and ship v1 with markdown editor. Pre-decided in the Phase 0 abandonment-thresholds table; not an in-the-moment choice.
6. **Admin form: registry-driven.** One generic `<SchemaForm config={...}>` rendered from `defineContentType()` config replaces nine per-type React clients. The relationship-picker abstraction within `<SchemaForm>` is the single highest-risk piece of the rebuild.

## Quality bars

What "excellent" looks like, in testable terms:

- **Authoring.** Editing a case study feels comparable to Ghost — minimal chrome, slash-menu insertion of typed embeds, scheduled publish, version history with attribution.
- **Admin DX.** Adding a 10th content type is one config file (`src/cms/types/foo.ts`) plus a migration. Zero React component boilerplate. Existing 3,576 lines of duplicated admin code reduced to a single generic form.
- **Content shape.** Body content is structured `Block[]` queryable from SQL (`->>` and `jsonb_path_query`), renderable per-block on the public side, and indexed for full-text search via the existing tsvector infrastructure.
- **Velocity.** A bug in relationship handling lives in one place, not nine. Adding a new field to a content type is a one-line change to the type definition.
- **Security.** An anonymous request to any draft or soft-deleted record returns 404 regardless of which fetcher path was used, because every public read goes through `publicQuery()`.
- **Testability.** Registry-level changes have integration tests that exercise all 9 content types end-to-end.

## Out of scope for v1

These are deliberately deferred. Not "we'll never do them"; "they don't earn their cost in v1."

- Real-time collaborative editing (presence indicators, live cursors, multiplayer)
- Click-to-edit live preview overlays (Sanity Presentation pattern)
- AI-assisted authoring
- A public API for external consumers (the existing `/api/*` routes stay; no new public surface)
- Multi-tenancy
- Granular RBAC beyond `admin` + `editor` (extensible schema, but only two roles in v1)
- Plugin system / lifecycle hooks for third-party extensions
- Newsletter / membership / paywall stack (existing Beehiiv/Resend integration stays as-is; not redesigned)
- Comments / community features on public pages
- Automated content quality scoring or moderation workflow

## Open follow-ups (deferred to specific phases, not unanswered)

| Question | Resolution |
|---|---|
| BlockNote vs TipTap commitment | Settled by B1 spike outcome; fallback paths in the abandonment-thresholds table. |
| RLS-side vs JS-side junction filtering | Settled: defer (Option D). Revisit only if a real-time / client-side-read feature enters the roadmap. |
| `HeadingBlock` as separate type vs heading-as-style on a text block | Settled by B1; both Portable Text and BlockNote use heading-as-style; migration regex is identical either way. |
| ISR latency on deployed Vercel | Measured as Phase A acceptance; calibrates Phase B's "within 2× of baseline" threshold. |

## Phase plan recap

The synthesis already contains a draft Phase A/B/C plan with day ranges and abandonment thresholds. Phase 2 work refines that plan:

| Phase | Output | Status |
|---|---|---|
| 0 — Discovery | Findings + audits + competitive research + empirical follow-up | ✅ Complete |
| 1 — Vision | This document | 🟡 Proposed |
| 2 — Slice & sequence | Refine the draft Phase A/B/C plan; confirm slice boundaries; identify v0.5 ship target | ⏳ Next |
| 3 — Per-slice design specs | A0 schema cross-check, A1 security PR, A2 engine completion, A3 generic admin form, A5 drafts/versioning, A7 search fix, B1 BlockNote spike, B2 block model, etc. | ⏳ |

The synthesis's draft phase plan is the input to Phase 2, not its output — Phase 2 takes those slices and asks: are the boundaries right? Is the order right? What ships if Phase B stalls? Where are the natural release points (v0.5, v0.6, v0.7)?

## Success criterion for this spec

This document succeeds if, six months from now, the question "should we add real-time collaboration?" or "should we move to AWS?" or "should we build a plugin system?" can be answered by re-reading the relevant section here, rather than re-deriving the answer from first principles. The point of a vision spec is to make load-bearing decisions explicit so they don't quietly rot into accidental architecture.
