'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Car, 
  Truck, 
  Bike,
  Users,
  Package,
  Clock,
  MapPin,
  Star,
  Zap,
  Shield,
  Loader2
} from 'lucide-react'

interface ServiceSelectionProps {
  onBack: () => void
  onServiceSelect: (service: ServiceType) => void
}

interface ServiceType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  estimatedTime: string
  basePrice: string
  capacity: string
  features: string[]
  popular?: boolean
  available: boolean
  realTimePrice?: string
  realTimeETA?: string
}

export function ServiceSelection({ onBack, onServiceSelect }: ServiceSelectionProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null)

  // Get user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          // Use default Bangalore location
          setCurrentLocation({ lat: 12.9716, lng: 77.5946 })
        }
      )
    } else {
      // Use default Bangalore location
      setCurrentLocation({ lat: 12.9716, lng: 77.5946 })
    }
  }, [])

  // Fetch real-time service availability and pricing
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        
        // Default services with icons
        const defaultServices: ServiceType[] = [
          {
            id: 'fairgo-go',
            name: 'FairGo Go',
            description: 'Quick rides for 1-4 people',
            icon: <Car className="w-8 h-8" />,
            estimatedTime: '3-5 min',
            basePrice: '₹80',
            capacity: '1-4 people',
            features: ['AC available', 'GPS tracking', 'Digital payment'],
            popular: true,
            available: true
          },
          {
            id: 'fairgo-share',
            name: 'FairGo Share',
            description: 'Shared rides, lower cost',
            icon: <Users className="w-8 h-8" />,
            estimatedTime: '5-8 min',
            basePrice: '₹45',
            capacity: '1-3 people',
            features: ['Shared ride', 'Eco-friendly', 'Budget option'],
            available: true
          },
          {
            id: 'fairgo-xl',
            name: 'FairGo XL',
            description: 'Spacious rides for groups',
            icon: <Truck className="w-8 h-8" />,
            estimatedTime: '4-7 min',
            basePrice: '₹120',
            capacity: '4-8 people',
            features: ['Large vehicle', 'Extra space', 'Group friendly'],
            available: true
          },
          {
            id: 'fairgo-moto',
            name: 'FairGo Moto',
            description: 'Quick bike rides',
            icon: <Bike className="w-8 h-8" />,
            estimatedTime: '2-4 min',
            basePrice: '₹35',
            capacity: '1 person',
            features: ['Fastest option', 'Traffic friendly', 'Helmet included'],
            available: false
          },
          {
            id: 'fairgo-delivery',
            name: 'FairGo Delivery',
            description: 'Package & food delivery',
            icon: <Package className="w-8 h-8" />,
            estimatedTime: '15-30 min',
            basePrice: '₹25',
            capacity: 'Up to 20kg',
            features: ['Same day delivery', 'Package tracking', 'Insurance'],
            available: true
          }
        ]

        // If location is available, fetch real-time data
        if (currentLocation) {
          try {
            const response = await fetch('/api/drivers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                radius: 10 // 10km radius
              })
            })

            if (response.ok) {
              const driversData = await response.json()
              
              // Update service availability based on driver data
              const updatedServices = defaultServices.map(service => {
                const availableDrivers = driversData.drivers?.filter((driver: any) => 
                  driver.vehicleType?.toLowerCase().includes(service.id.split('-')[1]) ||
                  service.id === 'fairgo-go' // Default service always available
                ) || []
                
                return {
                  ...service,
                  available: availableDrivers.length > 0 || service.id === 'fairgo-go',
                  realTimeETA: availableDrivers.length > 0 ? 
                    `${Math.min(3, Math.max(1, Math.floor(availableDrivers[0]?.distanceToUser / 10)))} min` : 
                    service.estimatedTime
                }
              })
              
              setServices(updatedServices)
            } else {
              setServices(defaultServices)
            }
          } catch (apiError) {
            console.error('API error:', apiError)
            setServices(defaultServices)
          }
        } else {
          setServices(defaultServices)
        }
      } catch (error) {
        console.error('Error fetching services:', error)
        // Fallback to default services
        setServices([])
      } finally {
        setLoading(false)
      }
    }

    if (currentLocation) {
      fetchServices()
    }
  }, [currentLocation])

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -2, scale: 1.02 },
    tap: { scale: 0.98 }
  }

  const handleServiceSelect = (service: ServiceType) => {
    if (!service.available) return
    
    setSelectedService(service.id)
    setTimeout(() => onServiceSelect(service), 300)
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
          <h1 className="text-xl font-bold text-gray-900">Choose Service</h1>
          <p className="text-sm text-gray-600">Select your ride type</p>
        </div>
        
        <div className="w-16" /> {/* Spacer for center alignment */}
      </div>

      {/* Current Location */}
      <motion.div 
        className="bg-white rounded-xl p-4 mb-6 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <p className="font-medium text-gray-900">Pickup Location</p>
            <p className="text-sm text-gray-600">
              {currentLocation ? 'Using current location' : 'Getting location...'}
            </p>
          </div>
          <div className="ml-auto">
            {!currentLocation ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </motion.div>

      {/* Services Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Available</h3>
          <p className="text-gray-600">Unable to load ride options. Please try again.</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
        <AnimatePresence>
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover={service.available ? "hover" : undefined}
              whileTap={service.available ? "tap" : undefined}
              transition={{ delay: index * 0.1 }}
              className={`relative ${!service.available ? 'opacity-60' : ''}`}
            >
              <Card 
                className={`cursor-pointer transition-all duration-300 ${
                  selectedService === service.id 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : service.available 
                      ? 'hover:shadow-md' 
                      : 'cursor-not-allowed'
                } ${!service.available ? 'bg-gray-50' : ''}`}
                onClick={() => handleServiceSelect(service)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start space-x-4">
                    {/* Service Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      service.available 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {service.icon}
                    </div>

                    {/* Service Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                        {service.popular && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">
                            Popular
                          </Badge>
                        )}
                        {!service.available && (
                          <Badge variant="secondary" className="text-xs">
                            Unavailable
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                      
                      {/* Service Stats */}
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{service.realTimeETA || service.estimatedTime}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{service.capacity}</span>
                        </div>
                        {service.realTimePrice && (
                          <div className="flex items-center text-xs text-green-600">
                            <Zap className="w-3 h-3 mr-1" />
                            <span>Live pricing</span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {service.features.slice(0, 2).map((feature, idx) => (
                          <span 
                            key={idx} 
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                        {service.features.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{service.features.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">{service.basePrice}</div>
                      <div className="text-xs text-gray-500">starting from</div>
                      {service.available && (
                        <div className="mt-2">
                          <div className="flex items-center text-xs text-green-600">
                            <Zap className="w-3 h-3 mr-1" />
                            <span>Available</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        </div>
      )}

      {/* Bottom Info */}
      <motion.div 
        className="mt-6 bg-white rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-900">All rides include</span>
        </div>
        <div className="flex justify-center space-x-6 text-xs text-gray-600">
          <span>• Real-time tracking</span>
          <span>• 24/7 support</span>
          <span>• Safe drivers</span>
        </div>
      </motion.div>

      {/* Loading Animation */}
      <AnimatePresence>
        {selectedService && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl p-6 max-w-sm mx-4 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-8 h-8 text-blue-600" />
                </motion.div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connecting to AI Assistant
              </h3>
              <p className="text-gray-600 text-sm">
                Please wait while we set up your booking experience...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}