import { createPermanentDeleteHandler } from '@/lib/trash-route-handlers'

/** Permanently delete trashed industries (POST { id } | { ids }). See src/lib/trash-route-handlers.ts. */
export const POST = createPermanentDeleteHandler('industries')
