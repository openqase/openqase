// src/app/paths/page.tsx

import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, Building2, Atom, Code, Cpu, Factory, Handshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Related Content | Find Quantum Computing Case Studies by Role & Industry - OpenQase',
  description: 'Find quantum computing case studies relevant to your professional role, industry, or algorithm interest. Structured content for business leaders, engineers, and decision-makers.',
};

export default async function LearningPathsPage() {

  const paths = [
    {
      title: "By Persona",
      description: "Choose your learning path based on your role and experience level.",
      href: "/paths/persona",
      Icon: Users
    },
    {
      title: "By Industry",
      description: "Explore quantum computing applications in your industry.",
      href: "/paths/industry",
      Icon: Building2
    },
    {
      title: "By Algorithm",
      description: "Learn specific quantum algorithms and their applications.",
      href: "/paths/algorithm",
      Icon: Atom
    },
    {
      title: "Quantum Software",
      description: "Explore quantum computing frameworks, libraries, and development tools.",
      href: "/paths/quantum-software",
      Icon: Code
    },
    {
      title: "Quantum Hardware",
      description: "Discover quantum processors, systems, and computing platforms.",
      href: "/paths/quantum-hardware",
      Icon: Cpu
    },
    {
      title: "Quantum Companies",
      description: "Learn about companies building quantum computing solutions.",
      href: "/paths/quantum-companies",
      Icon: Factory
    },
    {
      title: "Partner Companies",
      description: "Explore organizations collaborating on quantum initiatives.",
      href: "/paths/partner-companies",
      Icon: Handshake
    }
  ];

  return (
    <div className="min-h-screen">
        <div className="container-outer section-spacing">
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <h1 className="mb-6">
              Explore by Your Focus
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Browse quantum computing case studies organized by professional role, industry sector, or algorithm type
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 md:mb-16">
            {paths.map((path) => (
              <Link key={path.title} href={path.href} className="group">
                <Card className={cn(
                  "h-full card-link-hover-effect"
                )}>
                  <CardHeader className="h-full flex flex-col">
                    <div className="flex items-center mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <path.Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-grow">
                      <CardTitle className="text-lg sm:text-xl mb-2">
                        {path.title}
                      </CardTitle>
                      <CardDescription className="mb-4">
                        {path.description}
                      </CardDescription>
                    </div>

                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
  );
}