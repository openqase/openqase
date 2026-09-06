-- Migration: Fix SECURITY DEFINER functions by adding SET search_path
-- This addresses Supabase linter warnings about missing search_path configuration
-- on SECURITY DEFINER functions, which prevents search_path-based attacks.
--
-- Issue: #106
-- Date: 2026-01-06

-- Fix recover_content function
CREATE OR REPLACE FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid")
RETURNS boolean
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  allowed_tables TEXT[] := ARRAY['case_studies', 'blog_posts', 'algorithms', 'industries', 'personas'];
BEGIN
  -- Validate table name to prevent SQL injection
  IF NOT (table_name = ANY(allowed_tables)) THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Validate content_id exists
  IF content_id IS NULL THEN
    RAISE EXCEPTION 'Content ID cannot be NULL';
  END IF;

  -- Perform the recovery
  EXECUTE format('
    UPDATE %I
    SET deleted_at = NULL,
        deleted_by = NULL
    WHERE id = %L
    AND deleted_at IS NOT NULL',  -- Only recover if actually deleted
    table_name,
    content_id
  );

  RETURN FOUND;
END;
$$;

-- Fix soft_delete_content function
CREATE OR REPLACE FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid" DEFAULT NULL::"uuid")
RETURNS boolean
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  allowed_tables TEXT[] := ARRAY['case_studies', 'blog_posts', 'algorithms', 'industries', 'personas'];
BEGIN
  -- Validate table name to prevent SQL injection
  IF NOT (table_name = ANY(allowed_tables)) THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Validate content_id exists
  IF content_id IS NULL THEN
    RAISE EXCEPTION 'Content ID cannot be NULL';
  END IF;

  -- Perform the soft delete
  EXECUTE format('
    UPDATE %I
    SET deleted_at = NOW(),
        deleted_by = %L,
        published = false
    WHERE id = %L
    AND deleted_at IS NULL',  -- Only delete if not already deleted
    table_name,
    deleted_by_user,
    content_id
  );

  RETURN FOUND;
END;
$$;

-- Add comments explaining the security configuration
COMMENT ON FUNCTION "public"."recover_content" IS
  'Recovers soft-deleted content. Uses SECURITY DEFINER with empty search_path for security.';

COMMENT ON FUNCTION "public"."soft_delete_content" IS
  'Soft deletes content by setting deleted_at timestamp. Uses SECURITY DEFINER with empty search_path for security.';
