'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Users,
  Car,
  Clock,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  MapPin,
  CreditCard,
  Star,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react'

// Mock analytics data
const analyticsData = {
  revenue: {
    today: 2456.75,
    yesterday: 2134.50,
    thisWeek: 15234.80,
    lastWeek: 14567.25,
    thisMonth: 67890.50,
    lastMonth: 64512.30,
    thisYear: 567890.75,
    lastYear: 523456.80
  },
  bookings: {
    today: 89,
    yesterday: 76,
    thisWeek: 567,
    lastWeek: 543,
    thisMonth: 2340,
    lastMonth: 2156,
    completed: 2156,
    cancelled: 184,
    disputed: 12
  },
  users: {
    total: 12456,
    active: 8934,
    newThisWeek: 234,
    newThisMonth: 987,
    retention: 78.5
  },
  drivers: {
    total: 1856,
    active: 1234,
    newThisWeek: 45,
    newThisMonth: 167,
    averageRating: 4.7,
    topPerformer: 'Sarah Wilson'
  },
  locations: [
    { city: 'New York, NY', bookings: 2340, revenue: 45678.90, growth: 12.5 },
    { city: 'Los Angeles, CA', bookings: 1876, revenue: 38945.60, growth: 8.3 },
    { city: 'Chicago, IL', bookings: 1245, revenue: 28456.75, growth: -2.1 },
    { city: 'Miami, FL', bookings: 987, revenue: 23567.80, growth: 15.7 },
    { city: 'Houston, TX', bookings: 834, revenue: 19876.45, growth: 5.9 }
  ],
  hourlyData: [
    { hour: '00:00', bookings: 12, revenue: 234.50 },
    { hour: '01:00', bookings: 8, revenue: 156.75 },
    { hour: '02:00', bookings: 6, revenue: 123.25 },
    { hour: '03:00', bookings: 4, revenue: 89.50 },
    { hour: '04:00', bookings: 7, revenue: 145.80 },
    { hour: '05:00', bookings: 15, revenue: 298.60 },
    { hour: '06:00', bookings: 32, revenue: 645.90 },
    { hour: '07:00', bookings: 56, revenue: 1123.75 },
    { hour: '08:00', bookings: 78, revenue: 1567.80 },
    { hour: '09:00', bookings: 65, revenue: 1298.45 },
    { hour: '10:00', bookings: 45, revenue: 923.60 },
    { hour: '11:00', bookings: 52, revenue: 1045.75 },
    { hour: '12:00', bookings: 67, revenue: 1345.90 },
    { hour: '13:00', bookings: 73, revenue: 1456.80 },
    { hour: '14:00', bookings: 69, revenue: 1378.45 },
    { hour: '15:00', bookings: 58, revenue: 1167.90 },
    { hour: '16:00', bookings: 71, revenue: 1423.60 },
    { hour: '17:00', bookings: 89, revenue: 1789.75 },
    { hour: '18:00', bookings: 94, revenue: 1887.80 },
    { hour: '19:00', bookings: 87, revenue: 1745.90 },
    { hour: '20:00', bookings: 76, revenue: 1523.45 },
    { hour: '21:00', bookings: 64, revenue: 1284.60 },
    { hour: '22:00', bookings: 45, revenue: 902.75 },
    { hour: '23:00', bookings: 28, revenue: 567.90 }
  ],
  topDrivers: [
    { name: 'Sarah Wilson', trips: 234, revenue: 4567.80, rating: 4.9, city: 'Los Angeles' },
    { name: 'Michael Torres', trips: 198, revenue: 3876.45, rating: 4.8, city: 'New York' },
    { name: 'Robert Johnson', trips: 176, revenue: 3456.90, rating: 4.7, city: 'Chicago' },
    { name: 'Amanda Davis', trips: 165, revenue: 3234.75, rating: 4.9, city: 'Miami' },
    { name: 'David Rodriguez', trips: 153, revenue: 2987.60, rating: 4.6, city: 'Houston' }
  ],
  paymentMethods: {
    creditCard: { percentage: 65, revenue: 43890.75 },
    wallet: { percentage: 28, revenue: 18967.45 },
    cash: { percentage: 7, revenue: 4732.30 }
  }
}

export default function AdminAnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('today')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const revenueGrowth = calculateGrowth(analyticsData.revenue.today, analyticsData.revenue.yesterday)
  const bookingGrowth = calculateGrowth(analyticsData.bookings.today, analyticsData.bookings.yesterday)
  const userGrowth = calculateGrowth(analyticsData.users.newThisWeek, 156) // Mock previous week data
  const driverGrowth = calculateGrowth(analyticsData.drivers.newThisWeek, 38) // Mock previous week data

  return (
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark text-gray-900 dark:text-white">
      {/* Header */}
      <NeoCard variant="flat" className="rounded-none border-0 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track revenue, monitor performance, and analyze business metrics
              </p>
            </div>
            
            <div className="flex space-x-3">
              <NeoButton variant="secondary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </NeoButton>
              <NeoButton variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </NeoButton>
              <NeoButton variant="primary">
                <BarChart3 className="w-4 h-4 mr-2" />
                Custom Report
              </NeoButton>
            </div>
          </div>
        </div>
      </NeoCard>

      <div className="container mx-auto px-4">
        {/* Time Range Selector */}
        <NeoCard variant="raised" className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
              </select>

              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="revenue">Revenue</option>
                <option value="bookings">Bookings</option>
                <option value="users">Users</option>
                <option value="drivers">Drivers</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <NeoButton variant="ghost" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Custom Range
              </NeoButton>
              <NeoButton variant="ghost" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </NeoButton>
            </div>
          </div>
        </NeoCard>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${analyticsData.revenue.today.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 text-sm font-medium">+{revenueGrowth}%</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">vs yesterday</span>
                </div>
              </div>
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Bookings</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.bookings.today.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-blue-600 text-sm font-medium">+{bookingGrowth}%</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">vs yesterday</span>
                </div>
              </div>
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Car className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.users.active.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-purple-600 text-sm font-medium">+{userGrowth}%</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">this week</span>
                </div>
              </div>
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Drivers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.drivers.active.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-orange-600 text-sm font-medium">+{driverGrowth}%</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">this week</span>
                </div>
              </div>
              <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Activity className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hourly Performance Chart */}
          <NeoCard variant="raised">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hourly Performance</h3>
              <NeoButton variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </NeoButton>
            </div>
            <div className="h-64 flex items-end justify-between space-x-1">
              {analyticsData.hourlyData.map((data, index) => {
                const maxBookings = Math.max(...analyticsData.hourlyData.map(d => d.bookings))
                const height = (data.bookings / maxBookings) * 100
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {data.bookings}
                    </div>
                    <div 
                      className="w-full bg-blue-500 rounded-sm transition-all hover:bg-blue-600"
                      style={{ height: `${height}%`, minHeight: '2px' }}
                      title={`${data.hour}: ${data.bookings} bookings, $${data.revenue}`}
                    ></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {data.hour.split(':')[0]}
                    </div>
                  </div>
                )
              })}
            </div>
          </NeoCard>

          {/* Revenue Breakdown */}
          <NeoCard variant="raised">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Breakdown</h3>
              <NeoButton variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </NeoButton>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">This Month</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${analyticsData.revenue.thisMonth.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last Month</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  ${analyticsData.revenue.lastMonth.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Growth</span>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 text-sm font-medium">
                    +{calculateGrowth(analyticsData.revenue.thisMonth, analyticsData.revenue.lastMonth)}%
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">This Week</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${analyticsData.revenue.thisWeek.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Today</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${analyticsData.revenue.today.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Locations */}
          <NeoCard variant="raised">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Locations</h3>
            <div className="space-y-3">
              {analyticsData.locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{location.city}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {location.bookings} bookings
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      ${location.revenue.toLocaleString()}
                    </div>
                    <div className={`text-sm ${location.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {location.growth > 0 ? '+' : ''}{location.growth}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </NeoCard>

          {/* Top Performing Drivers */}
          <NeoCard variant="raised">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h3>
            <div className="space-y-3">
              {analyticsData.topDrivers.map((driver, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{driver.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {driver.city} • {driver.trips} trips
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      ${driver.revenue.toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-yellow-600">
                      <Star className="w-3 h-3 mr-1" />
                      {driver.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </NeoCard>
        </div>

        {/* Payment Methods & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Methods */}
          <NeoCard variant="raised">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Credit Card</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {analyticsData.paymentMethods.creditCard.percentage}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ${analyticsData.paymentMethods.creditCard.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Wallet</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {analyticsData.paymentMethods.wallet.percentage}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ${analyticsData.paymentMethods.wallet.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Cash</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {analyticsData.paymentMethods.cash.percentage}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ${analyticsData.paymentMethods.cash.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </NeoCard>

          {/* System Health */}
          <NeoCard variant="raised">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-white">API Status</span>
                </div>
                <span className="text-green-600 font-medium">Operational</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Payment Gateway</span>
                </div>
                <span className="text-green-600 font-medium">Healthy</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Map Service</span>
                </div>
                <span className="text-yellow-600 font-medium">Slow Response</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Database</span>
                </div>
                <span className="text-green-600 font-medium">Optimal</span>
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Quick Actions */}
        <NeoCard variant="raised" className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <NeoButton variant="secondary" className="justify-start h-auto py-3">
              <Download className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Monthly Report</div>
                <div className="text-sm opacity-75">Export complete analytics</div>
              </div>
            </NeoButton>
            
            <NeoButton variant="secondary" className="justify-start h-auto py-3">
              <BarChart3 className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Custom Dashboard</div>
                <div className="text-sm opacity-75">Create custom views</div>
              </div>
            </NeoButton>
            
            <NeoButton variant="secondary" className="justify-start h-auto py-3">
              <TrendingUp className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Forecast Report</div>
                <div className="text-sm opacity-75">Revenue predictions</div>
              </div>
            </NeoButton>
            
            <NeoButton variant="secondary" className="justify-start h-auto py-3">
              <Clock className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Real-time Monitor</div>
                <div className="text-sm opacity-75">Live system status</div>
              </div>
            </NeoButton>
          </div>
        </NeoCard>

        <div className="pb-8"></div>
      </div>
    </div>
  )
}