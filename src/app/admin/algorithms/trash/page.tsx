import { Metadata } from 'next'
import { AdminTrashPage } from '@/components/admin/AdminTrashPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trash - Algorithms',
  description: 'Manage deleted algorithms'
}

export default function TrashPage() {
  return <AdminTrashPage typeSlug="algorithms" />
}
