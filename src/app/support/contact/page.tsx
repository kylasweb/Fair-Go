'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { Badge } from '@/components/ui/badge'
import { ContactSupportForm } from '@/components/user/ride-history'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Phone,
  Mail,
  User,
  Calendar,
  ArrowLeft,
  Upload,
  X,
  Send,
  Paperclip
} from 'lucide-react'

// Mock support tickets
const mockTickets = [
  {
    id: 'TICK-001',
    subject: 'Payment not processed correctly',
    category: 'Billing & Payments',
    status: 'open',
    priority: 'high',
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
    messages: [
      {
        id: 1,
        sender: 'user',
        content: 'Hello, I was charged twice for my ride yesterday. The trip ID is RIDE-12345. Can you please help me get a refund for the duplicate charge?',
        timestamp: '2024-01-20T10:30:00Z'
      },
      {
        id: 2,
        sender: 'agent',
        content: 'Hi John! Thanks for reaching out. I can see the duplicate charge on your account. I\'ve initiated a refund for $23.45 which should appear in your account within 3-5 business days. Is there anything else I can help you with?',
        timestamp: '2024-01-20T14:15:00Z',
        agentName: 'Sarah (Support Team)'
      }
    ]
  },
  {
    id: 'TICK-002',
    subject: 'Driver was unprofessional',
    category: 'Driver Issues',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-01-19T16:45:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
    messages: [
      {
        id: 1,
        sender: 'user',
        content: 'My driver yesterday was very rude and made me uncomfortable during the ride. The trip was from downtown to airport. I would like this to be investigated.',
        timestamp: '2024-01-19T16:45:00Z'
      }
    ]
  },
  {
    id: 'TICK-003',
    subject: 'App crashed during booking',
    category: 'App Problems',
    status: 'resolved',
    priority: 'low',
    createdAt: '2024-01-18T09:20:00Z',
    updatedAt: '2024-01-18T11:30:00Z',
    messages: [
      {
        id: 1,
        sender: 'user',
        content: 'The app keeps crashing when I try to book a ride. I\'m using iPhone 12 with latest iOS.',
        timestamp: '2024-01-18T09:20:00Z'
      },
      {
        id: 2,
        sender: 'agent',
        content: 'Thanks for reporting this! We\'ve released an app update (version 2.1.3) that fixes this issue. Please update your app from the App Store and let us know if you continue experiencing problems.',
        timestamp: '2024-01-18T11:30:00Z',
        agentName: 'Mike (Technical Support)'
      },
      {
        id: 3,
        sender: 'user',
        content: 'Perfect, the update fixed it! Thanks for the quick response.',
        timestamp: '2024-01-18T11:30:00Z'
      }
    ]
  }
]

export default function ContactSupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setAttachments([...attachments, ...Array.from(files)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage, 'Attachments:', attachments)
      setNewMessage('')
      setAttachments([])
    }
  }

  if (selectedTicket) {
    const ticket = mockTickets.find(t => t.id === selectedTicket)
    if (!ticket) return null

    return (
      <div className="min-h-screen bg-neo-light dark:bg-neo-dark text-gray-900 dark:text-white">
        {/* Header */}
        <NeoCard variant="flat" className="rounded-none border-0 mb-6">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center space-x-4">
              <NeoButton 
                variant="ghost" 
                onClick={() => setSelectedTicket(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </NeoButton>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ticket.subject}
                </h1>
                <div className="flex items-center space-x-3 mt-2">
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.toUpperCase()}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority.toUpperCase()} PRIORITY
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    #{ticket.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </NeoCard>

        <div className="container mx-auto px-4">
          {/* Ticket Details */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Messages */}
            <div className="lg:col-span-3">
              <NeoCard variant="raised" className="mb-6">
                <div className="space-y-4">
                  {ticket.messages.map((message, index) => (
                    <div key={message.id} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          message.sender === 'user' 
                            ? 'bg-orange-100 dark:bg-orange-900/30' 
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          <User className="w-5 h-5 text-orange-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {message.sender === 'user' ? 'You' : message.agentName || 'Support Agent'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-gray-900 dark:text-white leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-4">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={4}
                        className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />

                      {/* Attachments */}
                      {attachments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments:</h4>
                          <div className="flex flex-wrap gap-2">
                            {attachments.map((file, index) => (
                              <div key={index} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-900 dark:text-white truncate max-w-32">
                                  {file.name}
                                </span>
                                <button 
                                  onClick={() => removeAttachment(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <input
                            type="file"
                            id="file-upload"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          <label htmlFor="file-upload">
                            <NeoButton variant="ghost" size="sm" className="cursor-pointer">
                              <Paperclip className="w-4 h-4 mr-1" />
                              Attach File
                            </NeoButton>
                          </label>
                        </div>
                        <NeoButton 
                          variant="primary" 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </NeoButton>
                      </div>
                    </div>
                  </div>
                )}
              </NeoCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <NeoCard variant="raised">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ticket Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Category:</span>
                    <div className="font-medium text-gray-900 dark:text-white">{ticket.category}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Created:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </NeoCard>

              <NeoCard variant="raised">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Need More Help?</h3>
                <div className="space-y-3">
                  <NeoButton variant="ghost" size="sm" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Support
                  </NeoButton>
                  <NeoButton variant="ghost" size="sm" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Live Chat
                  </NeoButton>
                </div>
              </NeoCard>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark text-gray-900 dark:text-white">
      {/* Header */}
      <NeoCard variant="flat" className="rounded-none border-0 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Contact Support
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Get help with your issues or track existing support tickets
              </p>
            </div>
            
            <div className="flex space-x-3">
              <NeoButton 
                variant="secondary"
                onClick={() => setShowNewTicket(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                New Ticket
              </NeoButton>
              <NeoButton variant="primary">
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </NeoButton>
            </div>
          </div>
        </div>
      </NeoCard>

      <div className="container mx-auto px-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockTickets.filter(t => t.status === 'open').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">2h 15m</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">47</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </NeoCard>
        </div>

        {/* New Ticket Form */}
        {showNewTicket && (
          <div className="mb-8">
            <ContactSupportForm 
              onSubmit={(data) => {
                console.log('New ticket submitted:', data)
                setShowNewTicket(false)
              }}
            />
            <div className="mt-4 text-center">
              <NeoButton 
                variant="ghost"
                onClick={() => setShowNewTicket(false)}
              >
                Cancel
              </NeoButton>
            </div>
          </div>
        )}

        {/* Support Tickets */}
        <NeoCard variant="raised">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Support Tickets</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {mockTickets.length} total tickets
            </div>
          </div>

          <div className="space-y-4">
            {mockTickets.map((ticket) => (
              <NeoCard 
                key={ticket.id} 
                variant="flat" 
                className="hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised transition-shadow cursor-pointer"
                onClick={() => setSelectedTicket(ticket.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{ticket.subject}</h3>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>#{ticket.id}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <span className="text-sm">
                      Last updated {new Date(ticket.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </NeoCard>
            ))}
          </div>

          {mockTickets.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No support tickets yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                When you need help, your support tickets will appear here.
              </p>
              <NeoButton 
                variant="primary"
                onClick={() => setShowNewTicket(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Create Your First Ticket
              </NeoButton>
            </div>
          )}
        </NeoCard>

        <div className="pb-8"></div>
      </div>
    </div>
  )
}