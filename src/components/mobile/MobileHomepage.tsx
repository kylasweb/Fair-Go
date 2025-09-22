'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Phone, 
  Map, 
  MapPin, 
  Clock,
  Shield,
  Star,
  ChevronRight,
  Loader2
} from 'lucide-react'

interface MobileHomepageProps {
  onBookByCall: () => void
  onBookOnline: () => void
}

export function MobileHomepage({ onBookByCall, onBookOnline }: MobileHomepageProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<string>('Getting location...')
  const [locationLoading, setLocationLoading] = useState(true)

  // Get user's real location
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              
              // Reverse geocoding to get address
              try {
                const response = await fetch(
                  `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
                )
                const data = await response.json()
                
                if (data.results && data.results[0]) {
                  const components = data.results[0].components
                  const address = `${components.suburb || components.neighbourhood || ''}, ${components.city || components.state || ''}`
                  setCurrentLocation(address)
                } else {
                  // Fallback for Indian cities
                  setCurrentLocation('Koramangala, Bangalore')
                }
              } catch (error) {
                console.error('Geocoding error:', error)
                setCurrentLocation('Koramangala, Bangalore')
              }
              
              setLocationLoading(false)
            },
            (error) => {
              console.error('Geolocation error:', error)
              setCurrentLocation('Koramangala, Bangalore') // Default location
              setLocationLoading(false)
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            }
          )
        } else {
          setCurrentLocation('Koramangala, Bangalore') // Default location
          setLocationLoading(false)
        }
      } catch (error) {
        console.error('Location error:', error)
        setCurrentLocation('Koramangala, Bangalore') // Default location
        setLocationLoading(false)
      }
    }

    getUserLocation()
  }, [])

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  const cardVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 px-4 py-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div 
          className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
          animate={{ rotate: selectedOption ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-2xl font-bold text-white">FG</span>
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">FairGo</h1>
        <p className="text-gray-600 text-lg">Your ride, your way</p>
      </div>

      {/* Location Status */}
      <motion.div 
        className="bg-white rounded-xl p-4 mb-6 shadow-sm border"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            {locationLoading ? (
              <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Current Location</p>
            <p className="text-sm text-gray-600">{currentLocation}</p>
          </div>
          <div className="text-green-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* Main Action Cards */}
      <div className="space-y-4 mb-8">
        
        {/* Book by Call - Primary Option */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          transition={{ delay: 0.3 }}
        >
          <Card 
            className={`cursor-pointer transition-all duration-300 ${
              selectedOption === 'call' 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => {
              setSelectedOption('call')
              setTimeout(onBookByCall, 300)
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Book by Call</h3>
                  <p className="text-gray-600 mb-2">Talk to our AI assistant</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-green-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>30 seconds</span>
                    </div>
                    <div className="flex items-center text-yellow-600">
                      <Star className="w-4 h-4 mr-1" />
                      <span>4.9 rating</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </div>
              
              {/* Features highlight */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>🎯 Smart booking</span>
                  <span>🗣️ Voice powered</span>
                  <span>⚡ Instant response</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Book Online - Secondary Option */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          transition={{ delay: 0.4 }}
        >
          <Card 
            className={`cursor-pointer transition-all duration-300 ${
              selectedOption === 'online' 
                ? 'ring-2 ring-green-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => {
              setSelectedOption('online')
              setTimeout(onBookOnline, 300)
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <Map className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Book Online</h3>
                  <p className="text-gray-600 mb-2">Use traditional map interface</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-blue-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>Choose on map</span>
                    </div>
                    <div className="flex items-center text-purple-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>2-3 minutes</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </div>

              {/* Features highlight */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>📍 Pin location</span>
                  <span>🗺️ Route preview</span>
                  <span>💳 Easy payment</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <motion.div 
        className="bg-white rounded-xl p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h4 className="font-semibold text-gray-900 mb-3">Why choose FairGo?</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">2M+</div>
            <div className="text-xs text-gray-600">Happy rides</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">4.9</div>
            <div className="text-xs text-gray-600">User rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">24/7</div>
            <div className="text-xs text-gray-600">Available</div>
          </div>
        </div>
      </motion.div>

      {/* Safety Banner */}
      <motion.div 
        className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-4 text-white text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Shield className="w-5 h-5" />
          <span className="font-semibold">Safe & Secure</span>
        </div>
        <p className="text-sm opacity-90">
          Real-time tracking, verified drivers, and 24/7 support
        </p>
      </motion.div>
    </motion.div>
  )
}