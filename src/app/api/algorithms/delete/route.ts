import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { id, ids } = await request.json()
    
    if (!id && !ids) {
      return NextResponse.json({ error: 'ID or IDs are required' }, { status: 400 })
    }

    const supabase = createServiceRoleSupabaseClient()
    
    // Handle both single and bulk delete
    const idsToDelete = ids ? ids : [id]
    
    const errors: string[] = []
    for (const contentId of idsToDelete) {
      const { error } = await supabase.rpc('soft_delete_content', {
        table_name: 'algorithms',
        content_id: contentId
      })
      
      if (error) {
        console.error(`Error soft deleting algorithm ${contentId}:`, error)
        errors.push(contentId)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: `Failed to delete some algorithms: ${errors.join(', ')}` 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}