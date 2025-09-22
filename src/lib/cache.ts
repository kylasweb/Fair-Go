/**
 * Advanced Caching Utilities for FairGo Platform
 * Implements multiple caching strategies for optimal performance
 */

import React from 'react'

// Types
interface CacheItem<T> {
    data: T
    timestamp: number
    ttl: number
    accessCount: number
    lastAccessed: number
}

interface CacheConfig {
    maxSize: number
    defaultTTL: number
    cleanupInterval: number
}

// In-memory cache with LRU eviction
export class MemoryCache<T = any> {
    private cache = new Map<string, CacheItem<T>>()
    private config: CacheConfig
    private cleanupTimer?: NodeJS.Timeout

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = {
            maxSize: 100,
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            cleanupInterval: 60 * 1000, // 1 minute
            ...config
        }

        // Start cleanup timer
        this.startCleanup()
    }

    set(key: string, data: T, ttl?: number): void {
        const now = Date.now()
        const item: CacheItem<T> = {
            data,
            timestamp: now,
            ttl: ttl || this.config.defaultTTL,
            accessCount: 0,
            lastAccessed: now
        }

        // Evict oldest item if cache is full
        if (this.cache.size >= this.config.maxSize) {
            this.evictLRU()
        }

        this.cache.set(key, item)
    }

    get(key: string): T | null {
        const item = this.cache.get(key)
        if (!item) return null

        const now = Date.now()

        // Check if expired
        if (now - item.timestamp > item.ttl) {
            this.cache.delete(key)
            return null
        }

        // Update access info
        item.accessCount++
        item.lastAccessed = now

        return item.data
    }

    has(key: string): boolean {
        return this.get(key) !== null
    }

    delete(key: string): boolean {
        return this.cache.delete(key)
    }

    clear(): void {
        this.cache.clear()
    }

    size(): number {
        return this.cache.size
    }

    // Get cache statistics
    getStats() {
        const items = Array.from(this.cache.values())
        return {
            size: this.cache.size,
            totalAccess: items.reduce((sum, item) => sum + item.accessCount, 0),
            averageAge: items.length > 0
                ? items.reduce((sum, item) => sum + (Date.now() - item.timestamp), 0) / items.length
                : 0
        }
    }

    private evictLRU(): void {
        let oldestKey = ''
        let oldestTime = Date.now()

        for (const [key, item] of this.cache.entries()) {
            if (item.lastAccessed < oldestTime) {
                oldestTime = item.lastAccessed
                oldestKey = key
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey)
        }
    }

    private startCleanup(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup()
        }, this.config.cleanupInterval)
    }

    private cleanup(): void {
        const now = Date.now()
        const expiredKeys: string[] = []

        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                expiredKeys.push(key)
            }
        }

        expiredKeys.forEach(key => this.cache.delete(key))
    }

    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
        }
        this.cache.clear()
    }
}

// LocalStorage cache with fallback
export class PersistentCache {
    private prefix: string
    private fallbackCache: MemoryCache

    constructor(prefix = 'fairgo_cache_') {
        this.prefix = prefix
        this.fallbackCache = new MemoryCache()
    }

    set(key: string, data: any, ttl = 24 * 60 * 60 * 1000): void {
        const item = {
            data,
            timestamp: Date.now(),
            ttl
        }

        const fullKey = this.prefix + key

        try {
            localStorage.setItem(fullKey, JSON.stringify(item))
        } catch (error) {
            // Fallback to memory cache if localStorage fails
            this.fallbackCache.set(key, data, ttl)
        }
    }

    get<T>(key: string): T | null {
        const fullKey = this.prefix + key

        try {
            const stored = localStorage.getItem(fullKey)
            if (!stored) {
                return this.fallbackCache.get(key)
            }

            const item = JSON.parse(stored)
            const now = Date.now()

            if (now - item.timestamp > item.ttl) {
                localStorage.removeItem(fullKey)
                return null
            }

            return item.data
        } catch (error) {
            return this.fallbackCache.get(key)
        }
    }

    delete(key: string): void {
        const fullKey = this.prefix + key
        localStorage.removeItem(fullKey)
        this.fallbackCache.delete(key)
    }

    clear(): void {
        // Clear all items with our prefix
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(this.prefix)) {
                keysToRemove.push(key)
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))

        this.fallbackCache.clear()
    }
}

// API response cache with request deduplication
export class APICache {
    private cache = new MemoryCache<any>()
    private pendingRequests = new Map<string, Promise<any>>()

    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        // Check cache first
        const cached = this.cache.get(key)
        if (cached) {
            return cached
        }

        // Check if request is already pending
        const pending = this.pendingRequests.get(key)
        if (pending) {
            return pending
        }

        // Make new request
        const promise = fetcher().then(
            (data) => {
                this.cache.set(key, data, ttl)
                this.pendingRequests.delete(key)
                return data
            },
            (error) => {
                this.pendingRequests.delete(key)
                throw error
            }
        )

        this.pendingRequests.set(key, promise)
        return promise
    }

    invalidate(key: string): void {
        this.cache.delete(key)
        this.pendingRequests.delete(key)
    }

    invalidatePattern(pattern: RegExp): void {
        // Note: In a real implementation, you'd want to track keys
        // For now, we'll clear everything matching the pattern conceptually
        this.cache.clear()
    }
}

// Global cache instances
export const memoryCache = new MemoryCache({
    maxSize: 200,
    defaultTTL: 10 * 60 * 1000, // 10 minutes
})

export const persistentCache = new PersistentCache('fairgo_')

export const apiCache = new APICache()

// Cache utilities for specific data types
export const bookingCache = {
    set: (bookingId: string, data: any) =>
        memoryCache.set(`booking_${bookingId}`, data, 5 * 60 * 1000),
    get: (bookingId: string) =>
        memoryCache.get(`booking_${bookingId}`),
    invalidate: (bookingId: string) =>
        memoryCache.delete(`booking_${bookingId}`)
}

export const driverCache = {
    set: (driverId: string, data: any) =>
        memoryCache.set(`driver_${driverId}`, data, 2 * 60 * 1000),
    get: (driverId: string) =>
        memoryCache.get(`driver_${driverId}`),
    invalidateNearby: () => {
        // In a real implementation, track nearby driver keys
        memoryCache.clear()
    }
}

export const userCache = {
    set: (userId: string, data: any) =>
        persistentCache.set(`user_${userId}`, data),
    get: (userId: string) =>
        persistentCache.get(`user_${userId}`),
    invalidate: (userId: string) =>
        persistentCache.delete(`user_${userId}`)
}

// React hook for cached data
export const useCachedData = <T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
        ttl?: number
        enabled?: boolean
        onSuccess?: (data: T) => void
        onError?: (error: Error) => void
    } = {}
) => {
    const [data, setData] = React.useState<T | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<Error | null>(null)

    const { ttl, enabled = true, onSuccess, onError } = options

    React.useEffect(() => {
        if (!enabled) return

        const loadData = async () => {
            try {
                setLoading(true)
                setError(null)

                const result = await apiCache.get(key, fetcher, ttl)
                setData(result)
                onSuccess?.(result)
            } catch (err) {
                const error = err as Error
                setError(error)
                onError?.(error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [key, enabled, ttl, onSuccess, onError])

    const refetch = React.useCallback(() => {
        apiCache.invalidate(key)
        setData(null)
        setLoading(true)
    }, [key])

    return { data, loading, error, refetch }
}

// Cache warming utility
export const warmCache = async () => {
    try {
        // Pre-load critical data
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token')
            if (token) {
                // Warm user data
                apiCache.get('current_user', () =>
                    fetch('/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(r => r.json())
                )

                // Warm nearby drivers for common locations
                const commonLocations = [
                    { lat: 9.9312, lng: 76.2673 }, // Kochi
                    { lat: 9.9816, lng: 76.2999 }, // Ernakulam
                ]

                commonLocations.forEach(location => {
                    apiCache.get(`drivers_${location.lat}_${location.lng}`, () =>
                        fetch(`/api/drivers/nearby?lat=${location.lat}&lng=${location.lng}`)
                            .then(r => r.json())
                    )
                })
            }
        }
    } catch (error) {
        console.warn('Cache warming failed:', error)
    }
}