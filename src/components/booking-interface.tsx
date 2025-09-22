'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CallToBookButton } from './call-to-book-button'
import { MapPin, Navigation, Clock, IndianRupee, Loader2, MapPinIcon, Car } from 'lucide-react'
import { useCreateBookingMutation, useNearbyDriversQuery } from '@/lib/queries'
import { useAuth, useBookings, useNotifications } from '@/lib/store'
import { useUserWebSocket } from '@/lib/websocket'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface BookingInterfaceProps {
  onBookRide?: (bookingData: BookingData) => void
}

interface BookingData {
  pickupLocation: string
  dropLocation: string
  vehicleType: string
  estimatedPrice: number
}

export function BookingInterface({ onBookRide }: BookingInterfaceProps) {
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropLocation, setDropLocation] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  const { user, isAuthenticated } = useAuth()
  const { activeBooking } = useBookings()
  const { isConnected } = useUserWebSocket()
  
  const createBookingMutation = useCreateBookingMutation()
  const { data: nearbyDrivers, isLoading: loadingDrivers } = useNearbyDriversQuery(pickupCoords)

  const vehicleTypes = [
    { value: 'AUTO_RICKSHAW', label: 'Auto Rickshaw', basePrice: 50, icon: '🛺' },
    { value: 'CAR_ECONOMY', label: 'Economy Car', basePrice: 100, icon: '🚗' },
    { value: 'CAR_PREMIUM', label: 'Premium Car', basePrice: 150, icon: '🚙' },
    { value: 'CAR_LUXURY', label: 'Luxury Car', basePrice: 250, icon: '🚘' },
    { value: 'SUV', label: 'SUV', basePrice: 200, icon: '🚐' },
    { value: 'BIKE', label: 'Bike', basePrice: 40, icon: '🏍️' }
  ]

  // Get current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setCurrentLocation(coords)
          setPickupCoords(coords)
          
          // Reverse geocode to get address
          reverseGeocode(coords).then(address => {
            if (address) {
              setPickupLocation(address)
            }
          })
        },
        (error) => {
          console.warn('Failed to get location:', error)
          toast.error('Unable to get your current location. Please enter pickup address manually.')
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    }
  }, [])

  // Reverse geocode coordinates to address
  const reverseGeocode = async (coords: { lat: number; lng: number }): Promise<string | null> => {
    try {
      // In production, use a proper geocoding service like Google Maps or OpenStreetMap
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${coords.lat}+${coords.lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
      )
      const data = await response.json()
      return data.results?.[0]?.formatted || null
    } catch (error) {
      console.warn('Geocoding failed:', error)
      return null
    }
  }

  // Geocode address to coordinates
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
      )
      const data = await response.json()
      const result = data.results?.[0]
      return result ? { lat: result.geometry.lat, lng: result.geometry.lng } : null
    } catch (error) {
      console.warn('Address geocoding failed:', error)
      return null
    }
  }

  const calculatePrice = async () => {
    if (!pickupLocation || !dropLocation || !vehicleType) return

    setIsCalculating(true)
    
    try {
      // Geocode drop location if not already done
      let dropLocation_coords = dropCoords
      if (!dropLocation_coords && dropLocation) {
        dropLocation_coords = await geocodeAddress(dropLocation)
        setDropCoords(dropLocation_coords)
      }

      // Calculate distance if we have both coordinates
      if (pickupCoords && dropLocation_coords) {
        const distance = calculateDistance(pickupCoords, dropLocation_coords)
        const selectedVehicle = vehicleTypes.find(v => v.value === vehicleType)
        
        if (selectedVehicle) {
          const price = Math.round(selectedVehicle.basePrice + (distance * 12)) // ₹12 per km
          setEstimatedPrice(price)
        }
      } else {
        // Fallback to estimated pricing
        const selectedVehicle = vehicleTypes.find(v => v.value === vehicleType)
        if (selectedVehicle) {
          const price = selectedVehicle.basePrice + Math.round(Math.random() * 100 + 50)
          setEstimatedPrice(price)
        }
      }
    } catch (error) {
      console.error('Price calculation failed:', error)
      toast.error('Failed to calculate price. Please try again.')
    } finally {
      setIsCalculating(false)
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Auto-calculate price when all fields are filled
  useEffect(() => {
    if (pickupLocation && dropLocation && vehicleType && !isCalculating) {
      calculatePrice()
    }
  }, [pickupLocation, dropLocation, vehicleType])

  const handleBookRide = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book a ride')
      return
    }

    if (!pickupLocation || !dropLocation || !vehicleType || !estimatedPrice) {
      toast.error('Please fill in all booking details')
      return
    }

    try {
      const bookingData = {
        pickupLocation,
        dropLocation,
        pickupCoords: pickupCoords || undefined,
        dropCoords: dropCoords || undefined,
        vehicleType,
        estimatedPrice,
        userId: user!.id,
      }

      const booking = await createBookingMutation.mutateAsync(bookingData)
      
      if (onBookRide) {
        onBookRide({
          pickupLocation,
          dropLocation,
          vehicleType,
          estimatedPrice,
        })
      }

      // Reset form
      setDropLocation('')
      setDropCoords(null)
      setVehicleType('')
      setEstimatedPrice(null)
      
      toast.success('Ride booked successfully! Finding a driver...')
    } catch (error) {
      console.error('Booking failed:', error)
    }
  }

  const useCurrentLocationForPickup = () => {
    if (currentLocation) {
      setPickupCoords(currentLocation)
      reverseGeocode(currentLocation).then(address => {
        if (address) {
          setPickupLocation(address)
        }
      })
    } else {
      toast.error('Current location not available')
    }
  }

  // Show active booking status if user has one
  if (activeBooking && activeBooking.status !== 'COMPLETED' && activeBooking.status !== 'CANCELLED') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Active Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPinIcon className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">From:</span>
              <span className="font-medium">{activeBooking.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPinIcon className="h-4 w-4 text-red-500" />
              <span className="text-gray-600">To:</span>
              <span className="font-medium">{activeBooking.dropLocation}</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Status:</span>
            <Badge variant={
              activeBooking.status === 'REQUESTED' ? 'secondary' :
              activeBooking.status === 'ACCEPTED' ? 'default' :
              activeBooking.status === 'IN_PROGRESS' ? 'destructive' :
              'outline'
            }>
              {activeBooking.status.replace('_', ' ').toLowerCase()}
            </Badge>
          </div>
          
          {activeBooking.driver && (
            <div className="text-sm">
              <span className="text-gray-600">Driver:</span>
              <span className="font-medium ml-1">{activeBooking.driver.userId}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Estimated Price:</span>
            <span className="font-semibold text-lg">₹{activeBooking.estimatedPrice}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Book Your Ride
            {!isConnected && (
              <Badge variant="outline" className="text-xs">
                Offline Mode
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pickup">Pickup Location</Label>
            <div className="flex gap-2">
              <Input
                id="pickup"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Enter pickup location"
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={useCurrentLocationForPickup}
                title="Use current location"
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="drop">Drop Location</Label>
            <Input
              id="drop"
              value={dropLocation}
              onChange={(e) => setDropLocation(e.target.value)}
              placeholder="Enter destination"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle Type</Label>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                      <span className="text-sm text-gray-500">
                        (₹{type.basePrice}+ base)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nearby Drivers Info */}
          {nearbyDrivers && nearbyDrivers.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-green-800">
                <Car className="h-4 w-4" />
                <span className="font-medium">
                  {nearbyDrivers.length} driver{nearbyDrivers.length > 1 ? 's' : ''} nearby
                </span>
              </div>
            </div>
          )}

          {loadingDrivers && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Finding nearby drivers...</span>
              </div>
            </div>
          )}

          {/* Price Estimation */}
          {estimatedPrice && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  <span className="text-sm font-medium">Estimated Price</span>
                </div>
                <span className="text-lg font-semibold text-green-600">
                  ₹{estimatedPrice}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>Final price may vary based on actual distance</span>
              </div>
            </div>
          )}

          {isCalculating && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculating price...
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleBookRide}
              disabled={!pickupLocation || !dropLocation || !vehicleType || createBookingMutation.isPending || !isAuthenticated}
              className="w-full"
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking Ride...
                </>
              ) : (
                'Book Ride Now'
              )}
            </Button>

            {!isAuthenticated && (
              <p className="text-sm text-center text-gray-500">
                Please sign in to book a ride
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Booking Alternative */}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-lg">
            Or Book with Voice Command
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <CallToBookButton />
            <p className="text-sm text-gray-600 mt-3">
              Say something like: "Book a ride from Kochi to Ernakulam"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}