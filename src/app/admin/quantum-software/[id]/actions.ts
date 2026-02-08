'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function saveQuantumSoftware(values: any): Promise<any> {
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
        platform_type: values.platform_type,
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
  } catch (error: any) {
    console.error("Error saving quantum software:", error);
    throw new Error(error.message || "Failed to save quantum software");
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
  } catch (error: any) {
    console.error("Error publishing quantum software:", error);
    throw new Error(error.message || "Failed to publish quantum software");
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
  } catch (error: any) {
    console.error("Error unpublishing quantum software:", error);
    throw new Error(error.message || "Failed to unpublish quantum software");
  }
}