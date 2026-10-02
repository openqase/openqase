import * as Sentry from '@sentry/nextjs'
import { getContentType } from './registry'
import { fetchContentBySlug } from './operations'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'

/**
 * Single policy for content queries that feed static generation, ISR
 * regeneration and the sitemap. Outside Vercel production (local, CI with a
 * stub database, preview) a failure is logged and the caller falls back to an
 * empty result, as before. In Vercel production the error is thrown so that a
 * build fails instead of shipping a site with zero pages, and an ISR
 * regeneration keeps serving the previous page instead of replacing it with
 * an empty list. Every path also reports to Sentry.
 */
export function reportContentQueryError(
  context: string,
  error: { message: string } | null | undefined
): void {
  if (!error) return
  console.error(`[content] ${context}: ${error.message}`)
  Sentry.captureException(new Error(`${context}: ${error.message}`))
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error(`${context}: ${error.message}`)
  }
}

export function generateStaticParamsFor(typeSlug: string) {
  return async function generateStaticParams() {
    const ct = getContentType(typeSlug)
    if (!ct) return []

    const supabase = createServiceRoleSupabaseClient()
    const { data, error } = await fromTable(supabase, ct.tableName)
      .select('slug')
      .eq('published', true)
      .is('deleted_at', null)

    reportContentQueryError(`${typeSlug} slugs for static generation`, error)
    return (data ?? []).map((item: { slug: string }) => ({ slug: item.slug }))
  }
}

export function generateMetadataFor(typeSlug: string) {
  return async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const ct = getContentType(typeSlug)
    if (!ct) return {}

    const item = await fetchContentBySlug(typeSlug, slug)
    if (!item) return {}

    const title = (item as Record<string, unknown>)[ct.metadata.titleField] as string
    const description = (item as Record<string, unknown>)[ct.metadata.descriptionField] as string

    return {
      title: `${title} | OpenQase`,
      description: description || '',
      openGraph: { title, description: description || '' },
    }
  }
}

// Re-export fetch helpers for page components (already React.cache'd in fetch.ts).
// Use fetchContentBySlug for static/ISR pages (stays ● in build output).
// Use fetchPreviewContentBySlug for pages that are redirect targets of /api/preview
// (case-study, algorithm, industry, persona, blog) — these become ƒ (dynamic).
export { fetchContentBySlug, fetchPreviewContentBySlug } from './operations'
