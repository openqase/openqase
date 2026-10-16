import * as Sentry from '@sentry/nextjs'

/**
 * Single policy for content queries that feed static generation, ISR
 * regeneration and the sitemap. Outside Vercel production (local, CI with a
 * stub database, preview) a failure is logged and the caller falls back to an
 * empty result, as before (and the error is captured to Sentry). In Vercel
 * production the error is thrown so that a build fails instead of shipping a
 * site with zero pages, and a time-based ISR regeneration keeps serving the
 * previous page; a request that triggers a blocking render after
 * `revalidatePath` sees the error page for that one request instead of an
 * empty list. Sentry capture is best-effort (a prerender worker may exit
 * before flushing); the Vercel build log is the primary signal at build time.
 * The thrown path is not captured here: at runtime it reaches Next's
 * `onRequestError`, so capturing too would double-report.
 *
 * Lives in its own module (re-exported from page-helpers) so that
 * operations/fetch.ts can use it without a page-helpers <-> operations cycle.
 */
export function reportContentQueryError(
  context: string,
  error: { message: string } | null | undefined
): void {
  if (!error) return
  const err = new Error(`${context}: ${error.message}`)
  console.error(`[content] ${err.message}`)
  if (process.env.VERCEL_ENV === 'production') throw err
  Sentry.captureException(err)
}
