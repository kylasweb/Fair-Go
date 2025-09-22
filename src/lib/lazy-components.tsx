import React, { Suspense } from 'react'
import { Spinner } from '@/components/ui/spinner'

// Lazy-loaded components for code splitting
export const LazyBookingInterface = React.lazy(() => 
  import('@/components/booking-interface').then(module => ({
    default: module.BookingInterface
  }))
)

export const LazyDriverDashboard = React.lazy(() => 
  import('@/components/driver/driver-dashboard').then(module => ({
    default: module.DriverDashboard
  }))
)

export const LazyAdminDashboard = React.lazy(() => 
  import('@/components/admin/admin-dashboard').then(module => ({
    default: module.AdminDashboard
  }))
)

export const LazyPaymentMethods = React.lazy(() => 
  import('@/components/payment/payment-methods').then(module => ({
    default: module.PaymentMethods
  }))
)

export const LazyWalletManagement = React.lazy(() => 
  import('@/components/payment/wallet-management').then(module => ({
    default: module.WalletManagement
  }))
)

export const LazyVoiceBooking = React.lazy(() => 
  import('@/components/voice-booking').then(module => ({
    default: module.VoiceBooking
  }))
)

// Loading fallback component
export const LoadingFallback = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Spinner className="w-8 h-8 mb-4" />
    <p className="text-muted-foreground">{message}</p>
  </div>
)

// Higher-order component for lazy loading with error boundary
export const withLazyLoading = <P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  fallbackMessage?: string
) => {
  return (props: P) => (
    <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

// Pre-configured lazy components
export const BookingInterface = withLazyLoading(
  LazyBookingInterface, 
  "Loading booking interface..."
)

export const DriverDashboard = withLazyLoading(
  LazyDriverDashboard, 
  "Loading driver dashboard..."
)

export const AdminDashboard = withLazyLoading(
  LazyAdminDashboard, 
  "Loading admin panel..."
)

export const PaymentMethods = withLazyLoading(
  LazyPaymentMethods, 
  "Loading payment options..."
)

export const WalletManagement = withLazyLoading(
  LazyWalletManagement, 
  "Loading wallet..."
)

export const VoiceBooking = withLazyLoading(
  LazyVoiceBooking, 
  "Loading voice booking..."
)

// Route-based lazy loading helper
export const routeLazyComponents = {
  '/': LazyBookingInterface,
  '/booking': LazyBookingInterface,
  '/driver/dashboard': LazyDriverDashboard,
  '/admin': LazyAdminDashboard,
  '/payment': LazyPaymentMethods,
  '/wallet': LazyWalletManagement,
  '/voice-booking': LazyVoiceBooking,
} as const

// Preloader for critical components
export const preloadCriticalComponents = () => {
  // Preload booking interface as it's the most common entry point
  const bookingPromise = import('@/components/booking-interface')
  
  // Preload based on user role or common navigation patterns
  if (typeof window !== 'undefined') {
    const userRole = localStorage.getItem('userRole')
    
    if (userRole === 'DRIVER') {
      import('@/components/driver/driver-dashboard')
    } else if (userRole === 'ADMIN') {
      import('@/components/admin/admin-dashboard')
    }
  }
  
  return bookingPromise
}

// Component preloader hook
export const useComponentPreloader = () => {
  const preloadComponent = React.useCallback((componentPath: string) => {
    switch (componentPath) {
      case 'booking-interface':
        return import('@/components/booking-interface')
      case 'driver-dashboard':
        return import('@/components/driver/driver-dashboard')
      case 'admin-dashboard':
        return import('@/components/admin/admin-dashboard')
      case 'payment-methods':
        return import('@/components/payment/payment-methods')
      case 'wallet-management':
        return import('@/components/payment/wallet-management')
      case 'voice-booking':
        return import('@/components/voice-booking')
      default:
        return Promise.resolve()
    }
  }, [])

  return { preloadComponent }
}