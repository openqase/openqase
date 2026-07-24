-- OpenQase seed data for local development
-- Covers all four quantum hardware modalities so contributors can navigate
-- the full site, and includes quantum_hardware_specs rows to exercise the
-- specs display feature.

-- ============================================================
-- Industries
-- ============================================================
INSERT INTO industries (id, slug, name, description, published, published_at) VALUES
  ('11111111-0000-0000-0000-000000000001', 'financial-services', 'Financial Services',
    'Banks, investment firms, and fintech companies evaluating quantum advantage for portfolio optimisation, risk modelling, and fraud detection.',
    true, now()),
  ('11111111-0000-0000-0000-000000000002', 'pharmaceuticals', 'Pharmaceuticals',
    'Drug discovery and molecular simulation use cases where quantum chemistry algorithms offer potential speedups over classical methods.',
    true, now()),
  ('11111111-0000-0000-0000-000000000003', 'logistics', 'Logistics & Supply Chain',
    'Route optimisation, scheduling, and combinatorial problems suited to near-term quantum optimisation algorithms.',
    true, now()),
  ('11111111-0000-0000-0000-000000000004', 'energy', 'Energy & Climate',
    'Grid optimisation, materials discovery for batteries, and climate modelling applications.',
    true, now());

-- ============================================================
-- Algorithms
-- ============================================================
INSERT INTO algorithms (id, slug, name, description, quantum_advantage, use_cases, published, published_at) VALUES
  ('22222222-0000-0000-0000-000000000001', 'grovers-algorithm', 'Grover''s Algorithm',
    'Quantum search algorithm that finds a marked item in an unstructured database with quadratic speedup over classical linear search.',
    'Quadratic speedup: O(√N) vs O(N) classical.',
    ARRAY['database search', 'cryptanalysis', 'optimisation pre-processing'],
    true, now()),

  ('22222222-0000-0000-0000-000000000002', 'qaoa', 'Quantum Approximate Optimisation Algorithm (QAOA)',
    'A variational hybrid quantum-classical algorithm for combinatorial optimisation problems, particularly useful on near-term devices.',
    'Potential advantage on hard combinatorial problems; depth scales with problem size.',
    ARRAY['portfolio optimisation', 'route planning', 'scheduling', 'max-cut'],
    true, now()),

  ('22222222-0000-0000-0000-000000000003', 'vqe', 'Variational Quantum Eigensolver (VQE)',
    'Hybrid algorithm that uses a parameterised quantum circuit to estimate the ground-state energy of a molecule or material.',
    'Exponential classical cost for exact simulation; VQE achieves polynomial quantum resource scaling for small molecules.',
    ARRAY['drug discovery', 'materials science', 'quantum chemistry'],
    true, now()),

  ('22222222-0000-0000-0000-000000000004', 'quantum-phase-estimation', 'Quantum Phase Estimation (QPE)',
    'Core subroutine used in many quantum algorithms to estimate the eigenvalue of a unitary operator with high precision.',
    'Exponential precision advantage over classical eigenvalue estimation.',
    ARRAY['quantum chemistry', 'cryptography', 'HHL algorithm'],
    true, now());

-- ============================================================
-- Personas
-- ============================================================
INSERT INTO personas (id, slug, name, description, expertise, published, published_at) VALUES
  ('33333333-0000-0000-0000-000000000001', 'quantum-researcher', 'Quantum Researcher',
    'Academic or industry researcher working on quantum algorithms, error correction, or hardware characterisation.',
    ARRAY['quantum algorithms', 'quantum error correction', 'linear algebra', 'physics'],
    true, now()),

  ('33333333-0000-0000-0000-000000000002', 'technology-executive', 'Technology Executive',
    'CTO or Head of Innovation evaluating quantum computing for near-term business advantage.',
    ARRAY['technology strategy', 'digital transformation', 'risk management'],
    true, now()),

  ('33333333-0000-0000-0000-000000000003', 'data-scientist', 'Data Scientist',
    'Machine learning and data professional exploring quantum-enhanced models and hybrid classical-quantum pipelines.',
    ARRAY['machine learning', 'optimisation', 'statistics', 'Python'],
    true, now());

-- ============================================================
-- Quantum hardware
-- ============================================================
INSERT INTO quantum_hardware (id, slug, name, vendor, technology_type, qubit_count, gate_fidelity, coherence_time, connectivity, access_model, availability, description, published, published_at) VALUES
  ('44444444-0000-0000-0000-000000000001',
   'ibm-eagle', 'IBM Eagle', 'IBM', 'superconducting', 127, 99.5, '150 µs (T1)',
   'Heavy-hex lattice', 'Cloud (IBM Quantum)', 'Public',
   'IBM Eagle is a 127-qubit superconducting processor using a heavy-hex qubit connectivity lattice that reduces error rates by limiting each qubit to a maximum of three neighbours.',
   true, now()),

  ('44444444-0000-0000-0000-000000000002',
   'ionq-aria', 'IonQ Aria', 'IonQ', 'trapped_ion', 25, 99.6, '~1 s (T2)',
   'All-to-all (reconfigurable)', 'Cloud (IonQ / AWS Braket / Azure)', 'Public',
   'IonQ Aria uses ytterbium-171 ions trapped in a linear Paul trap with a reconfigurable all-to-all connectivity, enabling high gate fidelities and seconds-scale coherence times.',
   true, now()),

  ('44444444-0000-0000-0000-000000000003',
   'quera-aquila', 'QuEra Aquila', 'QuEra', 'neutral_atom', 256, NULL, '~1.5 ms (T2)',
   'Reconfigurable all-to-all', 'Cloud (Amazon Braket)', 'Public',
   'QuEra Aquila is a 256-qubit neutral-atom quantum computer based on rubidium-87 atoms arranged in reconfigurable 2D arrays, suited to analogue quantum simulation and combinatorial optimisation.',
   true, now()),

  ('44444444-0000-0000-0000-000000000004',
   'dwave-advantage', 'D-Wave Advantage', 'D-Wave', 'annealer', 5000, NULL, NULL,
   'Pegasus P16 (~15 couplers/qubit)', 'Cloud (Leap) / On-premise', 'Public',
   'D-Wave Advantage is a quantum annealer with over 5,000 qubits connected in a Pegasus P16 topology, designed for binary quadratic optimisation problems via quantum annealing.',
   true, now());

-- ============================================================
-- Hardware specs  (exercises the feature added in PR #236)
-- ============================================================

-- IBM Eagle — superconducting
INSERT INTO quantum_hardware_specs (hardware_id, spec_key, value, unit, source, verified_at) VALUES
  ('44444444-0000-0000-0000-000000000001', 'two_q_gate_fidelity',   '99.5',                        '%',  'https://research.ibm.com/blog/ibm-quantum-roadmap', now()),
  ('44444444-0000-0000-0000-000000000001', 'one_q_gate_fidelity',   '99.9',                        '%',  'https://research.ibm.com/blog/ibm-quantum-roadmap', now()),
  ('44444444-0000-0000-0000-000000000001', 'readout_fidelity',      '98.5',                        '%',  'https://research.ibm.com/blog/ibm-quantum-roadmap', now()),
  ('44444444-0000-0000-0000-000000000001', 't1_coherence',          '150',                         'µs', 'https://quantum.ibm.com/services/resources',        now()),
  ('44444444-0000-0000-0000-000000000001', 't2_coherence',          '100',                         'µs', 'https://quantum.ibm.com/services/resources',        now()),
  ('44444444-0000-0000-0000-000000000001', 'gate_time_1q',          '35',                          'ns', 'https://research.ibm.com/blog/ibm-quantum-roadmap', now()),
  ('44444444-0000-0000-0000-000000000001', 'gate_time_2q',          '400',                         'ns', 'https://research.ibm.com/blog/ibm-quantum-roadmap', now()),
  ('44444444-0000-0000-0000-000000000001', 'operating_temp',        '15',                          'mK', NULL, NULL),
  ('44444444-0000-0000-0000-000000000001', 'connectivity_topology', 'Heavy-hex lattice',           NULL, NULL, NULL),
  ('44444444-0000-0000-0000-000000000001', 'sdk_access',            'Qiskit / IBM Quantum Cloud',  NULL, NULL, NULL),
  -- Custom spec: exercises the non-preset rendering path
  ('44444444-0000-0000-0000-000000000001', 'error_correction_code', 'Surface code (experimental)', NULL, NULL, NULL);

-- IonQ Aria — trapped ion
INSERT INTO quantum_hardware_specs (hardware_id, spec_key, value, unit, source, verified_at) VALUES
  ('44444444-0000-0000-0000-000000000002', 'two_q_gate_fidelity', '99.6',                        '%',  'https://ionq.com/resources/ionq-aria-benchmarks', now()),
  ('44444444-0000-0000-0000-000000000002', 'one_q_gate_fidelity', '99.9',                        '%',  'https://ionq.com/resources/ionq-aria-benchmarks', now()),
  ('44444444-0000-0000-0000-000000000002', 'readout_fidelity',    '99.4',                        '%',  'https://ionq.com/resources/ionq-aria-benchmarks', now()),
  ('44444444-0000-0000-0000-000000000002', 't2_coherence',        '1000000',                     'µs', 'https://ionq.com/resources/ionq-aria-benchmarks', now()),
  ('44444444-0000-0000-0000-000000000002', 'gate_time_2q',        '600',                         'ns', 'https://ionq.com/resources/ionq-aria-benchmarks', now()),
  ('44444444-0000-0000-0000-000000000002', 'ion_species',         'Ytterbium-171',               NULL, NULL, NULL),
  ('44444444-0000-0000-0000-000000000002', 'shuttling_arch',      'Reconfigurable multicore',    NULL, NULL, NULL),
  ('44444444-0000-0000-0000-000000000002', 'sdk_access',          'IonQ Cloud / Qiskit / Cirq', NULL, NULL, NULL);

-- QuEra Aquila — neutral atom
INSERT INTO quantum_hardware_specs (hardware_id, spec_key, value, unit, source, verified_at) VALUES
  ('44444444-0000-0000-0000-000000000003', 't2_coherence',       '1500',                      'µs', 'https://www.quera.com/aquila', now()),
  ('44444444-0000-0000-0000-000000000003', 'connectivity_model', 'Reconfigurable all-to-all', NULL, NULL, NULL),
  ('44444444-0000-0000-0000-000000000003', 'atom_species',       'Rubidium-87',               NULL, NULL, NULL),
  ('44444444-0000-0000-0000-000000000003', 'data_qubits',        '256',                       NULL, NULL, NULL),
  ('44444444-0000-0000-0000-000000000003', 'gate_zone_count',    '256',                       NULL, NULL, NULL),
  ('44444444-0000-0000-0000-000000000003', 'sdk_access',         'Amazon Braket / Bloqade',   NULL, NULL, NULL);

-- D-Wave Advantage — annealer
INSERT INTO quantum_hardware_specs (hardware_id, spec_key, value, unit, source, verified_at) VALUES
  ('44444444-0000-0000-0000-000000000004', 'coupler_count',        '35000',                        NULL, 'https://www.dwavesys.com/solutions-and-products/systems/', now()),
  ('44444444-0000-0000-0000-000000000004', 'connectivity_graph',   'Pegasus P16',                  NULL, NULL, NULL),
  ('44444444-0000-0000-0000-000000000004', 'problem_type',         'Binary quadratic model (BQM)', NULL, NULL, NULL),
  ('44444444-0000-0000-0000-000000000004', 'annealing_time_range', '1–2000',                       'µs', NULL, NULL),
  ('44444444-0000-0000-0000-000000000004', 'classical_hybrid',     'Hybrid Solver Service (HSS)',  NULL, NULL, NULL),
  ('44444444-0000-0000-0000-000000000004', 'operating_temp',       '15',                           'mK', NULL, NULL),
  ('44444444-0000-0000-0000-000000000004', 'sdk_access',           'Ocean SDK / Leap Cloud',       NULL, NULL, NULL);

-- ============================================================
-- Case studies
-- ============================================================
INSERT INTO case_studies (id, slug, title, description, year, published, published_at) VALUES
  ('55555555-0000-0000-0000-000000000001',
   'portfolio-optimisation-qaoa',
   'Portfolio Optimisation with QAOA',
   'A financial services firm applied QAOA on IBM Eagle to explore quantum-enhanced portfolio optimisation, benchmarking against classical mean-variance methods.',
   2024, true, now()),

  ('55555555-0000-0000-0000-000000000002',
   'drug-molecule-simulation-vqe',
   'Drug Molecule Simulation with VQE',
   'A pharmaceutical research team used VQE on IonQ Aria to simulate the ground-state energy of small drug candidate molecules, demonstrating accuracy competitive with CCSD(T) for 6-qubit systems.',
   2024, true, now());

-- ============================================================
-- Junction table relations
-- ============================================================

-- Algorithm ↔ Industry
INSERT INTO algorithm_industry_relations (algorithm_id, industry_id) VALUES
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'), -- QAOA → Finance
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003'), -- QAOA → Logistics
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002'), -- VQE → Pharma
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004'), -- VQE → Energy
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'), -- Grover → Finance
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002'); -- QPE → Pharma

-- Persona ↔ Algorithm
INSERT INTO persona_algorithm_relations (persona_id, algorithm_id) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003'), -- Researcher → VQE
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000004'), -- Researcher → QPE
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002'), -- Executive → QAOA
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002'), -- DataSci → QAOA
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001'); -- DataSci → Grover

-- Persona ↔ Industry
INSERT INTO persona_industry_relations (persona_id, industry_id) VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002'), -- Researcher → Pharma
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004'), -- Researcher → Energy
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'), -- Executive → Finance
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003'), -- Executive → Logistics
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001'); -- DataSci → Finance

-- Case study ↔ Algorithm
INSERT INTO algorithm_case_study_relations (algorithm_id, case_study_id) VALUES
  ('22222222-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001'), -- QAOA → portfolio
  ('22222222-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000002'); -- VQE → drug

-- Case study ↔ Industry
INSERT INTO case_study_industry_relations (case_study_id, industry_id) VALUES
  ('55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'), -- portfolio → Finance
  ('55555555-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002'); -- drug → Pharma

-- Case study ↔ Persona
INSERT INTO case_study_persona_relations (case_study_id, persona_id) VALUES
  ('55555555-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002'), -- portfolio → Executive
  ('55555555-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001'); -- drug → Researcher

-- Case study ↔ Quantum hardware
INSERT INTO case_study_quantum_hardware_relations (case_study_id, quantum_hardware_id) VALUES
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001'), -- portfolio → IBM Eagle
  ('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000002'); -- drug → IonQ Aria
