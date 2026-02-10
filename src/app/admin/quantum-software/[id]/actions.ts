'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { TablesInsert } from '@/types/supabase';

interface QuantumSoftwareFormData extends Omit<TablesInsert<'quantum_software'>, 'id'> {
  id?: string;
  platform_type?: string | null;
}

export async function saveQuantumSoftware(values: QuantumSoftwareFormData): Promise<TablesInsert<'quantum_software'>> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('quantum_software')
      .upsert({
        id: values.id,
        name: values.name,
        slug: values.slug,
        description: values.description,
        main_content: values.main_content,
        vendor: values.vendor,
        programming_languages: values.programming_languages,
        license_type: values.license_type,
        supported_hardware: values.supported_hardware,
        documentation_url: values.documentation_url,
        github_url: values.github_url,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving quantum software:", error);
      throw new Error(error.message || "Failed to save quantum software");
    }
    
    revalidatePath('/admin/quantum-software');
    revalidatePath('/paths/quantum-software');
    if (data?.slug) {
      revalidatePath(`/paths/quantum-software/${data.slug}`);
    }
    
    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error saving quantum software:", message);
    throw new Error(message || "Failed to save quantum software");
  }
}

export async function publishQuantumSoftware(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('quantum_software')
      .update({ published: true })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/quantum-software');
    revalidatePath('/paths/quantum-software');
    if (data?.slug) {
      revalidatePath(`/paths/quantum-software/${data.slug}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error publishing quantum software:", message);
    throw new Error(message || "Failed to publish quantum software");
  }
}

export async function unpublishQuantumSoftware(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('quantum_software')
      .update({ published: false })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/quantum-software');
    revalidatePath('/paths/quantum-software');
    if (data?.slug) {
      revalidatePath(`/paths/quantum-software/${data.slug}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error unpublishing quantum software:", message);
    throw new Error(message || "Failed to unpublish quantum software");
  }
}