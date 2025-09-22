'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Phone, PhoneOff, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface CallSession {
  id: string
  phoneNumber: string
  status: 'initiated' | 'connected' | 'processing' | 'completed' | 'failed'
  startTime: Date
  duration?: number
  transcript?: string
  bookingData?: any
  error?: string
}

interface CallToBookSystemProps {
  onBookingComplete?: (bookingData: any) => void
}

export function CallToBookSystem({ onBookingComplete }: CallToBookSystemProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('ml')
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null)
  const [isCalling, setIsCalling] = useState(false)
  const [callHistory, setCallHistory] = useState<CallSession[]>([])

  const languages = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'ml', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
    { value: 'ml-en', label: 'Manglish (Malayalam-English)', flag: '🇮🇳' },
    { value: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
    { value: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { value: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' }
  ]

  const initiateCall = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter your phone number')
      return
    }

    setIsCalling(true)
    
    try {
      const token = localStorage.getItem('fairgo_token')
      if (!token) {
        throw new Error('Please sign in to use Call to Book')
      }

      // Create new call session
      const newSession: CallSession = {
        id: `call_${Date.now()}`,
        phoneNumber,
        status: 'initiated',
        startTime: new Date()
      }

      setCurrentSession(newSession)

      // Simulate call connection
      setTimeout(() => {
        setCurrentSession(prev => prev ? { ...prev, status: 'connected' } : null)
        
        // Simulate call processing
        setTimeout(() => {
          processCall(newSession.id)
        }, 2000)
      }, 1000)

    } catch (error) {
      console.error('Call initiation failed:', error)
      setCurrentSession(prev => prev ? { 
        ...prev, 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Failed to initiate call'
      } : null)
      setIsCalling(false)
    }
  }

  const processCall = async (sessionId: string) => {
    try {
      setCurrentSession(prev => prev ? { ...prev, status: 'processing' } : null)

      // Simulate AI processing the call
      const mockBookingData = {
        pickupLocation: 'MG Road, Bangalore',
        dropLocation: 'Koramangala, Bangalore',
        vehicleType: 'CAR_ECONOMY',
        estimatedPrice: 150
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Complete the call and create booking
      const token = localStorage.getItem('fairgo_token')
      if (token) {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(mockBookingData)
        })

        if (response.ok) {
          setCurrentSession(prev => prev ? {
            ...prev,
            status: 'completed',
            duration: 45,
            transcript: 'Customer requested ride from MG Road to Koramangala. Booking confirmed.',
            bookingData: mockBookingData
          } : null)

          setCallHistory(prev => [currentSession!, ...prev])
          onBookingComplete?.(mockBookingData)
        } else {
          throw new Error('Failed to create booking')
        }
      }

    } catch (error) {
      console.error('Call processing failed:', error)
      setCurrentSession(prev => prev ? {
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Call processing failed'
      } : null)
    } finally {
      setIsCalling(false)
    }
  }

  const endCall = () => {
    if (currentSession && ['initiated', 'connected', 'processing'].includes(currentSession.status)) {
      setCurrentSession(prev => prev ? {
        ...prev,
        status: 'completed',
        duration: prev.startTime ? Math.floor((new Date().getTime() - prev.startTime.getTime()) / 1000) : 0
      } : null)
      setIsCalling(false)
    }
  }

  const resetCall = () => {
    setCurrentSession(null)
    setIsCalling(false)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'initiated':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'connected':
        return <Phone className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Phone className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initiated':
        return 'bg-yellow-100 text-yellow-800'
      case 'connected':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Call Setup */}
      {!currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-orange-500" />
              <span>Call to Book</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Your Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isCalling}
              />
            </div>

            <div className="space-y-2">
              <Label>Preferred Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isCalling}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={initiateCall}
              disabled={isCalling || !phoneNumber.trim()}
            >
              {isCalling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              <p>Our AI assistant will understand your request and book your ride</p>
              <p>Available 24/7 • No wait time • Multi-language support</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Call */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(currentSession.status)}
                <span>Active Call</span>
              </div>
              <Badge className={getStatusColor(currentSession.status)}>
                {currentSession.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium">{currentSession.phoneNumber}</p>
              {currentSession.duration && (
                <p className="text-sm text-gray-500">Duration: {formatDuration(currentSession.duration)}</p>
              )}
            </div>

            {currentSession.status === 'connected' && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">AI Assistant is listening...</p>
                <p className="text-xs text-gray-500">Speak naturally about your ride requirements</p>
              </div>
            )}

            {currentSession.status === 'processing' && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Processing your request...</p>
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              </div>
            )}

            {currentSession.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{currentSession.error}</p>
              </div>
            )}

            {currentSession.bookingData && (
              <div className="space-y-2">
                <Label>Booking Confirmed</Label>
                <div className="p-3 bg-green-50 border border-green-200 rounded-md space-y-1">
                  <p className="text-sm"><strong>Pickup:</strong> {currentSession.bookingData.pickupLocation}</p>
                  <p className="text-sm"><strong>Destination:</strong> {currentSession.bookingData.dropLocation}</p>
                  <p className="text-sm"><strong>Vehicle:</strong> {currentSession.bookingData.vehicleType.replace('_', ' ')}</p>
                  <p className="text-sm"><strong>Price:</strong> ₹{currentSession.bookingData.estimatedPrice}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              {['connected', 'processing'].includes(currentSession.status) && (
                <Button variant="destructive" className="flex-1" onClick={endCall}>
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              )}
              
              <Button variant="outline" className="flex-1" onClick={resetCall}>
                New Call
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call History */}
      {callHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {callHistory.slice(0, 5).map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(call.status)}
                    <div>
                      <p className="font-medium">{call.phoneNumber}</p>
                      <p className="text-xs text-gray-500">
                        {call.startTime.toLocaleDateString()} {call.startTime.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(call.status)} variant="outline">
                      {call.status.replace('_', ' ')}
                    </Badge>
                    {call.duration && (
                      <p className="text-xs text-gray-500 mt-1">{formatDuration(call.duration)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}