'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Filter } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  description: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  paymentMethod?: string
  createdAt: string
  booking?: {
    id: string
    pickupLocation: string
    dropLocation: string
  }
  withdrawalMethod?: {
    type: string
    bankName?: string
    accountNumber?: string
    upiId?: string
  }
}

interface TransactionHistoryProps {
  walletId?: string
  showFilters?: boolean
  limit?: number
}

export default function TransactionHistory({
  walletId,
  showFilters = true,
  limit = 20
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchTransactions()
  }, [filters, offset])

  const fetchTransactions = async (loadMore = false) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: loadMore ? offset.toString() : '0',
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })

      const response = await fetch(`/api/wallet/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(loadMore ? [...transactions, ...data.transactions] : data.transactions)
        setHasMore(data.hasMore)
        if (!loadMore) setOffset(limit)
        else setOffset(prev => prev + limit)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setOffset(0)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTransactionIcon = (type: string) => {
    return type === 'CREDIT' ?
      <ArrowDownLeft className="h-4 w-4 text-green-500" /> :
      <ArrowUpRight className="h-4 w-4 text-red-500" />
  }

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'CREDIT' ? '+' : '-'
    const color = type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
    return <span className={`font-medium ${color}`}>{sign}₹{amount.toFixed(2)}</span>
  }

  const formatMethod = (transaction: Transaction) => {
    if (transaction.withdrawalMethod) {
      switch (transaction.withdrawalMethod.type) {
        case 'BANK_TRANSFER':
          return `${transaction.withdrawalMethod.bankName} - ${transaction.withdrawalMethod.accountNumber?.slice(-4)}`
        case 'UPI':
          return transaction.withdrawalMethod.upiId
        default:
          return transaction.withdrawalMethod.type.replace('_', ' ')
      }
    }
    return transaction.paymentMethod || 'N/A'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View all your wallet transactions</CardDescription>
          </div>
          {showFilters && (
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="CREDIT">Credits</SelectItem>
                  <SelectItem value="DEBIT">Debits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-input rounded-md"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-input rounded-md"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        )}

        {isLoading && transactions.length === 0 ? (
          <div className="text-center py-8">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTransactionIcon(transaction.type)}
                    {getStatusIcon(transaction.status)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                      {transaction.booking && (
                        <span className="ml-2">
                          • {transaction.booking.pickupLocation} → {transaction.booking.dropLocation}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Method: {formatMethod(transaction)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatAmount(transaction.amount, transaction.type)}
                  </div>
                  <div className="mt-1">
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchTransactions(true)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}