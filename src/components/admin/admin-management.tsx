'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Star,
  Car,
  FileText,
  Download,
  Upload
} from 'lucide-react'

// User Management Table
interface User {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'suspended' | 'banned'
  joinDate: string
  lastLogin: string
  totalRides: number
  rating: number
  isVerified: boolean
  location?: string
}

interface UserManagementTableProps {
  users: User[]
  onViewUser?: (id: string) => void
  onEditUser?: (id: string) => void
  onSuspendUser?: (id: string) => void
  onActivateUser?: (id: string) => void
  onBanUser?: (id: string) => void
}

export function UserManagementTable({ 
  users, 
  onViewUser, 
  onEditUser, 
  onSuspendUser, 
  onActivateUser,
  onBanUser 
}: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'banned':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <NeoCard variant="flat">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h2>
            <Badge variant="secondary">{users.length} Users</Badge>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full md:w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </NeoCard>

      {/* Users Table */}
      <NeoCard variant="raised">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  <input 
                    type="checkbox" 
                    className="rounded"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id))
                      } else {
                        setSelectedUsers([])
                      }
                    }}
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Activity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Rating</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id])
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                        }
                      }}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Joined {new Date(user.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-white">{user.email}</div>
                      <div className="text-gray-500 dark:text-gray-400">{user.phone}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                      {user.isVerified && (
                        <Badge variant="outline" className="text-xs">Verified</Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-white">{user.totalRides} rides</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        Last: {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.rating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <UserActionDropdown 
                      user={user}
                      onView={onViewUser}
                      onEdit={onEditUser}
                      onSuspend={onSuspendUser}
                      onActivate={onActivateUser}
                      onBan={onBanUser}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NeoCard>
    </div>
  )
}

// User Action Dropdown
interface UserActionDropdownProps {
  user: User
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onSuspend?: (id: string) => void
  onActivate?: (id: string) => void
  onBan?: (id: string) => void
}

function UserActionDropdown({ user, onView, onEdit, onSuspend, onActivate, onBan }: UserActionDropdownProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="relative">
      <NeoButton 
        variant="ghost" 
        size="sm" 
        onClick={() => setShowActions(!showActions)}
      >
        <MoreVertical className="w-4 h-4" />
      </NeoButton>

      {showActions && (
        <div className="absolute right-0 top-full mt-1 z-10">
          <NeoCard variant="raised" size="sm" className="w-48 p-1">
            {onView && (
              <button
                onClick={() => {
                  onView(user.id)
                  setShowActions(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(user.id)
                  setShowActions(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit User</span>
              </button>
            )}
            {user.status === 'active' && onSuspend && (
              <button
                onClick={() => {
                  onSuspend(user.id)
                  setShowActions(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 rounded flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Suspend</span>
              </button>
            )}
            {(user.status === 'suspended' || user.status === 'inactive') && onActivate && (
              <button
                onClick={() => {
                  onActivate(user.id)
                  setShowActions(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 rounded flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Activate</span>
              </button>
            )}
            {user.status !== 'banned' && onBan && (
              <button
                onClick={() => {
                  onBan(user.id)
                  setShowActions(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded flex items-center space-x-2"
              >
                <Ban className="w-4 h-4" />
                <span>Ban User</span>
              </button>
            )}
          </NeoCard>
        </div>
      )}
    </div>
  )
}

// Driver Verification Interface
interface DriverApplication {
  id: string
  driverName: string
  email: string
  phone: string
  licenseNumber: string
  vehicleInfo: {
    make: string
    model: string
    year: number
    plate: string
    color: string
  }
  documents: {
    license: { uploaded: boolean, verified: boolean, url?: string }
    insurance: { uploaded: boolean, verified: boolean, url?: string }
    registration: { uploaded: boolean, verified: boolean, url?: string }
    background: { uploaded: boolean, verified: boolean, url?: string }
  }
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  appliedDate: string
  reviewedDate?: string
  notes?: string
}

interface DriverVerificationCardProps {
  application: DriverApplication
  onApprove?: (id: string, notes?: string) => void
  onReject?: (id: string, notes: string) => void
  onViewDocument?: (type: string, url: string) => void
  onRequestMoreInfo?: (id: string) => void
}

export function DriverVerificationCard({ 
  application, 
  onApprove, 
  onReject, 
  onViewDocument,
  onRequestMoreInfo 
}: DriverVerificationCardProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(application.notes || '')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getDocumentStatus = (doc: { uploaded: boolean, verified: boolean }) => {
    if (!doc.uploaded) return { color: 'text-gray-400', icon: XCircle, text: 'Missing' }
    if (!doc.verified) return { color: 'text-yellow-600', icon: AlertTriangle, text: 'Review' }
    return { color: 'text-green-600', icon: CheckCircle, text: 'Verified' }
  }

  return (
    <NeoCard variant="raised" className="mb-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6 space-y-4 lg:space-y-0">
        {/* Driver Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{application.driverName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Applied on {new Date(application.appliedDate).toLocaleDateString()}
              </p>
            </div>
            <Badge className={getStatusColor(application.status)}>
              {application.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{application.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{application.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">License: {application.licenseNumber}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Car className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">
                  {application.vehicleInfo.year} {application.vehicleInfo.make} {application.vehicleInfo.model}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {application.vehicleInfo.color} • {application.vehicleInfo.plate}
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="lg:w-80">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Documents</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(application.documents).map(([type, doc]) => {
              const status = getDocumentStatus(doc)
              const StatusIcon = status.icon
              
              return (
                <div key={type} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                    <span className="text-sm capitalize text-gray-900 dark:text-white">{type}</span>
                  </div>
                  {doc.uploaded && doc.url && onViewDocument && (
                    <NeoButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewDocument(type, doc.url!)}
                    >
                      <Eye className="w-3 h-3" />
                    </NeoButton>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {(showNotes || application.notes) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Review Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this application..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            rows={3}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {application.status === 'pending' && onApprove && (
          <NeoButton 
            variant="primary" 
            onClick={() => onApprove(application.id, notes)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve
          </NeoButton>
        )}
        
        {(application.status === 'pending' || application.status === 'under_review') && onReject && (
          <NeoButton 
            variant="danger" 
            onClick={() => onReject(application.id, notes)}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </NeoButton>
        )}

        {onRequestMoreInfo && (
          <NeoButton 
            variant="secondary"
            onClick={() => onRequestMoreInfo(application.id)}
          >
            <FileText className="w-4 h-4 mr-1" />
            Request Info
          </NeoButton>
        )}

        <NeoButton 
          variant="ghost"
          onClick={() => setShowNotes(!showNotes)}
        >
          <Edit className="w-4 h-4 mr-1" />
          {showNotes ? 'Hide Notes' : 'Add Notes'}
        </NeoButton>
      </div>
    </NeoCard>
  )
}