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
 *
 * Overloads:
 *  1. Typed form — caller passes a literal `keyof Database['public']['Tables']`
 *     and gets back a fully-typed query builder.
 *  2. Dynamic form — caller passes a plain `string` (e.g. a CMS registry
 *     `tableName` / `junction`) and gets back `any`. This is the same escape
 *     hatch that `supabase-untyped.ts` provided; it is intentional and
 *     consolidated here behind the ESLint allow-list boundary so the cast
 *     is in exactly one place.
 */
// Typed overload — preferred when the table name is a compile-time literal.
export function fromTable<T extends keyof Database['public']['Tables']>(
  client: SupabaseClient<Database>,
  table: T
): ReturnType<SupabaseClient<Database>['from']>;

// Dynamic overload — for CMS engine callers that use runtime table names
// (ContentTypeDefinition.tableName / RelationshipDefinition.junction).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromTable(client: SupabaseClient<Database>, table: string): any;

// Implementation
export function fromTable(
  client: SupabaseClient<Database>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).from(table);
}
