'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CallToBookButton } from '@/components/call-to-book-button'
import { MobileFirstPage } from '@/components/ResponsiveLayout'
import { Phone, MapPin, Star, Shield, Clock, Users } from 'lucide-react'

export default function Home() {
  return (
    <MobileFirstPage>
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">FairGo</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</a>
            <a href="#download" className="text-gray-600 hover:text-gray-900">Download</a>
          </nav>
          <div className="flex items-center space-x-2">
            <Link href="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Ride Smart with{" "}
            <span className="text-orange-500">AI-Powered</span> Booking
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Experience the future of taxi booking in India with FairGo. Just call, speak naturally, 
            and our AI handles the rest. Available in Malayalam, English, Manglish, Hindi, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/call-to-book">
              <CallToBookButton />
            </Link>
            <Link href="/mobile">
              <Button size="lg" variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700">
                📱 Try Mobile App
              </Button>
            </Link>
            <Link href="/booking">
              <Button size="lg" variant="outline">
                Book Online
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Download App
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose FairGo?</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              India's first AI-powered taxi booking platform designed for convenience and safety
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-orange-500" />
                </div>
                <CardTitle>Call to Book</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simply call our number and speak naturally. Our AI understands your request 
                  and books your ride instantly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-500" />
                </div>
                <CardTitle>Smart Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI-powered route optimization ensures you reach your destination 
                  quickly and efficiently.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
                <CardTitle>Safe & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All drivers are verified, rides are tracked in real-time, 
                  and emergency features are always available.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-purple-500" />
                </div>
                <CardTitle>24/7 Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our service is available round the clock. Book rides anytime, 
                  anywhere in supported cities.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
                <CardTitle>Fair Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Transparent pricing with no hidden charges. Pay via UPI, 
                  wallet, or cash as per your convenience.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-red-500" />
                </div>
                <CardTitle>Multi-language</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Support for Malayalam, English, Manglish (Malayalam-English mix), Hindi, Tamil, Telugu, 
                  and other regional languages for your convenience.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">How FairGo Works</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Booking a ride has never been easier with our AI-powered system
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h4 className="text-xl font-semibold mb-2">Call FairGo</h4>
              <p className="text-gray-600">
                Dial our toll-free number and speak naturally about your ride requirements
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h4 className="text-xl font-semibold mb-2">AI Processes</h4>
              <p className="text-gray-600">
                Our AI understands your request, finds nearby drivers, and confirms your booking
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h4 className="text-xl font-semibold mb-2">Enjoy Your Ride</h4>
              <p className="text-gray-600">
                Track your driver in real-time and enjoy a comfortable, safe journey
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Experience FairGo?</h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied riders across India. Download our app or call now to book your first ride.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/call-to-book">
              <CallToBookButton />
            </Link>
            <Button size="lg" variant="secondary">
              Download for Android
            </Button>
            <Button size="lg" variant="secondary">
              Download for iOS
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">FairGo</span>
            </div>
            <div className="text-gray-600 text-sm">
              © 2024 FairGo. Making transportation smarter with AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
    </MobileFirstPage>
  )
}