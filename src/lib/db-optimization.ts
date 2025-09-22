/**
 * Database Query Optimization Utilities
 * Implements batching, connection pooling, and query optimization
 */

import { db } from '@/lib/db'

// Query result caching
const queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>()

// Cache utility
const getCachedResult = (key: string): any | null => {
    const cached = queryCache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
        queryCache.delete(key)
        return null
    }

    return cached.result
}

const setCachedResult = (key: string, result: any, ttl = 300000) => {
    queryCache.set(key, { result, timestamp: Date.now(), ttl })
}

// Optimized booking queries
export const optimizedBookingQueries = {
    // Get user bookings with pagination and caching
    getUserBookings: async (
        userId: string,
        options: {
            page?: number
            limit?: number
            status?: string
            includeDriver?: boolean
        } = {}
    ) => {
        const { page = 1, limit = 10, status, includeDriver = true } = options
        const cacheKey = `bookings_${userId}_${page}_${limit}_${status}_${includeDriver}`

        // Check cache first
        const cached = getCachedResult(cacheKey)
        if (cached) return cached

        // Build query
        const where: any = { userId }
        if (status) where.status = status

        const skip = (page - 1) * limit

        // Optimized query with selective includes
        const bookingsQuery = includeDriver
            ? db.booking.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    driver: {
                        select: {
                            id: true,
                            vehicleNumber: true,
                            vehicleType: true,
                            rating: true,
                            user: {
                                select: {
                                    name: true,
                                    phone: true
                                }
                            }
                        }
                    }
                }
            })
            : db.booking.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    pickupLocation: true,
                    dropLocation: true,
                    status: true,
                    estimatedPrice: true,
                    finalPrice: true,
                    createdAt: true,
                    updatedAt: true
                }
            })

        const [bookings, total] = await Promise.all([
            bookingsQuery,
            db.booking.count({ where })
        ])

        const result = {
            bookings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        }

        // Cache for 5 minutes
        setCachedResult(cacheKey, result, 300000)
        return result
    },

    // Get active bookings efficiently
    getActiveBookings: async (userId: string) => {
        const cacheKey = `active_booking_${userId}`

        const cached = getCachedResult(cacheKey)
        if (cached) return cached

        const activeBooking = await db.booking.findFirst({
            where: {
                userId,
                status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] }
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        vehicleNumber: true,
                        vehicleType: true,
                        currentLocationLat: true,
                        currentLocationLng: true,
                        user: {
                            select: {
                                name: true,
                                phone: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Cache for 1 minute (active bookings change frequently)
        setCachedResult(cacheKey, activeBooking, 60000)
        return activeBooking
    },

    // Batch booking status updates
    batchUpdateBookings: async (updates: Array<{ id: string; status: string; data?: any }>) => {
        if (updates.length === 0) return []

        // Group updates by status for efficiency
        const statusGroups = updates.reduce((acc, update) => {
            if (!acc[update.status]) acc[update.status] = []
            acc[update.status].push(update)
            return acc
        }, {} as Record<string, typeof updates>)

        const results = await Promise.all(
            Object.entries(statusGroups).map(([status, groupUpdates]) =>
                Promise.all(
                    groupUpdates.map(update =>
                        db.booking.update({
                            where: { id: update.id },
                            data: { status, ...update.data }
                        })
                    )
                )
            )
        )

        // Invalidate related caches
        updates.forEach(update => {
            queryCache.delete(`active_booking_${update.id}`)
        })

        return results.flat()
    }
}

// Optimized driver queries
export const optimizedDriverQueries = {
    // Get nearby drivers with spatial optimization
    getNearbyDrivers: async (
        lat: number,
        lng: number,
        radius = 5,
        limit = 20
    ) => {
        const cacheKey = `nearby_drivers_${lat}_${lng}_${radius}_${limit}`

        const cached = getCachedResult(cacheKey)
        if (cached) return cached

        // Use raw query for spatial calculations (more efficient)
        const drivers = await db.driver.findMany({
            where: {
                isAvailable: true,
                isVerified: true,
                AND: [
                    { currentLocationLat: { not: null } },
                    { currentLocationLng: { not: null } }
                ]
            },
            include: {
                user: {
                    select: {
                        name: true,
                        avatar: true
                    }
                }
            },
            take: limit * 2 // Get more to filter distance
        })

        // Calculate distances and filter
        const driversWithDistance = drivers
            .map(d => {
                if (!d.currentLocationLat || !d.currentLocationLng) return null

                const distance = calculateDistance(
                    lat, lng,
                    d.currentLocationLat,
                    d.currentLocationLng
                )

                return distance <= radius ? { ...d, distance } : null
            })
            .filter(Boolean)
            .sort((a, b) => a!.distance - b!.distance)
            .slice(0, limit)

        // Cache for 30 seconds (driver locations change frequently)
        setCachedResult(cacheKey, driversWithDistance, 30000)
        return driversWithDistance
    },

    // Batch update driver locations
    batchUpdateDriverLocations: async (
        updates: Array<{
            driverId: string
            location: { lat: number; lng: number; address: string }
            isAvailable?: boolean
        }>
    ) => {
        if (updates.length === 0) return []

        const results = await Promise.all(
            updates.map(update =>
                db.driver.update({
                    where: { id: update.driverId },
                    data: {
                        currentLocationLat: update.location.lat,
                        currentLocationLng: update.location.lng,
                        ...(update.isAvailable !== undefined && { isAvailable: update.isAvailable })
                    }
                })
            )
        )

        // Clear location-based caches
        queryCache.forEach((_, key) => {
            if (key.startsWith('nearby_drivers_')) {
                queryCache.delete(key)
            }
        })

        return results
    }
}

// Distance calculation helper (from utils)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

// Query analytics and monitoring
export const queryAnalytics = {
    slowQueries: [] as Array<{
        query: string
        duration: number
        timestamp: number
    }>,

    logSlowQuery: (query: string, duration: number) => {
        if (duration > 1000) { // Log queries taking more than 1 second
            queryAnalytics.slowQueries.push({
                query,
                duration,
                timestamp: Date.now()
            })

            // Keep only last 100 slow queries
            if (queryAnalytics.slowQueries.length > 100) {
                queryAnalytics.slowQueries = queryAnalytics.slowQueries.slice(-100)
            }
        }
    },

    getSlowQueries: () => queryAnalytics.slowQueries,

    getCacheStats: () => ({
        size: queryCache.size,
        hitRate: 0, // Would need to implement hit tracking
        memory: queryCache.size * 1024 // Rough estimate
    })
}

// Query execution wrapper with timing
export const executeWithTiming = async <T>(
    queryName: string,
    queryFunction: () => Promise<T>
): Promise<T> => {
    const start = Date.now()
    try {
        const result = await queryFunction()
        const duration = Date.now() - start
        queryAnalytics.logSlowQuery(queryName, duration)
        return result
    } catch (error) {
        const duration = Date.now() - start
        queryAnalytics.logSlowQuery(`${queryName}_ERROR`, duration)
        throw error
    }
}

// Connection pool monitoring (simplified)
export const connectionPool = {
    activeConnections: 0,
    totalConnections: 0,

    getStats: () => ({
        active: connectionPool.activeConnections,
        total: connectionPool.totalConnections,
        utilization: connectionPool.activeConnections / Math.max(connectionPool.totalConnections, 1)
    })
}

// Cleanup utility
export const cleanupQueryCache = () => {
    const now = Date.now()
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > value.ttl) {
            queryCache.delete(key)
        }
    }
}