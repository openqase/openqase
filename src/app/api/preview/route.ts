import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Parse query string parameters
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const type = searchParams.get('type') || 'case-study';

  // Check the secret to prevent unauthorized access
  // In development, allow preview without secret for easier testing
  const isDev = process.env.NODE_ENV === 'development';
  const validSecret = process.env.PREVIEW_SECRET;

  if (!isDev && !validSecret) {
    return new Response('Preview secret not configured', { status: 500 });
  }

  if (!isDev && secret !== validSecret) {
    return new Response('Invalid token', { status: 401 });
  }

  // Enable Draft Mode by setting the cookie
  const draft = await draftMode();
  draft.enable();

  // Redirect to the path from the fetched content
  // We'll default to homepage if no slug provided
  if (!slug) {
    redirect('/');
  }

  // Redirect to the appropriate content page
  switch (type) {
    case 'case-study':
      redirect(`/case-study/${slug}`);
      break;
    case 'algorithm':
      redirect(`/paths/algorithm/${slug}`);
      break;
    case 'industry':
      redirect(`/paths/industry/${slug}`);
      break;
    case 'persona':
      redirect(`/paths/persona/${slug}`);
      break;
    case 'blog':
      redirect(`/blog/${slug}`);
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