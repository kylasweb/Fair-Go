import { NeoButton } from '@/components/ui/neo-button'
import { Phone, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CallToBookButtonProps {
  phoneNumber?: string
  onCall?: () => void
  className?: string
}

export function CallToBookButton({ 
  phoneNumber = '1800-FAIRGO', 
  onCall,
  className = '' 
}: CallToBookButtonProps) {
  const [isCalling, setIsCalling] = useState(false)
  const router = useRouter()

  const handleCall = async () => {
    setIsCalling(true)
    try {
      if (onCall) {
        await onCall()
      } else {
        // Navigate to dedicated Call to Book page
        router.push('/call-to-book')
      }
    } catch (error) {
      console.error('Call initiation failed:', error)
    } finally {
      setIsCalling(false)
    }
  }

  return (
    <NeoButton 
      variant="primary"
      size="lg" 
      className={`bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white ${className}`}
      onClick={handleCall}
      disabled={isCalling}
    >
      {isCalling ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Phone className="w-5 h-5 mr-2" />
          Call to Book
        </>
      )}
    </NeoButton>
  )
}