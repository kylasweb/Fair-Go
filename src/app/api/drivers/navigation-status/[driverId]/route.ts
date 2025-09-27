import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/drivers/[driverId]/navigation-status - Get driver's navigation status
export async function GET(
    request: NextRequest,
    { params }: { params: { driverId: string } }
) {
    try {
        const driverId = params.driverId

        // Get driver with current location and active bookings
        const driver = await db.driver.findUnique({
            where: { id: driverId },
            select: {
                id: true,
                currentLocationLat: true,
                currentLocationLng: true,
                isAvailable: true,
                user: {
                    select: {
                        name: true
                    }
                }
            }
        })

        if (!driver) {
            return NextResponse.json(
                { message: 'Driver not found' },
                { status: 404 }
            )
        }

        // Get active bookings for this driver
        const activeBookings = await db.booking.findMany({
            where: {
                driverId,
                status: {
                    in: ['ACCEPTED', 'PICKED_UP', 'IN_PROGRESS']
                }
            },
            select: {
                id: true,
                status: true,
                pickupLocation: true,
                pickupLat: true,
                pickupLng: true,
                dropLocation: true,
                dropLat: true,
                dropLng: true,
                tracking: {
                    select: {
                        driverLat: true,
                        driverLng: true,
                        eta: true,
                        updatedAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 1 // Get the most recent active booking
        })

        const navigationStatus = {
            driver: {
                id: driver.id,
                name: driver.user.name,
                isAvailable: driver.isAvailable,
                currentLocation: driver.currentLocationLat && driver.currentLocationLng ? {
                    lat: driver.currentLocationLat,
                    lng: driver.currentLocationLng
                } : null
            },
            activeBooking: activeBookings.length > 0 ? {
                id: activeBookings[0].id,
                status: activeBookings[0].status,
                pickup: {
                    address: activeBookings[0].pickupLocation,
                    lat: activeBookings[0].pickupLat,
                    lng: activeBookings[0].pickupLng
                },
                drop: activeBookings[0].dropLat && activeBookings[0].dropLng ? {
                    address: activeBookings[0].dropLocation,
                    lat: activeBookings[0].dropLat,
                    lng: activeBookings[0].dropLng
                } : null,
                tracking: activeBookings[0].tracking ? {
                    currentLocation: {
                        lat: activeBookings[0].tracking.driverLat,
                        lng: activeBookings[0].tracking.driverLng
                    },
                    eta: activeBookings[0].tracking.eta,
                    lastUpdate: activeBookings[0].tracking.updatedAt
                } : null
            } : null
        }

        return NextResponse.json(navigationStatus)

    } catch (error) {
        console.error('Get driver navigation status error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}