import { Metadata } from 'next'
import { getStaticContentList } from '@/lib/content-fetchers'
import type { Database } from '@/types/supabase'
import { QuantumSoftwareClient } from './client'

export const metadata: Metadata = {
  title: 'Quantum Software | Frameworks, Libraries & Development Tools - OpenQase',
  description: 'Explore quantum software platforms, frameworks, and development tools used in quantum computing case studies. Discover Qiskit, Cirq, PennyLane, and more.',
}

export type QuantumSoftware = Database['public']['Tables']['quantum_software']['Row']

export const revalidate = 3600;

export default async function QuantumSoftwarePage() {
  const quantumSoftware = await getStaticContentList('quantum_software') as QuantumSoftware[]
  const publishedSoftware = quantumSoftware.filter(software => software.published === true)

  return (
    <QuantumSoftwareClient 
      items={publishedSoftware}
      totalCount={publishedSoftware.length}
    />
  )
}