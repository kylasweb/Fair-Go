import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reviews - Get reviews for a driver or user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const driverId = searchParams.get('driverId')
        const userId = searchParams.get('userId')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = parseInt(searchParams.get('offset') || '0')

        if (!driverId && !userId) {
            return NextResponse.json(
                { message: 'Either driverId or userId is required' },
                { status: 400 }
            )
        }

        const reviews = await db.review.findMany({
            where: driverId ? { driverId } : userId ? { userId } : {},
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                driver: driverId ? {
                    select: {
                        id: true,
                        user: {
                            select: {
                                name: true,
                                avatar: true
                            }
                        }
                    }
                } : undefined,
                booking: {
                    select: {
                        id: true,
                        pickupLocation: true,
                        dropLocation: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        })

        // Get average rating
        const avgRating = await db.review.aggregate({
            where: driverId ? { driverId } : (userId ? { userId } : {}),
            _avg: {
                rating: true
            },
            _count: true
        })

        return NextResponse.json({
            reviews,
            averageRating: avgRating._avg?.rating || 0,
            totalReviews: avgRating._count
        })

    } catch (error) {
        console.error('Reviews GET error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
    try {
        // Get token from Authorization header
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
        const body = await request.json()
        const { bookingId, driverId, rating, comment, tips } = body

        // Validate required fields
        if (!bookingId || !driverId || !rating) {
            return NextResponse.json(
                { message: 'Booking ID, driver ID, and rating are required' },
                { status: 400 }
            )
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { message: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        // Check if booking exists and belongs to user
        const booking = await db.booking.findFirst({
            where: {
                id: bookingId,
                userId,
                driverId,
                status: 'COMPLETED'
            }
        })

        if (!booking) {
            return NextResponse.json(
                { message: 'Booking not found or not completed' },
                { status: 404 }
            )
        }

        // Check if review already exists
        const existingReview = await db.review.findFirst({
            where: {
                bookingId,
                userId
            }
        })

        if (existingReview) {
            return NextResponse.json(
                { message: 'Review already exists for this booking' },
                { status: 409 }
            )
        }

        // Create review
        const review = await db.review.create({
            data: {
                userId,
                bookingId,
                driverId,
                rating,
                comment: comment || ''
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                booking: {
                    select: {
                        id: true,
                        pickupLocation: true,
                        dropLocation: true
                    }
                }
            }
        })

        // Update driver's average rating
        const driverRating = await db.review.aggregate({
            where: { driverId },
            _avg: { rating: true }
        })

        await db.driver.update({
            where: { id: driverId },
            data: { rating: driverRating._avg.rating || 0 }
        })

        return NextResponse.json(review, { status: 201 })

    } catch (error) {
        console.error('Reviews POST error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/reviews - Update a review
export async function PUT(request: NextRequest) {
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
        const body = await request.json()
        const { reviewId, rating, comment, tips } = body

        if (!reviewId) {
            return NextResponse.json(
                { message: 'Review ID is required' },
                { status: 400 }
            )
        }

        // Check if review exists and belongs to user
        const existingReview = await db.review.findFirst({
            where: {
                id: reviewId,
                userId
            }
        })

        if (!existingReview) {
            return NextResponse.json(
                { message: 'Review not found' },
                { status: 404 }
            )
        }

        // Update review
        const review = await db.review.update({
            where: { id: reviewId },
            data: {
                rating: rating ?? existingReview.rating,
                comment: comment ?? existingReview.comment
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        })

        // Update driver's average rating if rating changed
        if (rating && rating !== existingReview.rating) {
            const driverRating = await db.review.aggregate({
                where: { driverId: existingReview.driverId },
                _avg: { rating: true }
            })

            await db.driver.update({
                where: { id: existingReview.driverId },
                data: { rating: driverRating._avg.rating || 0 }
            })
        }

        return NextResponse.json(review)

    } catch (error) {
        console.error('Reviews PUT error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}