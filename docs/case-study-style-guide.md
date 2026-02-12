# Case Study Style Guide

Writing guidelines for creating high-quality OpenQase case studies.

## Voice & Tone

**OpenQase voice:** Authoritative but accessible. We're experts explaining to smart non-experts.

**We are:**
- **Direct** — State facts plainly, don't hedge unnecessarily
- **Specific** — Names, numbers, dates over vague qualifiers
- **Honest** — Acknowledge limitations; don't oversell
- **Technical but clear** — Explain jargon when introduced; don't assume deep quantum knowledge

**We are not:**
- **Hype-driven** — No "revolutionary", "game-changing", "transformative"
- **Press-release-speak** — No "pleased to announce", "excited to partner"
- **Academic-dense** — No unexplained notation or assumed prerequisites
- **Salesy** — We document reality, not pitch potential

**Litmus test:** Would a senior engineer at a non-quantum company find this credible and useful?

---

## Section-by-Section Guidelines

### Introduction (2-3 paragraphs)
**Purpose:** Set the scene

**Include:**
- Who partnered with whom, and when
- What problem domain they addressed
- Why this partnership made sense (what each party brought)

**Don't:**
- Spend paragraphs on company history or market context
- Use generic industry framing

### Challenge (1-2 paragraphs)
**Purpose:** The specific problem

**Include:**
- What computational/business problem needed solving
- Why classical approaches weren't sufficient
- What constraints or requirements existed

**Don't:**
- Describe generic industry challenges
- Be vague about *this* project's specific problem

### Solution (2-3 paragraphs)
**Purpose:** The technical approach

**Include:**
- What algorithms/techniques were used and *why*
- How the approach addresses the challenge
- What was novel or notable about the method

**Don't:**
- List technologies without explaining the connection
- Use algorithm names as decoration

### Implementation (1-2 paragraphs)
**Purpose:** How it was built

**Include:**
- What hardware/software was used
- Who did the work (name people if known)
- What the process looked like

**Don't:**
- Repeat the Solution section in different words
- Be vague about the actual work done

### Results & Business Impact (2-3 paragraphs)
**Purpose:** What was achieved

**Include:**
- Concrete metrics and outcomes
- Comparison to classical/previous approaches
- Honest acknowledgment of limitations

**Don't:**
- Bury weak results in future-looking language
- Claim success without evidence

### Future Directions (1 paragraph)
**Purpose:** What's next

**Include:**
- Planned follow-up work
- Remaining open problems

**Don't:**
- Let this section be longer than Results
- Use it to hide that results were weak

---

## Good vs Bad Examples

### Specificity

| Bad | Good |
|-----|------|
| "Achieved significant improvements in circuit optimization" | "Reduced T-gate count by 37% on standard benchmarks, and 47% on elliptic curve cryptography circuits" |
| "The team developed innovative solutions" | "The team — including Francisco J. R. Ruiz from DeepMind and Nathan Fitzpatrick from Quantinuum — developed AlphaTensor-Quantum" |
| "Generated valuable intellectual property" | "Published findings in Nature Machine Intelligence and filed 3 patents covering tensor decomposition methods" |

### Technical Depth

| Bad | Good |
|-----|------|
| "Used VQE and QAOA for optimization problems" | "Used VQE for ground-state energy calculations because molecular simulation maps naturally to the variational ansatz; QAOA for combinatorial logistics problems where the mixer Hamiltonian encodes route constraints" |
| "Leveraged hybrid classical-quantum algorithms" | "Classical optimizers tuned variational parameters while quantum circuits evaluated the cost function — keeping quantum resources focused on the exponentially hard part" |

### Outcome Honesty

| Bad | Good |
|-----|------|
| "While full quantum advantage was not achieved, the collaboration established clear pathways and benchmarks for future implementations" | "The algorithm matched human-expert circuit designs on chemistry benchmarks and outperformed them on 12% of test cases. Full advantage over classical solvers remains dependent on hardware scaling." |
| "Positioned the company as a leader in quantum computing" | "BP's team completed 6 proof-of-concept projects; 2 advanced to pilot stage with production deployment pending fault-tolerant hardware" |

---

## Phrases to Avoid

### Kill on sight — delete or rewrite:

| Avoid | Replace with |
|-------|--------------|
| "represents a significant step/milestone" | State what actually happened |
| "significant" (as standalone qualifier) | A number, or delete |
| "valuable insights/intellectual property" | Name the insights or IP |
| "unlocking/harnessing the power of" | Delete entirely |
| "cutting-edge/state-of-the-art" | Explain why it's advanced, or delete |
| "in today's rapidly evolving landscape" | Delete entirely |
| "transformative potential" | Describe the actual transformation |
| "positioned as a leader" | Evidence of leadership, or delete |
| "excited to announce/partner" | Just state the fact |
| "explore the intersection of X and Y" | State what they actually did |

### Hedging that hides weak content:

| Avoid | Ask yourself |
|-------|--------------|
| "promising results" | Promising how? What results? |
| "demonstrated the ability to" | Did it work or not? |
| "potential to provide advantages" | Did it provide advantages? |
| "aims to/seeks to/plans to" | Did they do it? |
| "proof of concept" | What was proved? |

**Rule of thumb:** If you can delete a phrase and lose no information, delete it.

---

## Sourcing Standards

### Every case study must have:
- At least 2 credible sources directly about *this* project
- Sources cited in a References section with enough detail to find them

### Good sources (prefer these):
- arXiv papers / peer-reviewed publications
- Official press releases with dates
- Named conference presentations
- Company technical blogs about the specific project
- Interviews with named people involved

### Weak sources (use only if nothing better exists):
- General company "About" pages
- Industry analyst reports (paywalled, unverifiable)
- News articles that just summarize press releases
- "Top 100 Quantum Companies" listicles

### Unacceptable sources:
- Links unrelated to the specific case study
- Broken links
- No sources at all

### Citation format:

```
[1] Quantinuum and Google DeepMind. (2024). "AlphaTensor-Quantum:
    AI-Enhanced Optimization of T Gates." arXiv:2402.xxxxx

[2] Nature Machine Intelligence. (2024). "AI-Driven Quantum Circuit
    Optimization." doi:10.1038/s42256-024-xxxxx
```

### If sources don't exist:
Flag the case study for deeper research or consider whether it belongs on OpenQase at all.

---

## Version History

- v1.0 - February 2026: Initial guide based on quality audit of existing case studies
