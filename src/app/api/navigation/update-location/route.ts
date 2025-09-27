import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/navigation/update-location - Update driver location
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
        const tokenParts = token.split('_')
        if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
            return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            )
        }

        const userId = tokenParts[1]

        const { lat, lng, bookingId, heading, speed } = await request.json()

        if (!lat || !lng) {
            return NextResponse.json(
                { message: 'Latitude and longitude are required' },
                { status: 400 }
            )
        }

        // Validate coordinates
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return NextResponse.json(
                { message: 'Invalid coordinates' },
                { status: 400 }
            )
        }

        // Get driver profile
        const driver = await db.driver.findUnique({
            where: { userId }
        })

        if (!driver) {
            return NextResponse.json(
                { message: 'Driver profile not found' },
                { status: 404 }
            )
        }

        // Update driver location
        await db.driver.update({
            where: { id: driver.id },
            data: {
                currentLocationLat: lat,
                currentLocationLng: lng
            }
        })

        // If bookingId is provided, update tracking information
        if (bookingId) {
            const booking = await db.booking.findUnique({
                where: { id: bookingId },
                select: { status: true, dropLat: true, dropLng: true }
            })

            if (booking && (booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS')) {
                // Update or create tracking record
                await db.tracking.upsert({
                    where: { bookingId },
                    update: {
                        driverLat: lat,
                        driverLng: lng,
                        eta: calculateETA(lat, lng, booking.dropLat, booking.dropLng)
                    },
                    create: {
                        bookingId,
                        driverLat: lat,
                        driverLng: lng,
                        eta: calculateETA(lat, lng, booking.dropLat, booking.dropLng)
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Location updated successfully',
            location: { lat, lng, heading, speed }
        })

    } catch (error) {
        console.error('Update location error:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update location',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// Helper function to calculate ETA (simplified version)
function calculateETA(fromLat: number, fromLng: number, toLat: number | null, toLng: number | null): number | null {
    if (!toLat || !toLng) return null

    // Calculate distance using Haversine formula
    const R = 6371 // Earth's radius in kilometers
    const dLat = (toLat - fromLat) * Math.PI / 180
    const dLng = (toLng - fromLng) * Math.PI / 180

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance in kilometers

    // Assume average speed of 30 km/h in city traffic
    const averageSpeedKmh = 30
    const etaHours = distance / averageSpeedKmh
    const etaMinutes = Math.round(etaHours * 60)

    return etaMinutes
}