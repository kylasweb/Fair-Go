import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/navigation/directions/[bookingId] - Get directions for a specific booking
export async function GET(
    request: NextRequest,
    { params }: { params: { bookingId: string } }
) {
    try {
        const bookingId = params.bookingId

        // Get booking with driver location
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                driver: {
                    select: {
                        currentLocationLat: true,
                        currentLocationLng: true,
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                tracking: true
            }
        })

        if (!booking) {
            return NextResponse.json(
                { message: 'Booking not found' },
                { status: 404 }
            )
        }

        if (!booking.driver) {
            return NextResponse.json(
                { message: 'No driver assigned to this booking' },
                { status: 400 }
            )
        }

        // Get Google Maps API key from environment
        const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY
        if (!googleMapsApiKey) {
            return NextResponse.json(
                { message: 'Google Maps API key not configured' },
                { status: 500 }
            )
        }

        // Determine origin based on booking status and driver location
        let originLat: number
        let originLng: number

        if (booking.tracking && booking.status === 'IN_PROGRESS') {
            // Use current driver location for active rides
            originLat = booking.tracking.driverLat
            originLng = booking.tracking.driverLng
        } else if (booking.driver.currentLocationLat && booking.driver.currentLocationLng) {
            // Use driver's current location
            originLat = booking.driver.currentLocationLat
            originLng = booking.driver.currentLocationLng
        } else {
            return NextResponse.json(
                { message: 'Driver location not available' },
                { status: 400 }
            )
        }

        // Destination is the drop location
        const destLat = booking.dropLat
        const destLng = booking.dropLng

        if (!destLat || !destLng) {
            return NextResponse.json(
                { message: 'Drop location not available' },
                { status: 400 }
            )
        }

        // Call Google Directions API
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&key=${googleMapsApiKey}`

        const response = await fetch(directionsUrl)
        const data = await response.json()

        if (data.status !== 'OK') {
            return NextResponse.json(
                { message: 'Failed to get directions', error: data.error_message },
                { status: 400 }
            )
        }

        // Return processed directions
        const route = data.routes[0]
        const directions = {
            bookingId,
            driverName: booking.driver.user.name,
            status: booking.status,
            origin: {
                lat: originLat,
                lng: originLng
            },
            destination: {
                lat: destLat,
                lng: destLng,
                address: booking.dropLocation
            },
            route: {
                summary: route.summary,
                distance: route.legs[0].distance,
                duration: route.legs[0].duration,
                polyline: route.overview_polyline.points,
                bounds: route.bounds,
                steps: route.legs[0].steps.map((step: any) => ({
                    instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
                    distance: step.distance,
                    duration: step.duration,
                    maneuver: step.maneuver
                }))
            },
            waypoints: data.geocoded_waypoints
        }

        return NextResponse.json(directions)

    } catch (error) {
        console.error('Navigation directions error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}