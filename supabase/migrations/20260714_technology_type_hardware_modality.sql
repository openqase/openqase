-- Constrain quantum_hardware.technology_type to hardware_modality enum.
-- Column name stays technology_type; only the Postgres type changes.

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
