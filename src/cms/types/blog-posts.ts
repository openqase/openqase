import { defineContentType } from '../define'

export const blogPosts = defineContentType({
  slug: 'blog-posts',
  tableName: 'blog_posts',
  label: { singular: 'Blog Post', plural: 'Blog Posts' },
  basePath: '/blog',
  adminPath: '/admin/blog',
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 300 },
    { name: 'slug', type: 'slug', from: 'title' },
    { name: 'description', type: 'textarea', maxLength: 1000 },
    { name: 'content', type: 'markdown' },
    { name: 'author', type: 'text' },
    { name: 'category', type: 'text' },
    { name: 'featured_image', type: 'url' },
    { name: 'featured', type: 'boolean' },
    { name: 'published_at', type: 'text' },
  ],
  relationships: [
    {
      name: 'related_posts',
      targetType: 'blog-posts',
      junction: 'blog_post_relations',
      foreignKey: 'blog_post_id',
      targetKey: 'related_blog_post_id',
      junctionForeignKeyHint: 'blog_post_relations_blog_post_id_fkey',
      targetForeignKeyHint: 'blog_post_relations_related_blog_post_id_fkey',
      selectFields: ['id', 'title', 'slug', 'description', 'published_at', 'author', 'category', 'tags'],
      extraJunctionFields: { relation_type: 'related' },
    },
  ],
  metadata: { titleField: 'title', descriptionField: 'description' },
})
