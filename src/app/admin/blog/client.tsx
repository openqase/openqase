'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff,
  Search,
  ArrowUpDown
} from 'lucide-react';
import { Tables } from '@/types/supabase';

interface BlogPostsListProps {
  initialBlogPosts: Tables<'blog_posts'>[];
}

export function BlogPostsList({ initialBlogPosts }: BlogPostsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [blogPosts, setBlogPosts] = useState(initialBlogPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [blogPostToDelete, setBlogPostToDelete] = useState<Tables<'blog_posts'> | null>(null);
  const [sortField, setSortField] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter blog posts based on search term
  const filteredBlogPosts = blogPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Sort blog posts
  const sortedBlogPosts = [...filteredBlogPosts].sort((a, b) => {
    // Sort by published_at (desc), then created_at (desc)
    const aDate = a.published_at || a.created_at;
    const bDate = b.published_at || b.created_at;
    if (aDate && bDate) {
      return sortDirection === 'asc'
        ? (aDate > bDate ? 1 : -1)
        : (aDate < bDate ? 1 : -1);
    }
    return 0;
  });
  
  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle publish/unpublish
  const handlePublishToggle = async (blogPost: Tables<'blog_posts'>) => {
    try {
      const response = await fetch(`/api/blog-posts?id=${blogPost.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: !blogPost.published,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update published status');
      }
      
      // Update local state
      setBlogPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === blogPost.id 
            ? { ...post, published: !post.published } 
            : post
        )
      );
      
      toast({
        title: blogPost.published ? 'Blog post unpublished' : 'Blog post published',
        description: `"${blogPost.title}" is now ${blogPost.published ? 'unpublished' : 'published'}`,
        duration: 3000,
      });
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update published status',
        duration: 5000,
      });
    }
  };
  
  // Handle featured toggle
  const handleFeaturedToggle = async (blogPost: Tables<'blog_posts'>) => {
    try {
      const response = await fetch(`/api/blog-posts?id=${blogPost.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featured: !blogPost.featured,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update featured status');
      }
      
      // Update local state
      setBlogPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === blogPost.id 
            ? { ...post, featured: !post.featured } 
            : post
        )
      );
      
      toast({
        title: blogPost.featured ? 'Blog post unfeatured' : 'Blog post featured',
        description: `"${blogPost.title}" is now ${blogPost.featured ? 'unfeatured' : 'featured'}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update featured status',
        duration: 5000,
      });
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!blogPostToDelete) return;
    
    try {
      const response = await fetch('/api/blog-posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blogPostToDelete.id })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete blog post: ${error}`);
      }
      
      // Update local state
      setBlogPosts(prevPosts => 
        prevPosts.filter(post => post.id !== blogPostToDelete.id)
      );
      
      toast({
        title: 'Blog post moved to trash',
        description: `"${blogPostToDelete.title}" has been moved to trash`,
        duration: 3000,
      });
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      setBlogPostToDelete(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete blog post',
        duration: 5000,
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/blog/trash">
              <Trash2 className="mr-2 h-4 w-4" />
              Trash
            </Link>
          </Button>
          <Button onClick={() => router.push('/admin/blog/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search blog posts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  Title
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('category')}
                >
                  Category
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBlogPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No blog posts found matching your search' : 'No blog posts found'}
                </TableCell>
              </TableRow>
            ) : (
              sortedBlogPosts.map((post) => {
                // Determine status
                const now = new Date();
                let status = 'Draft';
                if (post.published) {
                  if (post.published_at && new Date(post.published_at) > now) {
                    status = 'Scheduled';
                  } else {
                    status = 'Published';
                  }
                }
                // Determine date to show
                const dateToShow = post.published_at || post.created_at;
                const dateLabel = status === 'Draft' ? 'Created' : 'Published';
                return (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {post.featured && (
                          <Star className="mr-2 h-4 w-4 text-yellow-500" />
                        )}
                        <Link 
                          href={`/admin/blog/${post.id}`}
                          className="hover:underline"
                        >
                          {post.title}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{post.category || '-'}</TableCell>
                    <TableCell>{post.author || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.tags && post.tags.length > 0 ? (
                          post.tags.slice(0, 3).map((tag: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          '-'
                        )}
                        {post.tags && post.tags.length > 3 && (
                          <Badge variant="outline">+{post.tags.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {dateToShow ? new Date(dateToShow).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {status === 'Published' && (
                        <span className="inline-block px-2 py-1 rounded bg-orange-600 text-white text-xs font-semibold">Published</span>
                      )}
                      {status === 'Draft' && (
                        <span className="inline-block px-2 py-1 rounded bg-muted text-foreground text-xs font-semibold border">Draft</span>
                      )}
                      {status === 'Scheduled' && (
                        <span className="inline-block px-2 py-1 rounded bg-blue-600 text-white text-xs font-semibold">Scheduled</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/blog/${post.id}`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePublishToggle(post)}>
                            {post.published ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFeaturedToggle(post)}>
                            {post.featured ? (
                              <>
                                <StarOff className="mr-2 h-4 w-4" />
                                Unfeature
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-4 w-4" />
                                Feature
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setBlogPostToDelete(post);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the blog post 
              "{blogPostToDelete?.title}"? It will be moved to trash and can be recovered later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BlogPostsList;