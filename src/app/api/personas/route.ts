import { NextRequest, NextResponse } from 'next/server';
import {
  fetchContentItems,
  fetchContentItem,
  saveContentItem,
  deleteContentItem,
  updatePublishedStatus,
  ContentType
} from '@/utils/content-management';
import { personaSchema, formatValidationErrors } from '@/lib/validation/schemas';

// Define the content type for this API route
const CONTENT_TYPE: ContentType = 'personas';

/**
 * GET handler for fetching personas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    // Security fix: Never expose unpublished content via public API
    const includeUnpublished = false;
    
    // Handle single persona request
    if (slug) {
      const { data, error } = await fetchContentItem({
        contentType: CONTENT_TYPE,
        identifier: slug,
        identifierType: 'slug',
        includeUnpublished
      });
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Persona not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(data);
    }
    
    // Handle list request
    const filters: Record<string, any> = {};
    
    // Add custom filters based on search params
    if (searchParams.has('industry')) {
      const industry = searchParams.get('industry');
      if (industry) {
        filters.industry = [industry];
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
        { error: 'Error fetching personas' },
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
    console.error('Error in personas GET handler:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating or updating personas
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Get form data
    const id = formData.get('id') as string || null;
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string || null;
    const role = formData.get('role') as string || null;
    const published = formData.get('published') === 'on';
    
    // Handle array fields
    const industryValues = formData.getAll('industry[]') as string[];
    
    // Prepare the data object
    const data = {
      name,
      slug,
      description,
      role,
      industry: industryValues.length > 0 ? industryValues : null,
      published
    };

    // Validate input
    const validation = personaSchema.safeParse({ ...data, id });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatValidationErrors(validation.error) },
        { status: 400 }
      );
    }

    // Save the persona
    const { data: savedItem, error } = await saveContentItem({
      contentType: CONTENT_TYPE,
      data,
      id
    });
    
    if (error || !savedItem) {
      return NextResponse.json(
        { error: 'Failed to save persona' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(savedItem);
  } catch (error) {
    console.error('Error in personas POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to save persona' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing personas
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
      id
    });
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete persona' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in personas DELETE handler:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona' },
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
        { error: 'Failed to update published status for persona' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in personas PATCH handler:', error);
    return NextResponse.json(
      { error: 'Failed to update persona' },
      { status: 500 }
    );
  }
}