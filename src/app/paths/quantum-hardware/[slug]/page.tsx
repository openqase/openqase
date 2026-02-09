import { notFound } from 'next/navigation';
import { getStaticContentWithRelationships, generateStaticParamsForContentType } from '@/lib/content-fetchers';
import type { Database } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { processMarkdown } from '@/lib/markdown-server';
import Link from 'next/link';
import { ExternalLink, FileText, Building2, Cpu, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRelatedQuantumSoftware, getRelatedQuantumCompanies, getRelatedPartnerCompanies } from '@/lib/relationship-queries';
type EnrichedQuantumHardware = Database['public']['Tables']['quantum_hardware']['Row'] & {
  case_study_quantum_hardware_relations?: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }[];
};

interface QuantumHardwarePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return generateStaticParamsForContentType('quantum_hardware');
}

// ISR safety net: on-demand revalidation handles most updates immediately,
// but this catches cross-entity staleness (e.g. a renamed company) within 1 hour
export const revalidate = 3600;

export async function generateMetadata({ params }: QuantumHardwarePageProps) {
  const resolvedParams = await params;
  
  const quantumHardware = await getStaticContentWithRelationships<EnrichedQuantumHardware>(
    'quantum_hardware',
    resolvedParams.slug
  );
  
  if (!quantumHardware) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }
  
  return {
    title: `${quantumHardware.name} - Quantum Hardware | OpenQase`,
    description: quantumHardware.description || `Learn about ${quantumHardware.name}, a quantum hardware platform featured in OpenQase case studies.`,
  };
}

export default async function QuantumHardwareDetailPage({ params }: QuantumHardwarePageProps) {
  const resolvedParams = await params;
  
  const quantumHardware = await getStaticContentWithRelationships<EnrichedQuantumHardware>(
    'quantum_hardware',
    resolvedParams.slug
  );

  if (!quantumHardware) {
    notFound();
  }

  // Process markdown content
  const processedContent = quantumHardware.main_content 
    ? await processMarkdown(quantumHardware.main_content)
    : null;

  // Extract related case studies
  const relatedCaseStudies = quantumHardware.case_study_quantum_hardware_relations
    ?.map(relation => relation.case_studies)
    .filter((cs): cs is NonNullable<typeof cs> => cs !== null) || [];
  
  // Get case study IDs for ecosystem discovery
  const caseStudyIds = relatedCaseStudies.map(cs => cs.id);
  
  // Fetch related ecosystem components through case studies
  const [relatedSoftware, quantumCompanies, partnerCompanies] = await Promise.all([
    getRelatedQuantumSoftware(caseStudyIds),
    getRelatedQuantumCompanies(caseStudyIds),
    getRelatedPartnerCompanies(caseStudyIds)
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link href="/paths/quantum-hardware" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to Quantum Hardware
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{quantumHardware.name}</h1>
        </div>
        
        {quantumHardware.vendor && (
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">by {quantumHardware.vendor}</span>
          </div>
        )}

        {quantumHardware.description && (
          <p className="text-xl text-muted-foreground mb-6">
            {quantumHardware.description}
          </p>
        )}

        {/* Technical specs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {quantumHardware.technology_type && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Technology</div>
              <div className="font-semibold">{quantumHardware.technology_type}</div>
            </div>
          )}
          {quantumHardware.qubit_count && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Qubits</div>
              <div className="font-semibold">{quantumHardware.qubit_count}</div>
            </div>
          )}
          {quantumHardware.gate_fidelity && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Gate Fidelity</div>
              <div className="font-semibold">{quantumHardware.gate_fidelity}%</div>
            </div>
          )}
          {quantumHardware.coherence_time && (
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-sm text-muted-foreground">Coherence Time</div>
              <div className="font-semibold">{quantumHardware.coherence_time}</div>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 mb-6">
          {quantumHardware.website_url && (
            <a
              href={quantumHardware.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </a>
          )}
          {quantumHardware.documentation_url && (
            <a
              href={quantumHardware.documentation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-secondary text-secondary-foreground px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Documentation
            </a>
          )}
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          {quantumHardware.availability && (
            <Badge variant="outline">
              {quantumHardware.availability}
            </Badge>
          )}
          {quantumHardware.access_model && (
            <Badge variant="outline">
              {quantumHardware.access_model}
            </Badge>
          )}
          {quantumHardware.connectivity && (
            <Badge variant="secondary">
              {quantumHardware.connectivity}
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
      {(relatedSoftware.length > 0 || quantumCompanies.length > 0 || partnerCompanies.length > 0) && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quantum Ecosystem</h2>
          
          {/* Compatible Software */}
          {relatedSoftware.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Compatible Software</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Quantum software platforms that run on {quantumHardware.name}.
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
          
          {/* Quantum Companies */}
          {quantumCompanies.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Quantum Companies</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Companies that develop, manufacture, or provide access to {quantumHardware.name}.
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
          
          {/* Partner Organizations */}
          {partnerCompanies.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Partner Organizations</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Organizations utilizing {quantumHardware.name} in their quantum computing initiatives.
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
            These case studies showcase practical implementations and research projects utilizing {quantumHardware.name} hardware platforms.
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