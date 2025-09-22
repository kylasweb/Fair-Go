'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, Car, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

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

interface DriverRegistrationProps {
  onSubmit: (data: DriverRegistrationData, documents: DocumentUpload[]) => Promise<void>
}

export function DriverRegistration({ onSubmit }: DriverRegistrationProps) {
  const [formData, setFormData] = useState<DriverRegistrationData>({
    licenseNumber: '',
    vehicleNumber: '',
    vehicleType: '',
    vehicleModel: '',
    vehicleColor: '',
    experience: 0,
    address: '',
    emergencyContact: '',
    bankAccount: '',
    ifscCode: ''
  })

  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { type: 'LICENSE', file: null, status: 'pending' },
    { type: 'RC_BOOK', file: null, status: 'pending' },
    { type: 'INSURANCE', file: null, status: 'pending' },
    { type: 'PUC', file: null, status: 'pending' },
    { type: 'PROFILE_PHOTO', file: null, status: 'pending' },
    { type: 'AADHAR', file: null, status: 'pending' },
    { type: 'PAN', file: null, status: 'pending' }
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const vehicleTypes = [
    { value: 'AUTO_RICKSHAW', label: 'Auto Rickshaw', icon: '🛺' },
    { value: 'CAR_ECONOMY', label: 'Economy Car', icon: '🚗' },
    { value: 'CAR_PREMIUM', label: 'Premium Car', icon: '🚙' },
    { value: 'CAR_LUXURY', label: 'Luxury Car', icon: '🚘' },
    { value: 'SUV', label: 'SUV', icon: '🚙' },
    { value: 'BIKE', label: 'Bike', icon: '🏍️' }
  ]

  const documentTypes = {
    LICENSE: { name: 'Driving License', required: true },
    RC_BOOK: { name: 'RC Book', required: true },
    INSURANCE: { name: 'Insurance Certificate', required: true },
    PUC: { name: 'PUC Certificate', required: true },
    PROFILE_PHOTO: { name: 'Profile Photo', required: true },
    AADHAR: { name: 'Aadhar Card', required: true },
    PAN: { name: 'PAN Card', required: false }
  }

  const handleInputChange = (field: keyof DriverRegistrationData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDocumentUpload = (index: number, file: File) => {
    const newDocuments = [...documents]
    newDocuments[index] = {
      ...newDocuments[index],
      file,
      status: 'uploaded'
    }
    setDocuments(newDocuments)
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      await onSubmit(formData, documents)
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return formData.licenseNumber && formData.vehicleNumber && formData.vehicleType && 
               formData.vehicleModel && formData.vehicleColor
      case 2:
        return formData.experience > 0 && formData.address && formData.emergencyContact
      case 3:
        const requiredDocs = documents.filter(doc => documentTypes[doc.type as keyof typeof documentTypes].required)
        return requiredDocs.every(doc => doc.file !== null)
      default:
        return false
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'verifying':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Upload className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            <span className={`ml-2 text-sm ${
              step <= currentStep ? 'text-orange-600 font-medium' : 'text-gray-500'
            }`}>
              {step === 1 ? 'Vehicle Info' : step === 2 ? 'Personal Details' : 'Documents'}
            </span>
            {step < totalSteps && (
              <div className={`w-16 h-1 mx-4 ${
                step < currentStep ? 'bg-orange-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Vehicle Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-orange-500" />
              <span>Vehicle Information</span>
            </CardTitle>
            <CardDescription>
              Provide details about your vehicle and driving license
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license">Driving License Number</Label>
                <Input
                  id="license"
                  placeholder="DL-01202000012345"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Registration Number</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="KA01AB1234"
                  value={formData.vehicleNumber}
                  onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Vehicle Model</Label>
                <Input
                  id="vehicleModel"
                  placeholder="Swift Dzire"
                  value={formData.vehicleModel}
                  onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleColor">Vehicle Color</Label>
                <Input
                  id="vehicleColor"
                  placeholder="White"
                  value={formData.vehicleColor}
                  onChange={(e) => handleInputChange('vehicleColor', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Driving Experience (years)</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                onClick={() => setCurrentStep(2)}
                disabled={!isStepComplete(1)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Personal Details */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-orange-500" />
              <span>Personal & Bank Details</span>
            </CardTitle>
            <CardDescription>
              Provide your personal information and bank details for payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                placeholder="123, Main Street, Bangalore, Karnataka - 560001"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact Number</Label>
                <Input
                  id="emergencyContact"
                  placeholder="+91 98765 43210"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  id="bankAccount"
                  placeholder="1234567890"
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  placeholder="HDFC0001234"
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between space-x-2">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Previous
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)}
                disabled={!isStepComplete(2)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Document Upload */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-orange-500" />
              <span>Document Upload</span>
            </CardTitle>
            <CardDescription>
              Upload required documents for verification. All documents will be securely stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {documents.map((doc, index) => (
                <div key={doc.type} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {documentTypes[doc.type as keyof typeof documentTypes].name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(doc.status)}
                        <Badge variant={doc.status === 'uploaded' ? 'default' : 'secondary'}>
                          {doc.status === 'pending' && 'Pending'}
                          {doc.status === 'uploaded' && 'Uploaded'}
                          {doc.status === 'verifying' && 'Verifying'}
                          {doc.status === 'approved' && 'Approved'}
                          {doc.status === 'rejected' && 'Rejected'}
                        </Badge>
                        {documentTypes[doc.type as keyof typeof documentTypes].required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleDocumentUpload(index, file)
                        }
                      }}
                      className="hidden"
                      id={`doc-${doc.type}`}
                    />
                    <label
                      htmlFor={`doc-${doc.type}`}
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
                    >
                      {doc.file ? doc.file.name : 'Choose File'}
                    </label>
                  </div>

                  {doc.file && (
                    <div className="text-xs text-gray-500">
                      {Math.round(doc.file.size / 1024)} KB
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">📋 Document Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• All documents must be clear and readable</li>
                <li>• File size should be less than 5MB</li>
                <li>• Accepted formats: JPG, PNG, PDF</li>
                <li>• Documents will be verified within 24-48 hours</li>
              </ul>
            </div>

            <div className="flex justify-between space-x-2">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                Previous
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!isStepComplete(3) || isSubmitting}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}