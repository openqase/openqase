import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Gated content-table access primitive.
 *
 * INVARIANT: this module is only importable from the allow-list defined in
 * eslint.config.* (`no-restricted-imports`). The allow-list covers
 * build-time fetchers, admin server actions, the CMS engine's operations,
 * and the public-query.ts wrapper.
 *
 * Anonymous public reads MUST use `publicQuery` from `./public-query`,
 * which applies the `published=true` and `deleted_at IS NULL` filters and
 * uses an RLS-respecting Supabase client.
 *
 * Accepts any table in the schema. Narrowing to ContentTable happens at
 * the publicQuery layer because that is where the published/deleted_at
 * semantics are meaningful — junction and lookup tables don't have those
 * columns.
 */
export function fromTable<T extends keyof Database['public']['Tables']>(
  client: SupabaseClient<Database>,
  table: T
) {
  return client.from(table);
}
