import { NextRequest, NextResponse } from 'next/server';
import {
  fetchContentItems,
  fetchContentItem,
  saveContentItem,
  deleteContentItem,
  updatePublishedStatus,
  RELATIONSHIP_CONFIGS,
  ContentType,
  RelationshipConfig
} from '@/utils/content-management';
import { createServiceRoleSupabaseClient } from '@/lib/supabase';
import { fromTable } from '@/lib/supabase-untyped';
import { caseStudySchema, formatValidationErrors } from '@/lib/validation/schemas';
import type { Database } from '@/types/supabase';

// Define the content type for this API route
const CONTENT_TYPE: ContentType = 'case_studies';

// Extended case study type with relationship arrays
type CaseStudyRow = Database['public']['Tables']['case_studies']['Row'];
type CaseStudyWithRelations = CaseStudyRow & {
  related_industries?: { id: string; slug: string; name: string }[];
  related_algorithms?: { id: string; slug: string; name: string }[];
  related_personas?: { id: string; slug: string; name: string }[];
};

// Define relationship configurations for case studies
const RELATIONSHIP_CONFIG: Record<string, RelationshipConfig> = {
  algorithms: {
    junctionTable: 'algorithm_case_study_relations',
    contentIdField: 'case_study_id',
    relatedIdField: 'algorithm_id',
    relatedTable: 'algorithms'
  },
  industries: {
    junctionTable: 'case_study_industry_relations',
    contentIdField: 'case_study_id',
    relatedIdField: 'industry_id',
    relatedTable: 'industries'
  },
  personas: {
    junctionTable: 'case_study_persona_relations',
    contentIdField: 'case_study_id',
    relatedIdField: 'persona_id',
    relatedTable: 'personas'
  }
};

/**
 * GET handler for fetching case studies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    // Security fix: Never expose unpublished content via public API
    const includeUnpublished = false;
    
    // Handle single case study request
    if (slug) {
      const { data, error } = await fetchContentItem({
        contentType: CONTENT_TYPE,
        identifier: slug,
        identifierType: 'slug',
        includeUnpublished,
        includeRelationships: Object.values(RELATIONSHIP_CONFIG).map(config => ({
          relationshipConfig: config,
          fields: 'id, slug, name, title'
        }))
      });
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Case study not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(data);
    }
    
    // Handle list request
    const filters: Record<string, any> = {};
    
    // Add custom filters based on search params
    if (searchParams.has('algorithm')) {
      const algorithm = searchParams.get('algorithm');
      if (algorithm) {
        
        // Get the algorithm ID first
        const serviceClient = await createServiceRoleSupabaseClient();
        const { data: algorithmData, error: algorithmError } = await serviceClient
          .from('algorithms')
          .select('id, name')
          .eq('name', algorithm)
          .single();
        
        if (algorithmError || !algorithmData) {
          console.error('Error finding algorithm:', algorithmError);
          return NextResponse.json(
            { error: 'Algorithm not found' },
            { status: 404 }
          );
        }
        
        
        // Get case studies related to this algorithm using the junction table
        const { data: relations, error: relationsError } = await serviceClient
          .from('algorithm_case_study_relations')
          .select('case_study_id')
          .eq('algorithm_id', algorithmData.id);
          
        if (relationsError) {
          console.error('Error finding case study relations:', relationsError);
          return NextResponse.json(
            { error: 'Error fetching case studies' },
            { status: 500 }
          );
        }
        
        if (relations && relations.length > 0) {
          const caseStudyIds = relations.map((relation) => relation.case_study_id);

          // If we already have an ID filter, we need to find the intersection
          if (filters.id) {
            filters.id = filters.id.filter((id: string) => caseStudyIds.includes(id));
          } else {
            filters.id = caseStudyIds;
          }

          // If the intersection is empty, return empty result
          if (filters.id.length === 0) {
            return NextResponse.json({
              items: [],
              pagination: {
                page,
                pageSize,
                totalItems: 0,
                totalPages: 0
              }
            });
          }
        } else {
          // No matching case studies, return empty result
          return NextResponse.json({
            items: [],
            pagination: {
              page,
              pageSize,
              totalItems: 0,
              totalPages: 0
            }
          });
        }
      }
    }
    
    if (searchParams.has('industry')) {
      const industry = searchParams.get('industry');
      if (industry) {
        
        // Get the industry ID first
        const serviceClient = await createServiceRoleSupabaseClient();
        const { data: industryData, error: industryError } = await serviceClient
          .from('industries')
          .select('id, name')
          .eq('name', industry)
          .single();
        
        if (industryError || !industryData) {
          console.error('Error finding industry:', industryError);
          return NextResponse.json(
            { error: 'Industry not found' },
            { status: 404 }
          );
        }
        
        
        // Get case studies related to this industry using the junction table
        const { data: relations, error: relationsError } = await serviceClient
          .from('case_study_industry_relations')
          .select('case_study_id')
          .eq('industry_id', industryData.id);

        if (relationsError) {
          console.error('Error finding case study relations:', relationsError);
          return NextResponse.json(
            { error: 'Error fetching case studies' },
            { status: 500 }
          );
        }

        if (relations && relations.length > 0) {
          const caseStudyIds = relations.map((relation) => relation.case_study_id);
          filters.id = caseStudyIds;
        } else {
          // No matching case studies, return empty result
          return NextResponse.json({
            items: [],
            pagination: {
              page,
              pageSize,
              totalItems: 0,
              totalPages: 0
            }
          });
        }
      }
    }
    
    if (searchParams.has('persona')) {
      const persona = searchParams.get('persona');
      if (persona) {
        
        // Get the persona ID first
        const serviceClient = await createServiceRoleSupabaseClient();
        const { data: personaData, error: personaError } = await serviceClient
          .from('personas')
          .select('id, name')
          .eq('name', persona)
          .single();
        
        if (personaError || !personaData) {
          console.error('Error finding persona:', personaError);
          return NextResponse.json(
            { error: 'Persona not found' },
            { status: 404 }
          );
        }
        
        
        // Get case studies related to this persona using the junction table
        const { data: relations, error: relationsError } = await serviceClient
          .from('case_study_persona_relations')
          .select('case_study_id')
          .eq('persona_id', personaData.id);

        if (relationsError) {
          console.error('Error finding case study relations:', relationsError);
          return NextResponse.json(
            { error: 'Error fetching case studies' },
            { status: 500 }
          );
        }

        if (relations && relations.length > 0) {
          const caseStudyIds = relations.map((relation) => relation.case_study_id);
          
          // If we already have an ID filter, we need to find the intersection
          if (filters.id) {
            filters.id = filters.id.filter((id: string) => caseStudyIds.includes(id));
          } else {
            filters.id = caseStudyIds;
          }
          
          // If the intersection is empty, return empty result
          if (filters.id.length === 0) {
            return NextResponse.json({
              items: [],
              pagination: {
                page,
                pageSize,
                totalItems: 0,
                totalPages: 0
              }
            });
          }
        } else {
          // No matching case studies, return empty result
          return NextResponse.json({
            items: [],
            pagination: {
              page,
              pageSize,
              totalItems: 0,
              totalPages: 0
            }
          });
        }
      }
    }
    

    // Add new admin filters
    const status = searchParams.get('status'); // 'draft' | 'published' | null (all)
    const importBatch = searchParams.get('importBatch');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updated_at';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    // Apply status filter
    if (status === 'draft') {
      filters.published = false;
    } else if (status === 'published') {
      filters.published = true;
    }

    // Apply import batch filter
    if (importBatch) {
      filters.import_batch_name = importBatch;
    }

    // Apply search filter (will be handled by fetchContentItems)
    const searchFields = search ? ['title', 'description', 'main_content'] : undefined;

    const { data, error, count } = await fetchContentItems({
      contentType: CONTENT_TYPE,
      includeUnpublished,
      page,
      pageSize,
      filters,
      searchQuery: search || undefined,
      searchFields,
      orderBy: sortBy,
      orderDirection: sortDirection as 'asc' | 'desc'
    });

    
    // Fetch relationships for all case studies in batch (avoids N+1 queries)
    if (data && data.length > 0) {
      try {
        const serviceClient = await createServiceRoleSupabaseClient();
        const caseStudyIds = data.map((item) => item.id);

        // 3 batch queries instead of 3 × N sequential queries
        const [industryResult, algorithmResult, personaResult] = await Promise.all([
          serviceClient
            .from('case_study_industry_relations')
            .select('case_study_id, industries:industries(id, slug, name)')
            .in('case_study_id', caseStudyIds),
          serviceClient
            .from('algorithm_case_study_relations')
            .select('case_study_id, algorithms:algorithms(id, slug, name)')
            .in('case_study_id', caseStudyIds),
          serviceClient
            .from('case_study_persona_relations')
            .select('case_study_id, personas:personas(id, slug, name)')
            .in('case_study_id', caseStudyIds),
        ]);

        // Group results by case study ID
        for (const item of data) {
          const extItem = item as CaseStudyWithRelations;
          extItem.related_industries = (industryResult.data || [])
            .filter((rel) => rel.case_study_id === item.id)
            .map((rel) => rel.industries as unknown as { id: string; slug: string; name: string })
            .filter(Boolean);
          extItem.related_algorithms = (algorithmResult.data || [])
            .filter((rel) => rel.case_study_id === item.id)
            .map((rel) => rel.algorithms as unknown as { id: string; slug: string; name: string })
            .filter(Boolean);
          extItem.related_personas = (personaResult.data || [])
            .filter((rel) => rel.case_study_id === item.id)
            .map((rel) => rel.personas as unknown as { id: string; slug: string; name: string })
            .filter(Boolean);
        }
      } catch (serviceRoleError) {
        console.error('[CaseStudies API] Error creating service role client:', serviceRoleError);
        // Continue without relationships rather than failing completely
      }
    }
    
    if (error) {
      console.error('[CaseStudies API] Error from fetchContentItems:', error);
      return NextResponse.json(
        { error: 'Error fetching case studies', details: error.message || 'Unknown error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      items: data,
      pagination: {
        page,
        pageSize,
        totalItems: count,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('[CaseStudies API] Unexpected error in GET handler:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case studies' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating or updating case studies
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Get form data
    const id = formData.get('id') as string || null;
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string || null;
    const main_content = formData.get('main_content') as string || null;
    const url = formData.get('url') as string || null;
    const published = formData.get('published') === 'on';
    
    // Handle array fields
    const partnerCompaniesString = formData.get('partner_companies') as string;
    const partnerCompanies = partnerCompaniesString ? 
      partnerCompaniesString.split(',').map(item => item.trim()).filter(Boolean) : 
      [];
    
    const quantumCompaniesString = formData.get('quantum_companies') as string;
    const quantumCompanies = quantumCompaniesString ? 
      quantumCompaniesString.split(',').map(item => item.trim()).filter(Boolean) : 
      [];
    
    const quantumHardwareString = formData.get('quantum_hardware') as string;
    const quantumHardware = quantumHardwareString ? 
      quantumHardwareString.split(',').map(item => item.trim()).filter(Boolean) : 
      [];
    
    const quantumSoftwareString = formData.get('quantum_software') as string;
    const quantumSoftware = quantumSoftwareString ? 
      quantumSoftwareString.split(',').map(item => item.trim()).filter(Boolean) : 
      [];
    
    // Handle relationships
    const algorithms = formData.getAll('algorithms[]') as string[];
    const industries = formData.getAll('industries[]') as string[];
    const personas = formData.getAll('personas[]') as string[];
    
    // Prepare the data object
    const data = {
      title,
      slug,
      description,
      main_content,
      url,
      partner_companies: partnerCompanies,
      quantum_companies: quantumCompanies,
      quantum_hardware: quantumHardware,
      quantum_software: quantumSoftware,
      published
    };

    // Validate input
    const validation = caseStudySchema.safeParse({ ...data, id, algorithms, industries, personas });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatValidationErrors(validation.error) },
        { status: 400 }
      );
    }

    // Prepare relationships
    const relationships = [];
    
    if (algorithms.length > 0) {
      relationships.push({
        relationshipConfig: RELATIONSHIP_CONFIG.algorithms,
        relatedIds: algorithms
      });
    }
    
    if (industries.length > 0) {
      relationships.push({
        relationshipConfig: RELATIONSHIP_CONFIG.industries,
        relatedIds: industries
      });
    }
    
    if (personas.length > 0) {
      relationships.push({
        relationshipConfig: RELATIONSHIP_CONFIG.personas,
        relatedIds: personas
      });
    }
    
    // Save the case study
    const { data: savedItem, error } = await saveContentItem({
      contentType: CONTENT_TYPE,
      data,
      id,
      relationships
    });
    
    if (error || !savedItem) {
      return NextResponse.json(
        { error: 'Failed to save case study' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(savedItem);
  } catch (error) {
    console.error('Error in case studies POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to save case study' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing case studies
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const relationshipConfigs = Object.values(RELATIONSHIP_CONFIG);
    
    const { success, error } = await deleteContentItem({
      contentType: CONTENT_TYPE,
      id,
      relationshipConfigs
    });
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete case study' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in case studies DELETE handler:', error);
    return NextResponse.json(
      { error: 'Failed to delete case study' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating published status or bulk operations
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json();
    
    // Handle bulk operations
    if (body.bulk) {
      const { operation, ids } = body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { error: 'IDs array is required for bulk operations' },
          { status: 400 }
        );
      }
      
      if (operation === 'publish') {
        return await handleBulkPublish(ids, true);
      } else if (operation === 'unpublish') {
        return await handleBulkPublish(ids, false);
      } else if (operation === 'delete') {
        return await handleBulkDelete(ids);
      } else {
        return NextResponse.json(
          { error: 'Invalid bulk operation' },
          { status: 400 }
        );
      }
    }
    
    // Handle single item update
    const id = searchParams.get('id');
    const { published } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    if (published === undefined) {
      return NextResponse.json(
        { error: 'Published status is required' },
        { status: 400 }
      );
    }
    
    const { data, error } = await updatePublishedStatus({
      contentType: CONTENT_TYPE,
      id,
      published
    });
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update published status for case study' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in case studies PATCH handler:', error);
    return NextResponse.json(
      { error: 'Failed to update case study' },
      { status: 500 }
    );
  }
}

/**
 * Handle bulk publish/unpublish operations
 */
async function handleBulkPublish(ids: string[], published: boolean) {
  try {
    const serviceClient = await createServiceRoleSupabaseClient();
    
    const { data, error } = await serviceClient
      .from('case_studies')
      .update({ published, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();
    
    if (error) {
      console.error('Bulk publish error:', error);
      return NextResponse.json(
        { error: `Failed to ${published ? 'publish' : 'unpublish'} case studies` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      message: `Successfully ${published ? 'published' : 'unpublished'} ${data?.length || 0} case studies`
    });
  } catch (error) {
    console.error('Bulk publish handler error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    );
  }
}

/**
 * Handle bulk delete operations
 */
async function handleBulkDelete(ids: string[]) {
  try {
    const serviceClient = await createServiceRoleSupabaseClient();
    
    // Delete relationships first
    const relationshipTables = [
      'algorithm_case_study_relations',
      'case_study_industry_relations',
      'case_study_persona_relations'
    ];
    
    for (const table of relationshipTables) {
      await fromTable(serviceClient, table)
        .delete()
        .in('case_study_id', ids);
    }
    
    // Delete case studies
    const { data, error } = await serviceClient
      .from('case_studies')
      .delete()
      .in('id', ids)
      .select();
    
    if (error) {
      console.error('Bulk delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete case studies' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
      message: `Successfully deleted ${data?.length || 0} case studies`
    });
  } catch (error) {
    console.error('Bulk delete handler error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk delete' },
      { status: 500 }
    );
  }
}