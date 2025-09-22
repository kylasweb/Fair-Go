'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CallToBookButton } from '@/components/call-to-book-button'
import { MobileFirstPage } from '@/components/ResponsiveLayout'
import { Phone, MapPin, Star, Shield, Clock, Users } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'

export default function Home() {
  return (
    <MobileFirstPage>
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark transition-colors duration-300">
      {/* Header */}
      <header className="backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200/20 dark:border-gray-700/20">
        <NeoCard variant="flat" className="rounded-none border-0">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <NeoCard variant="raised" size="sm" className="w-10 h-10 bg-orange-500 flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </NeoCard>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">FairGo</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">How it Works</a>
              <a href="#download" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Download</a>
            </nav>
            <div className="flex items-center space-x-3">
              <ThemeToggle size="md" />
              <Link href="/auth">
                <NeoButton variant="secondary" size="sm">Sign In</NeoButton>
              </Link>
            </div>
          </div>
        </NeoCard>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-white mb-6">
            Ride Smart with{" "}
            <span className="text-orange-500">AI-Powered</span> Booking
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Experience the future of taxi booking in India with FairGo. Just call, speak naturally, 
            and our AI handles the rest. Available in Malayalam, English, Manglish, Hindi, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/call-to-book">
              <CallToBookButton />
            </Link>
            <Link href="/booking">
              <NeoButton variant="secondary" size="lg">
                Book Online
              </NeoButton>
            </Link>
            <NeoButton variant="ghost" size="lg">
              Download App
            </NeoButton>
          </div>
          <div className="mt-6 text-center">
            <NeoCard variant="flat" className="inline-block">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📱 <strong>Mobile users:</strong> You're automatically getting our optimized mobile experience! 
                <Link href="/mobile" className="text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 ml-1 transition-colors">Preview on desktop →</Link>
              </p>
            </NeoCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50 dark:bg-black">
        <NeoCard variant="flat" className="container mx-auto px-4 rounded-none border-0">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Why Choose FairGo?</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              India's first AI-powered taxi booking platform designed for convenience and safety
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <NeoCard variant="raised" className="text-center">
              <div className="p-6">
                <NeoCard variant="inset" size="sm" className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-orange-500" />
                </NeoCard>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Call to Book</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Simply call our number and speak naturally. Our AI understands your request 
                  and books your ride instantly.
                </p>
              </div>
            </NeoCard>
            <NeoCard variant="raised" className="text-center">
              <div className="p-6">
                <NeoCard variant="inset" size="sm" className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-500" />
                </NeoCard>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Smart Navigation</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  AI-powered route optimization ensures you reach your destination 
                  quickly and efficiently.
                </p>
              </div>
            </NeoCard>

            <NeoCard variant="raised" className="text-center">
              <div className="p-6">
                <NeoCard variant="inset" size="sm" className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-500" />
                </NeoCard>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Safe & Secure</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  All drivers are verified, rides are tracked in real-time, 
                  and emergency features are always available.
                </p>
              </div>
            </NeoCard>

            <NeoCard variant="raised" className="text-center">
              <div className="p-6">
                <NeoCard variant="inset" size="sm" className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-purple-500" />
                </NeoCard>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">24/7 Availability</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Our service is available round the clock. Book rides anytime, 
                  anywhere in supported cities.
                </p>
              </div>
            </NeoCard>

            <NeoCard variant="raised" className="text-center">
              <div className="p-6">
                <NeoCard variant="inset" size="sm" className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-yellow-500" />
                </NeoCard>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Fair Pricing</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Transparent pricing with no hidden charges. Pay via UPI, 
                  wallet, or cash as per your convenience.
                </p>
              </div>
            </NeoCard>

            <NeoCard variant="raised" className="text-center">
              <div className="p-6">
                <NeoCard variant="inset" size="sm" className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-red-500" />
                </NeoCard>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Multi-language</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Support for Malayalam, English, Manglish (Malayalam-English mix), Hindi, Tamil, Telugu, 
                  and other regional languages for your convenience.
                </p>
              </div>
            </NeoCard>
          </div>
        </NeoCard>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 bg-orange-50/50 dark:bg-black">
        <NeoCard variant="inset" className="container mx-auto px-4 rounded-none border-0">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">How FairGo Works</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Booking a ride has never been easier with our AI-powered system
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <NeoCard variant="flat" className="text-center">
              <div className="p-6">
                <NeoCard variant="raised" size="sm" className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </NeoCard>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Call FairGo</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Dial our toll-free number and speak naturally about your ride requirements
                </p>
              </div>
            </NeoCard>
            
            <NeoCard variant="flat" className="text-center">
              <div className="p-6">
                <NeoCard variant="raised" size="sm" className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </NeoCard>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">AI Processes</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Our AI understands your request, finds nearby drivers, and confirms your booking
                </p>
              </div>
            </NeoCard>
            
            <NeoCard variant="flat" className="text-center">
              <div className="p-6">
                <NeoCard variant="raised" size="sm" className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </NeoCard>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Enjoy Your Ride</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Track your driver in real-time and enjoy a comfortable, safe journey
                </p>
              </div>
            </NeoCard>
          </div>
        </NeoCard>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-16 bg-gray-800 dark:bg-black">
        <NeoCard variant="raised" className="container mx-auto px-4 text-center rounded-none border-0">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Experience FairGo?</h3>
          <p className="text-gray-300 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied riders across India. Download our app or call now to book your first ride.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/call-to-book">
              <CallToBookButton />
            </Link>
            <NeoButton variant="secondary" size="lg">
              Download for Android
            </NeoButton>
            <NeoButton variant="secondary" size="lg">
              Download for iOS
            </NeoButton>
          </div>
        </NeoCard>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 py-8">
        <NeoCard variant="flat" className="container mx-auto px-4 rounded-none border-0">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <NeoCard variant="raised" size="sm" className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </NeoCard>
              <span className="text-xl font-bold text-gray-800 dark:text-white">FairGo</span>
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">
              © 2024 FairGo. Making transportation smarter with AI.
            </div>
          </div>
        </NeoCard>
      </footer>
    </div>
    </MobileFirstPage>
  )
}