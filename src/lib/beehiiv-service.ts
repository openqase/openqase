import { z } from 'zod'

// Beehiiv API types
interface BeehiivSubscriptionData {
  email: string
  reactivate_existing?: boolean
  send_welcome_email?: boolean
  utm_source?: string
  utm_campaign?: string
  utm_medium?: string
  referring_site?: string
  custom_fields?: Record<string, unknown>
}

interface BeehiivSubscriptionResponse {
  id: string
  email: string
  status: string
  created: string
  updated: string
}

interface BeehiivErrorResponse {
  error: string
  message: string
  details?: unknown
}

// Configuration schema
const beehiivConfigSchema = z.object({
  apiKey: z.string().min(1, 'Beehiiv API key is required'),
  publicationId: z.string().min(1, 'Beehiiv publication ID is required'),
  baseUrl: z.string().url().optional().default('https://api.beehiiv.com/v2'),
})

export class BeehiivService {
  private apiKey: string
  private publicationId: string
  private baseUrl: string

  constructor(config: { apiKey: string; publicationId: string; baseUrl?: string }) {
    const validatedConfig = beehiivConfigSchema.parse(config)
    this.apiKey = validatedConfig.apiKey
    this.publicationId = validatedConfig.publicationId
    this.baseUrl = validatedConfig.baseUrl
  }

  /**
   * Subscribe an email to the newsletter
   */
  async subscribeToNewsletter(data: BeehiivSubscriptionData): Promise<BeehiivSubscriptionResponse> {
    const endpoint = `${this.baseUrl}/publications/${this.publicationId}/subscriptions`
    
    const payload = {
      email: data.email,
      reactivate_existing: data.reactivate_existing ?? true,
      send_welcome_email: data.send_welcome_email ?? true,
      utm_source: data.utm_source ?? 'openqase',
      utm_campaign: data.utm_campaign ?? 'newsletter',
      utm_medium: data.utm_medium ?? 'web',
      referring_site: data.referring_site ?? process.env.NEXT_PUBLIC_SITE_URL,
      ...data.custom_fields && { custom_fields: data.custom_fields }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData: BeehiivErrorResponse = await response.json()
      throw new Error(`Beehiiv API Error: ${errorData.message || errorData.error}`)
    }

    return await response.json()
  }

  /**
   * Check if an email is subscribed
   */
  async getSubscriptionStatus(email: string): Promise<BeehiivSubscriptionResponse | null> {
    const endpoint = `${this.baseUrl}/publications/${this.publicationId}/subscriptions`
    
    const response = await fetch(`${endpoint}?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null // Subscription not found
      }
      const errorData: BeehiivErrorResponse = await response.json()
      throw new Error(`Beehiiv API Error: ${errorData.message || errorData.error}`)
    }

    const data = await response.json()
    // Beehiiv API returns an array of subscriptions, we want the first one
    return data.results?.[0] || null
  }

  /**
   * Unsubscribe an email from the newsletter
   */
  async unsubscribeFromNewsletter(email: string): Promise<void> {
    const endpoint = `${this.baseUrl}/publications/${this.publicationId}/subscriptions`
    
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      const errorData: BeehiivErrorResponse = await response.json()
      throw new Error(`Beehiiv API Error: ${errorData.message || errorData.error}`)
    }
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const endpoint = `${this.baseUrl}/publications/${this.publicationId}`
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('Beehiiv connection test failed:', error)
      return false
    }
  }
}

// Factory function to create a Beehiiv service instance
export function createBeehiivService(): BeehiivService {
  const apiKey = process.env.BEEHIIV_API_KEY
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID

  if (!apiKey || !publicationId) {
    throw new Error('Missing required Beehiiv configuration. Please set BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID environment variables.')
  }

  return new BeehiivService({
    apiKey,
    publicationId,
  })
}

// Types for export
export type { BeehiivSubscriptionData, BeehiivSubscriptionResponse } 