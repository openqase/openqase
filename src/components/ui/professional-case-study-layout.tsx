import { ReactNode } from 'react';
import { ArrowLeft, Users, Cpu, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { Json } from '@/types/supabase';

interface RelatedEntity {
  id: string;
  name: string;
  slug?: string | null;
}

interface IndustryRelation { industries: RelatedEntity | null }
interface AlgorithmRelation { algorithms: RelatedEntity | null }
interface PersonaRelation { personas: RelatedEntity | null }
interface PartnerCompanyRelation { partner_companies: RelatedEntity | null }
interface QuantumCompanyRelation { quantum_companies: RelatedEntity | null }
interface QuantumHardwareRelation { quantum_hardware: RelatedEntity | null }
interface QuantumSoftwareRelation { quantum_software: RelatedEntity | null }

interface ResourceLink {
  url: string;
  label?: string;
  order: number;
}

interface CaseStudyWithRelations {
  year?: number;
  resource_links?: Json;
  case_study_industry_relations?: IndustryRelation[];
  algorithm_case_study_relations?: AlgorithmRelation[];
  case_study_persona_relations?: PersonaRelation[];
  case_study_partner_company_relations?: PartnerCompanyRelation[];
  case_study_quantum_company_relations?: QuantumCompanyRelation[];
  case_study_quantum_hardware_relations?: QuantumHardwareRelation[];
  case_study_quantum_software_relations?: QuantumSoftwareRelation[];
}

// Helper function to render clickable links for related content
function renderEntityLinks(
  entities: Array<RelatedEntity | null> | undefined,
  basePath: string,
  title: string,
  icon?: React.ReactNode
) {
  const filtered = entities?.filter((e): e is RelatedEntity => e !== null);
  if (!filtered || filtered.length === 0) return null;

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
        {icon}
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {filtered.map((entity) => {
          if (entity.slug) {
            return (
              <Link key={entity.id} href={`/paths/${basePath}/${entity.slug}`}>
                <Badge variant="outline" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                  {entity.name}
                </Badge>
              </Link>
            );
          } else {
            return (
              <Badge key={entity.id} variant="outline" className="text-xs">
                {entity.name}
              </Badge>
            );
          }
        })}
      </div>
    </div>
  );
}

interface ProfessionalCaseStudyLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  backLinkText?: string;
  backLinkHref?: string;
  caseStudy: CaseStudyWithRelations;
}

export default function ProfessionalCaseStudyLayout({
  title,
  description,
  children,
  backLinkText = "Back to Case Studies",
  backLinkHref = "/case-study",
  caseStudy
}: ProfessionalCaseStudyLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-muted/30 border-b border-border">
        <div className="container-outer py-6">
          <Link
            href={backLinkHref}
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>{backLinkText}</span>
          </Link>
          
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight mb-4">
              {title}
            </h1>
            {description && (
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-outer py-8 md:py-12">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1fr,300px]">
          {/* Article Content */}
          <article className="max-w-none">
            <div className="surface-content rounded-lg p-8 prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-p:text-foreground/90">
              {children}
            </div>
          </article>

          {/* Professional Sidebar */}
          <aside className="space-y-6">
            {/* Quick Facts */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Facts</h3>
              <div className="space-y-4">
                {caseStudy.year && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Year</div>
                    <Badge variant="secondary" className="font-medium">
                      {caseStudy.year}
                    </Badge>
                  </div>
                )}

                {renderEntityLinks(
                  caseStudy.case_study_partner_company_relations?.map((rel: PartnerCompanyRelation) => rel.partner_companies),
                  'partner-companies',
                  'Partner Companies'
                )}

                {renderEntityLinks(
                  caseStudy.case_study_quantum_company_relations?.map((rel: QuantumCompanyRelation) => rel.quantum_companies),
                  'quantum-companies',
                  'Quantum Companies'
                )}
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Technical Details</h3>
              <div className="space-y-4">
                {renderEntityLinks(
                  caseStudy.case_study_quantum_hardware_relations?.map((rel: QuantumHardwareRelation) => rel.quantum_hardware),
                  'quantum-hardware',
                  'Quantum Hardware',
                  <Cpu className="h-3 w-3" />
                )}

                {renderEntityLinks(
                  caseStudy.case_study_quantum_software_relations?.map((rel: QuantumSoftwareRelation) => rel.quantum_software),
                  'quantum-software',
                  'Quantum Software'
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Categories</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Industries</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      if (caseStudy.case_study_industry_relations && caseStudy.case_study_industry_relations.length > 0) {
                        const naIndustry = caseStudy.case_study_industry_relations.find((rel: IndustryRelation) => rel.industries?.slug === 'not-applicable');
                        if (naIndustry && naIndustry.industries) {
                          return <span className="text-xs text-muted-foreground">Not Applicable</span>;
                        }
                        const actualIndustries = caseStudy.case_study_industry_relations.filter((rel: IndustryRelation) => rel.industries?.slug !== 'not-applicable');
                        if (actualIndustries.length > 0) {
                          return actualIndustries.map((relation: IndustryRelation) =>
                            relation.industries ? (
                              <Link key={relation.industries.id} href={`/paths/industry/${relation.industries?.slug}`}>
                                <Badge variant="default" className="text-xs hover:bg-primary/80 cursor-pointer">
                                  {relation.industries.name}
                                </Badge>
                              </Link>
                            ) : null
                          );
                        }
                      }
                      return <span className="text-xs text-muted-foreground">None</span>;
                    })()}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Algorithms</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      if (caseStudy.algorithm_case_study_relations && caseStudy.algorithm_case_study_relations.length > 0) {
                        const naAlgorithm = caseStudy.algorithm_case_study_relations.find((rel: AlgorithmRelation) => rel.algorithms?.slug === 'not-applicable');
                        if (naAlgorithm && naAlgorithm.algorithms) {
                          return <span className="text-xs text-muted-foreground">Not Applicable</span>;
                        }
                        const actualAlgorithms = caseStudy.algorithm_case_study_relations.filter((rel: AlgorithmRelation) => rel.algorithms?.slug !== 'not-applicable');
                        if (actualAlgorithms.length > 0) {
                          return actualAlgorithms.map((relation: AlgorithmRelation) =>
                            relation.algorithms ? (
                              <Link key={relation.algorithms.id} href={`/paths/algorithm/${relation.algorithms?.slug}`}>
                                <Badge variant="default" className="text-xs hover:bg-primary/80 cursor-pointer">
                                  {relation.algorithms.name}
                                </Badge>
                              </Link>
                            ) : null
                          );
                        }
                      }
                      return <span className="text-xs text-muted-foreground">None</span>;
                    })()}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Target Personas</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      if (caseStudy.case_study_persona_relations && caseStudy.case_study_persona_relations.length > 0) {
                        const naPersona = caseStudy.case_study_persona_relations.find((rel: PersonaRelation) => rel.personas?.slug === 'not-applicable');
                        if (naPersona && naPersona.personas) {
                          return <span className="text-xs text-muted-foreground">Not Applicable</span>;
                        }
                        const actualPersonas = caseStudy.case_study_persona_relations.filter((rel: PersonaRelation) => rel.personas?.slug !== 'not-applicable');
                        if (actualPersonas.length > 0) {
                          return actualPersonas.map((relation: PersonaRelation) =>
                            relation.personas ? (
                              <Link key={relation.personas.id} href={`/paths/persona/${relation.personas?.slug}`}>
                                <Badge variant="default" className="text-xs hover:bg-primary/80 cursor-pointer">
                                  {relation.personas.name}
                                </Badge>
                              </Link>
                            ) : null
                          );
                        }
                      }
                      return <span className="text-xs text-muted-foreground">None</span>;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Links */}
            {caseStudy.resource_links && Array.isArray(caseStudy.resource_links) && caseStudy.resource_links.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Additional Resources
                </h3>
                <div className="space-y-2">
                  {(caseStudy.resource_links as unknown as ResourceLink[])
                    .sort((a, b) => a.order - b.order)
                    .map((link, index) => (
                      <a 
                        key={index} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{link.label || link.url}</span>
                      </a>
                    ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}