'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DriverRegistration } from '@/components/driver/driver-registration'
import { FairGoLogo } from '@/components/fairgo-logo'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DriverRegistrationData {
  licenseNumber: string
  vehicleNumber: string
  vehicleType: string
  vehicleModel: string
  vehicleColor: string
  experience: number
  address: string
  emergencyContact: string
  bankAccount: string
  ifscCode: string
}

interface DocumentUpload {
  type: string
  file: File | null
  status: 'pending' | 'uploaded' | 'verifying' | 'approved' | 'rejected'
  url?: string
}

export default function DriverRegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegistration = async (data: DriverRegistrationData, documents: DocumentUpload[]) => {
    try {
      setIsSubmitting(true)
      
      const token = localStorage.getItem('fairgo_token')
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to register as a driver',
          variant: 'destructive'
        })
        router.push('/auth')
        return
      }

      // Convert files to base64 for API submission
      const processedDocuments = await Promise.all(
        documents.map(async (doc) => {
          if (doc.file) {
            const base64 = await fileToBase64(doc.file)
            return {
              type: doc.type,
              file: base64,
              fileType: doc.file.type,
              status: doc.status
            }
          }
          return {
            type: doc.type,
            file: null,
            fileType: '',
            status: doc.status
          }
        })
      )

      const formData = new FormData()
      formData.append('driverData', JSON.stringify(data))
      formData.append('documents', JSON.stringify(processedDocuments))

      const response = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Registration Submitted!',
          description: 'Your driver registration has been submitted successfully. You will receive a verification email within 24-48 hours.',
        })
        
        // Redirect to driver dashboard or pending verification page
        setTimeout(() => {
          router.push('/driver/pending')
        }, 2000)
      } else {
        toast({
          title: 'Registration Failed',
          description: result.message || 'Failed to submit registration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: 'Registration Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/booking">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <FairGoLogo />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Become a FairGo Driver
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Join our network of professional drivers and earn on your own terms. 
              Flexible hours, competitive earnings, and 24/7 support.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  💰
                </div>
                <h3 className="font-semibold mb-1">Competitive Earnings</h3>
                <p className="text-sm text-gray-600">Earn up to ₹40,000+ per month</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  ⏰
                </div>
                <h3 className="font-semibold mb-1">Flexible Hours</h3>
                <p className="text-sm text-gray-600">Work when you want, where you want</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  🛡️
                </div>
                <h3 className="font-semibold mb-1">Safety First</h3>
                <p className="text-sm text-gray-600">24/7 support and insurance coverage</p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-orange-800 mb-4">📋 Requirements to Join</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-orange-700 mb-2">Vehicle Requirements:</h3>
                <ul className="text-sm text-orange-600 space-y-1">
                  <li>• Vehicle should be less than 10 years old</li>
                  <li>• Valid commercial insurance</li>
                  <li>• Valid PUC certificate</li>
                  <li>• Well-maintained and clean condition</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-orange-700 mb-2">Driver Requirements:</h3>
                <ul className="text-sm text-orange-600 space-y-1">
                  <li>• Valid driving license (minimum 1 year)</li>
                  <li>• Android smartphone (4G+)</li>
                  <li>• Good communication skills</li>
                  <li>• Clean background record</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          {isSubmitting ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Submitting Registration...</h3>
              <p className="text-gray-600">Please wait while we process your application</p>
            </div>
          ) : (
            <DriverRegistration onSubmit={handleRegistration} />
          )}

          {/* Support Section */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Need help with registration? Contact our driver support team
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">
                📞 Call Support
              </Button>
              <Button variant="outline" size="sm">
                💬 Live Chat
              </Button>
              <Button variant="outline" size="sm">
                📧 Email Support
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}