import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to verify admin access
async function verifyAdmin(token: string) {
    const tokenParts = token.split('_')
    if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
        return null
    }

    const userId = tokenParts[1]
    const admin = await db.admin.findUnique({
        where: { userId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true
                }
            }
        }
    })

    return admin
}

// GET /api/analytics - Get platform analytics
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const admin = await verifyAdmin(token)

        if (!admin) {
            return NextResponse.json(
                { message: 'Admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const metric = searchParams.get('metric') || 'overview'
        const period = searchParams.get('period') || '30d'
        const groupBy = searchParams.get('groupBy') || 'day' // hour, day, week, month

        // Calculate date range
        const now = new Date()
        const startDate = new Date()

        switch (period) {
            case '24h':
                startDate.setHours(now.getHours() - 24)
                break
            case '7d':
                startDate.setDate(now.getDate() - 7)
                break
            case '30d':
                startDate.setDate(now.getDate() - 30)
                break
            case '90d':
                startDate.setDate(now.getDate() - 90)
                break
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1)
                break
        }

        let analytics = {}

        switch (metric) {
            case 'overview':
                analytics = await getOverviewAnalytics(startDate, now)
                break
            case 'bookings':
                analytics = await getBookingAnalytics(startDate, now, groupBy)
                break
            case 'revenue':
                analytics = await getRevenueAnalytics(startDate, now, groupBy)
                break
            case 'users':
                analytics = await getUserAnalytics(startDate, now, groupBy)
                break
            case 'drivers':
                analytics = await getDriverAnalytics(startDate, now, groupBy)
                break
            case 'performance':
                analytics = await getPerformanceAnalytics(startDate, now)
                break
            case 'geographic':
                analytics = await getGeographicAnalytics(startDate, now)
                break
            default:
                return NextResponse.json(
                    { message: 'Invalid metric' },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            metric,
            period,
            startDate,
            endDate: now,
            data: analytics
        })

    } catch (error) {
        console.error('Analytics error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

async function getOverviewAnalytics(startDate: Date, endDate: Date) {
    const [
        bookingStats,
        revenueStats,
        userStats,
        driverStats
    ] = await Promise.all([
        db.booking.groupBy({
            by: ['status'],
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            _count: true
        }),
        db.payment.aggregate({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: startDate, lte: endDate }
            },
            _sum: { amount: true },
            _avg: { amount: true },
            _count: true
        }),
        db.user.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            _count: true
        }),
        db.driver.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            _count: true
        })
    ])

    return {
        bookings: bookingStats,
        revenue: revenueStats,
        newUsers: userStats._count,
        newDrivers: driverStats._count
    }
}

async function getBookingAnalytics(startDate: Date, endDate: Date, groupBy: string) {
    // Get booking trends over time
    const bookingTrends = await db.$queryRaw`
    SELECT 
      DATE_TRUNC(${groupBy}, created_at) as date,
      status,
      COUNT(*) as count
    FROM bookings 
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY DATE_TRUNC(${groupBy}, created_at), status
    ORDER BY date
  `

    // Get booking by vehicle type
    const bookingsByType = await db.booking.groupBy({
        by: ['vehicleType'],
        where: {
            createdAt: { gte: startDate, lte: endDate }
        },
        _count: true
    })

    // Get avg booking duration and distance
    const bookingMetrics = await db.booking.aggregate({
        where: {
            status: 'COMPLETED',
            createdAt: { gte: startDate, lte: endDate }
        },
        _avg: {
            distance: true,
            finalPrice: true
        }
    })

    return {
        trends: bookingTrends,
        byType: bookingsByType,
        metrics: bookingMetrics
    }
}

async function getRevenueAnalytics(startDate: Date, endDate: Date, groupBy: string) {
    // Revenue trends over time
    const revenueTrends = await db.$queryRaw`
    SELECT 
      DATE_TRUNC(${groupBy}, created_at) as date,
      SUM(amount) as revenue,
      COUNT(*) as transactions
    FROM payments 
    WHERE status = 'COMPLETED' 
      AND created_at >= ${startDate} 
      AND created_at <= ${endDate}
    GROUP BY DATE_TRUNC(${groupBy}, created_at)
    ORDER BY date
  `

    // Revenue by payment method
    const revenueByMethod = await db.payment.groupBy({
        by: ['method'],
        where: {
            status: 'COMPLETED',
            createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true },
        _count: true
    })

    return {
        trends: revenueTrends,
        byMethod: revenueByMethod
    }
}

async function getUserAnalytics(startDate: Date, endDate: Date, groupBy: string) {
    // User registration trends
    const userTrends = await db.$queryRaw`
    SELECT 
      DATE_TRUNC(${groupBy}, created_at) as date,
      COUNT(*) as new_users
    FROM users 
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY DATE_TRUNC(${groupBy}, created_at)
    ORDER BY date
  `

    // Active users (users who made bookings)
    const activeUsers = await db.user.count({
        where: {
            bookings: {
                some: {
                    createdAt: { gte: startDate, lte: endDate }
                }
            }
        }
    })

    return {
        trends: userTrends,
        activeUsers
    }
}

async function getDriverAnalytics(startDate: Date, endDate: Date, groupBy: string) {
    // Driver registration trends
    const driverTrends = await db.$queryRaw`
    SELECT 
      DATE_TRUNC(${groupBy}, created_at) as date,
      status,
      COUNT(*) as count
    FROM drivers 
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY DATE_TRUNC(${groupBy}, created_at), status
    ORDER BY date
  `

    // Active drivers (drivers who completed rides)
    const activeDrivers = await db.driver.count({
        where: {
            bookings: {
                some: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate, lte: endDate }
                }
            }
        }
    })

    // Top performing drivers
    const topDrivers = await db.driver.findMany({
        include: {
            user: {
                select: {
                    name: true
                }
            },
            _count: {
                select: {
                    bookings: {
                        where: {
                            status: 'COMPLETED',
                            createdAt: { gte: startDate, lte: endDate }
                        }
                    }
                }
            }
        },
        orderBy: {
            rating: 'desc'
        },
        take: 10
    })

    return {
        trends: driverTrends,
        activeDrivers,
        topDrivers: topDrivers.map(d => ({
            id: d.id,
            name: d.user.name,
            completedRides: d._count.bookings,
            rating: d.rating
        }))
    }
}

async function getPerformanceAnalytics(startDate: Date, endDate: Date) {
    // Avg response times, completion rates, etc.
    const performance = await db.$queryRaw`
    SELECT 
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_response_time_minutes,
      COUNT(*) FILTER (WHERE status = 'COMPLETED') * 100.0 / COUNT(*) as completion_rate,
      AVG(rating) as avg_rating
    FROM bookings 
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
  ` as any[]

    return performance[0] || {}
}

async function getGeographicAnalytics(startDate: Date, endDate: Date) {
    // Popular pickup/drop locations
    const popularLocations = await db.$queryRaw`
    SELECT 
      pickup_location,
      COUNT(*) as pickup_count
    FROM bookings 
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY pickup_location
    ORDER BY pickup_count DESC
    LIMIT 20
  `

    return {
        popularPickupLocations: popularLocations
    }
}