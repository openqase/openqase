import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { CaseStudiesClient } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Case Studies Management',
  description: 'Manage case studies content'
}

export type CaseStudy = Database['public']['Tables']['case_studies']['Row']

export default async function CaseStudiesPage() {
  let caseStudies: CaseStudy[] = []
  let errorMessage: string | null = null

  try {
    const supabase = await createServiceRoleSupabaseClient();

    // Fetch non-deleted case studies only (deleted items go to trash view)
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .is('deleted_at', null)
      .order('title')

    if (error) {
      console.error('Error fetching case studies:', error)
      errorMessage = `Error loading case studies: ${error.message}`
    } else {
      caseStudies = data || []
    }
  } catch (err) {
    console.error('Unexpected error in CaseStudiesPage:', err)
    errorMessage = 'Unexpected error loading case studies'
  }

  if (errorMessage) return <div>{errorMessage}</div>
  return <CaseStudiesClient data={caseStudies} />
}