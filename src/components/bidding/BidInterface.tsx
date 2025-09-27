'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, MapPin, Car, IndianRupee, Timer, Users } from 'lucide-react'
import { toast } from 'sonner'

interface AvailableBid {
  id: string
  pickupLocation: string
  dropLocation: string
  vehicleType: string
  estimatedPrice: number
  distance: number
  biddingEndTime: string
  lowestBid: number | null
  bidCount: number
  bids: Array<{
    id: string
    amount: number
    estimatedArrivalTime: number
    driver: { name: string }
  }>
}

interface BidInterfaceProps {
  driverId: string
  onBidPlaced?: () => void
  className?: string
}

export default function BidInterface({
  driverId,
  onBidPlaced,
  className
}: BidInterfaceProps) {
  const [availableBids, setAvailableBids] = useState<AvailableBid[]>([])
  const [loading, setLoading] = useState(true)
  const [biddingOn, setBiddingOn] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')

  useEffect(() => {
    fetchAvailableBids()
    // Refresh bids every 30 seconds
    const interval = setInterval(fetchAvailableBids, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAvailableBids = async () => {
    try {
      const response = await fetch('/api/drivers/available-bids')
      if (response.ok) {
        const data = await response.json()
        setAvailableBids(data.availableBids)
      }
    } catch (error) {
      console.error('Failed to fetch available bids:', error)
      toast.error('Failed to load available bids')
    } finally {
      setLoading(false)
    }
  }

  const placeBid = async (bookingId: string) => {
    if (!bidAmount || !arrivalTime) {
      toast.error('Please enter bid amount and arrival time')
      return
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidAmount: parseFloat(bidAmount),
          estimatedArrivalTime: parseInt(arrivalTime)
        })
      })

      if (response.ok) {
        toast.success('Bid placed successfully!')
        setBiddingOn(null)
        setBidAmount('')
        setArrivalTime('')
        onBidPlaced?.()
        fetchAvailableBids() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to place bid')
      }
    } catch (error) {
      console.error('Error placing bid:', error)
      toast.error('Failed to place bid')
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
            <span className="ml-2">Loading available bids...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Available Bidding Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableBids.length === 0 ? (
            <div className="text-center py-8">
              <Timer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bidding opportunities available</p>
              <p className="text-sm text-gray-400 mt-2">
                New opportunities will appear here when riders request bids
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableBids.map((bid) => (
                <Card key={bid.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getVehicleIcon(bid.vehicleType)}</span>
                        <div>
                          <h4 className="font-medium">{bid.vehicleType.replace('_', ' ')}</h4>
                          <p className="text-sm text-gray-600">
                            <IndianRupee className="h-3 w-3 inline" />
                            {bid.estimatedPrice}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeLeft(bid.biddingEndTime)}
                        </Badge>
                        <p className="text-xs text-gray-500">{bid.distance} km away</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="font-medium">From:</span>
                        <span>{bid.pickupLocation}</span>
                      </div>
                      {bid.dropLocation && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <span className="font-medium">To:</span>
                          <span>{bid.dropLocation}</span>
                        </div>
                      )}
                    </div>

                    {bid.bidCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Users className="h-4 w-4" />
                        <span>{bid.bidCount} bid{bid.bidCount > 1 ? 's' : ''}</span>
                        {bid.lowestBid && (
                          <span>• Lowest: ₹{bid.lowestBid}</span>
                        )}
                      </div>
                    )}

                    {biddingOn === bid.id ? (
                      <div className="space-y-3">
                        <Separator />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="bidAmount">Your Bid (₹)</Label>
                            <Input
                              id="bidAmount"
                              type="number"
                              placeholder="Enter amount"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              min="1"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label htmlFor="arrivalTime">Arrival Time (min)</Label>
                            <Input
                              id="arrivalTime"
                              type="number"
                              placeholder="Minutes"
                              value={arrivalTime}
                              onChange={(e) => setArrivalTime(e.target.value)}
                              min="1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => placeBid(bid.id)}
                            className="flex-1"
                            disabled={!bidAmount || !arrivalTime}
                          >
                            Place Bid
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setBiddingOn(null)
                              setBidAmount('')
                              setArrivalTime('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setBiddingOn(bid.id)}
                        className="w-full"
                        disabled={new Date(bid.biddingEndTime) < new Date()}
                      >
                        {new Date(bid.biddingEndTime) < new Date() ? 'Bidding Closed' : 'Place Bid'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}