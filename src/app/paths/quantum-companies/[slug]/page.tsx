import { notFound } from 'next/navigation';
import { getStaticContentWithRelationships, generateStaticParamsForContentType } from '@/lib/content-fetchers';
import type { Database } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { processMarkdown } from '@/lib/markdown-server';
import Link from 'next/link';
import { ExternalLink, Building2, Users, MapPin, FileText, Cpu, Code, Briefcase } from 'lucide-react';
import { getRelatedQuantumSoftware, getRelatedQuantumHardware, getRelatedPartnerCompanies } from '@/lib/relationship-queries';
import { AutoSchema } from '@/components/AutoSchema';
type EnrichedQuantumCompany = Database['public']['Tables']['quantum_companies']['Row'] & {
  case_study_quantum_company_relations?: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }[];
};

interface QuantumCompanyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return generateStaticParamsForContentType('quantum_companies');
}

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed partner) within 1 hour
export const revalidate = 3600;

export async function generateMetadata({ params }: QuantumCompanyPageProps) {
  const resolvedParams = await params;
  
  const quantumCompany = await getStaticContentWithRelationships<EnrichedQuantumCompany>(
    'quantum_companies',
    resolvedParams.slug
  );
  
  if (!quantumCompany) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }
  
  return {
    title: `${quantumCompany.name} - Quantum Companies | OpenQase`,
    description: quantumCompany.description || `Learn about ${quantumCompany.name}, a quantum computing company featured in OpenQase case studies.`,
    alternates: {
      canonical: `/paths/quantum-companies/${resolvedParams.slug}`,
    },
  };
}

export default async function QuantumCompanyDetailPage({ params }: QuantumCompanyPageProps) {
  const resolvedParams = await params;
  
  const quantumCompany = await getStaticContentWithRelationships<EnrichedQuantumCompany>(
    'quantum_companies',
    resolvedParams.slug
  );

  if (!quantumCompany) {
    notFound();
  }

  // Process markdown content
  const processedContent = quantumCompany.main_content 
    ? await processMarkdown(quantumCompany.main_content)
    : null;

  // Extract related case studies
  const relatedCaseStudies = quantumCompany.case_study_quantum_company_relations
    ?.map(relation => relation.case_studies)
    .filter((cs): cs is NonNullable<typeof cs> => cs !== null) || [];
  
  // Get case study IDs for ecosystem discovery
  const caseStudyIds = relatedCaseStudies.map(cs => cs.id);
  
  // Fetch related ecosystem components through case studies
  const [relatedSoftware, relatedHardware, partnerCompanies] = await Promise.all([
    getRelatedQuantumSoftware(caseStudyIds),
    getRelatedQuantumHardware(caseStudyIds),
    getRelatedPartnerCompanies(caseStudyIds)
  ]);

  return (
    <>
      {/* Schema markup for SEO */}
      <AutoSchema type="quantum-entity" data={quantumCompany} entityType="quantum-companies" />
      <AutoSchema 
        type="breadcrumb" 
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Paths', url: '/paths' },
          { name: 'Quantum Companies', url: '/paths/quantum-companies' },
          { name: quantumCompany.name, url: `/paths/quantum-companies/${quantumCompany.slug}` }
        ]} 
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link href="/paths/quantum-companies" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to Quantum Companies
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{quantumCompany.name}</h1>
        </div>
        
        {quantumCompany.headquarters && (
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{quantumCompany.headquarters}</span>
          </div>
        )}

        {quantumCompany.description && (
          <p className="text-xl text-muted-foreground mb-6">
            {quantumCompany.description}
          </p>
        )}

        {/* Company stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {quantumCompany.founded_year && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Founded</div>
              <div className="font-semibold">{quantumCompany.founded_year}</div>
            </div>
          )}
          {quantumCompany.funding_stage && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Funding</div>
              <div className="font-semibold">{quantumCompany.funding_stage}</div>
            </div>
          )}
          {quantumCompany.company_type && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="font-semibold">{quantumCompany.company_type}</div>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 mb-6">
          {quantumCompany.website_url && (
            <a
              href={quantumCompany.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </a>
          )}
          {quantumCompany.linkedin_url && (
            <a
              href={quantumCompany.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-secondary text-secondary-foreground px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors"
            >
              <Users className="h-4 w-4" />
              LinkedIn
            </a>
          )}
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          {quantumCompany.company_type && (
            <Badge variant="outline">
              {quantumCompany.company_type}
            </Badge>
          )}
          {quantumCompany.funding_stage && (
            <Badge variant="secondary">
              {quantumCompany.funding_stage}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      {processedContent && (
        <div className="mb-12">
          <div 
            className="prose dark:prose-invert max-w-none prose-a:text-primary prose-a:hover:underline"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </div>
      )}

      {/* Ecosystem Cross-References */}
      {(relatedSoftware.length > 0 || relatedHardware.length > 0 || partnerCompanies.length > 0) && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quantum Ecosystem</h2>
          
          {/* Related Software */}
          {relatedSoftware.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Quantum Software</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Software frameworks and tools used in {quantumCompany.name}'s quantum computing projects.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {relatedSoftware.map(software => (
                  <Link 
                    key={software.id} 
                    href={`/paths/quantum-software/${software.slug}`}
                    className="block p-3 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="font-medium text-sm">{software.name}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Related Hardware */}
          {relatedHardware.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Quantum Hardware</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Hardware platforms and systems utilized in {quantumCompany.name}'s implementations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {relatedHardware.map(hardware => (
                  <Link 
                    key={hardware.id} 
                    href={`/paths/quantum-hardware/${hardware.slug}`}
                    className="block p-3 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="font-medium text-sm">{hardware.name}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Partner Companies */}
          {partnerCompanies.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Partner Organizations</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Organizations collaborating with {quantumCompany.name} on quantum computing initiatives.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {partnerCompanies.map(partner => (
                  <Link 
                    key={partner.id} 
                    href={`/paths/partner-companies/${partner.slug}`}
                    className="block p-3 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="font-medium text-sm">{partner.name}</div>
                    {partner.industry && (
                      <div className="text-xs text-muted-foreground mt-1">{partner.industry}</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Related Case Studies */}
      {relatedCaseStudies.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Related Case Studies</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            These case studies feature {quantumCompany.name} and showcase their quantum computing initiatives and collaborative research projects.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relatedCaseStudies.map(caseStudy => (
              <Link 
                key={caseStudy.id} 
                href={`/case-study/${caseStudy.slug}`}
                className="block p-4 border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="font-medium text-sm mb-2">{caseStudy.title}</div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {caseStudy.description}
                </p>
                <div className="text-xs text-muted-foreground">
                  {new Date(caseStudy.published_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  })}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}