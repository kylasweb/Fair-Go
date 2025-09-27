import { NextRequest, NextResponse } from 'next/server'

// GET /api/navigation/route - Get route between two points
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const origin = searchParams.get('origin') // format: "lat,lng"
        const destination = searchParams.get('destination') // format: "lat,lng"
        const mode = searchParams.get('mode') || 'driving' // driving, walking, bicycling, transit

        if (!origin || !destination) {
            return NextResponse.json(
                { message: 'Origin and destination coordinates are required' },
                { status: 400 }
            )
        }

        // Parse coordinates
        const [originLat, originLng] = origin.split(',').map(coord => parseFloat(coord.trim()))
        const [destLat, destLng] = destination.split(',').map(coord => parseFloat(coord.trim()))

        if (!originLat || !originLng || !destLat || !destLng) {
            return NextResponse.json(
                { message: 'Invalid coordinate format. Use "lat,lng"' },
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

        // Call Google Directions API
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=${mode}&key=${googleMapsApiKey}&alternatives=true`

        const response = await fetch(directionsUrl)
        const data = await response.json()

        if (data.status !== 'OK') {
            return NextResponse.json(
                { message: 'Failed to get directions', error: data.error_message },
                { status: 400 }
            )
        }

        // Process and return route data
        const routes = data.routes.map((route: any) => ({
            summary: route.summary,
            distance: {
                text: route.legs[0].distance.text,
                value: route.legs[0].distance.value // meters
            },
            duration: {
                text: route.legs[0].duration.text,
                value: route.legs[0].duration.value // seconds
            },
            polyline: route.overview_polyline.points,
            bounds: route.bounds,
            steps: route.legs[0].steps.map((step: any) => ({
                instruction: step.html_instructions,
                distance: step.distance,
                duration: step.duration,
                start_location: step.start_location,
                end_location: step.end_location,
                polyline: step.polyline.points,
                travel_mode: step.travel_mode
            }))
        }))

        return NextResponse.json({
            status: 'OK',
            routes,
            geocoded_waypoints: data.geocoded_waypoints
        })

    } catch (error) {
        console.error('Navigation route error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}