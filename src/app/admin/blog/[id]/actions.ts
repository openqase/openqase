'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { TablesInsert } from '@/types/supabase';

interface BlogPostFormData extends Omit<TablesInsert<'blog_posts'>, 'id'> {
  id?: string;
  related_posts?: string[];
}

export async function saveBlogPost(values: BlogPostFormData): Promise<TablesInsert<'blog_posts'>> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .upsert({
        id: values.id,
        title: values.title,
        slug: values.slug,
        description: values.description,
        content: values.content,
        author: values.author,
        featured_image: values.featured_image,
        category: values.category,
        tags: values.tags,
        published: values.published,
        featured: values.featured,
        published_at: values.published_at,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving blog post:", error);
      throw new Error(error.message || "Failed to save blog post");
    }
    
    // Handle related posts relationships (delete and re-create)
    if (values.related_posts && values.related_posts.length > 0) {
      const { error: deleteError } = await supabase
        .from('blog_post_relations')
        .delete()
        .eq('blog_post_id', data.id);

      if (deleteError) {
        console.error("Error deleting related posts relationships:", deleteError);
        throw new Error(deleteError.message || "Failed to delete related posts relationships");
      }

      for (const relatedPostId of values.related_posts) {
        const { error: insertError } = await supabase
          .from('blog_post_relations')
          .insert({ blog_post_id: data.id, related_blog_post_id: relatedPostId, relation_type: 'related' });

        if (insertError) {
          console.error("Error inserting related post relationship:", insertError);
          throw new Error(insertError.message || "Failed to insert related post relationship");
        }
      }
    }
    
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    revalidatePath('/'); // Revalidate homepage since it shows featured blog posts
    if (data?.slug) {
      revalidatePath(`/blog/${data.slug}`);
    }

    // Return the saved data
    return data;
  } catch (error: unknown) {
    console.error("Error saving blog post:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save blog post";
    throw new Error(errorMessage);
  }
}

export async function publishBlogPost(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ published: true })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    revalidatePath('/');
    if (data?.slug) {
      revalidatePath(`/blog/${data.slug}`);
    }
  } catch (error: unknown) {
    console.error("Error publishing blog post:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to publish blog post";
    throw new Error(errorMessage);
  }
}

export async function unpublishBlogPost(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ published: false })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) {
      throw error;
    }
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    revalidatePath('/');
    if (data?.slug) {
      revalidatePath(`/blog/${data.slug}`);
    }
  } catch (error: unknown) {
    console.error("Error unpublishing blog post:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to unpublish blog post";
    throw new Error(errorMessage);
  }
}