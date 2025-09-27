'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Navigation, Clock, Route, MapPin, Car, Phone } from 'lucide-react'

interface NavigationPanelProps {
  bookingId: string
  driverId: string
  onClose?: () => void
  className?: string
}

interface DirectionStep {
  instruction: string
  distance: string
  duration: string
  maneuver?: string
}

interface RouteInfo {
  totalDistance: string
  totalDuration: string
  steps: DirectionStep[]
  eta: string
}

export default function NavigationPanel({
  bookingId,
  driverId,
  onClose,
  className
}: NavigationPanelProps) {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    fetchNavigationDirections()
    // Set up polling for real-time updates
    const interval = setInterval(fetchNavigationDirections, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [bookingId])

  const fetchNavigationDirections = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/navigation/directions/${bookingId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch navigation directions')
      }
      const data = await response.json()
      setRouteInfo(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load navigation')
    } finally {
      setIsLoading(false)
    }
  }

  const updateDriverLocation = async (lat: number, lng: number) => {
    try {
      await fetch('/api/navigation/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          bookingId,
          latitude: lat,
          longitude: lng
        })
      })
    } catch (err) {
      console.error('Failed to update location:', err)
    }
  }

  const getManeuverIcon = (maneuver?: string) => {
    switch (maneuver) {
      case 'turn-left':
        return '⬅️'
      case 'turn-right':
        return '➡️'
      case 'straight':
        return '⬆️'
      case 'uturn-left':
      case 'uturn-right':
        return '↩️'
      default:
        return '📍'
    }
  }

  if (isLoading && !routeInfo) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading navigation...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <Navigation className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button
              onClick={fetchNavigationDirections}
              variant="outline"
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!routeInfo) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Navigation className="h-8 w-8 mx-auto mb-2" />
            <p>No navigation data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Turn-by-Turn Directions
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Route Summary */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-center">
            <Route className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <p className="text-sm font-medium">{routeInfo.totalDistance}</p>
            <p className="text-xs text-gray-600">Distance</p>
          </div>
          <div className="text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <p className="text-sm font-medium">{routeInfo.totalDuration}</p>
            <p className="text-xs text-gray-600">Duration</p>
          </div>
          <div className="text-center">
            <Car className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <p className="text-sm font-medium">{routeInfo.eta}</p>
            <p className="text-xs text-gray-600">ETA</p>
          </div>
        </div>

        {/* Current Step Highlight */}
        {routeInfo.steps.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getManeuverIcon(routeInfo.steps[currentStep]?.maneuver)}</span>
              <div className="flex-1">
                <p className="font-medium text-green-800">
                  {routeInfo.steps[currentStep]?.instruction}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {routeInfo.steps[currentStep]?.distance}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {routeInfo.steps[currentStep]?.duration}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Steps */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {routeInfo.steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-2 rounded cursor-pointer transition-colors ${
                  index === currentStep
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <span className="text-lg mt-0.5">{getManeuverIcon(step.maneuver)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${index === currentStep ? 'font-medium' : ''}`}>
                    {step.instruction}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{step.distance}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{step.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={fetchNavigationDirections}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Refresh Route
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              // Call rider functionality could be implemented here
              console.log('Calling rider...')
            }}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call Rider
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}