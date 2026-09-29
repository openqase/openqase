import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/pagination'
import { listContent, fetchContentBySlug, deleteContent, publishContent, unpublishContent, revalidateContentType } from '@/cms/operations'
import { requireAdmin } from '@/lib/auth'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const data = await fetchContentBySlug('blog-posts', slug)
      if (!data) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
      return NextResponse.json(data)
    }

    const pagination = parsePagination(searchParams, { pageSize: 10 })
    if (!pagination.ok) return NextResponse.json({ error: pagination.error }, { status: 400 })
    const { page, pageSize } = pagination

    const { items, total } = await listContent('blog-posts', { page, pageSize })

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Error in blog-posts GET handler:', error)
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const result = await deleteContent('blog-posts', id, { deletedBy: auth.user.id })
    if (!result.success) return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in blog-posts DELETE handler:', error)
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    const { published, featured } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    // Featured toggle from the admin blog list
    if (typeof featured === 'boolean' && published === undefined) {
      const supabase = createServiceRoleSupabaseClient()
      const { data, error } = await supabase.from('blog_posts')
        .update({ featured })
        .eq('id', id)
        .select('slug')
        .single()
      if (error) return NextResponse.json({ error: 'Failed to update featured status' }, { status: 500 })
      revalidateContentType('blog-posts', (data as { slug?: string } | null)?.slug)
      return NextResponse.json({ success: true })
    }

    if (published === undefined) return NextResponse.json({ error: 'Published status is required' }, { status: 400 })

    const result = published
      ? await publishContent('blog-posts', id)
      : await unpublishContent('blog-posts', id)

    if (!result.success) return NextResponse.json({ error: 'Failed to update published status' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in blog-posts PATCH handler:', error)
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
  }
}
