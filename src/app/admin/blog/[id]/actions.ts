'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
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

export async function saveBlogPost(values: BlogPostFormData) {
  const { id, related_posts, ...data } = values
  const relationships = related_posts !== undefined ? { related_posts } : undefined

  let result
  if (id) {
    result = await updateContent('blog-posts', id, data, relationships)
  } else {
    result = await createContent('blog-posts', data, relationships)
  }

  if (result.error) throw new Error(result.error)

  // Revalidate homepage because it shows featured blog posts
  revalidatePath('/')

  return result.data
}

export async function publishBlogPost(id: string): Promise<void> {
  const result = await publishContent('blog-posts', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
  revalidatePath('/')
}

export async function unpublishBlogPost(id: string): Promise<void> {
  const result = await unpublishContent('blog-posts', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
  revalidatePath('/')
}
