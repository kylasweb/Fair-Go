'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CallToBookButton } from '@/components/call-to-book-button'
import { BookingInterface } from '@/components/booking-interface'
import { FairGoLogo } from '@/components/fairgo-logo'
import { useAuth, useBookings } from '@/lib/store'
import { useWebSocket } from '@/lib/websocket'
import { Phone, MapPin, Star, Shield, Clock, Users, Wifi, WifiOff, Smartphone, Zap, Globe } from 'lucide-react'
import { toast } from 'sonner'

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const { activeBooking } = useBookings()
  const { isConnected } = useWebSocket()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleBookRide = (bookingData: any) => {
    console.log('Booking data:', bookingData)
    // This will be handled by the BookingInterface component's internal logic
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FairGoLogo className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FairGo</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Professional Taxi Service</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-3">
            {navigator?.onLine !== false && (
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-gray-600 hidden sm:block">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            )}

            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
              {isAuthenticated && (
                <Link href="/booking" className="text-gray-600 hover:text-gray-900 transition-colors">
                  My Bookings
                </Link>
              )}
              {user?.role === 'DRIVER' && (
                <Link href="/driver/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Driver Dashboard
                </Link>
              )}
            </nav>
            
            <div className="flex items-center space-x-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    Hi, {user?.name || user?.email}
                  </span>
                  <Link href="/booking">
                    <Button size="sm">
                      {activeBooking ? 'Active Ride' : 'Book Ride'}
                    </Button>
                  </Link>
                </div>
              ) : (
                <Link href="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            🚀 Now with Real-time Tracking & Offline Support
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            India's First{' '}
            <span className="text-blue-600">AI-Powered</span>{' '}
            Taxi Platform
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Book rides naturally in <strong>Malayalam, English, Manglish</strong> and 6+ languages.{' '}
            <span className="text-blue-600 font-semibold">Just speak naturally</span> - our AI understands you!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <CallToBookButton className="min-w-[200px]" />
            <span className="text-gray-500">or</span>
            <Link href={isAuthenticated ? "/booking" : "/auth"}>
              <Button size="lg" className="min-w-[200px]">
                Book Online
              </Button>
            </Link>
          </div>

          {/* Real-time Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border">
              <Zap className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Real-time Updates</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border">
              <Globe className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Works Offline</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border">
              <Smartphone className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium">PWA Ready</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border">
              <Shield className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Always Secure</p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Interface */}
      {isAuthenticated && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-2xl">
            <BookingInterface onBookRide={handleBookRide} />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Revolutionary Features
            </h2>
            <p className="text-xl text-gray-600">
              Technology that makes booking rides effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <Phone className="w-12 h-12 text-blue-500 mb-4" />
                <CardTitle>Voice Booking</CardTitle>
                <CardDescription>
                  Speak naturally in any language - Malayalam, English, Manglish, Hindi, Tamil, Telugu and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Natural language processing</li>
                  <li>• Multi-language support</li>
                  <li>• Works with Indian accents</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <Zap className="w-12 h-12 text-green-500 mb-4" />
                <CardTitle>Real-time Tracking</CardTitle>
                <CardDescription>
                  Live updates on your driver's location and estimated arrival time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Live driver tracking</li>
                  <li>• Instant status updates</li>
                  <li>• Push notifications</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <Globe className="w-12 h-12 text-purple-500 mb-4" />
                <CardTitle>Offline Support</CardTitle>
                <CardDescription>
                  Continue using the app even without internet connection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Offline bookings</li>
                  <li>• Auto-sync when online</li>
                  <li>• Cached content</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <MapPin className="w-12 h-12 text-orange-500 mb-4" />
                <CardTitle>Smart Routing</CardTitle>
                <CardDescription>
                  AI-powered route optimization for faster, cheaper rides
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Traffic-aware routing</li>
                  <li>• Dynamic pricing</li>
                  <li>• ETA optimization</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <Shield className="w-12 h-12 text-red-500 mb-4" />
                <CardTitle>Safety First</CardTitle>
                <CardDescription>
                  Verified drivers, emergency features, and 24/7 support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Driver verification</li>
                  <li>• Emergency button</li>
                  <li>• Trip monitoring</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <Users className="w-12 h-12 text-indigo-500 mb-4" />
                <CardTitle>Community Focused</CardTitle>
                <CardDescription>
                  Built for Indian users with local insights and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Local language support</li>
                  <li>• Cultural understanding</li>
                  <li>• Community feedback</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-16">
            Simple. Natural. Effective.
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold">Call & Speak</h3>
              <p className="text-gray-600">
                Press the call button and speak naturally: "Kochi ninnu Ernakulam povanum" or "Need a cab to airport"
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold">AI Understands</h3>
              <p className="text-gray-600">
                Our AI processes your natural speech, extracts location details, and finds the best driver for you
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="text-xl font-semibold">Ride Confirmed</h3>
              <p className="text-gray-600">
                Get real-time updates, track your driver, and enjoy a comfortable ride with professional service
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FairGoLogo className="h-8 w-auto invert" />
                <span className="text-xl font-bold">FairGo</span>
              </div>
              <p className="text-gray-400 mb-4">
                India's first AI-powered taxi booking platform with multilingual voice support.
              </p>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <Star className="w-4 h-4 text-yellow-400" />
                <Star className="w-4 h-4 text-yellow-400" />
                <Star className="w-4 h-4 text-yellow-400" />
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400 ml-2">4.9/5 Rating</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/booking" className="hover:text-white transition-colors">Book a Ride</Link></li>
                <li><Link href="/driver/register" className="hover:text-white transition-colors">Become a Driver</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Languages</h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>Malayalam</li>
                <li>English</li>
                <li>Manglish</li>
                <li>Hindi</li>
                <li>Tamil</li>
                <li>Telugu</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📞 +91 (800) FAIRGO</li>
                <li>📧 support@fairgo.app</li>
                <li>🏢 Kochi, Kerala, India</li>
                <li>🕒 24/7 Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 FairGo. All rights reserved. Built with ❤️ for India.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}