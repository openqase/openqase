// src/app/page.tsx
import Link from 'next/link';
import {
  Github,
  Users,
} from 'lucide-react';
import { AutoSchema } from '@/components/AutoSchema';
import { SOCIAL_LINKS } from '@/lib/external-links';
import SearchCard from '@/components/SearchCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import { LatestList } from '@/components/LatestList';
import { getBuildTimeContentList, fetchSearchData } from '@/lib/content-fetchers';
import { getCaseStudyRelationshipMap } from '@/lib/relationship-queries';
import type { BlogPost, DbCaseStudy } from '@/lib/types';
import { draftMode } from 'next/headers';

// Force this page to be statically generated at build time
export const dynamic = 'force-static'


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
    latestCaseStudiesData,
    featuredData,
    featuredBlogData
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
    getBuildTimeContentList('case_studies', { filters: publishedFilter, limit: 5 }),
    getBuildTimeContentList('case_studies', { filters: { ...publishedFilter, featured: true }, limit: 1 }),
    getBuildTimeContentList('blog_posts', { filters: { ...publishedFilter, featured: true }, limit: 1 })
  ]);

  // Type the blog posts and latest case studies properly
  const blogPosts = blogPostsData as BlogPost[];
  const latestCaseStudies = latestCaseStudiesData as DbCaseStudy[];
  const featuredCaseStudyData = featuredData as DbCaseStudy[];
  const featuredBlogPostData = featuredBlogData as BlogPost[];

  // Use explicitly featured items, or fall back to most recent
  const featuredCaseStudy = featuredCaseStudyData[0] || latestCaseStudies[0] || null;
  const featuredBlogPost = featuredBlogPostData[0] || blogPosts[0] || null;
  // Remove featured from regular lists to avoid duplication
  const regularCaseStudies = featuredCaseStudy
    ? latestCaseStudies.filter(cs => cs.id !== featuredCaseStudy.id)
    : latestCaseStudies;
  const regularBlogPosts = featuredBlogPost
    ? blogPosts.filter(p => p.id !== featuredBlogPost.id)
    : blogPosts;

  const allDisplayedIds = [
    ...(featuredCaseStudy ? [featuredCaseStudy.id] : []),
    ...regularCaseStudies.map(cs => cs.id),
  ];
  const relationshipMap = allDisplayedIds.length > 0
    ? await getCaseStudyRelationshipMap(allDisplayedIds)
    : {};

  const stats = [
    { label: 'Case Studies', count: caseStudies.length, href: '/case-study' },
    { label: 'Algorithms', count: algorithms.length, href: '/paths/algorithm' },
    { label: 'Industries', count: industries.length, href: '/paths/industry' },
    { label: 'Roles', count: personas.length, href: '/paths/persona' },
    { label: 'Software', count: quantumSoftware.length, href: '/paths/quantum-software' },
    { label: 'Hardware', count: quantumHardware.length, href: '/paths/quantum-hardware' },
    { label: 'Companies', count: quantumCompanies.length, href: '/paths/quantum-companies' },
    { label: 'Partners', count: partnerCompanies.length, href: '/paths/partner-companies' },
  ];

  return (
    <div className="flex flex-col">
      <AutoSchema type="organization" />
      <AutoSchema type="website" />
      <AutoSchema type="faq" />

      {/* Hero Section - Search First */}
      <section className="relative bg-background">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 md:pt-16 md:pb-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-4">
              Quantum Computing Case Studies
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              How industry leaders use quantum computing to solve real business problems.
              Open-source documentation with technical details.
            </p>
          </div>

          <div className="max-w-3xl mx-auto mb-10">
            <SearchCard searchData={searchData} />
          </div>

          {/* Stats Grid — two equal rows of 4 */}
          <div className="max-w-3xl mx-auto border-y border-border py-4">
            <div className="grid grid-cols-4 gap-y-4">
              {stats.map((stat) => (
                <Link key={stat.label} href={stat.href} className="text-center group">
                  <div className="text-2xl md:text-3xl font-bold text-primary">
                    {stat.count}
                  </div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5 group-hover:text-primary transition-colors">
                    {stat.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Latest Sections — text lists */}
      <section className="py-12 md:py-16 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <LatestList
              title="Latest Case Studies"
              viewAllHref="/case-study"
              viewAllCount={caseStudies.length}
              featured={featuredCaseStudy ? (() => {
                const featuredRels = relationshipMap[featuredCaseStudy.id];
                const featuredPills = featuredRels
                  ? [...featuredRels.industries.map(i => i.name), ...featuredRels.algorithms.map(a => a.name)].slice(0, 4)
                  : [];
                return {
                  title: featuredCaseStudy.title,
                  description: featuredCaseStudy.description || 'Explore this quantum computing implementation.',
                  href: `/case-study/${featuredCaseStudy.slug}`,
                  pills: featuredPills,
                };
              })() : undefined}
              items={regularCaseStudies.map((cs) => {
                const rels = relationshipMap[cs.id];
                const pills = rels
                  ? [...rels.industries.map(i => i.name), ...rels.algorithms.map(a => a.name)].slice(0, 3)
                  : [];
                return {
                  title: cs.title,
                  description: cs.description || 'Explore this quantum computing implementation.',
                  href: `/case-study/${cs.slug}`,
                  pills,
                };
              })}
            />

            <LatestList
              title="Latest Blog Posts"
              viewAllHref="/blog"
              featured={featuredBlogPost ? {
                title: featuredBlogPost.title,
                description: featuredBlogPost.description || 'Read more about this topic.',
                href: `/blog/${featuredBlogPost.slug}`,
              } : undefined}
              items={regularBlogPosts.map((post) => ({
                title: post.title,
                description: post.description || 'Read more about this topic.',
                href: `/blog/${post.slug}`,
                meta: post.published_at
                  ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : undefined,
              }))}
            />
          </div>
        </div>
      </section>

      {/* Newsletter & Community — unchanged */}
      <section className="py-12 md:py-16 px-4 bg-muted/30 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div>
              <NewsletterSignup />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-6">Open Source & Community</h2>
              <div className="space-y-4">
                <Link
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-card rounded-lg border border-border px-5 py-4 elevation-interactive hover:border-primary group"
                >
                  <Github className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
                  <div>
                    <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">Contribute on GitHub</h3>
                    <p className="text-sm text-muted-foreground">All code and content is open source</p>
                  </div>
                  <span className="sr-only">(opens in new tab)</span>
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
