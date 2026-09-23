import { createRestoreHandler } from '@/lib/trash-route-handlers'

/**
 * Restore case studies from the trash (POST { id } | { ids }). Uses the shared
 * CMS restore path: clears deleted_at / deleted_by, keeps published=false
 * (restored items are drafts), restores junction rows, writes the audit log
 * and revalidates. See src/lib/trash-route-handlers.ts.
 */
export const POST = createRestoreHandler('case-studies')
