'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { TablesInsert } from '@/types/supabase';

interface PartnerCompanyFormData extends Omit<TablesInsert<'partner_companies'>, 'id'> {
  id?: string;
  quantum_use_cases?: string | null;
}

export async function savePartnerCompany(values: PartnerCompanyFormData): Promise<TablesInsert<'partner_companies'>> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('partner_companies')
      .upsert({
        id: values.id,
        name: values.name,
        slug: values.slug,
        description: values.description,
        main_content: values.main_content,
        industry: values.industry,
        company_size: values.company_size,
        headquarters: values.headquarters,
        partnership_type: values.partnership_type,
        quantum_initiatives: values.quantum_use_cases,
        website_url: values.website_url,
        linkedin_url: values.linkedin_url,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving partner company:", error);
      throw new Error(error.message || "Failed to save partner company");
    }
    
    revalidatePath('/admin/partner-companies');
    revalidatePath('/paths/partner-companies');
    if (data?.slug) {
      revalidatePath(`/paths/partner-companies/${data.slug}`);
    }
    
    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error saving partner company:", message);
    throw new Error(message || "Failed to save partner company");
  }
}

export async function publishPartnerCompany(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('partner_companies')
      .update({ published: true })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/partner-companies');
    revalidatePath('/paths/partner-companies');
    if (data?.slug) {
      revalidatePath(`/paths/partner-companies/${data.slug}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error publishing partner company:", message);
    throw new Error(message || "Failed to publish partner company");
  }
}

export async function unpublishPartnerCompany(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('partner_companies')
      .update({ published: false })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/partner-companies');
    revalidatePath('/paths/partner-companies');
    if (data?.slug) {
      revalidatePath(`/paths/partner-companies/${data.slug}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error unpublishing partner company:", message);
    throw new Error(message || "Failed to unpublish partner company");
  }
}