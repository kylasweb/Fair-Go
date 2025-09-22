'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mic, MicOff, Loader2, Volume2, VolumeX } from 'lucide-react'

interface VoiceBookingProps {
  onBookingComplete?: (bookingData: any) => void
}

interface VoiceState {
  isRecording: boolean
  isProcessing: boolean
  transcript: string
  aiResponse: string
  bookingData: any
  error: string | null
}

export function VoiceBooking({ onBookingComplete }: VoiceBookingProps) {
  const [state, setState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    aiResponse: '',
    bookingData: null,
    error: null
  })
  
  const [selectedLanguage, setSelectedLanguage] = useState('ml')
  const [isMuted, setIsMuted] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const languages = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'ml', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
    { value: 'ml-en', label: 'Manglish (Malayalam-English)', flag: '🇮🇳' },
    { value: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
    { value: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { value: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' }
  ]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        processAudio(audioBlob)
      }

      mediaRecorder.start()
      setState(prev => ({ ...prev, isRecording: true, error: null }))
    } catch (error) {
      console.error('Failed to start recording:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Microphone access denied. Please allow microphone access to use voice booking.'
      }))
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }))
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    try {
      const token = localStorage.getItem('fairgo_token')
      if (!token) {
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          error: 'Please sign in to use voice booking'
        }))
        return
      }

      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice.wav')
      formData.append('language', selectedLanguage)

      const response = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          transcript: 'Voice input processed successfully',
          aiResponse: result.response,
          bookingData: result.request.entities,
          error: null
        }))

        // If booking intent detected, proceed with booking
        if (result.request.intent === 'book_ride') {
          handleAutoBooking(result.request.entities)
        }
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: result.message || 'Failed to process voice request'
        }))
      }
    } catch (error) {
      console.error('Voice processing failed:', error)
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to process voice request. Please try again.'
      }))
    }
  }

  const handleAutoBooking = async (entities: any) => {
    try {
      const token = localStorage.getItem('fairgo_token')
      if (!token) return

      const bookingData = {
        pickupLocation: entities.pickupLocation || 'Current Location',
        dropLocation: entities.dropLocation,
        vehicleType: entities.vehicleType || 'CAR_ECONOMY',
        estimatedPrice: 150 // Default price
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
        setState(prev => ({
          ...prev,
          aiResponse: prev.aiResponse + '\n\n✅ Ride booked successfully!'
        }))
        onBookingComplete?.(bookingData)
      }
    } catch (error) {
      console.error('Auto booking failed:', error)
    }
  }

  const toggleRecording = () => {
    if (state.isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const resetRecording = () => {
    setState({
      isRecording: false,
      isProcessing: false,
      transcript: '',
      aiResponse: '',
      bookingData: null,
      error: null
    })
  }

  const speakResponse = () => {
    if ('speechSynthesis' in window && state.aiResponse && !isMuted) {
      const utterance = new SpeechSynthesisUtterance(state.aiResponse)
      utterance.lang = selectedLanguage
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  // Auto-speak response when it changes
  useEffect(() => {
    if (state.aiResponse && !state.isProcessing) {
      speakResponse()
    }
  }, [state.aiResponse, state.isProcessing, isMuted])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span>Voice Booking</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Language</label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
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

        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={state.isRecording ? "destructive" : "default"}
            size="lg"
            className="w-16 h-16 rounded-full"
            onClick={toggleRecording}
            disabled={state.isProcessing}
          >
            {state.isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>

        {/* Status */}
        <div className="text-center">
          {state.isRecording && (
            <div className="space-y-2">
              <Badge variant="destructive" className="animate-pulse">
                Recording...
              </Badge>
              <p className="text-sm text-gray-600">
                Speak naturally about your ride requirements
              </p>
            </div>
          )}
          
          {state.isProcessing && (
            <div className="space-y-2">
              <Badge variant="secondary">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Processing...
              </Badge>
              <p className="text-sm text-gray-600">
                AI is understanding your request
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}

        {/* AI Response */}
        {state.aiResponse && (
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Response</label>
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{state.aiResponse}</p>
            </div>
          </div>
        )}

        {/* Booking Data Display */}
        {state.bookingData && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Booking Details</label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-1">
              <p className="text-sm"><strong>Pickup:</strong> {state.bookingData.pickupLocation}</p>
              {state.bookingData.dropLocation && (
                <p className="text-sm"><strong>Destination:</strong> {state.bookingData.dropLocation}</p>
              )}
              {state.bookingData.vehicleType && (
                <p className="text-sm"><strong>Vehicle:</strong> {state.bookingData.vehicleType.replace('_', ' ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Reset Button */}
        {(state.aiResponse || state.error) && (
          <Button variant="outline" className="w-full" onClick={resetRecording}>
            Start New Booking
          </Button>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center">
          <p>Example: "I need a ride from MG Road to Koramangala"</p>
          <p>Supported: Malayalam, English, Manglish, Hindi, Tamil, Telugu</p>
        </div>
      </CardContent>
    </Card>
  )
}