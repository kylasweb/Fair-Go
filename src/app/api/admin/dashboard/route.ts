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

// GET /api/admin/dashboard - Get admin dashboard stats
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
        const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y

        // Calculate date range
        const now = new Date()
        const startDate = new Date()

        switch (period) {
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

        // Get various statistics
        const [
            totalUsers,
            totalDrivers,
            activeBookings,
            completedBookings,
            totalRevenue,
            recentBookings,
            userGrowth,
            driverGrowth,
            topDrivers,
            systemHealth
        ] = await Promise.all([
            // Total users
            db.user.count(),

            // Total drivers
            db.driver.count({
                where: { status: 'APPROVED' }
            }),

            // Active bookings
            db.booking.count({
                where: {
                    status: {
                        in: ['ACCEPTED', 'CONFIRMED', 'PICKED_UP', 'IN_PROGRESS']
                    }
                }
            }),

            // Completed bookings in period
            db.booking.count({
                where: {
                    status: 'COMPLETED',
                    createdAt: {
                        gte: startDate
                    }
                }
            }),

            // Total revenue in period
            db.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: {
                        gte: startDate
                    }
                },
                _sum: {
                    amount: true
                }
            }),

            // Recent bookings
            db.booking.findMany({
                take: 10,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    driver: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    name: true,
                                    phone: true
                                }
                            }
                        }
                    }
                }
            }),

            // User growth in period
            db.user.count({
                where: {
                    createdAt: {
                        gte: startDate
                    }
                }
            }),

            // Driver growth in period
            db.driver.count({
                where: {
                    createdAt: {
                        gte: startDate
                    }
                }
            }),

            // Top drivers by completed rides
            db.driver.findMany({
                take: 10,
                include: {
                    user: {
                        select: {
                            name: true,
                            phone: true
                        }
                    },
                    bookings: {
                        where: {
                            status: 'COMPLETED',
                            createdAt: {
                                gte: startDate
                            }
                        }
                    },
                    _count: {
                        select: {
                            bookings: {
                                where: {
                                    status: 'COMPLETED',
                                    createdAt: {
                                        gte: startDate
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    rating: 'desc'
                }
            }),

            // System health metrics
            db.$queryRaw`
        SELECT 
          'database' as component,
          'healthy' as status,
          NOW() as checked_at
      `
        ])

        const dashboardStats = {
            overview: {
                totalUsers,
                totalDrivers,
                activeBookings,
                completedBookings,
                totalRevenue: totalRevenue._sum.amount || 0,
                userGrowth,
                driverGrowth
            },
            recentActivity: {
                recentBookings
            },
            performance: {
                topDrivers: topDrivers.map(driver => ({
                    id: driver.id,
                    name: driver.user.name,
                    phone: driver.user.phone,
                    completedRides: driver._count.bookings,
                    rating: driver.rating
                }))
            },
            system: {
                health: systemHealth
            },
            period
        }

        return NextResponse.json(dashboardStats)

    } catch (error) {
        console.error('Admin dashboard error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/admin/dashboard - Admin actions
export async function POST(request: NextRequest) {
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

        const { action, data } = await request.json()

        switch (action) {
            case 'approve_driver':
                const approvedDriver = await db.driver.update({
                    where: { id: data.driverId },
                    data: {
                        status: 'APPROVED',
                        approvedAt: new Date()
                    }
                })
                return NextResponse.json({ success: true, driver: approvedDriver })

            case 'reject_driver':
                const rejectedDriver = await db.driver.update({
                    where: { id: data.driverId },
                    data: {
                        status: 'REJECTED',
                        rejectionReason: data.reason
                    }
                })
                return NextResponse.json({ success: true, driver: rejectedDriver })

            case 'suspend_user':
                const suspendedUser = await db.user.update({
                    where: { id: data.userId },
                    data: {
                        status: 'SUSPENDED',
                        suspensionReason: data.reason
                    }
                })
                return NextResponse.json({ success: true, user: suspendedUser })

            case 'broadcast_notification':
                // Get all users
                const users = await db.user.findMany({
                    select: { id: true }
                })

                // Create notification for each user
                const notifications = await Promise.all(
                    users.map(user =>
                        db.notification.create({
                            data: {
                                userId: user.id,
                                type: 'SYSTEM',
                                title: data.title,
                                message: data.message
                            }
                        })
                    )
                )
                return NextResponse.json({ success: true, count: notifications.length })

            default:
                return NextResponse.json(
                    { message: 'Invalid action' },
                    { status: 400 }
                )
        }

    } catch (error) {
        console.error('Admin action error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}