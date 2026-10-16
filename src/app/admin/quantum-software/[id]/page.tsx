import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { Database } from '@/types/supabase';
import { notFound } from 'next/navigation';
import { QuantumSoftwareForm } from './client';

type QuantumSoftware = Database['public']['Tables']['quantum_software']['Row'];

type CaseStudyListItem = {
  id: string;
  title: string;
  slug: string;
};

interface QuantumSoftwarePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditQuantumSoftwarePage({ params }: QuantumSoftwarePageProps) {
  const resolvedParams = await params;
  const supabase = createServiceRoleSupabaseClient();
  const isNew = resolvedParams.id === 'new';

  // Fetch quantum software if editing
  let quantumSoftware: QuantumSoftware | null = null;
  if (!isNew) {
    const { data } = await supabase
      .from('quantum_software')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();
    quantumSoftware = data;
  }

  // Fetch related data for relationships
  const { data: caseStudies } = await supabase
    .from('case_studies')
    .select('id, title, slug')
    .is('deleted_at', null)
    .order('title') as { data: CaseStudyListItem[] | null };

  let relatedCaseStudyIds: string[] = [];

  if (!isNew && quantumSoftware) {
    // Fetch related case study IDs
    const { data: csRelations } = await supabase
      .from('case_study_quantum_software_relations')
      .select('case_study_id')
      .eq('quantum_software_id', quantumSoftware.id);
    if (csRelations) {
      relatedCaseStudyIds = csRelations.map((rel) => rel.case_study_id).filter((id): id is string => Boolean(id));
    }
  }

  if (!isNew && !quantumSoftware) {
    notFound();
  }

  interface QuantumSoftwareWithRelations extends QuantumSoftware {
    related_case_studies?: string[];
  }

  const softwareData: QuantumSoftwareWithRelations = !isNew && quantumSoftware ? quantumSoftware : {} as QuantumSoftware;

  if (!isNew) {
    softwareData.related_case_studies = relatedCaseStudyIds;
  }

  return (
    <QuantumSoftwareForm
      quantumSoftware={softwareData}
      caseStudies={caseStudies || []}
      isNew={isNew}
    />
  );
}