import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const {
            pickupLocation,
            dropLocation,
            pickupLat,
            pickupLng,
            dropLat,
            dropLng,
            vehicleType,
            estimatedPrice,
            biddingDuration = 300 // 5 minutes default
        } = await request.json()

        // Validate required fields
        if (!pickupLocation || !pickupLat || !pickupLng || !vehicleType) {
            return NextResponse.json(
                { error: 'Pickup location, coordinates, and vehicle type are required' },
                { status: 400 }
            )
        }

        // Calculate bidding end time
        const biddingEndTime = new Date(Date.now() + biddingDuration * 1000)

        // Create the bidding-enabled booking
        const booking = await db.booking.create({
            data: {
                userId: session.user.id,
                pickupLocation,
                pickupLat: parseFloat(pickupLat),
                pickupLng: parseFloat(pickupLng),
                dropLocation: dropLocation || null,
                dropLat: dropLat ? parseFloat(dropLat) : null,
                dropLng: dropLng ? parseFloat(dropLng) : null,
                vehicleType,
                estimatedPrice: parseFloat(estimatedPrice) || 0,
                bookingType: 'MANUAL',
                biddingEnabled: true,
                biddingEndTime
            }
        })

        // Notify nearby drivers about the new bidding opportunity
        // This would be handled by your WebSocket/notification service

        return NextResponse.json({
            success: true,
            booking: {
                id: booking.id,
                pickupLocation: booking.pickupLocation,
                dropLocation: booking.dropLocation,
                vehicleType: booking.vehicleType,
                estimatedPrice: booking.estimatedPrice,
                biddingEnabled: booking.biddingEnabled,
                biddingEndTime: booking.biddingEndTime,
                status: booking.status
            }
        })

    } catch (error) {
        console.error('Error creating bid booking:', error)
        return NextResponse.json(
            { error: 'Failed to create bidding booking' },
            { status: 500 }
        )
    }
}