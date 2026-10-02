import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/pagination'
import {
  listContent,
  fetchContentBySlug,
  deleteContent,
  deleteContentMany,
  publishContent,
  unpublishContent,
} from '@/cms/operations'
import { MAX_BULK_IDS } from '@/lib/validation/constants'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const data = await fetchContentBySlug('case-studies', slug)
      if (!data) return NextResponse.json({ error: 'Case study not found' }, { status: 404 })
      return NextResponse.json(data)
    }

    const pagination = parsePagination(searchParams, { pageSize: 10 })
    if (!pagination.ok) return NextResponse.json({ error: pagination.error }, { status: 400 })
    const { page, pageSize } = pagination

    const { items, total } = await listContent('case-studies', { page, pageSize })

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
    console.error('Error in case-studies GET handler:', error)
    return NextResponse.json({ error: 'Failed to fetch case studies' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const result = await deleteContent('case-studies', id, { deletedBy: auth.user.id })
    if (!result.success) return NextResponse.json({ error: 'Failed to delete case study' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in case-studies DELETE handler:', error)
    return NextResponse.json({ error: 'Failed to delete case study' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const body = await request.json()

    // Handle bulk operations (case-study-specific)
    if (body.bulk) {
      const bulkSchema = z.object({
        operation: z.enum(['publish', 'unpublish', 'delete']),
        ids: z.array(z.string().uuid()).min(1).max(MAX_BULK_IDS),
      })

      const parsed = bulkSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid bulk operation request' }, { status: 400 })
      }

      const { operation, ids } = parsed.data

      if (operation === 'publish') return handleBulkPublish(ids, true)
      if (operation === 'unpublish') return handleBulkPublish(ids, false)
      if (operation === 'delete') return handleBulkDelete(ids, auth.user.id)
    }

    // Handle single item publish/unpublish
    const id = searchParams.get('id')
    const { published } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    if (published === undefined) return NextResponse.json({ error: 'Published status is required' }, { status: 400 })

    const result = published
      ? await publishContent('case-studies', id)
      : await unpublishContent('case-studies', id)

    if (!result.success) return NextResponse.json({ error: 'Failed to update published status' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in case-studies PATCH handler:', error)
    return NextResponse.json({ error: 'Failed to update case study' }, { status: 500 })
  }
}

/**
 * Bulk publish/unpublish goes through the single publish path so every row
 * gets the same guards (never publish a trashed row), the same published_at
 * stamping, and the same per-slug revalidation as the single-item action.
 */
async function handleBulkPublish(ids: string[], published: boolean) {
  const failed: string[] = []
  for (const id of ids) {
    const result = published
      ? await publishContent('case-studies', id)
      : await unpublishContent('case-studies', id)
    if (!result.success) failed.push(id)
  }

  const updated = ids.length - failed.length
  const verb = published ? 'published' : 'unpublished'
  return NextResponse.json({
    success: true,
    updated,
    failed,
    message: failed.length === 0
      ? `Successfully ${verb} ${updated} case studies`
      : `${verb} ${updated} case studies; ${failed.length} could not be ${verb}`,
  })
}

/**
 * Bulk delete = soft delete (move to trash) via the shared CMS path.
 * Hard deletion is only available from the trash (permanent-delete route).
 */
async function handleBulkDelete(ids: string[], deletedBy: string) {
  try {
    const { failed, errors } = await deleteContentMany('case-studies', ids, { deletedBy })
    const deleted = ids.length - failed.length

    if (failed.length > 0) {
      console.error('Error soft deleting case studies:', errors)
      return NextResponse.json({ error: 'Failed to delete case studies' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted,
      message: `Successfully deleted ${deleted} case studies`,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to process bulk delete' }, { status: 500 })
  }
}
