'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const emailInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setStatus('error')
      setMessage('Please enter your email address')
      return
    }

    setStatus('loading')
    
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(),
          source: 'homepage'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.alreadySubscribed 
          ? 'You\'re already subscribed!' 
          : 'Successfully subscribed! Check your email for confirmation.'
        )
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to subscribe. Please try again.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Failed to subscribe. Please try again.')
    }
  }

  const handleCardClick = () => {
    emailInputRef.current?.focus()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">Stay Updated</h2>
      <div
        className="bg-card rounded-lg border border-border p-6 elevation-interactive hover:border-primary transition-colors"
        onClick={handleCardClick}
      >
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          Get notified when new quantum computing case studies and industry insights are published.
        </p>

        {status === 'success' ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg">
              {message}
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                setStatus('idle')
                setMessage('')
              }}
              variant="outline"
              className="w-full"
            >
              Subscribe another email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              ref={emailInputRef}
              id="newsletter-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              autoComplete="email"
              aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
              required
            />
            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe to Updates'}
            </Button>
            {status === 'error' && (
              <div id="newsletter-error" role="alert" className="text-red-400 text-xs mt-2">
                {message}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}