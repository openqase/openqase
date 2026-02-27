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

    // Handle single or bulk delete
    const idsToDelete = ids || (id ? [id] : [])

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    // Delete related records from junction tables
    const deleteFromTable = async (table: string) => {
      const { error } = await supabase
        .from(table as 'algorithm_case_study_relations')
        .delete()
        .in('case_study_id', idsToDelete)
      if (error) console.warn(`Error deleting from ${table}:`, error)
    }

    await Promise.all([
      deleteFromTable('algorithm_case_study_relations'),
      deleteFromTable('case_study_industry_relations'),
      deleteFromTable('case_study_persona_relations'),
      deleteFromTable('case_study_quantum_company_relations'),
      deleteFromTable('case_study_quantum_hardware_relations'),
      deleteFromTable('case_study_quantum_software_relations'),
      deleteFromTable('case_study_partner_company_relations'),
      deleteFromTable('case_study_relations')
    ])

    // Now delete the case studies
    const { error } = await supabase
      .from('case_studies')
      .delete()
      .in('id', idsToDelete)

    if (error) {
      console.error('Permanent delete error:', error)
      return NextResponse.json({ error: 'Failed to permanently delete case studies' }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: idsToDelete.length })
  } catch (error) {
    console.error('Permanent delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
