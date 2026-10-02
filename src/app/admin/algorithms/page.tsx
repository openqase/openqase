import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { AlgorithmsClient } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Algorithms Management',
  description: 'Manage quantum algorithms content'
}

export type Algorithm = Database['public']['Tables']['algorithms']['Row']

export default async function AlgorithmsPage() {
  const supabase = createServiceRoleSupabaseClient()
  
  const { data: algorithms, error } = await supabase
    .from('algorithms')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching algorithms:', error)
    return <div>Error loading algorithms</div>
  }

  return <AlgorithmsClient data={algorithms || []} />
}