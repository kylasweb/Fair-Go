'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { FAQSection, ContactSupportForm } from '@/components/user/ride-history'
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail,
  Book,
  Search,
  Clock,
  CheckCircle,
  Users,
  Shield,
  CreditCard,
  Car,
  MapPin,
  AlertCircle
} from 'lucide-react'

// Mock FAQ data
const mockFAQs = [
  {
    question: 'How do I book a ride?',
    answer: 'You can book a ride through our mobile app or website. Simply enter your pickup location, destination, select your preferred vehicle type, and confirm your booking. A driver will be assigned to you within minutes.',
    category: 'Booking'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, PayPal, Apple Pay, Google Pay, and our digital wallet. You can manage your payment methods in your profile settings.',
    category: 'Payment'
  },
  {
    question: 'How is the fare calculated?',
    answer: 'Our fare is calculated based on base rate, distance, time, and current demand (surge pricing). The total fare is shown before you confirm your booking, so there are no surprises.',
    category: 'Payment'
  },
  {
    question: 'Can I cancel my ride?',
    answer: 'Yes, you can cancel your ride through the app. Free cancellation is available within 2 minutes of booking. After that, a small cancellation fee may apply depending on how long after booking you cancel.',
    category: 'Booking'
  },
  {
    question: 'How do I contact my driver?',
    answer: 'Once a driver is assigned, you can call or message them directly through the app without sharing personal phone numbers. The communication is anonymous and secure.',
    category: 'Rides'
  },
  {
    question: 'What if I left something in the vehicle?',
    answer: 'If you left an item in a vehicle, you can report it through the "Lost Items" section in your trip history. We\'ll help connect you with your driver to arrange the return of your belongings.',
    category: 'Rides'
  },
  {
    question: 'How do I rate my driver?',
    answer: 'After each trip, you\'ll be prompted to rate your driver on a scale of 1-5 stars. You can also leave additional feedback about your experience.',
    category: 'Rides'
  },
  {
    question: 'Is my personal information safe?',
    answer: 'Yes, we take your privacy and security seriously. All personal information is encrypted and stored securely. We never share your personal details with drivers or third parties without your consent.',
    category: 'Safety'
  },
  {
    question: 'What safety features do you offer?',
    answer: 'We offer real-time trip sharing, driver background checks, in-app emergency button, GPS tracking, and 24/7 support. All drivers and vehicles are verified before joining our platform.',
    category: 'Safety'
  },
  {
    question: 'How do I get a receipt for my ride?',
    answer: 'Receipts are automatically sent to your registered email address after each completed trip. You can also download receipts from your trip history in the app.',
    category: 'Payment'
  }
]

const supportCategories = [
  {
    id: 'booking',
    title: 'Booking & Rides',
    icon: Car,
    description: 'Help with booking rides, trip issues, and ride management',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
  },
  {
    id: 'payment',
    title: 'Payment & Billing',
    icon: CreditCard,
    description: 'Questions about fares, payment methods, and billing',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600'
  },
  {
    id: 'safety',
    title: 'Safety & Security',
    icon: Shield,
    description: 'Safety features, security concerns, and emergency support',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-600'
  },
  {
    id: 'account',
    title: 'Account & Profile',
    icon: Users,
    description: 'Account settings, profile management, and verification',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
  }
]

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFAQs = mockFAQs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category.toLowerCase() === activeCategory
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark text-gray-900 dark:text-white">
      {/* Header */}
      <NeoCard variant="flat" className="rounded-none border-0 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <HelpCircle className="w-8 h-8 text-orange-500" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Support Center
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              How can we help you today?
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs, or contact information..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      </NeoCard>

      <div className="container mx-auto px-4">
        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <NeoCard variant="raised" className="text-center hover:shadow-neo-lg dark:hover:shadow-neo-dark-lg transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Live Chat</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get instant help from our support team
              </p>
              <NeoButton variant="primary" className="w-full bg-green-500 hover:bg-green-600">
                Start Chat
              </NeoButton>
              <div className="flex items-center justify-center space-x-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Avg response: 2 mins</span>
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised" className="text-center hover:shadow-neo-lg dark:hover:shadow-neo-dark-lg transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Call Support</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Speak directly with our support team
              </p>
              <NeoButton variant="secondary" className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                +1 (800) 555-0123
              </NeoButton>
              <div className="flex items-center justify-center space-x-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Available 24/7</span>
              </div>
            </div>
          </NeoCard>

          <NeoCard variant="raised" className="text-center hover:shadow-neo-lg dark:hover:shadow-neo-dark-lg transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email Support</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Send us a detailed message
              </p>
              <NeoButton variant="ghost" className="w-full">
                Contact Form
              </NeoButton>
              <div className="flex items-center justify-center space-x-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Response within 4 hours</span>
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Support Categories */}
        <NeoCard variant="raised" className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <NeoButton
                  key={category.id}
                  variant={activeCategory === category.id ? "primary" : "ghost"}
                  onClick={() => setActiveCategory(activeCategory === category.id ? 'all' : category.id)}
                  className="h-auto p-4 flex flex-col items-center text-center space-y-3"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{category.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {category.description}
                    </div>
                  </div>
                </NeoButton>
              )
            })}
          </div>
        </NeoCard>

        {/* Popular Articles */}
        <NeoCard variant="raised" className="mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <Book className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {activeCategory === 'all' ? 'Popular Articles' : `${supportCategories.find(c => c.id === activeCategory)?.title} Help`}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <NeoCard variant="flat" className="hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised transition-shadow cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Car className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Getting Started Guide</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Learn how to book your first ride</p>
                </div>
              </div>
            </NeoCard>

            <NeoCard variant="flat" className="hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised transition-shadow cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Payment Issues</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Troubleshoot payment problems</p>
                </div>
              </div>
            </NeoCard>

            <NeoCard variant="flat" className="hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised transition-shadow cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Safety Features</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Learn about our safety tools</p>
                </div>
              </div>
            </NeoCard>

            <NeoCard variant="flat" className="hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised transition-shadow cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Account Settings</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your profile and preferences</p>
                </div>
              </div>
            </NeoCard>

            <NeoCard variant="flat" className="hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised transition-shadow cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Lost Items</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recover items left in vehicles</p>
                </div>
              </div>
            </NeoCard>

            <NeoCard variant="flat" className="hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised transition-shadow cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Report an Issue</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Let us know about any problems</p>
                </div>
              </div>
            </NeoCard>
          </div>
        </NeoCard>

        {/* FAQ Section */}
        <NeoCard variant="raised" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
            </div>
          </div>

          <FAQSection 
            faqs={filteredFAQs} 
            category={activeCategory === 'all' ? undefined : activeCategory}
          />
        </NeoCard>

        {/* Contact Form */}
        <div className="mb-8">
          <ContactSupportForm 
            onSubmit={(data) => {
              console.log('Support request submitted:', data)
              // Handle form submission
            }}
          />
        </div>

        {/* Support Status */}
        <NeoCard variant="raised" className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-gray-900 dark:text-white">All systems operational</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Our support team is available 24/7 to assist you. Average response time is under 5 minutes for urgent issues.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Live Chat: Online</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Phone Support: Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Email Support: Active</span>
            </div>
          </div>
        </NeoCard>

        <div className="pb-8"></div>
      </div>
    </div>
  )
}