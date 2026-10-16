import { notFound } from 'next/navigation';
import { BlogPostForm } from './client';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { Tables } from '@/types/supabase';

type BlogPostWithRelated = Tables<'blog_posts'> & {
  related_posts?: string[];
};

interface BlogPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  // Resolve params to fix NextJS 15 error
  const resolvedParams = await params;
  
  // Create Supabase client
  const supabase = createServiceRoleSupabaseClient();
  
  // Check if this is a new blog post
  const isNew = resolvedParams.id === 'new';
  
  let blogPost = null;
  
  if (!isNew) {
    // Fetch the blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();
    
    if (error || !data) {
      notFound();
    }
    
    blogPost = data;
    
    // Fetch related posts
    const { data: relatedPostsData } = await supabase
      .from('blog_post_relations')
      .select('related_blog_post_id')
      .eq('blog_post_id', resolvedParams.id);
    
    if (relatedPostsData && relatedPostsData.length > 0) {
      const relatedPostIds = relatedPostsData.map(rel => rel.related_blog_post_id).filter((id): id is string => id !== null);
      
      const { data: relatedPosts } = await supabase
        .from('blog_posts')
        .select('id, title, slug')
        .in('id', relatedPostIds);
      
      if (relatedPosts) {
        // Add related_posts property (store IDs, not full objects)
        (blogPost as BlogPostWithRelated).related_posts = relatedPosts.map(post => post.id);
      }
    } else {
      // Add related_posts property
      (blogPost as BlogPostWithRelated).related_posts = [];
    }
  }
  
  // Fetch all blog posts for related posts selection
  const { data: allBlogPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug')
    .is('deleted_at', null)
    .order('title', { ascending: true });
  
  return (
    <div>
      <BlogPostForm 
        blogPost={blogPost} 
        relatedPosts={allBlogPosts || []} 
        isNew={isNew} 
      />
    </div>
  );
}