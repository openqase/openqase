import { Metadata } from 'next'
import { AdminTrashPage } from '@/components/admin/AdminTrashPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trash - Personas',
  description: 'Manage deleted personas'
}

export default function TrashPage() {
  return <AdminTrashPage typeSlug="personas" />
}
