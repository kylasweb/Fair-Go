import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '../metrics/MetricsCollector';
import { logger } from '../logging/FairGoLogger';
import crypto from 'crypto';

export interface APMContext {
    requestId: string;
    startTime: number;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    ipAddress?: string;
    route?: string;
    method?: string;
}

class APMManager {
    private static instance: APMManager;
    private activeRequests: Map<string, APMContext> = new Map();
    private performanceThresholds = {
        slow_request_ms: 2000,
        very_slow_request_ms: 5000,
        error_rate_threshold: 0.05, // 5%
        memory_threshold_mb: 512
    };

    public static getInstance(): APMManager {
        if (!APMManager.instance) {
            APMManager.instance = new APMManager();
        }
        return APMManager.instance;
    }

    constructor() {
        // Start periodic performance monitoring
        this.startPeriodicMonitoring();
    }

    private startPeriodicMonitoring() {
        // Monitor every 30 seconds
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 30000);

        // Monitor every 5 minutes for trend analysis
        setInterval(() => {
            this.analyzePerformanceTrends();
        }, 300000);
    }

    public startRequest(request: NextRequest, route?: string): string {
        const requestId = crypto.randomUUID();
        const startTime = Date.now();

        const context: APMContext = {
            requestId,
            startTime,
            route: route || this.extractRoute(request.nextUrl.pathname),
            method: request.method,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: this.getClientIP(request),
            userId: this.extractUserId(request),
            sessionId: this.extractSessionId(request)
        };

        this.activeRequests.set(requestId, context);

        // Log request start
        logger.debug('Request started', {
            requestId,
            component: 'apm',
            operation: 'request_start',
            metadata: {
                method: context.method,
                route: context.route,
                user_agent: context.userAgent,
                ip_address: context.ipAddress
            }
        });

        return requestId;
    }

    public endRequest(requestId: string, response: NextResponse | Response, error?: Error): void {
        const context = this.activeRequests.get(requestId);
        if (!context) {
            logger.warning('APM: Request context not found', { requestId });
            return;
        }

        const duration = Date.now() - context.startTime;
        const statusCode = response.status;
        const isError = statusCode >= 400;
        const isSlowRequest = duration > this.performanceThresholds.slow_request_ms;

        // Record metrics
        this.recordRequestMetrics(context, duration, statusCode, isError);

        // Log request completion
        const logLevel = isError ? 'error' : isSlowRequest ? 'warning' : 'info';
        logger.http(
            context.method || 'UNKNOWN',
            context.route || 'unknown',
            statusCode,
            duration,
            {
                requestId,
                userId: context.userId,
                sessionId: context.sessionId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                component: 'apm',
                metadata: {
                    slow_request: isSlowRequest,
                    very_slow_request: duration > this.performanceThresholds.very_slow_request_ms,
                    error_occurred: isError,
                    error_message: error?.message
                }
            }
        );

        // Performance logging for detailed analysis
        logger.performance('request_completed', {
            duration,
            userId: context.userId,
            component: 'api',
            success: !isError,
            metadata: {
                method: context.method,
                route: context.route,
                status_code: statusCode,
                slow_request: isSlowRequest,
                user_type: this.getUserType(context.userId),
                request_size: this.getRequestSize(context),
                response_size: this.getResponseSize(response)
            }
        });

        // Clean up
        this.activeRequests.delete(requestId);

        // Alert on critical issues
        if (error || statusCode >= 500) {
            this.handleCriticalError(context, error, statusCode);
        } else if (duration > this.performanceThresholds.very_slow_request_ms) {
            this.handleSlowRequest(context, duration);
        }
    }

    private recordRequestMetrics(context: APMContext, duration: number, statusCode: number, isError: boolean) {
        const userType = this.getUserType(context.userId);
        const route = context.route || 'unknown';
        const method = context.method || 'UNKNOWN';

        // HTTP metrics
        metricsCollector.recordHttpRequest(method, route, statusCode, duration / 1000, userType);

        // Business metrics based on route
        if (route.includes('/api/bookings') && method === 'POST' && statusCode < 400) {
            metricsCollector.recordBooking('unknown', 'unknown', 'api');
        }

        // User experience metrics
        metricsCollector.httpRequestDuration.observe(
            { method, route, status_code: statusCode.toString(), user_type: userType },
            duration / 1000
        );

        // Track error rates by user type
        if (isError) {
            metricsCollector.httpRequestErrors.inc({
                method,
                route,
                error_type: statusCode >= 500 ? 'server_error' : 'client_error',
                status_code: statusCode.toString()
            });
        }
    }

    private collectPerformanceMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        // Update system metrics
        metricsCollector.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed / 1024 / 1024);
        metricsCollector.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal / 1024 / 1024);
        metricsCollector.memoryUsage.set({ type: 'rss' }, memUsage.rss / 1024 / 1024);
        metricsCollector.memoryUsage.set({ type: 'external' }, memUsage.external / 1024 / 1024);

        // Track active requests
        metricsCollector.activeWebsockets.set({ connection_type: 'http', user_type: 'total' }, this.activeRequests.size);

        // Log performance metrics
        logger.performance('system_metrics', {
            duration: 0, // N/A for system metrics
            component: 'system',
            success: true,
            metadata: {
                memory_heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
                memory_heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
                memory_rss_mb: Math.round(memUsage.rss / 1024 / 1024),
                active_requests: this.activeRequests.size,
                uptime_seconds: Math.round(process.uptime())
            }
        });

        // Check for memory issues
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        if (heapUsedMB > this.performanceThresholds.memory_threshold_mb) {
            logger.warning('High memory usage detected', {
                component: 'apm',
                metadata: {
                    heap_used_mb: Math.round(heapUsedMB),
                    threshold_mb: this.performanceThresholds.memory_threshold_mb
                }
            });
        }
    }

    private analyzePerformanceTrends() {
        // This would typically involve more sophisticated analysis
        // For now, we'll do basic trend monitoring

        logger.info('Performance trend analysis', {
            component: 'apm',
            operation: 'trend_analysis',
            metadata: {
                active_requests: this.activeRequests.size,
                analysis_type: 'basic',
                timestamp: new Date().toISOString()
            }
        });

        // Clean up any stale requests (over 5 minutes old)
        const fiveMinutesAgo = Date.now() - 300000;
        for (const [requestId, context] of this.activeRequests.entries()) {
            if (context.startTime < fiveMinutesAgo) {
                logger.warning('Stale request detected and cleaned up', {
                    requestId,
                    component: 'apm',
                    metadata: {
                        age_ms: Date.now() - context.startTime,
                        route: context.route
                    }
                });
                this.activeRequests.delete(requestId);
            }
        }
    }

    private handleCriticalError(context: APMContext, error?: Error, statusCode?: number) {
        logger.critical('Critical error detected in request', {
            requestId: context.requestId,
            userId: context.userId,
            component: 'apm',
            operation: 'error_handling',
            metadata: {
                route: context.route,
                method: context.method,
                status_code: statusCode,
                error_message: error?.message,
                error_stack: error?.stack,
                user_agent: context.userAgent,
                ip_address: context.ipAddress
            }
        });

        // Record security event if suspicious
        if (statusCode === 403 || statusCode === 401) {
            logger.security('auth_failure', {
                severity: 'medium',
                userId: context.userId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                description: `Authentication failure on ${context.route}`,
                metadata: {
                    status_code: statusCode,
                    route: context.route,
                    method: context.method
                }
            });
        }
    }

    private handleSlowRequest(context: APMContext, duration: number) {
        logger.warning('Slow request detected', {
            requestId: context.requestId,
            userId: context.userId,
            component: 'apm',
            operation: 'slow_request',
            duration,
            metadata: {
                route: context.route,
                method: context.method,
                threshold_ms: this.performanceThresholds.very_slow_request_ms,
                user_agent: context.userAgent
            }
        });
    }

    private extractRoute(pathname: string): string {
        // Normalize route for better grouping in metrics
        return pathname
            .replace(/\/\d+/g, '/:id')  // Replace numeric IDs
            .replace(/\/[a-f0-9-]{36}/g, '/:uuid')  // Replace UUIDs
            .replace(/\/[a-zA-Z0-9-]+\.(jpg|jpeg|png|gif|webp|svg|css|js|ico)/g, '/static');
    }

    private getClientIP(request: NextRequest): string {
        return request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';
    }

    private extractUserId(request: NextRequest): string | undefined {
        // Extract user ID from JWT token, session, or headers
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            try {
                // This would be implemented based on your auth system
                // For now, return placeholder
                return 'user_from_token';
            } catch {
                return undefined;
            }
        }
        return undefined;
    }

    private extractSessionId(request: NextRequest): string | undefined {
        // Extract session ID from cookie or header
        const sessionCookie = request.cookies.get('session');
        return sessionCookie?.value;
    }

    private getUserType(userId?: string): string {
        if (!userId) return 'anonymous';
        // This would be implemented based on your user system
        return 'authenticated';
    }

    private getRequestSize(context: APMContext): number {
        // This would be implemented to track request body size
        return 0;
    }

    private getResponseSize(response: NextResponse | Response): number {
        // This would be implemented to track response body size
        const contentLength = response.headers.get('content-length');
        return contentLength ? parseInt(contentLength, 10) : 0;
    }

    // Public methods for manual tracking
    public trackBusinessEvent(event: string, metadata: Record<string, any>) {
        logger.business(event as any, metadata);

        // Update business metrics
        if (event === 'booking_created') {
            metricsCollector.recordBooking(
                metadata.vehicleType || 'unknown',
                metadata.language || 'unknown',
                metadata.source || 'unknown'
            );
        }
    }

    public trackAIPerformance(modelType: string, language: string, latency: number, accuracy?: number) {
        metricsCollector.recordAIModelLatency(modelType, language, 'inference', latency);

        if (accuracy !== undefined) {
            metricsCollector.updateAIModelAccuracy(modelType, language, 'realtime', accuracy);
        }

        logger.ai('model_inference', {
            modelType,
            language,
            latency,
            accuracy
        });
    }

    public getActiveRequestsCount(): number {
        return this.activeRequests.size;
    }

    public getPerformanceMetrics() {
        return {
            activeRequests: this.activeRequests.size,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            thresholds: this.performanceThresholds
        };
    }
}

export const apmManager = APMManager.getInstance();
export default APMManager;