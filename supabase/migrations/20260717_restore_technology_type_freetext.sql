-- Recovery migration: undo 20260714 (technology_type -> hardware_modality enum),
-- which set technology_type = NULL on every quantum_hardware row because prod's
-- real values did not match that migration's fixed mapping.
--
-- 1) Revert the column to free text. The hardware_modality enum is RETAINED
--    (still used by hardware_spec_definitions / quantum_hardware_specs); it is
--    just no longer the type of quantum_hardware.technology_type.
-- 2) Restore each hardware's technology_type from the git-tracked seed scripts
--    (scripts/archive/add-quantum-hardware-content.ts + add-remaining-...),
--    matched by slug. Values are the original free-text labels, including
--    non-modality types ("Software/Simulator", "Quantum Random Number
--    Generator", etc.) that the enum could not represent.
--
-- A proper nullable `modality` field (for the specs-editor presets) is a
-- SEPARATE future change, to be designed on dev via the migration workflow.
--
-- Rows whose slug is not in the archive stay NULL. Find them after applying:
--   SELECT slug, name FROM quantum_hardware WHERE technology_type IS NULL ORDER BY slug;

ALTER TABLE public.quantum_hardware
  ALTER COLUMN technology_type TYPE text
  USING technology_type::text;

UPDATE public.quantum_hardware AS h
SET technology_type = v.technology_type
FROM (VALUES
  ('aquila', 'Neutral Atom'),
  ('aria', 'Trapped Ion'),
  ('aspen', 'Superconducting'),
  ('atom-computing-phoenix', 'Neutral Atom'),
  ('borealis', 'Photonic'),
  ('d-wave-2000q', 'Quantum Annealing'),
  ('d-wave-advantage', 'Quantum Annealing'),
  ('d-wave-one', 'Quantum Annealing'),
  ('d-wave-two', 'Quantum Annealing'),
  ('forte', 'Trapped Ion'),
  ('google-sycamore', 'Superconducting'),
  ('google-sycamore-quantum-processor', 'Superconducting'),
  ('honeywell-system-model-h0', 'Trapped Ion'),
  ('honeywell-system-model-h1', 'Trapped Ion'),
  ('ibm-condor', 'Superconducting'),
  ('ibm-eagle', 'Superconducting'),
  ('ibm-falcon', 'Superconducting'),
  ('ibm-hummingbird', 'Superconducting'),
  ('ibm-q-20-tokyo', 'Superconducting'),
  ('ibm-q-5-tenerife', 'Superconducting'),
  ('ibm-q-system-one', 'Superconducting'),
  ('ibm-q-valencia', 'Superconducting'),
  ('ibm-quantum-eagle', 'Superconducting'),
  ('ibm-quantum-falcon', 'Superconducting'),
  ('ibm-quantum-osprey', 'Superconducting'),
  ('ibm-quantum-system-one', 'Superconducting'),
  ('ionq-aria', 'Trapped Ion'),
  ('ionq-forte', 'Trapped Ion'),
  ('ionq-harmony', 'Trapped Ion'),
  ('open-quantum-design-system', 'Quantum System'),
  ('orion', 'Neutral Atom'),
  ('pasqal-fresnel', 'Neutral Atom'),
  ('pasqal-orion-alpha', 'Neutral Atom'),
  ('qasic', 'Application-Specific Quantum Circuit'),
  ('qrypt-atlas-entropy-card', 'Quantum Random Number Generator'),
  ('qrypt-quantum-entropy-appliance', 'Quantum Random Number Generator'),
  ('quantinuum-h-series', 'Trapped Ion'),
  ('quantinuum-h1', 'Trapped Ion'),
  ('quantinuum-system-model-h1', 'Trapped Ion'),
  ('quantum-annealer', 'Quantum Annealing'),
  ('quantum-development-kit-qdk', 'Software/Simulator'),
  ('quera-aquila', 'Neutral Atom'),
  ('rigetti-aspen', 'Superconducting'),
  ('xanadu-borealis', 'Photonic')
) AS v(slug, technology_type)
WHERE h.slug = v.slug;
