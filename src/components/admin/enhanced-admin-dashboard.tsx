/**
 * Enhanced Admin Dashboard Component
 * Real-time analytics, user management, and system monitoring
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  Car, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Shield,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'

// Analytics data types
interface DashboardMetrics {
  totalUsers: number
  activeDrivers: number
  pendingBookings: number
  completedToday: number
  revenue: {
    today: number
    thisMonth: number
    growth: number
  }
  systemHealth: {
    uptime: number
    responseTime: number
    errorRate: number
  }
}

interface LiveBooking {
  id: string
  user: string
  driver: string
  pickup: string
  destination: string
  status: 'pending' | 'accepted' | 'in_progress' | 'completed'
  timestamp: string
  fare: number
}

interface DriverActivity {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy'
  location: string
  completedRides: number
  rating: number
  earnings: number
}

// Mock data generators
const generateMockMetrics = (): DashboardMetrics => ({
  totalUsers: 15847,
  activeDrivers: 342,
  pendingBookings: 23,
  completedToday: 156,
  revenue: {
    today: 45230,
    thisMonth: 1250000,
    growth: 12.5
  },
  systemHealth: {
    uptime: 99.8,
    responseTime: 245,
    errorRate: 0.02
  }
})

const generateMockBookings = (): LiveBooking[] => [
  {
    id: 'BK001',
    user: 'Raj Kumar',
    driver: 'Suresh M.',
    pickup: 'Kochi Airport',
    destination: 'Marine Drive',
    status: 'in_progress',
    timestamp: '2 mins ago',
    fare: 180
  },
  {
    id: 'BK002',
    user: 'Priya S.',
    driver: 'Waiting...',
    pickup: 'MG Road',
    destination: 'InfoPark',
    status: 'pending',
    timestamp: '5 mins ago',
    fare: 120
  }
]

const generateMockDrivers = (): DriverActivity[] => [
  {
    id: 'DR001',
    name: 'Suresh M.',
    status: 'busy',
    location: 'Ernakulam',
    completedRides: 12,
    rating: 4.8,
    earnings: 2340
  },
  {
    id: 'DR002',
    name: 'Ravi K.',
    status: 'online',
    location: 'Kochi',
    completedRides: 8,
    rating: 4.6,
    earnings: 1560
  }
]

// Real-time data hook
const useRealTimeData = () => {
  const [metrics, setMetrics] = React.useState<DashboardMetrics>(generateMockMetrics())
  const [bookings, setBookings] = React.useState<LiveBooking[]>(generateMockBookings())
  const [drivers, setDrivers] = React.useState<DriverActivity[]>(generateMockDrivers())
  const [lastUpdate, setLastUpdate] = React.useState(Date.now())

  React.useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setMetrics(prev => ({
        ...prev,
        pendingBookings: Math.max(0, prev.pendingBookings + Math.floor(Math.random() * 5) - 2),
        completedToday: prev.completedToday + Math.floor(Math.random() * 2),
        revenue: {
          ...prev.revenue,
          today: prev.revenue.today + Math.floor(Math.random() * 200)
        }
      }))
      setLastUpdate(Date.now())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return { metrics, bookings, drivers, lastUpdate }
}

// Metrics overview component
const MetricsOverview: React.FC<{ metrics: DashboardMetrics }> = ({ metrics }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">+12% from last month</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
        <Car className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metrics.activeDrivers}</div>
        <p className="text-xs text-muted-foreground">Online right now</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">₹{metrics.revenue.today.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">+{metrics.revenue.growth}% growth</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metrics.pendingBookings}</div>
        <p className="text-xs text-muted-foreground">Awaiting drivers</p>
      </CardContent>
    </Card>
  </div>
)

// System health component
const SystemHealth: React.FC<{ health: DashboardMetrics['systemHealth'] }> = ({ health }) => (
  <Card className="col-span-2">
    <CardHeader>
      <CardTitle className="flex items-center">
        <Activity className="h-5 w-5 mr-2" />
        System Health
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Uptime</span>
          <span className="text-sm">{health.uptime}%</span>
        </div>
        <Progress value={health.uptime} className="h-2" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Response Time</span>
          <span className="text-sm">{health.responseTime}ms</span>
        </div>
        <Progress value={Math.max(0, 100 - health.responseTime / 10)} className="h-2" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Error Rate</span>
          <span className="text-sm">{health.errorRate}%</span>
        </div>
        <Progress value={Math.max(0, 100 - health.errorRate * 100)} className="h-2" />
      </div>
    </CardContent>
  </Card>
)

// Live bookings component
const LiveBookings: React.FC<{ bookings: LiveBooking[] }> = ({ bookings }) => (
  <Card className="col-span-3">
    <CardHeader>
      <CardTitle className="flex items-center">
        <MapPin className="h-5 w-5 mr-2" />
        Live Bookings
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{booking.id}</span>
                <Badge variant={
                  booking.status === 'completed' ? 'default' :
                  booking.status === 'in_progress' ? 'secondary' :
                  booking.status === 'accepted' ? 'outline' : 'destructive'
                }>
                  {booking.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {booking.user} → {booking.driver !== 'Waiting...' ? booking.driver : 'Unassigned'}
              </p>
              <p className="text-xs text-muted-foreground">
                {booking.pickup} → {booking.destination}
              </p>
            </div>
            <div className="text-right">
              <div className="font-medium">₹{booking.fare}</div>
              <div className="text-xs text-muted-foreground">{booking.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// Driver management component
const DriverManagement: React.FC<{ drivers: DriverActivity[] }> = ({ drivers }) => (
  <Card className="col-span-2">
    <CardHeader>
      <CardTitle className="flex items-center">
        <Car className="h-5 w-5 mr-2" />
        Driver Activity
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {drivers.map((driver) => (
          <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                driver.status === 'online' ? 'bg-green-500' :
                driver.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="font-medium">{driver.name}</p>
                <p className="text-sm text-muted-foreground">{driver.location}</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <div>{driver.completedRides} rides</div>
              <div className="text-muted-foreground">₹{driver.earnings}</div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// Main admin dashboard component
export const EnhancedAdminDashboard: React.FC = () => {
  const { metrics, bookings, drivers, lastUpdate } = useRealTimeData()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        </div>
        <Button size="sm" className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metrics Overview */}
      <MetricsOverview metrics={metrics} />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <SystemHealth health={metrics.systemHealth} />
            <LiveBookings bookings={bookings} />
          </div>
          <DriverManagement drivers={drivers} />
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
              <CardDescription>Manage and monitor all bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{booking.id}</span>
                        <Badge>{booking.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.user} • {booking.pickup} → {booking.destination}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Driver Management</CardTitle>
              <CardDescription>Monitor driver performance and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {drivers.map((driver) => (
                  <Card key={driver.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{driver.name}</h3>
                        <Badge variant={driver.status === 'online' ? 'default' : 'secondary'}>
                          {driver.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Location: {driver.location}</p>
                        <p>Rating: ⭐ {driver.rating}/5</p>
                        <p>Rides: {driver.completedRides}</p>
                        <p>Earnings: ₹{driver.earnings}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Revenue Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Today</span>
                    <span className="font-semibold">₹{metrics.revenue.today.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Month</span>
                    <span className="font-semibold">₹{metrics.revenue.thisMonth.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Growth</span>
                    <span className={`font-semibold ${metrics.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      +{metrics.revenue.growth}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Completed Rides</span>
                    <span className="font-semibold">{metrics.completedToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Drivers</span>
                    <span className="font-semibold">{metrics.activeDrivers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Response Time</span>
                    <span className="font-semibold">{metrics.systemHealth.responseTime}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">SSL Certificate Valid</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Firewall Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">2 Failed Login Attempts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  System Config
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Database</span>
                    <Badge variant="outline">Online</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cache</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Backup</span>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Export Data
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Send Notifications
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  System Maintenance
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}