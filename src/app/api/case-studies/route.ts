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
  revalidateContentType,
} from '@/cms/operations'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
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

async function handleBulkPublish(ids: string[], published: boolean) {
  try {
    const supabase = createServiceRoleSupabaseClient()
    let query = supabase
      .from('case_studies')
      .update({ published, updated_at: new Date().toISOString() })
      .in('id', ids)

    // Never publish soft-deleted (trashed) case studies.
    if (published) {
      query = query.is('deleted_at', null)
    }

    const { data, error } = await query.select()

    if (error) {
      return NextResponse.json({ error: `Failed to ${published ? 'publish' : 'unpublish'} case studies` }, { status: 500 })
    }

    revalidateContentType(
      'case-studies',
      (data ?? []).map(row => row.slug).filter((s): s is string => !!s)
    )

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      message: `Successfully ${published ? 'published' : 'unpublished'} ${data?.length || 0} case studies`,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to process bulk operation' }, { status: 500 })
  }
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
