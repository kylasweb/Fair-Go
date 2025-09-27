'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, XCircle, Clock, Eye, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface WithdrawalRequest {
  id: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  description: string
  createdAt: string
  processedAt?: string
  failureReason?: string
  wallet: {
    user: {
      id: string
      name: string
      email: string
    }
  }
  withdrawalMethod: {
    type: 'BANK_TRANSFER' | 'UPI' | 'PAYPAL' | 'STRIPE'
    accountNumber?: string
    accountHolderName?: string
    bankName?: string
    ifscCode?: string
    upiId?: string
    paypalEmail?: string
    stripeAccountId?: string
  }
}

export default function AdminTransactionManager() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null)
  const [action, setAction] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/withdrawals?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRequests(data.transactions)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch withdrawal requests',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch withdrawal requests',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessRequest = async () => {
    if (!selectedRequest) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionId: selectedRequest.id,
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined
        })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Withdrawal request ${action.toLowerCase()}d successfully`
        })
        setShowDialog(false)
        setSelectedRequest(null)
        setRejectionReason('')
        fetchRequests()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to process request',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error processing request:', error)
      toast({
        title: 'Error',
        description: 'Failed to process request',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'FAILED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getMethodDisplay = (method: WithdrawalRequest['withdrawalMethod']) => {
    switch (method.type) {
      case 'BANK_TRANSFER':
        return `${method.bankName} - ${method.accountNumber?.slice(-4)}`
      case 'UPI':
        return method.upiId
      case 'PAYPAL':
        return method.paypalEmail
      case 'STRIPE':
        return `Stripe ${method.stripeAccountId?.slice(-4)}`
      default:
        return method.type
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING')

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{requests.filter(r => r.status === 'COMPLETED').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{requests.filter(r => r.status === 'FAILED').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold">₹</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  ₹{requests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>Manage driver withdrawal requests</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No withdrawal requests found
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{request.wallet.user.name}</div>
                        <div className="text-sm text-muted-foreground">{request.wallet.user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{request.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {getMethodDisplay(request.withdrawalMethod)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {request.description}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Requested: {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                      {request.processedAt && (
                        <> • Processed: {format(new Date(request.processedAt), 'MMM dd, yyyy HH:mm')}</>
                      )}
                    </div>
                    {request.failureReason && (
                      <div className="mt-2 text-sm text-red-600">
                        Reason: {request.failureReason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(request.status)}
                    {request.status === 'PENDING' && (
                      <Dialog open={showDialog && selectedRequest?.id === request.id} onOpenChange={(open) => {
                        setShowDialog(open)
                        if (!open) setSelectedRequest(null)
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Withdrawal Request</DialogTitle>
                            <DialogDescription>
                              Review and process the withdrawal request for {request.wallet.user.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Driver</label>
                                <p className="text-sm">{request.wallet.user.name}</p>
                                <p className="text-xs text-muted-foreground">{request.wallet.user.email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Amount</label>
                                <p className="text-lg font-bold">₹{request.amount.toFixed(2)}</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Withdrawal Method</label>
                              <p className="text-sm">{getMethodDisplay(request.withdrawalMethod)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Description</label>
                              <p className="text-sm">{request.description}</p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Action</label>
                              <Select value={action} onValueChange={(value: 'APPROVE' | 'REJECT') => setAction(value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="APPROVE">Approve</SelectItem>
                                  <SelectItem value="REJECT">Reject</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {action === 'REJECT' && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Rejection Reason</label>
                                <Textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Enter reason for rejection"
                                />
                              </div>
                            )}
                            <div className="flex space-x-2">
                              <Button
                                onClick={handleProcessRequest}
                                className="flex-1"
                                variant={action === 'APPROVE' ? 'default' : 'destructive'}
                              >
                                {action === 'APPROVE' ? 'Approve' : 'Reject'} Request
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setShowDialog(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}