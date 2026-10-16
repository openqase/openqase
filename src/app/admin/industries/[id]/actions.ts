'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import { runAction, toActionResult, toSaveResult, type ActionResult, type SaveActionResult } from '@/lib/admin-action-result'
import type { Tables } from '@/types/supabase'

interface IndustryFormData {
  id?: string
  name: string
  slug: string
  description?: string | null
  main_content?: string | null
  published?: boolean
}

export const saveIndustry = withAdmin(async (values: IndustryFormData): Promise<SaveActionResult<Tables<'industries'>>> =>
  runAction('Failed to save industry', async () => {
    const { id, ...data } = values
    const result = id
      ? await updateContent('industries', id, data)
      : await createContent('industries', data)
    return toSaveResult<Tables<'industries'>>(result)
  })
)

export const publishIndustry = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to publish', async () => toActionResult(await publishContent('industries', id), 'Failed to publish'))
)

export const unpublishIndustry = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to unpublish', async () => toActionResult(await unpublishContent('industries', id), 'Failed to unpublish'))
)
