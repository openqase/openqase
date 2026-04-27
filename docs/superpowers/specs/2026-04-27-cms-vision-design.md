# OpenQase CMS — Phase 1 Vision Spec

**Date:** 2026-04-27
**Status:** Approved (signed off 2026-04-27)
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
2. **Security model: app-layer enforcement (the "Ghost pattern").** The database is private *by discipline*, not by network topology. Every public content read goes through a single `publicQuery()` chokepoint that applies `published=true` and `deleted_at IS NULL`. RLS on content tables is belt-and-braces, not load-bearing.

   > **Invariant (named, load-bearing).** `publicQuery()` is the only function that returns content data to anonymous requests. Any new public read path that does not use it is a security-review trigger and must be flagged in PR review. Enforce by convention; ideally also by lint rule (forbid direct `client.from('case_studies').select(...)` outside the wrapper) or grep-based CI check. Without this invariant, "the database is private by discipline" is one PR away from being false.

   Junction-table `USING (true)` policies stay; the leak surface (UUID metadata) is acceptable for an editorial knowledge base where content is intentionally findable. **This is contingent on the `publicQuery()` invariant holding** — the junction leak only stays acceptable while content tables refuse to dereference unpublished UUIDs. If Finding A regresses, the junction leak compounds: attackers learn UUID pairs *and* can fetch the content they reference. Treat any regression of A as a Sev-1 incident.
3. **Workflow model: Ghost-shaped, linear.** Multi-author with role gradations (`admin`, `editor` for v1; extensible). Per-record `created_by` and `last_edited_by`. Last-write-wins with an "X edited this 30s ago" banner. No shadow-document drafts, no real-time collaboration, no concurrent-edit mutex.

   > **Scale ceiling.** The linear last-write-wins + banner model is sized for ~3–4 simultaneously active editors. Two editors with rare overlap is fine; five editors with daily overlap will start losing work to silent overwrites that the banner doesn't always catch. Beyond the ~4-editor ceiling, the workflow choice should be revisited (real-time collab or a checkout/lock pattern — both currently out of scope).
4. **Content model: typed blocks as `jsonb`.** Body becomes `body jsonb` storing `Block[]`. v1 ships **three** block types — `RichTextBlock`, `HeadingBlock` (or heading-as-style; small modeling choice deferred to B1), `CitationBlock`. Future-authoring blocks (callout, image, code, algorithm-ref, case-study-ref, industry-ref) are layered in later as authoring need emerges, not pre-built.
5. **Editor: BlockNote, contingent on the B1 spike.** Half-day prototype of one OpenQase-specific custom block confirms the customisation ceiling.

   > **Pre-committed fallback if B1 fails: defer rich text and ship v1 with a markdown editor.** Block model and storage shape still ship; only the in-editor surface defers to a later cycle. TipTap is *not* the default fallback because a 4–6 week custom-editor build doesn't fit a side-project budget that already competes with Marqov for attention. TipTap only becomes viable if a follow-up spike (separate decision, separate session) confirms a 6-week budget is genuinely available — which by definition means Marqov is in a quiet phase.

   This is a real pre-commitment, not a "consider the options when we get there." The Phase 0 abandonment-thresholds table will be updated to match.
6. **Admin form: registry-driven.** One generic `<SchemaForm config={...}>` rendered from `defineContentType()` config replaces nine per-type React clients. The relationship-picker abstraction within `<SchemaForm>` is the single highest-risk piece of the rebuild — see the Phase 0 abandonment-thresholds table: if A3 (generic admin form) exceeds 15 days, stop and re-evaluate whether a registry-driven generic form is the right abstraction at this scale, vs. a less ambitious "shared form components, per-type wrapper" pattern.

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
- AI-assisted authoring as an in-editor feature *(but see design check below — the block contract should accept externally-generated `Block[]` arrays cleanly)*
- A public API for external consumers (the existing `/api/*` routes stay; no new public surface)
- Multi-tenancy
- Granular RBAC beyond `admin` + `editor` (extensible schema, but only two roles in v1)
- Plugin system / lifecycle hooks for third-party extensions
- Newsletter / membership / paywall stack (existing Beehiiv/Resend integration stays as-is; not redesigned)
- Comments / community features on public pages
- Automated content quality scoring or moderation workflow
- Migration tooling for importing from third-party CMSes (WordPress, Ghost, Notion, etc.) — the existing Qookie-import pipeline stays as the only inbound channel

### Design check (not a feature): block contract accepts external generators

The block contract (`Block[]` shape, validation rules, storage path) should be clean enough that an external process — a one-off import script, the existing Qookie-import pipeline, a future AI generator — can produce valid `Block[]` arrays without going through the in-app editor. This is a 30-second sanity check during B2, not a feature: ensure block validation and the database write path don't depend on editor-specific state. If they do, that's an unintended coupling worth fixing.

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
| 1 — Vision | This document | ✅ Approved |
| 2 — Slice & sequence | Refine the draft Phase A/B/C plan; confirm slice boundaries; identify v0.5 ship target | ⏳ Next |
| 3 — Per-slice design specs | A0 schema cross-check, A1 security PR, A2 engine completion, A3 generic admin form, A5 drafts/versioning, A7 search fix, B1 BlockNote spike, B2 block model, etc. | ⏳ |

The synthesis's draft phase plan is the input to Phase 2, not its output — Phase 2 takes those slices and asks: are the boundaries right? Is the order right? What ships if Phase B stalls? Where are the natural release points (v0.5, v0.6, v0.7)?

**Explicit Phase 2 deliverable: define the v0.5 ship target.** The Phase 0 abandonment-thresholds table authorises shipping Phase A as v0.5 if Phase B still feels too big at A's close. Phase 2 must commit, in advance, to *what* v0.5 ships as. The decision factors along two independent axes:

- **Admin path scope** — who uses the new registry-driven form: admins only / all editors / no one yet (gated until Phase B).
- **Public rendering scope** — what the public site renders from: old path / new path / new path with a "rich editing coming soon" banner.

A conservative default combination is *new admin path for admins; old public path* — battle-tests the new form on real content before flipping public rendering. A more aggressive cutover ships both paths together. Phase 2 picks the combination based on A3's risk profile, and that decision shapes A3's acceptance criteria — specifically, whether the new admin form must reach full parity with the old per-type forms before A3 is considered done, or whether a narrower internal-release scope is acceptable. Pre-deciding this prevents A3 from over-scoping in pursuit of an undefined v0.5.

## Signals to watch — when the vision itself needs re-examining

The "edit in place" discipline below keeps the spec current. This section answers a different question: what would force re-reading the *load-bearing decisions themselves*, not just updating the deliverables that flow from them? One signal per major decision, so future-you has a concrete tripwire instead of vague unease.

| Decision | Signal that re-examination is warranted |
|---|---|
| 1. **Stack stays Supabase** | Monthly Supabase bill exceeds tolerance (set a number now — e.g. $100/mo); *or* a specific Postgres extension or operational need is blocked by Supabase's hosting model |
| 2. **Ghost-pattern security** | More than one Finding-A-class regression per quarter — the "private by discipline" pattern isn't holding; revisit RLS-as-primary-defense |
| 3. **Linear last-write-wins workflow** | Active editor count grows past 4 *and* overwrite-loss incidents become weekly; the workflow model needs real-time collab or a checkout/lock pattern |
| 4. **Typed blocks as `jsonb`** | Block validation routinely fails on externally-generated content; the block contract is editor-coupled despite the B2 design check |
| 5. **BlockNote editor** | Customising BlockNote for new block types becomes the bottleneck on shipping new content patterns — at that point the half-day spike's prior probability of success is no longer valid |
| 6. **Registry-driven admin form** | A3 lands but adding the 11th content type still requires React work — the registry abstraction failed at scale; revisit a "shared form components, per-type wrapper" pattern |

Editing-in-place handles incremental drift. Signals-to-watch handle structural failure of the underlying decision. Different mechanisms, different triggers; both needed.

## Success criterion (and its counterpart)

**Success.** This document succeeds if, six months from now, the question "should we add real-time collaboration?" or "should we move to AWS?" or "should we build a plugin system?" can be answered by re-reading the relevant section here, rather than re-deriving the answer from first principles.

**Failure.** This document fails if, six months from now, the answer to a load-bearing question is "we changed our mind but didn't update this doc." Vision specs rot when reality diverges silently.

**The discipline that makes success possible.** When a load-bearing decision changes — Supabase-vs-something-else, Ghost-pattern-vs-RLS-load-bearing, BlockNote-vs-something-else — *edit this document* rather than supplementing it with a new doc that contradicts it. Versioned, in-place edits with git history beat append-only memos. If a decision genuinely shifts, the corresponding section here is the deliverable. Treat the vision spec as a living document with a rate-limited update cycle (revisit at the close of each phase, plus on-demand when a load-bearing question gets re-asked).

The point of a vision spec is to make load-bearing decisions explicit so they don't quietly rot into accidental architecture. The point of editing it in place is to make that explicitness *survive*.
