// src/app/paths/industry/[slug]/page.tsx
import { fetchContentBySlug, generateStaticParamsFor } from '@/cms/page-helpers';
import { Database } from '@/types/supabase';
import ProfessionalIndustryDetailLayout from '@/components/ui/professional-industry-detail-layout';
import Link from 'next/link';
import { processMarkdown } from '@/lib/markdown-server';
import { AutoSchema } from '@/components/AutoSchema';

// Define enriched types using flat relationship shapes from the CMS engine
type EnrichedIndustry = Database['public']['Tables']['industries']['Row'] & {
  algorithms?: { id: string; name: string; slug?: string | null }[];
  personas?: { id: string; name: string; slug?: string | null }[];
  case_studies?: { id: string; title: string; slug: string; description: string; published_at: string }[];
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

// Generate static params for all published industries
export const generateStaticParams = generateStaticParamsFor('industries')

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed algorithm) within 24 hours
export const revalidate = 86400;

// Get metadata for the page (custom rich metadata — canonical, OG, Twitter)
export async function generateMetadata({ params }: PageParams) {
  const { slug } = await params;

  const industry = await fetchContentBySlug('industries', slug) as EnrichedIndustry | null;

  if (!industry) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  const title = `${industry.name} | Quantum Computing Industry - OpenQase`;
  const description = industry.description || `Explore quantum computing applications in ${industry.name}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/paths/industry/${slug}`,
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

export default async function IndustryPage({ params }: PageParams) {
  const { slug } = await params;

  // Fetch industry along with related algorithms, personas, and case studies
  const industry = await fetchContentBySlug('industries', slug) as EnrichedIndustry | null;

  if (!industry) {
    return <div>Industry not found</div>;
  }

  // Flat relationship shape from the CMS engine
  const caseStudies = (industry.case_studies || []) as IndustryRelatedCaseStudy[];

  // Process industry main content with server-side markdown
  const processedContent = processMarkdown(industry.main_content);

  return (
    <>
      <AutoSchema type="course" data={industry} courseType="industry" />
      <AutoSchema
        type="breadcrumb"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Industries', url: '/paths/industry' },
          { name: industry.name, url: `/paths/industry/${industry.slug}` }
        ]}
      />
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

        {caseStudies.length > 0 && (
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
    </>
  );
}
