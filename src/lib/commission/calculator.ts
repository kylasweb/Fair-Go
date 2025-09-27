import { db } from '@/lib/db'

export interface CommissionCalculation {
    baseRate: number
    appliedRate: number
    commissionAmount: number
    driverEarnings: number
    breakdown: {
        baseCommission: number
        timeBasedAdjustment: number
        distanceAdjustment: number
        finalRate: number
    }
}

/**
 * Calculate commission for a booking based on driver settings and booking details
 */
export async function calculateCommission(
    driverId: string,
    bookingAmount: number,
    bookingDate: Date = new Date(),
    distance?: number
): Promise<CommissionCalculation> {
    // Get driver's commission settings, fallback to defaults
    const commissionSettings = await db.driverCommission.findUnique({
        where: { driverId }
    })

    const baseRate = commissionSettings?.baseCommission || 10.00 // Default 10%
    let appliedRate = baseRate

    // Time-based adjustments
    const hour = bookingDate.getHours()
    const dayOfWeek = bookingDate.getDay() // 0 = Sunday, 6 = Saturday

    // Peak hours (7-9 AM, 5-7 PM on weekdays)
    const isPeakHour = (
        (dayOfWeek >= 1 && dayOfWeek <= 5) && // Weekdays only
        ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) // Peak hours
    )

    // Night hours (10 PM - 5 AM)
    const isNightHour = hour >= 22 || hour <= 5

    // Weekend
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Apply time-based adjustments
    let timeAdjustment = 0
    if (isPeakHour && commissionSettings?.peakHourCommission) {
        appliedRate = commissionSettings.peakHourCommission
        timeAdjustment = appliedRate - baseRate
    } else if (isNightHour && commissionSettings?.nightCommission) {
        appliedRate = commissionSettings.nightCommission
        timeAdjustment = appliedRate - baseRate
    } else if (isWeekend && commissionSettings?.weekendCommission) {
        appliedRate = commissionSettings.weekendCommission
        timeAdjustment = appliedRate - baseRate
    }

    // Distance-based adjustments (optional)
    let distanceAdjustment = 0
    if (distance && distance > 50 && commissionSettings?.longDistanceCommission) {
        // Long distance rides (>50km) get special rate
        appliedRate = commissionSettings.longDistanceCommission
        distanceAdjustment = appliedRate - baseRate
    }

    // Calculate final amounts
    const commissionAmount = (bookingAmount * appliedRate) / 100
    const driverEarnings = bookingAmount - commissionAmount

    return {
        baseRate,
        appliedRate,
        commissionAmount,
        driverEarnings,
        breakdown: {
            baseCommission: (bookingAmount * baseRate) / 100,
            timeBasedAdjustment: (bookingAmount * timeAdjustment) / 100,
            distanceAdjustment: (bookingAmount * distanceAdjustment) / 100,
            finalRate: appliedRate
        }
    }
}

/**
 * Get commission summary for a driver over a time period
 */
export async function getDriverCommissionSummary(
    driverId: string,
    startDate: Date,
    endDate: Date
) {
    const bookings = await db.booking.findMany({
        where: {
            driverId,
            status: 'COMPLETED',
            completedAt: {
                gte: startDate,
                lte: endDate
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

    return {
        driverId,
        period: { startDate, endDate },
        totalRides,
        totalEarnings,
        totalCommission,
        netEarnings: totalEarnings - totalCommission,
        averageCommissionRate: totalRides > 0 ? (totalCommission / totalEarnings) * 100 : 0,
        bookings: bookings.map(booking => ({
            id: booking.id,
            amount: booking.finalPrice,
            commission: booking.commissionAmount,
            rate: booking.commissionRate,
            date: booking.completedAt
        }))
    }
}

/**
 * Apply commission to a completed booking
 */
export async function applyCommissionToBooking(
    bookingId: string,
    driverId: string,
    bookingAmount: number,
    bookingDate: Date = new Date(),
    distance?: number
) {
    const calculation = await calculateCommission(driverId, bookingAmount, bookingDate, distance)

    // Update booking with commission details
    await db.booking.update({
        where: { id: bookingId },
        data: {
            commissionAmount: calculation.commissionAmount,
            commissionRate: calculation.appliedRate,
            updatedAt: new Date()
        }
    })

    return calculation
}