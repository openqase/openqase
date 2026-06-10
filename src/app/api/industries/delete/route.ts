import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { BulkActionSchema } from '@/lib/schemas/bulk-action'

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

    const supabase = createServiceRoleSupabaseClient()
    
    // Handle both single and bulk delete
    const idsToDelete = ids || (id ? [id] : [])
    
    const errors: string[] = []
    for (const contentId of idsToDelete) {
      const { error } = await supabase.rpc('soft_delete_content', {
        table_name: 'industries',
        content_id: contentId
      })
      
      if (error) {
        console.error(`Error soft deleting industry ${contentId}:`, error)
        errors.push(contentId)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: `Failed to delete some industries: ${errors.join(', ')}` 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}