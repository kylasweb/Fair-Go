'use client'

import { useEffect, useState } from 'react'
import { FairGoLogo } from '@/components/fairgo-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function DriverPendingPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [verificationStatus, setVerificationStatus] = useState('pending')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth')
    }
    
    // Check verification status periodically
    const interval = setInterval(checkVerificationStatus, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [user, router])

  const checkVerificationStatus = async () => {
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
        if (profile.isVerified) {
          setVerificationStatus('approved')
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/driver/dashboard')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Failed to check verification status:', error)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    checkVerificationStatus()
    setTimeout(() => setLoading(false), 1000)
  }

  const handleSignOut = async () => {
    await signOut()
  }

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
              {verificationStatus === 'pending' ? (
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-yellow-600 animate-pulse" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              )}
              
              <CardTitle className="text-2xl">
                {verificationStatus === 'pending' ? 'Verification in Progress' : 'Verification Approved!'}
              </CardTitle>
              
              <Badge 
                variant={verificationStatus === 'pending' ? 'secondary' : 'default'}
                className="mt-2"
              >
                {verificationStatus === 'pending' ? 'Under Review' : 'Approved'}
              </Badge>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              {verificationStatus === 'pending' ? (
                <>
                  <div className="space-y-4">
                    <p className="text-lg text-gray-600">
                      Thank you for registering as a FairGo driver! Your application is currently under review by our verification team.
                    </p>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-800 mb-3">📋 Verification Process</h3>
                      <div className="space-y-3 text-left">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">1</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Document Verification</p>
                            <p className="text-xs text-gray-600">Checking all submitted documents</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-purple-600">2</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Background Check</p>
                            <p className="text-xs text-gray-600">Driving record and background verification</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-green-600">3</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Vehicle Inspection</p>
                            <p className="text-xs text-gray-600">Vehicle condition and compliance check</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-orange-600">4</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Final Approval</p>
                            <p className="text-xs text-gray-600">Account activation and setup</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="font-medium">Response Time</p>
                        <p className="text-gray-600">24-48 hours</p>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="font-medium">Success Rate</p>
                        <p className="text-gray-600">95% approval</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">💡 Tips for Faster Approval:</h4>
                      <ul className="text-sm text-blue-700 space-y-1 text-left">
                        <li>• Ensure all documents are clear and readable</li>
                        <li>• Make sure vehicle details are accurate</li>
                        <li>• Keep your phone nearby for any verification calls</li>
                        <li>• Check your email regularly for updates</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg text-gray-600">
                    🎉 Congratulations! Your driver application has been approved and your account is now active.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">✅ What's Next?</h3>
                    <ul className="text-sm text-green-700 space-y-1 text-left">
                      <li>• You can now access your driver dashboard</li>
                      <li>• Start accepting ride requests immediately</li>
                      <li>• Track your earnings and ride history</li>
                      <li>• Access 24/7 driver support</li>
                    </ul>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Redirecting to your dashboard...
                    </p>
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Check Status
                </Button>
                
                <Button variant="outline">
                  📞 Contact Support
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/booking')}
                >
                  Back to Booking
                </Button>
              </div>

              {verificationStatus === 'pending' && (
                <div className="text-xs text-gray-500">
                  <p>
                    This page automatically checks your verification status every 30 seconds.
                    You can also manually check by clicking "Check Status".
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}