import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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
import { blogPostSchema, formatValidationErrors } from '@/lib/validation/schemas';

// Define the content type for this API route
const CONTENT_TYPE: ContentType = 'blog_posts';

// Define relationship configurations for blog posts
const RELATIONSHIP_CONFIG: Record<string, RelationshipConfig> = {
  relatedPosts: {
    junctionTable: 'blog_post_relations',
    contentIdField: 'blog_post_id',
    relatedIdField: 'related_blog_post_id',
    relatedTable: 'blog_posts'
  }
};

/**
 * GET handler for fetching blog posts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    // Security fix: Never expose unpublished content via public API
    const includeUnpublished = false;
    
    // Handle single blog post request
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
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(data);
    }
    
    // Handle list request
    const filters: Record<string, any> = {};
    
    // Add custom filters based on search params
    if (searchParams.has('category')) {
      const category = searchParams.get('category');
      if (category) {
        filters.category = category;
      }
    }
    
    if (searchParams.has('tag')) {
      const tag = searchParams.get('tag');
      if (tag) {
        filters.tags = [tag];
      }
    }
    
    if (searchParams.has('featured')) {
      const featured = searchParams.get('featured') === 'true';
      filters.featured = featured;
    }
    
    const { data, error, count } = await fetchContentItems({
      contentType: CONTENT_TYPE,
      includeUnpublished,
      page,
      pageSize,
      filters,
      orderBy: searchParams.get('orderBy') || 'published_at',
      orderDirection: (searchParams.get('orderDirection') as 'asc' | 'desc') || 'desc'
    });
    
    if (error) {
      return NextResponse.json(
        { error: 'Error fetching blog posts' },
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
    console.error('Error in blog posts GET handler:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating or updating blog posts
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Get form data
    const id = formData.get('id') as string || null;
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string || null;
    const content = formData.get('content') as string || null;
    const author = formData.get('author') as string || null;
    const featured_image = formData.get('featured_image') as string || null;
    const category = formData.get('category') as string || null;
    const published = formData.get('published') === 'on';
    const featured = formData.get('featured') === 'on';
    
    // Handle array fields
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? 
      tagsString.split(',').map(item => item.trim()).filter(Boolean) : 
      [];
    
    // Handle relationships
    const relatedPosts = formData.getAll('related_posts[]') as string[];
    
    // Prepare the data object
    const data = {
      title,
      slug,
      description,
      content,
      author,
      featured_image,
      category,
      tags,
      published,
      featured
    };

    // Validate input
    const validation = blogPostSchema.safeParse({ ...data, id });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatValidationErrors(validation.error) },
        { status: 400 }
      );
    }

    // Prepare relationships
    const relationships = [];
    
    if (relatedPosts.length > 0) {
      relationships.push({
        relationshipConfig: RELATIONSHIP_CONFIG.relatedPosts,
        relatedIds: relatedPosts
      });
    }
    
    // Save the blog post
    const { data: savedItem, error } = await saveContentItem({
      contentType: CONTENT_TYPE,
      data,
      id,
      relationships
    });
    
    if (error || !savedItem) {
      return NextResponse.json(
        { error: 'Failed to save blog post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(savedItem);
  } catch (error) {
    console.error('Error in blog posts POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to save blog post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing blog posts
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
        { error: 'Failed to delete blog post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in blog posts DELETE handler:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
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
    const { published, featured } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    if (published === undefined && featured === undefined) {
      return NextResponse.json(
        { error: 'Published or featured status is required' },
        { status: 400 }
      );
    }
    
    // If updating published status
    if (published !== undefined) {
      const { data, error } = await updatePublishedStatus({
        contentType: CONTENT_TYPE,
        id,
        published
      });
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to update published status for blog post' },
          { status: 500 }
        );
      }
      
      revalidatePath('/admin/blog');
      revalidatePath('/'); // Revalidate homepage since it shows featured blog posts
      
      return NextResponse.json(data);
    }
    
    // If updating featured status
    if (featured !== undefined) {
      const { data, error } = await saveContentItem({
        contentType: CONTENT_TYPE,
        id,
        data: { featured }
      });
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to update featured status for blog post' },
          { status: 500 }
        );
      }
      
      revalidatePath('/admin/blog');
      revalidatePath('/'); // Revalidate homepage since it shows featured blog posts
      
      return NextResponse.json(data);
    }
    
    return NextResponse.json({ error: 'No action performed' }, { status: 400 });
  } catch (error) {
    console.error('Error in blog posts PATCH handler:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}