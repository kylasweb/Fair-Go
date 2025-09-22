'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MobileHomepage } from './MobileHomepage'
import { ServiceSelection } from './ServiceSelection'
import { AIInteraction } from './AIInteraction'
import { BookingConfirmation } from './BookingConfirmation'
import { LiveTracking } from './LiveTracking'

type AppScreen = 'homepage' | 'service-selection' | 'ai-interaction' | 'booking-confirmation' | 'live-tracking'

interface ServiceType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  estimatedTime: string
  basePrice: string
  capacity: string
  features: string[]
  popular?: boolean
  available: boolean
}

interface BookingDetails {
  from: string
  to: string
  serviceType: string
  estimatedPrice: string
  estimatedTime: string
  driverETA: string
}

export function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('homepage')
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  const handleBookByCall = () => {
    setCurrentScreen('service-selection')
  }

  const handleBookOnline = () => {
    // For now, redirect to service selection. 
    // In future, this could go to a different flow with map interface
    setCurrentScreen('service-selection')
  }

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service)
    setCurrentScreen('ai-interaction')
  }

  const handleBookingComplete = (details: BookingDetails) => {
    setBookingDetails(details)
    setCurrentScreen('booking-confirmation')
  }

  const handleTrackingStart = () => {
    // Generate a booking ID for tracking
    const newBookingId = `BKG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setBookingId(newBookingId)
    setCurrentScreen('live-tracking')
  }

  const handleTripComplete = () => {
    // Reset the app state and return to homepage
    setCurrentScreen('homepage')
    setSelectedService(null)
    setBookingDetails(null)
    setBookingId(null)
  }

  const handleBack = () => {
    switch (currentScreen) {
      case 'service-selection':
        setCurrentScreen('homepage')
        break
      case 'ai-interaction':
        setCurrentScreen('service-selection')
        setSelectedService(null)
        break
      case 'booking-confirmation':
        // Normally wouldn't allow going back from confirmation
        // But for demo purposes, allow it
        setCurrentScreen('ai-interaction')
        setBookingDetails(null)
        break
      case 'live-tracking':
        // Normally wouldn't allow going back from live tracking
        // But for demo purposes, allow it
        setCurrentScreen('booking-confirmation')
        break
      default:
        break
    }
  }

  return (
    <div className="mobile-app-container max-w-md mx-auto bg-white min-h-screen shadow-xl">
      <AnimatePresence mode="wait" initial={false}>
        {currentScreen === 'homepage' && (
          <MobileHomepage
            key="homepage"
            onBookByCall={handleBookByCall}
            onBookOnline={handleBookOnline}
          />
        )}

        {currentScreen === 'service-selection' && (
          <ServiceSelection
            key="service-selection"
            onBack={handleBack}
            onServiceSelect={handleServiceSelect}
          />
        )}

        {currentScreen === 'ai-interaction' && selectedService && (
          <AIInteraction
            key="ai-interaction"
            onBack={handleBack}
            onBookingComplete={handleBookingComplete}
            selectedService={selectedService}
          />
        )}

        {currentScreen === 'booking-confirmation' && bookingDetails && (
          <BookingConfirmation
            key="booking-confirmation"
            bookingDetails={bookingDetails}
            onTrackingStart={handleTrackingStart}
          />
        )}

        {currentScreen === 'live-tracking' && bookingId && (
          <LiveTracking
            key="live-tracking"
            bookingId={bookingId}
            onComplete={handleTripComplete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}