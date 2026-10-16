'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import { runAction, toActionResult, toSaveResult, type ActionResult, type SaveActionResult } from '@/lib/admin-action-result'
import type { Tables } from '@/types/supabase'

interface AlgorithmFormData {
  id?: string
  name: string
  slug: string
  description?: string | null
  main_content?: string | null
  use_cases?: string[] | null
  steps?: string | null
  academic_references?: string | null
  quantum_advantage?: string | null
  published?: boolean
  related_case_studies?: string[]
  related_industries?: string[]
  related_personas?: string[]
}

export const saveAlgorithm = withAdmin(async (values: AlgorithmFormData): Promise<SaveActionResult<Tables<'algorithms'>>> =>
  runAction('Failed to save algorithm', async () => {
    const { id, related_case_studies, related_industries, related_personas, ...data } = values

    const relationships = {
      ...(related_industries ? { industries: related_industries } : {}),
      ...(related_case_studies ? { case_studies: related_case_studies } : {}),
      ...(related_personas ? { personas: related_personas } : {}),
    }

    const result = id
      ? await updateContent('algorithms', id, data, relationships)
      : await createContent('algorithms', data, relationships)
    return toSaveResult<Tables<'algorithms'>>(result)
  })
)

export const publishAlgorithm = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to publish', async () => toActionResult(await publishContent('algorithms', id), 'Failed to publish'))
)

export const unpublishAlgorithm = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to unpublish', async () => toActionResult(await unpublishContent('algorithms', id), 'Failed to unpublish'))
)
