'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreditCard, Smartphone, Wallet, Building2, CheckCircle, AlertCircle } from 'lucide-react'

interface PaymentMethod {
  id: string
  type: 'UPI' | 'WALLET' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING'
  name: string
  description: string
  icon: React.ReactNode
  isDefault?: boolean
}

interface PaymentMethodsProps {
  selectedMethod: string | null
  onMethodSelect: (methodId: string) => void
  amount: number
  onPaymentComplete: (paymentData: any) => void
}

export function PaymentMethods({ selectedMethod, onMethodSelect, amount, onPaymentComplete }: PaymentMethodsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  })

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'upi',
      type: 'UPI',
      name: 'UPI Payment',
      description: 'Pay using any UPI app',
      icon: <Smartphone className="w-5 h-5 text-blue-500" />
    },
    {
      id: 'wallet',
      type: 'WALLET',
      name: 'FairGo Wallet',
      description: 'Use your wallet balance',
      icon: <Wallet className="w-5 h-5 text-green-500" />
    },
    {
      id: 'credit_card',
      type: 'CREDIT_CARD',
      name: 'Credit Card',
      description: 'Visa, Mastercard, RuPay',
      icon: <CreditCard className="w-5 h-5 text-purple-500" />
    },
    {
      id: 'debit_card',
      type: 'DEBIT_CARD',
      name: 'Debit Card',
      description: 'Visa, Mastercard, RuPay',
      icon: <CreditCard className="w-5 h-5 text-orange-500" />
    },
    {
      id: 'net_banking',
      type: 'NET_BANKING',
      name: 'Net Banking',
      description: 'Pay directly from your bank',
      icon: <Building2 className="w-5 h-5 text-red-500" />
    }
  ]

  const handlePayment = async () => {
    if (!selectedMethod) return

    setIsProcessing(true)
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      const paymentData = {
        method: selectedMethod,
        amount,
        details: paymentDetails,
        status: 'COMPLETED',
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      onPaymentComplete(paymentData)
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'upi':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                placeholder="yourname@upi"
                value={paymentDetails.upiId}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
              />
              <p className="text-sm text-gray-500">
                Enter your UPI ID (e.g., mobile@upi or username@upi)
              </p>
            </div>
          </div>
        )

      case 'wallet':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Wallet Balance</p>
                  <p className="text-2xl font-bold text-green-600">₹1,250</p>
                </div>
                <Wallet className="w-8 h-8 text-green-500" />
              </div>
            </div>
            {amount > 1250 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-700">
                    Insufficient wallet balance. Please add funds or choose another payment method.
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      case 'credit_card':
      case 'debit_card':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentDetails.cardNumber}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={paymentDetails.expiryDate}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={paymentDetails.cvv}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                  maxLength={3}
                  type="password"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cardHolderName">Cardholder Name</Label>
              <Input
                id="cardHolderName"
                placeholder="John Doe"
                value={paymentDetails.cardHolderName}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, cardHolderName: e.target.value })}
              />
            </div>
          </div>
        )

      case 'net_banking':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Bank</Label>
              <Select onValueChange={(value) => setPaymentDetails({ ...paymentDetails, bankName: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hdfc">HDFC Bank</SelectItem>
                  <SelectItem value="icici">ICICI Bank</SelectItem>
                  <SelectItem value="sbi">State Bank of India</SelectItem>
                  <SelectItem value="axis">Axis Bank</SelectItem>
                  <SelectItem value="kotak">Kotak Mahindra Bank</SelectItem>
                  <SelectItem value="pnb">Punjab National Bank</SelectItem>
                  <SelectItem value="bob">Bank of Baroda</SelectItem>
                  <SelectItem value="other">Other Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {paymentDetails.bankName === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890"
                  value={paymentDetails.accountNumber}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                placeholder="HDFC0001234"
                value={paymentDetails.ifscCode}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, ifscCode: e.target.value })}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isFormValid = () => {
    switch (selectedMethod) {
      case 'upi':
        return paymentDetails.upiId.length > 0
      case 'wallet':
        return amount <= 1250
      case 'credit_card':
      case 'debit_card':
        return paymentDetails.cardNumber.length >= 16 && 
               paymentDetails.expiryDate.length === 5 &&
               paymentDetails.cvv.length === 3 &&
               paymentDetails.cardHolderName.length > 0
      case 'net_banking':
        return paymentDetails.bankName.length > 0 && 
               paymentDetails.ifscCode.length > 0
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        <RadioGroup value={selectedMethod || ''} onValueChange={onMethodSelect}>
          <div className="grid md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="relative">
                <RadioGroupItem
                  value={method.id}
                  id={method.id}
                  className="peer sr-only"
                />
                <label
                  htmlFor={method.id}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors peer-checked:border-orange-500 peer-checked:bg-orange-50 hover:bg-gray-50 ${
                    selectedMethod === method.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  {method.icon}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{method.name}</h4>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-orange-500 peer-checked:bg-orange-500 flex items-center justify-center">
                    {selectedMethod === method.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Payment Form */}
      {selectedMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {paymentMethods.find(m => m.id === selectedMethod)?.icon}
              <span>{paymentMethods.find(m => m.id === selectedMethod)?.name}</span>
            </CardTitle>
            <CardDescription>
              Enter your payment details to complete the transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderPaymentForm()}
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{amount}</p>
              </div>
              <Button
                onClick={handlePayment}
                disabled={!isFormValid() || isProcessing}
                className="bg-green-500 hover:bg-green-600"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${amount}`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Secure Payment</h4>
            <p className="text-sm text-blue-700">
              Your payment information is encrypted and securely processed. We never store your full card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}