// src/app/paths/persona/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getStaticContentWithRelationships, generateStaticParamsForContentType } from '@/lib/content-fetchers';
import type { Database } from '@/types/supabase';
import ProfessionalPersonaDetailLayout from '@/components/ui/professional-persona-detail-layout';
import ContentCard from '@/components/ui/content-card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { processMarkdown } from '@/lib/markdown-server';
import { AutoSchema } from '@/components/AutoSchema';

// Define enriched types that match the actual relationship queries
type EnrichedPersona = Database['public']['Tables']['personas']['Row'] & {
  persona_industry_relations?: { industries: { id: string; name: string; slug?: string | null } | null }[];
  case_study_persona_relations?: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }[];
};

// Simple type for case studies from persona relations (only includes fetched fields)
type PersonaRelatedCaseStudy = {
  id: string;
  title: string;
  slug: string;
  description: string;
  published_at: string;
};

// Define an enriched type for CaseStudy that includes relations
type EnrichedCaseStudyForPersonaPage = Database['public']['Tables']['case_studies']['Row'] & {
  case_study_industry_relations?: { industries: { id: string; name: string; slug?: string | null } | null }[];
  // Add other relations here if fetched in the future, e.g., for algorithms
};

type Persona = Database['public']['Tables']['personas']['Row'];
type CaseStudy = Database['public']['Tables']['case_studies']['Row'];

interface PageParams {
  params: Promise<{
    slug: string;
  }>;
}

// Get metadata for the page
export async function generateMetadata({ params }: PageParams) {
  const resolvedParams = await params;
  
  const persona = await getStaticContentWithRelationships('personas', resolvedParams.slug) as EnrichedPersona;

  if (!persona) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  return {
    title: persona.name,
    description: persona.description,
    alternates: {
      canonical: `/paths/persona/${resolvedParams.slug}`,
    },
  };
}

// Generate static params for all published personas
export async function generateStaticParams() {
  return generateStaticParamsForContentType('personas');
}

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed industry) within 1 hour
export const revalidate = 3600;

export default async function PersonaPage({ params }: PageParams) {
  const resolvedParams = await params;
  
  // Get the persona and its related industries and case studies
  const persona = await getStaticContentWithRelationships('personas', resolvedParams.slug) as EnrichedPersona;

  if (!persona) {
    notFound();
  }

  // Extract related case studies from the persona data
  const caseStudies: PersonaRelatedCaseStudy[] = persona.case_study_persona_relations?.map((relation: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }) => relation.case_studies ? ({
    id: relation.case_studies.id,
    title: relation.case_studies.title,
    slug: relation.case_studies.slug,
    description: relation.case_studies.description || '',
    published_at: relation.case_studies.published_at,
  }) : null).filter((cs): cs is PersonaRelatedCaseStudy => cs !== null) || [];

  // Process markdown content with server-side processor
  const renderedContent = processMarkdown(persona.main_content);
  const renderedRecommendedReading = processMarkdown(persona.recommended_reading);

  return (
    <>
      {/* Ghost-style automatic course schema */}
      <AutoSchema type="course" data={persona} courseType="persona" />
      <AutoSchema 
        type="breadcrumb" 
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Paths', url: '/paths' },
          { name: 'Professional Roles', url: '/paths/persona' },
          { name: persona.name, url: `/paths/persona/${persona.slug}` }
        ]} 
      />
      
      <ProfessionalPersonaDetailLayout
        title={persona.name}
        description={persona.description || ''}
        backLinkText="Back to Personas"
        backLinkHref="/paths/persona"
        persona={persona}
      >
        {renderedContent && (
          <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
        )}

        {/* Recommended Reading Section */}
        {persona.recommended_reading && (
          <div className="mt-12">
            <hr className="my-12 border-border/50" />
            <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Recommended Reading</h2>
              <div
                className="prose dark:prose-invert max-w-none prose-a:text-primary prose-a:hover:underline"
                dangerouslySetInnerHTML={{ __html: renderedRecommendedReading }}
              />
            </div>
          </div>
        )}

        {/* Related Case Studies */}
        {caseStudies.length > 0 && (
          <div className="mt-12">
            <hr className="my-12 border-border/50" />
            <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
              <h2 className="text-2xl font-bold mb-6">Related Case Studies</h2>
              <div className="grid grid-cols-1 gap-4">
                {caseStudies.map((caseStudy) => (
                  <Link
                    key={caseStudy.id}
                    href={`/case-study/${caseStudy.slug}`}
                    className="block group"
                  >
                    <div className="p-4 rounded-lg border border-border/30 bg-background/50 transition-all duration-200 hover:bg-accent/5 hover:border-border">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary line-clamp-2">
                        {caseStudy.title}
                      </h3>
                      <p className="text-muted-foreground mb-3 line-clamp-3 text-sm">
                        {caseStudy.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </ProfessionalPersonaDetailLayout>
    </>
  );
}