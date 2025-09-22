'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  CreditCard,
  Phone,
  Star,
  Navigation,
  Car,
  User,
  MessageSquare,
  Share2,
  Calendar
} from 'lucide-react'

interface BookingConfirmationProps {
  bookingDetails: {
    from: string
    to: string
    serviceType: string
    estimatedPrice: string
    estimatedTime: string
    driverETA: string
  }
  onTrackingStart: () => void
}

interface DriverInfo {
  name: string
  rating: number
  vehicleNumber: string
  phoneNumber: string
  photoUrl?: string
}

export function BookingConfirmation({ bookingDetails, onTrackingStart }: BookingConfirmationProps) {
  const [bookingId] = useState(`FG${Date.now().toString().slice(-6)}`)
  const [etaCountdown, setEtaCountdown] = useState(240) // 4 minutes in seconds
  
  // Mock driver data
  const driverInfo: DriverInfo = {
    name: 'Raj Kumar',
    rating: 4.8,
    vehicleNumber: 'KA 05 MN 1234',
    phoneNumber: '+91 98765 43210'
  }

  // Countdown timer for ETA
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaCountdown(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const pageVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 }
  }

  const successVariants = {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { type: "spring", stiffness: 200, damping: 15 }
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Success Header */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div 
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
          variants={successVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        
        <motion.h1 
          className="text-3xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Booking Confirmed!
        </motion.h1>
        
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Your ride has been successfully booked
        </motion.p>
        
        <motion.div 
          className="mt-4 inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="text-sm font-medium text-gray-700">Booking ID:</span>
          <Badge variant="secondary" className="font-mono">
            {bookingId}
          </Badge>
        </motion.div>
      </motion.div>

      {/* Trip Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Trip Details</h3>
            
            {/* Route */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-4 h-4 bg-blue-500 rounded-full mt-1"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">From</p>
                  <p className="font-medium text-gray-900">{bookingDetails.from}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Now</p>
                </div>
              </div>
              
              <div className="ml-6 border-l-2 border-dashed border-gray-200 h-6"></div>
              
              <div className="flex items-start space-x-4">
                <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">To</p>
                  <p className="font-medium text-gray-900">{bookingDetails.to}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{bookingDetails.estimatedTime}</p>
                </div>
              </div>
            </div>

            {/* Trip Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Car className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Service</span>
                </div>
                <p className="font-semibold text-gray-900">{bookingDetails.serviceType}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Fare</span>
                </div>
                <p className="font-semibold text-gray-900">{bookingDetails.estimatedPrice}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Driver Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Your Driver</h3>
              <Badge className="bg-green-100 text-green-700">
                Arriving in {formatTime(etaCountdown)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Driver Photo */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              
              {/* Driver Details */}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">{driverInfo.name}</h4>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{driverInfo.rating}</span>
                  </div>
                  <span className="text-sm text-gray-600">{driverInfo.vehicleNumber}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-10 h-10 p-0"
                  onClick={() => window.open(`tel:${driverInfo.phoneNumber}`)}
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-10 h-10 p-0"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Driver ETA Status */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-900">
                  Driver is on the way to your pickup location
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Live Tracking Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button 
          onClick={onTrackingStart}
          className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-lg rounded-xl shadow-lg mb-4"
        >
          <Navigation className="w-6 h-6 mr-3" />
          Start Live Tracking
        </Button>
      </motion.div>

      {/* Additional Actions */}
      <motion.div 
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button variant="outline" className="h-12 flex-col space-y-1">
          <Share2 className="w-4 h-4" />
          <span className="text-xs">Share</span>
        </Button>
        
        <Button variant="outline" className="h-12 flex-col space-y-1">
          <Calendar className="w-4 h-4" />
          <span className="text-xs">Schedule</span>
        </Button>
        
        <Button variant="outline" className="h-12 flex-col space-y-1">
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">Support</span>
        </Button>
      </motion.div>

      {/* Booking Summary Footer */}
      <motion.div 
        className="mt-6 bg-white rounded-xl p-4 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Booked via FairGo AI Assistant
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <span>• Cashless payment</span>
            <span>• GPS tracked</span>
            <span>• 24/7 support</span>
          </div>
        </div>
      </motion.div>

      {/* Emergency Note */}
      <motion.div 
        className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-sm text-red-800 text-center">
          <strong>Emergency:</strong> Call 100 or use the SOS button in live tracking
        </p>
      </motion.div>
    </motion.div>
  )
}