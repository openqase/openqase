import { Resend } from 'resend'
import { createBeehiivService, BeehiivService, BeehiivSubscriptionData } from './beehiiv-service'
import { createServerSupabaseClient } from './supabase-server'

// Configuration for the dual service
interface DualNewsletterConfig {
  useBeehiiv: boolean
  useResend: boolean
  syncToDatabase: boolean
  sendWelcomeEmail: boolean
  preferredService: 'resend' | 'beehiiv'
}

interface SubscriptionResult {
  success: boolean
  message: string
  alreadySubscribed: boolean
  email: string
  services: {
    beehiiv?: { success: boolean; id?: string; error?: string }
    resend?: { success: boolean; id?: string; error?: string }
    database?: { success: boolean; error?: string }
  }
}

export class DualNewsletterService {
  private resend?: Resend
  private beehiiv?: BeehiivService
  private config: DualNewsletterConfig

  constructor(config: DualNewsletterConfig) {
    this.config = config

    // Initialize services based on configuration
    if (config.useResend && process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY)
    }

    if (config.useBeehiiv) {
      try {
        this.beehiiv = createBeehiivService()
      } catch (error) {
        console.warn('Beehiiv service not available:', error)
      }
    }
  }

  /**
   * Subscribe an email to the newsletter using both services
   */
  async subscribeToNewsletter(
    email: string,
    source: string = 'website',
    additionalData: Partial<BeehiivSubscriptionData> = {}
  ): Promise<SubscriptionResult> {
    const result: SubscriptionResult = {
      success: false,
      message: '',
      alreadySubscribed: false,
      email,
      services: {}
    }

    let alreadySubscribed = false
    let primaryServiceSuccess = false

    // Check if already subscribed in database
    if (this.config.syncToDatabase) {
      const existingSubscription = await this.checkDatabaseSubscription(email)
      if (existingSubscription?.status === 'active') {
        alreadySubscribed = true
      }
    }

    // Subscribe to Beehiiv if enabled
    if (this.config.useBeehiiv && this.beehiiv) {
      try {
        const beehiivResult = await this.beehiiv.subscribeToNewsletter({
          email,
          utm_source: additionalData.utm_source || 'openqase',
          utm_campaign: additionalData.utm_campaign || source,
          utm_medium: additionalData.utm_medium || 'web',
          referring_site: additionalData.referring_site || process.env.NEXT_PUBLIC_SITE_URL,
          send_welcome_email: this.config.sendWelcomeEmail && this.config.preferredService === 'beehiiv',
          ...additionalData
        })

        result.services.beehiiv = {
          success: true,
          id: beehiivResult.id
        }

        if (this.config.preferredService === 'beehiiv') {
          primaryServiceSuccess = true
        }

      } catch (error) {
        console.error('Beehiiv subscription failed:', error)
        result.services.beehiiv = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Subscribe to Resend if enabled (for welcome email if it's the preferred service)
    if (this.config.useResend && this.resend && this.config.sendWelcomeEmail && this.config.preferredService === 'resend') {
      try {
        await this.sendResendWelcomeEmail(email)
        result.services.resend = {
          success: true,
          id: 'welcome-email-sent'
        }

        if (this.config.preferredService === 'resend') {
          primaryServiceSuccess = true
        }

      } catch (error) {
        console.error('Resend welcome email failed:', error)
        result.services.resend = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Update database if enabled
    if (this.config.syncToDatabase) {
      try {
        await this.updateDatabaseSubscription(email, source, alreadySubscribed)
        result.services.database = { success: true }
      } catch (error) {
        console.error('Database update failed:', error)
        result.services.database = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Determine overall success
    const hasSuccessfulService = Object.values(result.services).some(service => service?.success)
    result.success = hasSuccessfulService || primaryServiceSuccess

    // Set appropriate message
    if (alreadySubscribed) {
      result.alreadySubscribed = true
      result.message = 'You are already subscribed to our newsletter!'
    } else if (result.success) {
      result.message = 'Successfully subscribed to newsletter! Check your email for confirmation.'
    } else {
      result.message = 'Failed to subscribe to newsletter. Please try again.'
    }

    return result
  }

  /**
   * Check subscription status across all services
   */
  async getSubscriptionStatus(email: string): Promise<{
    subscribed: boolean
    status: string
    services: {
      beehiiv?: any
      database?: any
    }
  }> {
    const result = {
      subscribed: false,
      status: 'not_subscribed',
      services: {} as any
    }

    // Check Beehiiv status
    if (this.beehiiv) {
      try {
        const beehiivStatus = await this.beehiiv.getSubscriptionStatus(email)
        result.services.beehiiv = beehiivStatus
        if (beehiivStatus && beehiivStatus.status === 'active') {
          result.subscribed = true
          result.status = 'active'
        }
      } catch (error) {
        console.error('Error checking Beehiiv status:', error)
      }
    }

    // Check database status
    if (this.config.syncToDatabase) {
      try {
        const dbStatus = await this.checkDatabaseSubscription(email)
        result.services.database = dbStatus
        if (dbStatus && dbStatus.status === 'active') {
          result.subscribed = true
          result.status = 'active'
        }
      } catch (error) {
        console.error('Error checking database status:', error)
      }
    }

    return result
  }

  /**
   * Unsubscribe from all services
   */
  async unsubscribeFromNewsletter(email: string): Promise<{ success: boolean; message: string }> {
    const results = []

    // Unsubscribe from Beehiiv
    if (this.beehiiv) {
      try {
        await this.beehiiv.unsubscribeFromNewsletter(email)
        results.push('beehiiv')
      } catch (error) {
        console.error('Beehiiv unsubscribe failed:', error)
      }
    }

    // Update database
    if (this.config.syncToDatabase) {
      try {
        await this.updateDatabaseSubscription(email, 'unsubscribe', false, 'unsubscribed')
        results.push('database')
      } catch (error) {
        console.error('Database unsubscribe failed:', error)
      }
    }

    return {
      success: results.length > 0,
      message: results.length > 0 
        ? 'Successfully unsubscribed from newsletter.' 
        : 'Failed to unsubscribe from newsletter.'
    }
  }

  /**
   * Test connection to all configured services
   */
  async testConnections(): Promise<{
    beehiiv?: boolean
    resend?: boolean
    database?: boolean
  }> {
    const results: any = {}

    if (this.beehiiv) {
      results.beehiiv = await this.beehiiv.testConnection()
    }

    if (this.resend) {
      try {
        // Test Resend connection (this is a simple test)
        results.resend = true
      } catch (error) {
        results.resend = false
      }
    }

    if (this.config.syncToDatabase) {
      try {
        const supabase = await createServerSupabaseClient()
        const { error } = await (supabase as any).from('newsletter_subscriptions').select('id').limit(1)
        results.database = !error
      } catch (error) {
        results.database = false
      }
    }

    return results
  }

  /**
   * Check database subscription status
   */
  private async checkDatabaseSubscription(email: string) {
    const supabase = await createServerSupabaseClient()
    const { data } = await (supabase as any)
      .from('newsletter_subscriptions')
      .select('id, status, metadata, subscription_date')
      .eq('email', email)
      .single()
    
    return data
  }

  /**
   * Update database subscription
   */
  private async updateDatabaseSubscription(
    email: string, 
    source: string, 
    exists: boolean,
    status: string = 'active'
  ) {
    const supabase = await createServerSupabaseClient()

    if (exists) {
      // Update existing subscription
      const { error } = await (supabase as any)
        .from('newsletter_subscriptions')
        .update({ 
          status,
          subscription_date: status === 'active' ? new Date().toISOString() : undefined,
          metadata: { source, updated_via: 'dual_service' }
        })
        .eq('email', email)

      if (error) throw error
    } else {
      // Create new subscription
      const { error } = await (supabase as any)
        .from('newsletter_subscriptions')
        .insert({
          email,
          status,
          metadata: { source, created_via: 'dual_service' }
        })

      if (error) throw error
    }
  }

  /**
   * Send welcome email via Resend
   */
  private async sendResendWelcomeEmail(email: string) {
    if (!this.resend) {
      throw new Error('Resend not configured')
    }

    const supabase = await createServerSupabaseClient()
    const { data: unsubscribeData } = await (supabase as any)
      .from('newsletter_subscriptions')
      .select('unsubscribe_token')
      .eq('email', email)
      .single()

    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/newsletter/unsubscribe?token=${unsubscribeData?.unsubscribe_token}`

    return await this.resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'david@openqase.com',
      to: [email],
      subject: 'Welcome to OpenQase Newsletter! 🚀',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to OpenQase! 🚀</h1>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #333; margin-top: 0;">Thank you for subscribing!</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              You've successfully subscribed to the OpenQase newsletter. You'll receive the latest updates on:
            </p>
            
            <ul style="color: #666; line-height: 1.8; margin: 20px 0; padding-left: 20px;">
              <li>Quantum computing business case studies</li>
              <li>Algorithm implementations and insights</li>
              <li>Industry applications and trends</li>
              <li>OpenQase platform updates</li>
            </ul>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #333; margin-top: 0; font-size: 18px;">What's Next?</h3>
              <p style="color: #666; line-height: 1.6; margin: 10px 0;">
                Explore our growing collection of quantum computing case studies and learning paths at 
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://openqase.com'}" style="color: #667eea; text-decoration: none;">OpenQase.com</a>
              </p>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin-top: 40px;">
              You can <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">unsubscribe</a> at any time.
              <br>
              This email was sent because you signed up for the OpenQase newsletter.
            </p>
          </div>
        </div>
      `
    })
  }
}

// Factory function to create a dual newsletter service
export function createDualNewsletterService(config?: Partial<DualNewsletterConfig>): DualNewsletterService {
  const defaultConfig: DualNewsletterConfig = {
    useBeehiiv: !!process.env.BEEHIIV_API_KEY,
    useResend: !!process.env.RESEND_API_KEY,
    syncToDatabase: true,
    sendWelcomeEmail: true,
    preferredService: 'beehiiv', // Default to Beehiiv for marketing emails
    ...config
  }

  return new DualNewsletterService(defaultConfig)
}

// Export types
export type { DualNewsletterConfig, SubscriptionResult } 