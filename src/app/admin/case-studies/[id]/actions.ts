'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { TablesInsert } from '@/types/supabase';
import { z } from 'zod';

const caseStudyActionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(500),
  description: z.string().max(5000).nullable().optional(),
  main_content: z.string().max(50000).nullable().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  academic_references: z.string().max(10000).nullable().optional(),
  resource_links: z.string().max(10000).nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  industries: z.array(z.string().uuid()).optional(),
  algorithms: z.array(z.string().uuid()).optional(),
  personas: z.array(z.string().uuid()).optional(),
  quantum_software: z.array(z.string().uuid()).optional(),
  quantum_hardware: z.array(z.string().uuid()).optional(),
  quantum_companies: z.array(z.string().uuid()).optional(),
  partner_companies: z.array(z.string().uuid()).optional(),
});

interface CaseStudyFormData extends Omit<TablesInsert<'case_studies'>, 'id'> {
  id?: string;
  industries?: string[];
  algorithms?: string[];
  personas?: string[];
  quantum_software?: string[];
  quantum_hardware?: string[];
  quantum_companies?: string[];
  partner_companies?: string[];
}

export async function saveCaseStudy(values: CaseStudyFormData): Promise<{ caseStudy?: TablesInsert<'case_studies'>; success: boolean; error?: string }> {
  const startTime = Date.now();

  try {
    const parsed = caseStudyActionSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: `Validation failed: ${parsed.error.issues.map((e: { message: string }) => e.message).join(', ')}`,
      };
    }

    const supabase = createServiceRoleSupabaseClient();


    // Upsert the main case study data
    const upsertStartTime = Date.now();
    
    const upsertData: TablesInsert<'case_studies'> = {
      id: values.id,
      title: values.title,
      slug: values.slug,
      description: values.description,
      main_content: values.main_content,
      // Legacy fields removed - entities now managed separately
      // partner_companies, quantum_companies, quantum_hardware, quantum_software
      published: values.published,
      featured: values.featured || false,
      academic_references: values.academic_references || null,
      resource_links: values.resource_links || null,
      year: values.year || new Date().getFullYear(),
    };

    const { data, error } = await supabase
      .from('case_studies')
      .upsert(upsertData)
      .select()
      .single();

    // const upsertTime = Date.now() - upsertStartTime;

    if (error || !data) {
      console.error("[CASE_STUDY_SAVE] Error upserting case study:", {
        error,
        upsertData: JSON.stringify(upsertData, null, 2)
      });
      throw new Error(error?.message || "Failed to save case study data.");
    }


    // Delete and recreate relationships
    const relationshipStartTime = Date.now();

    // Step 1: Delete all existing relationships in parallel
    const [
      industryDelResult, 
      algorithmDelResult, 
      personaDelResult,
      quantumSoftwareDelResult,
      quantumHardwareDelResult,
      quantumCompanyDelResult,
      partnerCompanyDelResult
    ] = await Promise.all([
      supabase
        .from('case_study_industry_relations')
        .delete()
        .eq('case_study_id', data.id),
      supabase
        .from('algorithm_case_study_relations')
        .delete()
        .eq('case_study_id', data.id),
      supabase
        .from('case_study_persona_relations')
        .delete()
        .eq('case_study_id', data.id),
      supabase
        .from('case_study_quantum_software_relations')
        .delete()
        .eq('case_study_id', data.id),
      supabase
        .from('case_study_quantum_hardware_relations')
        .delete()
        .eq('case_study_id', data.id),
      supabase
        .from('case_study_quantum_company_relations')
        .delete()
        .eq('case_study_id', data.id),
      supabase
        .from('case_study_partner_company_relations')
        .delete()
        .eq('case_study_id', data.id)
    ]);

    // Check for delete errors
    if (industryDelResult.error) {
      console.error('[CASE_STUDY_SAVE] Error deleting industry relationships:', industryDelResult.error);
    }
    if (algorithmDelResult.error) {
      console.error('[CASE_STUDY_SAVE] Error deleting algorithm relationships:', algorithmDelResult.error);
    }
    if (personaDelResult.error) {
      console.error('[CASE_STUDY_SAVE] Error deleting persona relationships:', personaDelResult.error);
    }
    if (quantumSoftwareDelResult.error) {
      console.error('[CASE_STUDY_SAVE] Error deleting quantum software relationships:', quantumSoftwareDelResult.error);
    }
    if (quantumHardwareDelResult.error) {
      console.error('[CASE_STUDY_SAVE] Error deleting quantum hardware relationships:', quantumHardwareDelResult.error);
    }
    if (quantumCompanyDelResult.error) {
      console.error('[CASE_STUDY_SAVE] Error deleting quantum company relationships:', quantumCompanyDelResult.error);
    }
    if (partnerCompanyDelResult.error) {
      console.error('[CASE_STUDY_SAVE] Error deleting partner company relationships:', partnerCompanyDelResult.error);
    }


    // Step 2: Prepare new relationships from form data

    let industryRelations: TablesInsert<'case_study_industry_relations'>[] = [];
    let algorithmRelations: TablesInsert<'algorithm_case_study_relations'>[] = [];
    let personaRelations: TablesInsert<'case_study_persona_relations'>[] = [];

    // Industries - only process if array has items
    if (values.industries && Array.isArray(values.industries) && values.industries.length > 0) {
      industryRelations = values.industries.map((industryId: string) => ({
        case_study_id: data.id,
        industry_id: industryId
      }));
    }

    // Algorithms - only process if array has items
    if (values.algorithms && Array.isArray(values.algorithms) && values.algorithms.length > 0) {
      algorithmRelations = values.algorithms.map((algorithmId: string) => ({
        case_study_id: data.id,
        algorithm_id: algorithmId
      }));
    }

    // Personas - only process if array has items
    if (values.personas && Array.isArray(values.personas) && values.personas.length > 0) {
      personaRelations = values.personas.map((personaId: string) => ({
        case_study_id: data.id,
        persona_id: personaId
      }));
    }


    // Step 3: Insert all new relationships in parallel
    
    const insertPromises = [];

    if (industryRelations.length > 0) {
      insertPromises.push(
        supabase
          .from('case_study_industry_relations')
          .insert(industryRelations)
      );
    }

    if (algorithmRelations.length > 0) {
      insertPromises.push(
        supabase
          .from('algorithm_case_study_relations')
          .insert(algorithmRelations)
      );
    }

    if (personaRelations.length > 0) {
      insertPromises.push(
        supabase
          .from('case_study_persona_relations')
          .insert(personaRelations)
      );
    }

    // Add quantum entity relationships
    if (values.quantum_software && values.quantum_software.length > 0) {
      const quantumSoftwareRelations = values.quantum_software.map((softwareId: string) => ({
        case_study_id: data.id,
        quantum_software_id: softwareId
      }));
      insertPromises.push(
        supabase
          .from('case_study_quantum_software_relations')
          .insert(quantumSoftwareRelations)
      );
    }
    
    if (values.quantum_hardware && values.quantum_hardware.length > 0) {
      const quantumHardwareRelations = values.quantum_hardware.map((hardwareId: string) => ({
        case_study_id: data.id,
        quantum_hardware_id: hardwareId
      }));
      insertPromises.push(
        supabase
          .from('case_study_quantum_hardware_relations')
          .insert(quantumHardwareRelations)
      );
    }
    
    if (values.quantum_companies && values.quantum_companies.length > 0) {
      const quantumCompanyRelations = values.quantum_companies.map((companyId: string) => ({
        case_study_id: data.id,
        quantum_company_id: companyId
      }));
      insertPromises.push(
        supabase
          .from('case_study_quantum_company_relations')
          .insert(quantumCompanyRelations)
      );
    }
    
    if (values.partner_companies && values.partner_companies.length > 0) {
      const partnerCompanyRelations = values.partner_companies.map((companyId: string) => ({
        case_study_id: data.id,
        partner_company_id: companyId
      }));
      insertPromises.push(
        supabase
          .from('case_study_partner_company_relations')
          .insert(partnerCompanyRelations)
      );
    }

    // Execute all inserts in parallel
    if (insertPromises.length > 0) {
      const insertResults = await Promise.all(insertPromises);
      
      // Check for insert errors
      insertResults.forEach((result, index) => {
        if (result.error) {
          const relationTypes = [
            'industry', 'algorithm', 'persona',
            'quantum_software', 'quantum_hardware', 'quantum_company', 'partner_company'
          ];
          const type = relationTypes[index] || 'unknown';
          console.error(`[CASE_STUDY_SAVE] Error inserting ${type} relations:`, result.error);
        }
      });
    } else {
    }

    // const relationshipTime = Date.now() - relationshipStartTime;

    // Revalidate the admin cache
    revalidatePath('/admin/case-studies');
    
    // Revalidate the case study page itself
    if (data && data.slug) {
      revalidatePath(`/case-study/${data.slug}`);
    }
    
    // Revalidate homepage if featured status might have changed
    if ('featured' in values) {
      revalidatePath('/');
    }

    const totalTime = Date.now() - startTime;

    return {
      caseStudy: data,
      success: true
    };

  } catch (error: unknown) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Failed to save case study";
    console.error(`[CASE_STUDY_SAVE] Save operation failed after ${totalTime}ms:`, {
      error,
      message: errorMessage,
      caseStudyId: values.id,
      caseStudyTitle: values.title
    });
    
    return {
      error: errorMessage,
      success: false
    };
  }
}

export async function publishCaseStudy(id: string, slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { error } = await supabase
      .from('case_studies')
      .update({ 
        published: true,
        published_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    // Revalidate paths
    revalidatePath('/admin/case-studies');
    revalidatePath(`/case-study/${slug}`); // Fixed: singular case-study
    revalidatePath('/'); // Homepage shows featured case studies
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Error publishing case study:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to publish case study";
    return { 
      error: errorMessage,
      success: false
    };
  }
}

export async function unpublishCaseStudy(id: string, slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { error } = await supabase
      .from('case_studies')
      .update({ 
        published: false,
        published_at: null
      })
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    // Revalidate paths
    revalidatePath('/admin/case-studies');
    revalidatePath(`/case-study/${slug}`); // Fixed: singular case-study
    revalidatePath('/'); // Homepage shows featured case studies
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Error unpublishing case study:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to unpublish case study";
    return { 
      error: errorMessage,
      success: false
    };
  }
}