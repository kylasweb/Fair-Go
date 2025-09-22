'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { UserProfileCard, StatsCard, ActionButtonGroup } from '@/components/user/user-profile-card'
import { 
  User, 
  Settings, 
  CreditCard, 
  History, 
  Bell,
  Shield,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  Car,
  DollarSign,
  Clock,
  Award
} from 'lucide-react'

// Mock data - in a real app this would come from an API
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  address: '123 Main St, New York, NY 10001',
  joinDate: '2023-01-15',
  avatar: undefined,
  rating: 4.8,
  totalRides: 127,
  isVerified: true,
  status: 'active' as const
}

const mockStats = [
  {
    title: 'Total Rides',
    value: mockUser.totalRides,
    icon: <Car className="w-6 h-6 text-orange-500" />,
    trend: { value: 12, isPositive: true }
  },
  {
    title: 'Average Rating',
    value: mockUser.rating.toFixed(1),
    icon: <Star className="w-6 h-6 text-yellow-500" />
  },
  {
    title: 'Total Spent',
    value: '$2,847',
    icon: <DollarSign className="w-6 h-6 text-green-500" />,
    trend: { value: 8, isPositive: false }
  },
  {
    title: 'Member Since',
    value: new Date(mockUser.joinDate).getFullYear(),
    icon: <Calendar className="w-6 h-6 text-blue-500" />
  }
]

const mockRecentActivity = [
  {
    id: '1',
    type: 'ride',
    description: 'Trip to Downtown Mall',
    date: '2024-01-20T14:30:00Z',
    amount: '$23.45',
    status: 'completed'
  },
  {
    id: '2',
    type: 'payment',
    description: 'Payment method added',
    date: '2024-01-19T09:15:00Z',
    status: 'completed'
  },
  {
    id: '3',
    type: 'ride',
    description: 'Airport pickup',
    date: '2024-01-18T16:45:00Z',
    amount: '$67.30',
    status: 'completed'
  }
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'activity', label: 'Recent Activity', icon: Clock },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark text-gray-900 dark:text-white">
      {/* Header */}
      <NeoCard variant="flat" className="rounded-none border-0 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your account information and preferences
              </p>
            </div>
            
            <div className="flex space-x-3">
              <NeoButton 
                variant="secondary" 
                onClick={() => setIsEditing(!isEditing)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </NeoButton>
              <NeoButton variant="primary">
                <Shield className="w-4 h-4 mr-2" />
                Verify Account
              </NeoButton>
            </div>
          </div>
        </div>
      </NeoCard>

      <div className="container mx-auto px-4">
        {/* User Profile Card */}
        <UserProfileCard user={mockUser} />

        {/* Quick Actions */}
        <NeoCard variant="raised" className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NeoButton variant="ghost" className="flex flex-col items-center p-4 h-auto space-y-2">
              <History className="w-8 h-8 text-orange-500" />
              <span className="text-sm">Ride History</span>
            </NeoButton>
            <NeoButton variant="ghost" className="flex flex-col items-center p-4 h-auto space-y-2">
              <CreditCard className="w-8 h-8 text-green-500" />
              <span className="text-sm">Payment Methods</span>
            </NeoButton>
            <NeoButton variant="ghost" className="flex flex-col items-center p-4 h-auto space-y-2">
              <Bell className="w-8 h-8 text-blue-500" />
              <span className="text-sm">Notifications</span>
            </NeoButton>
            <NeoButton variant="ghost" className="flex flex-col items-center p-4 h-auto space-y-2">
              <Settings className="w-8 h-8 text-purple-500" />
              <span className="text-sm">Account Settings</span>
            </NeoButton>
          </div>
        </NeoCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {mockStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Tab Navigation */}
        <NeoCard variant="flat" className="mb-6">
          <div className="flex space-x-1 p-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <NeoButton
                  key={tab.id}
                  variant={activeTab === tab.id ? "primary" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </NeoButton>
              )
            })}
          </div>
        </NeoCard>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <NeoCard variant="raised">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                {isEditing && (
                  <NeoButton variant="ghost" size="sm">
                    <Mail className="w-4 h-4 mr-1" />
                    Save Changes
                  </NeoButton>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={mockUser.name}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={mockUser.email}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={mockUser.phone}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Home Address
                  </label>
                  <input
                    type="text"
                    value={mockUser.address}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>
            </NeoCard>

            {/* Account Security */}
            <NeoCard variant="raised">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Security</h3>
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Extra security for your account</div>
                  </div>
                  <NeoButton variant="secondary" size="sm">
                    Enable
                  </NeoButton>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Password</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Last changed 3 months ago</div>
                  </div>
                  <NeoButton variant="ghost" size="sm">
                    Change
                  </NeoButton>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div>
                    <div className="font-medium text-green-900 dark:text-green-400">Email Verified</div>
                    <div className="text-sm text-green-700 dark:text-green-500">Your email is verified</div>
                  </div>
                  <Award className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </NeoCard>
          </div>
        )}

        {activeTab === 'activity' && (
          <NeoCard variant="raised">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>
            <div className="space-y-3">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'ride' 
                        ? 'bg-orange-100 dark:bg-orange-900/30' 
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {activity.type === 'ride' ? (
                        <Car className="w-4 h-4 text-orange-500" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{activity.description}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                  {activity.amount && (
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {activity.amount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </NeoCard>
        )}

        {activeTab === 'preferences' && (
          <NeoCard variant="raised">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Account Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Notifications</h4>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Receive notifications on your device</div>
                  </div>
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Email Updates</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Receive trip updates via email</div>
                  </div>
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Marketing Emails</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Receive promotional offers</div>
                  </div>
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Ride Preferences</h4>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Preferred Vehicle Type
                  </label>
                  <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>Any</option>
                    <option>Economy</option>
                    <option>Comfort</option>
                    <option>Premium</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Default Tip Percentage
                  </label>
                  <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>10%</option>
                    <option>15%</option>
                    <option>18%</option>
                    <option>20%</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Share Location</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Allow location sharing for pickup</div>
                  </div>
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" defaultChecked />
                </div>
              </div>
            </div>
          </NeoCard>
        )}

        {/* Action Buttons */}
        <div className="mt-6 pb-8">
          <ActionButtonGroup 
            onEdit={() => setIsEditing(!isEditing)}
            isActive={mockUser.status === 'active'}
            className="justify-center"
          />
        </div>
      </div>
    </div>
  )
}