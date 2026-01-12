import { createServiceRoleSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { deleteContentItem } from '@/utils/content-management'

export async function POST(request: NextRequest) {
  try {
    const { id, ids } = await request.json()

    if (!id && !ids) {
      return NextResponse.json({ error: 'ID or IDs are required' }, { status: 400 })
    }

    // Get current user for audit logging (using server client with cookies)
    const userClient = await createServerSupabaseClient()
    const { data: { user } } = await userClient.auth.getUser()
    const userId = user?.id || null

    // Handle both single and bulk delete
    const idsToDelete = ids ? ids : [id]

    // Define relationship configs for case studies
    const relationshipConfigs = [
      { junctionTable: 'case_study_industry_relations', contentIdField: 'case_study_id', relatedIdField: 'industry_id', relatedTable: 'industries' },
      { junctionTable: 'case_study_persona_relations', contentIdField: 'case_study_id', relatedIdField: 'persona_id', relatedTable: 'personas' },
      { junctionTable: 'algorithm_case_study_relations', contentIdField: 'case_study_id', relatedIdField: 'algorithm_id', relatedTable: 'algorithms' },
      { junctionTable: 'case_study_quantum_software_relations', contentIdField: 'case_study_id', relatedIdField: 'quantum_software_id', relatedTable: 'quantum_software' },
      { junctionTable: 'case_study_quantum_hardware_relations', contentIdField: 'case_study_id', relatedIdField: 'quantum_hardware_id', relatedTable: 'quantum_hardware' },
      { junctionTable: 'case_study_quantum_company_relations', contentIdField: 'case_study_id', relatedIdField: 'quantum_company_id', relatedTable: 'quantum_companies' },
      { junctionTable: 'case_study_partner_company_relations', contentIdField: 'case_study_id', relatedIdField: 'partner_company_id', relatedTable: 'partner_companies' },
    ]

    const errors: string[] = []
    for (const contentId of idsToDelete) {
      const { success, error } = await deleteContentItem({
        contentType: 'case_studies',
        id: contentId,
        relationshipConfigs,
        hardDelete: false,
        deletedBy: userId
      })

      if (!success && error) {
        console.error(`Error soft deleting case study ${contentId}:`, error)
        errors.push(`${contentId}: ${error.message}`)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        error: `Failed to delete some case studies: ${errors.join(', ')}`
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}