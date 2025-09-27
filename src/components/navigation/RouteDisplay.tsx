'use client'

import { useEffect, useState } from 'react'
import MapView from './MapView'

interface RouteDisplayProps {
  origin: { lat: number; lng: number; address?: string }
  destination: { lat: number; lng: number; address?: string }
  currentLocation?: { lat: number; lng: number }
  className?: string
  showControls?: boolean
}

interface RouteData {
  distance: { text: string; value: number }
  duration: { text: string; value: number }
  polyline: string
  steps: Array<{
    instruction: string
    distance: { text: string; value: number }
    duration: { text: string; value: number }
  }>
}

export default function RouteDisplay({
  origin,
  destination,
  currentLocation,
  className,
  showControls = true
}: RouteDisplayProps) {
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRoute()
  }, [origin, destination])

  const fetchRoute = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const originStr = `${origin.lat},${origin.lng}`
      const destStr = `${destination.lat},${destination.lng}`

      const response = await fetch(`/api/navigation/route?origin=${originStr}&destination=${destStr}`)
      const data = await response.json()

      if (data.status === 'OK' && data.routes.length > 0) {
        setRouteData(data.routes[0])
      } else {
        setError(data.message || 'Failed to fetch route')
      }
    } catch (err) {
      console.error('Error fetching route:', err)
      setError('Failed to load route')
    } finally {
      setIsLoading(false)
    }
  }

  const decodePolyline = (encoded: string): Array<{ lat: number; lng: number }> => {
    const points: Array<{ lat: number; lng: number }> = []
    let index = 0
    let lat = 0
    let lng = 0

    while (index < encoded.length) {
      let shift = 0
      let result = 0

      do {
        const byte = encoded.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)

      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lat += dlat

      shift = 0
      result = 0

      do {
        const byte = encoded.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)

      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lng += dlng

      points.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      })
    }

    return points
  }

  const markers = [
    {
      position: origin,
      title: origin.address || 'Pickup Location'
    },
    {
      position: destination,
      title: destination.address || 'Drop Location'
    }
  ]

  if (currentLocation) {
    markers.push({
      position: currentLocation,
      title: 'Current Location',
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
      `)
    })
  }

  const polylines = routeData ? [{
    path: decodePolyline(routeData.polyline),
    strokeColor: '#3B82F6',
    strokeWeight: 5
  }] : []

  return (
    <div className={className}>
      <MapView
        center={origin}
        zoom={14}
        markers={markers}
        polylines={polylines}
        className="w-full h-96 mb-4"
      />

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Calculating route...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-2">⚠️</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {routeData && showControls && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600">Distance</div>
              <div className="text-lg font-semibold">{routeData.distance.text}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Duration</div>
              <div className="text-lg font-semibold">{routeData.duration.text}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">Directions</div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {routeData.steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div dangerouslySetInnerHTML={{ __html: step.instruction }} />
                    <div className="text-xs text-gray-500 mt-1">
                      {step.distance.text} • {step.duration.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}