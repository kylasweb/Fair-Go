'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle } from 'lucide-react'

interface BidTimerProps {
  endTime: string
  onExpire?: () => void
  className?: string
  showWarning?: boolean
}

export default function BidTimer({
  endTime,
  onExpire,
  className,
  showWarning = true
}: BidTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime)
      const now = new Date()
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Expired')
        setIsExpired(true)
        setIsWarning(false)
        onExpire?.()
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`
      setTimeLeft(formattedTime)
      setIsExpired(false)

      // Show warning when less than 1 minute remaining
      setIsWarning(diff < 60000)
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [endTime, onExpire])

  if (isExpired) {
    return (
      <Badge variant="destructive" className={className}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        Bidding Closed
      </Badge>
    )
  }

  return (
    <Badge
      variant={isWarning ? "destructive" : "secondary"}
      className={`${className} ${isWarning ? 'animate-pulse' : ''}`}
    >
      <Clock className="h-3 w-3 mr-1" />
      {timeLeft}
      {isWarning && <AlertTriangle className="h-3 w-3 ml-1" />}
    </Badge>
  )
}

// Hook for managing bid timer state
export function useBidTimer(endTime: string) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime)
      const now = new Date()
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Expired')
        setIsExpired(true)
        setIsWarning(false)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`
      setTimeLeft(formattedTime)
      setIsExpired(false)
      setIsWarning(diff < 60000)
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  return { timeLeft, isExpired, isWarning }
}