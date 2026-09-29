import { createPermanentDeleteHandler } from '@/lib/trash-route-handlers'

/** Permanently delete trashed algorithms (POST { id } | { ids }). See src/lib/trash-route-handlers.ts. */
export const POST = createPermanentDeleteHandler('algorithms')
