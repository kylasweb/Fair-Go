import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, User } from 'lucide-react'

interface DriverCardProps {
  driver: {
    id: string
    name: string
    rating: number
    totalRides: number
    vehicleType: string
    vehicleModel: string
    vehicleColor: string
    vehicleNumber: string
    isAvailable: boolean
    currentLocationLat?: number
    currentLocationLng?: number
    distance?: number // distance from user in km
  }
  onSelect?: (driverId: string) => void
  isSelected?: boolean
}

export function DriverCard({ driver, onSelect, isSelected = false }: DriverCardProps) {
  const getVehicleTypeIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'AUTO_RICKSHAW': return '🛺'
      case 'CAR_ECONOMY': return '🚗'
      case 'CAR_PREMIUM': return '🚙'
      case 'CAR_LUXURY': return '🚘'
      case 'SUV': return '🚙'
      case 'BIKE': return '🏍️'
      default: return '🚗'
    }
  }

  return (
    <Card 
      className={`w-full cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-orange-500' : ''
      }`}
      onClick={() => onSelect?.(driver.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold">{driver.name}</h3>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{driver.rating}</span>
                <span className="text-sm text-gray-500">({driver.totalRides} rides)</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <Badge 
              variant={driver.isAvailable ? 'default' : 'secondary'}
              className={driver.isAvailable ? 'bg-green-500' : ''}
            >
              {driver.isAvailable ? 'Available' : 'Busy'}
            </Badge>
            {driver.distance && (
              <span className="text-sm text-gray-500">
                {driver.distance.toFixed(1)} km away
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-sm">
          <span className="text-2xl">{getVehicleTypeIcon(driver.vehicleType)}</span>
          <div className="flex-1">
            <p className="font-medium">
              {driver.vehicleColor} {driver.vehicleModel}
            </p>
            <p className="text-gray-500">{driver.vehicleNumber}</p>
          </div>
          
          {driver.currentLocationLat && driver.currentLocationLng && (
            <div className="text-gray-500">
              <MapPin className="w-4 h-4" />
            </div>
          )}
        </div>

        {driver.distance && driver.distance < 2 && (
          <div className="mt-3 p-2 bg-green-50 rounded-md">
            <p className="text-sm text-green-700 font-medium">
              🎉 Very close to you!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}