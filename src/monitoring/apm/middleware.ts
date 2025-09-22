import { NextRequest, NextResponse } from 'next/server';
import { apmManager } from './APMManager';
import { logger } from '../logging/FairGoLogger';

// Middleware for automatic APM instrumentation
export function apmMiddleware(request: NextRequest): NextResponse | void {
    const startTime = Date.now();
    const requestId = apmManager.startRequest(request);

    // Add request ID to headers for correlation
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);

    // Create modified request with tracing headers
    const modifiedRequest = new NextRequest(request.url, {
        method: request.method,
        headers: requestHeaders,
        body: request.body,
    });

    // Continue to next middleware/handler
    return NextResponse.next({
        request: modifiedRequest,
    });
}

// Wrapper for API route handlers with automatic APM
export function withAPM<T extends any[], R>(
    handler: (...args: T) => Promise<NextResponse>,
    options: {
        operationName?: string;
        trackBusinessMetrics?: boolean;
        timeout?: number;
    } = {}
) {
    return async (...args: T): Promise<NextResponse> => {
        const request = args[0] as NextRequest;
        const requestId = apmManager.startRequest(request, options.operationName);

        let response: NextResponse | undefined;
        let error: Error | undefined;

        try {
            // Set timeout if specified
            if (options.timeout) {
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error(`Request timeout after ${options.timeout}ms`)), options.timeout);
                });

                response = await Promise.race([
                    handler(...args),
                    timeoutPromise
                ]);
            } else {
                response = await handler(...args);
            }

            // Track business metrics if enabled
            if (options.trackBusinessMetrics && response.status < 400) {
                await trackBusinessMetricsFromResponse(request, response);
            }

        } catch (err) {
            error = err instanceof Error ? err : new Error(String(err));

            // Create error response
            response = NextResponse.json(
                {
                    error: 'Internal Server Error',
                    requestId
                },
                { status: 500 }
            );

            logger.error('API handler error', error, {
                requestId,
                component: 'api',
                operation: options.operationName || 'unknown',
                metadata: {
                    url: request.url,
                    method: request.method
                }
            });
        } finally {
            // End APM tracking - ensure response exists
            if (response) {
                apmManager.endRequest(requestId, response, error);
            }
        }

        // Add request ID to response headers
        response.headers.set('x-request-id', requestId);

        return response;
    };
}

// Helper function to track business metrics from API responses
async function trackBusinessMetricsFromResponse(request: NextRequest, response: NextResponse) {
    try {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // Track booking-related events
        if (pathname.includes('/api/bookings') && request.method === 'POST' && response.status === 201) {
            const responseBody = await response.clone().json();
            apmManager.trackBusinessEvent('booking_created', {
                source: 'api',
                vehicleType: responseBody?.vehicleType || 'unknown',
                language: request.headers.get('accept-language') || 'unknown',
                userId: responseBody?.userId
            });
        }

        // Track driver registrations
        if (pathname.includes('/api/drivers/register') && request.method === 'POST' && response.status === 201) {
            apmManager.trackBusinessEvent('driver_registered', {
                source: 'api'
            });
        }

        // Track authentication events
        if (pathname.includes('/api/auth/signin') && request.method === 'POST') {
            if (response.status === 200) {
                apmManager.trackBusinessEvent('user_signin_success', {
                    source: 'api'
                });
            } else {
                apmManager.trackBusinessEvent('user_signin_failure', {
                    source: 'api',
                    statusCode: response.status
                });
            }
        }

        // Track payment events
        if (pathname.includes('/api/payments') && request.method === 'POST' && response.status === 200) {
            const responseBody = await response.clone().json();
            apmManager.trackBusinessEvent('payment_processed', {
                source: 'api',
                amount: responseBody?.amount,
                currency: responseBody?.currency || 'USD',
                paymentMethod: responseBody?.paymentMethod
            });
        }

    } catch (error) {
        logger.warning('Failed to track business metrics from response', {
            component: 'apm',
            metadata: {
                error_message: error instanceof Error ? error.message : String(error)
            }
        });
    }
}

// Performance monitoring wrapper for components
export function withPerformanceMonitoring<P extends Record<string, any>>(
    Component: React.ComponentType<P>,
    componentName?: string
) {
    return function MonitoredComponent(props: P) {
        const startTime = Date.now();

        React.useEffect(() => {
            const renderTime = Date.now() - startTime;

            logger.performance('component_render', {
                duration: renderTime,
                component: componentName || Component.name || 'UnknownComponent',
                success: true,
                metadata: {
                    render_time_ms: renderTime,
                    props_count: Object.keys(props).length
                }
            });

            // Track slow component renders
            if (renderTime > 100) {
                logger.warning('Slow component render detected', {
                    component: 'ui',
                    metadata: {
                        component_name: componentName || Component.name,
                        render_time_ms: renderTime,
                        threshold_ms: 100
                    }
                });
            }
        }, []);

        return React.createElement(Component, props);
    };
}

// Custom hook for tracking user interactions
export function useUserInteractionTracking(componentName: string) {
    const trackInteraction = (action: string, metadata?: Record<string, any>) => {
        apmManager.trackBusinessEvent('user_interaction', {
            action,
            component: componentName,
            timestamp: new Date().toISOString(),
            ...metadata
        });

        logger.info('User interaction tracked', {
            component: 'ui',
            operation: 'user_interaction',
            metadata: {
                action,
                component_name: componentName,
                ...metadata
            }
        });
    };

    return { trackInteraction };
}

// Database query performance wrapper
export function withQueryPerformanceMonitoring<T extends any[], R>(
    queryFunction: (...args: T) => Promise<R>,
    queryName: string
) {
    return async (...args: T): Promise<R> => {
        const startTime = Date.now();

        try {
            const result = await queryFunction(...args);
            const duration = Date.now() - startTime;

            logger.performance('database_query', {
                duration,
                component: 'database',
                success: true,
                metadata: {
                    query_name: queryName,
                    duration_ms: duration
                }
            });

            // Track slow queries
            if (duration > 1000) {
                logger.warning('Slow database query detected', {
                    component: 'database',
                    metadata: {
                        query_name: queryName,
                        duration_ms: duration,
                        threshold_ms: 1000
                    }
                });
            }

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;

            logger.error('Database query failed', error instanceof Error ? error : new Error(String(error)), {
                component: 'database',
                metadata: {
                    query_name: queryName,
                    duration_ms: duration
                }
            });

            throw error;
        }
    };
}

// WebSocket connection monitoring
export function trackWebSocketConnection(connectionId: string, userId?: string) {
    logger.info('WebSocket connection established', {
        component: 'websocket',
        operation: 'connection_established',
        metadata: {
            connection_id: connectionId,
            user_id: userId
        }
    });

    apmManager.trackBusinessEvent('websocket_connected', {
        connectionId,
        userId
    });
}

export function trackWebSocketDisconnection(connectionId: string, reason: string, userId?: string) {
    logger.info('WebSocket connection closed', {
        component: 'websocket',
        operation: 'connection_closed',
        metadata: {
            connection_id: connectionId,
            user_id: userId,
            reason
        }
    });

    apmManager.trackBusinessEvent('websocket_disconnected', {
        connectionId,
        userId,
        reason
    });
}

// Export common types and utilities
export type { APMContext } from './APMManager';
export { apmManager };

// React import for component monitoring
import React from 'react';