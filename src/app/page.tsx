// src/app/page.tsx
import Link from 'next/link';
import {
  User,
  Building2,
  CircuitBoard,
  ArrowRight,
  Github,
  Users,
  BookOpen,
  Database,
  ExternalLink,
  Code,
  Cpu,
  Factory,
  Handshake
} from 'lucide-react';
import { AutoSchema } from '@/components/AutoSchema';
import SearchCard from '@/components/SearchCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import { getBuildTimeContentList, fetchSearchData, getStaticContentList } from '@/lib/content-fetchers';
import type { BlogPost, DbCaseStudy } from '@/lib/types';
import { draftMode } from 'next/headers';

// Force this page to be statically generated at build time
export const dynamic = 'force-static'

interface CategoryStats {
  title: string;
  count: number;
  icon: React.ReactNode;
  href: string;
}


export default async function HomePage() {
  // Check if we're in preview mode
  const { isEnabled: isPreview } = await draftMode();
  
  // Fetch optimized search data (streamlined payload for performance)
  const searchData = await fetchSearchData();

  // Get actual content counts from database
  // In preview mode, show all content including drafts
  const publishedFilter = isPreview ? {} : { published: true };
  
  const [
    caseStudies,
    algorithms,
    industries,
    personas,
    quantumSoftware,
    quantumHardware,
    quantumCompanies,
    partnerCompanies,
    blogPostsData,
    latestCaseStudiesData
  ] = await Promise.all([
    getBuildTimeContentList('case_studies', { filters: publishedFilter }),
    getBuildTimeContentList('algorithms', { filters: publishedFilter }),
    getBuildTimeContentList('industries', { filters: publishedFilter }),
    getBuildTimeContentList('personas', { filters: publishedFilter }),
    getBuildTimeContentList('quantum_software', { filters: publishedFilter }),
    getBuildTimeContentList('quantum_hardware', { filters: publishedFilter }),
    getBuildTimeContentList('quantum_companies', { filters: publishedFilter }),
    getBuildTimeContentList('partner_companies', { filters: publishedFilter }),
    getBuildTimeContentList('blog_posts', { filters: publishedFilter, limit: 5 }),
    getBuildTimeContentList('case_studies', { filters: publishedFilter, limit: 5 })
  ]);

  // Type the blog posts and latest case studies properly
  const blogPosts = blogPostsData as BlogPost[];
  const latestCaseStudies = latestCaseStudiesData as DbCaseStudy[];

  // Primary content stats
  const primaryStats: CategoryStats[] = [
    {
      title: "Case Studies",
      count: caseStudies.length,
      icon: <BookOpen className="w-4 h-4" />,
      href: "/case-study"
    },
    {
      title: "Algorithms",
      count: algorithms.length,
      icon: <CircuitBoard className="w-4 h-4" />,
      href: "/paths/algorithm"
    },
    {
      title: "Industries",
      count: industries.length,
      icon: <Building2 className="w-4 h-4" />,
      href: "/paths/industry"
    },
    {
      title: "Roles",
      count: personas.length,
      icon: <User className="w-4 h-4" />,
      href: "/paths/persona"
    }
  ];

  // Ecosystem stats (new content types)
  const ecosystemStats: CategoryStats[] = [
    {
      title: "Software",
      count: quantumSoftware.length,
      icon: <Code className="w-4 h-4" />,
      href: "/paths/quantum-software"
    },
    {
      title: "Hardware",
      count: quantumHardware.length,
      icon: <Cpu className="w-4 h-4" />,
      href: "/paths/quantum-hardware"
    },
    {
      title: "Companies",
      count: quantumCompanies.length,
      icon: <Factory className="w-4 h-4" />,
      href: "/paths/quantum-companies"
    },
    {
      title: "Partners",
      count: partnerCompanies.length,
      icon: <Handshake className="w-4 h-4" />,
      href: "/paths/partner-companies"
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Automatic schema markup for SEO */}
      <AutoSchema type="organization" />
      <AutoSchema type="website" />
      <AutoSchema type="faq" />
      
      {/* Clean Hero Section - Search First */}
      <section className="relative bg-background">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 md:pt-16 md:pb-12">
          {/* Centered Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground tracking-tight mb-4">
              Quantum Computing Case Studies
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              How industry leaders use quantum computing to solve real business problems.
              Open-source documentation with technical details.
            </p>
          </div>

          {/* Search Bar - Prominent & Wide */}
          <div className="max-w-3xl mx-auto mb-10">
            <SearchCard searchData={searchData} />
          </div>

          {/* Stats - Symmetrical 4x2 Grid */}
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
              {[...primaryStats, ...ecosystemStats].map((stat) => (
                <Link
                  key={stat.title}
                  href={stat.href}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm hover:border-primary hover:bg-primary/5 transition-colors group whitespace-nowrap"
                >
                  <span className="text-muted-foreground group-hover:text-primary">{stat.icon}</span>
                  <span className="font-medium text-primary">{stat.count}</span>
                  <span className="text-muted-foreground">{stat.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Content Section */}
      <section className="py-16 md:py-24 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Latest Case Studies */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-foreground">Latest Case Studies</h2>
                <Link href="/case-study" className="inline-flex items-center text-primary hover:underline text-sm font-medium">
                  View all {caseStudies.length}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {latestCaseStudies.length > 0 ? (
                  latestCaseStudies.map((caseStudy) => (
                    <Link key={caseStudy.id} href={`/case-study/${caseStudy.slug}`} className="block group">
                      <div className="bg-card rounded-lg border border-border px-5 py-4 h-[140px] flex flex-col justify-center elevation-interactive hover:border-primary">
                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {caseStudy.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {caseStudy.description || 'Explore this quantum computing implementation.'}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="bg-card rounded-lg border border-border px-5 py-4 h-[140px] flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground">Case studies coming soon.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Latest Blog Posts */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-foreground">Latest Blog Posts</h2>
                <Link href="/blog" className="inline-flex items-center text-primary hover:underline text-sm font-medium">
                  View all
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {blogPosts.length > 0 ? (
                  blogPosts.map((blogPost) => (
                    <Link key={blogPost.id} href={`/blog/${blogPost.slug}`} className="block group">
                      <div className="bg-card rounded-lg border border-border px-5 py-4 h-[140px] flex flex-col justify-center elevation-interactive hover:border-primary">
                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {blogPost.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {blogPost.description || 'Read more about this topic.'}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="bg-card rounded-lg border border-border px-5 py-4 h-[140px] flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground">Blog posts coming soon.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter & Community */}
      <section className="py-16 md:py-20 px-4 bg-muted/30 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Newsletter */}
            <div>
              <NewsletterSignup />
            </div>

            {/* Community Links */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-6">Open Source & Community</h2>
              <div className="space-y-4">
                <Link
                  href="https://github.com/openqase/openqase"
                  className="flex items-center gap-4 bg-card rounded-lg border border-border px-5 py-4 elevation-interactive hover:border-primary group"
                >
                  <Github className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">Contribute on GitHub</h3>
                    <p className="text-sm text-muted-foreground">All code and content is open source</p>
                  </div>
                </Link>

                <Link
                  href="/contact"
                  className="flex items-center gap-4 bg-card rounded-lg border border-border px-5 py-4 elevation-interactive hover:border-primary group"
                >
                  <Users className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">Submit a Case Study</h3>
                    <p className="text-sm text-muted-foreground">Share your quantum computing implementation</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}