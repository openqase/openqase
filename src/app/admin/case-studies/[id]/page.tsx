import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/supabase-untyped'
import type { Database } from '@/types/supabase'
import { notFound } from 'next/navigation'
import { CaseStudyForm } from './client'

export const metadata: Metadata = {
  title: 'Edit Case Study',
  description: 'Create or edit a case study'
}

type CaseStudy = Database['public']['Tables']['case_studies']['Row']
type Industry = Database['public']['Tables']['industries']['Row']
type Algorithm = Database['public']['Tables']['algorithms']['Row']
type Persona = Database['public']['Tables']['personas']['Row']
type QuantumSoftware = Database['public']['Tables']['quantum_software']['Row']
type QuantumHardware = Database['public']['Tables']['quantum_hardware']['Row']
type QuantumCompany = Database['public']['Tables']['quantum_companies']['Row']
type PartnerCompany = Database['public']['Tables']['partner_companies']['Row']

interface CaseStudyPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditCaseStudyPage({ params }: CaseStudyPageProps) {
  const resolvedParams = await params
  // Use service role client to bypass RLS
  const supabase = createServiceRoleSupabaseClient()
  const isNew = resolvedParams.id === 'new'

  // Fetch case study if editing
  const { data: caseStudy } = !isNew
    ? await supabase
        .from('case_studies')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()
    : { data: null }
    
  // Fetch relationships if editing
  let algorithms: string[] = []
  let industries: string[] = []
  let personas: string[] = []
  let quantumSoftware: string[] = []
  let quantumHardware: string[] = []
  let quantumCompanies: string[] = []
  let partnerCompanies: string[] = []
  
  if (!isNew && caseStudy) {
    // Fetch all relationships in parallel
    const [
      { data: algorithmRelations },
      { data: industryRelations },
      { data: personaRelations },
      { data: quantumSoftwareRelations },
      { data: quantumHardwareRelations },
      { data: quantumCompanyRelations },
      { data: partnerCompanyRelations },
    ] = await Promise.all([
      supabase.from('algorithm_case_study_relations').select('algorithm_id').eq('case_study_id', caseStudy.id),
      fromTable(supabase, 'case_study_industry_relations').select('industry_id').eq('case_study_id', caseStudy.id),
      fromTable(supabase, 'case_study_persona_relations').select('persona_id').eq('case_study_id', caseStudy.id),
      fromTable(supabase, 'case_study_quantum_software_relations').select('quantum_software_id').eq('case_study_id', caseStudy.id),
      fromTable(supabase, 'case_study_quantum_hardware_relations').select('quantum_hardware_id').eq('case_study_id', caseStudy.id),
      fromTable(supabase, 'case_study_quantum_company_relations').select('quantum_company_id').eq('case_study_id', caseStudy.id),
      fromTable(supabase, 'case_study_partner_company_relations').select('partner_company_id').eq('case_study_id', caseStudy.id),
    ])

    if (algorithmRelations) algorithms = algorithmRelations.map(relation => relation.algorithm_id as string)
    if (industryRelations) industries = (industryRelations as Record<string, string>[]).map(relation => relation.industry_id)
    if (personaRelations) personas = (personaRelations as Record<string, string>[]).map(relation => relation.persona_id)
    if (quantumSoftwareRelations) quantumSoftware = (quantumSoftwareRelations as Record<string, string>[]).map(relation => relation.quantum_software_id)
    if (quantumHardwareRelations) quantumHardware = (quantumHardwareRelations as Record<string, string>[]).map(relation => relation.quantum_hardware_id)
    if (quantumCompanyRelations) quantumCompanies = (quantumCompanyRelations as Record<string, string>[]).map(relation => relation.quantum_company_id)
    if (partnerCompanyRelations) partnerCompanies = (partnerCompanyRelations as Record<string, string>[]).map(relation => relation.partner_company_id)
  }

  // Fetch all dropdown data in parallel
  const [
    { data: allIndustries },
    { data: allAlgorithms },
    { data: allPersonas },
    { data: allQuantumSoftware },
    { data: allQuantumHardware },
    { data: allQuantumCompanies },
    { data: allPartnerCompanies },
  ] = await Promise.all([
    supabase.from('industries').select('id, slug, name').order('name'),
    supabase.from('algorithms').select('id, slug, name').order('name'),
    supabase.from('personas').select('id, slug, name').order('name'),
    supabase.from('quantum_software').select('id, slug, name').eq('published', true).order('name'),
    supabase.from('quantum_hardware').select('id, slug, name').eq('published', true).order('name'),
    supabase.from('quantum_companies').select('id, slug, name').eq('published', true).order('name'),
    supabase.from('partner_companies').select('id, slug, name').eq('published', true).order('name'),
  ])

  if (!isNew && !caseStudy) {
    notFound()
  }

  // If editing, add the relationship IDs to the case study data
  let caseStudyWithRelations: Record<string, unknown> | null = caseStudy;
  if (!isNew && caseStudy) {
    caseStudyWithRelations = {
      ...caseStudy,
      algorithms,
      industries,
      personas,
      quantum_software: quantumSoftware,
      quantum_hardware: quantumHardware,
      quantum_companies: quantumCompanies,
      partner_companies: partnerCompanies
    };
  }

  return (
    <CaseStudyForm
      caseStudy={caseStudyWithRelations}
      algorithms={allAlgorithms || []}
      industries={allIndustries || []}
      personas={allPersonas || []}
      quantumSoftware={allQuantumSoftware || []}
      quantumHardware={allQuantumHardware || []}
      quantumCompanies={allQuantumCompanies || []}
      partnerCompanies={allPartnerCompanies || []}
      isNew={isNew}
    />
  )
}