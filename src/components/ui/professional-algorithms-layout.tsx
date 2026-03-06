import { ReactNode } from 'react';
import { ArrowLeft, Cpu, Search, Code } from 'lucide-react';
import Link from 'next/link';

interface ProfessionalAlgorithmsLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  backLinkText?: string;
  backLinkHref?: string;
  algorithmCount?: number;
  useCaseCount?: number;
}

export default function ProfessionalAlgorithmsLayout({
  title,
  description = "Explore quantum algorithms and their computational advantages across different problem domains, from optimization to cryptography.",
  children,
  backLinkText = "Back to Related Content",
  backLinkHref = "/paths",
  algorithmCount = 0,
  useCaseCount = 0
}: ProfessionalAlgorithmsLayoutProps) {
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                {title}
              </h1>
            </div>
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
            {algorithmCount > 0 && (
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {algorithmCount} Quantum {algorithmCount === 1 ? 'Algorithm' : 'Algorithms'}
                </span>
              </div>
            )}
            
            {useCaseCount > 0 && (
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {useCaseCount} Application {useCaseCount === 1 ? 'Area' : 'Areas'}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">
                Searchable by Name & Use Cases
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-outer py-8 md:py-12">
        {children}
      </div>
    </div>
  );
}