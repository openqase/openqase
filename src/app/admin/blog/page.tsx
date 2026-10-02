import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { BlogPostsList } from './client';

export const dynamic = 'force-dynamic'

export default async function BlogPostsPage() {
  const supabase = createServiceRoleSupabaseClient();
  
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .is('deleted_at', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  
  return (
    <div className="container mx-auto py-8">
      <BlogPostsList initialBlogPosts={blogPosts || []} />
    </div>
  );
}