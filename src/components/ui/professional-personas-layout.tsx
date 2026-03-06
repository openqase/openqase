import { ReactNode } from 'react';
import { ArrowLeft, Users, Search } from 'lucide-react';
import Link from 'next/link';

interface ProfessionalPersonasLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  backLinkText?: string;
  backLinkHref?: string;
  personaCount?: number;
}

export default function ProfessionalPersonasLayout({
  title,
  description = "Role-specific quantum computing content tailored for different professional responsibilities and technical backgrounds.",
  children,
  backLinkText = "Back to Related Content",
  backLinkHref = "/paths",
  personaCount = 0
}: ProfessionalPersonasLayoutProps) {
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
                <Users className="h-5 w-5 text-primary" />
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
            {personaCount > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {personaCount} Professional {personaCount === 1 ? 'Role' : 'Roles'}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">
                Searchable by Role & Expertise
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