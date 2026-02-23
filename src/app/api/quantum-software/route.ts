import { NextRequest, NextResponse } from 'next/server';
import {
  fetchContentItems,
  fetchContentItem,
  saveContentItem,
  updatePublishedStatus,
  RELATIONSHIP_CONFIGS
} from '@/utils/content-management';
import { requireAdmin } from '@/lib/auth';

// Define the content type for this API route
const CONTENT_TYPE = 'quantum_software' as const;

// Define relationship configurations for this content type
const RELATIONSHIP_CONFIG = {
  caseStudies: RELATIONSHIP_CONFIGS.quantumSoftware?.caseStudies
};

/**
 * GET handler for fetching quantum software
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const includeUnpublished = searchParams.get('preview') === 'true';
    
    // Handle single item request
    if (slug) {
      const { data, error } = await fetchContentItem({
        contentType: CONTENT_TYPE,
        identifier: slug,
        identifierType: 'slug',
        includeUnpublished,
        includeRelationships: []
      });
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Quantum software not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(data);
    }
    
    // Handle list request
    const { data, error, count } = await fetchContentItems({
      contentType: CONTENT_TYPE,
      includeUnpublished,
      page,
      pageSize,
      orderBy: 'name',
      orderDirection: 'asc'
    });
    
    if (error) {
      return NextResponse.json(
        { error: 'Error fetching quantum software' },
        { status: 500 }
      );
    }
    
    // For backward compatibility, return array directly if no pagination params
    if (!searchParams.has('page')) {
      return NextResponse.json(data);
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
    console.error('Error in quantum-software GET handler:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quantum software' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating quantum software
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    // Accept JSON data instead of FormData for compatibility with admin forms
    const data = await request.json();

    // Remove any id field for new items
    const { id, ...itemData } = data;

    // Save the quantum software item
    const { data: savedItem, error } = await saveContentItem({
      contentType: CONTENT_TYPE,
      data: itemData,
      id: null,
      relationships: []
    });
    
    if (error || !savedItem) {
      console.error('Error creating quantum software:', error);
      return NextResponse.json(
        { error: 'Failed to create quantum software' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(savedItem);
  } catch (error) {
    console.error('Error in quantum-software POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to create quantum software' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating quantum software
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    // Accept JSON data
    const data = await request.json();
    
    // Remove id from data to avoid conflicts
    const { id: _id, ...itemData } = data;
    
    // Update the quantum software item
    const { data: savedItem, error } = await saveContentItem({
      contentType: CONTENT_TYPE,
      data: itemData,
      id,
      relationships: []
    });
    
    if (error || !savedItem) {
      console.error('Error updating quantum software:', error);
      return NextResponse.json(
        { error: 'Failed to update quantum software' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(savedItem);
  } catch (error) {
    console.error('Error in quantum-software PUT handler:', error);
    return NextResponse.json(
      { error: 'Failed to update quantum software' },
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
        { error: 'Failed to update published status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in quantum-software PATCH handler:', error);
    return NextResponse.json(
      { error: 'Failed to update quantum software' },
      { status: 500 }
    );
  }
}