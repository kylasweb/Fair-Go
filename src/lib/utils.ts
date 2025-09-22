import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utility
export function formatCurrency(
  amount: number,
  currency: 'INR' | 'USD' | 'EUR' = 'INR'
): string {
  const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€'
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(Math.abs(amount))

  const symbol = currencySymbols[currency]
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`
}

// Distance calculation utility (Haversine formula)
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Fare estimation utility
export function generateEstimatedFare(
  distance: number,
  vehicleType: 'AUTO' | 'CAR_ECONOMY' | 'CAR_PREMIUM',
  surgeMultiplier: number = 1.0
): number {
  const baseFares = {
    AUTO: 25,
    CAR_ECONOMY: 40,
    CAR_PREMIUM: 60
  }

  const perKmRates = {
    AUTO: 12,
    CAR_ECONOMY: 18,
    CAR_PREMIUM: 28
  }

  const baseFare = baseFares[vehicleType]
  const distanceFare = distance * perKmRates[vehicleType]
  const totalFare = (baseFare + distanceFare) * surgeMultiplier

  return Math.round(totalFare)
}

// Email validation utility
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim()) && !email.includes('..')
}

// Phone validation utility (Indian format)
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')

  // Check for Indian phone number patterns
  const patterns = [
    /^[6-9]\d{9}$/, // 10 digit starting with 6-9
    /^91[6-9]\d{9}$/, // With country code
  ]

  return patterns.some(pattern => pattern.test(cleanPhone))
}

// Time formatting utility
export function formatTimeAgo(date: Date): string {
  const now = Date.now()
  const diffInMs = now - date.getTime()

  if (diffInMs < 0) return 'just now' // Future date

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes === 1) return '1 minute ago'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInHours === 1) return '1 hour ago'
  if (diffInHours < 24) return `${diffInHours} hours ago`
  if (diffInDays === 1) return '1 day ago'
  return `${diffInDays} days ago`
}

// Booking ID generation utility
export function generateBookingId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substr(2, 5)
  return `FG${timestamp}${randomStr}`.toUpperCase()
}

// String slugification utility
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove all special characters except letters, numbers, and spaces
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}
