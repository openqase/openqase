'use server'

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { fromTable } from '@/lib/supabase-untyped';

export interface RelatedEntity {
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
  const { data: relations, error: relError } = await fromTable(supabase, config.junctionTable)
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
  const { data, error } = await fromTable(supabase, config.targetTable)
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

export async function getRelatedIndustries(caseStudyIds: string[]): Promise<RelatedEntity[]> {
  return getRelatedEntities<RelatedEntity>(caseStudyIds, {
    junctionTable: 'case_study_industry_relations',
    foreignKey: 'industry_id',
    targetTable: 'industries',
    selectFields: 'id, name, slug, description',
    label: 'industries',
  });
}

export async function getRelatedAlgorithms(caseStudyIds: string[]): Promise<RelatedEntity[]> {
  return getRelatedEntities<RelatedEntity>(caseStudyIds, {
    junctionTable: 'algorithm_case_study_relations',
    foreignKey: 'algorithm_id',
    targetTable: 'algorithms',
    selectFields: 'id, name, slug, description',
    label: 'algorithms',
  });
}

export async function getRelatedPersonas(caseStudyIds: string[]): Promise<RelatedEntity[]> {
  return getRelatedEntities<RelatedEntity>(caseStudyIds, {
    junctionTable: 'case_study_persona_relations',
    foreignKey: 'persona_id',
    targetTable: 'personas',
    selectFields: 'id, name, slug, description',
    label: 'personas',
  });
}

export interface CaseStudyRelationships {
  industries: RelatedEntity[];
  algorithms: RelatedEntity[];
  personas: RelatedEntity[];
}

export async function getCaseStudyRelationshipMap(
  caseStudyIds: string[]
): Promise<Record<string, CaseStudyRelationships>> {
  if (!caseStudyIds || caseStudyIds.length === 0) return {};

  const supabase = await createServiceRoleSupabaseClient();

  // Cannot reuse getRelated* helpers here — we need case_study_id for grouping
  const [industryJunctions, algorithmJunctions, personaJunctions] = await Promise.all([
    fromTable(supabase, 'case_study_industry_relations')
      .select('case_study_id, industry_id')
      .in('case_study_id', caseStudyIds),
    fromTable(supabase, 'algorithm_case_study_relations')
      .select('case_study_id, algorithm_id')
      .in('case_study_id', caseStudyIds),
    fromTable(supabase, 'case_study_persona_relations')
      .select('case_study_id, persona_id')
      .in('case_study_id', caseStudyIds),
  ]);

  // Log junction query errors (matching getRelatedEntities pattern)
  if (industryJunctions.error) console.error('Error fetching industry junctions:', industryJunctions.error);
  if (algorithmJunctions.error) console.error('Error fetching algorithm junctions:', algorithmJunctions.error);
  if (personaJunctions.error) console.error('Error fetching persona junctions:', personaJunctions.error);

  // Collect unique entity IDs
  const industryIds = [...new Set(
    (industryJunctions.data || []).map((r: any) => r.industry_id).filter(Boolean)
  )] as string[];
  const algorithmIds = [...new Set(
    (algorithmJunctions.data || []).map((r: any) => r.algorithm_id).filter(Boolean)
  )] as string[];
  const personaIds = [...new Set(
    (personaJunctions.data || []).map((r: any) => r.persona_id).filter(Boolean)
  )] as string[];

  // Fetch entity details in parallel
  const [industries, algorithms, personas] = await Promise.all([
    industryIds.length > 0
      ? fromTable(supabase, 'industries').select('id, name, slug, description').in('id', industryIds)
      : Promise.resolve({ data: [] as RelatedEntity[], error: null }),
    algorithmIds.length > 0
      ? fromTable(supabase, 'algorithms').select('id, name, slug, description').in('id', algorithmIds)
      : Promise.resolve({ data: [] as RelatedEntity[], error: null }),
    personaIds.length > 0
      ? fromTable(supabase, 'personas').select('id, name, slug, description').in('id', personaIds)
      : Promise.resolve({ data: [] as RelatedEntity[], error: null }),
  ]);

  if (industries.error) console.error('Error fetching industries:', industries.error);
  if (algorithms.error) console.error('Error fetching algorithms:', algorithms.error);
  if (personas.error) console.error('Error fetching personas:', personas.error);

  // Build lookup maps
  const industryMap = new Map<string, RelatedEntity>((industries.data || []).map((e: any) => [e.id, e as RelatedEntity]));
  const algorithmMap = new Map<string, RelatedEntity>((algorithms.data || []).map((e: any) => [e.id, e as RelatedEntity]));
  const personaMap = new Map<string, RelatedEntity>((personas.data || []).map((e: any) => [e.id, e as RelatedEntity]));

  // Group by case study ID (deduplicate to guard against duplicate junction rows)
  const result: Record<string, CaseStudyRelationships> = {};
  const seen: Record<string, { industries: Set<string>; algorithms: Set<string>; personas: Set<string> }> = {};
  for (const id of caseStudyIds) {
    result[id] = { industries: [], algorithms: [], personas: [] };
    seen[id] = { industries: new Set(), algorithms: new Set(), personas: new Set() };
  }

  for (const row of (industryJunctions.data || []) as any[]) {
    const entity = industryMap.get(row.industry_id);
    if (entity && result[row.case_study_id] && !seen[row.case_study_id].industries.has(row.industry_id)) {
      seen[row.case_study_id].industries.add(row.industry_id);
      result[row.case_study_id].industries.push(entity);
    }
  }

  for (const row of (algorithmJunctions.data || []) as any[]) {
    const entity = algorithmMap.get(row.algorithm_id);
    if (entity && result[row.case_study_id] && !seen[row.case_study_id].algorithms.has(row.algorithm_id)) {
      seen[row.case_study_id].algorithms.add(row.algorithm_id);
      result[row.case_study_id].algorithms.push(entity);
    }
  }

  for (const row of (personaJunctions.data || []) as any[]) {
    const entity = personaMap.get(row.persona_id);
    if (entity && result[row.case_study_id] && !seen[row.case_study_id].personas.has(row.persona_id)) {
      seen[row.case_study_id].personas.add(row.persona_id);
      result[row.case_study_id].personas.push(entity);
    }
  }

  return result;
}
