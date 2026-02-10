import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import Link from "next/link";
import { Metadata } from 'next';
import { getStaticContentWithRelationships, generateStaticParamsForContentType } from '@/lib/content-fetchers';
import { EnrichedBlogPost } from '@/lib/types';
import { processMarkdown } from '@/lib/markdown-server';
import { AutoSchema } from '@/components/AutoSchema';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return generateStaticParamsForContentType('blog_posts');
}

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed tag) within 1 hour
export const revalidate = 3600;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  
  const blogPost = await getStaticContentWithRelationships<EnrichedBlogPost>('blog_posts', resolvedParams.slug);
    
  if (!blogPost) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }
  
  return {
    title: `${blogPost.title} - OpenQASE Blog`,
    description: blogPost.description || 'Blog post from OpenQASE',
    alternates: {
      canonical: `/blog/${resolvedParams.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  
  const blogPost = await getStaticContentWithRelationships<EnrichedBlogPost>('blog_posts', resolvedParams.slug);
    
  if (!blogPost) {
    notFound();
  }

  // Process content with server-side markdown
  const processedContent = blogPost.content ? await processMarkdown(blogPost.content) : '';

  // Extract related blog posts from the relationships, filter out those without slugs
  const relatedPosts = (blogPost.blog_post_relations?.map(relation => relation.related_blog_posts) || [])
    .filter(post => post && post.slug);

  return (
    <>
      {/* Schema markup for SEO */}
      <AutoSchema type="blog-post" data={blogPost} />
      <AutoSchema 
        type="breadcrumb" 
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: blogPost.title, url: `/blog/${blogPost.slug}` }
        ]} 
      />
      
      <main className="min-h-screen">
        <div className="container-outer section-spacing">
        <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-12">
          <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
            ← Back to Blog
          </Link>
        </div>
        
        {/* Header - Professional Typography */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">{blogPost.title}</h1>
          
          <div className="flex items-center text-muted-foreground mb-6 text-base">
            {blogPost.published_at && (
              <span className="mr-6">{new Date(blogPost.published_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
            )}
            {blogPost.author && (
              <span>By {blogPost.author}</span>
            )}
          </div>
          
          {blogPost.category && (
            <Badge variant="outline" className="mr-2">
              {blogPost.category}
            </Badge>
          )}
          
          {blogPost.tags && blogPost.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="mr-2">
              {tag}
            </Badge>
          ))}
        </div>
        
        {/* Content */}
        <div className="prose prose-base md:prose-lg dark:prose-invert max-w-full md:max-w-none mb-12 md:mb-16">
          {processedContent && (
            <div dangerouslySetInnerHTML={{ __html: processedContent }} />
          )}
        </div>
        
        {/* Related Blog Posts Section - Mobile-Friendly Styling */}
        {relatedPosts.length > 0 && (
          <div className="bg-muted/20 border-y border-border py-8 md:py-12">
            <div className="container-outer">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 md:mb-4">Related Articles</h2>
                  <p className="text-base md:text-lg text-muted-foreground">Continue exploring quantum computing insights</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {relatedPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                      <div className="bg-card border border-border rounded-lg p-4 md:p-6 hover:border-primary transition-colors">
                        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 md:mb-3 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                          {post.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
    </>
  );
}