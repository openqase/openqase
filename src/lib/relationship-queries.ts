'use server'

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

interface RelatedEntity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface RelatedPartnerCompany extends RelatedEntity {
  industry: string | null;
}

interface RelatedQuantumCompany extends RelatedEntity {
  company_type: string | null;
}

/**
 * Generic function to get related entities through a junction table.
 * Replaces 4 near-identical functions with a single parameterized implementation.
 */
async function getRelatedEntities<T = Record<string, unknown>>(
  caseStudyIds: string[],
  config: {
    junctionTable: string;
    foreignKey: string;
    targetTable: string;
    selectFields: string;
    label: string;
  }
): Promise<T[]> {
  if (!caseStudyIds || caseStudyIds.length === 0) return [];

  const supabase = await createServiceRoleSupabaseClient();

  // Get related IDs from the junction table
  const { data: relations, error: relError } = await supabase
    .from(config.junctionTable as any)
    .select(config.foreignKey)
    .in('case_study_id', caseStudyIds);

  if (relError || !relations || relations.length === 0) {
    if (relError) console.error(`Error fetching ${config.label} relations:`, relError);
    return [];
  }

  const ids = [...new Set(
    relations.map((r: any) => r[config.foreignKey]).filter((id: unknown) => id !== null)
  )] as string[];

  if (ids.length === 0) return [];

  // Fetch the entity details
  const { data, error } = await supabase
    .from(config.targetTable as any)
    .select(config.selectFields)
    .in('id', ids);

  if (error) {
    console.error(`Error fetching ${config.label}:`, error);
    return [];
  }

  return (data as T[]) || [];
}

export async function getRelatedQuantumSoftware(caseStudyIds: string[]): Promise<RelatedEntity[]> {
  return getRelatedEntities<RelatedEntity>(caseStudyIds, {
    junctionTable: 'case_study_quantum_software_relations',
    foreignKey: 'quantum_software_id',
    targetTable: 'quantum_software',
    selectFields: 'id, name, slug, description',
    label: 'quantum software',
  });
}

export async function getRelatedQuantumHardware(caseStudyIds: string[]): Promise<RelatedEntity[]> {
  return getRelatedEntities<RelatedEntity>(caseStudyIds, {
    junctionTable: 'case_study_quantum_hardware_relations',
    foreignKey: 'quantum_hardware_id',
    targetTable: 'quantum_hardware',
    selectFields: 'id, name, slug, description',
    label: 'quantum hardware',
  });
}

export async function getRelatedPartnerCompanies(caseStudyIds: string[]): Promise<RelatedPartnerCompany[]> {
  return getRelatedEntities<RelatedPartnerCompany>(caseStudyIds, {
    junctionTable: 'case_study_partner_company_relations',
    foreignKey: 'partner_company_id',
    targetTable: 'partner_companies',
    selectFields: 'id, name, slug, description, industry',
    label: 'partner companies',
  });
}

export async function getRelatedQuantumCompanies(caseStudyIds: string[]): Promise<RelatedQuantumCompany[]> {
  return getRelatedEntities<RelatedQuantumCompany>(caseStudyIds, {
    junctionTable: 'case_study_quantum_company_relations',
    foreignKey: 'quantum_company_id',
    targetTable: 'quantum_companies',
    selectFields: 'id, name, slug, description, company_type',
    label: 'quantum companies',
  });
}
