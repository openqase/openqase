import { Metadata } from 'next'
import { AdminTrashPage } from '@/components/admin/AdminTrashPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trash - Case Studies',
  description: 'Manage deleted case studies'
}

export default function TrashPage() {
  return <AdminTrashPage typeSlug="case-studies" />
}
