'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Here we'll add error logging once we set up monitoring
    console.error('Uncaught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
              <p className="text-muted-foreground">
                We&apos;ve encountered an error. Our team has been notified.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => {
                  this.setState({ hasError: false })
                  window.location.reload()
                }}
              >
                Try again
              </Button>
              <p className="text-sm text-muted-foreground pt-2">
                If the problem persists, please contact support
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 