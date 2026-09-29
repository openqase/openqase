'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { theme, setTheme, themes } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [marketingEmailsEnabled, setMarketingEmailsEnabled] = useState(false)
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  // Check auth and load user
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth?redirectTo=/profile')
          return
        }
        setUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
        toast({
          title: 'Error',
          description: 'Failed to load user data',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        router.push('/auth?redirectTo=/profile')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  // Load newsletter subscription status
  useEffect(() => {
    const loadNewsletterStatus = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/newsletter/subscription')
        if (response.ok) {
          const data = await response.json()
          setMarketingEmailsEnabled(data.isSubscribed)
        }
      } catch (error) {
        console.error('Error loading newsletter status:', error)
      }
    }

    loadNewsletterStatus()
  }, [user])

  // Handle marketing emails toggle (newsletter subscription)
  const handleMarketingEmailsToggle = async (enabled: boolean) => {
    if (!user) return

    setNewsletterLoading(true)
    try {
      const response = await fetch('/api/newsletter/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscribe: enabled }),
      })

      if (!response.ok) {
        throw new Error('Failed to update newsletter subscription')
      }

      const data = await response.json()
      setMarketingEmailsEnabled(data.isSubscribed)
      
      toast({
        title: 'Success',
        description: data.message,
      })
    } catch (error) {
      console.error('Error updating newsletter subscription:', error)
      toast({
        title: 'Error',
        description: 'Failed to update email preferences. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setNewsletterLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
              <div>
                <Label>Account Created</Label>
                <p className="text-muted-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize the appearance of OpenQASE.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Email Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Email Preferences</CardTitle>
              <CardDescription>
                Manage your newsletter subscription. Security and account emails will always be sent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor="marketing"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Marketing emails
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Receive our newsletter with updates about quantum computing case studies, new algorithms, and platform updates.
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={marketingEmailsEnabled}
                    onCheckedChange={handleMarketingEmailsToggle}
                    disabled={newsletterLoading}
                  />
                </div>

                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Security & Account Emails</p>
                      <p className="text-xs text-muted-foreground">
                        Important emails about your account security, password resets, and login notifications will always be sent and cannot be disabled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}