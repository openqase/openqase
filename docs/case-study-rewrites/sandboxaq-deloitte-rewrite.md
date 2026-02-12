# SandboxAQ and Deloitte: Quantum-Resistant Cryptography for U.S. Defense

**Slug:** `sandboxaq-deloitte-cybersecurity`
**Original Score:** 11/30 → **Target Score:** 24+

---

## Introduction

In May 2022, SandboxAQ and Deloitte announced a strategic alliance to accelerate enterprise adoption of post-quantum cryptography. SandboxAQ, spun out of Alphabet in 2022, brought cryptographic discovery and remediation software. Deloitte brought federal contracting expertise and an existing cybersecurity practice spanning thousands of government clients.

The partnership's first major outcome came 13 months later: a Defense Information Systems Agency (DISA) contract to prototype quantum-resistant cryptography infrastructure for the U.S. military.

## Challenge

Classical public key cryptography—RSA, elliptic curve—relies on computational problems that quantum computers can solve efficiently. Shor's algorithm, running on a sufficiently large fault-tolerant quantum computer, breaks both. The U.S. government operates thousands of systems using vulnerable cryptographic standards, with encrypted data already being harvested by adversaries for future decryption.

DISA needed to identify which systems were vulnerable, prioritize remediation, and deploy quantum-resistant alternatives—all while maintaining interoperability with existing infrastructure. The challenge wasn't theoretical; it was operational: how do you upgrade cryptography across a complex, classified environment without breaking critical systems?

## Solution

The approach combined automated cryptographic discovery with phased deployment of post-quantum algorithms. SandboxAQ's AQtive Guard (formerly SandboxAQ Security Suite) scans networks, applications, and data flows to inventory cryptographic usage—identifying where RSA, ECC, and other vulnerable algorithms appear in production systems.

Once vulnerable systems are mapped, remediation prioritizes based on data sensitivity and threat exposure. The National Institute of Standards and Technology (NIST) finalized its first post-quantum cryptographic standards in 2024, providing approved algorithms for deployment. AQtive Guard supports hybrid modes that layer post-quantum algorithms over classical ones, allowing gradual migration without single points of failure.

The technical architecture addresses a key federal requirement: FedRAMP readiness. AQtive Guard achieved FedRAMP Ready status, meeting the security controls required for federal cloud deployments.

## Implementation

On June 27, 2023, DISA awarded SandboxAQ an Other Transaction Authority (OTA) agreement to prototype Quantum Resistant Cryptography Public Key Infrastructure. SandboxAQ served as prime contractor, with Deloitte handling cryptographic integration and Microsoft providing DevSecOps infrastructure.

The contract structure—OTA rather than traditional procurement—allowed faster iteration than standard federal contracting. Jen Sovada, SandboxAQ's Global Public Sector President, led the company's federal engagement. On Deloitte's side, the work fell under Deborah Golden's Cyber and Strategic Risk practice.

The prototype focused on military communications infrastructure, with cryptographic discovery identifying vulnerable systems and the team deploying quantum-resistant alternatives in a controlled environment.

## Results & Business Impact

The DISA contract demonstrated federal appetite for quantum-resistant cryptography beyond planning documents. Concrete outcomes from the prototype period have not been publicly disclosed in detail—typical for defense contracts—but the OTA structure positions follow-on production contracts if the prototype succeeds.

In February 2025, SandboxAQ and Deloitte expanded their alliance beyond cybersecurity to include AI simulation tools (AQBioSim and AQChemSim), suggesting the original partnership delivered enough value to extend.

The partnership also generated visibility at senior levels: Jack Hidary (SandboxAQ CEO) and Deborah Golden joined a World Economic Forum panel at Davos in January 2023 titled "Preparing for a Secure Quantum Transition," discussing post-quantum cryptography readiness with government and industry leaders.

## Future Directions

The DISA prototype is a first step toward broader deployment across Department of Defense systems. Full migration to quantum-resistant cryptography will take years, constrained by hardware refresh cycles, legacy system dependencies, and the need for interoperability with allies. The 2025 expansion to AI simulation suggests SandboxAQ and Deloitte see their alliance as a multi-year, multi-domain relationship rather than a single-project engagement.

---

## References

[1] SandboxAQ. (May 2, 2022). "Sandbox AQ and Deloitte Form Strategic Alliance." Press release.

[2] Deloitte. (May 2, 2022). "Sandbox AQ and Deloitte Form Strategic Alliance to Help Accelerate Enterprise Quantum Adoption." Press release.

[3] SandboxAQ. (June 27, 2023). "Defense Information Systems Agency Awards SandboxAQ Other Transaction Authority Agreement for Quantum-Resistant Cryptography." Press release.

[4] SandboxAQ. (February 10, 2025). "SandboxAQ Expands Strategic Alliance with Deloitte." Press release.

[5] World Economic Forum. (January 23, 2023). "Preparing for a Secure Quantum Transition." Davos panel discussion.
