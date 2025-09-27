import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: { bookingId: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { bidAmount, estimatedArrivalTime } = await request.json()
        const { bookingId } = params

        if (!bidAmount || !estimatedArrivalTime) {
            return NextResponse.json(
                { error: 'Bid amount and estimated arrival time are required' },
                { status: 400 }
            )
        }

        // Verify the user is a driver
        const driver = await db.driver.findUnique({
            where: { userId: session.user.id }
        })

        if (!driver) {
            return NextResponse.json(
                { error: 'Only drivers can place bids' },
                { status: 403 }
            )
        }

        // Check if booking exists and is eligible for bidding
        const booking = await db.booking.findUnique({
            where: { id: bookingId }
        })

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        if (!booking.biddingEnabled) {
            return NextResponse.json(
                { error: 'This booking is not accepting bids' },
                { status: 400 }
            )
        }

        if (booking.status !== 'REQUESTED') {
            return NextResponse.json(
                { error: 'This booking is no longer accepting bids' },
                { status: 400 }
            )
        }

        // Check if bidding period has expired
        if (booking.biddingEndTime && new Date() > booking.biddingEndTime) {
            return NextResponse.json(
                { error: 'Bidding period has expired' },
                { status: 400 }
            )
        }

        // Check if driver already has an active bid for this booking
        const existingBid = await db.rideBid.findFirst({
            where: {
                bookingId,
                driverId: driver.id,
                bidStatus: 'ACTIVE'
            }
        })

        if (existingBid) {
            return NextResponse.json(
                { error: 'You already have an active bid for this booking' },
                { status: 400 }
            )
        }

        // Create the bid
        const expiresAt = booking.biddingEndTime || new Date(Date.now() + 5 * 60 * 1000) // 5 minutes default

        const bid = await db.rideBid.create({
            data: {
                bookingId,
                driverId: driver.id,
                bidAmount: parseFloat(bidAmount),
                estimatedArrivalTime: parseInt(estimatedArrivalTime),
                expiresAt
            },
            include: {
                driver: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                }
            }
        })

        // Notify other drivers about the new bid via WebSocket (if implemented)
        // This would be handled by your WebSocket service

        return NextResponse.json({
            success: true,
            bid: {
                id: bid.id,
                bidAmount: bid.bidAmount,
                estimatedArrivalTime: bid.estimatedArrivalTime,
                expiresAt: bid.expiresAt,
                driver: {
                    name: bid.driver.user.name
                }
            }
        })

    } catch (error) {
        console.error('Error creating bid:', error)
        return NextResponse.json(
            { error: 'Failed to create bid' },
            { status: 500 }
        )
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { bookingId: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { bookingId } = params

        // Get all active bids for this booking
        const bids = await db.rideBid.findMany({
            where: {
                bookingId,
                bidStatus: 'ACTIVE'
            },
            include: {
                driver: {
                    include: {
                        user: {
                            select: { name: true, avatar: true }
                        }
                    }
                }
            },
            orderBy: [
                { bidAmount: 'asc' }, // Lowest bid first
                { estimatedArrivalTime: 'asc' } // Then by arrival time
            ]
        })

        return NextResponse.json({
            success: true,
            bids: bids.map(bid => ({
                id: bid.id,
                bidAmount: bid.bidAmount,
                estimatedArrivalTime: bid.estimatedArrivalTime,
                expiresAt: bid.expiresAt,
                driver: {
                    name: bid.driver.user.name,
                    avatar: bid.driver.user.avatar
                }
            }))
        })

    } catch (error) {
        console.error('Error fetching bids:', error)
        return NextResponse.json(
            { error: 'Failed to fetch bids' },
            { status: 500 }
        )
    }
}