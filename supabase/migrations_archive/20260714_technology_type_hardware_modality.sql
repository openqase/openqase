-- Constrain quantum_hardware.technology_type to the hardware_modality enum.
-- Column name stays technology_type; only the Postgres type changes.
--
-- STATUS: NOT YET APPLIED to any hosted environment. Authored in PR #228 and
-- split out before merge so the schema change can be applied deliberately.
-- Preserved here as a tracked, PENDING migration.
--
-- ⚠️ BEFORE APPLYING — this is lossy and irreversible on the column:
--   1. Pre-flight:  SELECT technology_type, count(*) FROM quantum_hardware GROUP BY 1;
--      Any value not matched by the CASE below is set to NULL.
--   2. Widen the CASE mapping (and/or extend the hardware_modality enum) to
--      cover the real values found in step 1 before running.
--   3. Snapshot the originals first so the change is reversible, e.g.
--        ALTER TABLE public.quantum_hardware ADD COLUMN technology_type_orig text;
--        UPDATE public.quantum_hardware SET technology_type_orig = technology_type;
--   4. After applying: regenerate src/types/supabase.ts (technology_type becomes
--      the hardware_modality enum) and record this version in the migration ledger.

UPDATE public.quantum_hardware
SET technology_type = CASE lower(trim(technology_type))
  WHEN 'superconducting' THEN 'superconducting'
  WHEN 'trapped ion' THEN 'trapped_ion'
  WHEN 'trapped_ion' THEN 'trapped_ion'
  WHEN 'neutral atom' THEN 'neutral_atom'
  WHEN 'neutral_atom' THEN 'neutral_atom'
  WHEN 'photonic' THEN 'photonic'
  WHEN 'annealer' THEN 'annealer'
  WHEN 'quantum annealing' THEN 'annealer'
  WHEN 'quantum annealer' THEN 'annealer'
  ELSE NULL
END;

ALTER TABLE public.quantum_hardware
  ALTER COLUMN technology_type TYPE public.hardware_modality
  USING technology_type::public.hardware_modality;

COMMENT ON COLUMN public.quantum_hardware.technology_type IS
  'Hardware modality (hardware_modality enum). Used for list/hero display and to filter preset specs.';
