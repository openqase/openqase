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

// Re-export fetchContentBySlug for page components (already React.cache'd in fetch.ts)
export { fetchContentBySlug } from './operations'
