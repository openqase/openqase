/**
 * API Route for Algorithms
 * 
 * This is an implementation of the standardized API route template for algorithms.
 */

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
import { algorithmSchema, formatValidationErrors } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth';

// Define the content type for this API route
const CONTENT_TYPE: ContentType = 'algorithms';

// Define relationship configurations for this content type
const RELATIONSHIP_CONFIG: Record<string, RelationshipConfig> = {
  caseStudies: RELATIONSHIP_CONFIGS.algorithms.caseStudies
};

/**
 * Extract form data for algorithms
 */
function extractFormData(formData: FormData): Record<string, unknown> {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string || null;
  const mainContent = formData.get('main_content') as string || null;
  const published = formData.get('published') === 'on';
  const quantumAdvantage = formData.get('quantum_advantage') as string || null;
  
  // Handle array fields
  const useCasesString = formData.get('use_cases') as string;
  const useCases = useCasesString ? useCasesString.split(',').map(item => item.trim()) : [];
  
  return {
    name,
    slug,
    description,
    main_content: mainContent,
    published,
    quantum_advantage: quantumAdvantage,
    use_cases: useCases.length > 0 ? useCases : null
  };
}

/**
 * Extract relationships from form data
 */
function extractRelationships(formData: FormData): Array<{
  relationshipConfig: RelationshipConfig;
  relatedIds: string[];
}> {
  const relationships: Array<{
    relationshipConfig: RelationshipConfig;
    relatedIds: string[];
  }> = [];
  
  const relatedCaseStudies = formData.getAll('related_case_studies[]') as string[];
  if (relatedCaseStudies.length > 0) {
    relationships.push({
      relationshipConfig: RELATIONSHIP_CONFIGS.algorithms.caseStudies,
      relatedIds: relatedCaseStudies
    });
  }
  
  return relationships;
}

/**
 * GET handler for fetching algorithms
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    // Security fix: Never expose unpublished content via public API
    const includeUnpublished = false;
    
    // Handle single algorithm request
    if (slug) {
      const { data, error } = await fetchContentItem({
        contentType: CONTENT_TYPE,
        identifier: slug,
        identifierType: 'slug',
        includeUnpublished,
        includeRelationships: Object.values(RELATIONSHIP_CONFIG).map(config => ({
          relationshipConfig: config,
          fields: 'id, slug, title, description'
        }))
      });
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Algorithm not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(data);
    }
    
    // Handle list request
    const filters: Record<string, any> = {};
    
    // Add custom filters based on search params
    if (searchParams.has('use_case')) {
      const useCase = searchParams.get('use_case');
      if (useCase) {
        // Note: This is a simplified approach. For array fields, you might need
        // a more complex query depending on your database capabilities
        filters.use_cases = [useCase];
      }
    }
    
    const { data, error, count } = await fetchContentItems({
      contentType: CONTENT_TYPE,
      includeUnpublished,
      page,
      pageSize,
      filters,
      orderBy: 'updated_at',
      orderDirection: 'desc'
    });
    
    if (error) {
      return NextResponse.json(
        { error: 'Error fetching algorithms' },
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
    console.error('Error in algorithms GET handler:', error);
    return NextResponse.json(
      { error: 'Failed to fetch algorithms' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating or updating algorithms
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const formData = await request.formData();
    
    // Get form data
    const id = formData.get('id') as string || null;
    const data = extractFormData(formData);

    // Validate input
    const validation = algorithmSchema.safeParse({ ...data, id });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatValidationErrors(validation.error) },
        { status: 400 }
      );
    }

    const relationships = extractRelationships(formData);

    // Save the algorithm
    const { data: savedItem, error } = await saveContentItem({
      contentType: CONTENT_TYPE,
      data,
      id,
      relationships
    });
    
    if (error || !savedItem) {
      return NextResponse.json(
        { error: 'Failed to save algorithm' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(savedItem);
  } catch (error) {
    console.error('Error in algorithms POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to save algorithm' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing algorithms
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
    
    const { success, error } = await deleteContentItem({
      contentType: CONTENT_TYPE,
      id,
      relationshipConfigs: Object.values(RELATIONSHIP_CONFIG)
    });
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete algorithm' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in algorithms DELETE handler:', error);
    return NextResponse.json(
      { error: 'Failed to delete algorithm' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating published status
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
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
        { error: 'Failed to update published status for algorithm' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in algorithms PATCH handler:', error);
    return NextResponse.json(
      { error: 'Failed to update algorithm' },
      { status: 500 }
    );
  }
}