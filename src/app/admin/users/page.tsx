'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { UserManagementTable } from '@/components/admin/admin-management'
import { 
  Users, 
  UserPlus, 
  Download, 
  Upload,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone
} from 'lucide-react'

// Mock user data
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    status: 'active' as const,
    joinDate: '2023-01-15',
    lastLogin: '2024-01-20',
    totalRides: 127,
    rating: 4.8,
    isVerified: true,
    location: 'New York, NY'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 234-5678',
    status: 'active' as const,
    joinDate: '2023-03-22',
    lastLogin: '2024-01-19',
    totalRides: 89,
    rating: 4.9,
    isVerified: true,
    location: 'Los Angeles, CA'
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@example.com',
    phone: '+1 (555) 345-6789',
    status: 'suspended' as const,
    joinDate: '2023-06-10',
    lastLogin: '2024-01-15',
    totalRides: 45,
    rating: 3.2,
    isVerified: false,
    location: 'Chicago, IL'
  },
  {
    id: '4',
    name: 'Emma Wilson',
    email: 'emma.wilson@example.com',
    phone: '+1 (555) 456-7890',
    status: 'active' as const,
    joinDate: '2023-08-05',
    lastLogin: '2024-01-18',
    totalRides: 156,
    rating: 4.7,
    isVerified: true,
    location: 'Miami, FL'
  },
  {
    id: '5',
    name: 'David Rodriguez',
    email: 'd.rodriguez@example.com',
    phone: '+1 (555) 567-8901',
    status: 'inactive' as const,
    joinDate: '2023-02-28',
    lastLogin: '2023-12-20',
    totalRides: 23,
    rating: 4.1,
    isVerified: false,
    location: 'Houston, TX'
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    phone: '+1 (555) 678-9012',
    status: 'banned' as const,
    joinDate: '2023-04-12',
    lastLogin: '2024-01-10',
    totalRides: 67,
    rating: 2.8,
    isVerified: true,
    location: 'Phoenix, AZ'
  },
  {
    id: '7',
    name: 'Robert Taylor',
    email: 'r.taylor@example.com',
    phone: '+1 (555) 789-0123',
    status: 'active' as const,
    joinDate: '2023-07-20',
    lastLogin: '2024-01-21',
    totalRides: 98,
    rating: 4.5,
    isVerified: true,
    location: 'Seattle, WA'
  },
  {
    id: '8',
    name: 'Jennifer Brown',
    email: 'j.brown@example.com',
    phone: '+1 (555) 890-1234',
    status: 'active' as const,
    joinDate: '2023-09-18',
    lastLogin: '2024-01-17',
    totalRides: 34,
    rating: 4.6,
    isVerified: false,
    location: 'Denver, CO'
  }
]

export default function AdminUsersPage() {
  const [selectedAction, setSelectedAction] = useState('')

  const handleViewUser = (userId: string) => {
    console.log('Viewing user:', userId)
  }

  const handleEditUser = (userId: string) => {
    console.log('Editing user:', userId)
  }

  const handleSuspendUser = (userId: string) => {
    console.log('Suspending user:', userId)
  }

  const handleActivateUser = (userId: string) => {
    console.log('Activating user:', userId)
  }

  const handleBanUser = (userId: string) => {
    console.log('Banning user:', userId)
  }

  const handleBulkAction = () => {
    if (selectedAction) {
      console.log('Executing bulk action:', selectedAction)
    }
  }

  // Calculate statistics
  const totalUsers = mockUsers.length
  const activeUsers = mockUsers.filter(u => u.status === 'active').length
  const verifiedUsers = mockUsers.filter(u => u.isVerified).length
  const suspendedUsers = mockUsers.filter(u => u.status === 'suspended').length
  const newUsersThisMonth = mockUsers.filter(u => {
    const joinDate = new Date(u.joinDate)
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return joinDate >= firstDayOfMonth
  }).length

  return (
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark text-gray-900 dark:text-white">
      {/* Header */}
      <NeoCard variant="flat" className="rounded-none border-0 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                User Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage user accounts, verify identities, and monitor user activity
              </p>
            </div>
            
            <div className="flex space-x-3">
              <NeoButton variant="secondary">
                <Upload className="w-4 h-4 mr-2" />
                Import Users
              </NeoButton>
              <NeoButton variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </NeoButton>
              <NeoButton variant="primary">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
                <p className="text-sm text-blue-600">All registered users</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeUsers}</p>
                <p className="text-sm text-green-600">{Math.round((activeUsers/totalUsers)*100)}% of total</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verified</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{verifiedUsers}</p>
                <p className="text-sm text-purple-600">{Math.round((verifiedUsers/totalUsers)*100)}% verified</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspended</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{suspendedUsers}</p>
                <p className="text-sm text-yellow-600">Require attention</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{newUsersThisMonth}</p>
                <p className="text-sm text-orange-600">Recent signups</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Bulk Actions */}
        <NeoCard variant="raised" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select bulk action...</option>
                <option value="activate">Activate selected users</option>
                <option value="suspend">Suspend selected users</option>
                <option value="verify">Mark as verified</option>
                <option value="export">Export selected users</option>
                <option value="email">Send bulk email</option>
              </select>
              
              <NeoButton 
                variant="secondary" 
                onClick={handleBulkAction}
                disabled={!selectedAction}
              >
                Apply to Selected
              </NeoButton>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Quick filters:
              </div>
              <NeoButton variant="ghost" size="sm">
                New users
              </NeoButton>
              <NeoButton variant="ghost" size="sm">
                Unverified
              </NeoButton>
              <NeoButton variant="ghost" size="sm">
                High activity
              </NeoButton>
            </div>
          </div>
        </NeoCard>

        {/* User Management Table */}
        <UserManagementTable
          users={mockUsers}
          onViewUser={handleViewUser}
          onEditUser={handleEditUser}
          onSuspendUser={handleSuspendUser}
          onActivateUser={handleActivateUser}
          onBanUser={handleBanUser}
        />

        {/* Recent Activity Summary */}
        <NeoCard variant="raised" className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">5 new users registered</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">In the last 24 hours</div>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Email verification campaign sent</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">To 23 unverified users</div>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">5 hours ago</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">User suspended for policy violation</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Mike Chen - Inappropriate behavior</div>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">1 day ago</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Bulk verification completed</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">18 users verified successfully</div>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">2 days ago</div>
            </div>
          </div>
        </NeoCard>

        <div className="pb-8"></div>
      </div>
    </div>
  )
}