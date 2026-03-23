import { revalidatePath } from 'next/cache'
import { getContentType } from '../registry'

export function revalidateContentType(typeSlug: string, slug?: string): void {
  const ct = getContentType(typeSlug)
  if (!ct) return

  revalidatePath(ct.adminPath)
  revalidatePath(ct.basePath)

  if (slug) {
    revalidatePath(`${ct.basePath}/${slug}`)
  }
}
