import { NextRequest, NextResponse } from 'next/server'
import { listContent, fetchContentBySlug, deleteContent, publishContent, unpublishContent } from '@/cms/operations'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const data = await fetchContentBySlug('blog-posts', slug)
      if (!data) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
      return NextResponse.json(data)
    }

    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

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

    const result = await deleteContent('blog-posts', id)
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
    const { published } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
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
