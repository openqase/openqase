'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function saveQuantumHardware(values: any): Promise<any> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('quantum_hardware')
      .upsert({
        id: values.id,
        name: values.name,
        slug: values.slug,
        description: values.description,
        main_content: values.main_content,
        vendor: values.vendor,
        technology_type: values.technology_type,
        qubit_count: values.qubit_count,
        connectivity: values.connectivity,
        gate_fidelity: values.gate_fidelity,
        coherence_time: values.coherence_time,
        availability: values.availability,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving quantum hardware:", error);
      throw new Error(error.message || "Failed to save quantum hardware");
    }
    
    revalidatePath('/admin/quantum-hardware');
    revalidatePath('/paths/quantum-hardware');
    if (data?.slug) {
      revalidatePath(`/paths/quantum-hardware/${data.slug}`);
    }
    
    return data;
  } catch (error: any) {
    console.error("Error saving quantum hardware:", error);
    throw new Error(error.message || "Failed to save quantum hardware");
  }
}

export async function publishQuantumHardware(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('quantum_hardware')
      .update({ published: true })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/quantum-hardware');
    revalidatePath('/paths/quantum-hardware');
    if (data?.slug) {
      revalidatePath(`/paths/quantum-hardware/${data.slug}`);
    }
  } catch (error: any) {
    console.error("Error publishing quantum hardware:", error);
    throw new Error(error.message || "Failed to publish quantum hardware");
  }
}

export async function unpublishQuantumHardware(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('quantum_hardware')
      .update({ published: false })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/quantum-hardware');
    revalidatePath('/paths/quantum-hardware');
    if (data?.slug) {
      revalidatePath(`/paths/quantum-hardware/${data.slug}`);
    }
  } catch (error: any) {
    console.error("Error unpublishing quantum hardware:", error);
    throw new Error(error.message || "Failed to unpublish quantum hardware");
  }
}