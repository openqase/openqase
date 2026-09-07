import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as _createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for use in Server Components, Server Actions, Route Handlers.
 * Uses the public ANON key and handles cookies for user sessions.
 */
export async function createServerSupabaseClient() {
  // Ensure this function is only called in server-side contexts
  // by attempting to read cookies.
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing');
    throw new Error('Supabase configuration is missing');
  }

  return _createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client using the Service Role Key.
 * WARNING: This client bypasses RLS. Use only in secure server-side environments
 * after appropriate authorization checks.
 */
/**
 * `newsletter_subscriptions` has no migration yet — tracked in
 * https://github.com/openqase/openqase/issues/173. Any Supabase client
 * (anon or service-role) can be passed through; the query result is
 * untyped since the table doesn't exist in the generated schema.
 */
export function newsletterSubscriptionsTable(
  client: { from: (relation: string) => unknown }
) {
  return client.from('newsletter_subscriptions') as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function createServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase environment variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing');
    throw new Error('Supabase service role configuration is missing');
  }

  // Clean the service role key of any potential whitespace/newlines
  const cleanServiceRoleKey = serviceRoleKey.trim().replace(/\s/g, '');

  // Note: Using the standard createClient from @supabase/supabase-js for service role
  return _createClient<Database>(supabaseUrl, cleanServiceRoleKey, {
    auth: {
      // Prevent client from trying to use browser storage for auth
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
}