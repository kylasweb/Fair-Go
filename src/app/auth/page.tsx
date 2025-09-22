'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignInForm } from '@/components/auth/signin-form'
import { useToast } from '@/hooks/use-toast'

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignIn = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sign in failed')
      }

      const { user, token } = await response.json()
      localStorage.setItem('fairgo_token', token)
      
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${user.name || user.email}`,
      })

      router.push('/booking')
    } catch (error) {
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (userData: { 
    name: string; 
    email: string; 
    phone: string; 
    password: string 
  }) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sign up failed')
      }

      const { user, token } = await response.json()
      localStorage.setItem('fairgo_token', token)
      
      toast({
        title: 'Account created!',
        description: `Welcome to FairGo, ${user.name}!`,
      })

      router.push('/booking')
    } catch (error) {
      toast({
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FairGo</h1>
          <p className="text-gray-600 mt-2">AI-powered taxi booking platform</p>
        </div>
        
        <SignInForm 
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}