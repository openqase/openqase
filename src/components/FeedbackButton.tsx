'use client';

import { TALLY_FORMS } from '@/lib/external-links';

export function FeedbackButton() {
  const handleFeedbackOpen = () => {
    window.open(TALLY_FORMS.contact, '_blank', 'width=700,height=800,scrollbars=yes,resizable=yes');
  };

  return (
    <button
      onClick={handleFeedbackOpen}
      className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
    >
      Share Feedback
    </button>
  );
}
