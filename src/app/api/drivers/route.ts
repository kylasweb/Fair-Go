import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get user's location from query params (in real app, this would come from client)
    const { searchParams } = new URL(request.url)
    const userLat = parseFloat(searchParams.get('lat') || '12.9716') // Default Bangalore
    const userLng = parseFloat(searchParams.get('lng') || '77.5946')

    // Get available drivers near the user
    const drivers = await db.driver.findMany({
      where: {
        isAvailable: true,
        isVerified: true
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    })

    // Calculate distance for each driver (simplified for demo)
    const driversWithDistance = drivers.map(driver => {
      // Simple distance calculation (in real app, use proper Haversine formula)
      const distance = Math.sqrt(
        Math.pow((driver.currentLocationLat || userLat) - userLat, 2) +
        Math.pow((driver.currentLocationLng || userLng) - userLng, 2)
      ) * 111 // Rough conversion to km

      return {
        ...driver,
        distance: Math.round(distance * 10) / 10
      }
    })

    // Sort by distance and return nearby drivers (within 10km)
    const nearbyDrivers = driversWithDistance
      .filter(driver => driver.distance <= 10)
      .sort((a, b) => a.distance - b.distance)

    return NextResponse.json(nearbyDrivers)

  } catch (error) {
    console.error('Get drivers error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}