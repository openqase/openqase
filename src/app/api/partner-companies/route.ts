import { NextRequest, NextResponse } from 'next/server'
import { listContent, fetchContentBySlug, deleteContent, publishContent, unpublishContent } from '@/cms/operations'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const data = await fetchContentBySlug('partner-companies', slug)
      if (!data) return NextResponse.json({ error: 'Partner company not found' }, { status: 404 })
      return NextResponse.json(data)
    }

    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    const { items, total } = await listContent('partner-companies', { page, pageSize })

    if (!searchParams.has('page')) {
      return NextResponse.json(items)
    }

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
    console.error('Error in partner-companies GET handler:', error)
    return NextResponse.json({ error: 'Failed to fetch partner companies' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const result = await deleteContent('partner-companies', id)
    if (!result.success) return NextResponse.json({ error: 'Failed to delete partner company' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in partner-companies DELETE handler:', error)
    return NextResponse.json({ error: 'Failed to delete partner company' }, { status: 500 })
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
      ? await publishContent('partner-companies', id)
      : await unpublishContent('partner-companies', id)

    if (!result.success) return NextResponse.json({ error: 'Failed to update published status' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in partner-companies PATCH handler:', error)
    return NextResponse.json({ error: 'Failed to update partner company' }, { status: 500 })
  }
}
