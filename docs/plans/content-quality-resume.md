# Content Quality Improvement — Resume Guide

**Last updated:** February 23, 2026
**Status:** In progress — Phase 1 partially complete, Phase 2 not started

---

## Quick Context

OpenQase has 56 case studies. Most were AI-generated and have serious quality problems: vague metrics, fabricated sources, filler phrases, missing outcomes. We audited all 56, scored them on a 6-dimension rubric (6–30 points), and started fixing them bottom-up.

**Average score: 15.6/30.** Only 3 out of 56 are publish-ready.

---

## What's Already Done

1. **Quality rubric** — `docs/case-study-quality-rubric.md` (6 dimensions, scored 1–5 each)
2. **Style guide** — `docs/case-study-style-guide.md` (voice, section guidance, anti-patterns)
3. **Full audit** — `docs/case-study-audit-results.md` (all 56 ranked with scores and notes)
4. **3 rewrites completed** — in `docs/case-study-rewrites/`:
   - `rigetti-afrl-rewrite.md`
   - `sandboxaq-deloitte-rewrite.md`
   - `zapata-bp-rewrite.md`
5. **2 case studies flagged for removal** (no verifiable sources exist):
   - `ibm-quantum-paypal-advanced-fraud-detection-risk-management` (score: 11)
   - `zapata-biogen-drug-discovery-quantum-machine-learning` (score: 10)

---

## What Needs To Be Done

### Step 1: Manual Admin Tasks (User does this)

These require the admin UI and can't be done by Claude Code:

**Remove 2 fabricated case studies:**
- `ibm-quantum-paypal-advanced-fraud-detection-risk-management`
- `zapata-biogen-drug-discovery-quantum-machine-learning`

**Apply 3 completed rewrites** (copy content from `docs/case-study-rewrites/` into admin):
- `rigetti-computing-us-air-force-research-laboratory-partnership` ← use `rigetti-afrl-rewrite.md`
- `sandboxaq-deloitte-cybersecurity` ← use `sandboxaq-deloitte-rewrite.md`
- `zapata-computing-bp-quantum-computing-energy-optimisation` ← use `zapata-bp-rewrite.md`

### Step 2: Continue Rewriting (Claude Code helps with this)

**20 case studies scoring 12–15**, in priority order:

| # | Score | Slug |
|---|-------|------|
| 1 | 12 | cqc-axa-quantum-computing-applications-insurance-financial-risk-management |
| 2 | 12 | cambridge-quantum-computing-crown-bioscience-drug-discovery |
| 3 | 12 | pasqal-saudi-aramco-partnership-applications-energy-sector |
| 4 | 13 | 1qbit-bmw-partnership-quantum-computing-automotive-optimisation |
| 5 | 13 | 1qbit-dow-chemical-quantum-computing-portfolio-optimisation-risk-analysis |
| 6 | 13 | 1qbit-natwest-quantum-computing-financial-portfolio-optimisation |
| 7 | 13 | d-wave-nec-strategic-partnership-quantum-computing-applications-japan |
| 8 | 13 | d-wave-save-on-foods-quantum-optimization-partnership |
| 9 | 13 | honeywell-quantum-solutions-jp-morgan-financial-services-quantum-computing |
| 10 | 13 | ibm-exxon-mobil-maritime-logistics-optimisation |
| 11 | 14 | 1qbit-accenture-biogen-drug-discovery |
| 12 | 14 | cambridge-quantum-computing-and-roche-partnership-for-drug-discovery |
| 13 | 14 | haiqu-toyota-ventures-quantum-computing-for-automotive-innovation |
| 14 | 14 | quantinuum-mitsui-trading-co |
| 15 | 14 | xanadu-astrazeneca-partnership-quantum-computing-drug-discovery |
| 16 | 14 | zapata-computing-bbva-quantum-computing-financial-services |
| 17 | 15 | google-quantum-ai-volkswagen-advancing-traffic-optimization-battery-research |
| 18 | 15 | ibm-barclays-partnership-financial-services-innovation |
| 19 | 15 | ibm-eon-partnership-quantum-computing-energy-grid-optimisation |
| 20 | 15 | ibm-quantum-mitsubishi-chemical-materials-discovery |

(Plus 12 more scoring 15 — see full list in `docs/case-study-audit-results.md`)

### Step 3: Polish (Scores 16–23)

After the rewrites, 47 case studies scoring 16–23 need minor fixes: verify metrics, add references, tighten prose. Lower priority.

---

## Process for Each Rewrite

1. **Research** — Search for primary sources: press releases, academic papers, news articles, named researchers. Use web search.
2. **Decide** — If no credible sources exist, flag for removal. If sources exist, proceed to rewrite.
3. **Write** — Follow `docs/case-study-style-guide.md`. Key rules:
   - Be specific (names, numbers, dates) or honestly say "not publicly disclosed"
   - Remove all filler phrases ("significant milestone", "positioned as a leader", etc.)
   - Every claim needs a source or a caveat
   - Results section must describe what actually happened, not future potential
   - Keep "Future Directions" shorter than "Results"
4. **Save** — Write to `docs/case-study-rewrites/[slug]-rewrite.md`
5. **User applies** — Content gets applied through the admin UI manually

---

## Key Reference Files

| File | What it is |
|------|------------|
| `docs/case-study-quality-rubric.md` | Scoring rubric (6 dimensions × 5 points) |
| `docs/case-study-style-guide.md` | Writing voice, section guidance, anti-patterns |
| `docs/case-study-audit-results.md` | All 56 case studies scored and ranked |
| `docs/case-study-rewrites/*.md` | Completed rewrites ready to apply |

---

## What Good Looks Like

The top 3 case studies are the benchmark:
- **Nord Quantique / Q-CTRL** (score 29) — Published PRL results, specific metrics, named researchers
- **Quantinuum / Google DeepMind** (score 27) — 37%/47% reductions, clear technical explanation
- **IonQ / Airbus** (score 26) — Specific qubit counts, multi-year research documented

Read these in the live site for reference before writing.

---

## GitHub Issue

Tracked in: https://github.com/openqase/openqase/issues/104
