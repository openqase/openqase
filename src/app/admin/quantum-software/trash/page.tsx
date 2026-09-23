import { Metadata } from 'next'
import { AdminTrashPage } from '@/components/admin/AdminTrashPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trash - Quantum Software',
  description: 'Manage deleted quantum software'
}

export default function TrashPage() {
  return <AdminTrashPage typeSlug="quantum-software" />
}
