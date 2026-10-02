import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { QuantumHardwareClient } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Quantum Hardware Management',
  description: 'Manage quantum hardware content'
}

export type QuantumHardware = Database['public']['Tables']['quantum_hardware']['Row']

export default async function QuantumHardwarePage() {
  const supabase = createServiceRoleSupabaseClient()
  
  const { data: quantumHardware, error } = await supabase
    .from('quantum_hardware')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching quantum hardware:', error)
    return <div>Error loading quantum hardware</div>
  }

  return <QuantumHardwareClient data={quantumHardware || []} />
}