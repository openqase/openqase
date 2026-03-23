import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { fromTable } from '@/lib/supabase-untyped';

// Define content types
export type ContentType = 'case_studies' | 'algorithms' | 'personas' | 'industries' | 'blog_posts' | 'quantum_software' | 'quantum_hardware' | 'quantum_companies' | 'partner_companies';

/**
 * Unified function to fetch a list of content items
 * Used for generating static params and listing pages
 */
export async function getStaticContentList<T>(
  contentType: ContentType,
  options: { 
    preview?: boolean;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    filters?: Record<string, any>;
  } = {}
): Promise<T[]> {
  const supabase = createServiceRoleSupabaseClient();
  
  let query = supabase
    .from(contentType)
    .select('*');

  // Apply published filter unless in preview mode
  if (!options.preview) {
    query = query.eq('published', true); // Re-enabled for runtime
  }

  // Apply additional filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    });
  }

  // Apply ordering
  const orderBy = options.orderBy || 'updated_at';
  const orderDirection = options.orderDirection || 'desc';
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });

  // Apply limit
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Failed to fetch ${contentType} list:`, error);
    return [];
  }

  return (data as T[]) || [];
}

/**
 * Get related content for cross-references
 * Used to find content related through junction tables
 */
export async function getRelatedContent<T>(
  sourceContentType: ContentType,
  sourceId: string,
  targetContentType: ContentType,
  options: { preview?: boolean; limit?: number } = {}
): Promise<T[]> {
  const supabase = createServiceRoleSupabaseClient();
  
  // Define junction table mappings
  const junctionTableMap: Record<string, { table: string; sourceField: string; targetField: string }> = {
    'case_studies->algorithms': {
      table: 'algorithm_case_study_relations',
      sourceField: 'case_study_id',
      targetField: 'algorithm_id'
    },
    'algorithms->case_studies': {
      table: 'algorithm_case_study_relations',
      sourceField: 'algorithm_id', 
      targetField: 'case_study_id'
    },
    'case_studies->industries': {
      table: 'case_study_industry_relations',
      sourceField: 'case_study_id',
      targetField: 'industry_id'
    },
    'case_studies->personas': {
      table: 'case_study_persona_relations',
      sourceField: 'case_study_id',
      targetField: 'persona_id'
    },
    'blog_posts->blog_posts': {
      table: 'blog_post_relations',
      sourceField: 'blog_post_id',
      targetField: 'related_blog_post_id'
    },
    // Add more mappings as needed
  };

  const relationKey = `${sourceContentType}->${targetContentType}`;
  const junctionConfig = junctionTableMap[relationKey];

  if (!junctionConfig) {
    console.warn(`No junction table mapping found for ${relationKey}`);
    return [];
  }

  // First, get the related IDs from the junction table
  const { data: relations, error: relationsError } = await fromTable(supabase, junctionConfig.table)
    .select(junctionConfig.targetField)
    .eq(junctionConfig.sourceField, sourceId);

  if (relationsError || !relations || relations.length === 0) {
    return [];
  }

  const relatedIds = relations.map((rel: any) => rel[junctionConfig.targetField]);

  // Then fetch the actual content items
  let query = supabase
    .from(targetContentType)
    .select('*')
    .in('id', relatedIds);

  if (!options.preview) {
    query = query.eq('published', true);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Failed to fetch related ${targetContentType}:`, error);
    return [];
  }

  return (data as T[]) || [];
}

/**
 * Build-time content fetching using service role client
 * Used for batch operations and admin functionality
 * 
 * NOTE: This function fetches ALL content regardless of published status.
 * This is useful for admin operations, batch processing, and content management.
 * 
 * For static page generation, use generateStaticParamsForContentType() instead,
 * which filters to published content only.
 * 
 * Last reviewed: 2025-08-10
 */
export async function getBuildTimeContentList<T>(
  contentType: ContentType,
  options: { 
    limit?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    filters?: Record<string, any>;
  } = {}
): Promise<T[]> {
  const supabase = createServiceRoleSupabaseClient();
  
  let query = supabase
    .from(contentType)
    .select('*');
    // Note: No published filter - this function fetches all content for admin/batch operations

  // Apply additional filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    });
  }

  // Apply ordering
  const orderBy = options.orderBy || 'updated_at';
  const orderDirection = options.orderDirection || 'desc';
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });

  // Apply limit
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Failed to fetch ${contentType} list at build time:`, error);
    return [];
  }

  return (data as T[]) || [];
}

/**
 * Batch fetch multiple content types for homepage/overview pages
 */
export async function batchFetchContent<T>(
  contentTypes: ContentType[],
  options: { preview?: boolean; limit?: number } = {}
): Promise<Record<ContentType, T[]>> {
  const results = await Promise.all(
    contentTypes.map(async (contentType) => {
      const data = await getStaticContentList<T>(contentType, options);
      return [contentType, data] as const;
    })
  );

  return Object.fromEntries(results) as Record<ContentType, T[]>;
}

/**
 * Optimized search item interface for client-side search
 * Streamlined for performance while preserving key search functionality
 */
export interface SearchableItem {
  id: string;
  title: string;
  description: string | null; // Truncated to 150 chars
  slug: string;
  type: ContentType;
  metadata: {
    companies?: string[]; // Limited to first 2 companies
    year?: number;
    quantum_advantage?: string; // For algorithms only
    use_cases?: string[]; // Limited to first 2 use cases
  };
}

/**
 * Fetch search-optimized data for client-side search
 * Returns streamlined data for fast loading and searching:
 * - Truncated descriptions (150 chars)
 * - Limited companies (first 2)
 * - Limited use cases (first 2) 
 * - Published content only
 */
export async function fetchSearchData(
  options: { preview?: boolean } = {}
): Promise<SearchableItem[]> {
  const supabase = createServiceRoleSupabaseClient();
  
  const contentTypes: ContentType[] = ['case_studies', 'algorithms', 'industries', 'personas'];
  const searchItems: SearchableItem[] = [];

  // Helper function to truncate text
  const truncateText = (text: string | null, maxLength: number = 150): string | null => {
    if (!text) return null;
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  // Helper function to limit array size
  const limitArray = (arr: any[] | null, maxItems: number = 2): any[] => {
    if (!arr || !Array.isArray(arr)) return [];
    return arr.slice(0, maxItems);
  };

  await Promise.all(
    contentTypes.map(async (contentType) => {
      let selectFields: string;
      
      switch (contentType) {
        case 'case_studies':
          selectFields = 'id, title, description, slug, quantum_companies, partner_companies, year';
          break;
        case 'algorithms':
          selectFields = 'id, name, description, slug, quantum_advantage, use_cases';
          break;
        case 'industries':
        case 'personas':
          selectFields = 'id, name, description, slug';
          break;
        default:
          selectFields = 'id, title, description, slug';
      }

      let query = supabase
        .from(contentType)
        .select(selectFields);

      if (!options.preview) {
        query = query.eq('published', true);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error(`Failed to fetch search data for ${contentType}:`, error);
        return;
      }

      if (data) {
        const transformedItems = data.map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          description: truncateText(item.description, 150), // Truncate descriptions
          slug: item.slug,
          type: contentType,
          metadata: {
            // Combine and limit companies to first 2
            ...(item.quantum_companies && { 
              companies: limitArray([...(item.quantum_companies || []), ...(item.partner_companies || [])], 2) 
            }),
            ...(item.year && { year: item.year }),
            ...(item.quantum_advantage && { quantum_advantage: item.quantum_advantage }),
            // Limit use cases to first 2
            ...(item.use_cases && { use_cases: limitArray(item.use_cases, 2) })
          }
        }));
        
        searchItems.push(...transformedItems);
      }
    })
  );

  return searchItems;
}


/**
 * Sanitize a search term for use in PostgREST filter strings.
 * Strips characters that could break or manipulate .or() filter syntax,
 * and enforces a maximum length.
 */
function sanitizeSearchTerm(term: string): string {
  return term
    .replace(/[,.()"\\]/g, ' ')  // Strip PostgREST filter metacharacters
    .replace(/\s+/g, ' ')        // Collapse multiple spaces
    .trim()
    .slice(0, 200);              // Enforce max length
}

/**
 * Search content across multiple types
 * Simple implementation for basic search functionality
 */
export async function searchContent<T>(
  contentTypes: ContentType[],
  searchTerm: string,
  options: { preview?: boolean; limit?: number } = {}
): Promise<{ contentType: ContentType; items: T[] }[]> {
  const sanitized = sanitizeSearchTerm(searchTerm);
  if (!sanitized) {
    return contentTypes.map(contentType => ({ contentType, items: [] }));
  }

  const supabase = createServiceRoleSupabaseClient();

  const results = await Promise.all(
    contentTypes.map(async (contentType) => {
      let query = supabase
        .from(contentType)
        .select('*')
        .or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%,main_content.ilike.%${sanitized}%`);

      if (!options.preview) {
        query = query.eq('published', true);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error(`Search failed for ${contentType}:`, error);
        return { contentType, items: [] };
      }

      return { contentType, items: (data as T[]) || [] };
    })
  );

  return results;
} 