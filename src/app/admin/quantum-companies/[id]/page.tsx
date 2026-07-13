import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { QuantumCompanyForm } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit Quantum Company',
  description: 'Edit quantum company details'
}

interface QuantumCompanyEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function QuantumCompanyEditPage({ params }: QuantumCompanyEditPageProps) {
  const resolvedParams = await params
  const supabase = createServiceRoleSupabaseClient()
  const isNew = resolvedParams.id === 'new'

  let quantumCompany = null
  let caseStudies: any[] = []

  try {
    // Get case studies for relationship selector
    const { data: caseStudiesData, error: caseStudiesError } = await supabase
      .from('case_studies')
      .select('id, title, slug')
      .eq('published', true)
      .order('title')

    if (caseStudiesError) {
      console.error('Error fetching case studies:', caseStudiesError)
    } else {
      caseStudies = caseStudiesData || []
    }

    if (!isNew) {
      const { data, error } = await supabase
        .from('quantum_companies')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error || !data) {
        console.error('Error fetching quantum company:', error)
        notFound()
      }

      quantumCompany = data
    }

  } catch (error) {
    console.error('Error in QuantumCompanyEditPage:', error)
    notFound()
  }

  return (
    <QuantumCompanyForm
      quantumCompany={quantumCompany}
      caseStudies={caseStudies}
      isNew={isNew}
    />
  )
}