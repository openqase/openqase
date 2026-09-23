import { Metadata } from 'next'
import { AdminTrashPage } from '@/components/admin/AdminTrashPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trash - Industries',
  description: 'Manage deleted industries'
}

export default function TrashPage() {
  return <AdminTrashPage typeSlug="industries" />
}
