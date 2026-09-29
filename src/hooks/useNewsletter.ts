'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { z } from 'zod'

const emailSchema = z.string().email('Please enter a valid email address')

interface UseNewsletterOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useNewsletter(options: UseNewsletterOptions = {}) {
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { toast } = useToast()

  const handleSubscribe = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    // Validate email
    try {
      emailSchema.parse(email)
    } catch {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
        duration: 3000,
      })
      return
    }

    setIsSubscribing(true)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
        duration: 3000,
      })

      setEmail('')
      options.onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to subscribe'
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
        duration: 5000,
      })
      options.onError?.(error as Error)
    } finally {
      setIsSubscribing(false)
    }
  }

  return {
    email,
    setEmail,
    isSubscribing,
    handleSubscribe,
  }
} 