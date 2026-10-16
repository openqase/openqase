'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import { runAction, toActionResult, toSaveResult, type ActionResult, type SaveActionResult } from '@/lib/admin-action-result'
import type { Tables } from '@/types/supabase'
import { revalidatePath } from 'next/cache'

interface BlogPostFormData {
  id?: string
  title: string
  slug: string
  description?: string | null
  content?: string | null
  author?: string | null
  featured_image?: string | null
  category?: string | null
  tags?: string[] | null
  published?: boolean
  featured?: boolean
  published_at?: string | null
  related_posts?: string[]
}

export const saveBlogPost = withAdmin(async (values: BlogPostFormData): Promise<SaveActionResult<Tables<'blog_posts'>>> =>
  runAction('Failed to save blog post', async () => {
    const { id, related_posts, ...data } = values
    const relationships = related_posts !== undefined ? { related_posts } : undefined

    const result = id
      ? await updateContent('blog-posts', id, data, relationships)
      : await createContent('blog-posts', data, relationships)

    const saved = toSaveResult<Tables<'blog_posts'>>(result)
    // Revalidate homepage because it shows featured blog posts. A warning
    // still means the row was written, so revalidate in that case too.
    if (saved.success) revalidatePath('/')
    return saved
  })
)

export const publishBlogPost = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to publish', async () => {
    const result = toActionResult(await publishContent('blog-posts', id), 'Failed to publish')
    if (result.success) revalidatePath('/')
    return result
  })
)

export const unpublishBlogPost = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to unpublish', async () => {
    const result = toActionResult(await unpublishContent('blog-posts', id), 'Failed to unpublish')
    if (result.success) revalidatePath('/')
    return result
  })
)
