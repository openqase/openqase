import { Metadata } from 'next'
import { AdminTrashPage } from '@/components/admin/AdminTrashPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trash - Quantum Companies',
  description: 'Manage deleted quantum companies'
}

export default function TrashPage() {
  return <AdminTrashPage typeSlug="quantum-companies" />
}
