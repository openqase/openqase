import { Metadata } from 'next'
import { AdminTrashPage } from '@/components/admin/AdminTrashPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trash - Partner Companies',
  description: 'Manage deleted partner companies'
}

export default function TrashPage() {
  return <AdminTrashPage typeSlug="partner-companies" />
}
