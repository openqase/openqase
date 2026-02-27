'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { Database, TablesInsert } from '@/types/supabase';
import { z } from 'zod';

const personaSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(500),
  slug: z.string().min(1).max(500),
  description: z.string().max(5000).nullable().optional(),
  expertise: z.string().max(5000).nullable().optional(),
  main_content: z.string().max(50000).nullable().optional(),
  recommended_reading: z.string().max(10000).nullable().optional(),
  published: z.boolean().optional(),
  industry: z.array(z.string().uuid()).optional(),
});

// Define a type for the expected structure of the returned persona data
type PersonaData = Database['public']['Tables']['personas']['Row'] | null;

interface PersonaFormData extends Omit<TablesInsert<'personas'>, 'id'> {
  id?: string;
  industry?: string[];
}

export async function savePersona(values: PersonaFormData): Promise<PersonaData> {
  try {
    const parsed = personaSchema.safeParse(values);
    if (!parsed.success) {
      throw new Error(`Validation failed: ${parsed.error.issues.map((e: { message: string }) => e.message).join(', ')}`);
    }

    const supabase = createServiceRoleSupabaseClient();
    
    // Store the original industry array
    const industryIds = values.industry || [];
    
    // Remove industry from values to avoid storing it directly in the persona record
    const personaValues = { ...values };
    delete personaValues.industry;
    
    // Upsert the persona
    const { data, error } = await supabase
      .from('personas')
      .upsert({
        id: personaValues.id,
        name: personaValues.name,
        slug: personaValues.slug,
        description: personaValues.description,
        expertise: personaValues.expertise,
        main_content: personaValues.main_content,
        recommended_reading: personaValues.recommended_reading,
        published: personaValues.published,
      })
      .select()
      .single<PersonaData>();
    
    if (error) {
      console.error("Error saving persona:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw new Error(error.message || "Failed to save persona");
    }
    
    if (!data?.id) {
      throw new Error("Failed to save persona - no ID returned from database");
    }

    // Handle industry relationships (delete and re-create)
    const { error: deleteError } = await supabase
      .from('persona_industry_relations')
      .delete()
      .eq('persona_id', data.id);

    if (deleteError) {
      console.error("Error deleting industry relationships:", deleteError);
      throw new Error(deleteError.message || "Failed to delete industry relationships");
    }

    if (industryIds.length > 0 && data && data.id) {
      for (const industryId of industryIds) {
        const { error: insertError } = await supabase
          .from('persona_industry_relations')
          .insert({ persona_id: data.id, industry_id: industryId });

        if (insertError) {
          console.error("Error inserting industry relationship:", insertError);
          throw new Error(insertError.message || "Failed to insert industry relationship");
        }
      }
    }
    
    revalidatePath('/admin/personas');
    revalidatePath('/paths/persona');
    if (data?.slug) {
      revalidatePath(`/paths/persona/${data.slug}`);
    }
    
    // Return the saved data
    return data;
  } catch (error: unknown) {
    console.error("Error saving persona:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save persona";
    throw new Error(errorMessage);
  }
}

export async function publishPersona(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('personas')
      .update({ published: true })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/personas');
    revalidatePath('/paths/persona');
    if (data?.slug) {
      revalidatePath(`/paths/persona/${data.slug}`);
    }
  } catch (error: unknown) {
    console.error("Error publishing persona:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to publish persona";
    throw new Error(errorMessage);
  }
}

export async function unpublishPersona(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('personas')
      .update({ published: false })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/personas');
    revalidatePath('/paths/persona');
    if (data?.slug) {
      revalidatePath(`/paths/persona/${data.slug}`);
    }
  } catch (error: unknown) {
    console.error("Error unpublishing persona:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to unpublish persona";
    throw new Error(errorMessage);
  }
}