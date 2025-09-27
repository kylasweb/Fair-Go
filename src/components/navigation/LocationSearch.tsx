'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Input } from '@/components/ui/input'
import { MapPin, Search } from 'lucide-react'

interface LocationSearchProps {
  placeholder?: string
  onPlaceSelect: (place: {
    lat: number
    lng: number
    address: string
    placeId?: string
  }) => void
  className?: string
  defaultValue?: string
}

export default function LocationSearch({
  placeholder = 'Search for a location...',
  onPlaceSelect,
  className,
  defaultValue = ''
}: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [autocomplete, setAutocomplete] = useState<any>(null)

  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        })

        const { Autocomplete } = await loader.importLibrary('places')

        if (!inputRef.current) return

        const autocompleteInstance = new Autocomplete(inputRef.current, {
          fields: ['place_id', 'geometry', 'formatted_address', 'name'],
          types: ['establishment', 'geocode']
        })

        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace()

          if (place.geometry?.location) {
            const location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address || place.name || '',
              placeId: place.place_id
            }
            onPlaceSelect(location)
          }
        })

        setAutocomplete(autocompleteInstance)
      } catch (err) {
        console.error('Error initializing autocomplete:', err)
      }
    }

    initAutocomplete()
  }, [onPlaceSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // You can add debounced search logic here if needed
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          defaultValue={defaultValue}
          onChange={handleInputChange}
          className="pl-10 pr-4"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden group-focus-within:block">
        {/* Autocomplete dropdown will be handled by Google Maps */}
      </div>
    </div>
  )
}

// Hook for using location search
export function useLocationSearch() {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)

  const getCurrentLocation = () => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address
      }

      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  const setLocationFromCoords = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng)
    setCurrentLocation({ lat, lng, address })
  }

  return {
    currentLocation,
    setCurrentLocation,
    getCurrentLocation,
    setLocationFromCoords
  }
}