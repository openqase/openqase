'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import type { TablesInsert } from '@/types/supabase'
import type { ResourceLink } from '@/components/admin/ResourceLinksEditor'

interface CaseStudyFormData {
  id?: string
  title: string
  slug: string
  description?: string | null
  main_content?: string | null
  published?: boolean
  featured?: boolean
  academic_references?: string | null
  resource_links?: ResourceLink[] | null
  year?: number | null
  industries?: string[]
  algorithms?: string[]
  personas?: string[]
  quantum_software?: string[]
  quantum_hardware?: string[]
  quantum_companies?: string[]
  partner_companies?: string[]
}

export const saveCaseStudy = withAdmin(async (values: CaseStudyFormData): Promise<{ caseStudy?: TablesInsert<'case_studies'>; success: boolean; error?: string }> => {
  try {
    const { id, industries, algorithms, personas, quantum_software, quantum_hardware, quantum_companies, partner_companies, ...data } = values

    // Pass every defined array through, including [] — an empty array means
    // "the editor removed all links" and must clear the junction rows.
    // Only undefined (field not sent) leaves existing links untouched.
    const relationships: Record<string, string[]> = {}
    if (industries !== undefined) relationships.industries = industries
    if (algorithms !== undefined) relationships.algorithms = algorithms
    if (personas !== undefined) relationships.personas = personas
    if (quantum_software !== undefined) relationships.quantum_software = quantum_software
    if (quantum_hardware !== undefined) relationships.quantum_hardware = quantum_hardware
    if (quantum_companies !== undefined) relationships.quantum_companies = quantum_companies
    if (partner_companies !== undefined) relationships.partner_companies = partner_companies

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
})

export const publishCaseStudy = withAdmin(async (id: string, _slug: string): Promise<{ success: boolean; error?: string }> => {
  const result = await publishContent('case-studies', id)
  if (!result.success) return { success: false, error: result.error || 'Failed to publish' }
  return { success: true }
})

export const unpublishCaseStudy = withAdmin(async (id: string, _slug: string): Promise<{ success: boolean; error?: string }> => {
  const result = await unpublishContent('case-studies', id)
  if (!result.success) return { success: false, error: result.error || 'Failed to unpublish' }
  return { success: true }
})
