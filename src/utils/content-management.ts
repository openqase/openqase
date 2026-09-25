import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { fromTable } from '@/lib/supabase-untyped';
import { getContentTypeByTableName } from '@/cms/registry';
import { deleteContent, restoreContent, permanentlyDeleteContent } from '@/cms/operations/delete';
import { revalidateContentType } from '@/cms/operations/revalidate';

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
    query = query.eq('published', true).is('deleted_at', null);
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
    query = query.eq('published', true).is('deleted_at', null);
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
        const relatedItems = relations.map((relation: Record<string, unknown>) => relation[relatedTable]);
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
 * Resolve a table name (legacy ContentType) to the CMS registry slug.
 */
function registrySlugFor(contentType: ContentType): string | null {
  return getContentTypeByTableName(contentType)?.slug ?? null;
}

/**
 * Deletes a content item (soft delete by default).
 *
 * Soft delete delegates to the single CMS soft-delete path
 * (`deleteContent` in src/cms/operations/delete.ts), which sets deleted_at,
 * deleted_by and published=false, soft-deletes junction rows that support it,
 * writes the audit log and revalidates admin list + public list + slug page.
 *
 * `relationshipConfigs` is retained for API compatibility; junction tables are
 * now derived from the CMS registry.
 *
 * Hard delete permanently removes the item, but only if it is already in the
 * trash (see `permanentlyDeleteContent`).
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
}): Promise<{ success: boolean; error: Error | null }> {
  const typeSlug = registrySlugFor(contentType);
  if (!typeSlug) {
    return { success: false, error: new Error(`Unknown content type: ${contentType}`) };
  }

  if (hardDelete) {
    const extraJunctions = relationshipConfigs.map(({ junctionTable, contentIdField }) => ({
      junctionTable,
      contentIdField
    }));
    const result = await permanentlyDeleteContent(typeSlug, [id], extraJunctions);
    return { success: result.success, error: result.error ? new Error(result.error) : null };
  }

  const result = await deleteContent(typeSlug, id, { deletedBy });
  return { success: result.success, error: result.error ? new Error(result.error) : null };
}

/**
 * Recovers a soft-deleted content item and its relationships.
 *
 * Delegates to `restoreContent` in src/cms/operations/delete.ts: clears
 * deleted_at / deleted_by, keeps published=false (restored content is always
 * a draft), restores junction rows, writes the audit log and revalidates.
 * `relationshipConfigs` is retained for API compatibility.
 */
export async function recoverContentItem({
  contentType,
  id,
  recoveredBy = null
}: {
  contentType: ContentType;
  id: string;
  relationshipConfigs?: RelationshipConfig[];
  recoveredBy?: string | null;
}): Promise<{ success: boolean; data?: Record<string, unknown>; error: Error | null }> {
  const typeSlug = registrySlugFor(contentType);
  if (!typeSlug) {
    return { success: false, error: new Error(`Unknown content type: ${contentType}`) };
  }

  const result = await restoreContent(typeSlug, id, { restoredBy: recoveredBy });
  if (!result.success) {
    return { success: false, error: new Error(result.error ?? 'Recovery failed') };
  }
  return { success: true, data: result.data, error: null };
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
  
  const updateData = {
    published,
    updated_at: new Date().toISOString(),
    ...(published ? { published_at: new Date().toISOString() } : {})
  };

  let query = fromTable(serviceClient, contentType)
    .update(updateData)
    .eq('id', id);

  // Never publish soft-deleted (trashed) content.
  if (published) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query
    .select('*')
    .single();

  if (!error) {
    const typeSlug = registrySlugFor(contentType);
    if (typeSlug) revalidateContentType(typeSlug, (data as Record<string, unknown> | null)?.slug as string | undefined);
  }

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