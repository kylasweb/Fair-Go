import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Mock analytics data
        const analytics = {
            totalCalls: 247,
            successfulBookings: 189,
            avgCallDuration: 52,
            agentPerformance: [
                {
                    agentId: 'booking-coordinator',
                    agentName: 'Booking Coordinator',
                    callsHandled: 189,
                    successRate: 85,
                    avgDuration: 45
                },
                {
                    agentId: 'support-specialist',
                    agentName: 'Ride Support Specialist',
                    callsHandled: 42,
                    successRate: 92,
                    avgDuration: 78
                },
                {
                    agentId: 'driver-concierge',
                    agentName: 'Driver Concierge',
                    callsHandled: 16,
                    successRate: 88,
                    avgDuration: 34
                }
            ]
        };

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}