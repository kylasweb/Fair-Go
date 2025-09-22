'use client'

import { useState, useEffect } from 'react'
import { AdminLogin } from '@/components/admin/admin-login'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { useToast } from '@/hooks/use-toast'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if admin is already logged in
    const adminToken = localStorage.getItem('fairgo_admin_token')
    if (adminToken) {
      setIsAdmin(true)
    }
  }, [])

  const handleAdminLogin = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const result = await response.json()

      if (response.ok) {
        localStorage.setItem('fairgo_admin_token', result.token)
        setIsAdmin(true)
        toast({
          title: 'Welcome to Admin Panel',
          description: `Logged in as ${result.user.name || result.user.email}`,
        })
      } else {
        toast({
          title: 'Login Failed',
          description: result.message || 'Invalid credentials',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Admin login error:', error)
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('fairgo_admin_token')
    setIsAdmin(false)
  }

  if (!isAdmin) {
    return <AdminLogin onLogin={handleAdminLogin} isLoading={isLoading} />
  }

  return <AdminDashboard onSignOut={handleSignOut} />
}