import { MobileApp } from '@/components/mobile/MobileApp'

export default function MobilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Mobile Frame */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative">
          {/* Phone Frame */}
          <div className="bg-gray-900 p-2 rounded-[2.5rem] shadow-2xl">
            <div className="bg-black p-1 rounded-[2rem]">
              <div className="bg-white rounded-[1.5rem] overflow-hidden relative">
                {/* Status Bar */}
                <div className="bg-black h-8 flex items-center justify-between px-6 text-white text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    <span className="ml-2 text-xs">FairGo</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">9:41</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-2 bg-white rounded-sm"></div>
                    <span className="text-xs">100%</span>
                  </div>
                </div>
                
                {/* App Content */}
                <div className="h-[812px] overflow-hidden">
                  <MobileApp />
                </div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Phone Shadow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl rounded-full -z-10"></div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute top-8 left-8 max-w-sm">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            FairGo Mobile Experience
          </h1>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>1. Homepage:</strong> Choose between call or online booking</p>
            <p><strong>2. Service Selection:</strong> Pick your ride type</p>
            <p><strong>3. AI Assistant:</strong> Voice-powered booking experience</p>
            <p><strong>4. Confirmation:</strong> Review and track your ride</p>
            <p><strong>5. Live Tracking:</strong> Real-time trip monitoring</p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Demo Mode:</strong> This is a fully functional UI prototype showcasing the mobile app experience
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}