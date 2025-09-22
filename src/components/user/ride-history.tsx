'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  Star, 
  DollarSign,
  Route,
  Download,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Navigation,
  Phone,
  User
} from 'lucide-react'

// Ride History Item
interface Ride {
  id: string
  date: string
  pickup: {
    address: string
    coordinates: { lat: number, lng: number }
  }
  destination: {
    address: string
    coordinates: { lat: number, lng: number }
  }
  driver: {
    id: string
    name: string
    rating: number
    avatar?: string
    vehicle: {
      make: string
      model: string
      plate: string
      color: string
    }
  }
  status: 'completed' | 'cancelled' | 'ongoing' | 'scheduled'
  fare: {
    amount: number
    currency: string
    breakdown: {
      base: number
      distance: number
      time: number
      surge?: number
      tips?: number
    }
  }
  duration: string // "25 mins"
  distance: string // "8.5 km"
  rating?: number
  feedback?: string
  receipt?: string
}

interface RideHistoryCardProps {
  ride: Ride
  onViewDetails?: (id: string) => void
  onDownloadReceipt?: (id: string) => void
  onRateRide?: (id: string) => void
  onReportIssue?: (id: string) => void
  onRebookRide?: (ride: Ride) => void
}

export function RideHistoryCard({ 
  ride, 
  onViewDetails, 
  onDownloadReceipt, 
  onRateRide, 
  onReportIssue,
  onRebookRide 
}: RideHistoryCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      case 'ongoing':
        return <Clock className="w-4 h-4" />
      case 'scheduled':
        return <Calendar className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <NeoCard variant="raised" className="mb-4 hover:shadow-neo-lg dark:hover:shadow-neo-dark-lg transition-shadow">
      {/* Main Content */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Badge className={getStatusColor(ride.status)}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(ride.status)}
                  <span>{ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}</span>
                </div>
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(ride.date).toLocaleDateString()} • {new Date(ride.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            
            {/* Route */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white font-medium">
                  {ride.pickup.address}
                </span>
              </div>
              <div className="flex items-center space-x-2 ml-1">
                <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white font-medium">
                  {ride.destination.address}
                </span>
              </div>
            </div>
          </div>

          {/* Fare */}
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: ride.fare.currency
              }).format(ride.fare.amount)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {ride.distance} • {ride.duration}
            </div>
          </div>
        </div>

        {/* Driver Info (for completed rides) */}
        {ride.status === 'completed' && (
          <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                {ride.driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{ride.driver.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {ride.driver.vehicle.color} {ride.driver.vehicle.make} {ride.driver.vehicle.model} • {ride.driver.vehicle.plate}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{ride.driver.rating.toFixed(1)}</span>
              </div>
              {ride.rating ? (
                <Badge variant="outline" className="text-xs">
                  Rated {ride.rating}/5
                </Badge>
              ) : (
                onRateRide && (
                  <NeoButton variant="ghost" size="sm" onClick={() => onRateRide(ride.id)}>
                    Rate Trip
                  </NeoButton>
                )
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <NeoButton 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
          >
            <Route className="w-4 h-4 mr-1" />
            {expanded ? 'Less Details' : 'View Details'}
          </NeoButton>

          {ride.status === 'completed' && onDownloadReceipt && (
            <NeoButton variant="ghost" size="sm" onClick={() => onDownloadReceipt(ride.id)}>
              <Download className="w-4 h-4 mr-1" />
              Receipt
            </NeoButton>
          )}

          {onRebookRide && (
            <NeoButton variant="secondary" size="sm" onClick={() => onRebookRide(ride)}>
              <Navigation className="w-4 h-4 mr-1" />
              Book Again
            </NeoButton>
          )}

          {onReportIssue && (
            <NeoButton variant="ghost" size="sm" onClick={() => onReportIssue(ride.id)}>
              <AlertCircle className="w-4 h-4 mr-1" />
              Report Issue
            </NeoButton>
          )}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fare Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Fare Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base fare</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: ride.fare.currency
                      }).format(ride.fare.breakdown.base)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Distance ({ride.distance})</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: ride.fare.currency
                      }).format(ride.fare.breakdown.distance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time ({ride.duration})</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: ride.fare.currency
                      }).format(ride.fare.breakdown.time)}
                    </span>
                  </div>
                  {ride.fare.breakdown.surge && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Surge pricing</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: ride.fare.currency
                        }).format(ride.fare.breakdown.surge)}
                      </span>
                    </div>
                  )}
                  {ride.fare.breakdown.tips && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tip</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: ride.fare.currency
                        }).format(ride.fare.breakdown.tips)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: ride.fare.currency
                      }).format(ride.fare.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Trip Details</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Pickup Coordinates</span>
                    <div className="text-gray-900 dark:text-white">
                      {ride.pickup.coordinates.lat}, {ride.pickup.coordinates.lng}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Destination Coordinates</span>
                    <div className="text-gray-900 dark:text-white">
                      {ride.destination.coordinates.lat}, {ride.destination.coordinates.lng}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Trip ID</span>
                    <div className="text-gray-900 dark:text-white font-mono">{ride.id}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback */}
            {ride.feedback && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Your Feedback</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{ride.feedback}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </NeoCard>
  )
}

// Support/Help Components
interface FAQItem {
  question: string
  answer: string
  category: string
}

interface FAQSectionProps {
  faqs: FAQItem[]
  category?: string
}

export function FAQSection({ faqs, category }: FAQSectionProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !category || faq.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search frequently asked questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {filteredFAQs.map((faq, index) => (
          <NeoCard key={index} variant="flat" className="hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised transition-shadow">
            <button
              onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</h3>
                <div className={`transform transition-transform ${expandedFAQ === index ? 'rotate-45' : ''}`}>
                  <div className="w-4 h-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-0.5 bg-gray-400"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-0.5 h-3 bg-gray-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
            
            {expandedFAQ === index && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </NeoCard>
        ))}
      </div>

      {filteredFAQs.length === 0 && (
        <NeoCard variant="flat" className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No FAQs found matching your search.</p>
        </NeoCard>
      )}
    </div>
  )
}

// Contact Support Form
interface ContactSupportProps {
  onSubmit?: (data: {
    category: string
    subject: string
    message: string
    priority: string
    attachments?: File[]
  }) => void
}

export function ContactSupportForm({ onSubmit }: ContactSupportProps) {
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    priority: 'medium'
  })

  const categories = [
    'Billing & Payments',
    'Trip Issues',
    'Driver Issues',
    'App Problems',
    'Account Issues',
    'Safety Concerns',
    'Other'
  ]

  return (
    <NeoCard variant="raised">
      <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Contact Support</h3>
      
      <form className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Priority
          </label>
          <div className="flex space-x-4">
            {['low', 'medium', 'high', 'urgent'].map(priority => (
              <label key={priority} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={priority}
                  checked={formData.priority === priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {priority}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Subject *
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Brief description of your issue"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Provide detailed information about your issue..."
            rows={5}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3 pt-4">
          <NeoButton 
            variant="primary" 
            className="flex-1"
            onClick={() => onSubmit?.(formData)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Submit Support Request
          </NeoButton>
          <NeoButton variant="ghost">
            <Phone className="w-4 h-4 mr-2" />
            Call Support
          </NeoButton>
        </div>
      </form>
    </NeoCard>
  )
}