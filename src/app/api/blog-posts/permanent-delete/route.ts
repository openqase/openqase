import { createPermanentDeleteHandler } from '@/lib/trash-route-handlers'

/** Permanently delete trashed blog-posts (POST { id } | { ids }). See src/lib/trash-route-handlers.ts. */
export const POST = createPermanentDeleteHandler('blog-posts')
