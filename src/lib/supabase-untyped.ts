import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Type-safe wrapper for tables not in the generated Database type.
 * Centralizes the `as any` cast to a single location.
 * Remove this when database.types.ts is regenerated with all tables.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromTable(client: SupabaseClient, table: string) {
  return client.from(table as any)
}
