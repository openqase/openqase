// src/app/paths/algorithm/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getStaticContentWithRelationships, generateStaticParamsForContentType } from '@/lib/content-fetchers';
import type { Database } from '@/types/supabase';
import ProfessionalAlgorithmDetailLayout from '@/components/ui/professional-algorithm-detail-layout';
import { Badge } from '@/components/ui/badge';
import { processMarkdown } from '@/lib/markdown-server';
import { StepsRenderer } from '@/components/ui/StepsRenderer';
import { ReferencesRenderer, processContentWithReferences } from '@/components/ui/ReferencesRenderer';
import Link from 'next/link';

// Define enriched types
type EnrichedAlgorithm = Database['public']['Tables']['algorithms']['Row'] & {
  steps?: string;
  academic_references?: string;
  algorithm_industry_relations?: { industries: { id: string; name: string; slug?: string | null } | null }[];
  persona_algorithm_relations?: { personas: { id: string; name: string; slug?: string | null } | null }[];
  algorithm_case_study_relations?: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }[];
};

type CaseStudy = {
  id: string;
  title: string;
  slug: string;
  description: string;
  industries: string[];
};

// Define an enriched type for CaseStudy that includes relations
type EnrichedCaseStudyForAlgorithmPage = Database['public']['Tables']['case_studies']['Row'] & {
  case_study_industry_relations?: { industries: { id: string; name: string; slug?: string | null } | null }[];
};

interface AlgorithmPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Get metadata for the page
export async function generateMetadata({ params }: AlgorithmPageProps) {
  const resolvedParams = await params;
  
  const algorithm = await getStaticContentWithRelationships('algorithms', resolvedParams.slug) as EnrichedAlgorithm;
  
  if (!algorithm) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  return {
    title: algorithm.name,
    description: algorithm.description,
  };
}

// Generate static params for all published algorithms
export async function generateStaticParams() {
  return generateStaticParamsForContentType('algorithms');
}

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed industry) within 1 hour
export const revalidate = 3600;

export default async function AlgorithmPage({ params }: AlgorithmPageProps) {
  const resolvedParams = await params;
  
  const algorithm = await getStaticContentWithRelationships('algorithms', resolvedParams.slug) as EnrichedAlgorithm;
  
  if (!algorithm) {
    notFound();
  }

  // Extract related case studies from the algorithm data
  // The improved relationship filtering ensures case_studies is never null
  const caseStudies: CaseStudy[] = algorithm.algorithm_case_study_relations?.map((relation: any) => ({
    id: relation.case_studies?.id || '',
    title: relation.case_studies?.title || 'Untitled Case Study',
    slug: relation.case_studies?.slug || '',
    description: relation.case_studies?.description || '',
    industries: [] // Case study industries aren't fetched in the algorithm relationship query
  })).filter(cs => cs.id && cs.slug) || []; // Filter out any malformed entries

  // Process content with server-side markdown and references
  let processedContent = '';
  if (algorithm.main_content) {
    // First render markdown to HTML
    const htmlContent = processMarkdown(algorithm.main_content);
    // Then process references 
    const contentWithReferences = processContentWithReferences(htmlContent);
    processedContent = contentWithReferences;
  }

  return (
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
  );
}