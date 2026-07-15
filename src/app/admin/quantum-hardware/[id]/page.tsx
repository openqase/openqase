import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { QuantumHardwareForm } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit Quantum Hardware',
  description: 'Edit quantum hardware details',
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
  let initialSpecs: { spec_key: string; value: string; unit: string | null }[] = []
  let definitions: any[] = []

  try {
    const [
      { data: caseStudiesData, error: caseStudiesError },
      { data: definitionsData, error: definitionsError },
    ] = await Promise.all([
      supabase.from('case_studies').select('id, title, slug').eq('published', true).order('title'),
      supabase.from('hardware_spec_definitions').select('*').order('label'),
    ])

    if (caseStudiesError) {
      console.error('Error fetching case studies:', caseStudiesError)
    } else {
      caseStudies = caseStudiesData || []
    }

    if (definitionsError) {
      console.error('Error fetching hardware spec definitions:', definitionsError)
    } else {
      definitions = definitionsData || []
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

      const { data: specsData, error: specsError } = await supabase
        .from('quantum_hardware_specs')
        .select('spec_key, value, unit')
        .eq('hardware_id', resolvedParams.id)
        .order('spec_key')

      if (specsError) {
        console.error('Error fetching hardware specs:', specsError)
      } else {
        initialSpecs = specsData || []
      }
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
      initialSpecs={initialSpecs}
      definitions={definitions}
    />
  )
}