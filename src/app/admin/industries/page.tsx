import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { IndustriesClient } from './client'

export const metadata: Metadata = {
  title: 'Industries Management',
  description: 'Manage industry content'
}

export type Industry = Database['public']['Tables']['industries']['Row']

export default async function IndustriesPage() {
  const supabase = createServiceRoleSupabaseClient()
  
  const { data: industries, error } = await supabase
    .from('industries')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching industries:', error)
    return <div>Error loading industries</div>
  }

  return <IndustriesClient data={industries || []} />
}