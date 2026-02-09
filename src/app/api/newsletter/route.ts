import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter'
import { createDualNewsletterService } from '@/lib/dual-newsletter-service'
// import { trackNewsletterSignup } from '@/lib/analytics' // TODO: Add after database types are updated

// Email validation schema
const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional().default('website'), // Track subscription source
})

// Unsubscribe schema
const unsubscribeSchema = z.object({
  token: z.string().min(1, 'Unsubscribe token is required'),
})

/**
 * Subscribe to newsletter
 */
export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    const rateLimitResult = await rateLimiter.checkLimit(
      `newsletter:${clientIP}`,
      RATE_LIMITS.newsletter.limit,
      RATE_LIMITS.newsletter.windowMs
    )
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.newsletter.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '300'
          }
        }
      )
    }

    const data = await request.json()
    
    // Validate the email
    const result = newsletterSchema.safeParse(data)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const { email, source } = result.data
    
    // Use dual newsletter service
    const newsletterService = createDualNewsletterService()
    const subscriptionResult = await newsletterService.subscribeToNewsletter(email, source)

    return NextResponse.json(
      { 
        message: subscriptionResult.message,
        email: subscriptionResult.email,
        alreadySubscribed: subscriptionResult.alreadySubscribed
      },
      { 
        status: subscriptionResult.success ? 200 : 500,
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.newsletter.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        }
      }
    )
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
}

/**
 * Unsubscribe from newsletter
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Find subscription by token and update status
    const { data: subscription, error: selectError } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, status')
      .eq('unsubscribe_token', token)
      .single()

    if (selectError || !subscription) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 404 }
      )
    }

    if (subscription.status === 'unsubscribed') {
      return NextResponse.json({
        message: 'You are already unsubscribed from our newsletter.',
        email: subscription.email
      })
    }

    // Use dual newsletter service for unsubscribe
    const newsletterService = createDualNewsletterService()
    const result = await newsletterService.unsubscribeFromNewsletter(subscription.email)

    return NextResponse.json({
      message: result.message,
      email: subscription.email
    }, { 
      status: result.success ? 200 : 500 
    })
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe from newsletter' },
      { status: 500 }
    )
  }
}

/**
 * Get unsubscribe status (for unsubscribe page)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Find subscription by token
    const { data: subscription, error: selectError } = await supabase
      .from('newsletter_subscriptions')
      .select('email, status')
      .eq('unsubscribe_token', token)
      .single()

    if (selectError || !subscription) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      email: subscription.email,
      status: subscription.status,
      alreadyUnsubscribed: subscription.status === 'unsubscribed'
    })
  } catch (error) {
    console.error('Newsletter status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
} 