import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { listContent, fetchContentBySlug, deleteContent, publishContent, unpublishContent } from '@/cms/operations'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/supabase-untyped'
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

    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

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

    const result = await deleteContent('case-studies', id)
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
      if (operation === 'delete') return handleBulkDelete(ids)
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
    const { data, error } = await supabase
      .from('case_studies')
      .update({ published, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select()

    if (error) {
      return NextResponse.json({ error: `Failed to ${published ? 'publish' : 'unpublish'} case studies` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      message: `Successfully ${published ? 'published' : 'unpublished'} ${data?.length || 0} case studies`,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process bulk operation' }, { status: 500 })
  }
}

async function handleBulkDelete(ids: string[]) {
  try {
    const supabase = createServiceRoleSupabaseClient()

    // Delete relationships first (all 7 junction tables)
    const relationshipTables = [
      'algorithm_case_study_relations',
      'case_study_industry_relations',
      'case_study_persona_relations',
      'case_study_quantum_software_relations',
      'case_study_quantum_hardware_relations',
      'case_study_quantum_company_relations',
      'case_study_partner_company_relations',
    ]

    for (const table of relationshipTables) {
      await fromTable(supabase, table).delete().in('case_study_id', ids)
    }

    const { data, error } = await supabase
      .from('case_studies')
      .delete()
      .in('id', ids)
      .select()

    if (error) {
      return NextResponse.json({ error: 'Failed to delete case studies' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
      message: `Successfully deleted ${data?.length || 0} case studies`,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process bulk delete' }, { status: 500 })
  }
}
