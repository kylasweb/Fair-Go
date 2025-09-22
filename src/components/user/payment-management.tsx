'use client'

import React, { useState } from 'react'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Wallet, 
  Plus, 
  MoreVertical, 
  DollarSign,
  Calendar,
  Download,
  Eye,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react'

// Payment Method Card
interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'wallet' | 'paypal'
  last4?: string
  brand?: string
  expiryDate?: string
  isDefault: boolean
  nickname?: string
}

interface PaymentMethodCardProps {
  method: PaymentMethod
  onSetDefault?: (id: string) => void
  onRemove?: (id: string) => void
  onEdit?: (id: string) => void
}

export function PaymentMethodCard({ method, onSetDefault, onRemove, onEdit }: PaymentMethodCardProps) {
  const [showActions, setShowActions] = useState(false)

  const getIcon = () => {
    switch (method.type) {
      case 'card':
        return <CreditCard className="w-5 h-5" />
      case 'wallet':
        return <Wallet className="w-5 h-5" />
      case 'paypal':
        return <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">P</div>
      default:
        return <CreditCard className="w-5 h-5" />
    }
  }

  const getDisplayText = () => {
    if (method.nickname) return method.nickname
    if (method.last4) return `**** **** **** ${method.last4}`
    return method.type.charAt(0).toUpperCase() + method.type.slice(1)
  }

  return (
    <NeoCard variant="raised" className="relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white">{getDisplayText()}</span>
              {method.isDefault && (
                <Badge variant="secondary" className="text-xs">Default</Badge>
              )}
            </div>
            {method.brand && (
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {method.brand} {method.expiryDate && `• Expires ${method.expiryDate}`}
              </p>
            )}
          </div>
        </div>

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
              <NeoCard variant="raised" size="sm" className="w-40 p-1">
                {!method.isDefault && onSetDefault && (
                  <button
                    onClick={() => {
                      onSetDefault(method.id)
                      setShowActions(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Set as Default</span>
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(method.id)
                      setShowActions(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => {
                      onRemove(method.id)
                      setShowActions(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                )}
              </NeoCard>
            </div>
          )}
        </div>
      </div>
    </NeoCard>
  )
}

// Wallet Balance Card
interface WalletBalanceProps {
  balance: number
  pendingAmount?: number
  currency?: string
  onAddFunds?: () => void
  onWithdraw?: () => void
}

export function WalletBalance({ balance, pendingAmount, currency = 'USD', onAddFunds, onWithdraw }: WalletBalanceProps) {
  return (
    <NeoCard variant="raised" className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Wallet className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Wallet Balance</h3>
        </div>
        <DollarSign className="w-8 h-8 opacity-50" />
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="text-3xl font-bold">
            {new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency 
            }).format(balance)}
          </div>
          {pendingAmount && pendingAmount > 0 && (
            <p className="text-orange-100 text-sm">
              {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency 
              }).format(pendingAmount)} pending
            </p>
          )}
        </div>
        
        <div className="flex space-x-2 pt-4">
          {onAddFunds && (
            <NeoButton variant="secondary" size="sm" onClick={onAddFunds} className="flex-1 bg-white text-orange-600 hover:bg-gray-50">
              <Plus className="w-4 h-4 mr-1" />
              Add Funds
            </NeoButton>
          )}
          {onWithdraw && balance > 0 && (
            <NeoButton variant="ghost" size="sm" onClick={onWithdraw} className="flex-1 text-white border-white hover:bg-white/10">
              Withdraw
            </NeoButton>
          )}
        </div>
      </div>
    </NeoCard>
  )
}

// Transaction Item
interface Transaction {
  id: string
  type: 'payment' | 'refund' | 'topup' | 'withdrawal'
  amount: number
  currency: string
  description: string
  date: string
  status: 'completed' | 'pending' | 'failed'
  paymentMethod?: string
}

interface TransactionItemProps {
  transaction: Transaction
  onViewDetails?: (id: string) => void
  onDownloadReceipt?: (id: string) => void
}

export function TransactionItem({ transaction, onViewDetails, onDownloadReceipt }: TransactionItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'text-red-600 dark:text-red-400'
      case 'refund':
      case 'topup':
        return 'text-green-600 dark:text-green-400'
      case 'withdrawal':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-900 dark:text-white'
    }
  }

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'payment':
      case 'withdrawal':
        return '-'
      case 'refund':
      case 'topup':
        return '+'
      default:
        return ''
    }
  }

  return (
    <NeoCard variant="flat" className="hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">{transaction.description}</h4>
            <div className={`text-lg font-semibold ${getAmountColor(transaction.type)}`}>
              {getAmountPrefix(transaction.type)}{new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: transaction.currency
              }).format(transaction.amount)}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{new Date(transaction.date).toLocaleDateString()}</span>
              </div>
              {transaction.paymentMethod && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  • {transaction.paymentMethod}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(transaction.status)}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
              
              <div className="flex space-x-1">
                {onViewDetails && (
                  <NeoButton variant="ghost" size="sm" onClick={() => onViewDetails(transaction.id)}>
                    <Eye className="w-4 h-4" />
                  </NeoButton>
                )}
                {onDownloadReceipt && transaction.status === 'completed' && (
                  <NeoButton variant="ghost" size="sm" onClick={() => onDownloadReceipt(transaction.id)}>
                    <Download className="w-4 h-4" />
                  </NeoButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </NeoCard>
  )
}

// Add Payment Method Form
interface AddPaymentMethodProps {
  onAdd?: (method: Omit<PaymentMethod, 'id'>) => void
  onCancel?: () => void
}

export function AddPaymentMethodForm({ onAdd, onCancel }: AddPaymentMethodProps) {
  const [selectedType, setSelectedType] = useState<'card' | 'bank' | 'paypal'>('card')

  return (
    <NeoCard variant="raised">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Payment Method</h3>
      
      {/* Payment Type Selection */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { type: 'card' as const, label: 'Credit Card', icon: CreditCard },
          { type: 'bank' as const, label: 'Bank Account', icon: Wallet },
          { type: 'paypal' as const, label: 'PayPal', icon: DollarSign }
        ].map(({ type, label, icon: Icon }) => (
          <NeoButton
            key={type}
            variant={selectedType === type ? "primary" : "ghost"}
            onClick={() => setSelectedType(type)}
            className="flex flex-col items-center p-4 h-auto"
          >
            <Icon className="w-6 h-6 mb-2" />
            <span className="text-sm">{label}</span>
          </NeoButton>
        ))}
      </div>

      {/* Form Content */}
      <div className="space-y-4">
        {selectedType === 'card' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Card Number</label>
              <input 
                type="text" 
                placeholder="1234 5678 9012 3456"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Expiry Date</label>
                <input 
                  type="text" 
                  placeholder="MM/YY"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">CVC</label>
                <input 
                  type="text" 
                  placeholder="123"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cardholder Name</label>
              <input 
                type="text" 
                placeholder="John Doe"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nickname (Optional)</label>
          <input 
            type="text" 
            placeholder="My main card"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input type="checkbox" id="setDefault" className="rounded" />
          <label htmlFor="setDefault" className="text-sm text-gray-700 dark:text-gray-300">
            Set as default payment method
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6">
        <NeoButton variant="primary" className="flex-1">
          Add Payment Method
        </NeoButton>
        {onCancel && (
          <NeoButton variant="ghost" onClick={onCancel}>
            Cancel
          </NeoButton>
        )}
      </div>
    </NeoCard>
  )
}