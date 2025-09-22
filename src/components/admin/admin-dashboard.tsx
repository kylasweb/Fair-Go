'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Settings,
  LogOut,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  Activity,
  MapPin,
  Phone,
  Star,
  BookOpen,
  FileText,
  Code,
  Bot,
  HelpCircle,
  Lightbulb,
  Terminal,
  Database,
  Shield,
  Zap
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalDrivers: number
  totalBookings: number
  totalRevenue: number
  activeDrivers: number
  pendingVerifications: number
  todayBookings: number
  todayRevenue: number
}

interface Booking {
  id: string
  status: string
  pickupLocation: string
  dropLocation: string
  estimatedPrice: number
  createdAt: string
  user: {
    name: string
    email: string
  }
  driver?: {
    name: string
    vehicleNumber: string
  }
}

interface Driver {
  id: string
  name: string
  email: string
  vehicleNumber: string
  vehicleType: string
  isVerified: boolean
  isAvailable: boolean
  rating: number
  totalRides: number
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
  totalBookings: number
}

interface AIPrompt {
  id: string
  name: string
  language: string
  prompt: string
  isActive: boolean
  version: number
  createdAt: string
}

interface AdminDashboardProps {
  onSignOut: () => void
}

export function AdminDashboard({ onSignOut }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    pendingVerifications: 0,
    todayBookings: 0,
    todayRevenue: 0
  })

  const [bookings, setBookings] = useState<Booking[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demo
      setStats({
        totalUsers: 15420,
        totalDrivers: 2850,
        totalBookings: 45680,
        totalRevenue: 6852000,
        activeDrivers: 1240,
        pendingVerifications: 45,
        todayBookings: 1240,
        todayRevenue: 185000
      })

      // Mock bookings data
      setBookings([
        {
          id: '1',
          status: 'COMPLETED',
          pickupLocation: 'MG Road, Bangalore',
          dropLocation: 'Koramangala, Bangalore',
          estimatedPrice: 150,
          createdAt: '2024-01-15T10:30:00Z',
          user: { name: 'Rahul Sharma', email: 'rahul@email.com' },
          driver: { name: 'Rajesh Kumar', vehicleNumber: 'KA01AB1234' }
        },
        {
          id: '2',
          status: 'IN_PROGRESS',
          pickupLocation: 'Indiranagar, Bangalore',
          dropLocation: 'Airport Road, Bangalore',
          estimatedPrice: 200,
          createdAt: '2024-01-15T14:20:00Z',
          user: { name: 'Priya Singh', email: 'priya@email.com' },
          driver: { name: 'Amit Patel', vehicleNumber: 'KA01CD5678' }
        }
      ])

      // Mock drivers data
      setDrivers([
        {
          id: '1',
          name: 'Rajesh Kumar',
          email: 'rajesh@email.com',
          vehicleNumber: 'KA01AB1234',
          vehicleType: 'CAR_ECONOMY',
          isVerified: true,
          isAvailable: true,
          rating: 4.8,
          totalRides: 1250,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Amit Patel',
          email: 'amit@email.com',
          vehicleNumber: 'KA01CD5678',
          vehicleType: 'CAR_PREMIUM',
          isVerified: false,
          isAvailable: false,
          rating: 4.6,
          totalRides: 890,
          createdAt: '2024-01-05T00:00:00Z'
        }
      ])

      // Mock users data
      setUsers([
        {
          id: '1',
          name: 'Rahul Sharma',
          email: 'rahul@email.com',
          phone: '+91 98765 43210',
          createdAt: '2024-01-01T00:00:00Z',
          totalBookings: 45
        },
        {
          id: '2',
          name: 'Priya Singh',
          email: 'priya@email.com',
          phone: '+91 87654 32109',
          createdAt: '2024-01-02T00:00:00Z',
          totalBookings: 23
        }
      ])

      // Mock AI prompts data
      setAiPrompts([
        {
          id: '1',
          name: 'Malayalam Booking Prompt',
          language: 'ml',
          prompt: 'നിങ്ങൾ ഫെയർഗോയ്‌ക്കുള്ള AI സഹായിയാണ്, ഇന്ത്യയിലെ ഒരു ടാക്സി ബുക്കിംഗ് പ്ലാറ്റ്‌ഫോമാണ്...',
          isActive: true,
          version: 1,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'English Booking Prompt',
          language: 'en',
          prompt: 'You are an AI assistant for FairGo...',
          isActive: true,
          version: 1,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'Manglish Booking Prompt',
          language: 'ml-en',
          prompt: 'You are an AI assistant for FairGo that understands Malayalam-English mixed speech...',
          isActive: true,
          version: 1,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '4',
          name: 'Hindi Booking Prompt',
          language: 'hi',
          prompt: 'आप फेयरगो के लिए एक एआई सहायक हैं...',
          isActive: true,
          version: 2,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ])

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'ACCEPTED': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REQUESTED': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge className="bg-green-100 text-green-800">Verified</Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">FairGo Management Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={onSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
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
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-600">+12% from last month</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Drivers</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalDrivers.toLocaleString()}</p>
                  <p className="text-xs text-green-600">{stats.activeDrivers} active</p>
                </div>
                <Car className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalBookings.toLocaleString()}</p>
                  <p className="text-xs text-green-600">{stats.todayBookings} today</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-green-600">{formatCurrency(stats.todayRevenue)} today</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for pending verifications */}
        {stats.pendingVerifications > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Pending Driver Verifications</p>
                    <p className="text-sm text-yellow-700">{stats.pendingVerifications} drivers awaiting verification</p>
                  </div>
                </div>
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                  Review Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="ai-prompts">AI Prompts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>New user registration</span>
                      <span className="text-gray-500">2 min ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Driver document uploaded</span>
                      <span className="text-gray-500">5 min ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Booking completed</span>
                      <span className="text-gray-500">12 min ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Payment processed</span>
                      <span className="text-gray-500">15 min ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span>Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Users (24h)</span>
                      <span className="font-semibold">1,248</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completion Rate</span>
                      <span className="font-semibold text-green-600">94.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Rating</span>
                      <span className="font-semibold">4.7/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Server Uptime</span>
                      <span className="font-semibold text-green-600">99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>
                  Manage and monitor all ride bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Booking #{booking.id}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-lg font-semibold text-green-600 mt-1">
                            {formatCurrency(booking.estimatedPrice)}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Customer</p>
                          <p>{booking.user.name}</p>
                          <p className="text-gray-500">{booking.user.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Route</p>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-green-500" />
                            <span className="truncate">{booking.pickupLocation}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-red-500" />
                            <span className="truncate">{booking.dropLocation}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600">Driver</p>
                          {booking.driver ? (
                            <>
                              <p>{booking.driver.name}</p>
                              <p className="text-gray-500">{booking.driver.vehicleNumber}</p>
                            </>
                          ) : (
                            <p className="text-gray-500">Not assigned</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-3 border-t">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Driver Management</CardTitle>
                <CardDescription>
                  Manage driver accounts, verifications, and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{driver.name}</h4>
                          <p className="text-sm text-gray-500">{driver.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getVerificationBadge(driver.isVerified)}
                          <Badge variant={driver.isAvailable ? 'default' : 'secondary'}>
                            {driver.isAvailable ? 'Available' : 'Offline'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Vehicle</p>
                          <p>{driver.vehicleNumber}</p>
                          <p className="text-gray-500">{driver.vehicleType.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Rating</p>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{driver.rating}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Rides</p>
                          <p>{driver.totalRides}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Joined</p>
                          <p>{new Date(driver.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-3 border-t">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                        {!driver.isVerified && (
                          <Button size="sm" className="bg-green-500 hover:bg-green-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.phone && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{user.phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Bookings</p>
                          <p className="font-semibold">{user.totalBookings}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t text-sm text-gray-500">
                        <p>Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-prompts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI System Prompts</CardTitle>
                <CardDescription>
                  Manage AI prompts for different languages and use cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiPrompts.map((prompt) => (
                    <div key={prompt.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{prompt.name}</h4>
                          <p className="text-sm text-gray-500">
                            Language: {prompt.language.toUpperCase()} • Version: {prompt.version}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={prompt.isActive ? 'default' : 'secondary'}>
                            {prompt.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {prompt.prompt}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t text-sm text-gray-500">
                        <p>Created {new Date(prompt.createdAt).toLocaleDateString()}</p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Test
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    Create New Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span>Revenue Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mr-2" />
                    <span>Revenue chart would be displayed here</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-purple-500" />
                    <span>Booking Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <PieChart className="w-12 h-12 mr-2" />
                    <span>Booking distribution chart would be displayed here</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">94.2%</p>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">4.7</p>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">2.4</p>
                    <p className="text-sm text-gray-600">Avg Wait Time (min)</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">98.5%</p>
                    <p className="text-sm text-gray-600">On-time Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge-base" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Getting Started Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <span>Getting Started</span>
                  </CardTitle>
                  <CardDescription>
                    Quick start guides and essential tutorials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">Platform Overview</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Understanding FairGo's architecture and core features
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">Admin Dashboard Guide</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Complete walkthrough of admin dashboard features
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">User Management</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Managing users, drivers, and permissions effectively
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">Booking Management</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Handling bookings, cancellations, and disputes
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* API Documentation Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="w-5 h-5 text-blue-500" />
                    <span>API Documentation</span>
                  </CardTitle>
                  <CardDescription>
                    Complete API reference and integration guides
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">Authentication API</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      JWT tokens, API keys, and OAuth integration
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      /api/auth/*
                    </Badge>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">Booking API</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Create, track, and manage ride bookings
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      /api/bookings/*
                    </Badge>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">External Services API</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Payment gateways, maps, and partner integrations
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      /api/external/*
                    </Badge>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">WebSocket API</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Real-time communication and live tracking
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      /ws/tracking/*
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* AI Agents Documentation Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-green-500" />
                    <span>AI Agents Guide</span>
                  </CardTitle>
                  <CardDescription>
                    AI-powered voice booking and conversational agents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">AI Agent Foundry</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Creating and managing AI agents with workflows
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">Voice IVR System</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Conversational AI for voice-based bookings
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">Prompt Engineering</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Best practices for AI prompt design and optimization
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-semibold text-sm">Training & Fine-tuning</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Custom model training and performance optimization
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Documentation Sections */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* How-to Guides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                    <span>How-to Guides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <details className="group border rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium">
                        How to Set Up Payment Gateways
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 space-y-2">
                        <p><strong>1. Razorpay Integration:</strong></p>
                        <code className="block bg-gray-100 p-2 rounded text-xs">
                          RAZORPAY_KEY_ID=your_key_id<br/>
                          RAZORPAY_KEY_SECRET=your_secret
                        </code>
                        <p><strong>2. Configure Webhooks:</strong></p>
                        <p>Add webhook URL: <code>https://yourapp.com/api/external/payment/razorpay/webhook</code></p>
                        <p><strong>3. Test Payment Flow:</strong></p>
                        <p>Use test cards to verify payment processing works correctly.</p>
                      </div>
                    </details>

                    <details className="group border rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium">
                        How to Configure AI Voice Agents
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 space-y-2">
                        <p><strong>1. Create New Agent:</strong></p>
                        <p>Go to AI Prompts tab → Add New Agent → Configure voice settings</p>
                        <p><strong>2. Set System Prompt:</strong></p>
                        <code className="block bg-gray-100 p-2 rounded text-xs">
                          "You are a helpful FairGo booking assistant. Help customers book rides in Kerala with local knowledge."
                        </code>
                        <p><strong>3. Configure Speech Settings:</strong></p>
                        <p>Voice: en-IN-Neural2-C, Speed: 1.0, Language: English/Malayalam</p>
                        <p><strong>4. Test Agent:</strong></p>
                        <p>Use the test interface to verify responses and voice quality.</p>
                      </div>
                    </details>

                    <details className="group border rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium">
                        How to Monitor System Performance
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 space-y-2">
                        <p><strong>1. Use Analytics Dashboard:</strong></p>
                        <p>Monitor key metrics like booking completion rate, response times</p>
                        <p><strong>2. Check API Health:</strong></p>
                        <p>Visit <code>/api/external/status</code> for service health</p>
                        <p><strong>3. Review Error Logs:</strong></p>
                        <p>Check application logs for errors and performance issues</p>
                        <p><strong>4. Set Up Alerts:</strong></p>
                        <p>Configure monitoring alerts for critical system failures</p>
                      </div>
                    </details>

                    <details className="group border rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium">
                        How to Handle Emergency Situations
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 space-y-2">
                        <p><strong>1. Emergency Alert Types:</strong></p>
                        <p>Accident, Medical, Security, Vehicle Breakdown</p>
                        <p><strong>2. Response Protocol:</strong></p>
                        <p>Automatic alerts to police, medical, and company support</p>
                        <p><strong>3. Driver Support:</strong></p>
                        <p>24/7 support hotline and emergency contact procedures</p>
                        <p><strong>4. Customer Communication:</strong></p>
                        <p>Automated status updates and support coordination</p>
                      </div>
                    </details>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Documentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Terminal className="w-5 h-5 text-gray-600" />
                    <span>Technical Documentation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <details className="group border rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium">
                        System Architecture Overview
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 space-y-2">
                        <p><strong>Frontend:</strong> Next.js 14 with TypeScript and Tailwind CSS</p>
                        <p><strong>Backend:</strong> Node.js with Express and Prisma ORM</p>
                        <p><strong>Database:</strong> SQLite for development, PostgreSQL for production</p>
                        <p><strong>AI Services:</strong> OpenAI GPT-4, Google Cloud Speech & TTS</p>
                        <p><strong>External APIs:</strong> Razorpay, Google Maps, Partner platforms</p>
                        <p><strong>Real-time:</strong> WebSocket for live tracking and voice calls</p>
                        <p><strong>Security:</strong> JWT authentication, API key management, rate limiting</p>
                      </div>
                    </details>

                    <details className="group border rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium">
                        Database Schema
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 space-y-2">
                        <p><strong>Core Tables:</strong></p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Users - Customer and driver profiles</li>
                          <li>Bookings - Ride requests and status</li>
                          <li>Payments - Transaction records</li>
                          <li>AI Agents - Voice assistant configurations</li>
                          <li>API Credentials - External service keys</li>
                        </ul>
                        <p><strong>Relationships:</strong></p>
                        <p>Users → Bookings (1:many), Bookings → Payments (1:1)</p>
                        <p><strong>Migration Commands:</strong></p>
                        <code className="block bg-gray-100 p-2 rounded text-xs">
                          npx prisma migrate dev<br/>
                          npx prisma generate
                        </code>
                      </div>
                    </details>

                    <details className="group border rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium">
                        API Security & Authentication
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 space-y-2">
                        <p><strong>Authentication Methods:</strong></p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>JWT tokens for user sessions</li>
                          <li>API keys for external integrations</li>
                          <li>OAuth for partner platforms</li>
                        </ul>
                        <p><strong>Rate Limiting:</strong></p>
                        <p>Auth: 5/15min, Booking: 10/min, Payment: 20/5min</p>
                        <p><strong>Security Headers:</strong></p>
                        <p>CORS, CSP, HSTS, and request validation</p>
                      </div>
                    </details>

                    <details className="group border rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium">
                        Deployment & Environment Setup
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 space-y-2">
                        <p><strong>Environment Variables:</strong></p>
                        <code className="block bg-gray-100 p-2 rounded text-xs">
                          DATABASE_URL="your_db_url"<br/>
                          OPENAI_API_KEY="your_openai_key"<br/>
                          GOOGLE_CLOUD_KEY="your_gcp_key"<br/>
                          RAZORPAY_KEY_ID="your_razorpay_key"
                        </code>
                        <p><strong>Docker Deployment:</strong></p>
                        <code className="block bg-gray-100 p-2 rounded text-xs">
                          docker build -t fairgo .<br/>
                          docker run -p 3000:3000 fairgo
                        </code>
                        <p><strong>Health Checks:</strong></p>
                        <p>Monitor at <code>/api/health</code> and <code>/api/external/status</code></p>
                      </div>
                    </details>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Reference Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Security Best Practices</h4>
                  <p className="text-xs text-gray-600 mt-2">
                    HTTPS, API key rotation, input validation, secure headers
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Database className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Database Management</h4>
                  <p className="text-xs text-gray-600 mt-2">
                    Migrations, backups, indexing, query optimization
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Performance Tuning</h4>
                  <p className="text-xs text-gray-600 mt-2">
                    Caching, CDN, database optimization, monitoring
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <HelpCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Support & Troubleshooting</h4>
                  <p className="text-xs text-gray-600 mt-2">
                    Common issues, debug logs, error resolution, support tickets
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* API Quick Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span>API Quick Reference</span>
                </CardTitle>
                <CardDescription>
                  Common API endpoints and usage examples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2">Authentication</h4>
                      <div className="space-y-2 text-xs">
                        <div className="bg-gray-100 p-2 rounded">
                          <code>POST /api/auth/signin</code>
                          <p className="text-gray-600 mt-1">User login with email/password</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                          <code>POST /api/auth/signup</code>
                          <p className="text-gray-600 mt-1">Create new user account</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                          <code>GET /api/auth/me</code>
                          <p className="text-gray-600 mt-1">Get current user profile</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2">Bookings</h4>
                      <div className="space-y-2 text-xs">
                        <div className="bg-gray-100 p-2 rounded">
                          <code>POST /api/bookings</code>
                          <p className="text-gray-600 mt-1">Create new ride booking</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                          <code>GET /api/bookings/:id</code>
                          <p className="text-gray-600 mt-1">Get booking details</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                          <code>PUT /api/bookings/:id/cancel</code>
                          <p className="text-gray-600 mt-1">Cancel existing booking</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2">External Services</h4>
                      <div className="space-y-2 text-xs">
                        <div className="bg-gray-100 p-2 rounded">
                          <code>POST /api/external/payment/razorpay/create</code>
                          <p className="text-gray-600 mt-1">Create payment order</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                          <code>POST /api/external/maps/directions</code>
                          <p className="text-gray-600 mt-1">Get route directions</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                          <code>GET /api/external/status</code>
                          <p className="text-gray-600 mt-1">Check service health</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2">AI Services</h4>
                      <div className="space-y-2 text-xs">
                        <div className="bg-gray-100 p-2 rounded">
                          <code>POST /api/ai/voice/booking</code>
                          <p className="text-gray-600 mt-1">Process voice booking</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                          <code>GET /api/ai/agents</code>
                          <p className="text-gray-600 mt-1">List AI agents</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                          <code>POST /api/ai/agents/:id/test</code>
                          <p className="text-gray-600 mt-1">Test AI agent response</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-sm text-blue-800 mb-2">Example Request</h4>
                  <pre className="text-xs text-blue-700 overflow-x-auto">
{`curl -X POST https://api.fairgo.com/api/bookings \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pickupLocation": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "address": "MG Road, Bangalore"
    },
    "dropoffLocation": {
      "latitude": 13.0827,
      "longitude": 80.2707,
      "address": "Marina Beach, Chennai"
    },
    "vehicleType": "HATCHBACK"
  }'`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}