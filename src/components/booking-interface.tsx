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
import { MapView, LocationSearch, RouteDisplay } from './navigation'
import { BidList } from './bidding'

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
  const [showMap, setShowMap] = useState(false)
  const [routeData, setRouteData] = useState<any>(null)
  const [isBiddingMode, setIsBiddingMode] = useState(false)
  const [biddingDuration, setBiddingDuration] = useState(300) // 5 minutes default
  const [createdBidBooking, setCreatedBidBooking] = useState<any>(null)

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

      // Calculate distance and fetch route if we have both coordinates
      if (pickupCoords && dropLocation_coords) {
        const distance = calculateDistance(pickupCoords, dropLocation_coords)
        const selectedVehicle = vehicleTypes.find(v => v.value === vehicleType)
        
        if (selectedVehicle) {
          const price = Math.round(selectedVehicle.basePrice + (distance * 12)) // ₹12 per km
          setEstimatedPrice(price)
        }

        // Fetch route data for map display
        try {
          const routeResponse = await fetch('/api/navigation/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              origin: pickupCoords,
              destination: dropLocation_coords
            })
          })

          if (routeResponse.ok) {
            const routeData = await routeResponse.json()
            setRouteData(routeData)
          }
        } catch (routeError) {
          console.warn('Failed to fetch route data:', routeError)
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

    if (!pickupLocation || !dropLocation || !vehicleType) {
      toast.error('Please fill in all booking details')
      return
    }

    try {
      if (isBiddingMode) {
        // Create bidding-enabled booking
        const response = await fetch('/api/bookings/create-bid-ride', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pickupLocation,
            dropLocation,
            pickupLat: pickupCoords?.lat,
            pickupLng: pickupCoords?.lng,
            dropLat: dropCoords?.lat,
            dropLng: dropCoords?.lng,
            vehicleType,
            estimatedPrice: estimatedPrice || 0,
            biddingDuration
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create bidding booking')
        }

        const data = await response.json()
        setCreatedBidBooking(data.booking)

        toast.success('Bidding booking created! Waiting for driver bids...')
      } else {
        // Regular booking
        if (!estimatedPrice) {
          toast.error('Please wait for price calculation')
          return
        }

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

        toast.success('Ride booked successfully! Finding a driver...')
      }

      // Reset form
      setDropLocation('')
      setDropCoords(null)
      setVehicleType('')
      setEstimatedPrice(null)
      setIsBiddingMode(false)

    } catch (error) {
      console.error('Booking failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to book ride')
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
            <div className="space-y-2">
              <LocationSearch
                placeholder="Enter pickup location or search..."
                onPlaceSelect={(place) => {
                  setPickupLocation(place.address)
                  setPickupCoords({ lat: place.lat, lng: place.lng })
                }}
                defaultValue={pickupLocation}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={useCurrentLocationForPickup}
                className="w-full"
                type="button"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Use Current Location
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="drop">Drop Location</Label>
            <LocationSearch
              placeholder="Enter destination or search..."
              onPlaceSelect={(place) => {
                setDropLocation(place.address)
                setDropCoords({ lat: place.lat, lng: place.lng })
              }}
              defaultValue={dropLocation}
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

          {/* Bidding Mode Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bidding-mode">Enable Competitive Bidding</Label>
              <Button
                variant={isBiddingMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsBiddingMode(!isBiddingMode)}
                type="button"
              >
                {isBiddingMode ? 'Bidding Enabled' : 'Enable Bidding'}
              </Button>
            </div>
            {isBiddingMode && (
              <p className="text-sm text-gray-600">
                Multiple drivers will bid for your ride. You can choose the best offer within the time limit.
              </p>
            )}
          </div>

          {isBiddingMode && (
            <div className="space-y-2">
              <Label htmlFor="bidding-duration">Bidding Duration</Label>
              <Select value={biddingDuration.toString()} onValueChange={(value) => setBiddingDuration(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="180">3 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Map View for Route Visualization */}
          {pickupCoords && dropCoords && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Route Preview</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                >
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
              </div>

              {showMap && (
                <div className="space-y-2">
                  <MapView
                    center={{
                      lat: (pickupCoords.lat + dropCoords.lat) / 2,
                      lng: (pickupCoords.lng + dropCoords.lng) / 2
                    }}
                    zoom={12}
                    markers={[
                      {
                        position: pickupCoords,
                        title: 'Pickup Location'
                      },
                      {
                        position: dropCoords,
                        title: 'Drop Location'
                      }
                    ]}
                    polylines={routeData ? [{
                      path: routeData.polyline,
                      strokeColor: '#3b82f6',
                      strokeWeight: 4
                    }] : []}
                    className="w-full h-48 rounded-lg border"
                  />

                  {routeData && (
                    <RouteDisplay
                      origin={{ lat: pickupCoords!.lat, lng: pickupCoords!.lng, address: pickupLocation }}
                      destination={{ lat: dropCoords!.lat, lng: dropCoords!.lng, address: dropLocation }}
                      className="mt-2"
                    />
                  )}
                </div>
              )}
            </div>
          )}

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

      {/* Bidding Booking Status */}
      {createdBidBooking && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Waiting for Driver Bids
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Your booking is now open for competitive bidding. Drivers will submit their offers within the time limit.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="text-sm">
                  <p className="font-medium">Booking Details:</p>
                  <p>From: {createdBidBooking.pickupLocation}</p>
                  {createdBidBooking.dropLocation && <p>To: {createdBidBooking.dropLocation}</p>}
                  <p>Vehicle: {createdBidBooking.vehicleType.replace('_', ' ')}</p>
                  <p>Base Price: ₹{createdBidBooking.estimatedPrice}</p>
                </div>
              </div>

              <BidList
                bookingId={createdBidBooking.id}
                onAcceptBid={(bidId) => {
                  console.log('Accepted bid:', bidId)
                  setCreatedBidBooking(null) // Hide the bidding interface
                }}
              />

              <Button
                variant="outline"
                onClick={() => setCreatedBidBooking(null)}
                className="mt-4"
              >
                Cancel Bidding
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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