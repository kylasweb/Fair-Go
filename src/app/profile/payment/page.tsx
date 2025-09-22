'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { 
  PaymentMethodCard, 
  WalletBalance, 
  TransactionItem, 
  AddPaymentMethodForm 
} from '@/components/user/payment-management'
import { 
  CreditCard, 
  Plus, 
  Wallet, 
  TrendingUp,
  Filter,
  Download,
  Search,
  Calendar,
  DollarSign
} from 'lucide-react'

// Mock data
const mockPaymentMethods = [
  {
    id: '1',
    type: 'card' as const,
    last4: '4242',
    brand: 'visa',
    expiryDate: '12/25',
    isDefault: true,
    nickname: 'Main Card'
  },
  {
    id: '2',
    type: 'card' as const,
    last4: '8888',
    brand: 'mastercard',
    expiryDate: '08/26',
    isDefault: false
  },
  {
    id: '3',
    type: 'paypal' as const,
    isDefault: false,
    nickname: 'PayPal Account'
  }
]

const mockTransactions = [
  {
    id: '1',
    type: 'payment' as const,
    amount: 23.45,
    currency: 'USD',
    description: 'Trip to Downtown Mall',
    date: '2024-01-20T14:30:00Z',
    status: 'completed' as const,
    paymentMethod: '**** 4242'
  },
  {
    id: '2',
    type: 'topup' as const,
    amount: 50.00,
    currency: 'USD',
    description: 'Wallet top-up',
    date: '2024-01-19T09:15:00Z',
    status: 'completed' as const,
    paymentMethod: '**** 4242'
  },
  {
    id: '3',
    type: 'payment' as const,
    amount: 67.30,
    currency: 'USD',
    description: 'Airport pickup',
    date: '2024-01-18T16:45:00Z',
    status: 'completed' as const,
    paymentMethod: '**** 4242'
  },
  {
    id: '4',
    type: 'refund' as const,
    amount: 15.50,
    currency: 'USD',
    description: 'Cancelled trip refund',
    date: '2024-01-17T11:20:00Z',
    status: 'completed' as const
  },
  {
    id: '5',
    type: 'payment' as const,
    amount: 34.75,
    currency: 'USD',
    description: 'Trip to Central Station',
    date: '2024-01-16T08:45:00Z',
    status: 'pending' as const,
    paymentMethod: '**** 4242'
  }
]

const mockWalletData = {
  balance: 127.50,
  pendingAmount: 15.25,
  currency: 'USD'
}

export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [transactionFilter, setTransactionFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DollarSign },
    { id: 'methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'transactions', label: 'Transaction History', icon: TrendingUp }
  ]

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = transactionFilter === 'all' || transaction.type === transactionFilter
    return matchesSearch && matchesFilter
  })

  const handleSetDefault = (id: string) => {
    console.log('Setting default payment method:', id)
  }

  const handleRemoveMethod = (id: string) => {
    console.log('Removing payment method:', id)
  }

  const handleEditMethod = (id: string) => {
    console.log('Editing payment method:', id)
  }

  const handleAddFunds = () => {
    console.log('Adding funds to wallet')
  }

  const handleWithdraw = () => {
    console.log('Withdrawing from wallet')
  }

  const handleViewTransaction = (id: string) => {
    console.log('Viewing transaction details:', id)
  }

  const handleDownloadReceipt = (id: string) => {
    console.log('Downloading receipt for transaction:', id)
  }

  return (
    <div className="min-h-screen bg-neo-light dark:bg-neo-dark text-gray-900 dark:text-white">
      {/* Header */}
      <NeoCard variant="flat" className="rounded-none border-0 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Payment & Billing
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your payment methods and view transaction history
              </p>
            </div>
            
            <div className="flex space-x-3">
              <NeoButton 
                variant="secondary"
                onClick={() => setShowAddPayment(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </NeoButton>
              <NeoButton variant="primary">
                <Download className="w-4 h-4 mr-2" />
                Export History
              </NeoButton>
            </div>
          </div>
        </div>
      </NeoCard>

      <div className="container mx-auto px-4">
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
          <div className="space-y-6">
            {/* Wallet Balance */}
            <WalletBalance
              balance={mockWalletData.balance}
              pendingAmount={mockWalletData.pendingAmount}
              currency={mockWalletData.currency}
              onAddFunds={handleAddFunds}
              onWithdraw={handleWithdraw}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NeoCard variant="raised">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">$247.85</p>
                    <p className="text-sm text-green-600">+12% from last month</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </NeoCard>

              <NeoCard variant="raised">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Trips</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">127</p>
                    <p className="text-sm text-blue-600">8 this week</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </NeoCard>

              <NeoCard variant="raised">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Trip Cost</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">$19.50</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">-$2.30 vs last month</p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <DollarSign className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </NeoCard>
            </div>

            {/* Recent Transactions Preview */}
            <NeoCard variant="raised">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
                <NeoButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('transactions')}
                >
                  View All
                </NeoButton>
              </div>
              <div className="space-y-3">
                {mockTransactions.slice(0, 3).map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onViewDetails={handleViewTransaction}
                    onDownloadReceipt={handleDownloadReceipt}
                  />
                ))}
              </div>
            </NeoCard>
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="space-y-6">
            {/* Payment Methods */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Saved Payment Methods
                </h3>
                <NeoButton 
                  variant="secondary"
                  onClick={() => setShowAddPayment(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Method
                </NeoButton>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockPaymentMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onSetDefault={handleSetDefault}
                    onRemove={handleRemoveMethod}
                    onEdit={handleEditMethod}
                  />
                ))}
              </div>
            </div>

            {/* Add Payment Method Form */}
            {showAddPayment && (
              <AddPaymentMethodForm 
                onCancel={() => setShowAddPayment(false)}
                onAdd={(method) => {
                  console.log('Adding payment method:', method)
                  setShowAddPayment(false)
                }}
              />
            )}

            {/* Security Notice */}
            <NeoCard variant="raised" className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Wallet className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-1">
                    Your payment information is secure
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    We use industry-standard encryption to protect your payment data. 
                    Your card information is never stored on our servers and is processed 
                    through secure payment providers.
                  </p>
                </div>
              </div>
            </NeoCard>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <NeoCard variant="flat">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Transactions</option>
                  <option value="payment">Payments</option>
                  <option value="refund">Refunds</option>
                  <option value="topup">Top-ups</option>
                  <option value="withdrawal">Withdrawals</option>
                </select>

                <NeoButton variant="secondary">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </NeoButton>
              </div>
            </NeoCard>

            {/* Transaction Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <NeoCard variant="raised" className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {filteredTransactions.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</div>
              </NeoCard>
              
              <NeoCard variant="raised" className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  ${filteredTransactions
                    .filter(t => t.type === 'refund' || t.type === 'topup')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Credits</div>
              </NeoCard>
              
              <NeoCard variant="raised" className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  ${filteredTransactions
                    .filter(t => t.type === 'payment')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Debits</div>
              </NeoCard>
              
              <NeoCard variant="raised" className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {filteredTransactions.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              </NeoCard>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onViewDetails={handleViewTransaction}
                  onDownloadReceipt={handleDownloadReceipt}
                />
              ))}
            </div>

            {filteredTransactions.length === 0 && (
              <NeoCard variant="flat" className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No transactions found matching your criteria.
                </p>
              </NeoCard>
            )}
          </div>
        )}
      </div>
    </div>
  )
}