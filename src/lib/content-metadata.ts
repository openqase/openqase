import type { Database } from '@/types/supabase';
import type { ViewMode } from '@/hooks/useViewSwitcher';

// Type definitions for content types
type CaseStudy = Database['public']['Tables']['case_studies']['Row'];
type Algorithm = Database['public']['Tables']['algorithms']['Row'];
type Industry = Database['public']['Tables']['industries']['Row'];
type Persona = Database['public']['Tables']['personas']['Row'];

// Metadata extractor function type
type MetadataExtractor<T> = (item: T) => Array<string | number | null>;

// Content type configuration interface
interface ContentTypeConfig<T> {
  list: MetadataExtractor<T>;
  grid?: MetadataExtractor<T>;
}

// Utility function to format dates consistently
function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Metadata configuration for each content type
export const contentMetadataConfig = {
  'case-studies': {
    list: (item: CaseStudy) => {
      return [
        item.year
      ];
    }
  },
  'algorithms': {
    list: (item: Algorithm) => [
      formatDate(item.updated_at)
    ]
  },
  'industries': {
    list: (item: Industry) => [
      formatDate(item.updated_at)
    ]
  },
  'personas': {
    list: (item: Persona) => [
      formatDate(item.updated_at)
    ]
  }
} as const satisfies Record<string, ContentTypeConfig<any>>;

// Type for valid content type keys
export type ContentType = keyof typeof contentMetadataConfig;

/**
 * Get metadata for a content item based on content type and view mode
 * 
 * @param contentType - The type of content
 * @param item - The content item
 * @param viewMode - Current view mode
 * @returns Array of metadata strings/numbers
 */
export function getContentMetadata(
  contentType: ContentType,
  item: any,
  viewMode: ViewMode
): Array<string | number> {
  const config = contentMetadataConfig[contentType];
  
  if (!config) {
    console.warn(`No metadata configuration found for content type: ${contentType}`);
    return [];
  }
  
  // Only show metadata in list view (grid view shows no metadata by default)
  if (viewMode !== 'list') {
    return [];
  }
  
  // Get the appropriate extractor (list for list view, fallback to list if grid not defined)
  const extractor = config.list;
  
  if (!extractor) {
    return [];
  }
  
  try {
    // Extract metadata and filter out null/undefined values
    return extractor(item).filter((value): value is string | number => 
      value !== null && value !== undefined
    );
  } catch (error) {
    console.warn(`Error extracting metadata for ${contentType}:`, error);
    return [];
  }
}