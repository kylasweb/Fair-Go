import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  authenticateRequest,
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
  handleDatabaseError,
  checkRateLimit
} from '@/lib/api-middleware'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication failed', 401)
    }

    const userId = authResult.user.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where conditions
    const whereConditions: any = { userId }
    if (status) {
      whereConditions.status = status
    }

    // Get user's bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      db.booking.findMany({
        where: whereConditions,
        include: {
          driver: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true
                }
              }
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      db.booking.count({ where: whereConditions })
    ])

    return createSuccessResponse({
      bookings,
      totalCount,
      hasMore: offset + bookings.length < totalCount
    })

  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = checkRateLimit(`booking_create_${clientIP}`, 10, 60000) // 10 requests per minute
    if (!rateLimit.allowed) {
      return createErrorResponse('Too many booking requests. Please try again later.', 429)
    }

    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication failed', 401)
    }

    const userId = authResult.user.id
    const bookingData = await request.json()

    // Validate required fields
    const validation = validateRequiredFields(bookingData, [
      'pickupLocation', 'vehicleType', 'estimatedPrice'
    ])

    if (!validation.isValid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      )
    }

    const {
      pickupLocation,
      dropLocation,
      vehicleType,
      estimatedPrice,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      notes
    } = bookingData

    // Validate price range
    if (estimatedPrice < 50 || estimatedPrice > 10000) {
      return createErrorResponse('Invalid price range', 400)
    }

    // Create new booking
    const newBooking = await db.booking.create({
      data: {
        userId,
        pickupLocation,
        dropLocation,
        vehicleType,
        estimatedPrice,
        status: 'REQUESTED',
        pickupLat: pickupLat || 12.9716, // Default Bangalore coordinates
        pickupLng: pickupLng || 77.5946,
        dropLat: dropLat || (dropLocation ? 12.9352 : null),
        dropLng: dropLng || (dropLocation ? 77.6245 : null),
        bookingType: 'MANUAL',
        notes
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        }
      }
    })

    return createSuccessResponse(newBooking, 'Booking created successfully', 201)

  } catch (error) {
    return handleDatabaseError(error)
  }
}