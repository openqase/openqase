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
  try {
    const supabase = await createServiceRoleSupabaseClient();
    
    // Fetch non-deleted case studies only (deleted items go to trash view)
    let { data: caseStudies, error } = await supabase
      .from('case_studies')
      .select('*')
      .is('deleted_at', null)
      .order('title')

    if (error) {
      console.error('Error fetching case studies:', error)
      return <div>Error loading case studies: {error.message}</div>
    }

    return <CaseStudiesClient data={caseStudies || []} />
  } catch (err) {
    console.error('Unexpected error in CaseStudiesPage:', err)
    return <div>Unexpected error loading case studies</div>
  }
}