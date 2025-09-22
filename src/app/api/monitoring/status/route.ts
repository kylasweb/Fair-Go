import { NextRequest, NextResponse } from 'next/server';
import { healthCheckManager } from '../../../../monitoring/health/HealthCheckManager';
import { logger } from '../../../../monitoring/logging/FairGoLogger';

// GET /api/monitoring/status - Fast health status (cached)
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Get cached health status for faster response
        const cachedStatus = healthCheckManager.getCachedHealthStatus();

        if (!cachedStatus) {
            // If no cached status available, get fresh status
            const healthStatus = await healthCheckManager.getHealthStatus();
            const duration = Date.now() - startTime;

            logger.info('Status endpoint - fresh check', {
                component: 'status-api',
                duration,
                metadata: { health_status: healthStatus.status }
            });

            return NextResponse.json(healthStatus);
        }

        const duration = Date.now() - startTime;

        logger.debug('Status endpoint - cached response', {
            component: 'status-api',
            duration,
            metadata: {
                health_status: cachedStatus.status,
                cache_age: Date.now() - new Date(cachedStatus.timestamp).getTime()
            }
        });

        return NextResponse.json({
            ...cachedStatus,
            cached: true,
            cache_age_ms: Date.now() - new Date(cachedStatus.timestamp).getTime()
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Status endpoint error', error as Error, {
            component: 'status-api',
            duration
        });

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Status check failed',
            message: (error as Error).message
        }, { status: 500 });
    }
}