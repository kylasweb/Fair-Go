import { NextRequest, NextResponse } from 'next/server'
import { WebSocketServer, WebSocket } from 'ws'

// Global WebSocket server instance
let wss: WebSocketServer | null = null
const clients = new Map<string, WebSocket[]>()

// Initialize WebSocket server if not already done
function initWebSocketServer() {
    if (!wss) {
        wss = new WebSocketServer({ port: 8080 })

        wss.on('connection', (ws: WebSocket, request) => {
            const url = new URL(request.url!, `http://${request.headers.host}`)
            const bookingId = url.pathname.split('/').pop()

            if (!bookingId) {
                ws.close(1000, 'Booking ID required')
                return
            }

            // Add client to tracking
            if (!clients.has(bookingId)) {
                clients.set(bookingId, [])
            }
            clients.get(bookingId)!.push(ws)

            ws.on('close', () => {
                // Remove client from tracking
                const clientList = clients.get(bookingId) || []
                const index = clientList.indexOf(ws)
                if (index > -1) {
                    clientList.splice(index, 1)
                }
                if (clientList.length === 0) {
                    clients.delete(bookingId)
                }
            })

            // Send initial connection confirmation
            ws.send(JSON.stringify({
                type: 'connected',
                bookingId,
                timestamp: new Date().toISOString()
            }))

            // Start sending mock location updates
            startLocationUpdates(bookingId)
        })
    }
}

// Send location updates to all clients for a booking
function broadcastToBooking(bookingId: string, data: any) {
    const clientList = clients.get(bookingId) || []
    const message = JSON.stringify(data)

    clientList.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message)
        }
    })
}

// Simulate real-time location updates
function startLocationUpdates(bookingId: string) {
    let lat = 12.9352 // Starting location (Koramangala)
    let lng = 77.6245
    let progress = 0

    const interval = setInterval(() => {
        // Don't send updates if no clients
        if (!clients.has(bookingId) || clients.get(bookingId)!.length === 0) {
            clearInterval(interval)
            return
        }

        // Simulate movement towards destination
        lat += (Math.random() - 0.5) * 0.001
        lng += (Math.random() - 0.5) * 0.001
        progress = Math.min(progress + Math.random() * 5, 100)

        broadcastToBooking(bookingId, {
            type: 'location_update',
            location: { lat, lng },
            progress,
            timestamp: new Date().toISOString(),
            status: progress < 100 ? 'moving' : 'arrived'
        })

        // Simulate status changes
        if (progress > 25 && progress < 30) {
            broadcastToBooking(bookingId, {
                type: 'status_update',
                status: 'trip_started',
                eta: Math.max(0, Math.floor((100 - progress) * 0.6)),
                progress: Math.floor(progress)
            })
        }

        if (progress >= 100) {
            broadcastToBooking(bookingId, {
                type: 'status_update',
                status: 'trip_completed',
                progress: 100
            })
            clearInterval(interval)
        }
    }, 3000) // Update every 3 seconds
}

export async function GET(
    request: NextRequest,
    { params }: { params: { bookingId: string } }
) {
    const bookingId = params.bookingId

    // Initialize WebSocket server
    initWebSocketServer()

    return NextResponse.json({
        success: true,
        message: `WebSocket tracking initialized for booking ${bookingId}`,
        websocketUrl: `ws://localhost:8080/api/bookings/${bookingId}/track`
    })
}