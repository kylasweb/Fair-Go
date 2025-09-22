import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
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
    
    // Extract user ID from token
    const tokenParts = token.split('_')
    if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = tokenParts[1]

    // Get user's payment history
    const payments = await db.payment.findMany({
      where: { userId },
      include: {
        booking: {
          select: {
            id: true,
            pickupLocation: true,
            dropLocation: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get user's wallet balance
    const wallet = await db.wallet.findUnique({
      where: { userId }
    })

    return NextResponse.json({
      payments,
      wallet: wallet || { balance: 0, currency: 'INR' }
    })

  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    
    // Extract user ID from token
    const tokenParts = token.split('_')
    if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = tokenParts[1]

    const paymentData = await request.json()
    const { bookingId, method, amount, details } = paymentData

    if (!bookingId || !method || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify booking exists and belongs to user
    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        userId
      }
    })

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      )
    }

    // Process payment (in a real app, integrate with payment gateway)
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create payment record
    const newPayment = await db.payment.create({
      data: {
        userId,
        bookingId,
        amount,
        method,
        status: 'COMPLETED',
        transactionId
      }
    })

    // Update booking status to COMPLETED
    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
        finalPrice: amount,
        completedAt: new Date()
      }
    })

    // Update driver stats if driver exists
    if (booking.driverId) {
      await db.driver.update({
        where: { id: booking.driverId },
        data: {
          totalRides: {
            increment: 1
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      payment: newPayment,
      message: 'Payment processed successfully'
    })

  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to process payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}