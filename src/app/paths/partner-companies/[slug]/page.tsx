import { notFound } from 'next/navigation';
import { getStaticContentWithRelationships, generateStaticParamsForContentType } from '@/lib/content-fetchers';
import type { Database } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { processMarkdown } from '@/lib/markdown-server';
import Link from 'next/link';
import { ExternalLink, HandHeart, Users, MapPin, Building, FileText, Building2, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRelatedQuantumSoftware, getRelatedQuantumHardware, getRelatedQuantumCompanies } from '@/lib/relationship-queries';
type EnrichedPartnerCompany = Database['public']['Tables']['partner_companies']['Row'] & {
  case_study_partner_company_relations?: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }[];
};

interface PartnerCompanyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return generateStaticParamsForContentType('partner_companies');
}

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed company) within 1 hour
export const revalidate = 3600;

export async function generateMetadata({ params }: PartnerCompanyPageProps) {
  const resolvedParams = await params;
  
  const partnerCompany = await getStaticContentWithRelationships<EnrichedPartnerCompany>(
    'partner_companies',
    resolvedParams.slug
  );
  
  if (!partnerCompany) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }
  
  return {
    title: `${partnerCompany.name} - Partner Companies | OpenQase`,
    description: partnerCompany.description || `Learn about ${partnerCompany.name}, a partner organization featured in OpenQase case studies.`,
  };
}

export default async function PartnerCompanyDetailPage({ params }: PartnerCompanyPageProps) {
  const resolvedParams = await params;
  
  const partnerCompany = await getStaticContentWithRelationships<EnrichedPartnerCompany>(
    'partner_companies',
    resolvedParams.slug
  );

  if (!partnerCompany) {
    notFound();
  }

  // Process markdown content
  const processedContent = partnerCompany.main_content 
    ? await processMarkdown(partnerCompany.main_content)
    : null;

  // Extract related case studies
  const relatedCaseStudies = partnerCompany.case_study_partner_company_relations
    ?.map(relation => relation.case_studies)
    .filter((cs): cs is NonNullable<typeof cs> => cs !== null) || [];
  
  // Get case study IDs for ecosystem discovery
  const caseStudyIds = relatedCaseStudies.map(cs => cs.id);
  
  // Fetch related ecosystem components through case studies
  const [relatedSoftware, relatedHardware, quantumCompanies] = await Promise.all([
    getRelatedQuantumSoftware(caseStudyIds),
    getRelatedQuantumHardware(caseStudyIds),
    getRelatedQuantumCompanies(caseStudyIds)
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link href="/paths/partner-companies" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to Partner Companies
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <HandHeart className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{partnerCompany.name}</h1>
        </div>
        
        {partnerCompany.headquarters && (
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{partnerCompany.headquarters}</span>
          </div>
        )}

        {partnerCompany.description && (
          <p className="text-xl text-muted-foreground mb-6">
            {partnerCompany.description}
          </p>
        )}

        {/* Company stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {partnerCompany.industry && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Industry</div>
              <div className="font-semibold">{partnerCompany.industry}</div>
            </div>
          )}
          {partnerCompany.company_size && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Size</div>
              <div className="font-semibold">{partnerCompany.company_size}</div>
            </div>
          )}
          {partnerCompany.partnership_type && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Partnership</div>
              <div className="font-semibold">{partnerCompany.partnership_type}</div>
            </div>
          )}
          {partnerCompany.quantum_initiatives && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Quantum Initiatives</div>
              <div className="font-semibold text-xs">{partnerCompany.quantum_initiatives}</div>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 mb-6">
          {partnerCompany.website_url && (
            <a
              href={partnerCompany.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </a>
          )}
          {partnerCompany.linkedin_url && (
            <a
              href={partnerCompany.linkedin_url}
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
          {partnerCompany.industry && (
            <Badge variant="outline">
              {partnerCompany.industry}
            </Badge>
          )}
          {partnerCompany.company_size && (
            <Badge variant="secondary">
              {partnerCompany.company_size}
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
      {(relatedSoftware.length > 0 || relatedHardware.length > 0 || quantumCompanies.length > 0) && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quantum Ecosystem</h2>
          
          {/* Quantum Software They Use */}
          {relatedSoftware.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Quantum Software</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Quantum software platforms utilized by {partnerCompany.name} in their projects.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {relatedSoftware.map(software => (
                  <Link 
                    key={software.id} 
                    href={`/paths/quantum-software/${software.slug}`}
                    className="block p-3 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="font-medium text-sm">{software.name}</div>
                    {software.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {software.description}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Quantum Hardware They Utilize */}
          {relatedHardware.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Quantum Hardware</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Quantum hardware platforms accessed or utilized by {partnerCompany.name}.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {relatedHardware.map(hardware => (
                  <Link 
                    key={hardware.id} 
                    href={`/paths/quantum-hardware/${hardware.slug}`}
                    className="block p-3 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="font-medium text-sm">{hardware.name}</div>
                    {hardware.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {hardware.description}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Quantum Companies They Partner With */}
          {quantumCompanies.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <HandHeart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Quantum Companies</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Quantum companies that {partnerCompany.name} collaborates with in their quantum initiatives.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quantumCompanies.map(company => (
                  <Link 
                    key={company.id} 
                    href={`/paths/quantum-companies/${company.slug}`}
                    className="block p-3 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="font-medium text-sm">{company.name}</div>
                    {company.company_type && (
                      <div className="text-xs text-muted-foreground mt-1">{company.company_type}</div>
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
            These case studies highlight collaborative quantum computing projects and partnerships involving {partnerCompany.name}.
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
  );
}