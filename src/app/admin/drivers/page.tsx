'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { DriverVerificationCard } from '@/components/admin/admin-management'
import { 
  Car, 
  UserCheck, 
  Clock, 
  Download, 
  Upload,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Star,
  MapPin
} from 'lucide-react'

// Mock driver applications data
const mockDriverApplications = [
  {
    id: '1',
    name: 'Michael Torres',
    email: 'michael.torres@example.com',
    phone: '+1 (555) 123-4567',
    applicationDate: '2024-01-15',
    status: 'pending' as const,
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'Silver',
      plate: 'ABC123'
    },
    documents: {
      driversLicense: { status: 'uploaded', verified: false },
      insurance: { status: 'uploaded', verified: false },
      registration: { status: 'uploaded', verified: true },
      backgroundCheck: { status: 'pending', verified: false },
      vehicleInspection: { status: 'uploaded', verified: false }
    },
    location: 'New York, NY',
    referralCode: 'REF123',
    previousExperience: 'Uber - 2 years'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+1 (555) 234-5678',
    applicationDate: '2024-01-10',
    status: 'approved' as const,
    vehicle: {
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      color: 'Black',
      plate: 'XYZ789'
    },
    documents: {
      driversLicense: { status: 'uploaded', verified: true },
      insurance: { status: 'uploaded', verified: true },
      registration: { status: 'uploaded', verified: true },
      backgroundCheck: { status: 'completed', verified: true },
      vehicleInspection: { status: 'uploaded', verified: true }
    },
    location: 'Los Angeles, CA',
    referralCode: null,
    previousExperience: 'Lyft - 3 years',
    approvalDate: '2024-01-18',
    rating: 4.9,
    totalTrips: 45
  },
  {
    id: '3',
    name: 'James Rodriguez',
    email: 'j.rodriguez@example.com',
    phone: '+1 (555) 345-6789',
    applicationDate: '2024-01-05',
    status: 'rejected' as const,
    vehicle: {
      make: 'Ford',
      model: 'Focus',
      year: 2018,
      color: 'Blue',
      plate: 'DEF456'
    },
    documents: {
      driversLicense: { status: 'uploaded', verified: false },
      insurance: { status: 'expired', verified: false },
      registration: { status: 'uploaded', verified: false },
      backgroundCheck: { status: 'failed', verified: false },
      vehicleInspection: { status: 'missing', verified: false }
    },
    location: 'Chicago, IL',
    referralCode: 'REF456',
    previousExperience: 'None',
    rejectionDate: '2024-01-12',
    rejectionReason: 'Failed background check'
  },
  {
    id: '4',
    name: 'Lisa Chen',
    email: 'lisa.chen@example.com',
    phone: '+1 (555) 456-7890',
    applicationDate: '2024-01-20',
    status: 'pending' as const,
    vehicle: {
      make: 'Nissan',
      model: 'Altima',
      year: 2019,
      color: 'White',
      plate: 'GHI789'
    },
    documents: {
      driversLicense: { status: 'uploaded', verified: true },
      insurance: { status: 'uploaded', verified: true },
      registration: { status: 'uploaded', verified: false },
      backgroundCheck: { status: 'in-progress', verified: false },
      vehicleInspection: { status: 'uploaded', verified: false }
    },
    location: 'Miami, FL',
    referralCode: null,
    previousExperience: 'DoorDash - 1 year'
  },
  {
    id: '5',
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    phone: '+1 (555) 567-8901',
    applicationDate: '2024-01-12',
    status: 'under_review' as const,
    vehicle: {
      make: 'Chevrolet',
      model: 'Malibu',
      year: 2020,
      color: 'Gray',
      plate: 'JKL012'
    },
    documents: {
      driversLicense: { status: 'uploaded', verified: true },
      insurance: { status: 'uploaded', verified: true },
      registration: { status: 'uploaded', verified: true },
      backgroundCheck: { status: 'completed', verified: true },
      vehicleInspection: { status: 'requires_review', verified: false }
    },
    location: 'Houston, TX',
    referralCode: 'REF789',
    previousExperience: 'Taxi driver - 5 years'
  },
  {
    id: '6',
    name: 'Amanda Davis',
    email: 'amanda.davis@example.com',
    phone: '+1 (555) 678-9012',
    applicationDate: '2024-01-08',
    status: 'approved' as const,
    vehicle: {
      make: 'Hyundai',
      model: 'Elantra',
      year: 2022,
      color: 'Red',
      plate: 'MNO345'
    },
    documents: {
      driversLicense: { status: 'uploaded', verified: true },
      insurance: { status: 'uploaded', verified: true },
      registration: { status: 'uploaded', verified: true },
      backgroundCheck: { status: 'completed', verified: true },
      vehicleInspection: { status: 'uploaded', verified: true }
    },
    location: 'Phoenix, AZ',
    referralCode: 'REF012',
    previousExperience: 'Rideshare - 1.5 years',
    approvalDate: '2024-01-16',
    rating: 4.7,
    totalTrips: 23
  }
]

export default function AdminDriversPage() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedAction, setSelectedAction] = useState('')

  const handleApproveDriver = (driverId: string) => {
    console.log('Approving driver:', driverId)
  }

  const handleRejectDriver = (driverId: string, reason: string) => {
    console.log('Rejecting driver:', driverId, 'Reason:', reason)
  }

  const handleRequestDocuments = (driverId: string, documents: string[]) => {
    console.log('Requesting documents from driver:', driverId, documents)
  }

  const handleViewDocuments = (driverId: string) => {
    console.log('Viewing documents for driver:', driverId)
  }

  const handleBulkAction = () => {
    if (selectedAction) {
      console.log('Executing bulk action:', selectedAction)
    }
  }

  // Map the data structure to what DriverVerificationCard expects
  const mapToDriverApplication = (driverData: typeof mockDriverApplications[0]) => {
    return {
      id: driverData.id,
      driverName: driverData.name,
      email: driverData.email,
      phone: driverData.phone,
      licenseNumber: `DL${driverData.id}`, // Mock license number
      vehicleInfo: {
        make: driverData.vehicle.make,
        model: driverData.vehicle.model,
        year: driverData.vehicle.year,
        plate: driverData.vehicle.plate,
        color: driverData.vehicle.color
      },
      documents: {
        license: { 
          uploaded: driverData.documents.driversLicense.status === 'uploaded', 
          verified: driverData.documents.driversLicense.verified || false,
          url: undefined 
        },
        insurance: { 
          uploaded: driverData.documents.insurance.status === 'uploaded', 
          verified: driverData.documents.insurance.verified || false,
          url: undefined 
        },
        registration: { 
          uploaded: driverData.documents.registration.status === 'uploaded', 
          verified: driverData.documents.registration.verified || false,
          url: undefined 
        },
        background: { 
          uploaded: driverData.documents.backgroundCheck.status === 'completed', 
          verified: driverData.documents.backgroundCheck.verified || false,
          url: undefined 
        }
      },
      status: driverData.status,
      appliedDate: driverData.applicationDate,
      reviewedDate: driverData.approvalDate,
      notes: undefined
    }
  }

  // Filter applications based on selected filter
  const filteredApplications = mockDriverApplications.filter(app => {
    if (selectedFilter === 'all') return true
    return app.status === selectedFilter
  })

  // Calculate statistics
  const totalApplications = mockDriverApplications.length
  const pendingApplications = mockDriverApplications.filter(app => app.status === 'pending').length
  const approvedDrivers = mockDriverApplications.filter(app => app.status === 'approved').length
  const underReviewApplications = mockDriverApplications.filter(app => app.status === 'under_review').length
  const rejectedApplications = mockDriverApplications.filter(app => app.status === 'rejected').length
  const approvalRate = totalApplications > 0 ? Math.round((approvedDrivers / totalApplications) * 100) : 0

  return (
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark text-gray-900 dark:text-white">
      {/* Header */}
      <NeoCard variant="flat" className="rounded-none border-0 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Driver Applications
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Review and manage driver applications, verify documents, and approve new drivers
              </p>
            </div>
            
            <div className="flex space-x-3">
              <NeoButton variant="secondary">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </NeoButton>
              <NeoButton variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export Applications
              </NeoButton>
              <NeoButton variant="primary">
                <FileText className="w-4 h-4 mr-2" />
                Application Report
              </NeoButton>
            </div>
          </div>
        </div>
      </NeoCard>

      <div className="container mx-auto px-4">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalApplications}</p>
                <p className="text-sm text-blue-600">All time</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingApplications}</p>
                <p className="text-sm text-yellow-600">Require attention</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{approvedDrivers}</p>
                <p className="text-sm text-green-600">Active drivers</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Under Review</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{underReviewApplications}</p>
                <p className="text-sm text-orange-600">In progress</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{approvalRate}%</p>
                <p className="text-sm text-purple-600">Success rate</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Filters and Actions */}
        <NeoCard variant="raised" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending Review</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Bulk actions...</option>
                <option value="approve">Approve selected</option>
                <option value="reject">Reject selected</option>
                <option value="request_docs">Request documents</option>
                <option value="send_email">Send notification</option>
                <option value="export">Export selected</option>
              </select>
              
              <NeoButton 
                variant="secondary" 
                onClick={handleBulkAction}
                disabled={!selectedAction}
              >
                Apply Action
              </NeoButton>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredApplications.length} of {totalApplications} applications
              </div>
              <NeoButton variant="ghost" size="sm">
                Sort by date
              </NeoButton>
            </div>
          </div>
        </NeoCard>

        {/* Driver Applications List */}
        <div className="space-y-6">
          {filteredApplications.map((application) => (
            <DriverVerificationCard
              key={application.id}
              application={mapToDriverApplication(application)}
              onApprove={handleApproveDriver}
              onReject={handleRejectDriver}
              onRequestMoreInfo={(id) => handleRequestDocuments(id, [])}
              onViewDocument={(type, url) => handleViewDocuments(application.id)}
            />
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <NeoCard variant="raised" className="text-center py-12">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No applications found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedFilter === 'all' 
                ? 'There are no driver applications to display.' 
                : `There are no ${selectedFilter.replace('_', ' ')} applications.`}
            </p>
            {selectedFilter !== 'all' && (
              <NeoButton variant="secondary" onClick={() => setSelectedFilter('all')}>
                View all applications
              </NeoButton>
            )}
          </NeoCard>
        )}

        {/* Quick Actions Panel */}
        <NeoCard variant="raised" className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity & Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Sarah Wilson approved</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Driver application accepted</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">1 hour ago</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">James Rodriguez rejected</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Failed background check</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">3 hours ago</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">New application received</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Lisa Chen - Phoenix, AZ</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">5 hours ago</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-3">
                <NeoButton variant="secondary" className="justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Review pending applications ({pendingApplications})
                </NeoButton>
                
                <NeoButton variant="secondary" className="justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Check documents under review ({underReviewApplications})
                </NeoButton>
                
                <NeoButton variant="secondary" className="justify-start">
                  <Star className="w-4 h-4 mr-2" />
                  View top-rated drivers
                </NeoButton>
                
                <NeoButton variant="secondary" className="justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  Driver coverage by location
                </NeoButton>
                
                <NeoButton variant="secondary" className="justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate weekly report
                </NeoButton>
              </div>
            </div>
          </div>
        </NeoCard>

        <div className="pb-8"></div>
      </div>
    </div>
  )
}