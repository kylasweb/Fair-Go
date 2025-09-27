'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Clock, Car, Wifi, WifiOff } from 'lucide-react'

interface DriverLocationTrackerProps {
  driverId: string
  bookingId?: string
  onLocationUpdate?: (location: { lat: number; lng: number; timestamp: Date }) => void
  className?: string
}

interface DriverStatus {
  isOnline: boolean
  currentLocation: {
    lat: number
    lng: number
    timestamp: Date
  } | null
  heading: number | null
  speed: number | null
  eta: string | null
  distanceToPickup: string | null
  lastUpdate: Date | null
}

export default function DriverLocationTracker({
  driverId,
  bookingId,
  onLocationUpdate,
  className
}: DriverLocationTrackerProps) {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>({
    isOnline: false,
    currentLocation: null,
    heading: null,
    speed: null,
    eta: null,
    distanceToPickup: null,
    lastUpdate: null
  })
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchDriverStatus()
    // Poll for driver status updates
    intervalRef.current = setInterval(fetchDriverStatus, 10000) // Every 10 seconds

    return () => {
      stopTracking()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [driverId, bookingId])

  const fetchDriverStatus = async () => {
    try {
      const response = await fetch(`/api/drivers/navigation-status/${driverId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch driver status')
      }
      const data = await response.json()
      setDriverStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load driver status')
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setIsTracking(true)
    setError(null)

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, heading, speed } = position.coords

        try {
          await updateLocation(latitude, longitude, heading, speed)
          onLocationUpdate?.({
            lat: latitude,
            lng: longitude,
            timestamp: new Date()
          })
        } catch (err) {
          console.error('Failed to update location:', err)
        }
      },
      (err) => {
        setError(`Location tracking error: ${err.message}`)
        setIsTracking(false)
      },
      options
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }

  const updateLocation = async (
    lat: number,
    lng: number,
    heading: number | null,
    speed: number | null
  ) => {
    try {
      const response = await fetch('/api/navigation/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          bookingId,
          latitude: lat,
          longitude: lng,
          heading,
          speed
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update location')
      }

      // Update local status
      setDriverStatus(prev => ({
        ...prev,
        currentLocation: {
          lat,
          lng,
          timestamp: new Date()
        },
        heading,
        speed,
        lastUpdate: new Date()
      }))
    } catch (err) {
      console.error('Location update failed:', err)
      throw err
    }
  }

  const formatLastUpdate = (timestamp: Date | null) => {
    if (!timestamp) return 'Never'
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    if (minutes < 60) return `${minutes} minutes ago`

    const hours = Math.floor(minutes / 60)
    if (hours === 1) return '1 hour ago'
    return `${hours} hours ago`
  }

  const formatSpeed = (speed: number | null) => {
    if (speed === null) return 'N/A'
    // Convert m/s to km/h
    const kmh = Math.round(speed * 3.6)
    return `${kmh} km/h`
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Driver Location
          </div>
          <Badge variant={driverStatus.isOnline ? "default" : "secondary"}>
            {driverStatus.isOnline ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Location Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Current Location</span>
            </div>
            {driverStatus.currentLocation ? (
              <div className="text-xs text-gray-600">
                <p>{driverStatus.currentLocation.lat.toFixed(6)}</p>
                <p>{driverStatus.currentLocation.lng.toFixed(6)}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Not available</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Last Update</span>
            </div>
            <p className="text-xs text-gray-600">
              {formatLastUpdate(driverStatus.lastUpdate)}
            </p>
          </div>
        </div>

        {/* Speed and Heading */}
        {(driverStatus.speed !== null || driverStatus.heading !== null) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Speed</span>
              <p className="text-sm text-gray-600">
                {formatSpeed(driverStatus.speed)}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Heading</span>
              <p className="text-sm text-gray-600">
                {driverStatus.heading !== null
                  ? `${Math.round(driverStatus.heading)}°`
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        )}

        {/* ETA and Distance */}
        {bookingId && (driverStatus.eta || driverStatus.distanceToPickup) && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">ETA to Pickup</span>
                </div>
                <p className="text-sm text-blue-800">
                  {driverStatus.eta || 'Calculating...'}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Distance</span>
                </div>
                <p className="text-sm text-blue-800">
                  {driverStatus.distanceToPickup || 'Calculating...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Controls */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button
              onClick={startTracking}
              className="flex-1"
              disabled={!driverStatus.isOnline}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          ) : (
            <Button
              onClick={stopTracking}
              variant="outline"
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Stop Tracking
            </Button>
          )}

          <Button
            onClick={fetchDriverStatus}
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
        </div>

        {isTracking && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Tracking active
          </div>
        )}
      </CardContent>
    </Card>
  )
}