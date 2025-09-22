'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'raised' | 'pressed' | 'flat' | 'inset'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

export function NeoCard({ 
  variant = 'raised', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: NeoCardProps) {
  const baseClasses = 'transition-all duration-300 ease-in-out'
  
  const sizeClasses = {
    sm: 'p-3 rounded-neo-sm',
    md: 'p-4 rounded-neo',
    lg: 'p-6 rounded-neo-lg',
    xl: 'p-8 rounded-neo-xl'
  }
  
  const variantClasses = {
    raised: 'bg-neo-light dark:bg-neo-dark shadow-neo-outset dark:shadow-neo-dark-outset hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised',
    pressed: 'bg-neo-light dark:bg-neo-dark shadow-neo-inset dark:shadow-neo-dark-inset',
    flat: 'bg-neo-light dark:bg-neo-dark shadow-neo-flat dark:shadow-neo-dark-flat hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised',
    inset: 'bg-neo-light dark:bg-neo-dark shadow-neo-pressed dark:shadow-neo-dark-pressed'
  }
  
  return (
    <div
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}