'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { getSafeRedirectPath } from '@/lib/redirect-utils'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export function AuthContent({ redirectTo: _redirectTo }: { redirectTo?: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const redirectToParam = getSafeRedirectPath(searchParams.get('redirectTo'))
  const [isLoading, setIsLoading] = useState(true)
  const viewParam = searchParams.get('view')

  // Determine the auth view: 'sign_up' or 'sign_in'
  const authView = viewParam === 'sign_up' ? 'sign_up' : 'sign_in';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.replace(redirectToParam)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        toast({
          title: 'Error',
          description: 'Failed to check authentication status',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, _session: Session | null) => {
      if (event === 'SIGNED_IN') {
        toast({
          title: 'Success',
          description: 'Successfully signed in',
        })
        router.replace(redirectToParam)
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: 'Signed out',
          description: 'You have been signed out',
        })
      } else if (event as string === 'USER_SIGNED_UP') {
        toast({
          title: 'Account created',
          description: 'Please check your email to confirm your account.',
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, redirectToParam])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              {authView === 'sign_up' ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {authView === 'sign_up'
                ? 'Get started by creating your account to access all features.'
                : 'Sign in to your account to access all features'}
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
                      <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                    inputText: 'hsl(var(--foreground))',
                    inputPlaceholder: 'hsl(var(--muted-foreground))',
                  },
                },
              },
            }}
              providers={[]}
              view={authView}
              showLinks={true}
              redirectTo={`${window.location.origin}/auth/callback?redirectTo=${redirectToParam}`}
              onlyThirdPartyProviders={false}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}