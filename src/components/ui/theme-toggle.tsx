'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ 
  size = 'md', 
  className,
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }
  
  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {theme === 'light' ? 'Light' : 'Dark'}
        </span>
      )}
      <button
        onClick={toggleTheme}
        className={cn(
          'relative flex items-center justify-center',
          'bg-neo-light dark:bg-neo-dark',
          'text-gray-700 dark:text-gray-200',
          'shadow-neo-outset dark:shadow-neo-dark-outset',
          'hover:shadow-neo-raised dark:hover:shadow-neo-dark-raised',
          'active:shadow-neo-pressed dark:active:shadow-neo-dark-pressed',
          'rounded-full transition-all duration-300 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-neo-dark',
          'animate-theme-switch',
          sizeClasses[size]
        )}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <div className="relative">
          {theme === 'light' ? (
            <Sun 
              size={iconSize[size]} 
              className="text-orange-500 animate-in spin-in-180 duration-300" 
            />
          ) : (
            <Moon 
              size={iconSize[size]} 
              className="text-blue-400 animate-in spin-in-180 duration-300" 
            />
          )}
        </div>
      </button>
    </div>
  )
}

// Advanced toggle with sliding animation
export function ThemeSlideToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className={cn(
        'text-sm font-medium transition-colors duration-300',
        theme === 'light' ? 'text-gray-700' : 'text-gray-400'
      )}>
        Light
      </span>
      
      <button
        onClick={toggleTheme}
        className={cn(
          'relative w-16 h-8 rounded-full transition-all duration-300 ease-in-out',
          'bg-neo-light dark:bg-neo-dark',
          'shadow-neo-inset dark:shadow-neo-dark-inset',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-neo-dark'
        )}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {/* Sliding indicator */}
        <div
          className={cn(
            'absolute top-1 w-6 h-6 rounded-full transition-all duration-300 ease-in-out',
            'bg-neo-light dark:bg-neo-dark',
            'shadow-neo-outset dark:shadow-neo-dark-outset',
            'flex items-center justify-center',
            theme === 'light' ? 'left-1' : 'left-9'
          )}
        >
          {theme === 'light' ? (
            <Sun size={14} className="text-orange-500" />
          ) : (
            <Moon size={14} className="text-blue-400" />
          )}
        </div>
      </button>
      
      <span className={cn(
        'text-sm font-medium transition-colors duration-300',
        theme === 'dark' ? 'text-gray-200' : 'text-gray-400'
      )}>
        Dark
      </span>
    </div>
  )
}