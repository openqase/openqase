// src/app/paths/persona/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { fetchContentBySlug, generateStaticParamsFor } from '@/cms/page-helpers';
import type { Database } from '@/types/supabase';
import ProfessionalPersonaDetailLayout from '@/components/ui/professional-persona-detail-layout';
import Link from 'next/link';
import { processMarkdown } from '@/lib/markdown-server';
import { AutoSchema } from '@/components/AutoSchema';

// Define enriched types using flat relationship shapes from the CMS engine
type EnrichedPersona = Database['public']['Tables']['personas']['Row'] & {
  industries?: { id: string; name: string; slug?: string | null }[];
  algorithms?: { id: string; name: string; slug?: string | null }[];
  case_studies?: { id: string; title: string; slug: string; description: string; published_at: string }[];
};

// Simple type for case studies from persona relations (only includes fetched fields)
type PersonaRelatedCaseStudy = {
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

// Generate static params for all published personas
export const generateStaticParams = generateStaticParamsFor('personas')

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed industry) within 24 hours
export const revalidate = 86400;

// Get metadata for the page
export async function generateMetadata({ params }: PageParams) {
  const resolvedParams = await params;

  const persona = await fetchContentBySlug('personas', resolvedParams.slug) as EnrichedPersona | null;

  if (!persona) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  return {
    title: `${persona.name} | Quantum Computing Persona - OpenQase`,
    description: persona.description || `Learn about the ${persona.name} quantum computing persona`,
    alternates: {
      canonical: `/paths/persona/${resolvedParams.slug}`,
    },
    openGraph: {
      title: persona.name,
      description: persona.description || `Learn about the ${persona.name} quantum computing persona`,
      type: 'article',
      images: ['/og-image.svg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: persona.name,
      description: persona.description || `Learn about the ${persona.name} quantum computing persona`,
      images: ['/og-image.svg'],
    },
  };
}

export default async function PersonaPage({ params }: PageParams) {
  const resolvedParams = await params;

  // Get the persona and its related industries, algorithms, and case studies
  const persona = await fetchContentBySlug('personas', resolvedParams.slug) as EnrichedPersona | null;

  if (!persona) {
    notFound();
  }

  // Flat relationship shape from the CMS engine
  const caseStudies = (persona.case_studies || []) as PersonaRelatedCaseStudy[];

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
