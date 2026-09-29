import { MetadataRoute } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { getAllContentTypes } from '@/cms/registry'
import type { ContentTable } from '@/lib/public-query'

const BASE_URL = 'https://openqase.com'

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

/**
 * Per-content-type sitemap tuning, keyed by CMS registry slug.
 *
 * URL paths are NOT declared here — they come from each content type's
 * `basePath` in src/cms/types/*.ts (the same source revalidate.ts uses), so
 * the sitemap cannot drift from the actual route directories again.
 */
const SITEMAP_SETTINGS: Record<
  string,
  { listing: { changeFrequency: ChangeFrequency; priority: number }; detailPriority: number }
> = {
  'case-studies': { listing: { changeFrequency: 'daily', priority: 0.9 }, detailPriority: 0.8 },
  'blog-posts': { listing: { changeFrequency: 'weekly', priority: 0.8 }, detailPriority: 0.6 },
  algorithms: { listing: { changeFrequency: 'weekly', priority: 0.7 }, detailPriority: 0.7 },
  industries: { listing: { changeFrequency: 'weekly', priority: 0.7 }, detailPriority: 0.7 },
  personas: { listing: { changeFrequency: 'weekly', priority: 0.7 }, detailPriority: 0.7 },
}

const DEFAULT_SETTINGS = {
  listing: { changeFrequency: 'weekly' as ChangeFrequency, priority: 0.6 },
  detailPriority: 0.6,
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceRoleSupabaseClient()

  // Static (non-CMS) pages. Content-type listing pages are added below from
  // the registry.
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/paths`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/roadmap`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const contentTypes = getAllContentTypes()

  // The service-role client bypasses RLS, so published + not-soft-deleted
  // must be enforced explicitly here.
  const results = await Promise.all(
    contentTypes.map(async (ct) => {
      const { data } = await supabase
        .from(ct.tableName as ContentTable)
        .select('slug, updated_at')
        .eq('published', true)
        .is('deleted_at', null)
      return { ct, rows: (data ?? []) as Array<{ slug: string | null; updated_at: string | null }> }
    })
  )

  const listingPages: MetadataRoute.Sitemap = []
  const detailPages: MetadataRoute.Sitemap = []

  for (const { ct, rows } of results) {
    const settings = SITEMAP_SETTINGS[ct.slug] ?? DEFAULT_SETTINGS

    listingPages.push({
      url: `${BASE_URL}${ct.basePath}`,
      lastModified: new Date(),
      changeFrequency: settings.listing.changeFrequency,
      priority: settings.listing.priority,
    })
    for (const item of rows) {
      if (!item.slug) continue
      detailPages.push({
        url: `${BASE_URL}${ct.basePath}/${item.slug}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
        changeFrequency: 'monthly',
        priority: settings.detailPriority,
      })
    }
  }

  return [...staticPages, ...listingPages, ...detailPages]
}
