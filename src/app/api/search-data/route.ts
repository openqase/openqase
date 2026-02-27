import { NextRequest, NextResponse } from 'next/server';
import { fetchSearchData } from '@/lib/content-fetchers';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await applyRateLimit(request, RATE_LIMITS.general);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          },
        }
      );
    }

    const searchData = await fetchSearchData();
    return NextResponse.json(searchData);
  } catch (error) {
    console.error('Failed to fetch search data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search data' },
      { status: 500 }
    );
  }
}