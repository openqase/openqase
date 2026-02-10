'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { TablesInsert } from '@/types/supabase';

interface QuantumCompanyFormData extends Omit<TablesInsert<'quantum_companies'>, 'id'> {
  id?: string;
  quantum_focus?: string | null;
  employee_count?: string | null;
}

export async function saveQuantumCompany(values: QuantumCompanyFormData): Promise<TablesInsert<'quantum_companies'>> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('quantum_companies')
      .upsert({
        id: values.id,
        name: values.name,
        slug: values.slug,
        description: values.description,
        main_content: values.main_content,
        company_type: values.company_type,
        founded_year: values.founded_year,
        headquarters: values.headquarters,
        website_url: values.website_url,
        linkedin_url: values.linkedin_url,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving quantum company:", error);
      throw new Error(error.message || "Failed to save quantum company");
    }
    
    revalidatePath('/admin/quantum-companies');
    revalidatePath('/paths/quantum-companies');
    if (data?.slug) {
      revalidatePath(`/paths/quantum-companies/${data.slug}`);
    }
    
    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error saving quantum company:", message);
    throw new Error(message || "Failed to save quantum company");
  }
}

export async function publishQuantumCompany(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('quantum_companies')
      .update({ published: true })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/quantum-companies');
    revalidatePath('/paths/quantum-companies');
    if (data?.slug) {
      revalidatePath(`/paths/quantum-companies/${data.slug}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error publishing quantum company:", message);
    throw new Error(message || "Failed to publish quantum company");
  }
}

export async function unpublishQuantumCompany(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('quantum_companies')
      .update({ published: false })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/quantum-companies');
    revalidatePath('/paths/quantum-companies');
    if (data?.slug) {
      revalidatePath(`/paths/quantum-companies/${data.slug}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error unpublishing quantum company:", message);
    throw new Error(message || "Failed to unpublish quantum company");
  }
}