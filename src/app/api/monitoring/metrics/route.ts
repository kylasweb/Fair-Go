import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '../../../../monitoring/metrics/MetricsCollector';
import { logger } from '../../../../monitoring/logging/FairGoLogger';

// GET /api/monitoring/metrics - Prometheus metrics endpoint
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Get Prometheus formatted metrics
        const metrics = await metricsCollector.getMetrics();
        const duration = Date.now() - startTime;

        // Log metrics request (but avoid too verbose logging)
        if (process.env.NODE_ENV !== 'production') {
            logger.debug('Metrics endpoint accessed', {
                component: 'metrics-api',
                duration,
                metadata: { metrics_size: metrics.length }
            });
        }

        // Record metrics (avoid infinite loop by using a different endpoint pattern)
        metricsCollector.recordHttpRequest('GET', '/api/monitoring/metrics', 200, duration / 1000, 'monitoring');

        return new Response(metrics, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Metrics endpoint error', error as Error, {
            component: 'metrics-api',
            duration
        });

        metricsCollector.recordHttpRequest('GET', '/api/monitoring/metrics', 500, duration / 1000, 'monitoring');

        return NextResponse.json({
            error: 'Failed to retrieve metrics',
            message: (error as Error).message
        }, { status: 500 });
    }
}