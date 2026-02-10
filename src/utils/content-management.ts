import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { createServiceRoleSupabaseClient } from '@/lib/supabase';
import { fromTable } from '@/lib/supabase-untyped';
import { PostgrestError } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';

/**
 * Content types supported by the CMS
 */
export type ContentType = 'algorithms' | 'personas' | 'industries' | 'case_studies' | 'blog_posts' | 'quantum_software' | 'quantum_hardware' | 'quantum_companies' | 'partner_companies';

/**
 * Configuration for a relationship between content types
 */
export type RelationshipConfig = {
  junctionTable: string;
  contentIdField: string;
  relatedIdField: string;
  relatedTable: string;
};

/**
 * Fetches content items with optional filtering
 */
export async function fetchContentItems({
  contentType,
  includeUnpublished = false,
  page = 1,
  pageSize = 10,
  filters = {},
  searchQuery,
  searchFields,
  orderBy = 'updated_at',
  orderDirection = 'desc'
}: {
  contentType: ContentType;
  includeUnpublished?: boolean;
  page?: number;
  pageSize?: number;
  filters?: Record<string, any>;
  searchQuery?: string;
  searchFields?: string[];
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}) {
  const supabase = await createServiceRoleSupabaseClient();
  
  // Apply direct filters to the main table
  let query = supabase
    .from(contentType)
    .select('*', { count: 'exact' });
  
  // Apply published filter if not including unpublished
  if (!includeUnpublished) {
    query = query.eq('published', true);
  }
  
  // Apply direct filters
  Object.entries(filters).forEach(([key, value]) => {
    // Skip relationship filters, we'll handle them separately
    if (!['industries', 'algorithms', 'personas', 'related_posts'].includes(key)) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }
  });

  // Apply search filters
  if (searchQuery && searchFields && searchFields.length > 0) {
    // Create OR conditions for each search field
    const searchConditions = searchFields.map(field => `${field}.ilike.%${searchQuery}%`).join(',');
    query = query.or(searchConditions);
  }
  
  // Apply ordering
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });
  
  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  // Execute query with pagination
  const { data, error, count } = await query.range(from, to);
  
  return { data, error, count, page, pageSize };
}

/**
 * Fetches a single content item by ID or slug
 */
export async function fetchContentItem({
  contentType,
  identifier,
  identifierType = 'slug',
  includeUnpublished = false,
  includeRelationships = []
}: {
  contentType: ContentType;
  identifier: string;
  identifierType?: 'id' | 'slug';
  includeUnpublished?: boolean;
  includeRelationships?: Array<{
    relationshipConfig: RelationshipConfig;
    fields?: string;
  }>;
}) {
  const supabase = await createServiceRoleSupabaseClient();
  
  let query = supabase
    .from(contentType)
    .select('*')
    .eq(identifierType, identifier);
  
  if (!includeUnpublished) {
    query = query.eq('published', true);
  }
  
  const { data: item, error } = await query.single();
  
  if (error || !item) {
    return { data: null, error: error || new Error('Item not found') };
  }
  
  // Fetch relationships if requested
  if (includeRelationships.length > 0 && item) {
    const serviceClient = await createServiceRoleSupabaseClient();
    
    for (const relationship of includeRelationships) {
      const { relationshipConfig, fields = '*' } = relationship;
      const { junctionTable, contentIdField, relatedIdField, relatedTable } = relationshipConfig;
      
      const { data: relations, error: relationsError } = await fromTable(serviceClient, junctionTable)
        .select(`
          ${relatedIdField},
          ${relatedTable}:${relatedTable}(${fields})
        `)
        .eq(contentIdField, item.id);
        
      if (!relationsError && relations) {
        // Extract the related items
        const relatedItems = relations.map(relation => relation[relatedTable as keyof typeof relation]);
        (item as Record<string, unknown>)[`related_${relatedTable}`] = relatedItems;
      }
    }
  }
  
  return { data: item, error: null };
}

/**
 * Creates or updates a content item
 */
export async function saveContentItem({
  contentType,
  data,
  id = null,
  relationships = []
}: {
  contentType: ContentType;
  data: Record<string, any>;
  id?: string | null;
  relationships?: Array<{
    relationshipConfig: RelationshipConfig;
    relatedIds: string[];
  }>;
}) {
  const serviceClient = await createServiceRoleSupabaseClient();
  let result;
  
  // Prepare the data with updated timestamp
  const itemData = {
    ...data,
    updated_at: new Date().toISOString()
  };
  
  // Create or update the content item
  // Uses fromTable because contentType is dynamic and itemData is a generic Record
  if (id) {
    // Update existing item
    result = await fromTable(serviceClient, contentType)
      .update(itemData)
      .eq('id', id)
      .select('*')
      .single();
  } else {
    // Create new item
    result = await fromTable(serviceClient, contentType)
      .insert(itemData)
      .select('*')
      .single();
  }
  
  const { data: savedItem, error } = result;
  
  if (error || !savedItem) {
    return { data: null, error: error || new Error('Failed to save item') };
  }
  
  // Handle relationships if provided
  if (relationships.length > 0 && savedItem) {
    for (const relationship of relationships) {
      const { relationshipConfig, relatedIds } = relationship;
      const { junctionTable, contentIdField, relatedIdField } = relationshipConfig;
      
      // First delete existing relationships
      const { error: deleteError } = await fromTable(serviceClient, junctionTable)
        .delete()
        .eq(contentIdField, savedItem.id);
        
      if (deleteError) {
        console.error(`Error deleting existing relationships in ${junctionTable}:`, deleteError);
      }
      
      // Then insert new relationships
      if (relatedIds.length > 0) {
        const relationInserts = relatedIds.map(relatedId => ({
          [contentIdField]: savedItem.id,
          [relatedIdField]: relatedId
        }));
        
        const { error: insertError } = await fromTable(serviceClient, junctionTable)
          .insert(relationInserts);
          
        if (insertError) {
          console.error(`Error inserting relationships in ${junctionTable}:`, insertError);
        }
      }
    }
  }
  
  return { data: savedItem, error: null };
}

/**
 * Deletes a content item and its relationships (soft delete by default)
 */
export async function deleteContentItem({
  contentType,
  id,
  relationshipConfigs = [],
  hardDelete = false,
  deletedBy = null
}: {
  contentType: ContentType;
  id: string;
  relationshipConfigs?: RelationshipConfig[];
  hardDelete?: boolean;
  deletedBy?: string | null;
}) {
  const serviceClient = await createServiceRoleSupabaseClient();
  
  // If hard delete is requested (or soft delete not supported), use original logic
  if (hardDelete) {
    // First delete relationships in junction tables
    for (const config of relationshipConfigs) {
      const { junctionTable, contentIdField } = config;
      
      const { error: relDeleteError } = await fromTable(serviceClient, junctionTable)
        .delete()
        .eq(contentIdField, id);

      if (relDeleteError) {
        console.error(`Error deleting relationships in ${junctionTable}:`, relDeleteError);
        // Continue with deletion even if relationship deletion fails
      }
    }
    
    // Then delete the content item
    const { error: deleteError } = await serviceClient
      .from(contentType)
      .delete()
      .eq('id', id);
      
    return { success: !deleteError, error: deleteError };
  }
  
  // Soft delete implementation
  try {
    // Step 0: Fetch content before deletion for audit snapshot
    let contentSnapshot = null;
    let contentName = null;
    try {
      const { data: contentData } = await serviceClient
        .from(contentType)
        .select('*')
        .eq('id', id)
        .single();

      if (contentData) {
        contentSnapshot = contentData;
        // Extract content name from common fields
        const record = contentData as Record<string, unknown>;
        contentName = (record.title as string) || (record.name as string) || null;
      }
    } catch (snapshotError) {
      // Non-critical: continue with deletion even if snapshot fails
      console.error('Failed to capture content snapshot:', snapshotError);
    }

    // Step 1: Soft delete relationships in junction tables
    for (const config of relationshipConfigs) {
      const { junctionTable, contentIdField } = config;

      // Update junction table entries with deleted_at timestamp
      const { error: relDeleteError } = await fromTable(serviceClient, junctionTable)
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq(contentIdField, id)
        .is('deleted_at', null); // Only update if not already deleted

      if (relDeleteError) {
        console.error(`Error soft deleting relationships in ${junctionTable}:`, relDeleteError);
        // Continue - non-critical error
      }
    }

    // Step 2: Soft delete the main content item
    const { error: deleteError } = await serviceClient
      .from(contentType)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        published: false // Immediately unpublish when soft deleted
      })
      .eq('id', id);

    // Step 3: Log the deletion for audit trail
    if (!deleteError && deletedBy) {
      try {
        await fromTable(serviceClient, 'deletion_audit_log')
          .insert({
            content_type: contentType,
            content_id: id,
            content_name: contentName,
            action: 'soft_delete',
            performed_by: deletedBy,
            performed_at: new Date().toISOString(),
            metadata: {
              content_snapshot: contentSnapshot,
              relationship_configs: relationshipConfigs.length
            }
          });
      } catch (auditError) {
        // Don't fail the delete if audit logging fails
        console.error('Failed to log deletion to audit trail:', auditError);
        Sentry.captureException(auditError, {
          tags: {
            operation: 'audit_log',
            action: 'soft_delete',
            content_type: contentType
          },
          extra: {
            content_id: id,
            content_name: contentName
          }
        });
      }
    }

    return { success: !deleteError, error: deleteError };
  } catch (error) {
    console.error('Soft delete failed:', error);
    return { success: false, error: error as PostgrestError | null };
  }
}

/**
 * Recovers a soft-deleted content item and its relationships
 */
export async function recoverContentItem({
  contentType,
  id,
  relationshipConfigs = [],
  recoveredBy = null
}: {
  contentType: ContentType;
  id: string;
  relationshipConfigs?: RelationshipConfig[];
  recoveredBy?: string | null;
}) {
  const serviceClient = await createServiceRoleSupabaseClient();
  
  try {
    // Step 1: Recover the main content item
    const { data, error: recoverError } = await serviceClient
      .from(contentType)
      .update({ 
        deleted_at: null,
        deleted_by: null,
        published: false // Always recover as draft for safety
      })
      .eq('id', id)
      .select()
      .single();
      
    if (recoverError || !data) {
      return { success: false, error: recoverError };
    }
    
    // Step 2: Recover relationships in junction tables
    for (const config of relationshipConfigs) {
      const { junctionTable, contentIdField } = config;
      
      const { error: relRecoverError } = await fromTable(serviceClient, junctionTable)
        .update({
          deleted_at: null
        })
        .eq(contentIdField, id);
        
      if (relRecoverError) {
        console.error(`Error recovering relationships in ${junctionTable}:`, relRecoverError);
        // Continue - non-critical error
      }
    }
    
    // Step 3: Log the recovery for audit trail
    if (recoveredBy) {
      // Extract content name from recovered data
      const recoveredData = data as Record<string, unknown>;
      const contentName = (recoveredData.title as string) || (recoveredData.name as string) || null;

      try {
        await fromTable(serviceClient, 'deletion_audit_log')
          .insert({
            content_type: contentType,
            content_id: id,
            content_name: contentName,
            action: 'restore',
            performed_by: recoveredBy,
            performed_at: new Date().toISOString(),
            metadata: {
              relationship_configs: relationshipConfigs.length
            }
          });
      } catch (auditError) {
        // Don't fail the restore if audit logging fails
        console.error('Failed to log restore to audit trail:', auditError);
        Sentry.captureException(auditError, {
          tags: {
            operation: 'audit_log',
            action: 'restore',
            content_type: contentType
          },
          extra: {
            content_id: id,
            content_name: contentName
          }
        });
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Recovery failed:', error);
    return { success: false, error: error as PostgrestError | null };
  }
}

/**
 * Updates the published status of a content item
 */
export async function updatePublishedStatus({
  contentType,
  id,
  published
}: {
  contentType: ContentType;
  id: string;
  published: boolean;
}) {
  const serviceClient = await createServiceRoleSupabaseClient();
  
  const updateData: Record<string, any> = {
    published,
    updated_at: new Date().toISOString()
  };
  
  // If publishing, set published_at timestamp
  if (published) {
    updateData.published_at = new Date().toISOString();
  }
  
  const { data, error } = await serviceClient
    .from(contentType)
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();
    
  return { data, error };
}

/**
 * Converts a slug to an ID for a content type
 */
export async function slugToId({
  contentType,
  slug
}: {
  contentType: ContentType;
  slug: string;
}) {
  const supabase = await createServiceRoleSupabaseClient();
  
  const { data, error } = await supabase
    .from(contentType)
    .select('id')
    .eq('slug', slug)
    .single();
    
  if (error || !data) {
    return { id: null, error: error || new Error(`${contentType} with slug ${slug} not found`) };
  }
  
  return { id: data.id, error: null };
}

/**
 * Relationship configurations for different content types
 */
export const RELATIONSHIP_CONFIGS = {
  algorithms: {
    caseStudies: {
      junctionTable: 'algorithm_case_study_relations',
      contentIdField: 'algorithm_id',
      relatedIdField: 'case_study_id',
      relatedTable: 'case_studies'
    },
    industries: {
      junctionTable: 'algorithm_industry_relations',
      contentIdField: 'algorithm_id',
      relatedIdField: 'industry_id',
      relatedTable: 'industries'
    }
  },
  caseStudies: {
    algorithms: {
      junctionTable: 'algorithm_case_study_relations',
      contentIdField: 'case_study_id',
      relatedIdField: 'algorithm_id',
      relatedTable: 'algorithms'
    },
    relatedCaseStudies: {
      junctionTable: 'case_study_relations',
      contentIdField: 'case_study_id',
      relatedIdField: 'related_case_study_id',
      relatedTable: 'case_studies'
    }
  },
  blogPosts: {
    relatedBlogPosts: {
      junctionTable: 'blog_post_relations',
      contentIdField: 'blog_post_id',
      relatedIdField: 'related_blog_post_id',
      relatedTable: 'blog_posts'
    }
  },
  quantumSoftware: {
    caseStudies: {
      junctionTable: 'case_study_quantum_software_relations',
      contentIdField: 'quantum_software_id',
      relatedIdField: 'case_study_id',
      relatedTable: 'case_studies'
    }
  },
  quantumHardware: {
    caseStudies: {
      junctionTable: 'case_study_quantum_hardware_relations',
      contentIdField: 'quantum_hardware_id',
      relatedIdField: 'case_study_id',
      relatedTable: 'case_studies'
    }
  },
  quantumCompanies: {
    caseStudies: {
      junctionTable: 'case_study_quantum_company_relations',
      contentIdField: 'quantum_company_id',
      relatedIdField: 'case_study_id',
      relatedTable: 'case_studies'
    }
  },
  partnerCompanies: {
    caseStudies: {
      junctionTable: 'case_study_partner_company_relations',
      contentIdField: 'partner_company_id',
      relatedIdField: 'case_study_id',
      relatedTable: 'case_studies'
    }
  }
};