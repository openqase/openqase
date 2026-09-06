-- Set technology_type for the hardware not covered by the archive restore
-- (20260717_restore_technology_type_freetext). Values confirmed from public
-- sources. Two are modalities the hardware_modality enum can't represent
-- (kept as free text), which is why technology_type stays a text column.
--
-- The placeholder rows 'na' / 'not-applicable' are intentionally left NULL
-- (not real hardware; a separate deletion decision).

UPDATE public.quantum_hardware AS h
SET technology_type = v.technology_type
FROM (VALUES
  ('ibm-heron', 'Superconducting'),
  ('ibm-marrakech', 'Superconducting'),
  ('ibm-torino', 'Superconducting'),
  ('ibm-quantum-casablanca', 'Superconducting'),
  ('ibm-quantum-melbourne', 'Superconducting'),
  ('c12-carbon-nanotube-qpu', 'Spin qubit (carbon nanotube)'),
  ('nord-quantum-bosonic-system', 'Bosonic')
) AS v(slug, technology_type)
WHERE h.slug = v.slug;
