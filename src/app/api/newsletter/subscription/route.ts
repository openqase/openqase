import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Get current user's newsletter subscription status
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has active newsletter subscription
    const { data: subscription } = await supabase
      .from('newsletter_subscriptions')
      .select('status')
      .eq('email', user.email!)
      .single()

    const isSubscribed = subscription?.status === 'active'

    return NextResponse.json({
      email: user.email,
      isSubscribed,
      status: subscription?.status || 'not_subscribed'
    })
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
}

/**
 * Subscribe or unsubscribe authenticated user from newsletter
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { subscribe } = await request.json()
    
    if (typeof subscribe !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: subscribe must be true or false' },
        { status: 400 }
      )
    }

    const email = user.email!

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('newsletter_subscriptions')
      .select('id, status, metadata')
      .eq('email', email)
      .single()

    if (subscribe) {
      // Subscribe user
      if (existing) {
        if (existing.status === 'active') {
          return NextResponse.json({
            message: 'Already subscribed to newsletter',
            isSubscribed: true
          })
        } else {
          // Reactivate subscription
          const { error: updateError } = await supabase
            .from('newsletter_subscriptions')
            .update({ 
              status: 'active',
              subscription_date: new Date().toISOString(),
              metadata: { ...(existing.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata) ? existing.metadata : {}), source: 'profile_page', reactivated: true }
            })
            .eq('email', email)

          if (updateError) {
            console.error('Error reactivating subscription:', updateError)
            return NextResponse.json(
              { error: 'Failed to subscribe to newsletter' },
              { status: 500 }
            )
          }
        }
      } else {
        // Create new subscription
        const { error: insertError } = await supabase
          .from('newsletter_subscriptions')
          .insert({
            email,
            status: 'active',
            metadata: { source: 'profile_page' }
          })

        if (insertError) {
          console.error('Error creating subscription:', insertError)
          return NextResponse.json(
            { error: 'Failed to subscribe to newsletter' },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        message: 'Successfully subscribed to newsletter',
        isSubscribed: true
      })
    } else {
      // Unsubscribe user
      if (!existing || existing.status !== 'active') {
        return NextResponse.json({
          message: 'Not currently subscribed to newsletter',
          isSubscribed: false
        })
      }

      // Update subscription status to unsubscribed
      const { error: updateError } = await supabase
        .from('newsletter_subscriptions')
        .update({ 
          status: 'unsubscribed',
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (updateError) {
        console.error('Error unsubscribing:', updateError)
        return NextResponse.json(
          { error: 'Failed to unsubscribe from newsletter' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Successfully unsubscribed from newsletter',
        isSubscribed: false
      })
    }
  } catch (error) {
    console.error('Newsletter subscription management error:', error)
    return NextResponse.json(
      { error: 'Failed to manage newsletter subscription' },
      { status: 500 }
    )
  }
} 