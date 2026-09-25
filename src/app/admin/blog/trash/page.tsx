import { Metadata } from 'next'
import { AdminTrashPage } from '@/components/admin/AdminTrashPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trash - Blog Posts',
  description: 'Manage deleted blog posts'
}

export default function TrashPage() {
  return <AdminTrashPage typeSlug="blog-posts" />
}
