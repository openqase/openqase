import { createPermanentDeleteHandler } from '@/lib/trash-route-handlers'

/** Permanently delete trashed personas (POST { id } | { ids }). See src/lib/trash-route-handlers.ts. */
export const POST = createPermanentDeleteHandler('personas')
