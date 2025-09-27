'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Smartphone, Building2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

interface DepositInterfaceProps {
  walletBalance: number
  onBalanceUpdate?: () => void
}

export default function DepositInterface({ walletBalance, onBalanceUpdate }: DepositInterfaceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const { toast } = useToast()

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (!amount || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid deposit amount',
        variant: 'destructive'
      })
      return
    }

    if (!paymentMethod) {
      toast({
        title: 'Error',
        description: 'Please select a payment method',
        variant: 'destructive'
      })
      return
    }

    if (amount < 10) {
      toast({
        title: 'Error',
        description: 'Minimum deposit amount is ₹10',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'add',
          amount,
          method: paymentMethod,
          description: `Deposit of ₹${amount} via ${paymentMethod}`
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: `Successfully deposited ₹${amount} to your wallet`
        })
        setDepositAmount('')
        setPaymentMethod('')
        onBalanceUpdate?.()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to process deposit',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error processing deposit:', error)
      toast({
        title: 'Error',
        description: 'Failed to process deposit',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const paymentMethods = [
    {
      id: 'CARD',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="h-4 w-4" />,
      description: 'Visa, Mastercard, RuPay'
    },
    {
      id: 'UPI',
      name: 'UPI',
      icon: <Smartphone className="h-4 w-4" />,
      description: 'Google Pay, PhonePe, Paytm'
    },
    {
      id: 'NET_BANKING',
      name: 'Net Banking',
      icon: <Building2 className="h-4 w-4" />,
      description: 'Direct bank transfer'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
          <CardDescription>Your current wallet balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">₹{walletBalance.toFixed(2)}</div>
        </CardContent>
      </Card>

      {/* Deposit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Funds</CardTitle>
          <CardDescription>Deposit money to your wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter deposit amount"
              min="10"
              step="0.01"
            />
            <div className="text-sm text-muted-foreground">
              Minimum deposit: ₹10
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-1 gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <div className="flex items-center space-x-3">
                    {method.icon}
                    <div className="flex-1">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-muted-foreground">{method.description}</div>
                    </div>
                    {paymentMethod === method.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Funds will be added to your wallet immediately after successful payment.
              Processing fees may apply based on your payment method.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleDeposit}
            disabled={isSubmitting || !depositAmount || !paymentMethod}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Processing...' : `Deposit ₹${depositAmount || '0'}`}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Amount Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Amounts</CardTitle>
          <CardDescription>Choose from common deposit amounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1000, 2000, 5000, 10000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => setDepositAmount(amount.toString())}
                className="h-12"
              >
                ₹{amount}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}