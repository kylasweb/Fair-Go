'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FairGoLogo } from './fairgo-logo'
import { BookingInterface } from './booking-interface'
import { BookingCard } from './booking-card'
import { DriverCard } from './driver-card'
import { VoiceBooking } from './voice-booking'
import { PaymentMethods } from './payment/payment-methods'
import { WalletManagement } from './payment/wallet-management'
import { Button } from '@/components/ui/button'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, History, Users, Bell, User, Mic, Wallet } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface BookingLayoutProps {
  // User data now comes from auth context
  children?: never
}

interface Booking {
  id: string
  status: string
  pickupLocation: string
  dropLocation?: string
  estimatedPrice: number
  driver?: {
    name: string
    rating: number
    vehicleModel: string
    vehicleColor: string
    vehicleNumber: string
  }
  createdAt: string
}

interface Driver {
  id: string
  name: string
  rating: number
  totalRides: number
  vehicleType: string
  vehicleModel: string
  vehicleColor: string
  vehicleNumber: string
  isAvailable: boolean
  distance: number
}

export function BookingLayout({ }: BookingLayoutProps) {
  const [activeTab, setActiveTab] = useState<'book' | 'voice' | 'history' | 'drivers' | 'wallet' | 'payments'>('book')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<string | null>(null)
  
  const { user, signOut } = useAuth()

  useEffect(() => {
    if (user) {
      fetchBookings()
      fetchDrivers()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('fairgo_token')
      if (!token) return

      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const bookingsData = await response.json()
        setBookings(bookingsData)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers?lat=12.9716&lng=77.5946') // Bangalore coordinates
      if (response.ok) {
        const driversData = await response.json()
        setDrivers(driversData)
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error)
    }
  }

  const handleBookRide = async (bookingData: any) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('fairgo_token')
      if (!token) {
        alert('Please sign in to book a ride')
        return
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      })

      if (response.ok) {
        alert('Ride booked successfully!')
        fetchBookings()
        setActiveTab('history')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to book ride')
      }
    } catch (error) {
      console.error('Booking failed:', error)
      alert('Failed to book ride')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('fairgo_token')
      if (!token) return

      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchBookings()
      }
    } catch (error) {
      console.error('Cancel booking failed:', error)
    }
  }

  const handleTrackBooking = (bookingId: string) => {
    // In a real app, this would navigate to tracking page
    console.log('Tracking booking:', bookingId)
  }

  const handlePaymentComplete = async (paymentData: any) => {
    try {
      const token = localStorage.getItem('fairgo_token')
      if (!token || !selectedBookingForPayment) return

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: selectedBookingForPayment,
          method: paymentData.method,
          amount: paymentData.amount,
          details: paymentData.details
        })
      })

      if (response.ok) {
        setShowPaymentModal(false)
        setSelectedBookingForPayment(null)
        setPaymentAmount(0)
        fetchBookings()
        alert('Payment successful! Ride completed.')
      } else {
        const error = await response.json()
        alert(error.message || 'Payment failed')
      }
    } catch (error) {
      console.error('Payment processing failed:', error)
      alert('Payment failed. Please try again.')
    }
  }

  const handlePayForBooking = (bookingId: string, amount: number) => {
    setSelectedBookingForPayment(bookingId)
    setPaymentAmount(amount)
    setShowPaymentModal(true)
  }

  const handleSelectDriver = async (driver: any) => {
    try {
      // Create a booking with the selected driver
      const bookingData = {
        driverId: driver.id,
        pickupLocation: 'Current Location', // This should come from state or props
        dropLocation: 'Destination', // This should come from state or props
        pickupLat: 0, // Replace with actual coordinates
        pickupLng: 0,
        dropLat: 0,
        dropLng: 0,
        estimatedPrice: driver.estimatedPrice || 0,
        vehicleType: driver.vehicleType
      }
      
      await handleBookRide(bookingData)
      setActiveTab('history') // Switch to history tab to see the new booking
    } catch (error) {
      console.error('Error selecting driver:', error)
      alert('Failed to book with selected driver. Please try again.')
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to access the booking interface</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark">
      {/* Header */}
      <header className="bg-white dark:bg-black shadow-sm border-b border-gray-200 dark:border-gray-800">
        <NeoCard variant="flat" className="container mx-auto px-4 py-4 rounded-none border-0">
          <div className="flex items-center justify-between">
            <FairGoLogo />
            
            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="space-y-4 mt-6">
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <History className="w-4 h-4 mr-2" />
                      Ride History
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user.name || user.email}</span>
                <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Link href="/driver/register">
                  <Button variant="outline" size="sm">
                    Become a Driver
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </NeoCard>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <NeoCard variant="flat" className="flex space-x-1 mb-6 p-1">
          <NeoButton
            variant={activeTab === 'book' ? 'primary' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('book')}
          >
            Book Ride
          </NeoButton>
          <NeoButton
            variant={activeTab === 'voice' ? 'primary' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('voice')}
          >
            <Mic className="w-4 h-4 mr-2" />
            Voice Book
          </NeoButton>
          <NeoButton
            variant={activeTab === 'history' ? 'primary' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </NeoButton>
          <NeoButton
            variant={activeTab === 'drivers' ? 'primary' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('drivers')}
          >
            <Users className="w-4 h-4 mr-2" />
            Drivers
          </NeoButton>
          <NeoButton
            variant={activeTab === 'wallet' ? 'primary' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('wallet')}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Wallet
          </NeoButton>
          <NeoButton
            variant={activeTab === 'payments' ? 'primary' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </NeoButton>
        </NeoCard>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'book' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <BookingInterface onBookRide={handleBookRide} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
                <div className="space-y-4">
                  {bookings.slice(0, 3).map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      onTrack={handleTrackBooking}
                    />
                  ))}
                  {bookings.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No recent bookings</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="max-w-md mx-auto">
              <VoiceBooking onBookingComplete={handleBookRide} />
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Ride History</h2>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onTrack={handleTrackBooking}
                  />
                ))}
                {bookings.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No booking history found</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'drivers' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Nearby Drivers</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map((driver) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    onSelect={handleSelectDriver}
                  />
                ))}
                {drivers.length === 0 && (
                  <p className="text-gray-500 text-center py-8 col-span-full">No drivers available nearby</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <FairGoLogo size="sm" />
            <div className="text-gray-600 text-sm mt-4 md:mt-0">
              © 2024 FairGo. Making transportation smarter with AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}