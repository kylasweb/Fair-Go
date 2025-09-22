'use client'

import { useState, useEffect } from 'react'

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkMobile = () => {
            // Check screen size
            const screenCheck = window.innerWidth <= 768

            // Check user agent for mobile devices
            const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            )

            // Check for touch capability
            const touchCheck = 'ontouchstart' in window || navigator.maxTouchPoints > 0

            // More sophisticated mobile detection
            const mobileCheck = screenCheck || (userAgentCheck && touchCheck)

            setIsMobile(mobileCheck)
            setIsLoading(false)
        }

        // Initial check
        checkMobile()

        // Listen for resize events
        const handleResize = () => {
            checkMobile()
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return { isMobile, isLoading }
}

export function getMobileInfo() {
    if (typeof window === 'undefined') return null

    return {
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio,
        touchPoints: navigator.maxTouchPoints,
        platform: navigator.platform,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    }
}