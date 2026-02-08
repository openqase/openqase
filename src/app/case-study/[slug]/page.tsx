// src/app/case-study/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getStaticContentWithRelationships, generateStaticParamsForContentType } from '@/lib/content-fetchers';
import type { Database } from '@/types/supabase';
import ProfessionalCaseStudyLayout from '@/components/ui/professional-case-study-layout';
import { Badge } from '@/components/ui/badge';
import { ReferencesRenderer, processContentWithReferences } from '@/components/ui/ReferencesRenderer';
import { processMarkdown } from '@/lib/markdown-server';
import Link from 'next/link';
import { AutoSchema } from '@/components/AutoSchema';

// export const dynamic = 'force-dynamic'; // REMOVED - Restore default caching

// Define a more accurate type for the case study data we expect after fetching relations
type EnrichedCaseStudy = Database['public']['Tables']['case_studies']['Row'] & {
  case_study_industry_relations?: { industries: { id: string; name: string; slug?: string | null } | null }[];
  algorithm_case_study_relations?: { algorithms: { id: string; name: string; slug?: string | null } | null }[];
  case_study_persona_relations?: { personas: { id: string; name: string; slug?: string | null } | null }[];
  case_study_quantum_software_relations?: { quantum_software: { id: string; name: string; slug?: string | null } | null }[];
  case_study_quantum_hardware_relations?: { quantum_hardware: { id: string; name: string; slug?: string | null } | null }[];
  case_study_quantum_company_relations?: { quantum_companies: { id: string; name: string; slug?: string | null } | null }[];
  case_study_partner_company_relations?: { partner_companies: { id: string; name: string; slug?: string | null } | null }[];
};

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}


// Get metadata for the page
export async function generateMetadata({ params }: CaseStudyPageProps) {
  const resolvedParams = await params;
  
  const caseStudy = await getStaticContentWithRelationships<{ title: string; description: string | null }>(
    'case_studies',
    resolvedParams.slug
  );

  if (!caseStudy) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  return {
    title: `${caseStudy.title} | Quantum Computing Case Study - OpenQase`,
    description: caseStudy.description || `Learn how quantum computing solved real business challenges in this case study. Explore practical applications and results from ${caseStudy.title}.`,
    alternates: {
      canonical: `/case-study/${resolvedParams.slug}`,
    },
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.description || `Quantum computing case study: ${caseStudy.title}`,
      type: 'article',
      images: ['/og-image.svg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: caseStudy.title,
      description: caseStudy.description || `Quantum computing case study: ${caseStudy.title}`,
      images: ['/og-image.svg'],
    },
  };
}

// Generate static params for all published case studies
export async function generateStaticParams() {
  return await generateStaticParamsForContentType('case_studies');
}

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed algorithm) within 1 hour
export const revalidate = 3600;

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const caseStudy = await getStaticContentWithRelationships<EnrichedCaseStudy>(
    'case_studies',
    slug
  );

  if (!caseStudy) {
    return notFound();
  }

  // Process content with references if available
  let processedContent = '';
  if (caseStudy.main_content) {
    // Process citations in content if there are references
    if (caseStudy.academic_references) {
      const processedMarkdown = processContentWithReferences(caseStudy.main_content);
      processedContent = processMarkdown(processedMarkdown);
    } else {
      processedContent = processMarkdown(caseStudy.main_content);
    }
  }

  return (
    <>
      {/* Ghost-style automatic case study schema */}
      <AutoSchema type="case-study" data={caseStudy} />
      <AutoSchema 
        type="breadcrumb" 
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Case Studies', url: '/case-study' },
          { name: caseStudy.title, url: `/case-study/${caseStudy.slug}` }
        ]} 
      />
      
      <ProfessionalCaseStudyLayout
        title={caseStudy.title}
        description={caseStudy.description || ''}
        backLinkText="Back to Case Studies"
        backLinkHref="/case-study"
        caseStudy={caseStudy}
      >
        <div dangerouslySetInnerHTML={{ __html: processedContent }} />
        
        {/* Display References Section if available */}
        {caseStudy.academic_references && (
          <>
            <hr className="my-12 border-border/50" />
            <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
              <ReferencesRenderer referencesMarkup={caseStudy.academic_references} />
            </div>
          </>
        )}
      </ProfessionalCaseStudyLayout>
    </>
  );
}