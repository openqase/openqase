import { ReactNode } from 'react';
import { ArrowLeft, Cpu, Code, Building, Users, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface ProfessionalAlgorithmDetailLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  backLinkText?: string;
  backLinkHref?: string;
  algorithm: {
    use_cases?: string[] | null;
    algorithm_industry_relations?: { industries: { id: string; name: string; slug?: string | null } | null }[];
    persona_algorithm_relations?: { personas: { id: string; name: string; slug?: string | null } | null }[];
  };
}

export default function ProfessionalAlgorithmDetailLayout({
  title,
  description,
  children,
  backLinkText = "Back to Algorithms",
  backLinkHref = "/paths/algorithm",
  algorithm
}: ProfessionalAlgorithmDetailLayoutProps) {
  // Count related items
  const industryCount = algorithm.algorithm_industry_relations?.filter(rel => rel.industries?.slug !== 'not-applicable').length || 0;
  const personaCount = algorithm.persona_algorithm_relations?.filter(rel => rel.personas?.slug !== 'not-applicable').length || 0;
  const useCaseCount = algorithm.use_cases?.length || 0;

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
            {useCaseCount > 0 && (
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {useCaseCount} Use {useCaseCount === 1 ? 'Case' : 'Cases'}
                </span>
              </div>
            )}
            
            {industryCount > 0 && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {industryCount} Related {industryCount === 1 ? 'Industry' : 'Industries'}
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
            {/* Use Cases Section */}
            {algorithm.use_cases && algorithm.use_cases.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-foreground">Primary Use Cases</h3>
                <div className="flex flex-wrap gap-2">
                  {algorithm.use_cases.map((useCase: string) => (
                    <Badge key={useCase} variant="secondary" className="text-sm">
                      {useCase}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-p:text-foreground/90">
              {children}
            </div>
          </article>

          {/* Professional Sidebar */}
          <aside className="space-y-6">
            {/* Algorithm Properties */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Algorithm Details
              </h3>
              <div className="space-y-4">
                {algorithm.use_cases && algorithm.use_cases.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Applications</div>
                    <div className="flex flex-wrap gap-1.5">
                      {algorithm.use_cases.map((useCase: string) => (
                        <Badge key={useCase} variant="outline" className="text-xs">
                          {useCase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Industries */}
            {algorithm.algorithm_industry_relations && algorithm.algorithm_industry_relations.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Related Industries
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const relations = algorithm.algorithm_industry_relations || [];
                    const naItem = relations.find(rel => rel.industries?.slug === 'not-applicable');
                    if (naItem && relations.length === 1) {
                      return <span className="text-xs text-muted-foreground">Not Applicable</span>;
                    }
                    const actualItems = relations.filter(rel => rel.industries?.slug !== 'not-applicable');
                    if (actualItems.length === 0) {
                      return <span className="text-xs text-muted-foreground">None</span>;
                    }
                    return actualItems.map((relation) =>
                      relation.industries ? (
                        <Link key={relation.industries.id} href={`/paths/industry/${relation.industries?.slug}`}>
                          <Badge variant="default" className="text-xs hover:bg-primary/80 cursor-pointer">
                            {relation.industries.name}
                          </Badge>
                        </Link>
                      ) : null
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Related Personas */}
            {algorithm.persona_algorithm_relations && algorithm.persona_algorithm_relations.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Target Roles
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const relations = algorithm.persona_algorithm_relations || [];
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