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

// GET /api/admin/commissions - Get all driver commissions
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
        const driverId = searchParams.get('driverId')

        if (driverId) {
            // Get commission for specific driver
            const commission = await db.driverCommission.findUnique({
                where: { driverId },
                include: {
                    driver: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            })

            if (!commission) {
                return NextResponse.json(
                    { message: 'Commission settings not found for this driver' },
                    { status: 404 }
                )
            }

            return NextResponse.json(commission)
        } else {
            // Get all driver commissions
            const commissions = await db.driverCommission.findMany({
                include: {
                    driver: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            })

            return NextResponse.json(commissions)
        }
    } catch (error) {
        console.error('Error fetching commissions:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/admin/commissions - Create or update driver commission
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

        const body = await request.json()
        const {
            driverId,
            baseCommission = 10.00,
            peakHourCommission = 15.00,
            nightCommission = 12.00,
            weekendCommission = 12.00,
            longDistanceCommission
        } = body

        if (!driverId) {
            return NextResponse.json(
                { message: 'Driver ID is required' },
                { status: 400 }
            )
        }

        // Verify driver exists
        const driver = await db.driver.findUnique({
            where: { id: driverId }
        })

        if (!driver) {
            return NextResponse.json(
                { message: 'Driver not found' },
                { status: 404 }
            )
        }

        // Create or update commission settings
        const commission = await db.driverCommission.upsert({
            where: { driverId },
            update: {
                baseCommission,
                peakHourCommission,
                nightCommission,
                weekendCommission,
                longDistanceCommission,
                updatedAt: new Date()
            },
            create: {
                driverId,
                baseCommission,
                peakHourCommission,
                nightCommission,
                weekendCommission,
                longDistanceCommission
            },
            include: {
                driver: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json(commission, { status: 201 })
    } catch (error) {
        console.error('Error creating/updating commission:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/admin/commissions/:driverId - Update specific driver commission
export async function PUT(request: NextRequest) {
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
        const driverId = searchParams.get('driverId')

        if (!driverId) {
            return NextResponse.json(
                { message: 'Driver ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const {
            baseCommission,
            peakHourCommission,
            nightCommission,
            weekendCommission,
            longDistanceCommission,
            isActive
        } = body

        const commission = await db.driverCommission.update({
            where: { driverId },
            data: {
                ...(baseCommission !== undefined && { baseCommission }),
                ...(peakHourCommission !== undefined && { peakHourCommission }),
                ...(nightCommission !== undefined && { nightCommission }),
                ...(weekendCommission !== undefined && { weekendCommission }),
                ...(longDistanceCommission !== undefined && { longDistanceCommission }),
                ...(isActive !== undefined && { isActive }),
                updatedAt: new Date()
            },
            include: {
                driver: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json(commission)
    } catch (error) {
        console.error('Error updating commission:', error)
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return NextResponse.json(
                { message: 'Commission settings not found for this driver' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/admin/commissions/:driverId - Delete driver commission (reset to defaults)
export async function DELETE(request: NextRequest) {
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
        const driverId = searchParams.get('driverId')

        if (!driverId) {
            return NextResponse.json(
                { message: 'Driver ID is required' },
                { status: 400 }
            )
        }

        await db.driverCommission.delete({
            where: { driverId }
        })

        return NextResponse.json({ message: 'Commission settings reset to defaults' })
    } catch (error) {
        console.error('Error deleting commission:', error)
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return NextResponse.json(
                { message: 'Commission settings not found for this driver' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}