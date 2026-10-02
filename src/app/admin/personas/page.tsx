import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { PersonasClient } from './client'

export const metadata: Metadata = {
  title: 'Personas Management',
  description: 'Manage user personas content'
}

export type Persona = Database['public']['Tables']['personas']['Row']

export default async function PersonasPage() {
  const supabase = createServiceRoleSupabaseClient()
  
  const { data: personas, error } = await supabase
    .from('personas')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching personas:', error)
    return <div>Error loading personas</div>
  }

  return <PersonasClient data={personas || []} />
}