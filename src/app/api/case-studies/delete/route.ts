import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { BulkActionSchema } from '@/lib/schemas/bulk-action'
import { deleteContentMany } from '@/cms/operations'

/**
 * Soft delete (move to trash) one or more case studies.
 * Uses the shared CMS soft-delete path: sets deleted_at / deleted_by,
 * published=false and revalidates admin list, public list and slug pages.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const body = await request.json()
    const parsed = BulkActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { id, ids } = parsed.data

    // Handle both single and bulk delete
    const idsToDelete = ids || (id ? [id] : [])

    const { failed, errors } = await deleteContentMany('case-studies', idsToDelete, {
      deletedBy: auth.user.id,
    })

    if (failed.length > 0) {
      console.error('Error soft deleting case studies:', errors)
      return NextResponse.json({
        error: `Failed to delete some case studies: ${failed.join(', ')}`
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in case-studies delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
