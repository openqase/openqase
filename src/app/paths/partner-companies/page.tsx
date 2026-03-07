import { Metadata } from 'next'
import { getStaticContentList } from '@/lib/content-fetchers'
import type { Database } from '@/types/supabase'
import { PartnerCompaniesClient } from './client'

export const metadata: Metadata = {
  title: 'Partner Companies | Quantum Computing Collaborations - OpenQase',
  description: 'Explore organizations collaborating on quantum initiatives featured in case studies. Discover partnerships across industries and sectors.',
}

export type PartnerCompany = Database['public']['Tables']['partner_companies']['Row']

export const revalidate = 86400;

export default async function PartnerCompaniesPage() {
  const partnerCompanies = await getStaticContentList('partner_companies') as PartnerCompany[]
  const publishedCompanies = partnerCompanies.filter(company => company.published === true)

  return (
    <PartnerCompaniesClient 
      items={publishedCompanies}
      totalCount={publishedCompanies.length}
    />
  )
}