import { Metadata } from 'next';
import { getStaticContentList } from '@/lib/content-fetchers';
import { CaseStudiesList } from '@/components/CaseStudiesList';
import { getCaseStudyRelationshipMap } from '@/lib/relationship-queries';
import type { Database } from '@/types/supabase';

export const metadata: Metadata = {
  title: 'Quantum Computing Case Studies | Real-World Business Applications - OpenQase',
  description: 'Explore real quantum computing implementations across industries. See how companies like HSBC, Google, and Mitsui apply quantum algorithms to solve business challenges.',
};

type CaseStudy = Database['public']['Tables']['case_studies']['Row'];

export const revalidate = 86400;

export default async function CaseStudyPage() {
  const caseStudies = await getStaticContentList<CaseStudy>('case_studies', {
    orderBy: 'updated_at',
    orderDirection: 'desc'
  });

  // Fetch relationships for all case studies (for sidebar filters and tag pills)
  const caseStudyIds = caseStudies.map(cs => cs.id);
  const relationshipMap = caseStudyIds.length > 0
    ? await getCaseStudyRelationshipMap(caseStudyIds)
    : {};

  return (
    <div className="min-h-screen">
      <div className="container-outer section-spacing">
        <div className="max-w-2xl mb-8 md:mb-12">
          <h1 className="mb-4">
            Case Studies
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Explore real-world applications of quantum computing across different industries and use cases.
          </p>
        </div>
        <CaseStudiesList
          caseStudies={caseStudies}
          relationshipMap={relationshipMap}
        />
      </div>
    </div>
  );
}
