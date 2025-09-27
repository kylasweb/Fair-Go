import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function PUT(
    request: NextRequest,
    { params }: { params: { bookingId: string; bidId: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { bookingId, bidId } = params

        // Verify the user owns this booking
        const booking = await db.booking.findUnique({
            where: { id: bookingId }
        })

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        if (booking.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'You can only accept bids for your own bookings' },
                { status: 403 }
            )
        }

        if (!booking.biddingEnabled) {
            return NextResponse.json(
                { error: 'This booking is not using bidding' },
                { status: 400 }
            )
        }

        // Check if bid exists and is active
        const bid = await db.rideBid.findUnique({
            where: { id: bidId },
            include: {
                driver: true
            }
        })

        if (!bid) {
            return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
        }

        if (bid.bookingId !== bookingId) {
            return NextResponse.json({ error: 'Bid does not belong to this booking' }, { status: 400 })
        }

        if (bid.bidStatus !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'This bid is no longer active' },
                { status: 400 }
            )
        }

        // Use a transaction to update booking and bids atomically
        await db.$transaction(async (tx) => {
            // Update the booking with the winning bid
            await tx.booking.update({
                where: { id: bookingId },
                data: {
                    driverId: bid.driverId,
                    status: 'ACCEPTED',
                    winningBidId: bidId,
                    biddingEnabled: false,
                    biddingEndTime: null
                }
            })

            // Accept the winning bid
            await tx.rideBid.update({
                where: { id: bidId },
                data: { bidStatus: 'ACCEPTED' }
            })

            // Reject all other active bids for this booking
            await tx.rideBid.updateMany({
                where: {
                    bookingId,
                    bidStatus: 'ACTIVE',
                    id: { not: bidId }
                },
                data: { bidStatus: 'REJECTED' }
            })

            // Create tracking record
            await tx.tracking.create({
                data: {
                    bookingId,
                    driverLat: bid.driver.currentLocationLat || 0,
                    driverLng: bid.driver.currentLocationLng || 0,
                    eta: bid.estimatedArrivalTime
                }
            })
        })

        // Notify the winning driver via WebSocket/notification
        // This would be handled by your notification service

        return NextResponse.json({
            success: true,
            message: 'Bid accepted successfully',
            booking: {
                id: bookingId,
                driverId: bid.driverId,
                status: 'ACCEPTED',
                winningBid: {
                    id: bidId,
                    amount: bid.bidAmount,
                    driver: {
                        name: bid.driver.user.name
                    }
                }
            }
        })

    } catch (error) {
        console.error('Error accepting bid:', error)
        return NextResponse.json(
            { error: 'Failed to accept bid' },
            { status: 500 }
        )
    }
}