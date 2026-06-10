-- Forward FK indexes and sort index
--
-- Adds indexes suggested by Supabase Index Advisor based on production query patterns:
--   1. Forward FK indexes on junction tables (case_study_id) for detail page lookups
--   2. Sort index on case_studies.updated_at for listing page ORDER BY

-- Forward FK indexes — used when fetching relations for a specific case study
CREATE INDEX IF NOT EXISTS idx_case_study_industry_relations_case_study_id
  ON public.case_study_industry_relations (case_study_id);

CREATE INDEX IF NOT EXISTS idx_case_study_persona_relations_case_study_id
  ON public.case_study_persona_relations (case_study_id);

-- Sort index — used by case study listing page (ORDER BY updated_at DESC)
CREATE INDEX IF NOT EXISTS idx_case_studies_updated_at
  ON public.case_studies (updated_at);
