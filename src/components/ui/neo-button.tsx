'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  isPressed?: boolean
}

export function NeoButton({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children,
  isPressed = false,
  disabled,
  ...props 
}: NeoButtonProps) {
  const baseClasses = 'transition-all duration-200 ease-in-out font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-neo-dark'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-neo-sm',
    md: 'px-4 py-2 text-base rounded-neo',
    lg: 'px-6 py-3 text-lg rounded-neo-lg'
  }
  
  const variantClasses = {
    primary: cn(
      'bg-orange-500 text-white',
      'shadow-neo-outset dark:shadow-neo-dark-outset',
      'hover:bg-orange-600 hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised',
      'active:shadow-neo-pressed dark:active:shadow-neo-dark-pressed active:animate-neo-press',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    secondary: cn(
      'bg-neo-light dark:bg-neo-dark text-gray-700 dark:text-gray-200',
      'shadow-neo-outset dark:shadow-neo-dark-outset',
      'hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised',
      'active:shadow-neo-pressed dark:active:shadow-neo-dark-pressed active:animate-neo-press',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    ghost: cn(
      'bg-transparent text-gray-700 dark:text-gray-200',
      'hover:bg-neo-light/50 dark:hover:bg-neo-dark/50',
      'hover:shadow-neo-flat dark:hover:shadow-neo-dark-flat',
      'active:bg-neo-light dark:active:bg-neo-dark',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    danger: cn(
      'bg-red-500 text-white',
      'shadow-neo-outset dark:shadow-neo-dark-outset',
      'hover:bg-red-600 hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised',
      'active:shadow-neo-pressed dark:active:shadow-neo-dark-pressed active:animate-neo-press',
      disabled && 'opacity-50 cursor-not-allowed'
    )
  }
  
  const pressedClasses = isPressed ? 'shadow-neo-pressed dark:shadow-neo-dark-pressed' : ''
  
  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        pressedClasses,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}