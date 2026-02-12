# Case Study Quality Rubric

A scoring system for auditing and prioritising case study improvements.

## Scoring Overview

**Six dimensions, each scored 1-5. Total: 6-30 points.**

| Score Range | Quality Level | Action |
|-------------|---------------|--------|
| 24-30 | Publish-ready, flagship quality | No changes needed |
| 18-23 | Acceptable, minor improvements needed | Polish when time permits |
| 12-17 | Needs significant rework | Priority for rewrite |
| 6-11 | Rewrite from scratch or remove | Immediate attention |

---

## Dimension 1: Specificity

**What we're measuring:** Does the case study use concrete details (numbers, names, dates, metrics) or hide behind vague language?

| Score | Criteria | Example |
|-------|----------|---------|
| **5** | Multiple specific metrics, named people, precise outcomes | "37% reduction in T-gate count"; "Team included Francisco J. R. Ruiz and Nathan Fitzpatrick" |
| **4** | Some specific metrics, mostly concrete language | "Reduced processing time by approximately 40%" |
| **3** | Mix of specific and vague; has some numbers but also hedging | "Achieved significant improvements, with some tests showing 20% gains" |
| **2** | Mostly vague with rare specifics; relies on qualitative claims | "Demonstrated promising results across multiple benchmarks" |
| **1** | No concrete numbers, names, or metrics; entirely qualitative | "Represents a significant step"; "Generated valuable insights" |

**Red flags (automatic -1):**
- "Significant" without quantification
- "Valuable intellectual property" (what IP?)
- "Positioned itself as a leader" (says who?)

---

## Dimension 2: Sources

**What we're measuring:** Are claims backed by traceable, credible references — or unsourced assertions?

| Score | Criteria | Example |
|-------|----------|---------|
| **5** | 3+ specific citations (papers, official announcements, named publications) | arXiv paper, Nature article, company press release with date |
| **4** | 2-3 credible sources, directly relevant to the case study | Press release + one technical paper |
| **3** | 1-2 sources, or sources that are tangentially relevant | One press release, or a general company blog post |
| **2** | Links exist but are generic (company homepages, "quantum company lists") | Links to "100 Quantum Companies" listicles |
| **1** | No references, or references are broken/inaccessible | Empty references section, or dead links |

**Red flags (automatic -1):**
- Links that aren't about this specific project
- References to paywalled reports without summary
- "According to industry analysts" (which analysts?)

---

## Dimension 3: Technical Depth

**What we're measuring:** Does it explain *how* and *why* things work, or just list buzzwords?

| Score | Criteria | Example |
|-------|----------|---------|
| **5** | Explains technical approach clearly; reader understands why this solution fits this problem | "T-gates require magic state distillation, which consumes physical resources — AlphaTensor-Quantum reduces this by searching circuit configurations" |
| **4** | Good technical explanation with minor gaps; mostly clear chain of reasoning | Explains the algorithm choice and why it helps, but doesn't fully explain limitations |
| **3** | Names technologies correctly but doesn't explain connections | "Used VQE and QAOA for optimization" — but why these? How do they help? |
| **2** | Surface-level; could apply to any quantum project | "Leveraged hybrid classical-quantum algorithms to address computational challenges" |
| **1** | Buzzword soup; no actual technical content | "Explored the intersection of quantum computing and AI to unlock new possibilities" |

**Red flags (automatic -1):**
- Algorithm names dropped without context
- "Quantum advantage" claimed without explanation
- Technical terms used incorrectly

---

## Dimension 4: Outcome Clarity

**What we're measuring:** Is it honest and clear about what was actually achieved — including limitations?

| Score | Criteria | Example |
|-------|----------|---------|
| **5** | Clear outcomes with metrics; honest about both successes and limitations | "Achieved 37% cost reduction in benchmarks; matched human-designed solutions for quantum chemistry while requiring less manual intervention" |
| **4** | Clear outcomes, mostly quantified; limitations acknowledged but brief | "Demonstrated 40% improvement in molecular property prediction; full production deployment pending hardware improvements" |
| **3** | Outcomes stated but vague; mixes real results with future potential | "Showed promising results; identified pathways for future quantum advantage" |
| **2** | Buries outcomes in hedging; hard to tell what was actually achieved | "While full quantum advantage was not achieved, the collaboration established clear pathways and benchmarks" |
| **1** | No clear outcomes; all future-looking or hypothetical | "Positioned the company for the quantum era"; "Laid foundation for continued research" |

**Red flags (automatic -1):**
- Results section that's mostly about "future directions"
- "Proof of concept" with no explanation of what was proved
- Success claims without any supporting evidence

---

## Dimension 5: Writing Quality

**What we're measuring:** Is the prose clear and direct, or padded with filler and AI-speak?

| Score | Criteria | Example |
|-------|----------|---------|
| **5** | Clear, direct sentences; no filler; reads like expert wrote it | "The team reduced T-gate count by reframing circuit optimization as a tensor decomposition problem." |
| **4** | Mostly clear; occasional wordiness but no major filler | Generally good, one or two sentences could be tighter |
| **3** | Readable but padded; some filler phrases that add no information | "This innovative approach leveraged cutting-edge technology to address key challenges" |
| **2** | Noticeably fluffy; multiple filler phrases per section | "Represents a significant milestone"; "unlocking new possibilities"; "transformative potential" |
| **1** | Obvious AI-generated or press-release-speak throughout | "In today's rapidly evolving landscape, the partnership represents a significant step forward in harnessing the power of quantum computing" |

**Filler phrases to flag (each occurrence = warning):**
- "significant step/milestone"
- "represents a [adjective] [noun]"
- "unlocking/harnessing the power of"
- "cutting-edge/state-of-the-art"
- "transformative potential"
- "in today's rapidly evolving landscape"
- "positioned as a leader"

---

## Dimension 6: Completeness

**What we're measuring:** Are all sections substantive, or are some thin/filler?

| Score | Criteria | Example |
|-------|----------|---------|
| **5** | All sections (Intro, Challenge, Solution, Implementation, Results, Future) are substantive with distinct content | Each section adds new information; no repetition between sections |
| **4** | All sections present and reasonable; one section slightly thin | Results section could use one more concrete example |
| **3** | Most sections adequate; one or two are clearly underdeveloped | Implementation section is vague; just restates the Solution |
| **2** | Multiple thin sections; content repeats across sections | Challenge, Solution, and Implementation all say roughly the same thing in different words |
| **1** | Sections are placeholders; feels like template wasn't properly filled in | "The implementation followed a phased approach..." with no actual phases described |

**Red flags (automatic -1):**
- Same information repeated in multiple sections
- Section that could be deleted without losing information
- "Future Directions" longer than "Results"

---

## Audit Spreadsheet Template

When auditing, record:

| Slug | Specificity | Sources | Tech Depth | Outcomes | Writing | Completeness | Total | Priority | Notes |
|------|-------------|---------|------------|----------|---------|--------------|-------|----------|-------|
| example-case-study | 3 | 2 | 2 | 2 | 2 | 3 | 14 | High | No real metrics, generic sources |

---

## Version History

- v1.0 - February 2026: Initial rubric based on Quantinuum/Google (good) vs Zapata/BP (weak) comparison
