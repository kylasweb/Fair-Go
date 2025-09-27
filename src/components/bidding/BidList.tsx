'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, MapPin, Car, IndianRupee, Users, Timer } from 'lucide-react'

interface Bid {
  id: string
  bidAmount: number
  estimatedArrivalTime: number
  expiresAt: string
  driver: {
    name: string
    avatar?: string
  }
}

interface AvailableBooking {
  id: string
  pickupLocation: string
  dropLocation: string | null
  vehicleType: string
  estimatedPrice: number
  biddingEndTime: string
  bids: Bid[]
}

interface BidListProps {
  bookingId: string
  onAcceptBid?: (bidId: string) => void
  className?: string
}

export default function BidList({
  bookingId,
  onAcceptBid,
  className
}: BidListProps) {
  const [bids, setBids] = useState<Bid[]>([])
  const [booking, setBooking] = useState<AvailableBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null)

  useEffect(() => {
    fetchBids()
    // Refresh bids every 10 seconds
    const interval = setInterval(fetchBids, 10000)
    return () => clearInterval(interval)
  }, [bookingId])

  const fetchBids = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/bid`)
      if (response.ok) {
        const data = await response.json()
        setBids(data.bids)
      }

      // Also fetch booking details
      const bookingResponse = await fetch(`/api/bookings/${bookingId}`)
      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json()
        setBooking(bookingData.booking)
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptBid = async (bidId: string) => {
    setAcceptingBid(bidId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/accept-bid/${bidId}`, {
        method: 'PUT'
      })

      if (response.ok) {
        onAcceptBid?.(bidId)
        // Refresh the bids list
        fetchBids()
      } else {
        const error = await response.json()
        console.error('Failed to accept bid:', error)
      }
    } catch (error) {
      console.error('Error accepting bid:', error)
    } finally {
      setAcceptingBid(null)
    }
  }

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'Expired'

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'AUTO_RICKSHAW': return '🛺'
      case 'CAR_ECONOMY': return '🚗'
      case 'CAR_PREMIUM': return '🚙'
      case 'CAR_LUXURY': return '🚘'
      case 'SUV': return '🚐'
      case 'BIKE': return '🏍️'
      default: return '🚗'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading bids...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bids Received ({bids.length})
          </div>
          {booking && (
            <Badge variant="outline">
              <Timer className="h-3 w-3 mr-1" />
              {formatTimeLeft(booking.biddingEndTime)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {booking && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{getVehicleIcon(booking.vehicleType)}</span>
              <span className="font-medium">{booking.vehicleType.replace('_', ' ')}</span>
              <Badge variant="secondary">
                <IndianRupee className="h-3 w-3 mr-1" />
                {booking.estimatedPrice}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span>{booking.pickupLocation}</span>
              </div>
              {booking.dropLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>{booking.dropLocation}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {bids.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bids received yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Drivers will start bidding soon
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {bids
                .sort((a, b) => a.bidAmount - b.bidAmount) // Sort by lowest bid first
                .map((bid, index) => (
                  <Card key={bid.id} className={`border-l-4 ${
                    index === 0 ? 'border-l-green-500 bg-green-50' : 'border-l-blue-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {bid.driver.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{bid.driver.name}</p>
                            <p className="text-sm text-gray-600">
                              {bid.estimatedArrivalTime} min away
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ₹{bid.bidAmount}
                          </p>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Lowest Bid
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(bid.expiresAt).toLocaleTimeString()}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => acceptBid(bid.id)}
                          disabled={acceptingBid === bid.id}
                          className={index === 0 ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          {acceptingBid === bid.id ? 'Accepting...' : 'Accept Bid'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}