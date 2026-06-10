import { getContentType } from './registry'
import { fetchContentBySlug } from './operations'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'
import type { ContentTable } from '@/lib/public-query'

export function generateStaticParamsFor(typeSlug: string) {
  return async function generateStaticParams() {
    const ct = getContentType(typeSlug)
    if (!ct) return []

    const supabase = createServiceRoleSupabaseClient()
    const { data } = await fromTable(supabase, ct.tableName)
      .select('slug')
      .eq('published', true)

    return (data ?? []).map((item: { slug: string }) => ({ slug: item.slug }))
  }
}

/**
 * Build-time fetcher: get every slug for a content type, including drafts.
 * Used by `generateStaticParams`. Pre-builds pages for everything; the
 * runtime render path applies the published filter at request time.
 */
export async function getAllSlugsForBuild(
  table: ContentTable
): Promise<{ slug: string }[]> {
  const client = createServiceRoleSupabaseClient();
  const { data } = await fromTable(client, table)
    .select('slug')
    .is('deleted_at', null);
  return ((data ?? []) as { slug: string }[]).filter(r => Boolean(r.slug));
}

/**
 * Build-time fetcher: get a record by id, ignoring `published` status.
 * For build-time rendering only. Runtime page renders use
 * `getPublishedBySlug` from `@/lib/public-query`.
 */
export async function getByIdForBuild(table: ContentTable, id: string) {
  const client = createServiceRoleSupabaseClient();
  return fromTable(client, table)
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
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
