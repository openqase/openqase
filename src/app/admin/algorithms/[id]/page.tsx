import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { Database } from '@/types/supabase';
import { notFound } from 'next/navigation';
import { AlgorithmForm } from './client';

type Algorithm = Database['public']['Tables']['algorithms']['Row'];

// Define more specific types for the query results
type CaseStudyListItem = {
  id: string;
  title: string;
  slug: string;
};

type IndustryListItem = {
  id: string;
  name: string;
  slug: string;
};

type PersonaListItem = {
  id: string;
  name: string;
  slug: string;
};

interface AlgorithmPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAlgorithmPage({ params }: AlgorithmPageProps) {
  const resolvedParams = await params;
  const supabase = createServiceRoleSupabaseClient();
  const isNew = resolvedParams.id === 'new';

  // Fetch algorithm if editing
  let algorithm: Algorithm | null = null;
  if (!isNew) {
    const { data } = await supabase
      .from('algorithms')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();
    algorithm = data;
  }

  // Fetch related data for relationships using service client to bypass RLS
  const { data: caseStudies } = await supabase
    .from('case_studies')
    .select('id, title, slug')
    .is('deleted_at', null)
    .order('title') as { data: CaseStudyListItem[] | null };

  const { data: industries } = await supabase
    .from('industries')
    .select('id, name, slug')
    .is('deleted_at', null)
    .order('name') as { data: IndustryListItem[] | null };

  const { data: personas } = await supabase
    .from('personas')
    .select('id, name, slug')
    .is('deleted_at', null)
    .order('name') as { data: PersonaListItem[] | null };

  let relatedCaseStudyIds: string[] = [];
  let relatedIndustryIds: string[] = [];
  let relatedPersonaIds: string[] = [];

  if (!isNew && algorithm) {
    // Fetch related case study IDs
    const { data: csRelations } = await supabase
      .from('algorithm_case_study_relations')
      .select('case_study_id')
      .eq('algorithm_id', algorithm.id);
    if (csRelations) {
      relatedCaseStudyIds = csRelations.map((rel) => rel.case_study_id).filter((id): id is string => Boolean(id));
    }

    // Fetch related industry IDs
    const { data: indRelations } = await supabase
      .from('algorithm_industry_relations')
      .select('industry_id')
      .eq('algorithm_id', algorithm.id);
    if (indRelations) {
      relatedIndustryIds = indRelations.map((rel) => rel.industry_id).filter((id): id is string => Boolean(id));
    }

    // Fetch related persona IDs. The form sends these back on save and
    // saveAlgorithm replaces the persona links with them, so loading [] here
    // deleted every persona link whenever an algorithm was saved.
    const { data: personaRelations } = await supabase
      .from('persona_algorithm_relations')
      .select('persona_id')
      .eq('algorithm_id', algorithm.id);
    if (personaRelations) {
      relatedPersonaIds = personaRelations.map((rel) => rel.persona_id).filter((id): id is string => Boolean(id));
    }
  }

  if (!isNew && !algorithm) {
    notFound();
  }

  // This means at this point, if !isNew is true, then algorithm must be defined
  // Use a more explicit type annotation to help TypeScript understand our intent
  interface AlgorithmWithRelations extends Algorithm {
    related_case_studies?: string[];
    related_industries?: string[];
    related_personas?: string[];
  }

  const algorithmData: AlgorithmWithRelations = !isNew && algorithm ? algorithm : {} as Algorithm;

  if (!isNew) {
    algorithmData.related_case_studies = relatedCaseStudyIds;
    algorithmData.related_industries = relatedIndustryIds;
    algorithmData.related_personas = relatedPersonaIds;
  }

  return (
    <AlgorithmForm
      algorithm={algorithmData}
      caseStudies={caseStudies || []}
      industries={industries || []}
      personas={personas || []}
      isNew={isNew}
    />
  );
}