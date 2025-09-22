import { NextRequest, NextResponse } from 'next/server';
import { getDetailedHealthStatus } from '../../../monitoring';
import { logger } from '../../../monitoring';

// GET /api/health - Comprehensive health check
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Get comprehensive health status from monitoring system
        const healthStatus = await getDetailedHealthStatus();
        const responseTime = Date.now() - startTime;

        // Log health check request
        logger.info('Health check requested', {
            component: 'api',
            operation: 'health_check',
            metadata: {
                response_time_ms: responseTime,
                overall_status: healthStatus.status,
                timestamp: healthStatus.timestamp
            }
        });

        return NextResponse.json(healthStatus, {
            status: healthStatus.status === 'UP' ? 200 : 503,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Content-Type': 'application/json',
                'X-Response-Time': `${responseTime}ms`
            }
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;

        logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)), {
            component: 'api',
            operation: 'health_check_failed',
            metadata: {
                response_time_ms: responseTime,
                error_type: 'health_check_error'
            }
        });

        return NextResponse.json({
            status: 'DOWN',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Health check failed',
            details: {
                message: 'Unable to perform health checks',
                responseTime: responseTime
            }
        }, {
            status: 503,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Content-Type': 'application/json',
                'X-Response-Time': `${responseTime}ms`
            }
        });
    }
}