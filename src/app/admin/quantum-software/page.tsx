import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { QuantumSoftwareClient } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Quantum Software Management',
  description: 'Manage quantum software content'
}

export type QuantumSoftware = Database['public']['Tables']['quantum_software']['Row']

export default async function QuantumSoftwarePage() {
  const supabase = createServiceRoleSupabaseClient()
  
  const { data: quantumSoftware, error } = await supabase
    .from('quantum_software')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching quantum software:', error)
    return <div>Error loading quantum software</div>
  }

  return <QuantumSoftwareClient data={quantumSoftware || []} />
}