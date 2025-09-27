'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface MapViewProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    position: { lat: number; lng: number }
    title?: string
    icon?: string
  }>
  polylines?: Array<{
    path: Array<{ lat: number; lng: number }>
    strokeColor?: string
    strokeWeight?: number
  }>
  onMapClick?: (location: { lat: number; lng: number }) => void
  className?: string
}

export default function MapView({
  center = { lat: 12.9716, lng: 77.5946 }, // Default to Bangalore
  zoom = 12,
  markers = [],
  polylines = [],
  onMapClick,
  className = 'w-full h-96'
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        })

        const { Map } = await loader.importLibrary('maps')

        if (!mapRef.current) return

        const mapInstance = new Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy'
        })

        // Add click listener if provided
        if (onMapClick) {
          mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const lat = event.latLng.lat()
              const lng = event.latLng.lng()
              onMapClick({ lat, lng })
            }
          })
        }

        setMap(mapInstance)
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading Google Maps:', err)
        setError('Failed to load Google Maps')
        setIsLoading(false)
      }
    }

    initMap()
  }, [])

  // Update markers when they change
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    // Note: In a real implementation, you'd want to keep track of markers to remove them

    markers.forEach(marker => {
      new google.maps.Marker({
        position: marker.position,
        map,
        title: marker.title,
        icon: marker.icon
      })
    })
  }, [map, markers])

  // Update polylines when they change
  useEffect(() => {
    if (!map) return

    polylines.forEach(polyline => {
      new google.maps.Polyline({
        path: polyline.path,
        geodesic: true,
        strokeColor: polyline.strokeColor || '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: polyline.strokeWeight || 3,
        map
      })
    })
  }, [map, polylines])

  // Update center when it changes
  useEffect(() => {
    if (map && center) {
      map.setCenter(center)
    }
  }, [map, center])

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <div className="text-sm text-gray-600">Loading map...</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={mapRef} className={`${className} rounded-lg overflow-hidden`} />
  )
}