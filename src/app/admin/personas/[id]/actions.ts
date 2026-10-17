'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import { runAction, toActionResult, toSaveResult, type ActionResult, type SaveActionResult } from '@/lib/admin-action-result'
import type { Tables } from '@/types/supabase'

interface PersonaFormData {
  id?: string
  name: string
  slug: string
  description?: string | null
  main_content?: string | null
  recommended_reading?: string | null
  published?: boolean
  industry?: string[]  // relationship IDs sent from admin form
}

export const savePersona = withAdmin(async (values: PersonaFormData): Promise<SaveActionResult<Tables<'personas'>>> =>
  runAction('Failed to save persona', async () => {
    const { id, industry, ...data } = values
    const relationships = industry ? { industries: industry } : undefined

    const result = id
      ? await updateContent('personas', id, data, relationships)
      : await createContent('personas', data, relationships)
    return toSaveResult<Tables<'personas'>>(result)
  })
)

export const publishPersona = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to publish', async () => toActionResult(await publishContent('personas', id), 'Failed to publish'))
)

export const unpublishPersona = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to unpublish', async () => toActionResult(await unpublishContent('personas', id), 'Failed to unpublish'))
)
