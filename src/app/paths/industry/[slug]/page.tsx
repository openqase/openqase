// src/app/paths/industry/[slug]/page.tsx
import { getStaticContentWithRelationships, generateStaticParamsForContentType } from '@/lib/content-fetchers';
import { Database } from '@/types/supabase';
import ProfessionalIndustryDetailLayout from '@/components/ui/professional-industry-detail-layout';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { processMarkdown } from '@/lib/markdown-server';
import { SupabaseClient } from '@supabase/supabase-js';

// Define enriched types
type EnrichedIndustry = Database['public']['Tables']['industries']['Row'] & {
  algorithm_industry_relations?: { algorithms: { id: string; name: string; slug?: string | null } | null }[];
  persona_industry_relations?: { personas: { id: string; name: string; slug?: string | null } | null }[];
  case_study_industry_relations?: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }[];
};

// Simple type for case studies from industry relations (only includes fetched fields)
type IndustryRelatedCaseStudy = {
  id: string;
  title: string;
  slug: string;
  description: string;
  published_at: string;
};

interface PageParams {
  params: Promise<{
    slug: string;
  }>;
}

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  industries: string[];
}

// Get metadata for the page
export async function generateMetadata({ params }: PageParams) {
  const resolvedParams = await params;
  
  const industry = await getStaticContentWithRelationships('industries', resolvedParams.slug) as EnrichedIndustry;
  
  if (!industry) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  return {
    title: industry.name,
    description: industry.description,
  };
}

// Generate static params for all published industries
export async function generateStaticParams() {
  return generateStaticParamsForContentType('industries');
}

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed algorithm) within 1 hour
export const revalidate = 3600;

export default async function IndustryPage({ params }: PageParams) {
  const resolvedParams = await params;
  
  // Fetch industry along with related algorithms, personas, and case studies
  const industry = await getStaticContentWithRelationships('industries', resolvedParams.slug) as EnrichedIndustry;

  if (!industry) {
    return <div>Industry not found</div>;
  }
  
  // Extract related case studies from the industry data
  const caseStudies: IndustryRelatedCaseStudy[] = industry.case_study_industry_relations?.map((relation: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }) => relation.case_studies ? ({
    id: relation.case_studies.id,
    title: relation.case_studies.title,
    slug: relation.case_studies.slug,
    description: relation.case_studies.description || '',
    published_at: relation.case_studies.published_at,
  }) : null).filter((cs): cs is IndustryRelatedCaseStudy => cs !== null) || [];

  // Process industry main content with server-side markdown
  const processedContent = processMarkdown(industry.main_content);

  return (
    <ProfessionalIndustryDetailLayout 
      title={industry.name}
      description={industry.description || ''}
      backLinkText="Back to Industries"
      backLinkHref="/paths/industry"
      industry={industry}
    >
      {industry.main_content && (
        <div dangerouslySetInnerHTML={{ __html: processedContent }} />
      )}

      {caseStudies && caseStudies.length > 0 && (
        <div className="mt-12">
          <hr className="my-12 border-border/50" />
          <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
            <h2 className="text-2xl font-bold mb-6">Related Case Studies</h2>
            <div className="grid grid-cols-1 gap-4">
              {caseStudies.map((study) => (
                <Link key={study.id} href={`/case-study/${study.slug}`} className="block group">
                  <div className="p-4 rounded-lg border border-border/30 bg-background/50 transition-all duration-200 hover:bg-accent/5 hover:border-border">
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary line-clamp-2">
                      {study.title}
                    </h3>
                    <p className="text-muted-foreground mb-3 line-clamp-3 text-sm">
                      {study.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </ProfessionalIndustryDetailLayout>
  );
}