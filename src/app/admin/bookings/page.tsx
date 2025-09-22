'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { 
  Car, 
  MapPin, 
  Clock, 
  Download, 
  Upload,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  Eye,
  Filter,
  Search,
  Calendar,
  User,
  Navigation
} from 'lucide-react'

// Mock booking data
const mockBookings = [
  {
    id: 'BK001',
    user: {
      name: 'John Doe',
      phone: '+1 (555) 123-4567',
      rating: 4.8
    },
    driver: {
      name: 'Michael Torres',
      phone: '+1 (555) 987-6543',
      rating: 4.9,
      vehicle: 'Toyota Camry - ABC123'
    },
    pickup: {
      address: '123 Main St, New York, NY',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      time: '2024-01-21T14:30:00Z'
    },
    destination: {
      address: '456 Broadway, New York, NY',
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    status: 'in_progress' as const,
    fare: 25.50,
    distance: 8.5,
    duration: 22,
    bookingTime: '2024-01-21T14:15:00Z',
    estimatedArrival: '2024-01-21T14:52:00Z',
    paymentMethod: 'Credit Card',
    notes: 'Please wait at the main entrance'
  },
  {
    id: 'BK002',
    user: {
      name: 'Sarah Johnson',
      phone: '+1 (555) 234-5678',
      rating: 4.7
    },
    driver: {
      name: 'Robert Wilson',
      phone: '+1 (555) 876-5432',
      rating: 4.8,
      vehicle: 'Honda Accord - XYZ789'
    },
    pickup: {
      address: '789 Oak Ave, Los Angeles, CA',
      coordinates: { lat: 34.0522, lng: -118.2437 },
      time: '2024-01-21T15:00:00Z'
    },
    destination: {
      address: '321 Pine St, Los Angeles, CA',
      coordinates: { lat: 34.0689, lng: -118.4452 }
    },
    status: 'completed' as const,
    fare: 18.75,
    distance: 6.2,
    duration: 18,
    bookingTime: '2024-01-21T14:45:00Z',
    completedTime: '2024-01-21T15:18:00Z',
    paymentMethod: 'Wallet',
    tip: 3.50,
    userRating: 5,
    driverRating: 4
  },
  {
    id: 'BK003',
    user: {
      name: 'Mike Chen',
      phone: '+1 (555) 345-6789',
      rating: 3.2
    },
    driver: {
      name: 'Lisa Rodriguez',
      phone: '+1 (555) 765-4321',
      rating: 4.6,
      vehicle: 'Nissan Altima - DEF456'
    },
    pickup: {
      address: '555 Lake Dr, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      time: '2024-01-21T13:45:00Z'
    },
    destination: {
      address: '777 River Rd, Chicago, IL',
      coordinates: { lat: 41.8369, lng: -87.6847 }
    },
    status: 'disputed' as const,
    fare: 32.00,
    distance: 12.8,
    duration: 35,
    bookingTime: '2024-01-21T13:30:00Z',
    completedTime: '2024-01-21T14:20:00Z',
    paymentMethod: 'Credit Card',
    dispute: {
      reason: 'Driver took wrong route',
      reportedBy: 'user',
      reportTime: '2024-01-21T14:25:00Z'
    },
    userRating: 2,
    driverRating: 1
  },
  {
    id: 'BK004',
    user: {
      name: 'Emma Wilson',
      phone: '+1 (555) 456-7890',
      rating: 4.9
    },
    driver: {
      name: 'David Johnson',
      phone: '+1 (555) 654-3210',
      rating: 4.7,
      vehicle: 'Chevrolet Malibu - GHI789'
    },
    pickup: {
      address: '999 Beach Blvd, Miami, FL',
      coordinates: { lat: 25.7617, lng: -80.1918 },
      time: '2024-01-21T16:15:00Z'
    },
    destination: {
      address: '111 Airport Rd, Miami, FL',
      coordinates: { lat: 25.7953, lng: -80.2659 }
    },
    status: 'cancelled' as const,
    fare: 0,
    distance: 15.2,
    duration: 0,
    bookingTime: '2024-01-21T16:00:00Z',
    cancelledTime: '2024-01-21T16:12:00Z',
    cancelledBy: 'user',
    cancellationReason: 'Change of plans',
    paymentMethod: 'Wallet',
    cancellationFee: 5.00
  },
  {
    id: 'BK005',
    user: {
      name: 'Robert Taylor',
      phone: '+1 (555) 567-8901',
      rating: 4.5
    },
    driver: {
      name: 'Amanda Davis',
      phone: '+1 (555) 543-2109',
      rating: 4.8,
      vehicle: 'Hyundai Elantra - JKL012'
    },
    pickup: {
      address: '222 Tech Park Dr, Seattle, WA',
      coordinates: { lat: 47.6062, lng: -122.3321 },
      time: '2024-01-21T17:30:00Z'
    },
    destination: {
      address: '333 University Way, Seattle, WA',
      coordinates: { lat: 47.6587, lng: -122.3123 }
    },
    status: 'pending' as const,
    fare: 22.25,
    distance: 9.3,
    duration: 25,
    bookingTime: '2024-01-21T17:15:00Z',
    estimatedArrival: '2024-01-21T17:55:00Z',
    paymentMethod: 'Credit Card',
    notes: 'Airport pickup - Terminal A'
  },
  {
    id: 'BK006',
    user: {
      name: 'Jennifer Brown',
      phone: '+1 (555) 678-9012',
      rating: 4.6
    },
    driver: null, // No driver assigned yet
    pickup: {
      address: '444 Shopping Center, Denver, CO',
      coordinates: { lat: 39.7392, lng: -104.9903 },
      time: '2024-01-21T18:00:00Z'
    },
    destination: {
      address: '555 Residential Ave, Denver, CO',
      coordinates: { lat: 39.7817, lng: -105.0178 }
    },
    status: 'searching' as const,
    fare: 16.50,
    distance: 5.8,
    duration: 16,
    bookingTime: '2024-01-21T17:45:00Z',
    paymentMethod: 'Wallet',
    searchStartTime: '2024-01-21T17:45:00Z'
  }
]

const statusColors = {
  pending: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  searching: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  in_progress: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
  completed: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  cancelled: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
  disputed: 'text-red-600 bg-red-100 dark:bg-red-900/30'
}

export default function AdminBookingsPage() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])

  const handleViewBooking = (bookingId: string) => {
    console.log('Viewing booking:', bookingId)
  }

  const handleContactUser = (bookingId: string) => {
    console.log('Contacting user for booking:', bookingId)
  }

  const handleContactDriver = (bookingId: string) => {
    console.log('Contacting driver for booking:', bookingId)
  }

  const handleResolveDispute = (bookingId: string, resolution: string) => {
    console.log('Resolving dispute for booking:', bookingId, 'Resolution:', resolution)
  }

  const handleCancelBooking = (bookingId: string, reason: string) => {
    console.log('Cancelling booking:', bookingId, 'Reason:', reason)
  }

  const handleAssignDriver = (bookingId: string, driverId: string) => {
    console.log('Assigning driver to booking:', bookingId, 'Driver:', driverId)
  }

  const handleTrackBooking = (bookingId: string) => {
    console.log('Tracking booking:', bookingId)
  }

  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    )
  }

  // Filter bookings
  const filteredBookings = mockBookings.filter(booking => {
    const matchesStatus = selectedFilter === 'all' || booking.status === selectedFilter
    const matchesSearch = searchTerm === '' || 
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.driver && booking.driver.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesStatus && matchesSearch
  })

  // Calculate statistics
  const totalBookings = mockBookings.length
  const activeBookings = mockBookings.filter(b => ['pending', 'searching', 'in_progress'].includes(b.status)).length
  const completedBookings = mockBookings.filter(b => b.status === 'completed').length
  const disputedBookings = mockBookings.filter(b => b.status === 'disputed').length
  const cancelledBookings = mockBookings.filter(b => b.status === 'cancelled').length
  const totalRevenue = mockBookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.fare + (b.tip || 0), 0)

  return (
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark text-gray-900 dark:text-white">
      {/* Header */}
      <NeoCard variant="flat" className="rounded-none border-0 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Booking Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor live bookings, resolve disputes, and manage trip operations
              </p>
            </div>
            
            <div className="flex space-x-3">
              <NeoButton variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </NeoButton>
              <NeoButton variant="secondary">
                <Navigation className="w-4 h-4 mr-2" />
                Live Map
              </NeoButton>
              <NeoButton variant="primary">
                <Eye className="w-4 h-4 mr-2" />
                Monitor Live
              </NeoButton>
            </div>
          </div>
        </div>
      </NeoCard>

      <div className="container mx-auto px-4">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBookings}</p>
                <p className="text-sm text-blue-600">Today</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Car className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeBookings}</p>
                <p className="text-sm text-yellow-600">In progress</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedBookings}</p>
                <p className="text-sm text-green-600">{Math.round((completedBookings/totalBookings)*100)}% success</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disputes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{disputedBookings}</p>
                <p className="text-sm text-red-600">Need resolution</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{cancelledBookings}</p>
                <p className="text-sm text-gray-600">{Math.round((cancelledBookings/totalBookings)*100)}% rate</p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
                <XCircle className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-purple-600">Today's total</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Filters and Search */}
        <NeoCard variant="raised" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="searching">Searching for Driver</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <NeoButton variant="ghost" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Today
              </NeoButton>
              <NeoButton variant="ghost" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </NeoButton>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredBookings.length} of {totalBookings} bookings
              </div>
            </div>
          </div>
        </NeoCard>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <NeoCard key={booking.id} variant="raised" className="overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking.id)}
                      onChange={() => toggleBookingSelection(booking.id)}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {booking.id}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[booking.status]}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Booked {new Date(booking.bookingTime).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <NeoButton variant="ghost" size="sm" onClick={() => handleTrackBooking(booking.id)}>
                      <Navigation className="w-4 h-4" />
                    </NeoButton>
                    <NeoButton variant="ghost" size="sm" onClick={() => handleContactUser(booking.id)}>
                      <Phone className="w-4 h-4" />
                    </NeoButton>
                    <NeoButton variant="ghost" size="sm" onClick={() => handleViewBooking(booking.id)}>
                      <Eye className="w-4 h-4" />
                    </NeoButton>
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* User & Driver Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">User</h4>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{booking.user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{booking.user.phone}</div>
                          <div className="text-sm text-yellow-600">★ {booking.user.rating}</div>
                        </div>
                      </div>
                    </div>

                    {booking.driver && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Driver</h4>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Car className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{booking.driver.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{booking.driver.phone}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{booking.driver.vehicle}</div>
                            <div className="text-sm text-yellow-600">★ {booking.driver.rating}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!booking.driver && booking.status === 'searching' && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Driver</h4>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Searching for driver...</div>
                        <NeoButton variant="secondary" size="sm" onClick={() => handleAssignDriver(booking.id, 'manual')}>
                          Assign Manually
                        </NeoButton>
                      </div>
                    )}
                  </div>

                  {/* Trip Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Trip Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Pickup</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{booking.pickup.address}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(booking.pickup.time).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="border-l-2 border-dashed border-gray-300 dark:border-gray-600 ml-1 h-4"></div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Destination</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{booking.destination.address}</div>
                        </div>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-400">
                        <strong>Note:</strong> {booking.notes}
                      </div>
                    )}
                  </div>

                  {/* Financial & Status Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Trip Info</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Distance</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{booking.distance} miles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Duration</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{booking.duration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Fare</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">${booking.fare.toFixed(2)}</span>
                      </div>
                      {booking.tip && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Tip</span>
                          <span className="text-sm font-medium text-green-600">${booking.tip.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Payment</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{booking.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Status-specific actions */}
                    <div className="mt-4 space-y-2">
                      {booking.status === 'disputed' && (
                        <div>
                          <div className="text-sm text-red-600 mb-2">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            Dispute: {booking.dispute?.reason}
                          </div>
                          <NeoButton 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleResolveDispute(booking.id, 'investigate')}
                          >
                            Resolve Dispute
                          </NeoButton>
                        </div>
                      )}

                      {booking.status === 'cancelled' && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Cancelled by {booking.cancelledBy}: {booking.cancellationReason}
                          {booking.cancellationFee && (
                            <div>Fee: ${booking.cancellationFee.toFixed(2)}</div>
                          )}
                        </div>
                      )}

                      {['pending', 'in_progress'].includes(booking.status) && (
                        <NeoButton 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => handleCancelBooking(booking.id, 'admin_cancel')}
                        >
                          Cancel Trip
                        </NeoButton>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </NeoCard>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <NeoCard variant="raised" className="text-center py-12">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || selectedFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No bookings to display at this time.'}
            </p>
          </NeoCard>
        )}

        {/* Bulk Actions */}
        {selectedBookings.length > 0 && (
          <NeoCard variant="raised" className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedBookings.length} booking(s) selected
              </div>
              <div className="flex space-x-3">
                <NeoButton variant="secondary" size="sm">
                  Export Selected
                </NeoButton>
                <NeoButton variant="secondary" size="sm">
                  Send Notifications
                </NeoButton>
                <NeoButton variant="secondary" size="sm">
                  Bulk Cancel
                </NeoButton>
              </div>
            </div>
          </NeoCard>
        )}

        <div className="pb-8"></div>
      </div>
    </div>
  )
}