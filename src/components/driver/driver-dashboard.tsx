'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Car, 
  MapPin, 
  Clock, 
  Star, 
  DollarSign, 
  TrendingUp, 
  Bell, 
  Settings,
  Navigation,
  Phone,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface DriverStats {
  todayEarnings: number
  totalRides: number
  rating: number
  onlineHours: number
  weeklyEarnings: number
  monthlyEarnings: number
}

interface Booking {
  id: string
  pickupLocation: string
  dropLocation: string
  status: string
  estimatedPrice: number
  createdAt: string
  user: {
    name: string
    phone: string
  }
}

interface DriverDashboardProps {
  driverId: string
}

export function DriverDashboard({ driverId }: DriverDashboardProps) {
  const [isOnline, setIsOnline] = useState(false)
  const [currentLocation, setCurrentLocation] = useState({ lat: 12.9716, lng: 77.5946 })
  const [stats, setStats] = useState<DriverStats>({
    todayEarnings: 0,
    totalRides: 0,
    rating: 0,
    onlineHours: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeBookings, setActiveBookings] = useState<Booking[]>([])

  useEffect(() => {
    fetchDriverData()
    fetchBookings()
    
    // Simulate real-time location updates
    const locationInterval = setInterval(() => {
      if (isOnline) {
        // Simulate small location changes
        setCurrentLocation(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001
        }))
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(locationInterval)
  }, [isOnline])

  const fetchDriverData = async () => {
    try {
      // Mock data for demo
      setStats({
        todayEarnings: 1250,
        totalRides: 8,
        rating: 4.8,
        onlineHours: 6.5,
        weeklyEarnings: 8500,
        monthlyEarnings: 34000
      })
    } catch (error) {
      console.error('Failed to fetch driver data:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      // Mock booking data
      const mockBookings: Booking[] = [
        {
          id: '1',
          pickupLocation: 'MG Road, Bangalore',
          dropLocation: 'Koramangala, Bangalore',
          status: 'COMPLETED',
          estimatedPrice: 150,
          createdAt: '2024-01-15T10:30:00Z',
          user: { name: 'Rahul Sharma', phone: '+91 98765 43210' }
        },
        {
          id: '2',
          pickupLocation: 'Indiranagar, Bangalore',
          dropLocation: 'Airport Road, Bangalore',
          status: 'ACCEPTED',
          estimatedPrice: 200,
          createdAt: '2024-01-15T14:20:00Z',
          user: { name: 'Priya Singh', phone: '+91 87654 32109' }
        }
      ]
      
      setBookings(mockBookings)
      setActiveBookings(mockBookings.filter(b => ['ACCEPTED', 'IN_PROGRESS'].includes(b.status)))
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline
      setIsOnline(newStatus)
      
      if (newStatus) {
        // Get current location when going online
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCurrentLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              })
            },
            (error) => {
              console.error('Error getting location:', error)
            }
          )
        }
      }
    } catch (error) {
      console.error('Failed to toggle online status:', error)
    }
  }

  const acceptBooking = async (bookingId: string) => {
    try {
      // Mock API call
      console.log('Accepting booking:', bookingId)
      fetchBookings() // Refresh bookings
    } catch (error) {
      console.error('Failed to accept booking:', error)
    }
  }

  const startRide = async (bookingId: string) => {
    try {
      // Mock API call
      console.log('Starting ride:', bookingId)
      fetchBookings() // Refresh bookings
    } catch (error) {
      console.error('Failed to start ride:', error)
    }
  }

  const completeRide = async (bookingId: string) => {
    try {
      // Mock API call
      console.log('Completing ride:', bookingId)
      fetchBookings() // Refresh bookings
      fetchDriverData() // Refresh stats
    } catch (error) {
      console.error('Failed to complete ride:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Driver Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your rides and earnings</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="online-status">Online</Label>
                <Switch
                  id="online-status"
                  checked={isOnline}
                  onCheckedChange={toggleOnlineStatus}
                />
                <Badge variant={isOnline ? "default" : "secondary"}>
                  {isOnline ? "Available" : "Offline"}
                </Badge>
              </div>
              
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.todayEarnings)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Rides</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalRides}</p>
                </div>
                <Car className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.rating}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Online Hours</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.onlineHours}h</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Active Rides</TabsTrigger>
            <TabsTrigger value="history">Ride History</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Bookings</CardTitle>
                <CardDescription>
                  Manage your current ride requests and trips
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active bookings</p>
                    {isOnline && (
                      <p className="text-sm text-gray-400 mt-2">
                        You'll receive ride requests when available
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Booking #{booking.id}</h4>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(booking.estimatedPrice)}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Pickup</p>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-green-500" />
                              <span className="text-sm">{booking.pickupLocation}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Drop</p>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-red-500" />
                              <span className="text-sm">{booking.dropLocation}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div>
                            <p className="text-sm text-gray-600">Customer</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{booking.user.name}</span>
                              <Phone className="w-4 h-4 text-blue-500" />
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            {booking.status === 'ACCEPTED' && (
                              <Button 
                                size="sm"
                                onClick={() => startRide(booking.id)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                Start Ride
                              </Button>
                            )}
                            
                            {booking.status === 'IN_PROGRESS' && (
                              <Button 
                                size="sm"
                                onClick={() => completeRide(booking.id)}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                Complete Ride
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ride History</CardTitle>
                <CardDescription>
                  View your completed rides and earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings
                    .filter(b => b.status === 'COMPLETED')
                    .map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">Booking #{booking.id}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              {formatCurrency(booking.estimatedPrice)}
                            </p>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-green-600">Completed</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Pickup</p>
                            <p>{booking.pickupLocation}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Drop</p>
                            <p>{booking.dropLocation}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm">
                          <span className="text-gray-600">Customer: {booking.user.name}</span>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(stats.todayEarnings)}
                  </p>
                  <p className="text-sm text-gray-600">{stats.totalRides} rides</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(stats.weeklyEarnings)}
                  </p>
                  <p className="text-sm text-gray-600">Average daily: {formatCurrency(stats.weeklyEarnings / 7)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(stats.monthlyEarnings)}
                  </p>
                  <p className="text-sm text-gray-600">Average daily: {formatCurrency(stats.monthlyEarnings / 30)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Earnings Trend</CardTitle>
                <CardDescription>
                  Your earnings over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <TrendingUp className="w-12 h-12 mr-2" />
                  <span>Earnings chart would be displayed here</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Driver Profile</CardTitle>
                <CardDescription>
                  Manage your profile and vehicle information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Current Location</Label>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Navigation className="w-4 h-4" />
                      <span>{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Online Status</Label>
                    <Badge variant={isOnline ? "default" : "secondary"}>
                      {isOnline ? "Available for rides" : "Offline"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Quick Actions</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      Update Vehicle Info
                    </Button>
                    <Button variant="outline" size="sm">
                      Upload Documents
                    </Button>
                    <Button variant="outline" size="sm">
                      Bank Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}