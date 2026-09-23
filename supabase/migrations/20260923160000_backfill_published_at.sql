-- =============================================================================
-- Backfill published_at for published content that never got one
-- =============================================================================
--
-- WHAT
--   For each of the 9 CMS content tables, set
--     published_at = COALESCE(updated_at, created_at)
--   on rows WHERE published = true AND published_at IS NULL.
--   DATA-ONLY: no schema, privilege or policy changes.
--
-- WHY
--   Only blog_posts and personas have a trigger that sets published_at
--   (set_blog_posts_published_at / set_published_at_column). Until the CMS
--   publishContent() started stamping published_at itself, publishing a case
--   study, algorithm, industry, company, hardware or software item left it
--   NULL (e.g. 20 of 56 published case studies had none), so anything sorting
--   or displaying by publish date treated them as undated.
--
--   The real publish date of those rows was never recorded. updated_at (or
--   created_at when updated_at is NULL) is the BEST-AVAILABLE ESTIMATE, not
--   the true publish date: it may be later than the actual publish if the
--   row was edited afterwards. Rows with both columns NULL stay NULL.
--
-- PREVIEW (run first to see how many rows each statement will touch):
--   SELECT 'algorithms' AS table_name, count(*) FROM public.algorithms WHERE published = true AND published_at IS NULL
--   UNION ALL SELECT 'blog_posts', count(*) FROM public.blog_posts WHERE published = true AND published_at IS NULL
--   UNION ALL SELECT 'case_studies', count(*) FROM public.case_studies WHERE published = true AND published_at IS NULL
--   UNION ALL SELECT 'industries', count(*) FROM public.industries WHERE published = true AND published_at IS NULL
--   UNION ALL SELECT 'partner_companies', count(*) FROM public.partner_companies WHERE published = true AND published_at IS NULL
--   UNION ALL SELECT 'personas', count(*) FROM public.personas WHERE published = true AND published_at IS NULL
--   UNION ALL SELECT 'quantum_companies', count(*) FROM public.quantum_companies WHERE published = true AND published_at IS NULL
--   UNION ALL SELECT 'quantum_hardware', count(*) FROM public.quantum_hardware WHERE published = true AND published_at IS NULL
--   UNION ALL SELECT 'quantum_software', count(*) FROM public.quantum_software WHERE published = true AND published_at IS NULL;
--
-- NOTE
--   The updates below do not change `published`, so the published_at triggers
--   on blog_posts/personas (which fire only on a false -> true transition) do
--   not overwrite the backfilled value. update_updated_at_column-style
--   triggers may bump updated_at on the touched rows; that is expected.
--
-- ROLLBACK
--   Not reversible: the backfilled rows are indistinguishable from rows whose
--   published_at was set by the app afterwards. Take a snapshot first if
--   needed, e.g.
--     CREATE TABLE public._published_at_backup AS
--       SELECT 'case_studies' AS t, id FROM public.case_studies
--       WHERE published = true AND published_at IS NULL;  -- repeat per table
--   and undo with
--     UPDATE public.case_studies SET published_at = NULL
--       WHERE id IN (SELECT id FROM public._published_at_backup WHERE t = 'case_studies');
-- =============================================================================

UPDATE public.algorithms        SET published_at = COALESCE(updated_at, created_at) WHERE published = true AND published_at IS NULL;
UPDATE public.blog_posts        SET published_at = COALESCE(updated_at, created_at) WHERE published = true AND published_at IS NULL;
UPDATE public.case_studies      SET published_at = COALESCE(updated_at, created_at) WHERE published = true AND published_at IS NULL;
UPDATE public.industries        SET published_at = COALESCE(updated_at, created_at) WHERE published = true AND published_at IS NULL;
UPDATE public.partner_companies SET published_at = COALESCE(updated_at, created_at) WHERE published = true AND published_at IS NULL;
UPDATE public.personas          SET published_at = COALESCE(updated_at, created_at) WHERE published = true AND published_at IS NULL;
UPDATE public.quantum_companies SET published_at = COALESCE(updated_at, created_at) WHERE published = true AND published_at IS NULL;
UPDATE public.quantum_hardware  SET published_at = COALESCE(updated_at, created_at) WHERE published = true AND published_at IS NULL;
UPDATE public.quantum_software  SET published_at = COALESCE(updated_at, created_at) WHERE published = true AND published_at IS NULL;
