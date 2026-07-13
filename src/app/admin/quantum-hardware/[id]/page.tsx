import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { QuantumHardwareForm } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit Quantum Hardware',
  description: 'Edit quantum hardware details'
}

interface QuantumHardwareEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function QuantumHardwareEditPage({ params }: QuantumHardwareEditPageProps) {
  const resolvedParams = await params
  const supabase = createServiceRoleSupabaseClient()
  const isNew = resolvedParams.id === 'new'

  let quantumHardware = null
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
        .from('quantum_hardware')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error || !data) {
        console.error('Error fetching quantum hardware:', error)
        notFound()
      }

      quantumHardware = data
    }

  } catch (error) {
    console.error('Error in QuantumHardwareEditPage:', error)
    notFound()
  }

  return (
    <QuantumHardwareForm
      quantumHardware={quantumHardware}
      caseStudies={caseStudies}
      isNew={isNew}
    />
  )
}