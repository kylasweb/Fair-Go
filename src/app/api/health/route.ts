import { NextRequest, NextResponse } from 'next/server';

// GET /api/health - Simple health check for Railway
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Simple health check - just verify the server is responding
        const responseTime = Date.now() - startTime;
        
        const healthStatus = {
            status: 'UP',
            timestamp: new Date().toISOString(),
            service: 'fairgo-platform',
            version: '1.0.0',
            responseTime: `${responseTime}ms`,
            checks: {
                server: 'HEALTHY',
                database: 'UNKNOWN'
            }
        };

        return NextResponse.json(healthStatus, {
            status: 200,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Content-Type': 'application/json',
                'X-Response-Time': `${responseTime}ms`
            }
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json({
            status: 'DOWN',
            timestamp: new Date().toISOString(),
            service: 'fairgo-platform',
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: `${responseTime}ms`
        }, {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'X-Response-Time': `${responseTime}ms`
            }
        });
    }
}
