import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Parse query string parameters
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const type = searchParams.get('type') || 'case-study';

  // Access is granted either by the shared secret (external links) or by a
  // signed-in admin session (the admin "Preview" button, which must not embed
  // the secret in client code).
  const validSecret = process.env.PREVIEW_SECRET;
  const hasValidSecret =
    !!validSecret &&
    !!secret &&
    secret.length === validSecret.length &&
    crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(validSecret));

  if (!hasValidSecret) {
    const auth = await requireAdmin();
    if (auth.error) {
      return new Response('Invalid token', { status: 401 });
    }
  }

  // Enable Draft Mode by setting the cookie
  const draft = await draftMode();
  draft.enable();

  // Redirect to the path from the fetched content
  // We'll default to homepage if no slug provided
  if (!slug) {
    redirect('/');
  }

  // Redirect to the appropriate content page. The slug is user-supplied, so
  // encode it to keep it confined to a single path segment.
  const encodedSlug = encodeURIComponent(slug);
  switch (type) {
    case 'case-study':
      redirect(`/case-study/${encodedSlug}`);
      break;
    case 'algorithm':
      redirect(`/paths/algorithm/${encodedSlug}`);
      break;
    case 'industry':
      redirect(`/paths/industry/${encodedSlug}`);
      break;
    case 'persona':
      redirect(`/paths/persona/${encodedSlug}`);
      break;
    case 'blog':
      redirect(`/blog/${encodedSlug}`);
      break;
    case 'quantum-hardware':
      redirect(`/paths/quantum-hardware/${encodedSlug}`);
      break;
    case 'quantum-software':
      redirect(`/paths/quantum-software/${encodedSlug}`);
      break;
    case 'quantum-companies':
      redirect(`/paths/quantum-companies/${encodedSlug}`);
      break;
    case 'partner-companies':
      redirect(`/paths/partner-companies/${encodedSlug}`);
      break;
    default:
      redirect('/');
  }
}

// API route to exit preview mode
export async function DELETE() {
  const draft = await draftMode();
  draft.disable();
  return new Response('Preview mode disabled', { status: 200 });
}