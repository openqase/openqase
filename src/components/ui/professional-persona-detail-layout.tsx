import { ReactNode } from 'react';
import { ArrowLeft, Users, Building, BookOpen, Target } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface ProfessionalPersonaDetailLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  backLinkText?: string;
  backLinkHref?: string;
  persona: {
    expertise?: string[] | null;
    persona_industry_relations?: { industries: { id: string; name: string; slug?: string | null } | null }[];
    case_study_persona_relations?: { case_studies: { id: string; title: string; slug: string; description: string; published_at: string } | null }[];
  };
}

export default function ProfessionalPersonaDetailLayout({
  title,
  description,
  children,
  backLinkText = "Back to Personas",
  backLinkHref = "/paths/persona",
  persona
}: ProfessionalPersonaDetailLayoutProps) {
  // Count related items
  const industryCount = persona.persona_industry_relations?.filter(rel => rel.industries?.slug !== 'not-applicable').length || 0;
  const caseStudyCount = persona.case_study_persona_relations?.filter(rel => rel.case_studies).length || 0;
  const expertiseCount = persona.expertise?.length || 0;

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
            {expertiseCount > 0 && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {expertiseCount} {expertiseCount === 1 ? 'Expertise Area' : 'Expertise Areas'}
                </span>
              </div>
            )}
            
            {caseStudyCount > 0 && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {caseStudyCount} Relevant Case {caseStudyCount === 1 ? 'Study' : 'Studies'}
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-outer py-8 md:py-12">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1fr,300px]">
          {/* Article Content */}
          <article className="max-w-none">
            {/* Expertise Section */}
            {persona.expertise && persona.expertise.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-foreground">Key Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {persona.expertise.map((item: string) => (
                    <Badge key={item} variant="secondary" className="text-sm">
                      {item}
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
            {/* Persona Profile */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Professional Profile
              </h3>
              <div className="space-y-4">
                {persona.expertise && persona.expertise.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Core Expertise</div>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.expertise.map((item: string) => (
                        <Badge key={item} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Industries */}
            {persona.persona_industry_relations && persona.persona_industry_relations.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Related Industries
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const relations = persona.persona_industry_relations || [];
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
          </aside>
        </div>
      </div>
    </div>
  );
}