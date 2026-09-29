import { createPermanentDeleteHandler } from '@/lib/trash-route-handlers'

/** Permanently delete trashed partner-companies (POST { id } | { ids }). See src/lib/trash-route-handlers.ts. */
export const POST = createPermanentDeleteHandler('partner-companies')
