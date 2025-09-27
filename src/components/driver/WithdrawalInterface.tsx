'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, CreditCard, Smartphone, Mail, BanknoteIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

interface WithdrawalMethod {
  id: string
  type: 'BANK_TRANSFER' | 'UPI' | 'PAYPAL' | 'STRIPE'
  accountNumber?: string
  accountHolderName?: string
  bankName?: string
  ifscCode?: string
  upiId?: string
  paypalEmail?: string
  stripeAccountId?: string
  isDefault: boolean
  createdAt: string
}

interface WithdrawalInterfaceProps {
  walletBalance: number
}

export default function WithdrawalInterface({ walletBalance }: WithdrawalInterfaceProps) {
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddMethod, setShowAddMethod] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const { toast } = useToast()

  // Form state for adding new withdrawal method
  const [methodType, setMethodType] = useState<string>('')
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountHolderName: '',
    bankName: '',
    ifscCode: '',
    upiId: '',
    paypalEmail: '',
    stripeAccountId: ''
  })

  useEffect(() => {
    fetchWithdrawalMethods()
  }, [])

  const fetchWithdrawalMethods = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/wallet/withdrawals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWithdrawalMethods(data.withdrawalMethods)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch withdrawal methods',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching withdrawal methods:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch withdrawal methods',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddWithdrawalMethod = async () => {
    if (!methodType) {
      toast({
        title: 'Error',
        description: 'Please select a withdrawal method type',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/wallet/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: methodType,
          ...formData
        })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Withdrawal method added successfully'
        })
        setShowAddMethod(false)
        setMethodType('')
        setFormData({
          accountNumber: '',
          accountHolderName: '',
          bankName: '',
          ifscCode: '',
          upiId: '',
          paypalEmail: '',
          stripeAccountId: ''
        })
        fetchWithdrawalMethods()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to add withdrawal method',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error adding withdrawal method:', error)
      toast({
        title: 'Error',
        description: 'Failed to add withdrawal method',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdrawalRequest = async () => {
    const amount = parseFloat(withdrawalAmount)
    if (!selectedMethod || !amount || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please select a withdrawal method and enter a valid amount',
        variant: 'destructive'
      })
      return
    }

    if (amount > walletBalance) {
      toast({
        title: 'Error',
        description: 'Insufficient wallet balance',
        variant: 'destructive'
      })
      return
    }

    if (amount < 100) {
      toast({
        title: 'Error',
        description: 'Minimum withdrawal amount is ₹100',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/wallet/withdrawals/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          withdrawalMethodId: selectedMethod,
          description: `Withdrawal of ₹${amount}`
        })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Withdrawal request submitted successfully. Amount will be processed after admin approval.'
        })
        setSelectedMethod('')
        setWithdrawalAmount('')
        // Refresh wallet balance would be handled by parent component
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to submit withdrawal request',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit withdrawal request',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'BANK_TRANSFER':
        return <BanknoteIcon className="h-4 w-4" />
      case 'UPI':
        return <Smartphone className="h-4 w-4" />
      case 'PAYPAL':
        return <Mail className="h-4 w-4" />
      case 'STRIPE':
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getMethodDisplayName = (method: WithdrawalMethod) => {
    switch (method.type) {
      case 'BANK_TRANSFER':
        return `${method.bankName} - ${method.accountNumber?.slice(-4)}`
      case 'UPI':
        return method.upiId
      case 'PAYPAL':
        return method.paypalEmail
      case 'STRIPE':
        return `Stripe Account ${method.stripeAccountId?.slice(-4)}`
      default:
        return 'Unknown Method'
    }
  }

  const renderMethodForm = () => {
    switch (methodType) {
      case 'BANK_TRANSFER':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Enter account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  placeholder="Enter account holder name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Enter bank name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))}
                  placeholder="Enter IFSC code"
                />
              </div>
            </div>
          </>
        )
      case 'UPI':
        return (
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              value={formData.upiId}
              onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
              placeholder="Enter UPI ID (e.g., user@paytm)"
            />
          </div>
        )
      case 'PAYPAL':
        return (
          <div className="space-y-2">
            <Label htmlFor="paypalEmail">PayPal Email</Label>
            <Input
              id="paypalEmail"
              type="email"
              value={formData.paypalEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, paypalEmail: e.target.value }))}
              placeholder="Enter PayPal email address"
            />
          </div>
        )
      case 'STRIPE':
        return (
          <div className="space-y-2">
            <Label htmlFor="stripeAccountId">Stripe Account ID</Label>
            <Input
              id="stripeAccountId"
              value={formData.stripeAccountId}
              onChange={(e) => setFormData(prev => ({ ...prev, stripeAccountId: e.target.value }))}
              placeholder="Enter Stripe account ID"
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
          <CardDescription>Your current available balance for withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">₹{walletBalance.toFixed(2)}</div>
        </CardContent>
      </Card>

      {/* Withdrawal Methods */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Withdrawal Methods</CardTitle>
              <CardDescription>Manage your withdrawal methods</CardDescription>
            </div>
            <Dialog open={showAddMethod} onOpenChange={setShowAddMethod}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Withdrawal Method</DialogTitle>
                  <DialogDescription>
                    Add a new method to withdraw your earnings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Method Type</Label>
                    <Select value={methodType} onValueChange={setMethodType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                        <SelectItem value="STRIPE">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {renderMethodForm()}
                  <Button
                    onClick={handleAddWithdrawalMethod}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Method'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading withdrawal methods...</div>
          ) : withdrawalMethods.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No withdrawal methods added yet. Add a method to start withdrawing your earnings.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {withdrawalMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getMethodIcon(method.type)}
                    <div>
                      <div className="font-medium">{getMethodDisplayName(method)}</div>
                      <div className="text-sm text-muted-foreground">{method.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                  {method.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Request */}
      {withdrawalMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
            <CardDescription>Withdraw funds to your preferred method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="method">Withdrawal Method</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select withdrawal method" />
                </SelectTrigger>
                <SelectContent>
                  {withdrawalMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center space-x-2">
                        {getMethodIcon(method.type)}
                        <span>{getMethodDisplayName(method)}</span>
                        {method.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="Enter withdrawal amount"
                min="100"
                step="0.01"
              />
              <div className="text-sm text-muted-foreground">
                Minimum withdrawal: ₹100 | Available balance: ₹{walletBalance.toFixed(2)}
              </div>
            </div>
            <Button
              onClick={handleWithdrawalRequest}
              disabled={isSubmitting || !selectedMethod || !withdrawalAmount}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Request Withdrawal'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}