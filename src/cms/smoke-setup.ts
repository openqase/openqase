import { assertLocalSupabaseEnv } from './integration-env'

// Integration tests run only against a local Supabase, with credentials passed
// explicitly in the environment. No .env / .env.local loading: .env.local
// points at the shared dev project. Throws (failing the run) otherwise.
assertLocalSupabaseEnv(process.env)
