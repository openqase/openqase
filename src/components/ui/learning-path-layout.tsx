import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LearningPathLayoutProps {
  title: string;
  children: ReactNode;
  description?: string;
  backLinkText?: string;
  backLinkHref?: string;
}

export default function LearningPathLayout({
  title,
  children,
  description,
  backLinkText = "Back to Related Content",
  backLinkHref = "/paths"
}: LearningPathLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="container-outer section-spacing">
        <div className="mb-8">
          <Link
            href={backLinkHref}
            className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLinkText}</span>
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl mb-4">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-lg">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
} 