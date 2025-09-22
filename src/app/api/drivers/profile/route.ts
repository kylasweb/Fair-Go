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

    // Get driver profile
    const driver = await db.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        documents: {
          select: {
            type: true,
            status: true,
            verifiedAt: true
          }
        }
      }
    })

    if (!driver) {
      return NextResponse.json(
        { message: 'Driver profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(driver)

  } catch (error) {
    console.error('Get driver profile error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const { isAvailable, currentLocationLat, currentLocationLng } = await request.json()

    // Get driver profile
    const driver = await db.driver.findUnique({
      where: { userId }
    })

    if (!driver) {
      return NextResponse.json(
        { message: 'Driver profile not found' },
        { status: 404 }
      )
    }

    // Update driver profile
    const updatedDriver = await db.driver.update({
      where: { id: driver.id },
      data: {
        ...(isAvailable !== undefined && { isAvailable }),
        ...(currentLocationLat !== undefined && { currentLocationLat }),
        ...(currentLocationLng !== undefined && { currentLocationLng })
      }
    })

    return NextResponse.json(updatedDriver)

  } catch (error) {
    console.error('Update driver profile error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}