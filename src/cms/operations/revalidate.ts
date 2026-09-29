import { revalidatePath } from 'next/cache'
import { getContentType } from '../registry'

/**
 * Content types that also appear on the homepage (latest case studies,
 * featured blog posts), so changes to them must revalidate `/` as well.
 */
const HOMEPAGE_TYPES = new Set(['case-studies', 'blog-posts'])

/**
 * On-demand revalidation for a content change (save / publish / unpublish /
 * delete / restore). Always revalidates, for any of the 9 registered types:
 *   1. the admin listing   (ct.adminPath, e.g. /admin/case-studies)
 *   2. the public listing  (ct.basePath,  e.g. /case-study)
 *   3. each detail page    (`${ct.basePath}/${slug}`) for the given slug(s)
 * plus the homepage for types it lists.
 */
export function revalidateContentType(typeSlug: string, slug?: string | string[] | null): void {
  const ct = getContentType(typeSlug)
  if (!ct) return

  revalidatePath(ct.adminPath)
  revalidatePath(ct.basePath)

  const slugs = Array.isArray(slug) ? slug : slug ? [slug] : []
  for (const s of slugs) {
    if (s) revalidatePath(`${ct.basePath}/${s}`)
  }

  if (HOMEPAGE_TYPES.has(ct.slug)) {
    revalidatePath('/')
  }
}
