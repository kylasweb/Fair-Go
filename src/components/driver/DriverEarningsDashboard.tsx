'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, CalendarIcon, DollarSign, TrendingUp, Clock, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface CommissionSummary {
  driverId: string
  period: {
    startDate: string
    endDate: string
  }
  totalRides: number
  totalEarnings: number
  totalCommission: number
  netEarnings: number
  averageCommissionRate: number
  recentBookings: Array<{
    id: string
    amount: number
    commission: number
    rate: number
    date: string
  }>
}

interface DriverCommission {
  id: string
  baseCommission: number
  peakHourCommission: number
  nightCommission: number
  weekendCommission: number
  longDistanceCommission?: number
  isActive: boolean
}

export default function DriverEarningsDashboard() {
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [commissionSettings, setCommissionSettings] = useState<DriverCommission | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30 days ago
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [period, setPeriod] = useState('30d')

  // Get driver ID from context or localStorage
  const driverId = typeof window !== 'undefined' ? localStorage.getItem('driverId') : null

  useEffect(() => {
    if (driverId) {
      fetchEarningsSummary()
      fetchCommissionSettings()
    }
  }, [driverId, startDate, endDate])

  const fetchEarningsSummary = async () => {
    if (!driverId) return

    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(
        `/api/bookings/calculate-commission?driverId=${driverId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSummary(data.data)
      } else {
        toast.error('Failed to fetch earnings summary')
      }
    } catch (error) {
      console.error('Error fetching earnings:', error)
      toast.error('Error loading earnings data')
    } finally {
      setLoading(false)
    }
  }

  const fetchCommissionSettings = async () => {
    if (!driverId) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/commissions?driverId=${driverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCommissionSettings(data)
      }
    } catch (error) {
      console.error('Error fetching commission settings:', error)
    }
  }

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    const now = new Date()

    switch (value) {
      case '7d':
        setStartDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
        break
      case '30d':
        setStartDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
        break
      case '90d':
        setStartDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))
        break
      case '1y':
        setStartDate(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000))
        break
    }
    setEndDate(now)
  }

  if (!driverId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in as a driver to view earnings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Earnings Dashboard</h2>
          <p className="text-muted-foreground">
            Track your earnings, commissions, and ride performance
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Custom Range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{
                  from: startDate,
                  to: endDate
                }}
                onSelect={(range) => {
                  if (range?.from) setStartDate(range.from)
                  if (range?.to) setEndDate(range.to)
                  setPeriod('custom')
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalRides}</div>
                <p className="text-xs text-muted-foreground">
                  Completed rides
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{summary.totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Gross earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{summary.totalCommission.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.averageCommissionRate.toFixed(1)}% average rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{summary.netEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  After commission
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Settings */}
          {commissionSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Your Commission Rates</CardTitle>
                <CardDescription>
                  Current commission rates applied to your earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{commissionSettings.baseCommission}%</div>
                    <p className="text-sm text-muted-foreground">Base Rate</p>
                    <p className="text-xs text-muted-foreground">Normal hours</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{commissionSettings.peakHourCommission}%</div>
                    <p className="text-sm text-muted-foreground">Peak Hours</p>
                    <p className="text-xs text-muted-foreground">7-9 AM, 5-7 PM weekdays</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{commissionSettings.nightCommission}%</div>
                    <p className="text-sm text-muted-foreground">Night Rate</p>
                    <p className="text-xs text-muted-foreground">10 PM - 5 AM</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{commissionSettings.weekendCommission}%</div>
                    <p className="text-sm text-muted-foreground">Weekend Rate</p>
                    <p className="text-xs text-muted-foreground">Saturday & Sunday</p>
                  </div>
                  {commissionSettings.longDistanceCommission && (
                    <div className="text-center">
                      <div className="text-2xl font-bold">{commissionSettings.longDistanceCommission}%</div>
                      <p className="text-sm text-muted-foreground">Long Distance</p>
                      <p className="text-xs text-muted-foreground">Rides over 50km</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
              <CardDescription>
                Your last 10 completed rides and earnings breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Ride Amount</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Your Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.recentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {format(new Date(booking.date), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>₹{booking.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{booking.rate}%</Badge>
                      </TableCell>
                      <TableCell>₹{booking.commission?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="font-medium">
                        ₹{(booking.amount - (booking.commission || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {summary.recentBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No completed rides in the selected period
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">No earnings data available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}