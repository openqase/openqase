// src/app/paths/algorithm/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { fetchContentBySlug, generateStaticParamsFor } from '@/cms/page-helpers';
import type { Database } from '@/types/supabase';
import ProfessionalAlgorithmDetailLayout from '@/components/ui/professional-algorithm-detail-layout';
import { Badge } from '@/components/ui/badge';
import { processMarkdown } from '@/lib/markdown-server';
import { StepsRenderer } from '@/components/ui/StepsRenderer';
import { ReferencesRenderer, processContentWithReferences } from '@/components/ui/ReferencesRenderer';
import { AutoSchema } from '@/components/AutoSchema';
import Link from 'next/link';

// Define enriched types using flat relationship shapes from the CMS engine
type EnrichedAlgorithm = Database['public']['Tables']['algorithms']['Row'] & {
  industries?: { id: string; name: string; slug?: string | null }[];
  personas?: { id: string; name: string; slug?: string | null }[];
  case_studies?: { id: string; title: string; slug: string; description: string; published_at: string; published: boolean | null }[];
};

type CaseStudy = {
  id: string;
  title: string;
  slug: string;
  description: string;
  industries: string[];
};

interface AlgorithmPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Get metadata for the page
export async function generateMetadata({ params }: AlgorithmPageProps) {
  const resolvedParams = await params;

  const algorithm = await fetchContentBySlug('algorithms', resolvedParams.slug) as EnrichedAlgorithm | null;

  if (!algorithm) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  const title = `${algorithm.name} | Quantum Algorithm - OpenQase`;
  const description = algorithm.description || `Learn about the ${algorithm.name} quantum computing algorithm`;

  return {
    title,
    description,
    alternates: {
      canonical: `/paths/algorithm/${resolvedParams.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      images: ['/og-image.svg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.svg'],
    },
  };
}

// Generate static params for all published algorithms
export const generateStaticParams = generateStaticParamsFor('algorithms')

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed industry) within 1 hour
export const revalidate = 86400;

export default async function AlgorithmPage({ params }: AlgorithmPageProps) {
  const resolvedParams = await params;

  const algorithm = await fetchContentBySlug('algorithms', resolvedParams.slug) as EnrichedAlgorithm | null;

  if (!algorithm) {
    notFound();
  }

  // Flat relationship shape from the CMS engine
  const caseStudies: CaseStudy[] = (algorithm.case_studies || []).map(cs => ({
    id: cs.id,
    title: cs.title,
    slug: cs.slug,
    description: cs.description,
    industries: [] // Not fetched in algorithm relationship query
  }));

  // Process content with server-side markdown and references
  let processedContent = '';
  if (algorithm.main_content) {
    // Process reference citations in raw markdown first, then render + sanitize
    const contentWithReferences = processContentWithReferences(algorithm.main_content);
    processedContent = processMarkdown(contentWithReferences);
  }

  return (
    <>
      <AutoSchema type="course" data={algorithm} courseType="algorithm" />
      <AutoSchema
        type="breadcrumb"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Algorithms', url: '/paths/algorithm' },
          { name: algorithm.name, url: `/paths/algorithm/${algorithm.slug}` }
        ]}
      />
      <ProfessionalAlgorithmDetailLayout
        title={algorithm.name}
        description={algorithm.description || ''}
        backLinkText="Back to Algorithms"
        backLinkHref="/paths/algorithm"
        algorithm={algorithm}
      >
        <div dangerouslySetInnerHTML={{ __html: processedContent }} />

            {algorithm.steps && (
              <div className="my-12">
                <hr className="my-12 border-border/50" />
                <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                  <h2 className="text-2xl font-bold mb-6 text-foreground">Implementation Steps</h2>
                  <StepsRenderer stepsMarkup={algorithm.steps} />
                </div>
              </div>
            )}

            {algorithm.academic_references && (
              <div className="my-12">
                <hr className="my-12 border-border/50" />
                <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                  <ReferencesRenderer referencesMarkup={algorithm.academic_references} />
                </div>
              </div>
            )}

            {/* Related Case Studies Section */}
            {caseStudies.length > 0 && (
              <div className="mt-12">
                <hr className="my-12 border-border/50" />
                <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                  <h2 className="text-2xl font-bold mb-6">Related Case Studies</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {caseStudies.map((cs) => (
                      <Link key={cs.id} href={`/case-study/${cs.slug}`} className="block group">
                        <div className="p-4 rounded-lg border border-border/30 bg-background/50 transition-all duration-200 hover:bg-accent/5 hover:border-border">
                          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary line-clamp-2">
                            {cs.title}
                          </h3>
                          <p className="text-muted-foreground mb-3 line-clamp-3 text-sm">
                            {cs.description}
                          </p>
                          {cs.industries && cs.industries.length > 0 && (
                             <div className="flex flex-wrap gap-1.5">
                                {cs.industries.map((industryName) => (
                                   <Badge key={industryName} variant="outline" className="text-xs">
                                      {industryName}
                                   </Badge>
                                ))}
                             </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
        </ProfessionalAlgorithmDetailLayout>
    </>
  );
}
