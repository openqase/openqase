'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { fromTable } from '@/lib/supabase-untyped';
import { revalidatePath } from 'next/cache';

export async function saveAlgorithm(values: any): Promise<any> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('algorithms')
      .upsert({
        id: values.id,
        name: values.name,
        slug: values.slug,
        description: values.description,
        main_content: values.main_content,
        use_cases: values.use_cases,
        published: values.published,
        steps: values.steps || '',
        academic_references: values.academic_references || '',
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving algorithm:", error);
      throw new Error(error.message || "Failed to save algorithm");
    }
    
    // Handle case study relationships (delete and re-create)
    const caseStudyError = await fromTable(supabase, 'algorithm_case_study_relations')
      .delete()
      .eq('algorithm_id', data?.id);

    if (caseStudyError && caseStudyError.error) {
        console.error("Error deleting case study relationships:", caseStudyError.error);
        throw new Error(caseStudyError.error.message || "Failed to delete case study relationships");
    }

    // If there are related case studies
    if (values.related_case_studies && values.related_case_studies.length > 0) {
        // Insert relationships with IDs
        for (const caseStudyId of values.related_case_studies) {
            const insertError = await fromTable(supabase, 'algorithm_case_study_relations')
                .insert({ algorithm_id: data?.id, case_study_id: caseStudyId });

            if (insertError && insertError.error) {
                console.error("Error inserting case study relationship:", insertError.error);
                throw new Error(insertError.error.message || "Failed to insert case study relationship");
            }
        }
    }

    // Handle industry relationships (delete and re-create)
    const industryError = await fromTable(supabase, 'algorithm_industry_relations')
      .delete()
      .eq('algorithm_id', data?.id);

    if (industryError && industryError.error) {
        console.error("Error deleting industry relationships:", industryError.error);
        throw new Error(industryError.error.message || "Failed to delete industry relationships");
    }

    // If there are related industries
    if (values.related_industries && values.related_industries.length > 0) {
        // Insert relationships with IDs
        for (const industryId of values.related_industries) {
            const insertError = await fromTable(supabase, 'algorithm_industry_relations')
                .insert({ algorithm_id: data?.id, industry_id: industryId });

            if (insertError && insertError.error) {
                console.error("Error inserting industry relationship:", insertError.error);
                throw new Error(insertError.error.message || "Failed to insert industry relationship");
            }
        }
    }

    // Handle persona relationships (delete and re-create)
    const personaError = await fromTable(supabase, 'persona_algorithm_relations')
      .delete()
      .eq('algorithm_id', data?.id);

    if (personaError && personaError.error) {
        console.error("Error deleting persona relationships:", personaError.error);
        throw new Error(personaError.error.message || "Failed to delete persona relationships");
    }

    // If there are related personas
    if (values.related_personas && values.related_personas.length > 0) {
        // Insert relationships with IDs
        for (const personaId of values.related_personas) {
            const insertError = await fromTable(supabase, 'persona_algorithm_relations')
                .insert({ algorithm_id: data?.id, persona_id: personaId });

            if (insertError && insertError.error) {
                console.error("Error inserting persona relationship:", insertError.error);
                throw new Error(insertError.error.message || "Failed to insert persona relationship");
            }
        }
    }
    
    revalidatePath('/admin/algorithms');
    revalidatePath('/paths/algorithm');
    if (data?.slug) {
      revalidatePath(`/paths/algorithm/${data.slug}`);
    }
    
    // Return the saved data
    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error saving algorithm:", message);
    throw new Error(message || "Failed to save algorithm");
  }
}

export async function publishAlgorithm(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('algorithms')
      .update({ published: true })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/algorithms');
    revalidatePath('/paths/algorithm');
    if (data?.slug) {
      revalidatePath(`/paths/algorithm/${data.slug}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error publishing algorithm:", message);
    throw new Error(message || "Failed to publish algorithm");
  }
}

export async function unpublishAlgorithm(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('algorithms')
      .update({ published: false })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/algorithms');
    revalidatePath('/paths/algorithm');
    if (data?.slug) {
      revalidatePath(`/paths/algorithm/${data.slug}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error unpublishing algorithm:", message);
    throw new Error(message || "Failed to unpublish algorithm");
  }
}