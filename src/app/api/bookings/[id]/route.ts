import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface BookingParams {
    params: {
        id: string
    }
}

export async function GET(
    request: NextRequest,
    { params }: BookingParams
) {
    try {
        const bookingId = params.id

        if (!bookingId) {
            return NextResponse.json(
                { error: 'Booking ID is required' },
                { status: 400 }
            )
        }

        // In a real implementation, you would fetch from database
        // For now, we'll simulate booking data based on the ID
        const mockBookingData = {
            id: bookingId,
            from: "Koramangala, Bangalore",
            to: "Indiranagar Metro Station",
            driverName: "Raj Kumar",
            driverRating: 4.8,
            vehicleNumber: "KA-01-AB-1234",
            driverPhone: "+919876543210",
            estimatedFare: "₹95",
            finalFare: "₹92",
            distance: "8.2 km",
            estimatedArrival: "2:15 PM",
            estimatedDuration: "12 mins",
            actualDuration: "11 mins",
            status: "in_progress",
            currentLocation: {
                lat: 12.9352,
                lng: 77.6245
            },
            createdAt: new Date().toISOString()
        }

        // Simulate different booking states based on ID
        if (bookingId.endsWith('1')) {
            mockBookingData.status = 'driver_coming'
            mockBookingData.estimatedDuration = '5 mins'
        } else if (bookingId.endsWith('2')) {
            mockBookingData.status = 'driver_arrived'
            mockBookingData.estimatedDuration = '0 mins'
        } else if (bookingId.endsWith('3')) {
            mockBookingData.status = 'trip_completed'
            mockBookingData.actualDuration = '11 mins'
        }

        return NextResponse.json({
            success: true,
            data: mockBookingData
        })

    } catch (error) {
        console.error('Error fetching booking:', error)
        return NextResponse.json(
            { error: 'Failed to fetch booking data' },
            { status: 500 }
        )
    }
}

// Update booking status
export async function PATCH(
    request: NextRequest,
    { params }: BookingParams
) {
    try {
        const bookingId = params.id
        const body = await request.json()
        const { status, currentLocation } = body

        if (!bookingId) {
            return NextResponse.json(
                { error: 'Booking ID is required' },
                { status: 400 }
            )
        }

        // In a real implementation, you would update the database
        console.log(`Updating booking ${bookingId}:`, { status, currentLocation })

        return NextResponse.json({
            success: true,
            message: 'Booking updated successfully'
        })

    } catch (error) {
        console.error('Error updating booking:', error)
        return NextResponse.json(
            { error: 'Failed to update booking' },
            { status: 500 }
        )
    }
}