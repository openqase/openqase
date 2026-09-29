import { Metadata } from 'next'
import { AdminTrashPage } from '@/components/admin/AdminTrashPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trash - Quantum Hardware',
  description: 'Manage deleted quantum hardware'
}

export default function TrashPage() {
  return <AdminTrashPage typeSlug="quantum-hardware" />
}
