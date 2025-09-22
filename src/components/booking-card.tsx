import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Star, User } from 'lucide-react'

interface BookingCardProps {
  booking: {
    id: string
    status: string
    pickupLocation: string
    dropLocation?: string
    estimatedPrice: number
    driver?: {
      name: string
      rating: number
      vehicleModel: string
      vehicleColor: string
      vehicleNumber: string
    }
    createdAt: string
  }
  onCancel?: (bookingId: string) => void
  onTrack?: (bookingId: string) => void
}

export function BookingCard({ booking, onCancel, onTrack }: BookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800'
      case 'DRIVER_ARRIVED': return 'bg-purple-100 text-purple-800'
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Booking #{booking.id.slice(-6)}</CardTitle>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">{formatTime(booking.createdAt)}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{booking.pickupLocation}</span>
          </div>
          
          {booking.dropLocation && (
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{booking.dropLocation}</span>
            </div>
          )}
        </div>

        {booking.driver && (
          <div className="border-t pt-3">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{booking.driver.name}</p>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600">{booking.driver.rating}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {booking.driver.vehicleColor} {booking.driver.vehicleModel} • {booking.driver.vehicleNumber}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <p className="text-sm text-gray-500">Estimated Price</p>
            <p className="text-lg font-semibold">₹{booking.estimatedPrice}</p>
          </div>
          
          <div className="flex space-x-2">
            {booking.status === 'REQUESTED' && onCancel && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onCancel(booking.id)}
              >
                Cancel
              </Button>
            )}
            
            {['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(booking.status) && onTrack && (
              <Button 
                size="sm"
                onClick={() => onTrack(booking.id)}
              >
                Track
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}