'use client'

import { useEffect, useState } from 'react'
import { DriverDashboard } from '@/components/driver/driver-dashboard'
import { FairGoLogo } from '@/components/fairgo-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Car, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface DriverProfile {
  id: string
  licenseNumber: string
  vehicleNumber: string
  vehicleType: string
  vehicleModel: string
  vehicleColor: string
  isAvailable: boolean
  isVerified: boolean
  rating: number
  totalRides: number
  currentLocationLat: number
  currentLocationLng: number
}

export default function DriverDashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDriverProfile()
    } else {
      router.push('/auth')
    }
  }, [user, router])

  const fetchDriverProfile = async () => {
    try {
      const token = localStorage.getItem('fairgo_token')
      if (!token) return

      const response = await fetch('/api/drivers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const profile = await response.json()
        setDriverProfile(profile)
      } else {
        // If no driver profile exists, redirect to registration
        router.push('/driver/register')
      }
    } catch (error) {
      console.error('Failed to fetch driver profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold">Loading Driver Dashboard...</h3>
        </div>
      </div>
    )
  }

  if (!driverProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Driver Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You need to register as a driver to access the dashboard.
            </p>
            <Button 
              onClick={() => router.push('/driver/register')}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Register as Driver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show verification pending screen if not verified
  if (!driverProfile.isVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/booking')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <FairGoLogo />
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Verification in Progress</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for registering as a FairGo driver! Your application is currently under review.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">What happens next?</h3>
                  <ul className="text-sm text-yellow-700 space-y-1 text-left">
                    <li>• Our team will verify your documents within 24-48 hours</li>
                    <li>• You'll receive an email once verification is complete</li>
                    <li>• You can start accepting rides once approved</li>
                    <li>• For any queries, contact driver support</li>
                  </ul>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="font-medium">Documents</p>
                    <p className="text-gray-600">Under Review</p>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Car className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="font-medium">Vehicle</p>
                    <p className="text-gray-600">Pending Check</p>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="font-medium">Approval</p>
                    <p className="text-gray-600">24-48 Hours</p>
                  </div>
                </div>

                <div className="flex space-x-2 justify-center">
                  <Button variant="outline" size="sm">
                    📞 Contact Support
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push('/booking')}>
                    Back to Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <DriverDashboard driverId={driverProfile.id} />
  )
}