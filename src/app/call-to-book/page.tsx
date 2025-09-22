'use client'

import { CallToBookSystem } from '@/components/call-to-book-system'
import { FairGoLogo } from '@/components/fairgo-logo'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CallToBookPage() {
  const handleBookingComplete = (bookingData: any) => {
    console.log('Booking completed via call:', bookingData)
    // In a real app, you might navigate to booking details or show a success message
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/booking">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <FairGoLogo />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Call to Book
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Experience the magic of AI-powered taxi booking. Just call, speak naturally, 
              and our AI handles the rest.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-orange-800 mb-2">🎯 How it works:</h3>
              <ol className="text-sm text-orange-700 space-y-1 text-left">
                <li>1. Enter your phone number and preferred language</li>
                <li>2. Click "Call Now" to connect with our AI assistant</li>
                <li>3. Speak naturally about your ride requirements</li>
                <li>4. Our AI understands and books your ride instantly</li>
                <li>5. Receive confirmation and track your ride in real-time</li>
              </ol>
            </div>
          </div>

          {/* Call to Book System */}
          <CallToBookSystem onBookingComplete={handleBookingComplete} />

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                🌐
              </div>
              <h3 className="font-semibold mb-1">Multi-language</h3>
              <p className="text-sm text-gray-600">Malayalam, English, Manglish, Hindi, Tamil, Telugu & more</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                ⚡
              </div>
              <h3 className="font-semibold mb-1">Instant Booking</h3>
              <p className="text-sm text-gray-600">No wait time, book in seconds</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                🤖
              </div>
              <h3 className="font-semibold mb-1">AI Powered</h3>
              <p className="text-sm text-gray-600">Smart understanding of natural speech</p>
            </div>
          </div>

          {/* Emergency Note */}
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">🚨 Emergency Support</h3>
            <p className="text-sm text-red-700">
              For emergency bookings or immediate assistance, our AI system prioritizes urgent requests. 
              Simply mention "emergency" during your call for expedited service.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}