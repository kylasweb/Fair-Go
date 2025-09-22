import { Phone } from 'lucide-react'

interface FairGoLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function FairGoLogo({ size = 'md', className = '' }: FairGoLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-orange-500 rounded-lg flex items-center justify-center`}>
        <Phone className={`${iconSizeClasses[size]} text-white`} />
      </div>
      <span className={`font-bold text-gray-900 ${
        size === 'sm' ? 'text-lg' : 
        size === 'md' ? 'text-xl' : 
        'text-2xl'
      }`}>
        FairGo
      </span>
    </div>
  )
}