import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateCommission, applyCommissionToBooking } from '@/lib/commission/calculator'
import {
    authenticateRequest,
    createErrorResponse,
    createSuccessResponse
} from '@/lib/api-middleware'

// POST /api/bookings/calculate-commission - Calculate commission for a booking
export async function POST(request: NextRequest) {
    try {
        // Authenticate user (admin or driver)
        const authResult = await authenticateRequest(request)
        if (!authResult.success || !authResult.user) {
            return createErrorResponse(authResult.error || 'Authentication failed', 401)
        }

        const body = await request.json()
        const {
            driverId,
            bookingAmount,
            bookingDate,
            distance,
            applyToBookingId // Optional: if provided, apply commission to existing booking
        } = body

        if (!driverId || !bookingAmount) {
            return createErrorResponse('Driver ID and booking amount are required', 400)
        }

        // Verify driver exists and user has permission
        const driver = await db.driver.findUnique({
            where: { id: driverId },
            include: {
                user: {
                    select: {
                        id: true,
                        role: true
                    }
                }
            }
        })

        if (!driver) {
            return createErrorResponse('Driver not found', 404)
        }

        // Check permissions: admin can calculate for any driver, drivers can only calculate for themselves
        if (authResult.user.role !== 'ADMIN' && authResult.user.role !== 'SUPER_ADMIN' && authResult.user.id !== driver.userId) {
            return createErrorResponse('Unauthorized to calculate commission for this driver', 403)
        }

        const calculationDate = bookingDate ? new Date(bookingDate) : new Date()
        const calculation = await calculateCommission(driverId, bookingAmount, calculationDate, distance)

        // If applyToBookingId is provided, apply the commission to the booking
        if (applyToBookingId) {
            // Verify booking exists and belongs to the driver
            const booking = await db.booking.findUnique({
                where: { id: applyToBookingId }
            })

            if (!booking) {
                return createErrorResponse('Booking not found', 404)
            }

            if (booking.driverId !== driverId) {
                return createErrorResponse('Booking does not belong to this driver', 400)
            }

            await applyCommissionToBooking(applyToBookingId, driverId, bookingAmount, calculationDate, distance)
        }

        return createSuccessResponse(calculation)
    } catch (error) {
        console.error('Error calculating commission:', error)
        return createErrorResponse('Internal server error', 500)
    }
}

// GET /api/bookings/calculate-commission - Get commission summary for a driver
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request)
        if (!authResult.success || !authResult.user) {
            return createErrorResponse(authResult.error || 'Authentication failed', 401)
        }

        const { searchParams } = new URL(request.url)
        const driverId = searchParams.get('driverId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!driverId) {
            return createErrorResponse('Driver ID is required', 400)
        }

        // Verify driver exists
        const driver = await db.driver.findUnique({
            where: { id: driverId }
        })

        if (!driver) {
            return createErrorResponse('Driver not found', 404)
        }

        // Check permissions
        if (authResult.user.role !== 'ADMIN' && authResult.user.role !== 'SUPER_ADMIN' && authResult.user.id !== driver.userId) {
            return createErrorResponse('Unauthorized to view commission data for this driver', 403)
        }

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        const end = endDate ? new Date(endDate) : new Date()

        // Get commission summary
        const bookings = await db.booking.findMany({
            where: {
                driverId,
                status: 'COMPLETED',
                completedAt: {
                    gte: start,
                    lte: end
                }
            },
            select: {
                id: true,
                finalPrice: true,
                commissionAmount: true,
                commissionRate: true,
                completedAt: true
            }
        })

        const totalEarnings = bookings.reduce((sum, booking) => sum + (booking.finalPrice || 0), 0)
        const totalCommission = bookings.reduce((sum, booking) => sum + (booking.commissionAmount || 0), 0)
        const totalRides = bookings.length

        const summary = {
            driverId,
            period: { startDate: start, endDate: end },
            totalRides,
            totalEarnings,
            totalCommission,
            netEarnings: totalEarnings - totalCommission,
            averageCommissionRate: totalRides > 0 ? (totalCommission / totalEarnings) * 100 : 0,
            recentBookings: bookings.slice(0, 10).map(booking => ({
                id: booking.id,
                amount: booking.finalPrice,
                commission: booking.commissionAmount,
                rate: booking.commissionRate,
                date: booking.completedAt
            }))
        }

        return createSuccessResponse(summary)
    } catch (error) {
        console.error('Error fetching commission summary:', error)
        return createErrorResponse('Internal server error', 500)
    }
}