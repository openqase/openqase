import { ReactNode } from 'react';
import { ArrowLeft, Building, Cpu, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface ProfessionalIndustryDetailLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  backLinkText?: string;
  backLinkHref?: string;
  industry: {
    sector?: string[] | null;
    algorithm_industry_relations?: { algorithms: { id: string; name: string; slug?: string | null } | null }[];
    persona_industry_relations?: { personas: { id: string; name: string; slug?: string | null } | null }[];
    case_study_industry_relations?: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }[];
  };
}

export default function ProfessionalIndustryDetailLayout({
  title,
  description,
  children,
  backLinkText = "Back to Industries",
  backLinkHref = "/paths/industry",
  industry
}: ProfessionalIndustryDetailLayoutProps) {
  // Count related items
  const algorithmCount = industry.algorithm_industry_relations?.filter(rel => rel.algorithms?.slug !== 'not-applicable').length || 0;
  const personaCount = industry.persona_industry_relations?.filter(rel => rel.personas?.slug !== 'not-applicable').length || 0;
  const caseStudyCount = industry.case_study_industry_relations?.filter(rel => rel.case_studies).length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header Section */}
      <div className="bg-muted/20 border-b border-border/30">
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

      {/* Key Metrics Bar */}
      <div className="bg-muted/30 border-b border-border/30">
        <div className="container-outer py-4">
          <div className="flex flex-wrap gap-6 text-sm">
            {caseStudyCount > 0 && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {caseStudyCount} Case {caseStudyCount === 1 ? 'Study' : 'Studies'}
                </span>
              </div>
            )}
            
            {algorithmCount > 0 && (
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {algorithmCount} Related {algorithmCount === 1 ? 'Algorithm' : 'Algorithms'}
                </span>
              </div>
            )}

            {personaCount > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {personaCount} Target {personaCount === 1 ? 'Role' : 'Roles'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-outer py-8 md:py-12">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1fr,300px]">
          {/* Article Content */}
          <article className="max-w-none">
            {/* Sector Information - Removed as industries don't have sectors field */}

            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-p:text-foreground/90">
              {children}
            </div>
          </article>

          {/* Professional Sidebar */}
          <aside className="space-y-6">
            {/* Industry Properties */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                <Building className="h-4 w-4" />
                Industry Details
              </h3>
              <div className="space-y-4">
              </div>
            </div>

            {/* Related Algorithms */}
            {industry.algorithm_industry_relations && industry.algorithm_industry_relations.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Related Algorithms
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const relations = industry.algorithm_industry_relations || [];
                    const naItem = relations.find(rel => rel.algorithms?.slug === 'not-applicable');
                    if (naItem && relations.length === 1) {
                      return <span className="text-xs text-muted-foreground">Not Applicable</span>;
                    }
                    const actualItems = relations.filter(rel => rel.algorithms?.slug !== 'not-applicable');
                    if (actualItems.length === 0) {
                      return <span className="text-xs text-muted-foreground">None</span>;
                    }
                    return actualItems.map((relation) =>
                      relation.algorithms ? (
                        <Link key={relation.algorithms.id} href={`/paths/algorithm/${relation.algorithms?.slug}`}>
                          <Badge variant="default" className="text-xs hover:bg-primary/80 cursor-pointer">
                            {relation.algorithms.name}
                          </Badge>
                        </Link>
                      ) : null
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Related Personas */}
            {industry.persona_industry_relations && industry.persona_industry_relations.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Target Roles
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const relations = industry.persona_industry_relations || [];
                    const naItem = relations.find(rel => rel.personas?.slug === 'not-applicable');
                    if (naItem && relations.length === 1) {
                      return <span className="text-xs text-muted-foreground">Not Applicable</span>;
                    }
                    const actualItems = relations.filter(rel => rel.personas?.slug !== 'not-applicable');
                    if (actualItems.length === 0) {
                      return <span className="text-xs text-muted-foreground">None</span>;
                    }
                    return actualItems.map((relation) =>
                      relation.personas ? (
                        <Link key={relation.personas.id} href={`/paths/persona/${relation.personas?.slug}`}>
                          <Badge variant="default" className="text-xs hover:bg-primary/80 cursor-pointer">
                            {relation.personas.name}
                          </Badge>
                        </Link>
                      ) : null
                    );
                  })()}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}