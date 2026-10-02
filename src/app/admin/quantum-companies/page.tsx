import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { QuantumCompaniesClient } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Quantum Companies Management',
  description: 'Manage quantum companies content'
}

export type QuantumCompany = Database['public']['Tables']['quantum_companies']['Row']

export default async function QuantumCompaniesPage() {
  const supabase = createServiceRoleSupabaseClient()
  
  const { data: quantumCompanies, error } = await supabase
    .from('quantum_companies')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching quantum companies:', error)
    return <div>Error loading quantum companies</div>
  }

  return <QuantumCompaniesClient data={quantumCompanies || []} />
}