'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Edit, Save, X, Plus, TrendingUp, Users, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface DriverCommission {
  id: string
  driverId: string
  baseCommission: number
  peakHourCommission: number
  nightCommission: number
  weekendCommission: number
  longDistanceCommission?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  driver: {
    user: {
      name: string
      email: string
    }
  }
}

interface CommissionFormData {
  driverId: string
  baseCommission: number
  peakHourCommission: number
  nightCommission: number
  weekendCommission: number
  longDistanceCommission?: number
}

export default function CommissionManagement() {
  const [commissions, setCommissions] = useState<DriverCommission[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState<DriverCommission | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<CommissionFormData>({
    driverId: '',
    baseCommission: 10.00,
    peakHourCommission: 15.00,
    nightCommission: 12.00,
    weekendCommission: 12.00,
    longDistanceCommission: undefined
  })

  // Fetch commissions and drivers
  useEffect(() => {
    fetchCommissions()
    fetchDrivers()
  }, [])

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/commissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCommissions(data)
      } else {
        toast.error('Failed to fetch commission data')
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
      toast.error('Error loading commission data')
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/drivers?status=APPROVED', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDrivers(data.drivers || data)
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const handleEditCommission = (commission: DriverCommission) => {
    setSelectedCommission(commission)
    setFormData({
      driverId: commission.driverId,
      baseCommission: commission.baseCommission,
      peakHourCommission: commission.peakHourCommission,
      nightCommission: commission.nightCommission,
      weekendCommission: commission.weekendCommission,
      longDistanceCommission: commission.longDistanceCommission
    })
    setIsDialogOpen(true)
  }

  const handleCreateCommission = () => {
    setSelectedCommission(null)
    setFormData({
      driverId: '',
      baseCommission: 10.00,
      peakHourCommission: 15.00,
      nightCommission: 12.00,
      weekendCommission: 12.00,
      longDistanceCommission: undefined
    })
    setIsDialogOpen(true)
  }

  const handleSaveCommission = async () => {
    if (!formData.driverId) {
      toast.error('Please select a driver')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('adminToken')
      const url = selectedCommission
        ? `/api/admin/commissions?driverId=${formData.driverId}`
        : '/api/admin/commissions'

      const method = selectedCommission ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(selectedCommission ? 'Commission updated successfully' : 'Commission created successfully')
        setIsDialogOpen(false)
        fetchCommissions()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save commission')
      }
    } catch (error) {
      console.error('Error saving commission:', error)
      toast.error('Error saving commission')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCommission = async (driverId: string) => {
    if (!confirm('Are you sure you want to reset this driver\'s commission to defaults?')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/commissions?driverId=${driverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Commission reset to defaults')
        fetchCommissions()
      } else {
        toast.error('Failed to reset commission')
      }
    } catch (error) {
      console.error('Error deleting commission:', error)
      toast.error('Error resetting commission')
    }
  }

  const getAvailableDrivers = () => {
    const usedDriverIds = commissions.map(c => c.driverId)
    return drivers.filter(driver => !usedDriverIds.includes(driver.id) || driver.id === formData.driverId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Commission Management</h2>
          <p className="text-muted-foreground">
            Configure commission rates for drivers across different time periods and conditions
          </p>
        </div>
        <Button onClick={handleCreateCommission}>
          <Plus className="h-4 w-4 mr-2" />
          Add Commission
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissions.length}</div>
            <p className="text-xs text-muted-foreground">
              With custom commission rates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Base Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {commissions.length > 0
                ? (commissions.reduce((sum, c) => sum + c.baseCommission, 0) / commissions.length).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all drivers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {commissions.filter(c => c.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active commission rules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Table */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Commission Rates</CardTitle>
          <CardDescription>
            Manage commission rates for individual drivers. Rates are applied based on time and distance conditions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Peak Hours</TableHead>
                <TableHead>Night</TableHead>
                <TableHead>Weekend</TableHead>
                <TableHead>Long Distance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{commission.driver.user.name}</div>
                      <div className="text-sm text-muted-foreground">{commission.driver.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{commission.baseCommission}%</TableCell>
                  <TableCell>{commission.peakHourCommission}%</TableCell>
                  <TableCell>{commission.nightCommission}%</TableCell>
                  <TableCell>{commission.weekendCommission}%</TableCell>
                  <TableCell>{commission.longDistanceCommission ? `${commission.longDistanceCommission}%` : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={commission.isActive ? 'default' : 'secondary'}>
                      {commission.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCommission(commission)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCommission(commission.driverId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {commissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No custom commission rates configured. All drivers use default rates (10%).
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Commission Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCommission ? 'Edit Commission Rates' : 'Create Commission Rates'}
            </DialogTitle>
            <DialogDescription>
              Configure commission rates for different time periods and conditions.
              Rates are applied automatically based on booking time and distance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="driver" className="text-right">
                Driver
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.driverId}
                  onValueChange={(value) => setFormData({ ...formData, driverId: value })}
                  disabled={!!selectedCommission}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableDrivers().map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.user.name} - {driver.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseCommission" className="text-right">
                Base Rate (%)
              </Label>
              <div className="col-span-3">
                <Input
                  id="baseCommission"
                  type="number"
                  step="0.1"
                  value={formData.baseCommission}
                  onChange={(e) => setFormData({ ...formData, baseCommission: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Default commission rate for normal hours
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="peakHourCommission" className="text-right">
                Peak Hours (%)
              </Label>
              <div className="col-span-3">
                <Input
                  id="peakHourCommission"
                  type="number"
                  step="0.1"
                  value={formData.peakHourCommission}
                  onChange={(e) => setFormData({ ...formData, peakHourCommission: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Applied during weekday peak hours (7-9 AM, 5-7 PM)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nightCommission" className="text-right">
                Night Rate (%)
              </Label>
              <div className="col-span-3">
                <Input
                  id="nightCommission"
                  type="number"
                  step="0.1"
                  value={formData.nightCommission}
                  onChange={(e) => setFormData({ ...formData, nightCommission: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Applied during night hours (10 PM - 5 AM)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weekendCommission" className="text-right">
                Weekend Rate (%)
              </Label>
              <div className="col-span-3">
                <Input
                  id="weekendCommission"
                  type="number"
                  step="0.1"
                  value={formData.weekendCommission}
                  onChange={(e) => setFormData({ ...formData, weekendCommission: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Applied on Saturdays and Sundays
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="longDistanceCommission" className="text-right">
                Long Distance (%)
              </Label>
              <div className="col-span-3">
                <Input
                  id="longDistanceCommission"
                  type="number"
                  step="0.1"
                  value={formData.longDistanceCommission || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    longDistanceCommission: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  placeholder="Optional"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Applied to rides over 50km (leave empty to use base rate)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCommission} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Commission
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Alert>
        <AlertDescription>
          <strong>Commission Calculation Logic:</strong> Rates are applied based on booking time and distance.
          Peak hours apply on weekdays 7-9 AM and 5-7 PM. Night rates apply 10 PM - 5 AM.
          Weekend rates apply Saturday-Sunday. Long distance rates apply to rides over 50km.
        </AlertDescription>
      </Alert>
    </div>
  )
}