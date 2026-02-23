# Zapata Computing and BP: VQE for Combustion Chemistry

**Slug:** `zapata-computing-bp-quantum-computing-energy-optimisation`
**Original Score:** 10/30 → **Target Score:** 24+

---

## Introduction

In 2019, BP and Zapata Computing began a multi-year collaboration to assess whether quantum computing could accelerate molecular simulations relevant to energy applications. BP brought domain expertise in combustion chemistry and industrial-scale computational workflows; Zapata contributed the Variational Quantum Eigensolver (VQE) — an algorithm co-invented by Zapata co-founder Jhonathan Romero — along with their Orquestra workflow platform.

The partnership focused on a specific, measurable goal: determine the quantum computational resources required to calculate combustion energies for small molecules with chemical accuracy (within 1 kcal/mol). This wasn't a demonstration of quantum advantage — it was a rigorous resource estimation to understand when advantage might become feasible.

## Challenge

Calculating molecular ground-state energies is central to understanding combustion reactions, catalyst behavior, and chemical stability. Classical methods like density functional theory (DFT) and coupled cluster (CCSD(T)) handle small molecules well, but scale poorly with molecular size and struggle with strongly correlated electron systems.

The specific challenge: combustion chemistry involves radicals and transition states where classical approximations break down. BP needed to know whether VQE — which doesn't rely on the same approximations — could provide accurate energies for molecules like CH₂, HCO, and CH₃O, and at what quantum hardware cost.

## Solution

The team chose VQE because it maps molecular Hamiltonians directly onto qubit operations, avoiding the approximation errors inherent in classical methods for strongly correlated systems. The variational approach also tolerates noise better than phase estimation, making it suitable for near-term devices.

A critical bottleneck in VQE is measurement overhead: estimating expectation values requires repeated quantum circuit executions, often millions of shots per iteration. Zapata researcher Peter D. Johnson developed Robust Amplitude Estimation (RAE), a technique that achieves Heisenberg-limited scaling without requiring deep circuits or phase estimation. RAE reduces the number of measurements needed by 1-2 orders of magnitude compared to standard sampling.

The team published their resource analysis in *Physical Review Research* (2022), quantifying exactly how many qubits, gates, and measurements would be needed for combustion energies across different molecules and basis sets.

## Implementation

The research team included Corneliu Buda and Eric J. Doskocil from BP's Applied Physical Sciences group, and Zapata scientists Jerome F. Gonthier and Maxwell D. Radin. Clena M. Abuan from BP presented the collaboration's progress at Q2B 2020.

Over 1,000 computational workflows ran on Zapata's Orquestra platform, benchmarking VQE circuits on simulators and real hardware. Hardware experiments used IBM Quantum and IonQ devices. In October 2024, the team published an experimental demonstration of RAE on IBM hardware for the H₂ molecule, validating the measurement reduction predicted by theory.

## Results & Business Impact

The *Physical Review Research* paper delivered a sobering but valuable conclusion: achieving chemical accuracy for combustion molecules via VQE requires quantum resources beyond current devices. For molecules like ethanol, the measurement overhead alone — even with RAE — would require error-corrected hardware or substantial further algorithmic improvements.

Specific findings:
- RAE reduced measurement requirements by 10-100x compared to standard VQE sampling, validated experimentally on IBM quantum hardware
- Resource estimates showed that VQE for CH₃O at chemical accuracy would need thousands of logical qubits and millions of two-qubit gates with current ansätze
- Hardware noise on NISQ devices introduced errors larger than the chemical accuracy threshold for molecules beyond H₂

The partnership produced four peer-reviewed publications (arXiv:2012.04001, arXiv:2203.07275, arXiv:2410.00686, plus methodology papers) and established concrete benchmarks for tracking hardware progress against chemistry requirements.

## Future Directions

The collaboration identified two paths forward: (1) continued algorithmic work to reduce measurement and gate overhead, potentially through machine learning-enhanced ansätze, and (2) waiting for error-corrected hardware where VQE's theoretical advantages can be realized without noise floors. BP has characterized the specific hardware milestones needed before revisiting production deployment.

---

## References

[1] Gonthier, J.F., Radin, M.D., Buda, C., Doskocil, E.J., Abuan, C.M., Romero, J. (2022). "Measurements as a roadblock to near-term practical quantum advantage in chemistry: Resource analysis." *Physical Review Research* 4, 033154. arXiv:2012.04001

[2] Johnson, P.D., et al. (2022). "Reducing the cost of energy estimation in the variational quantum eigensolver with robust amplitude estimation." arXiv:2203.07275

[3] Russo, V., Johnson, P.D., et al. (2024). "Experimental demonstration of Robust Amplitude Estimation on near-term quantum devices." arXiv:2410.00686

[4] Abuan, C.M. (2020). "Pioneering a Viable Quantum Computing Approach at BP." Q2B Conference presentation.
