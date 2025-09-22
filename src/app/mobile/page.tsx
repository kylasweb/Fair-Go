'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { NeoCard } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { MobileApp } from '@/components/mobile/MobileApp'
import { Smartphone, Wifi, Signal, Battery, Volume2 } from 'lucide-react'

export default function MobilePage() {
  const [currentTime, setCurrentTime] = useState('')
  const [batteryLevel, setBatteryLevel] = useState(100)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }))
    }

    // Update time every minute
    updateTime()
    const interval = setInterval(updateTime, 60000)

    // Simulate battery drain for demo
    const batteryInterval = setInterval(() => {
      setBatteryLevel(prev => prev > 20 ? prev - 1 : 100)
    }, 30000)

    return () => {
      clearInterval(interval)
      clearInterval(batteryInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <NeoCard variant="flat" className="container mx-auto px-4 py-4 rounded-none border-0 bg-transparent">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <NeoCard variant="raised" size="sm" className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FG</span>
              </NeoCard>
              <h1 className="text-2xl font-bold text-white">FairGo</h1>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 text-gray-300 text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Dynamic Pixel 9 Preview</span>
              </div>
              <Link href="/">
                <NeoButton variant="secondary">← Back to Home</NeoButton>
              </Link>
            </div>
          </div>
        </NeoCard>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 max-w-7xl mx-auto">
          
          {/* Instructions Panel */}
          <div className="lg:w-1/3 space-y-6">
            <NeoCard variant="raised" className="bg-white/10 dark:bg-black/30 backdrop-blur-sm p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Dynamic Mobile Preview
                  </h1>
                  <p className="text-gray-300 text-sm">Google Pixel 9 Interface</p>
                </div>
              </div>
              
              <div className="space-y-4 text-sm text-gray-300">
                <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                  <p className="text-green-300"><strong>✨ Fully Interactive:</strong> Click and navigate through the complete booking flow</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <p className="text-blue-300"><strong>🎯 Real Components:</strong> Uses the actual mobile app components</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <p className="text-purple-300"><strong>📱 Pixel 9 Design:</strong> Accurate dimensions and modern Android UI</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-500/20 rounded-lg border border-orange-500/30">
                <p className="text-xs text-orange-300 leading-relaxed">
                  <strong>For Mobile Users:</strong> Visit the main site on your phone for the optimized experience. This preview shows desktop users exactly how the mobile app works.
                </p>
              </div>
            </NeoCard>

            {/* Device Info */}
            <NeoCard variant="raised" className="bg-white/5 backdrop-blur-sm p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Device Specs</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-300">
                  <span className="text-gray-500">Model:</span> Pixel 9
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">OS:</span> Android 15
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">Display:</span> 6.3"
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">Resolution:</span> 2424×1080
                </div>
              </div>
            </NeoCard>
          </div>

          {/* Pixel 9 Phone Frame */}
          <div className="relative">
            {/* Phone Body with Pixel 9 proportions */}
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 p-2 rounded-[2rem] shadow-2xl">
              <div className="bg-black p-[3px] rounded-[1.7rem]">
                <div className="bg-white rounded-[1.4rem] overflow-hidden relative w-[360px] h-[780px]">
                  
                  {/* Dynamic Status Bar - Pixel 9 Style */}
                  <div className="bg-black h-9 flex items-center justify-between px-6 text-white relative">
                    {/* Left side - Time */}
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">{currentTime}</span>
                    </div>
                    
                    {/* Center - Punch hole camera */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                    </div>
                    
                    {/* Right side - Status icons */}
                    <div className="flex items-center space-x-2">
                      <Signal className="w-3 h-3" />
                      <Wifi className="w-3 h-3" />
                      <div className="flex items-center space-x-1">
                        <Battery className="w-4 h-3" />
                        <span className="text-xs">{batteryLevel}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dynamic App Content */}
                  <div className="h-[calc(100%-36px)] overflow-hidden bg-white">
                    <MobileApp />
                  </div>
                  
                  {/* Pixel 9 Navigation Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/5 flex items-center justify-center">
                    <div className="w-32 h-1 bg-gray-800 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Device Shadows and Effects */}
            <div className="absolute -inset-6 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 blur-2xl rounded-full -z-10 animate-pulse"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-gray-600/20 to-gray-400/20 blur-xl rounded-3xl -z-10"></div>
            
            {/* Floating UI Elements */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            
            <div className="absolute -bottom-6 -left-6 w-10 h-10 bg-gradient-to-r from-orange-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
          </div>

          {/* Live Stats Panel */}
          <div className="lg:w-1/4 space-y-4">
            <NeoCard variant="raised" className="bg-white/5 backdrop-blur-sm p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Live Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Battery:</span>
                  <span className={`font-medium ${batteryLevel > 50 ? 'text-green-400' : batteryLevel > 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {batteryLevel}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Signal:</span>
                  <span className="text-green-400 font-medium">Strong</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-blue-400 font-medium">5G</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time:</span>
                  <span className="text-white font-medium">{currentTime}</span>
                </div>
              </div>
            </NeoCard>

            <NeoCard variant="raised" className="bg-white/5 backdrop-blur-sm p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Interactive Navigation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Real-time Updates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">AI Voice Integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Live Tracking</span>
                </div>
              </div>
            </NeoCard>
          </div>
        </div>
      </div>
    </div>
  )
}