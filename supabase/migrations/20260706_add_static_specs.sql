-- Add static_specs JSONB column for optional hardware specifications.
--
-- Existing flat columns (vendor, technology_type, qubit_count, etc.) are retained for
-- list views and search. Tier 1 keys in static_specs are dual-written to flat
-- columns on admin save.
--
-- Per-key shape: { value, unit, source_url, verified_at?, source_type? }
-- All keys optional; default empty object for existing rows.

ALTER TABLE public.quantum_hardware
  ADD COLUMN IF NOT EXISTS static_specs jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.quantum_hardware.static_specs IS
  'Optional static hardware specs. Per key: { value, unit, source_url, verified_at?, source_type? }';
