'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function NeoInput({ 
  label, 
  error, 
  className, 
  id,
  ...props 
}: NeoInputProps) {
  const inputId = id || `neo-input-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            'w-full px-4 py-3 bg-neo-light dark:bg-neo-dark',
            'text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500',
            'shadow-neo-inset dark:shadow-neo-dark-inset',
            'border-0 rounded-neo',
            'focus:shadow-neo-pressed dark:focus:shadow-neo-dark-pressed',
            'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-neo-dark',
            'transition-all duration-200 ease-in-out',
            error && 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-neo-dark',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  )
}

interface NeoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function NeoTextarea({ 
  label, 
  error, 
  className, 
  id,
  ...props 
}: NeoTextareaProps) {
  const inputId = id || `neo-textarea-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={inputId}
          className={cn(
            'w-full px-4 py-3 bg-neo-light dark:bg-neo-dark',
            'text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500',
            'shadow-neo-inset dark:shadow-neo-dark-inset',
            'border-0 rounded-neo',
            'focus:shadow-neo-pressed dark:focus:shadow-neo-dark-pressed',
            'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-neo-dark',
            'transition-all duration-200 ease-in-out',
            'resize-vertical min-h-[100px]',
            error && 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-neo-dark',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  )
}