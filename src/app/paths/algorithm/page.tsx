// src/app/paths/algorithm/page.tsx
import { getStaticContentList } from '@/lib/content-fetchers';
import AlgorithmList from '@/components/AlgorithmList';
import ProfessionalAlgorithmsLayout from '@/components/ui/professional-algorithms-layout';
import type { Database } from '@/types/supabase';

type Algorithm = Database['public']['Tables']['algorithms']['Row'];

export const revalidate = 86400;

export default async function AlgorithmsPage() {
  const algorithms = await getStaticContentList('algorithms') as Algorithm[];
  
  // Calculate use case count for metrics
  const allUseCases = algorithms.flatMap(alg => alg.use_cases || []);
  const uniqueUseCases = Array.from(new Set(allUseCases));

  return (
    <ProfessionalAlgorithmsLayout 
      title="Quantum Algorithms"
      algorithmCount={algorithms.length}
      useCaseCount={uniqueUseCases.length}
    >
      <AlgorithmList algorithms={algorithms} />
    </ProfessionalAlgorithmsLayout>
  );
}