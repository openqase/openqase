import { notFound } from 'next/navigation';
import { getStaticContentWithRelationships, generateStaticParamsForContentType } from '@/lib/content-fetchers';
import type { Database } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { processMarkdown } from '@/lib/markdown-server';
import Link from 'next/link';
import { ExternalLink, Github, FileText, Building2, Cpu, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRelatedQuantumHardware, getRelatedQuantumCompanies, getRelatedPartnerCompanies } from '@/lib/relationship-queries';

type EnrichedQuantumSoftware = Database['public']['Tables']['quantum_software']['Row'] & {
  case_study_quantum_software_relations?: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }[];
};

interface QuantumSoftwarePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return generateStaticParamsForContentType('quantum_software');
}

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed company) within 1 hour
export const revalidate = 3600;

export async function generateMetadata({ params }: QuantumSoftwarePageProps) {
  const resolvedParams = await params;
  
  const quantumSoftware = await getStaticContentWithRelationships<EnrichedQuantumSoftware>(
    'quantum_software',
    resolvedParams.slug
  );
  
  if (!quantumSoftware) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }
  
  return {
    title: `${quantumSoftware.name} - Quantum Software | OpenQase`,
    description: quantumSoftware.description || `Learn about ${quantumSoftware.name}, a quantum software platform featured in OpenQase case studies.`,
  };
}

export default async function QuantumSoftwareDetailPage({ params }: QuantumSoftwarePageProps) {
  const resolvedParams = await params;
  
  const quantumSoftware = await getStaticContentWithRelationships<EnrichedQuantumSoftware>(
    'quantum_software',
    resolvedParams.slug
  );

  if (!quantumSoftware) {
    notFound();
  }

  // Process markdown content
  const processedContent = quantumSoftware.main_content 
    ? await processMarkdown(quantumSoftware.main_content)
    : null;

  // Extract related case studies
  const relatedCaseStudies = quantumSoftware.case_study_quantum_software_relations
    ?.map(relation => relation.case_studies)
    .filter((cs): cs is NonNullable<typeof cs> => cs !== null) || [];
  
  // Get case study IDs for ecosystem discovery
  const caseStudyIds = relatedCaseStudies.map(cs => cs.id);
  
  // Fetch related ecosystem components through case studies
  const [relatedHardware, quantumCompanies, partnerCompanies] = await Promise.all([
    getRelatedQuantumHardware(caseStudyIds),
    getRelatedQuantumCompanies(caseStudyIds),
    getRelatedPartnerCompanies(caseStudyIds)
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link href="/paths/quantum-software" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to Quantum Software
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">{quantumSoftware.name}</h1>
        
        {quantumSoftware.vendor && (
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">by {quantumSoftware.vendor}</span>
          </div>
        )}

        {quantumSoftware.description && (
          <p className="text-xl text-muted-foreground mb-6">
            {quantumSoftware.description}
          </p>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-4 mb-6">
          {quantumSoftware.website_url && (
            <a
              href={quantumSoftware.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </a>
          )}
          {quantumSoftware.documentation_url && (
            <a
              href={quantumSoftware.documentation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-secondary text-secondary-foreground px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Documentation
            </a>
          )}
          {quantumSoftware.github_url && (
            <a
              href={quantumSoftware.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-secondary text-secondary-foreground px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          )}
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          {quantumSoftware.license_type && (
            <Badge variant="outline">
              License: {quantumSoftware.license_type}
            </Badge>
          )}
          {quantumSoftware.pricing_model && (
            <Badge variant="outline">
              {quantumSoftware.pricing_model}
            </Badge>
          )}
          {quantumSoftware.programming_languages && quantumSoftware.programming_languages.length > 0 && (
            quantumSoftware.programming_languages.map(lang => (
              <Badge key={lang} variant="secondary">
                {lang}
              </Badge>
            ))
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

      {/* Supported Hardware */}
      {quantumSoftware.supported_hardware && quantumSoftware.supported_hardware.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Supported Hardware</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quantumSoftware.supported_hardware.map(hardware => (
                <Badge key={hardware} variant="outline">
                  {hardware}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ecosystem Cross-References */}
      {(relatedHardware.length > 0 || quantumCompanies.length > 0 || partnerCompanies.length > 0) && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quantum Ecosystem</h2>
          
          {/* Compatible Hardware */}
          {relatedHardware.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Compatible Hardware</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Quantum hardware platforms that support {quantumSoftware.name}.
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
          
          {/* Quantum Companies */}
          {quantumCompanies.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Quantum Companies</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Companies that develop, maintain, or provide {quantumSoftware.name}.
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
          
          {/* Partner Companies */}
          {partnerCompanies.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Organizations Using This Software</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Partner organizations utilizing {quantumSoftware.name} in their quantum initiatives.
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
            These case studies demonstrate real-world applications and implementations using {quantumSoftware.name} in quantum computing projects.
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