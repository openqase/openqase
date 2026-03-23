'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import type { TablesInsert } from '@/types/supabase'

interface CaseStudyFormData {
  id?: string
  title: string
  slug: string
  description?: string | null
  main_content?: string | null
  published?: boolean
  featured?: boolean
  academic_references?: string | null
  resource_links?: string | null
  year?: number | null
  industries?: string[]
  algorithms?: string[]
  personas?: string[]
  quantum_software?: string[]
  quantum_hardware?: string[]
  quantum_companies?: string[]
  partner_companies?: string[]
}

export async function saveCaseStudy(values: CaseStudyFormData): Promise<{ caseStudy?: TablesInsert<'case_studies'>; success: boolean; error?: string }> {
  try {
    const { id, industries, algorithms, personas, quantum_software, quantum_hardware, quantum_companies, partner_companies, ...data } = values

    const relationships: Record<string, string[]> = {}
    if (industries?.length) relationships.industries = industries
    if (algorithms?.length) relationships.algorithms = algorithms
    if (personas?.length) relationships.personas = personas
    if (quantum_software?.length) relationships.quantum_software = quantum_software
    if (quantum_hardware?.length) relationships.quantum_hardware = quantum_hardware
    if (quantum_companies?.length) relationships.quantum_companies = quantum_companies
    if (partner_companies?.length) relationships.partner_companies = partner_companies

    if (id) {
      const result = await updateContent('case-studies', id, data, relationships)
      if (result.error) return { success: false, error: result.error }
      return { caseStudy: result.data as TablesInsert<'case_studies'>, success: true }
    }

    const result = await createContent('case-studies', data, relationships)
    if (result.error) return { success: false, error: result.error }
    return { caseStudy: result.data as TablesInsert<'case_studies'>, success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save case study'
    return { success: false, error: message }
  }
}

export async function publishCaseStudy(id: string, slug: string): Promise<{ success: boolean; error?: string }> {
  const result = await publishContent('case-studies', id)
  if (!result.success) return { success: false, error: result.error || 'Failed to publish' }
  return { success: true }
}

export async function unpublishCaseStudy(id: string, slug: string): Promise<{ success: boolean; error?: string }> {
  const result = await unpublishContent('case-studies', id)
  if (!result.success) return { success: false, error: result.error || 'Failed to unpublish' }
  return { success: true }
}
