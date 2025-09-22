'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { RideHistoryCard } from '@/components/user/ride-history'
import { 
  History, 
  Filter, 
  Search, 
  Calendar,
  MapPin,
  Star,
  DollarSign,
  Car,
  Clock,
  TrendingUp
} from 'lucide-react'

// Mock ride data
const mockRides = [
  {
    id: 'ride-001',
    date: '2024-01-20T14:30:00Z',
    pickup: {
      address: '123 Main St, Downtown',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    destination: {
      address: 'Shopping Mall, Uptown District',
      coordinates: { lat: 40.7489, lng: -73.9857 }
    },
    driver: {
      id: 'driver-001',
      name: 'Mike Johnson',
      rating: 4.8,
      vehicle: {
        make: 'Toyota',
        model: 'Camry',
        plate: 'ABC-123',
        color: 'Silver'
      }
    },
    status: 'completed' as const,
    fare: {
      amount: 23.45,
      currency: 'USD',
      breakdown: {
        base: 5.00,
        distance: 12.50,
        time: 4.50,
        surge: 0,
        tips: 1.45
      }
    },
    duration: '25 mins',
    distance: '8.5 km',
    rating: 5,
    feedback: 'Great driver, very friendly and punctual!'
  },
  {
    id: 'ride-002',
    date: '2024-01-18T16:45:00Z',
    pickup: {
      address: '456 Oak Ave, Residential',
      coordinates: { lat: 40.7282, lng: -74.0776 }
    },
    destination: {
      address: 'JFK Airport Terminal 1',
      coordinates: { lat: 40.6413, lng: -73.7781 }
    },
    driver: {
      id: 'driver-002',
      name: 'Sarah Chen',
      rating: 4.9,
      vehicle: {
        make: 'Honda',
        model: 'Accord',
        plate: 'XYZ-789',
        color: 'Black'
      }
    },
    status: 'completed' as const,
    fare: {
      amount: 67.30,
      currency: 'USD',
      breakdown: {
        base: 5.00,
        distance: 45.80,
        time: 12.50,
        surge: 4.00,
        tips: 0
      }
    },
    duration: '45 mins',
    distance: '28.2 km',
    rating: 4,
    feedback: 'Smooth ride to airport, arrived on time.'
  },
  {
    id: 'ride-003',
    date: '2024-01-17T11:20:00Z',
    pickup: {
      address: 'Central Station Plaza',
      coordinates: { lat: 40.7505, lng: -73.9934 }
    },
    destination: {
      address: '789 Business District',
      coordinates: { lat: 40.7614, lng: -73.9776 }
    },
    driver: {
      id: 'driver-003',
      name: 'David Rodriguez',
      rating: 4.6,
      vehicle: {
        make: 'Nissan',
        model: 'Altima',
        plate: 'DEF-456',
        color: 'White'
      }
    },
    status: 'cancelled' as const,
    fare: {
      amount: 0,
      currency: 'USD',
      breakdown: {
        base: 0,
        distance: 0,
        time: 0,
        surge: 0,
        tips: 0
      }
    },
    duration: '0 mins',
    distance: '0 km'
  },
  {
    id: 'ride-004',
    date: '2024-01-16T08:45:00Z',
    pickup: {
      address: '321 Park View, Suburbs',
      coordinates: { lat: 40.7831, lng: -73.9712 }
    },
    destination: {
      address: 'City Medical Center',
      coordinates: { lat: 40.7749, lng: -73.9851 }
    },
    driver: {
      id: 'driver-004',
      name: 'Emma Wilson',
      rating: 4.7,
      vehicle: {
        make: 'Hyundai',
        model: 'Elantra',
        plate: 'GHI-789',
        color: 'Blue'
      }
    },
    status: 'completed' as const,
    fare: {
      amount: 34.75,
      currency: 'USD',
      breakdown: {
        base: 5.00,
        distance: 22.25,
        time: 6.50,
        surge: 0,
        tips: 1.00
      }
    },
    duration: '32 mins',
    distance: '15.3 km',
    rating: 5,
    feedback: 'Excellent service, very professional driver.'
  },
  {
    id: 'ride-005',
    date: '2024-01-15T19:15:00Z',
    pickup: {
      address: 'Restaurant District, 5th Avenue',
      coordinates: { lat: 40.7576, lng: -73.9857 }
    },
    destination: {
      address: '654 Home Street, Residential',
      coordinates: { lat: 40.7282, lng: -74.0060 }
    },
    driver: {
      id: 'driver-005',
      name: 'Carlos Martinez',
      rating: 4.5,
      vehicle: {
        make: 'Chevrolet',
        model: 'Malibu',
        plate: 'JKL-012',
        color: 'Gray'
      }
    },
    status: 'completed' as const,
    fare: {
      amount: 28.90,
      currency: 'USD',
      breakdown: {
        base: 5.00,
        distance: 18.90,
        time: 5.00,
        surge: 0,
        tips: 0
      }
    },
    duration: '28 mins',
    distance: '12.1 km'
  }
]

export default function RideHistoryPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('all')

  const filteredRides = mockRides.filter(ride => {
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter
    const matchesSearch = 
      ride.pickup.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destination.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.driver.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesDate = true
    if (dateRange !== 'all') {
      const rideDate = new Date(ride.date)
      const now = new Date()
      
      switch (dateRange) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = rideDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = rideDate >= monthAgo
          break
        case '3months':
          const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          matchesDate = rideDate >= threeMonthsAgo
          break
      }
    }
    
    return matchesStatus && matchesSearch && matchesDate
  })

  const completedRides = filteredRides.filter(ride => ride.status === 'completed')
  const totalSpent = completedRides.reduce((sum, ride) => sum + ride.fare.amount, 0)
  const averageRating = completedRides.length > 0 
    ? completedRides.filter(ride => ride.rating).reduce((sum, ride) => sum + (ride.rating || 0), 0) / completedRides.filter(ride => ride.rating).length
    : 0

  const handleRateRide = (rideId: string) => {
    console.log('Rating ride:', rideId)
  }

  const handleViewDetails = (rideId: string) => {
    console.log('Viewing ride details:', rideId)
  }

  const handleDownloadReceipt = (rideId: string) => {
    console.log('Downloading receipt for ride:', rideId)
  }

  const handleReportIssue = (rideId: string) => {
    console.log('Reporting issue for ride:', rideId)
  }

  const handleRebookRide = (ride: any) => {
    console.log('Rebooking ride:', ride)
  }

  return (
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark text-gray-900 dark:text-white">
      {/* Header */}
      <NeoCard variant="flat" className="rounded-none border-0 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Ride History
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View all your past trips and manage your ride history
              </p>
            </div>
            
            <div className="flex space-x-3">
              <NeoButton variant="secondary">
                <Calendar className="w-4 h-4 mr-2" />
                Export History
              </NeoButton>
              <NeoButton variant="primary">
                <Car className="w-4 h-4 mr-2" />
                Book New Ride
              </NeoButton>
            </div>
          </div>
        </div>
      </NeoCard>

      <div className="container mx-auto px-4">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rides</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedRides.length}</p>
                <p className="text-sm text-green-600">+3 this month</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Car className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalSpent.toFixed(2)}</p>
                <p className="text-sm text-blue-600">${(totalSpent / Math.max(completedRides.length, 1)).toFixed(2)} avg per ride</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</p>
                <p className="text-sm text-yellow-600">Based on {completedRides.filter(ride => ride.rating).length} ratings</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-sm text-orange-600">2 rides this week</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Filters and Search */}
        <NeoCard variant="flat" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location or driver name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Rides</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="ongoing">Ongoing</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="3months">Last 3 Months</option>
            </select>

            <NeoButton variant="secondary">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </NeoButton>
          </div>
        </NeoCard>

        {/* Summary */}
        <NeoCard variant="raised" className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                Showing {filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredRides.length !== mockRides.length && `${mockRides.length - filteredRides.length} hidden by filters`}
            </div>
          </div>
        </NeoCard>

        {/* Ride History List */}
        <div className="space-y-4">
          {filteredRides.map((ride) => (
            <RideHistoryCard
              key={ride.id}
              ride={ride}
              onViewDetails={handleViewDetails}
              onDownloadReceipt={handleDownloadReceipt}
              onRateRide={handleRateRide}
              onReportIssue={handleReportIssue}
              onRebookRide={handleRebookRide}
            />
          ))}
        </div>

        {filteredRides.length === 0 && (
          <NeoCard variant="flat" className="text-center py-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No rides found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Try adjusting your search criteria or date range.
                </p>
                <div className="flex justify-center space-x-3">
                  <NeoButton 
                    variant="ghost" 
                    onClick={() => {
                      setStatusFilter('all')
                      setSearchTerm('')
                      setDateRange('all')
                    }}
                  >
                    Clear Filters
                  </NeoButton>
                  <NeoButton variant="primary">
                    <Car className="w-4 h-4 mr-2" />
                    Book Your First Ride
                  </NeoButton>
                </div>
              </div>
            </div>
          </NeoCard>
        )}

        <div className="pb-8"></div>
      </div>
    </div>
  )
}