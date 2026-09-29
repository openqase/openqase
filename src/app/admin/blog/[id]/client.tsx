'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RelationshipSelector } from '@/components/admin/RelationshipSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { TagInput } from '@/components/ui/tag-input';
import { ContentCompleteness } from '@/components/admin/ContentCompleteness';
import { PublishButton } from '@/components/admin/PublishButton';
import { createContentValidationRules, calculateCompletionPercentage, validateFormValues } from '@/utils/form-validation';
import { useTransition } from 'react';
import { ArrowLeft, Save, Loader2, Eye } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { saveBlogPost, publishBlogPost, unpublishBlogPost } from './actions';
import { Tables } from '@/types/supabase';

interface BlogPostWithRelations extends Tables<'blog_posts'> {
  related_posts?: string[];
}

interface BlogPostFormProps {
  blogPost: BlogPostWithRelations | null;
  relatedPosts: Array<{ id: string; title: string; slug: string }>;
  isNew: boolean;
}

/**
 * BlogPostForm Component
 *
 * A simplified form for blog posts with all fields on a single page.
 *
 * @param blogPost - Initial blog post data
 * @param relatedPosts - Available blog posts for relationships
 * @param isNew - Whether this is a new blog post
 */
export function BlogPostForm({ blogPost, relatedPosts, isNew }: BlogPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    id: isNew ? undefined : blogPost?.id,
    title: isNew ? '' : blogPost?.title || '',
    slug: isNew ? '' : blogPost?.slug || '',
    description: isNew ? '' : blogPost?.description || '',
    content: isNew ? '' : blogPost?.content || '',
    author: isNew ? '' : blogPost?.author || '',
    featured_image: isNew ? '' : blogPost?.featured_image || '',
    category: isNew ? '' : blogPost?.category || '',
    tags: isNew ? [] : blogPost?.tags || [],
    related_posts: isNew ? [] : blogPost?.related_posts?.map((post: any) => post.id) || [],
    published: isNew ? false : blogPost?.published || false,
    featured: isNew ? false : blogPost?.featured || false,
    published_at: isNew ? null : blogPost?.published_at || null,
  });
  const [isDirty, setIsDirty] = useState(false);
  
  // Validation rules for blog posts
  const validationRules = createContentValidationRules('blog_post');
  const completionPercentage = calculateCompletionPercentage({ values, validationRules });
  
  // Handle field change
  const handleChange = (field: string, value: any) => {
    const newValues = {
      ...values,
      [field]: value
    };
    
    // Auto-generate slug from title if slug is empty
    if (field === 'title' && value && !values.slug) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
      newValues.slug = autoSlug;
    }
    
    setValues(newValues);
    setIsDirty(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        const result = await saveBlogPost(values);
        
        // If this was a new blog post and we got an ID back, redirect to edit page
        if (isNew && result?.id) {
          router.push(`/admin/blog/${result.id}`);
        }
        
        setIsDirty(false);
        
        toast({
          title: 'Saved',
          description: 'Blog post saved successfully',
          duration: 3000,
        });
      } catch (error) {
        console.error("Error in handleSave:", error);
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save blog post',
          duration: 5000,
        });
      }
    });
  };
  
  // Handle publishing
  const handlePublish = async () => {
    if (!values.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot publish blog post without saving first',
        duration: 3000,
      });
      return;
    }
    
    if (!values.slug || !values.title) {
      toast({
        variant: 'destructive',
        title: 'Cannot Publish',
        description: 'Title and slug are required before publishing',
        duration: 3000,
      });
      return;
    }
    
    startTransition(async () => {
      try {
        // First save the content
        await saveBlogPost(values);
        
        // Then publish it
        await publishBlogPost(values.id!);
        
        setValues(prev => ({ ...prev, published: true }));
        
        toast({
          title: 'Published',
          description: 'Blog post is now published and visible to users',
          duration: 3000,
        });
      } catch (error) {
        console.error("Error in handlePublish:", error);
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to publish blog post',
          duration: 5000,
        });
      }
    });
  };
  
  // Handle unpublishing
  const handleUnpublish = async () => {
    if (!values.id) return;
    
    startTransition(async () => {
      try {
        await unpublishBlogPost(values.id!);
        
        setValues(prev => ({ ...prev, published: false }));
        
        toast({
          title: 'Unpublished',
          description: 'Blog post is now unpublished and hidden from users',
          duration: 3000,
        });
      } catch (error) {
        console.error("Error in handleUnpublish:", error);
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to unpublish blog post',
          duration: 5000,
        });
      }
    });
  };
  
  // Validate content before publishing
  const validateContent = () => {
    const issues = validateFormValues({
      values,
      validationRules
    });
    
    return Object.keys(issues).length === 0 ? true : issues;
  };
  
  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-24">
      {/* Top controls and progress bar, styled like case study edit page */}
      <div className="pt-6 mb-8 bg-background pb-4 border-b border-border">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/blog')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSubmit}
              disabled={isPending || !isDirty}
              className="min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Open preview in new tab (draft mode via /api/preview)
                const previewUrl = `/api/preview?type=blog&slug=${encodeURIComponent(values.slug)}`;
                window.open(previewUrl, '_blank');
              }}
              disabled={!values.id || !values.slug}
              className="min-w-[100px]"
              title={!values.id || !values.slug ? "Save the blog post first to preview" : "Preview blog post"}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <PublishButton
              isPublished={values.published}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              validateContent={validateContent}
              disabled={isPending}
              onTabChange={() => {}}
              getTabLabel={() => ''}
            />
          </div>
        </div>
        {/* Progress bar section */}
        <div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-muted-foreground">Content Completeness</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <ContentCompleteness percentage={completionPercentage} showLabel={false} />
        </div>
      </div>
      {/* Form starts here */}
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Basic Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Blog post title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={values.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="blog-post-slug"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={values.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                  placeholder="Author name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={values.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="Blog category"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <TagInput
                  tags={values.tags}
                  onTagsChange={(newTags) => handleChange('tags', newTags)}
                  placeholder="Add tag..."
                />
              </div>

              {/* Publish Date Picker */}
              <div className="space-y-2">
                <Label htmlFor="published_at">Publish Date</Label>
                <Input
                  id="published_at"
                  type="date"
                  value={values.published_at || ''}
                  onChange={(e) => {
                    handleChange('published_at', e.target.value);
                  }}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="featured"
                  checked={values.featured}
                  onCheckedChange={(checked) => {
                    handleChange('featured', !!checked);
                  }}
                />
                <Label htmlFor="featured">Featured post</Label>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Content Section */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={values.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of the blog post"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={values.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Blog post content in Markdown format"
                rows={20}
                className="font-mono"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Featured Image Section */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="featured_image">Featured Image URL</Label>
              <Input
                id="featured_image"
                value={values.featured_image}
                onChange={(e) => handleChange('featured_image', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {values.featured_image && (
                <div className="mt-4">
                  <Label>Image Preview</Label>
                  <div className="p-4 border rounded-md mt-2 flex items-center justify-center">
                    {/* Use client-side only rendering to avoid hydration errors */}
                    {typeof window !== 'undefined' && (
                      <Image
                        src={values.featured_image}
                        alt="Featured Image Preview"
                        className="max-h-40 object-contain"
                        width={160}
                        height={160}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Related Content Section */}
        <Card>
          <CardHeader>
            <CardTitle>Related Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RelationshipSelector
              items={relatedPosts.filter(post => post.id !== values.id)} // Exclude current post
              selectedItems={values.related_posts}
              onChange={(selectedItems) => handleChange('related_posts', selectedItems)}
              itemLabelKey="title"
              itemValueKey="id"
              label="Related Blog Posts"
              placeholder="Select related posts..."
            />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default BlogPostForm;