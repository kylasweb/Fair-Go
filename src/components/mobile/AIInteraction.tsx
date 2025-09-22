'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  MessageSquare,
  MapPin,
  Clock,
  Car,
  Zap,
  Volume2,
  VolumeX,
  User,
  Bot,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

class SpeechRecognition extends EventTarget {
  continuous: boolean = false;
  interimResults: boolean = false;
  lang: string = 'en-US';
  onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  
  start(): void {}
  stop(): void {}
  abort(): void {}
}

interface AIInteractionProps {
  onBack: () => void
  onBookingComplete: (bookingDetails: BookingDetails) => void
  selectedService: {
    name: string
    icon: React.ReactNode
    basePrice: string
  }
}

interface BookingDetails {
  from: string
  to: string
  serviceType: string
  estimatedPrice: string
  estimatedTime: string
  driverETA: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  audioUrl?: string
}

type BookingStep = 'welcome' | 'pickup' | 'destination' | 'confirmation' | 'complete'

// Common Indian locations for demonstration
const INDIAN_LOCATIONS = [
  'Mumbai Central', 'Delhi Airport', 'Bangalore IT Park', 'Chennai Marina',
  'Kolkata Howrah', 'Hyderabad HITEC City', 'Pune Station', 'Kochi Marine Drive',
  'Thiruvananthapuram Central', 'Kozhikode Beach', 'Thrissur Round', 'Kottayam Bus Stand',
  'Alappuzha Backwaters', 'Wayanad Hills', 'Munnar Tea Gardens', 'Fort Kochi'
]

export function AIInteraction({ onBack, onBookingComplete, selectedService }: AIInteractionProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [currentStep, setCurrentStep] = useState<BookingStep>('welcome')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showTranscript, setShowTranscript] = useState(true)
  const [showInstructions, setShowInstructions] = useState(true)
  const [bookingData, setBookingData] = useState({
    pickup: '',
    destination: '',
    confirmed: false
  })
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')

  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize Speech Recognition and Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = false
        recognitionInstance.lang = 'en-IN' // Indian English
        
        recognitionInstance.onstart = () => {
          setIsListening(true)
          addMessage('system', '🎤 Listening... Speak now!')
        }
        
        recognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript.trim()
          setLastTranscript(transcript)
          setIsListening(false)
          addMessage('user', transcript)
          processUserInput(transcript)
        }
        
        recognitionInstance.onerror = (event) => {
          setIsListening(false)
          console.error('Speech recognition error:', event.error)
          addMessage('system', `❌ Speech recognition error: ${event.error}. Please try again.`)
        }
        
        recognitionInstance.onend = () => {
          setIsListening(false)
        }
        
        setRecognition(recognitionInstance)
      } else {
        addMessage('system', '❌ Speech recognition not supported in this browser. Use Chrome for best experience.')
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        setSynthesis(window.speechSynthesis)
      }
    }
  }, [])

  // Start the AI conversation flow
  const startCall = () => {
    setIsCallActive(true)
    setCurrentStep('welcome')
    setCallDuration(0)
    setMessages([])
    
    // Start call timer
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    // Welcome message
    setTimeout(() => {
      const welcomeMsg = `Hello! Welcome to FairGo AI booking. I'll help you book a ${selectedService.name}. Let's start with your pickup location. Where would you like to be picked up from?`
      addMessage('ai', welcomeMsg)
      speakMessage(welcomeMsg)
      setCurrentStep('pickup')
    }, 1000)
  }

  // End the call
  const endCall = () => {
    if (recognition) {
      recognition.stop()
    }
    if (synthesis) {
      synthesis.cancel()
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }
    setIsCallActive(false)
    setIsListening(false)
    setCurrentStep('welcome')
  }

  // Text-to-speech function
  const speakMessage = (text: string) => {
    if (synthesis && !isMuted) {
      synthesis.cancel() // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-IN'
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 0.8
      synthesis.speak(utterance)
    }
  }

  // Process user voice input
  const processUserInput = (transcript: string) => {
    setIsProcessing(true)
    
    // Simulate processing delay
    setTimeout(() => {
      let response = ''
      
      switch (currentStep) {
        case 'pickup':
          if (transcript.toLowerCase().includes('pickup') || 
              transcript.toLowerCase().includes('from') ||
              isLocationMentioned(transcript)) {
            const location = extractLocation(transcript)
            setBookingData(prev => ({ ...prev, pickup: location }))
            response = `Great! I've noted your pickup location as "${location}". Now, where would you like to go? Please tell me your destination.`
            addMessage('ai', response)
            speakMessage(response)
            setCurrentStep('destination')
          } else {
            response = `I didn't catch a clear pickup location. Could you please say something like "Pick me up from Mumbai Central" or "From Delhi Airport"?`
            addMessage('ai', response)
            speakMessage(response)
          }
          break
          
        case 'destination':
          if (transcript.toLowerCase().includes('to') || 
              transcript.toLowerCase().includes('destination') ||
              isLocationMentioned(transcript)) {
            const location = extractLocation(transcript)
            setBookingData(prev => ({ ...prev, destination: location }))
            const confirmationMsg = `Perfect! Let me confirm your booking:
            
📍 Pickup: ${bookingData.pickup}
🎯 Destination: ${location}
🚗 Service: ${selectedService.name}
💰 Estimated fare: ${selectedService.basePrice}

Should I confirm this booking for you? Say "yes" to confirm or "no" to make changes.`
            
            addMessage('ai', confirmationMsg)
            speakMessage(`Perfect! Pickup from ${bookingData.pickup}, destination to ${location}, using ${selectedService.name} service. Estimated fare ${selectedService.basePrice}. Should I confirm this booking? Say yes to confirm or no to make changes.`)
            setCurrentStep('confirmation')
          } else {
            response = `I need your destination. Could you say something like "Take me to Bangalore IT Park" or "Go to Chennai Marina"?`
            addMessage('ai', response)
            speakMessage(response)
          }
          break
          
        case 'confirmation':
          if (transcript.toLowerCase().includes('yes') || 
              transcript.toLowerCase().includes('confirm') ||
              transcript.toLowerCase().includes('book') ||
              transcript.toLowerCase().includes('okay')) {
            const successMsg = `✅ Excellent! Your booking is confirmed. A driver will be assigned shortly and you'll receive pickup details. Thank you for using FairGo!`
            addMessage('ai', successMsg)
            speakMessage(successMsg)
            
            // Complete the booking
            setTimeout(() => {
              onBookingComplete({
                from: bookingData.pickup,
                to: bookingData.destination,
                serviceType: selectedService.name,
                estimatedPrice: selectedService.basePrice,
                estimatedTime: '15-20 minutes',
                driverETA: '5 minutes'
              })
            }, 3000)
            
            setCurrentStep('complete')
          } else if (transcript.toLowerCase().includes('no') || 
                     transcript.toLowerCase().includes('change') ||
                     transcript.toLowerCase().includes('modify')) {
            response = `No problem! Let's start over. Where would you like to be picked up from?`
            addMessage('ai', response)
            speakMessage(response)
            setBookingData({ pickup: '', destination: '', confirmed: false })
            setCurrentStep('pickup')
          } else {
            response = `Please say "yes" to confirm the booking or "no" to make changes.`
            addMessage('ai', response)
            speakMessage(response)
          }
          break
      }
      
      setIsProcessing(false)
    }, 1500)
  }

  // Check if transcript contains a location
  const isLocationMentioned = (transcript: string): boolean => {
    return INDIAN_LOCATIONS.some(location => 
      transcript.toLowerCase().includes(location.toLowerCase()) ||
      location.toLowerCase().includes(transcript.toLowerCase())
    )
  }

  // Extract location from transcript
  const extractLocation = (transcript: string): string => {
    // First, try to find exact matches
    for (const location of INDIAN_LOCATIONS) {
      if (transcript.toLowerCase().includes(location.toLowerCase())) {
        return location
      }
    }
    
    // If no exact match, extract meaningful parts
    const words = transcript.toLowerCase().replace(/[^\w\s]/g, '').split(' ')
    const meaningfulWords = words.filter(word => 
      !['from', 'to', 'pickup', 'drop', 'me', 'at', 'the', 'go', 'take'].includes(word)
    )
    
    return meaningfulWords.slice(0, 3).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || transcript
  }

  // Start listening
  const startListening = () => {
    if (recognition && !isListening && !isProcessing) {
      recognition.start()
    } else if (!recognition) {
      addMessage('system', '❌ Speech recognition not available. Please use Chrome browser.')
    }
  }

  // Stop listening
  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
    }
  }

  // Add message to chat
  const addMessage = (type: 'user' | 'ai' | 'system', content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get current step instructions
  const getCurrentStepInstructions = () => {
    switch (currentStep) {
      case 'welcome':
        return "Press the call button to start your AI booking experience"
      case 'pickup':
        return "🎤 Say your pickup location (e.g., 'From Mumbai Central')"
      case 'destination':
        return "🎯 Say where you want to go (e.g., 'To Delhi Airport')"
      case 'confirmation':
        return "✅ Say 'Yes' to confirm or 'No' to make changes"
      case 'complete':
        return "🎉 Booking completed! Driver will be assigned shortly"
      default:
        return "Follow the voice prompts"
    }
  }

  return (
    <motion.div
      className="h-full bg-gradient-to-br from-blue-50 via-white to-purple-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">AI Voice Booking</h1>
            <p className="text-sm text-gray-500">{selectedService.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isCallActive && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {formatDuration(callDuration)}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Instructions Card */}
        {showInstructions && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">How to Use AI Voice Booking</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p><strong>Step 1:</strong> Press "Start Call" to begin</p>
                    <p><strong>Step 2:</strong> When prompted, say your pickup location clearly</p>
                    <p><strong>Step 3:</strong> Next, say your destination</p>
                    <p><strong>Step 4:</strong> Confirm by saying "Yes" or make changes by saying "No"</p>
                    <p className="text-xs mt-2 text-blue-600">
                      💡 <strong>Tip:</strong> Speak clearly and mention specific locations like "From Mumbai Central" or "To Delhi Airport"
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Hide Instructions
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Step Indicator */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                {currentStep === 'welcome' && <Phone className="w-5 h-5 text-orange-600" />}
                {currentStep === 'pickup' && <MapPin className="w-5 h-5 text-orange-600" />}
                {currentStep === 'destination' && <Car className="w-5 h-5 text-orange-600" />}
                {currentStep === 'confirmation' && <CheckCircle2 className="w-5 h-5 text-orange-600" />}
                {currentStep === 'complete' && <Zap className="w-5 h-5 text-orange-600" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {currentStep === 'welcome' && 'Ready to Start'}
                  {currentStep === 'pickup' && 'Tell me pickup location'}
                  {currentStep === 'destination' && 'Where are you going?'}
                  {currentStep === 'confirmation' && 'Confirm your booking'}
                  {currentStep === 'complete' && 'Booking Complete!'}
                </h3>
                <p className="text-sm text-gray-600">{getCurrentStepInstructions()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Control Area */}
        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {!isCallActive ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Phone className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Start AI Voice Booking</h2>
                    <p className="text-gray-600 text-sm mb-4">
                      Press the button below to start your voice booking session
                    </p>
                    <Button
                      onClick={startCall}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
                      size="lg"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Start Call
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Status Indicator */}
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${
                      isListening ? 'bg-red-500' : isProcessing ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Ready to listen'}
                    </span>
                  </div>

                  {/* Voice Control Buttons */}
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={startListening}
                      disabled={isListening || isProcessing || currentStep === 'complete'}
                      className={`w-16 h-16 rounded-full ${
                        isListening 
                          ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {isListening ? <Mic className="w-8 h-8 text-white" /> : <MicOff className="w-8 h-8 text-white" />}
                    </Button>
                    
                    <Button
                      onClick={isMuted ? () => setIsMuted(false) : () => setIsMuted(true)}
                      variant="outline"
                      className="w-12 h-12 rounded-full"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    
                    <Button
                      onClick={endCall}
                      className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                    >
                      <PhoneOff className="w-8 h-8 text-white" />
                    </Button>
                  </div>

                  {/* Processing Indicator */}
                  {isProcessing && (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600">Processing your request...</span>
                    </div>
                  )}

                  {/* Last Transcript Display */}
                  {lastTranscript && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-2">
                          <User className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm text-green-800">You said:</p>
                            <p className="font-medium text-green-900">"{lastTranscript}"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Booking Progress */}
                  {(bookingData.pickup || bookingData.destination) && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Booking Details</h4>
                        <div className="space-y-2 text-sm">
                          {bookingData.pickup && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-green-600" />
                              <span className="text-gray-700">Pickup: <strong>{bookingData.pickup}</strong></span>
                            </div>
                          )}
                          {bookingData.destination && (
                            <div className="flex items-center space-x-2">
                              <Car className="w-4 h-4 text-blue-600" />
                              <span className="text-gray-700">Destination: <strong>{bookingData.destination}</strong></span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Example Phrases Card */}
        {isCallActive && currentStep !== 'complete' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">💡 Example Phrases</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                {currentStep === 'pickup' && (
                  <>
                    <p>• "Pick me up from Mumbai Central"</p>
                    <p>• "From Delhi Airport Terminal 3"</p>
                    <p>• "Pickup from Bangalore IT Park"</p>
                  </>
                )}
                {currentStep === 'destination' && (
                  <>
                    <p>• "Take me to Chennai Marina Beach"</p>
                    <p>• "Go to Kochi Marine Drive"</p>
                    <p>• "Destination is Hyderabad HITEC City"</p>
                  </>
                )}
                {currentStep === 'confirmation' && (
                  <>
                    <p>• "Yes, confirm the booking"</p>
                    <p>• "No, I want to change something"</p>
                    <p>• "That's correct, book it"</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversation Transcript */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Conversation</h4>
              <Button
                onClick={() => setShowTranscript(!showTranscript)}
                variant="ghost"
                size="sm"
              >
                {showTranscript ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  className="space-y-3 max-h-60 overflow-y-auto"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No conversation yet. Start the call to begin!
                    </p>
                  ) : (
                    messages.map((message) => (
                      <motion.div 
                        key={message.id} 
                        className="flex items-start space-x-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === 'ai' 
                            ? 'bg-blue-100' 
                            : message.type === 'user' 
                              ? 'bg-green-100' 
                              : 'bg-gray-100'
                        }`}>
                          {message.type === 'ai' ? (
                            <Bot className="w-4 h-4 text-blue-600" />
                          ) : message.type === 'user' ? (
                            <User className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`inline-block px-3 py-2 rounded-lg text-sm max-w-full ${
                            message.type === 'ai' 
                              ? 'bg-blue-50 text-blue-900' 
                              : message.type === 'user' 
                                ? 'bg-green-50 text-green-900' 
                                : 'bg-gray-50 text-gray-700'
                          }`}>
                            <div className="whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}