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
  Loader2
} from 'lucide-react'

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

export function AIInteraction({ onBack, onBookingComplete, selectedService }: AIInteractionProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [aiStatus, setAiStatus] = useState<'connecting' | 'ready' | 'listening' | 'processing' | 'speaking'>('connecting')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showTranscript, setShowTranscript] = useState(false)
  
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const websocketRef = useRef<WebSocket | null>(null)

  // Initialize WebSocket connection for real-time AI communication
  useEffect(() => {
    if (isCallActive && !websocketRef.current) {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsHost = window.location.host
        websocketRef.current = new WebSocket(`${wsProtocol}//${wsHost}/api/ai/voice/stream`)
        
        websocketRef.current.onopen = () => {
          console.log('AI WebSocket connected')
          setAiStatus('ready')
          addMessage('system', 'Connected to AI Assistant')
          
          // Send initial greeting request
          setTimeout(() => {
            websocketRef.current?.send(JSON.stringify({
              type: 'greeting',
              service: selectedService.name
            }))
          }, 500)
        }
        
        websocketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            handleAIResponse(data)
          } catch (error) {
            console.error('WebSocket message error:', error)
          }
        }
        
        websocketRef.current.onerror = (error) => {
          console.error('WebSocket error:', error)
          setAiStatus('ready')
          addMessage('system', 'Connection error - using offline mode')
        }
        
        websocketRef.current.onclose = () => {
          console.log('AI WebSocket disconnected')
        }
      } catch (error) {
        console.error('WebSocket initialization error:', error)
        setAiStatus('ready')
        addMessage('system', 'Using offline demo mode')
      }
    }
    
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
        websocketRef.current = null
      }
    }
  }, [isCallActive])

  // Handle AI responses
  const handleAIResponse = (data: any) => {
    switch (data.type) {
      case 'greeting':
        setAiStatus('speaking')
        addMessage('ai', data.message)
        setTimeout(() => setAiStatus('listening'), 2000)
        break
        
      case 'transcription':
        addMessage('user', data.text)
        setAiStatus('processing')
        break
        
      case 'ai_response':
        setAiStatus('speaking')
        addMessage('ai', data.message)
        
        // Play audio if available
        if (data.audioUrl) {
          playAIAudio(data.audioUrl)
        }
        
        setTimeout(() => {
          if (data.booking_complete) {
            onBookingComplete(data.booking_details)
          } else {
            setAiStatus('listening')
          }
        }, data.audioUrl ? 5000 : 2000)
        break
        
      case 'error':
        setAiStatus('ready')
        addMessage('system', `Error: ${data.message}`)
        break
    }
  }

  // Play AI audio response
  const playAIAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl
      audioRef.current.play().catch(error => {
        console.error('Audio play error:', error)
      })
    }
  }

  // Initialize audio recording
  const initializeAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      })
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        sendAudioToAI(audioBlob)
        audioChunksRef.current = []
      }
      
      return true
    } catch (error) {
      console.error('Microphone access error:', error)
      addMessage('system', 'Microphone access denied - using text mode')
      return false
    }
  }

  // Send audio to AI for processing
  const sendAudioToAI = async (audioBlob: Blob) => {
    try {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        // Convert blob to base64 for WebSocket transmission
        const reader = new FileReader()
        reader.onload = () => {
          const base64Audio = reader.result as string
          websocketRef.current?.send(JSON.stringify({
            type: 'audio_data',
            audio: base64Audio.split(',')[1], // Remove data:audio/webm;base64, prefix
            format: 'webm'
          }))
        }
        reader.readAsDataURL(audioBlob)
      } else {
        // Fallback: Use REST API
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')
        
        const response = await fetch('/api/ai/voice/transcribe', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const data = await response.json()
          handleAIResponse(data)
        } else {
          throw new Error('Transcription failed')
        }
      }
    } catch (error) {
      console.error('Audio processing error:', error)
      setAiStatus('ready')
      addMessage('system', 'Audio processing failed - please try again')
    }
  }

  // Call timer
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [isCallActive])

  const addMessage = (type: 'user' | 'ai' | 'system', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const startCall = async () => {
    setIsCallActive(true)
    setCallDuration(0)
    setAiStatus('connecting')
    addMessage('system', 'Connecting to AI Assistant...')
    
    // Initialize audio recording
    await initializeAudioRecording()
  }

  const endCall = () => {
    setIsCallActive(false)
    setIsRecording(false)
    setAiStatus('ready')
    addMessage('system', 'Call ended')
    
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    // Stop audio tracks
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    
    // Close WebSocket
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }
  }

  const toggleRecording = async () => {
    if (!isCallActive) return
    
    if (!isRecording) {
      // Start recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        setIsRecording(true)
        setAiStatus('listening')
        mediaRecorderRef.current.start(1000) // Record in 1-second chunks
      } else if (!mediaRecorderRef.current) {
        // Try to initialize recording if not already done
        const success = await initializeAudioRecording()
        if (success) {
          setTimeout(() => toggleRecording(), 500)
        }
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        setIsRecording(false)
        setAiStatus('processing')
        mediaRecorderRef.current.stop()
      }
    }
  }

  // Fallback demo functionality for offline mode
  const simulateBookingConfirmation = async () => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      // Use demo mode
      setAiStatus('processing')
      addMessage('user', 'I need to go to Indiranagar Metro Station')
      
      setTimeout(() => {
        setAiStatus('speaking')
        addMessage('ai', 'Perfect! Indiranagar Metro Station. I can see that\'s about 12 minutes away. Let me confirm your pickup location is your current location. Is that correct?')
        setTimeout(() => setAiStatus('listening'), 3000)
      }, 1500)

      // Continue demo flow
      setTimeout(() => {
        addMessage('user', 'Yes, that\'s correct')
        setAiStatus('processing')
        
        setTimeout(() => {
          setAiStatus('speaking')
          addMessage('ai', 'Excellent! I\'ve found a driver for you. The fare will be ₹95 and the driver will arrive in 4 minutes. Shall I confirm this booking?')
          
          setTimeout(() => {
            addMessage('user', 'Yes, please book it')
            setAiStatus('processing')
            
            setTimeout(() => {
              const bookingDetails: BookingDetails = {
                from: 'Current Location',
                to: 'Indiranagar Metro Station',
                serviceType: selectedService.name,
                estimatedPrice: '₹95',
                estimatedTime: '12 minutes',
                driverETA: '4 minutes'
              }
              
              addMessage('ai', 'Perfect! Your ride has been booked successfully. Driver Raj will pick you up in 4 minutes. Have a great trip!')
              endCall()
              setTimeout(() => onBookingComplete(bookingDetails), 2000)
            }, 2000)
          }, 3000)
        }, 1000)
      }, 6000)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const pageVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 }
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 px-4 py-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Hidden audio element for AI responses */}
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-sm text-gray-600">Voice booking experience</p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTranscript(!showTranscript)}
          className="text-gray-600"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>

      {/* Service Info */}
      <motion.div 
        className="bg-white rounded-xl p-4 mb-6 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
            {selectedService.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{selectedService.name}</h3>
            <p className="text-sm text-gray-600">Starting from {selectedService.basePrice}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Selected
          </Badge>
        </div>
      </motion.div>

      {/* AI Assistant Interface */}
      <div className="flex-1 flex flex-col">
        
        {/* AI Status Display */}
        <motion.div 
          className="bg-white rounded-2xl p-6 mb-6 text-center shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* AI Avatar */}
          <motion.div 
            className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              aiStatus === 'listening' 
                ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                : aiStatus === 'speaking' 
                  ? 'bg-gradient-to-r from-blue-400 to-purple-500'
                  : 'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}
            animate={{ 
              scale: aiStatus === 'listening' || aiStatus === 'speaking' ? [1, 1.1, 1] : 1,
              rotate: aiStatus === 'processing' ? 360 : 0
            }}
            transition={{ 
              scale: { duration: 1, repeat: aiStatus === 'listening' || aiStatus === 'speaking' ? Infinity : 0 },
              rotate: { duration: 2, repeat: aiStatus === 'processing' ? Infinity : 0, ease: "linear" }
            }}
          >
            {aiStatus === 'connecting' || aiStatus === 'processing' ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : (
              <Bot className="w-12 h-12 text-white" />
            )}
          </motion.div>

          {/* Status Text */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {aiStatus === 'connecting' && 'Connecting to AI...'}
              {aiStatus === 'ready' && 'AI Assistant Ready'}
              {aiStatus === 'listening' && 'I\'m listening...'}
              {aiStatus === 'processing' && 'Processing your request...'}
              {aiStatus === 'speaking' && 'AI is speaking...'}
            </h3>
            <p className="text-gray-600 text-sm">
              {aiStatus === 'connecting' && 'Setting up your voice connection'}
              {aiStatus === 'ready' && 'Tap the call button to start'}
              {aiStatus === 'listening' && 'Speak clearly about your destination'}
              {aiStatus === 'processing' && 'Understanding your request'}
              {aiStatus === 'speaking' && 'Listen to the response'}
            </p>
          </div>

          {/* Call Duration */}
          {isCallActive && (
            <motion.div 
              className="flex items-center justify-center space-x-2 mb-4 text-sm text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Call duration: {formatDuration(callDuration)}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Call Controls */}
        <motion.div 
          className="bg-white rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-center space-x-6">
            
            {/* Call Button */}
            <motion.button
              onClick={isCallActive ? endCall : startCall}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                isCallActive 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white transition-colors`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isCallActive ? <PhoneOff className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
            </motion.button>

            {/* Recording Button */}
            {isCallActive && (
              <motion.button
                onClick={toggleRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </motion.button>
            )}

            {/* Mute Button */}
            {isCallActive && (
              <motion.button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                  isMuted 
                    ? 'bg-gray-500 hover:bg-gray-600' 
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white transition-colors`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
              </motion.button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-2">
              {!isCallActive 
                ? 'Tap the green button to start your voice booking'
                : 'Hold the blue button and speak your destination'
              }
            </p>
            
            {/* Demo Button */}
            {isCallActive && aiStatus === 'listening' && (
              <Button
                onClick={simulateBookingConfirmation}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Demo: Complete Booking
              </Button>
            )}
          </div>
        </motion.div>

        {/* Transcript */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              className="mt-6 bg-white rounded-xl p-4 shadow-lg max-h-60 overflow-y-auto"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className="font-semibold text-gray-900 mb-3">Conversation</h4>
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
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
                      <div className={`inline-block px-3 py-2 rounded-lg text-sm ${
                        message.type === 'ai' 
                          ? 'bg-blue-50 text-blue-900' 
                          : message.type === 'user' 
                            ? 'bg-green-50 text-green-900' 
                            : 'bg-gray-50 text-gray-700'
                      }`}>
                        {message.content}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}