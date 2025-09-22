'use client'

import { useIsMobile } from '@/hooks/use-mobile-detector'
import { MobileApp } from '@/components/mobile/MobileApp'
import { ReactNode } from 'react'

interface ResponsiveLayoutProps {
  children: ReactNode
  mobileComponent?: ReactNode
  forceDesktop?: boolean
}

export function ResponsiveLayout({ 
  children, 
  mobileComponent, 
  forceDesktop = false 
}: ResponsiveLayoutProps) {
  const { isMobile, isLoading } = useIsMobile()

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl font-bold text-white">FG</span>
          </div>
          <p className="text-gray-600">Loading FairGo...</p>
        </div>
      </div>
    )
  }

  // Serve mobile experience for mobile users
  if (isMobile && !forceDesktop) {
    return (
      <div className="mobile-viewport">
        {mobileComponent || <MobileApp />}
      </div>
    )
  }

  // Serve desktop experience
  return <>{children}</>
}

// Mobile-first wrapper for pages
export function MobileFirstPage({ children }: { children: ReactNode }) {
  return (
    <ResponsiveLayout
      mobileComponent={<MobileApp />}
    >
      {children}
    </ResponsiveLayout>
  )
}