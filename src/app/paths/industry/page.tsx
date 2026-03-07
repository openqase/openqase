// src/app/paths/industry/page.tsx
import { Metadata } from 'next';
import { getStaticContentList } from '@/lib/content-fetchers';
import IndustryList from '@/components/IndustryList';
import ProfessionalIndustriesLayout from '@/components/ui/professional-industries-layout';
import type { Database } from '@/types/supabase';

export const metadata: Metadata = {
  title: 'Quantum Computing by Industry | Financial, Healthcare, Energy Applications - OpenQase',
  description: 'Industry-specific quantum computing applications for finance, healthcare, energy, and manufacturing. Discover sector-relevant use cases and implementation strategies.',
};

type Industry = Database['public']['Tables']['industries']['Row'];

export const revalidate = 86400;

export default async function IndustriesPage() {
  const industries = await getStaticContentList('industries') as Industry[];
  
  // Calculate sector count for metrics (using a default since industries don't have sectors)
  const uniqueSectors = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Other'];

  return (
    <ProfessionalIndustriesLayout 
      title="Quantum Industries"
      industryCount={industries.length}
      sectorCount={uniqueSectors.length}
    >
      <IndustryList industries={industries} />
    </ProfessionalIndustriesLayout>
  );
}