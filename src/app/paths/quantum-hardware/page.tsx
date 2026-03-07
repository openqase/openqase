import { Metadata } from 'next'
import { getStaticContentList } from '@/lib/content-fetchers'
import type { Database } from '@/types/supabase'
import { QuantumHardwareClient } from './client'

export const metadata: Metadata = {
  title: 'Quantum Hardware | Processors, Systems & Computing Platforms - OpenQase',
  description: 'Discover quantum processors, systems, and computing platforms used in quantum computing case studies. Explore IBM Quantum, Google Sycamore, Rigetti, and more.',
}

export type QuantumHardware = Database['public']['Tables']['quantum_hardware']['Row']

export const revalidate = 86400;

export default async function QuantumHardwarePage() {
  const quantumHardware = await getStaticContentList('quantum_hardware') as QuantumHardware[]
  const publishedHardware = quantumHardware.filter(hardware => hardware.published === true)

  return (
    <QuantumHardwareClient 
      items={publishedHardware}
      totalCount={publishedHardware.length}
    />
  )
}