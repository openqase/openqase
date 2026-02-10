import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { getStaticContentList } from '@/lib/content-fetchers';
import { DbBlogPost } from '@/lib/types';
import { Clock, User } from "lucide-react";
import { NewsletterSignup } from '@/components/ui/newsletter-signup';

export default async function BlogPage() {
  const posts = await getStaticContentList<DbBlogPost>('blog_posts', {
    orderBy: 'published_at',
    orderDirection: 'desc'
  });
  
  return (
    <div className="min-h-screen">
      <div className="container-outer section-spacing">
        {/* Hero Section - Professional Magazine Style */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              Blog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Insights, tutorials, and updates from the quantum computing community.
            </p>
          </div>
        </div>
        
        {/* Blog Posts */}
        {posts.length === 0 ? (
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="bg-card border border-border rounded-lg p-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">Coming Soon</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our blog is currently under development. Check back soon for articles, tutorials, and case studies.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6 md:space-y-8 mb-12 md:mb-16">
              {posts.map((post, index) => (
                <Link href={`/blog/${post.slug}`} key={post.id} className="group block">
                  <article className={`bg-card border border-border rounded-lg p-4 md:p-8 hover:border-primary transition-colors duration-200 ${index === 0 ? 'border-primary/20 shadow-sm' : ''}`}>
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3 md:mb-4 text-xs md:text-sm text-muted-foreground">
                          {post.published_at && (
                            <time dateTime={post.published_at}>
                              {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                            </time>
                          )}
                          {post.author && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{post.author}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>5 min read</span>
                          </div>
                          {/* Display all tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex items-center gap-2">
                              {post.tags.map((tag) => (
                                <span key={tag} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Fallback to category if no tags */}
                          {(!post.tags || post.tags.length === 0) && post.category && (
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                              {post.category}
                            </span>
                          )}
                        </div>
                        
                        <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                        
                        {post.description && (
                          <p className="text-muted-foreground leading-relaxed text-base mb-3 line-clamp-3">
                            {post.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-primary font-medium group-hover:underline">
                            Read article →
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Newsletter Signup */}
        <NewsletterSignup />
      </div>
    </div>
  );
}