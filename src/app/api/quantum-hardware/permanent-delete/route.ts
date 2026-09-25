import { createPermanentDeleteHandler } from '@/lib/trash-route-handlers'

/** Permanently delete trashed quantum-hardware (POST { id } | { ids }). See src/lib/trash-route-handlers.ts. */
export const POST = createPermanentDeleteHandler('quantum-hardware')
