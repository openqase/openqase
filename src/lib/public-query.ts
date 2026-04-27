import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { fromTable } from './internal-queries';

/**
 * Tables where `published` and `deleted_at` semantics apply.
 * Junction and lookup tables are NOT here — they have neither column.
 */
export type ContentTable =
  | 'case_studies'
  | 'algorithms'
  | 'industries'
  | 'personas'
  | 'blog_posts'
  | 'quantum_software'
  | 'quantum_hardware'
  | 'quantum_companies'
  | 'partner_companies';

/**
 * Sanctioned anonymous-read primitive for content tables.
 *
 * Returns a Supabase query builder with `.eq('published', true)` and
 * `.is('deleted_at', null)` already chained. Callers can keep adding
 * `.select(...)`, `.eq(...)`, `.order(...)`, etc.
 *
 * Use with an RLS-respecting client (`createServerSupabaseClient()`),
 * NOT a service-role client. Service-role bypasses RLS, which defeats
 * the defense-in-depth this layer provides.
 */
export function publicQuery<T extends ContentTable>(
  client: SupabaseClient<Database>,
  table: T
) {
  return fromTable(client, table)
    .eq('published', true)
    .is('deleted_at', null);
}

/**
 * Most-common-case helper: fetch one published, non-deleted record by slug.
 * Returns the Supabase result shape: `{ data, error }`.
 */
export function getPublishedBySlug<T extends ContentTable>(
  client: SupabaseClient<Database>,
  table: T,
  slug: string
) {
  return publicQuery(client, table).eq('slug', slug).maybeSingle();
}
