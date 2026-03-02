import { Metadata } from 'next'
import { getStaticContentList } from '@/lib/content-fetchers'
import type { Database } from '@/types/supabase'
import { QuantumCompaniesClient } from './client'

export const metadata: Metadata = {
  title: 'Quantum Companies | Leading Quantum Computing Organizations - OpenQase',
  description: 'Learn about companies building quantum computing solutions featured in case studies. Explore startups, tech giants, and quantum specialists.',
}

export type QuantumCompany = Database['public']['Tables']['quantum_companies']['Row']

export const revalidate = 3600;

export default async function QuantumCompaniesPage() {
  const quantumCompanies = await getStaticContentList('quantum_companies') as QuantumCompany[]
  const publishedCompanies = quantumCompanies.filter(company => company.published === true)

  return (
    <QuantumCompaniesClient 
      items={publishedCompanies}
      totalCount={publishedCompanies.length}
    />
  )
}