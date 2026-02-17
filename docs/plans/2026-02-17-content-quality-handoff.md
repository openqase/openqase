# Content Quality Improvement — Session Handoff

**Date:** February 17, 2026
**Status:** In Progress

---

## Context

We identified that OpenQase's case study content has significant quality issues — AI-generated fluff, vague metrics, missing sources, filler phrases. We're systematically auditing and rewriting all 56 case studies.

## What's Been Completed

### 1. Quality Framework Created
- **Rubric:** `docs/case-study-quality-rubric.md` — 6 dimensions (Specificity, Sources, Technical Depth, Outcome Clarity, Writing Quality, Completeness), scored 1-5 each
- **Style Guide:** `docs/case-study-style-guide.md` — Voice guidelines, section-by-section guidance, good/bad examples, phrases to avoid

### 2. Full Audit Completed
- **Results:** `docs/case-study-audit-results.md` — All 56 case studies scored and ranked
- **Summary:**
  - 3 publish-ready (24-30): Nord Quantique, Quantinuum/Google, IonQ/Airbus
  - 14 acceptable (18-23): minor polish needed
  - 33 need significant rework (12-17)
  - 6 rewrite or remove (6-11)
- **Average score:** 15.6/30

### 3. Bottom 6 Researched
Verified whether primary sources exist for each:

| Case Study | Score | Finding | Action |
|------------|-------|---------|--------|
| IBM/PayPal | 11 | Single news article; no real project | **REMOVE** |
| Zapata/Biogen | 10 | No evidence exists; fabricated | **REMOVE** |
| Rigetti/AFRL | 11 | Real contracts, papers, researchers | **REWRITE** ✅ |
| SandboxAQ/Deloitte | 11 | Real DISA contract, WEF panel | **REWRITE** ✅ |
| Zapata/BP | 10 | 4 peer-reviewed papers | **REWRITE** ✅ |

### 4. Rewrites Created
Location: `docs/case-study-rewrites/`
- `rigetti-afrl-rewrite.md` — Ready to apply
- `sandboxaq-deloitte-rewrite.md` — Ready to apply
- `zapata-bp-rewrite.md` — Ready to apply

---

## What Needs To Be Done (Manual)

### Immediate — Via Admin UI
1. **Remove 2 case studies** (no verifiable sources):
   - `ibm-quantum-paypal-advanced-fraud-detection-risk-management`
   - `zapata-biogen-drug-discovery-quantum-machine-learning`

2. **Update 3 case studies** with rewritten content from `docs/case-study-rewrites/`:
   - `rigetti-computing-us-air-force-research-laboratory-partnership`
   - `sandboxaq-deloitte-cybersecurity`
   - `zapata-computing-bp-quantum-computing-energy-optimisation`

---

## What Needs To Be Done (Next Session)

### Continue Rewriting — Priority Order

**Scores 12-15 (worst of remaining, 20 case studies):**
1. cqc-axa-quantum-computing-applications-insurance-financial-risk-management (12)
2. cambridge-quantum-computing-crown-bioscience-drug-discovery (12)
3. pasqal-saudi-aramco-partnership-applications-energy-sector (12)
4. 1qbit-bmw-partnership-quantum-computing-automotive-optimisation (13)
5. 1qbit-dow-chemical-quantum-computing-portfolio-optimisation-risk-analysis (13)
6. 1qbit-natwest-quantum-computing-financial-portfolio-optimisation (13)
7. d-wave-nec-strategic-partnership-quantum-computing-applications-japan (13)
8. d-wave-save-on-foods-quantum-optimization-partnership (13)
9. honeywell-quantum-solutions-jp-morgan-financial-services-quantum-computing (13)
10. ibm-exxon-mobil-maritime-logistics-optimisation (13)
... (see full list in `docs/case-study-audit-results.md`)

### Process for Each
1. Research primary sources (press releases, papers, named people)
2. If no sources exist → flag for removal
3. If sources exist → rewrite following style guide
4. Save rewrite to `docs/case-study-rewrites/[slug]-rewrite.md`
5. User applies via admin UI

---

## Key Files

| File | Purpose |
|------|---------|
| `docs/case-study-quality-rubric.md` | Scoring criteria |
| `docs/case-study-style-guide.md` | Writing guidelines |
| `docs/case-study-audit-results.md` | Full audit with scores |
| `docs/case-study-rewrites/*.md` | Completed rewrites ready to apply |

---

## Future: CMS Feature

After ~10-15 manual rewrites, design a CMS feature:
- "Quality Review" tab on case study edit page
- Shows current content alongside AI-suggested improvements
- One-click accept/reject per section
- "Research this case study" button to fetch latest sources

---

## Prompt for Next Session

```
I'm continuing work on OpenQase content quality improvement.

Read the handoff document at docs/plans/2026-02-17-content-quality-handoff.md

The immediate tasks are:
1. I need to manually remove 2 case studies and apply 3 rewrites via admin UI (remind me of the slugs)
2. Then continue rewriting the next batch of low-scoring case studies (scores 12-15)

For each rewrite: research primary sources, write improved content following the style guide, save to docs/case-study-rewrites/
```
