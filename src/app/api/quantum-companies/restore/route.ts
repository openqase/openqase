import { createRestoreHandler } from '@/lib/trash-route-handlers'

/** Restore trashed quantum-companies (POST { id } | { ids }). See src/lib/trash-route-handlers.ts. */
export const POST = createRestoreHandler('quantum-companies')
