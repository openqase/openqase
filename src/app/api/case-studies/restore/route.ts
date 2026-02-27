import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const body = await request.json()
    const { id, ids } = body

    const supabase = await createServiceRoleSupabaseClient()

    // Handle single or bulk restore
    const idsToRestore = ids || (id ? [id] : [])

    if (idsToRestore.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const { error } = await supabase
      .from('case_studies')
      .update({ deleted_at: null })
      .in('id', idsToRestore)

    if (error) {
      console.error('Restore error:', error)
      return NextResponse.json({ error: 'Failed to restore case studies' }, { status: 500 })
    }

    return NextResponse.json({ success: true, restored: idsToRestore.length })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
