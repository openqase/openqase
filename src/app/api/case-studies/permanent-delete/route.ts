import { createPermanentDeleteHandler } from '@/lib/trash-route-handlers'

/**
 * Permanently delete case studies from the trash (intentional "empty trash"
 * flow used by /admin/case-studies/trash). Only rows that are already
 * soft-deleted are removed; live content can't be hard-deleted through here.
 * Junction rows (registry junctions + case_study_relations) are removed first,
 * then the admin list, public list and slug pages are revalidated.
 */
export const POST = createPermanentDeleteHandler('case-studies', [
  // Self-referential related-case-study junction (not in the CMS registry)
  { junctionTable: 'case_study_relations', contentIdField: 'case_study_id' },
])
