/**
 * Enhanced Error Handling System
 * Comprehensive error boundaries, fallbacks, and error tracking
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, MessageCircle, Bug } from 'lucide-react'

// Error types
export interface AppError extends Error {
  code?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
  timestamp?: number
  userId?: string
}

// Error boundary state
interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
  errorId: string | null
  retryCount: number
}

// Error tracking service
class ErrorTracker {
  private errors: AppError[] = []
  private listeners: ((error: AppError) => void)[] = []

  track(error: AppError) {
    const enhancedError: AppError = {
      ...error,
      timestamp: Date.now(),
      code: error.code || 'UNKNOWN_ERROR',
      severity: error.severity || 'medium',
      context: {
        ...error.context,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }
    }

    this.errors.push(enhancedError)
    
    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100)
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(enhancedError))

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', enhancedError)
    }

    return this.generateErrorId(enhancedError)
  }

  subscribe(listener: (error: AppError) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  getErrors(severity?: AppError['severity']) {
    return severity 
      ? this.errors.filter(e => e.severity === severity)
      : this.errors
  }

  getErrorStats() {
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000
    const recentErrors = this.errors.filter(e => e.timestamp && e.timestamp > last24Hours)

    return {
      total: this.errors.length,
      recent: recentErrors.length,
      bySeverity: {
        critical: recentErrors.filter(e => e.severity === 'critical').length,
        high: recentErrors.filter(e => e.severity === 'high').length,
        medium: recentErrors.filter(e => e.severity === 'medium').length,
        low: recentErrors.filter(e => e.severity === 'low').length,
      }
    }
  }

  private generateErrorId(error: AppError): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  clear() {
    this.errors = []
  }
}

export const errorTracker = new ErrorTracker()

// Generic Error Boundary
export class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode
    fallback?: React.ComponentType<ErrorFallbackProps>
    onError?: (error: AppError, errorId: string) => void
    resetKeys?: Array<string | number>
    resetOnPropsChange?: boolean
  },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const appError: AppError = {
      ...error,
      severity: 'high'
    }
    
    const errorId = errorTracker.track(appError)
    
    return {
      hasError: true,
      error: appError,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError: AppError = {
      ...error,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      },
      severity: 'high'
    }

    const errorId = errorTracker.track(appError)
    this.props.onError?.(appError, errorId)
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.resetOnPropsChange && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, idx) => key !== prevProps.resetKeys?.[idx]
      )
      
      if (hasResetKeyChanged && this.state.hasError) {
        this.handleReset()
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: this.state.retryCount + 1
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorId={this.state.errorId}
          onRetry={this.handleReset}
          retryCount={this.state.retryCount}
        />
      )
    }

    return this.props.children
  }
}

// Error fallback props
export interface ErrorFallbackProps {
  error: AppError | null
  errorId: string | null
  onRetry: () => void
  retryCount: number
}

// Default error fallback component
export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  onRetry,
  retryCount
}) => {
  const handleReportError = () => {
    // In a real app, this would send to error reporting service
    if (error && errorId) {
      console.log('Reporting error:', { error, errorId })
      // Could integrate with Sentry, Bugsnag, etc.
    }
  }

  const goHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-900">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center text-sm">
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>
          
          {error && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs font-mono text-gray-700 break-words">
                Error: {error.message}
              </p>
              {errorId && (
                <p className="text-xs text-gray-500 mt-1">
                  ID: {errorId}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button 
              onClick={onRetry} 
              disabled={retryCount >= 3}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {retryCount >= 3 ? 'Max retries reached' : 'Try again'}
            </Button>
            
            <Button variant="outline" onClick={goHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to home
            </Button>
            
            <Button variant="ghost" onClick={handleReportError} className="w-full">
              <Bug className="w-4 h-4 mr-2" />
              Report this issue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Booking-specific error fallback
export const BookingErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  retryCount
}) => (
  <Card className="w-full max-w-md mx-auto mt-8">
    <CardHeader>
      <CardTitle className="text-center text-orange-900 flex items-center justify-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        Booking Error
      </CardTitle>
    </CardHeader>
    <CardContent className="text-center space-y-4">
      <p className="text-gray-600">
        Unable to process your booking request. Please try again.
      </p>
      <Button onClick={onRetry} disabled={retryCount >= 2} className="w-full">
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry booking
      </Button>
    </CardContent>
  </Card>
)

// Network error fallback
export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({
  onRetry,
  retryCount
}) => (
  <Card className="w-full max-w-md mx-auto mt-8">
    <CardHeader>
      <CardTitle className="text-center text-blue-900 flex items-center justify-center">
        <MessageCircle className="w-5 h-5 mr-2" />
        Connection Issue
      </CardTitle>
    </CardHeader>
    <CardContent className="text-center space-y-4">
      <p className="text-gray-600">
        Please check your internet connection and try again.
      </p>
      <Button onClick={onRetry} disabled={retryCount >= 5} className="w-full">
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry connection
      </Button>
    </CardContent>
  </Card>
)

// HOC for adding error boundaries to components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<React.ComponentProps<typeof ErrorBoundary>>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for error handling
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error | AppError, context?: Record<string, any>) => {
    const appError: AppError = {
      ...error,
      context: { ...context, handledBy: 'useErrorHandler' },
      severity: 'medium'
    }
    
    return errorTracker.track(appError)
  }, [])

  const handleAsyncError = React.useCallback(
    async function <T>(
      operation: () => Promise<T>,
      context?: Record<string, any>
    ): Promise<T> {
      try {
        return await operation()
      } catch (error) {
        handleError(error as Error, context)
        throw error
      }
    },
    [handleError]
  )

  return { handleError, handleAsyncError }
}

// Global error handler setup
export const setupGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error: AppError = {
        name: 'UnhandledRejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        severity: 'high',
        context: {
          reason: event.reason,
          type: 'unhandledrejection'
        }
      }
      errorTracker.track(error)
    })

    // Handle global errors
    window.addEventListener('error', (event) => {
      const error: AppError = {
        name: event.error?.name || 'GlobalError',
        message: event.message,
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript'
        }
      }
      errorTracker.track(error)
    })
  }
}