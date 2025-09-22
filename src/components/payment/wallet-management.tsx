'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Wallet, 
  Plus, 
  Minus, 
  TrendingUp, 
  History, 
  CreditCard, 
  Smartphone,
  Building2,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface WalletBalance {
  balance: number
  currency: string
  lastUpdated: string
}

interface WalletTransaction {
  id: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  createdAt: string
  reference?: string
}

interface WalletManagementProps {
  userId: string
}

export function WalletManagement({ userId }: WalletManagementProps) {
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    balance: 1250,
    currency: 'INR',
    lastUpdated: new Date().toISOString()
  })

  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: '1',
      type: 'CREDIT',
      amount: 500,
      description: 'Added via UPI',
      status: 'COMPLETED',
      createdAt: '2024-01-15T10:30:00Z',
      reference: 'UPI123456'
    },
    {
      id: '2',
      type: 'DEBIT',
      amount: 150,
      description: 'Ride payment',
      status: 'COMPLETED',
      createdAt: '2024-01-15T14:20:00Z',
      reference: 'BOOKING789'
    },
    {
      id: '3',
      type: 'CREDIT',
      amount: 1000,
      description: 'Added via Net Banking',
      status: 'COMPLETED',
      createdAt: '2024-01-14T16:45:00Z',
      reference: 'NB456789'
    }
  ])

  const [addAmount, setAddAmount] = useState('')
  const [selectedAddMethod, setSelectedAddMethod] = useState('upi')
  const [isProcessing, setIsProcessing] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleAddFunds = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) return

    setIsProcessing(true)
    try {
      // Simulate adding funds
      await new Promise(resolve => setTimeout(resolve, 2000))

      const amount = parseFloat(addAmount)
      const newBalance = walletBalance.balance + amount

      setWalletBalance({
        ...walletBalance,
        balance: newBalance,
        lastUpdated: new Date().toISOString()
      })

      // Add transaction record
      const newTransaction: WalletTransaction = {
        id: `txn_${Date.now()}`,
        type: 'CREDIT',
        amount,
        description: `Added via ${selectedAddMethod.toUpperCase()}`,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        reference: `${selectedAddMethod.toUpperCase()}${Math.random().toString(36).substr(2, 6)}`
      }

      setTransactions([newTransaction, ...transactions])
      setAddAmount('')

      // Show success message
      alert(`Successfully added ${formatCurrency(amount)} to your wallet!`)
    } catch (error) {
      console.error('Failed to add funds:', error)
      alert('Failed to add funds. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    return type === 'CREDIT' ? (
      <ArrowDownRight className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-red-500" />
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Wallet className="w-5 h-5" />
            <span>Wallet Balance</span>
          </CardTitle>
          <CardDescription className="text-orange-100">
            Your available balance for rides and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{formatCurrency(walletBalance.balance)}</p>
              <p className="text-sm text-orange-100">
                Last updated: {new Date(walletBalance.lastUpdated).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-2">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Actions */}
      <Tabs defaultValue="add-funds" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-funds">Add Funds</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="add-funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Money to Wallet</CardTitle>
              <CardDescription>
                Add funds to your wallet for seamless ride payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  min="1"
                  max="10000"
                />
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddAmount('100')}
                  >
                    +₹100
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddAmount('500')}
                  >
                    +₹500
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddAmount('1000')}
                  >
                    +₹1000
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={selectedAddMethod === 'upi' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedAddMethod('upi')}
                    className="flex flex-col items-center space-y-1 h-auto py-3"
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-xs">UPI</span>
                  </Button>
                  <Button
                    variant={selectedAddMethod === 'net_banking' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedAddMethod('net_banking')}
                    className="flex flex-col items-center space-y-1 h-auto py-3"
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs">Net Banking</span>
                  </Button>
                  <Button
                    variant={selectedAddMethod === 'card' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedAddMethod('card')}
                    className="flex flex-col items-center space-y-1 h-auto py-3"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Card</span>
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAddFunds}
                disabled={!addAmount || parseFloat(addAmount) <= 0 || isProcessing}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Add ₹${addAmount || '0'}`
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto py-4">
                  <div className="flex flex-col items-center space-y-2">
                    <Smartphone className="w-6 h-6" />
                    <span className="text-sm">Auto Reload</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4">
                  <div className="flex flex-col items-center space-y-2">
                    <History className="w-6 h-6" />
                    <span className="text-sm">Statements</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Transaction History</span>
              </CardTitle>
              <CardDescription>
                View all your wallet transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </span>
                          {transaction.reference && (
                            <span className="text-xs text-gray-400">
                              Ref: {transaction.reference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'CREDIT' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Wallet Benefits */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Wallet Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-blue-800">Instant Payments</h4>
              <p className="text-sm text-blue-700">
                Pay for rides instantly without entering payment details
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-blue-800">24/7 Access</h4>
              <p className="text-sm text-blue-700">
                Access your wallet anytime, anywhere
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-blue-800">Cashback Rewards</h4>
              <p className="text-sm text-blue-700">
                Earn cashback on wallet reloads and rides
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}