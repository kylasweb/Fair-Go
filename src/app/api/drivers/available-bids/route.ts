import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify the user is a driver
        const driver = await db.driver.findUnique({
            where: { userId: session.user.id }
        })

        if (!driver) {
            return NextResponse.json(
                { error: 'Only drivers can view available bids' },
                { status: 403 }
            )
        }

        // Get driver's current location for distance calculation
        const driverLat = driver.currentLocationLat
        const driverLng = driver.currentLocationLng

        if (!driverLat || !driverLng) {
            return NextResponse.json(
                { error: 'Driver location not available. Please update your location.' },
                { status: 400 }
            )
        }

        // Get available bidding bookings
        const availableBids = await db.booking.findMany({
            where: {
                biddingEnabled: true,
                status: 'REQUESTED',
                biddingEndTime: {
                    gt: new Date()
                },
                // Exclude bookings where driver already has a bid
                NOT: {
                    bids: {
                        some: {
                            driverId: driver.id,
                            bidStatus: 'ACTIVE'
                        }
                    }
                }
            },
            include: {
                bids: {
                    where: { bidStatus: 'ACTIVE' },
                    include: {
                        driver: {
                            include: {
                                user: {
                                    select: { name: true }
                                }
                            }
                        }
                    },
                    orderBy: { bidAmount: 'asc' }
                }
            }
        })

        // Calculate distance and format response
        const formattedBids = availableBids.map(booking => {
            const distance = calculateDistance(
                driverLat,
                driverLng,
                booking.pickupLat,
                booking.pickupLng
            )

            const lowestBid = booking.bids.length > 0 ? Math.min(...booking.bids.map(b => b.bidAmount)) : null
            const bidCount = booking.bids.length

            return {
                id: booking.id,
                pickupLocation: booking.pickupLocation,
                dropLocation: booking.dropLocation,
                vehicleType: booking.vehicleType,
                estimatedPrice: booking.estimatedPrice,
                distance: Math.round(distance * 10) / 10, // Round to 1 decimal
                biddingEndTime: booking.biddingEndTime,
                lowestBid,
                bidCount,
                bids: booking.bids.map(bid => ({
                    id: bid.id,
                    amount: bid.bidAmount,
                    estimatedArrivalTime: bid.estimatedArrivalTime,
                    driver: {
                        name: bid.driver.user.name
                    }
                }))
            }
        })

        // Sort by distance (closest first)
        formattedBids.sort((a, b) => a.distance - b.distance)

        return NextResponse.json({
            success: true,
            availableBids: formattedBids
        })

    } catch (error) {
        console.error('Error fetching available bids:', error)
        return NextResponse.json(
            { error: 'Failed to fetch available bids' },
            { status: 500 }
        )
    }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1)
    const dLng = toRadians(lng2 - lng1)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
}