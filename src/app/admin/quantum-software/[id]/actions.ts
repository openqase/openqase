'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import { runAction, toActionResult, toSaveResult, type ActionResult, type SaveActionResult } from '@/lib/admin-action-result'
import type { Tables } from '@/types/supabase'

// Shape sent by src/app/admin/quantum-software/[id]/client.tsx.
interface QuantumSoftwareFormData {
  id?: string
  name: string
  slug: string
  description?: string | null
  main_content?: string | null
  vendor?: string | null
  website_url?: string | null
  documentation_url?: string | null
  github_url?: string | null
  license_type?: string | null
  pricing_model?: string | null
  published?: boolean
  related_case_studies?: string[]
}

export const saveQuantumSoftware = withAdmin(async (values: QuantumSoftwareFormData): Promise<SaveActionResult<Tables<'quantum_software'>>> =>
  runAction('Failed to save quantum software', async () => {
    const { id, related_case_studies, ...data } = values

    // Relationship keys match the relationship names in src/cms/types/<type>.ts.
    // Omitted (undefined) leaves existing links untouched; an array (even an
    // empty one) replaces them.
    const relationships = related_case_studies ? { case_studies: related_case_studies } : undefined
    const result = id
      ? await updateContent('quantum-software', id, data, relationships)
      : await createContent('quantum-software', data, relationships)
    return toSaveResult<Tables<'quantum_software'>>(result)
  })
)

export const publishQuantumSoftware = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to publish', async () => toActionResult(await publishContent('quantum-software', id), 'Failed to publish'))
)

export const unpublishQuantumSoftware = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to unpublish', async () => toActionResult(await unpublishContent('quantum-software', id), 'Failed to unpublish'))
)
