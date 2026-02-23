# Rigetti Computing and US Air Force Research Laboratory: Building Quantum Infrastructure for Defense Applications

**Slug:** `rigetti-computing-us-air-force-research-laboratory-partnership`
**Original Score:** 11/30 → **Target Score:** 24+

---

## Introduction

Since 2020, the Air Force Research Laboratory (AFRL) has partnered with Rigetti Computing to develop quantum computing and networking capabilities for defense applications. The partnership began with AFRL accessing Rigetti's Fab-1 fabrication facility for custom superconducting quantum hardware, and has expanded into a multi-contract relationship spanning quantum processors, integrated circuits, and quantum networking infrastructure.

AFRL brought requirements for quantum-enabled sensing, communication, and computation relevant to defense missions. Rigetti brought fabrication expertise in superconducting quantum integrated circuits, including the ability to produce custom Josephson junction-based devices. The combination allows AFRL researchers to prototype quantum hardware designs without building their own fabrication line—a capability that would require hundreds of millions of dollars and years of development.

## Challenge

AFRL needed to advance quantum technology across multiple fronts: developing next-generation quantum processors for computation, creating quantum networking capabilities for secure communication, and building the fabrication infrastructure to support both. Traditional procurement models—buying finished systems from vendors—couldn't address AFRL's requirement for custom designs, rapid iteration, and integration with existing defense infrastructure.

The quantum networking challenge was particularly demanding. AFRL aimed to demonstrate entanglement distribution across real-world fiber-optic and free-space links in the Rome, NY area, connecting multiple research sites. This required not just quantum hardware but integration with telecommunications fiber, classical networking infrastructure, and the ability to maintain quantum coherence across kilometer-scale distances.

## Solution

AFRL structured its Rigetti partnership as a series of IDIQ (Indefinite Delivery/Indefinite Quantity) contracts, allowing flexible task orders as requirements evolved. The September 2023 contract—a five-year IDIQ award—provided access to Rigetti's foundry services for quantum integrated circuits, superconducting amplifiers, and 9-qubit quantum processing units. This "Quantum Foundry" model gives AFRL researchers access to fabrication capabilities on a task-order basis rather than requiring capital investment in facilities.

For quantum networking, AFRL awarded Rigetti a $5.8 million contract in September 2025 to advance superconducting quantum networking capabilities in partnership with QphoX, a company specializing in microwave-to-optical transduction. Converting quantum information between microwave frequencies (where superconducting qubits operate) and optical frequencies (where fiber networks operate) is essential for connecting superconducting quantum computers over distances beyond cryogenic cables.

A separate April 2025 award of $5.48 million from the Air Force Office of Scientific Research supports development of ABAA (alternating bias-assisted annealing) chip fabrication. This project involves a consortium including Iowa State University, RMIT University, University of Connecticut, and Lawrence Livermore National Laboratory, with Rigetti providing fabrication services.

## Implementation

The fabrication work occurs at Rigetti's Fab-1 facility, a dedicated superconducting quantum device fabrication plant. AFRL has used this facility since 2020 for producing custom quantum integrated circuits. The foundry services model means AFRL researchers specify designs, and Rigetti manufactures the devices—similar to how semiconductor companies use third-party fabs for chip production.

For quantum networking demonstration, AFRL built three interconnected Quantum Local Area Networks (QLANs): the Griffiss QLAN, Rome Research Site QLAN, and Stockbridge QLAN, all located in the Rome, NY region. The technical implementation, documented in arXiv:2508.01030, involved a collaboration of 32 researchers including Dr. Matthew D. LaHaye, Principal Research Physicist at AFRL.

The QphoX partnership under Dr. Simon Groeblacher's leadership focuses on the transduction challenge—building devices that convert quantum states between microwave and optical frequencies while preserving entanglement. This remains one of the harder unsolved problems in quantum networking.

## Results & Business Impact

The quantum networking research produced measurable results. The AFRL team demonstrated entanglement distribution across the QLAN infrastructure with a Bell inequality violation of S=2.717, well above the classical bound of S≤2, confirming genuine quantum correlations over the network. This result, published in arXiv:2508.01030, represents one of the more substantial demonstrations of distributed quantum entanglement on real telecommunications infrastructure.

The fabrication partnership has delivered functional hardware—9-qubit QPUs and superconducting amplifiers—though specific performance metrics for individual devices aren't public. The value lies partly in the capability itself: AFRL can iterate on quantum hardware designs without the decade-long, billion-dollar commitment of building internal fabrication facilities.

Total contract value across the partnerships exceeds $11 million since 2023 for the networking and ABAA projects alone, with the five-year IDIQ potentially larger depending on task orders issued. For Rigetti, the contracts validate its foundry-as-a-service model with a demanding government customer. Dr. Subodh Kulkarni, Rigetti's CEO, has emphasized the foundry model as a key element of the company's business strategy.

## Future Directions

The near-term focus is on the microwave-to-optical transduction work with QphoX. If successful, this could enable connection of superconducting quantum computers across fiber networks—a prerequisite for distributed quantum computing and secure quantum communication over long distances.

The ABAA fabrication project with the university consortium aims to improve superconducting device manufacturing techniques. This addresses a broader challenge in the quantum industry: current fabrication yields are low compared to classical semiconductors, and improving manufacturing reliability would benefit the entire superconducting quantum ecosystem.

---

## References

[1] Rigetti Computing. (2023, September). "Rigetti Computing Awarded Five-Year Contract with Air Force Research Lab for Quantum Foundry Services." Press release.

[2] Rigetti Computing. (2025, September). "$5.8M AFRL Contract to Advance Superconducting Quantum Networking." Press release. Partnership with QphoX.

[3] Rigetti Computing. (2025, April). "$5.48M Air Force Office of Scientific Research Award." Press release. ABAA chip fabrication consortium.

[4] LaHaye, M.D. et al. (2025). "Telecommunications fiber-optic and free-space quantum local area networks at the Air Force Research Laboratory." arXiv:2508.01030. 32 authors; demonstrates entanglement distribution with S=2.717.
