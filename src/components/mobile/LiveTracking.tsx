'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Navigation, 
  Phone, 
  MessageSquare,
  AlertTriangle,
  Clock,
  Car,
  Star,
  CheckCircle2,
  Share2,
  Home,
  MoreVertical,
  User,
  Shield,
  Zap
} from 'lucide-react'

interface LiveTrackingProps {
  onComplete: () => void
  bookingId?: string
}

type TripStatus = 'driver_coming' | 'driver_arrived' | 'trip_started' | 'trip_completed'

interface LocationUpdate {
  lat: number
  lng: number
  timestamp: Date
  status: string
}

interface BookingData {
  id: string
  from: string
  to: string
  driverName: string
  driverRating: number
  vehicleNumber: string
  driverPhone: string
  estimatedFare: string
  finalFare?: string
  distance: string
  estimatedArrival?: string
  estimatedDuration?: string
  actualDuration?: string
  status: TripStatus
  currentLocation?: {
    lat: number
    lng: number
  }
}

export function LiveTracking({ onComplete, bookingId }: LiveTrackingProps) {
  const [tripStatus, setTripStatus] = useState<TripStatus>('driver_coming')
  const [eta, setEta] = useState(240) // 4 minutes in seconds
  const [tripProgress, setTripProgress] = useState(0) // 0-100%
  const [showSOS, setShowSOS] = useState(false)
  const [driverLocation, setDriverLocation] = useState({ lat: 12.9716, lng: 77.5946 })
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([])
  
  // Fetch booking data
  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) {
        // Use mock data if no booking ID
        setBookingData({
          id: `FG${Date.now().toString().slice(-6)}`,
          from: 'Current Location',
          to: 'Indiranagar Metro Station',
          driverName: 'Raj Kumar',
          driverRating: 4.8,
          vehicleNumber: 'KA 05 MN 1234',
          driverPhone: '+91 98765 43210',
          estimatedFare: '₹95',
          distance: '8.2 km',
          status: 'driver_coming',
          currentLocation: { lat: 12.9716, lng: 77.5946 }
        })
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/bookings/${bookingId}`)
        if (response.ok) {
          const data = await response.json()
          setBookingData({
            id: data.id,
            from: data.pickupAddress,
            to: data.dropoffAddress,
            driverName: data.driver?.user?.name || 'Driver',
            driverRating: data.driver?.rating || 4.5,
            vehicleNumber: data.driver?.vehicleNumber || 'Unknown',
            driverPhone: data.driver?.user?.phone || '',
            estimatedFare: `₹${data.estimatedFare}`,
            distance: `${data.distance} km`,
            status: data.status as TripStatus,
            currentLocation: data.driver?.currentLocation
          })
          setTripStatus(data.status as TripStatus)
        } else {
          throw new Error('Failed to fetch booking')
        }
      } catch (error) {
        console.error('Error fetching booking:', error)
        // Use fallback data
        setBookingData({
          id: bookingId,
          from: 'Current Location',
          to: 'Destination',
          driverName: 'Driver',
          driverRating: 4.5,
          vehicleNumber: 'Loading...',
          driverPhone: '',
          estimatedFare: '₹--',
          distance: '-- km',
          status: 'driver_coming'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookingData()
  }, [bookingId])

  // Real-time location updates
  useEffect(() => {
    if (!bookingData || !bookingId) return

    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/bookings/${bookingId}/track`)
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'location_update') {
          setDriverLocation(data.location)
          setLocationUpdates(prev => [...prev, {
            lat: data.location.lat,
            lng: data.location.lng,
            timestamp: new Date(),
            status: data.status || 'moving'
          }])
        }
        
        if (data.type === 'status_update') {
          setTripStatus(data.status)
          if (data.eta) {
            setEta(data.eta)
          }
          if (data.progress !== undefined) {
            setTripProgress(data.progress)
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      ws.close()
    }
  }, [bookingData, bookingId])
  
  // Simulate trip progression
  useEffect(() => {
    const progressTimer = setInterval(() => {
      if (tripStatus === 'driver_coming') {
        setEta(prev => {
          if (prev <= 0) {
            setTripStatus('driver_arrived')
            return 0
          }
          return prev - 1
        })
      } else if (tripStatus === 'trip_started') {
        setTripProgress(prev => {
          if (prev >= 100) {
            setTripStatus('trip_completed')
            return 100
          }
          return prev + 1
        })
      }
    }, 1000)

    return () => clearInterval(progressTimer)
  }, [tripStatus])

  // Auto-complete handling
  useEffect(() => {
    if (tripStatus === 'trip_completed') {
      const timer = setTimeout(() => {
        onComplete()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [tripStatus, onComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusInfo = () => {
    switch (tripStatus) {
      case 'driver_coming':
        return {
          title: 'Driver is coming to you',
          subtitle: `Arriving in ${formatTime(eta)}`,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: <Car className="w-5 h-5" />
        }
      case 'driver_arrived':
        return {
          title: 'Driver has arrived',
          subtitle: 'Please get in the vehicle',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          icon: <MapPin className="w-5 h-5" />
        }
      case 'trip_started':
        return {
          title: 'Trip in progress',
          subtitle: `${tripProgress}% completed`,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: <Navigation className="w-5 h-5" />
        }
      case 'trip_completed':
        return {
          title: 'Trip completed!',
          subtitle: 'Thank you for riding with FairGo',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: <CheckCircle2 className="w-5 h-5" />
        }
    }
  }

  const statusInfo = getStatusInfo()

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Map Area Placeholder */}
      <div className="relative h-64 bg-gradient-to-br from-blue-200 to-green-200 overflow-hidden">
        {/* Animated Map Background */}
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.3) 2px, transparent 0), linear-gradient(to right, rgba(255,255,255,0.1), transparent)',
            backgroundSize: '50px 50px, 100% 100%'
          }}
        />
        
        {/* Driver Pin */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 360]
          }}
          transition={{ 
            scale: { duration: 2, repeat: Infinity },
            rotate: { duration: 10, repeat: Infinity, ease: "linear" }
          }}
        >
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <Car className="w-6 h-6 text-white" />
          </div>
        </motion.div>

        {/* Your Location Pin */}
        <motion.div 
          className="absolute bottom-8 right-8"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <MapPin className="w-4 h-4 text-white" />
          </div>
        </motion.div>

        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              className="bg-white/90 backdrop-blur-sm"
              onClick={() => window.history.back()}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="bg-white/90 backdrop-blur-sm"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* SOS Button */}
        <motion.div 
          className="absolute top-4 right-4"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            onClick={() => setShowSOS(true)}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 p-0 shadow-lg"
          >
            <AlertTriangle className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>

      {/* Status Card */}
      <motion.div 
        className="px-4 -mt-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-xl">
          <CardContent className="p-6">
            <div className={`flex items-center space-x-3 p-4 rounded-xl ${statusInfo.bgColor} mb-4`}>
              <div className={statusInfo.color}>
                {statusInfo.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${statusInfo.color}`}>
                  {statusInfo.title}
                </h3>
                <p className="text-sm text-gray-600">{statusInfo.subtitle}</p>
              </div>
              {tripStatus === 'trip_started' && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{tripProgress}%</div>
                </div>
              )}
            </div>

            {/* Progress Bar for Trip */}
            {tripStatus === 'trip_started' && (
              <div className="mb-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-green-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${tripProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="flex items-center space-x-2"
                onClick={() => window.open(`tel:${bookingData?.driverPhone || '+919876543210'}`)}
              >
                <Phone className="w-4 h-4" />
                <span>Call Driver</span>
              </Button>
              
              <Button 
                variant="outline"
                className="flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Driver Info */}
      <motion.div 
        className="px-4 mt-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {bookingData?.driverName || 'Loading...'}
                </h4>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {bookingData?.driverRating || '--'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {bookingData?.vehicleNumber || 'Loading...'}
                  </span>
                </div>
              </div>
              
              <Badge className="bg-green-100 text-green-700">
                {tripStatus === 'driver_coming' ? 'Coming' : 
                 tripStatus === 'driver_arrived' ? 'Arrived' :
                 tripStatus === 'trip_started' ? 'Driving' : 'Completed'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trip Details */}
      <motion.div 
        className="px-4 mt-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Trip Route</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">From</p>
                  <p className="font-medium text-gray-900">
                    {bookingData?.from || 'Loading...'}
                  </p>
                </div>
              </div>
              
              <div className="ml-4 border-l-2 border-dashed border-gray-200 h-4"></div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">To</p>
                  <p className="font-medium text-gray-900">
                    {bookingData?.to || 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-600">
                Estimated fare: <strong>{bookingData?.estimatedFare || '--'}</strong>
              </span>
              <span className="text-gray-600">
                Distance: <strong>{bookingData?.distance || '--'}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Safety Features */}
      <motion.div 
        className="px-4 mt-4 mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Safety Features Active</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-700">Live GPS tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-700">Emergency SOS</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-700">Trip sharing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-700">24/7 support</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Real-time Status Updates */}
      {tripStatus !== 'trip_completed' && (
        <motion.div 
          className="px-4 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">
                  Live tracking active
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Your trip is being monitored in real-time
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* SOS Modal */}
      <AnimatePresence>
        {showSOS && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency SOS</h3>
                <p className="text-gray-600 mb-6">
                  Are you in an emergency situation? This will immediately contact authorities and your emergency contacts.
                </p>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => {
                      // Handle SOS activation
                      setShowSOS(false)
                    }}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Activate Emergency SOS
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowSOS(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trip Completed Overlay */}
      <AnimatePresence>
        {tripStatus === 'trip_completed' && (
          <motion.div 
            className="fixed inset-0 bg-gradient-to-br from-green-500/90 to-blue-600/90 flex items-center justify-center z-40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="text-center text-white"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 className="w-24 h-24 mx-auto mb-4" />
              </motion.div>
              
              <h2 className="text-3xl font-bold mb-2">Trip Completed!</h2>
              <p className="text-xl opacity-90 mb-6">Thank you for riding with FairGo</p>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="opacity-75">Total Fare</p>
                    <p className="text-2xl font-bold">
                      {bookingData?.finalFare || bookingData?.estimatedFare || '₹--'}
                    </p>
                  </div>
                  <div>
                    <p className="opacity-75">Trip Time</p>
                    <p className="text-2xl font-bold">
                      {bookingData?.actualDuration || '--m'}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm opacity-75">
                Redirecting to receipt and feedback...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}