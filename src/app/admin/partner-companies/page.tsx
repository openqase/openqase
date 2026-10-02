import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { PartnerCompaniesClient } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Partner Companies Management',
  description: 'Manage partner companies content'
}

export type PartnerCompany = Database['public']['Tables']['partner_companies']['Row']

export default async function PartnerCompaniesPage() {
  const supabase = createServiceRoleSupabaseClient()
  
  const { data: partnerCompanies, error } = await supabase
    .from('partner_companies')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching partner companies:', error)
    return <div>Error loading partner companies</div>
  }

  return <PartnerCompaniesClient data={partnerCompanies || []} />
}