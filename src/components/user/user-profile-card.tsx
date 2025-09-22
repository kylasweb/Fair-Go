'use client'

import React from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star,
  Shield,
  CreditCard,
  Clock
} from 'lucide-react'

interface UserProfileProps {
  user?: {
    id: string
    name: string
    email: string
    phone: string
    address: string
    joinDate: string
    avatar?: string
    rating?: number
    totalRides?: number
    isVerified?: boolean
    status: 'active' | 'inactive' | 'suspended'
  }
}

export function UserProfileCard({ user }: UserProfileProps) {
  if (!user) {
    return (
      <NeoCard variant="raised" className="animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      </NeoCard>
    )
  }

  const statusColors = {
    active: 'bg-green-500 text-white',
    inactive: 'bg-yellow-500 text-white',
    suspended: 'bg-red-500 text-white'
  }

  return (
    <NeoCard variant="raised" className="mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
        {/* Avatar Section */}
        <div className="relative">
          <Avatar className="w-20 h-20 border-4 border-neo-light dark:border-neo-dark">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {user.isVerified && (
            <div className="absolute -top-1 -right-1">
              <NeoCard variant="raised" size="sm" className="w-8 h-8 bg-green-500 flex items-center justify-center p-1">
                <Shield className="w-4 h-4 text-white" />
              </NeoCard>
            </div>
          )}
        </div>

        {/* User Info Section */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
            <div className="flex items-center space-x-2">
              <Badge className={statusColors[user.status]}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </Badge>
              {user.rating && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{user.rating.toFixed(1)}</span>
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <Phone className="w-4 h-4" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{user.address}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
            </div>
          </div>

          {user.totalRides !== undefined && (
            <div className="flex items-center space-x-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{user.totalRides}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Rides</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </NeoCard>
  )
}

// Stats Card Component
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <NeoCard variant="raised" className={className}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </p>
          )}
        </div>
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
          {icon}
        </div>
      </div>
    </NeoCard>
  )
}

// Action Button Group
interface ActionButtonGroupProps {
  onEdit?: () => void
  onDelete?: () => void
  onSuspend?: () => void
  onActivate?: () => void
  isActive?: boolean
  className?: string
}

export function ActionButtonGroup({ 
  onEdit, 
  onDelete, 
  onSuspend, 
  onActivate, 
  isActive = true,
  className 
}: ActionButtonGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {onEdit && (
        <NeoButton variant="secondary" size="sm" onClick={onEdit}>
          Edit Profile
        </NeoButton>
      )}
      {isActive && onSuspend && (
        <NeoButton variant="danger" size="sm" onClick={onSuspend}>
          Suspend User
        </NeoButton>
      )}
      {!isActive && onActivate && (
        <NeoButton variant="primary" size="sm" onClick={onActivate}>
          Activate User
        </NeoButton>
      )}
      {onDelete && (
        <NeoButton variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
          Delete
        </NeoButton>
      )}
    </div>
  )
}