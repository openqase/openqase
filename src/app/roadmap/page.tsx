import { Metadata } from 'next'
import { FeedbackButton } from '@/components/FeedbackButton'

export const metadata: Metadata = {
  title: 'Product Roadmap - OpenQase',
  description: 'Explore OpenQase\'s product roadmap and see what we\'re building for the future of quantum computing business applications.',
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen">
      <div className="container-outer section-spacing">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="mb-6">
            Product Roadmap
          </h1>
          <p className="text-xl text-muted-foreground">
            Our collective community vision for the future of OpenQase.
            See what we&apos;re building and what&apos;s coming next.
          </p>
        </div>

        {/* Roadmap Content */}
        <div className="max-w-4xl mx-auto">
          {/* Recently Released */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <h2 className="text-2xl font-semibold">Recently Released</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">v0.5.0 &mdash; Hybrid Architecture</h3>
                  <span className="text-sm text-muted-foreground">January 2026</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>&bull; Static generation for all public content</li>
                      <li>&bull; Unified content fetching system</li>
                      <li>&bull; 50&ndash;100ms page loads, 145+ static pages</li>
                      <li>&bull; Professional soft delete with recovery</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Features</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>&bull; Featured content management</li>
                      <li>&bull; Case study import system</li>
                      <li>&bull; Newsletter integration (Beehiiv + Resend)</li>
                      <li>&bull; Complete security audit</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* In Progress */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <h2 className="text-2xl font-semibold">In Development</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">v0.6.0 &mdash; Content Quality &amp; Cleanup</h3>
                  <span className="text-sm text-muted-foreground">In progress</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  Strengthening the foundation &mdash; security, testing, type safety, and performance improvements.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Completed</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>&bull; Security audit and defence-in-depth hardening</li>
                      <li>&bull; 235+ unit tests with Vitest</li>
                      <li>&bull; Type safety improvements across codebase</li>
                      <li>&bull; Bundle size optimisation</li>
                      <li>&bull; Accessibility fixes</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Remaining</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>&bull; Case study quality audit and templates</li>
                      <li>&bull; Enhanced social sharing images</li>
                      <li>&bull; Database performance optimisation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Upcoming */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <h2 className="text-2xl font-semibold">Planned Features</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">v0.7.0 &mdash; CMS Power Features</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Making the CMS more powerful for content administrators and contributors.
                </p>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>&bull; Bulk import system redesign</li>
                  <li>&bull; Newsletter system completion</li>
                  <li>&bull; Multi-admin support with roles</li>
                  <li>&bull; Content versioning and change history</li>
                  <li>&bull; Scheduled publishing</li>
                </ul>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">v0.8.0 &mdash; Visualisation &amp; Technical Content</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Enhanced technical content presentation and discovery tools.
                </p>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>&bull; LaTeX/math formula support for algorithms</li>
                  <li>&bull; Industry page visualisations</li>
                  <li>&bull; Charting and diagramming (Mermaid)</li>
                  <li>&bull; Full-text search with filters</li>
                </ul>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">v0.9.0 &mdash; Infrastructure &amp; Scale</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Preparing for production scale and sustainability.
                </p>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>&bull; Sponsor blocks for featured placements</li>
                  <li>&bull; Production Redis caching deployment</li>
                  <li>&bull; Performance benchmarking suite</li>
                  <li>&bull; Tailwind CSS v4 migration</li>
                </ul>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">v1.0.0 &mdash; Production Ready</h3>
                  <span className="text-sm text-muted-foreground">Target: July 2026</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  Official production launch with comprehensive testing, documentation, and accessibility compliance.
                </p>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>&bull; WCAG accessibility compliance audit</li>
                  <li>&bull; Complete API documentation and SDKs</li>
                  <li>&bull; MCP (Model Context Protocol) server</li>
                  <li>&bull; Official launch campaign</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Feedback Section */}
          <section>
            <div className="bg-card border rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Shape Our Roadmap</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Your feedback and suggestions help us prioritise features and improvements.
                Let us know what matters most to you and your organisation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <FeedbackButton />
                <a
                  href="https://github.com/openqase/openqase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-background border border-border hover:bg-muted px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
