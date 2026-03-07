'use client';

import { TALLY_FORMS } from '@/lib/external-links';

const FORM_URLS = {
  contribute: TALLY_FORMS.contribute,
  questions: TALLY_FORMS.contact,
  partner: TALLY_FORMS.partner,
};

export function GetInvolvedSection() {
  const handleFormOpen = (formType: keyof typeof FORM_URLS) => {
    window.open(FORM_URLS[formType], '_blank', 'width=700,height=800,scrollbars=yes,resizable=yes');
  };

  return (
    <>
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="mb-4">Get Involved</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our community of quantum computing professionals. Contribute content, ask questions, or explore partnership opportunities.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card border rounded-lg p-6 text-center hover:shadow-md transition-shadow flex flex-col">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-semibold text-primary">📝</span>
            </div>
            <h4 className="font-semibold mb-3">Contribute Content</h4>
            <p className="text-muted-foreground mb-6 flex-grow">Share your quantum computing case study or implementation experience with our community.</p>
            <button
              onClick={() => handleFormOpen('contribute')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Submit Case Study
            </button>
          </div>

          <div className="bg-card border rounded-lg p-6 text-center hover:shadow-md transition-shadow flex flex-col">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-semibold text-primary">💬</span>
            </div>
            <h4 className="font-semibold mb-3">Ask Questions</h4>
            <p className="text-muted-foreground mb-6 flex-grow">Get help understanding quantum applications for your specific industry or use case.</p>
            <button
              onClick={() => handleFormOpen('questions')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Get in Touch
            </button>
          </div>

          <div className="bg-card border rounded-lg p-6 text-center hover:shadow-md transition-shadow flex flex-col">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-semibold text-primary">🤝</span>
            </div>
            <h4 className="font-semibold mb-3">Partner With Us</h4>
            <p className="text-muted-foreground mb-6 flex-grow">Explore partnerships for content collaboration or platform integration.</p>
            <button
              onClick={() => handleFormOpen('partner')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Work Together
            </button>
          </div>
        </div>
      </section>

    </>
  );
}
