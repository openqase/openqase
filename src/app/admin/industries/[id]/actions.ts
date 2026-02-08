'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { TablesInsert } from '@/types/supabase';

interface IndustryFormData extends Omit<TablesInsert<'industries'>, 'id'> {
  id?: string;
}

export async function saveIndustry(values: IndustryFormData): Promise<TablesInsert<'industries'>> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('industries')
      .upsert({
        id: values.id,
        name: values.name,
        slug: values.slug,
        description: values.description,
        main_content: values.main_content,
        published: values.published,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving industry:", error);
      throw new Error(error.message || "Failed to save industry");
    }
    
    revalidatePath('/admin/industries');
    revalidatePath('/paths/industry');
    if (data?.slug) {
      revalidatePath(`/paths/industry/${data.slug}`);
    }

    // Return the saved data
    return data;
  } catch (error: unknown) {
    console.error("Error saving industry:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save industry";
    throw new Error(errorMessage);
  }
}

export async function publishIndustry(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('industries')
      .update({ published: true })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/industries');
    revalidatePath('/paths/industry');
    if (data?.slug) {
      revalidatePath(`/paths/industry/${data.slug}`);
    }
  } catch (error: unknown) {
    console.error("Error publishing industry:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to publish industry";
    throw new Error(errorMessage);
  }
}

export async function unpublishIndustry(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('industries')
      .update({ published: false })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/industries');
    revalidatePath('/paths/industry');
    if (data?.slug) {
      revalidatePath(`/paths/industry/${data.slug}`);
    }
  } catch (error: unknown) {
    console.error("Error unpublishing industry:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to unpublish industry";
    throw new Error(errorMessage);
  }
}