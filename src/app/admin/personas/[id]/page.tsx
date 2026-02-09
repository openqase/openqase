import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { fromTable } from '@/lib/supabase-untyped';
import { Database } from '@/types/supabase';
import { notFound } from 'next/navigation';
import { PersonaForm } from './client';

type Persona = Database['public']['Tables']['personas']['Row'];
type Industry = Database['public']['Tables']['industries']['Row'];

interface PersonaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPersonaPage({ params }: PersonaPageProps) {
  const resolvedParams = await params;
  const supabase = createServiceRoleSupabaseClient();
  const isNew = resolvedParams.id === 'new';

  // Fetch persona if editing
  const { data: persona } = !isNew
    ? await supabase
        .from('personas')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()
    : { data: null };

  // Fetch industries for relationship selection
  const { data: industries } = await supabase
    .from('industries')
    .select('id, name, slug')
    .order('name');
    
  // Fetch industry relationships if editing
  let industryIds: string[] = [];
  
  if (!isNew && persona) {
    // Fetch industry relationships from the junction table
    const { data: industryRelations } = await fromTable(supabase, 'persona_industry_relations')
      .select('industry_id')
      .eq('persona_id', persona.id);
    
    if (industryRelations) {
      industryIds = industryRelations.map((relation: Record<string, string>) => relation.industry_id);
    }
  }

  if (!isNew && !persona) {
    notFound();
  }

  // This means at this point, if !isNew is true, then persona must be defined
  // Use a more explicit type annotation to help TypeScript understand our intent
  let personaData: Record<string, unknown> = !isNew ? persona as Persona : {} as Persona;
  
  // Add the industry IDs to the persona data
  if (!isNew) {
    personaData = {
      ...personaData,
      industry: industryIds
    };
  }

  return (
    <PersonaForm
      persona={personaData}
      industries={industries || []}
      isNew={isNew}
    />
  );
}