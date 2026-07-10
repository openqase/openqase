-- Hardware specs: spec vocabulary table + per-hardware values.
-- Flat columns on quantum_hardware (qubit_count, gate_fidelity, etc.) remain
-- independently edited for list views. This table holds additive detail only.
-- Spec keys that 1:1 duplicate flat columns (e.g. qubit_count) are intentionally
-- omitted from the seed. Preset lists are ordered alphabetically by label in the app.

CREATE TYPE public.hardware_modality AS ENUM (
  'superconducting',
  'trapped_ion',
  'neutral_atom',
  'photonic',
  'annealer'
);

CREATE TABLE public.hardware_spec_definitions (
  spec_key     text PRIMARY KEY,
  label        text NOT NULL,
  modalities   public.hardware_modality[] NOT NULL,
  default_unit text,
  CONSTRAINT hardware_spec_definitions_modalities_nonempty
    CHECK (cardinality(modalities) > 0)
);

COMMENT ON TABLE public.hardware_spec_definitions IS
  'Canonical preset hardware spec keys, labels, modalities, and default units.';

CREATE TABLE public.quantum_hardware_specs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_id uuid NOT NULL REFERENCES public.quantum_hardware(id) ON DELETE CASCADE,
  spec_key    text NOT NULL,
  value       text NOT NULL,
  unit        text,
  source      text,
  verified_at timestamptz,
  is_preset   boolean NOT NULL DEFAULT false,
  UNIQUE (hardware_id, spec_key)
);

CREATE INDEX quantum_hardware_specs_hardware_id_idx
  ON public.quantum_hardware_specs (hardware_id);

COMMENT ON TABLE public.quantum_hardware_specs IS
  'Hardware spec values. Custom keys allowed (is_preset=false).';

-- RLS
ALTER TABLE public.hardware_spec_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_hardware_specs ENABLE ROW LEVEL SECURITY;

-- Vocabulary is public read-only for clients; writes via service_role only.
CREATE POLICY "Anyone can read hardware spec definitions"
  ON public.hardware_spec_definitions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Specs readable when parent hardware is published and not soft-deleted.
CREATE POLICY "Anyone can read specs for published hardware"
  ON public.quantum_hardware_specs
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quantum_hardware h
      WHERE h.id = quantum_hardware_specs.hardware_id
        AND h.published = true
        AND h.deleted_at IS NULL
    )
  );

-- Defense-in-depth: match A1 denylist for new tables (service_role bypasses RLS).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON public.hardware_spec_definitions, public.quantum_hardware_specs
  FROM anon, authenticated;

GRANT SELECT ON public.hardware_spec_definitions TO anon, authenticated;
GRANT SELECT ON public.quantum_hardware_specs TO anon, authenticated;

-- Seed preset vocabulary (no qubit_count; sdk_access once; no generic connectivity).
INSERT INTO public.hardware_spec_definitions (spec_key, label, modalities, default_unit) VALUES
  ('two_q_gate_fidelity',  '2Q gate fidelity',         ARRAY['superconducting','trapped_ion','neutral_atom','photonic']::public.hardware_modality[], '%'),
  ('readout_fidelity',     'Readout / SPAM fidelity',  ARRAY['superconducting','trapped_ion','neutral_atom','photonic']::public.hardware_modality[], '%'),
  ('t1_coherence',         'T1 coherence time',        ARRAY['superconducting']::public.hardware_modality[],                                         'µs'),
  ('connectivity_topology','Connectivity topology',    ARRAY['superconducting']::public.hardware_modality[],                                         null),
  ('t2_coherence',         'T2 coherence time',        ARRAY['trapped_ion','neutral_atom','superconducting']::public.hardware_modality[],            'µs'),
  ('connectivity_model',   'Connectivity model',       ARRAY['neutral_atom']::public.hardware_modality[],                                            null),
  ('mode_count',           'Mode count',               ARRAY['photonic']::public.hardware_modality[],                                                null),
  ('computation_model',    'Computation model',        ARRAY['photonic']::public.hardware_modality[],                                                null),
  ('squeezing_level',      'Squeezing level',          ARRAY['photonic']::public.hardware_modality[],                                                'dB'),
  ('detection_efficiency', 'Detection efficiency',     ARRAY['photonic']::public.hardware_modality[],                                                '%'),
  ('coupler_count',        'Coupler count',            ARRAY['annealer']::public.hardware_modality[],                                                null),
  ('connectivity_graph',   'Connectivity graph',       ARRAY['annealer']::public.hardware_modality[],                                                null),
  ('problem_type',         'Problem type',             ARRAY['annealer']::public.hardware_modality[],                                                null),
  ('annealing_time_range', 'Annealing time range',     ARRAY['annealer']::public.hardware_modality[],                                                'µs'),
  ('classical_hybrid',     'Classical-quantum hybrid', ARRAY['annealer']::public.hardware_modality[],                                                null),
  ('one_q_gate_fidelity',  '1Q gate fidelity',         ARRAY['superconducting','trapped_ion','neutral_atom']::public.hardware_modality[],            '%'),
  ('gate_time_1q',         'Gate time (1Q)',           ARRAY['superconducting','trapped_ion']::public.hardware_modality[],                          'ns'),
  ('gate_time_2q',         'Gate time (2Q)',           ARRAY['superconducting','trapped_ion','neutral_atom']::public.hardware_modality[],            'ns'),
  ('operating_temp',       'Operating temperature',    ARRAY['superconducting','annealer']::public.hardware_modality[],                              'mK'),
  ('shuttling_arch',       'Shuttling architecture',   ARRAY['trapped_ion']::public.hardware_modality[],                                             null),
  ('ion_species',          'Ion species',              ARRAY['trapped_ion']::public.hardware_modality[],                                             null),
  ('gate_zone_count',      'Gate zone count',          ARRAY['neutral_atom']::public.hardware_modality[],                                            null),
  ('atom_species',         'Atom species',             ARRAY['neutral_atom']::public.hardware_modality[],                                            null),
  ('data_qubits',          'Data qubits',              ARRAY['neutral_atom']::public.hardware_modality[],                                            null),
  ('photon_loss_rate',     'Photon loss rate',         ARRAY['photonic']::public.hardware_modality[],                                                '%'),
  ('photon_source_type',   'Photon source type',       ARRAY['photonic']::public.hardware_modality[],                                                null),
  ('encoding_type',        'Encoding type',            ARRAY['photonic']::public.hardware_modality[],                                                null),
  ('sdk_access',           'Cloud access / SDK',       ARRAY['superconducting','trapped_ion','neutral_atom','photonic','annealer']::public.hardware_modality[], null);
