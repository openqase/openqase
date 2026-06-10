import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { PartnerCompanyForm } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit Partner Company',
  description: 'Edit partner company details'
}

interface PartnerCompanyEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PartnerCompanyEditPage({ params }: PartnerCompanyEditPageProps) {
  const resolvedParams = await params
  const supabase = createServiceRoleSupabaseClient()
  const isNew = resolvedParams.id === 'new'

  let partnerCompany = null
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
        .from('partner_companies')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error || !data) {
        console.error('Error fetching partner company:', error)
        notFound()
      }

      partnerCompany = data
    }

  } catch (error) {
    console.error('Error in PartnerCompanyEditPage:', error)
    notFound()
  }

  return (
    <PartnerCompanyForm
      partnerCompany={partnerCompany}
      caseStudies={caseStudies}
      isNew={isNew}
    />
  )
}