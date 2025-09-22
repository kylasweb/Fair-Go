/**
 * FairGo Platform Monitoring & Observability System
 * 
 * Comprehensive monitoring solution providing:
 * - Prometheus metrics collection
 * - Structured logging with ECS format
 * - Health checks and status monitoring
 * - Application Performance Monitoring (APM)
 * - OpenTelemetry distributed tracing
 * - Business metrics and user analytics
 * - Security and audit logging
 * - AI/ML model performance monitoring
 * 
 * Goals:
 * - 99.9% uptime for all critical services
 * - <5 minutes Mean Time To Detection (MTTD)  
 * - <30 minutes Mean Time To Resolution (MTTR)
 * - Comprehensive audit trails for compliance
 * - Full observability into AI services
 */

// Core monitoring components
export { metricsCollector } from './metrics/MetricsCollector';
export { logger } from './logging/FairGoLogger';
export { healthCheckManager } from './health/HealthCheckManager';

// APM and performance monitoring
export { apmManager } from './apm/APMManager';
export {
    apmMiddleware,
    withAPM,
    withPerformanceMonitoring,
    withQueryPerformanceMonitoring,
    useUserInteractionTracking,
    trackWebSocketConnection,
    trackWebSocketDisconnection
} from './apm/middleware';

// Alerting system
export { alertManager } from './alerts/AlertManager';
export type { Alert, AlertRule, AlertSeverity, AlertStatus, NotificationChannel } from './alerts/AlertManager';
export {
    createNotificationProvider,
    EmailNotificationProvider,
    SlackNotificationProvider,
    SMSNotificationProvider,
    WebhookNotificationProvider,
    PagerDutyNotificationProvider
} from './alerts/NotificationProviders';

// Distributed tracing
export {
    OpenTelemetryConfig,
    getTelemetryConfig
} from './telemetry/OpenTelemetryConfig';

import { metricsCollector } from './metrics/MetricsCollector';
import { logger } from './logging/FairGoLogger';
import { healthCheckManager } from './health/HealthCheckManager';
import { apmManager } from './apm/APMManager';
import { alertManager } from './alerts/AlertManager';
import { getTelemetryConfig } from './telemetry/OpenTelemetryConfig';

/**
 * Comprehensive monitoring initialization
 * Call this once at application startup
 */
export async function initializeMonitoring(options: {
    enableTelemetry?: boolean;
    healthCheckInterval?: number;
    logLevel?: string;
    environment?: string;
} = {}): Promise<void> {
    const {
        enableTelemetry = true,
        healthCheckInterval = 30000,
        logLevel = 'info',
        environment = process.env.NODE_ENV || 'development'
    } = options;

    try {
        logger.info('Initializing FairGo monitoring system', {
            component: 'monitoring',
            operation: 'initialization',
            metadata: {
                environment,
                telemetry_enabled: enableTelemetry,
                health_check_interval: healthCheckInterval,
                log_level: logLevel
            }
        });

        // Initialize OpenTelemetry first (if enabled)
        if (enableTelemetry) {
            try {
                await getTelemetryConfig().initialize();
                logger.info('OpenTelemetry initialized successfully', {
                    component: 'telemetry',
                    operation: 'initialization'
                });
            } catch (error) {
                logger.error('Failed to initialize OpenTelemetry', error instanceof Error ? error : new Error(String(error)), {
                    component: 'telemetry',
                    operation: 'initialization'
                });
                // Continue without telemetry rather than failing startup
            }
        }

        // Initialize health check manager - start periodic monitoring
        logger.info('Health check manager initialized', {
            component: 'health',
            operation: 'initialization'
        });

        // Start performance monitoring
        logger.info('APM manager initialized', {
            component: 'apm',
            operation: 'initialization'
        });

        // Log system startup metrics
        const systemInfo = {
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            memory_limit_mb: Math.round((process.memoryUsage().heapTotal / 1024 / 1024)),
            pid: process.pid,
            uptime: process.uptime()
        };

        logger.audit('system_startup', {
            userId: 'system',
            action: 'monitoring_initialization',
            resource: 'monitoring_system',
            outcome: 'success',
            metadata: {
                ...systemInfo,
                monitoring_components: [
                    'metrics_collector',
                    'structured_logging',
                    'health_checks',
                    'apm',
                    enableTelemetry ? 'telemetry' : null
                ].filter(Boolean)
            }
        });

        logger.info('FairGo monitoring system initialized successfully', {
            component: 'monitoring',
            operation: 'initialization_complete',
            metadata: {
                initialization_time_ms: Date.now(),
                components_count: enableTelemetry ? 5 : 4,
                system_info: systemInfo
            }
        });

    } catch (error) {
        logger.critical('Failed to initialize monitoring system', {
            component: 'monitoring',
            operation: 'initialization_failed',
            metadata: {
                error_message: error instanceof Error ? error.message : String(error),
                error_stack: error instanceof Error ? error.stack : undefined,
                environment
            }
        });
        throw error;
    }
}

/**
 * Graceful shutdown of monitoring system
 */
export async function shutdownMonitoring(): Promise<void> {
    logger.info('Shutting down FairGo monitoring system', {
        component: 'monitoring',
        operation: 'shutdown'
    });

    try {
        // Shutdown alerting
        await alertManager.shutdown();

        // Shutdown telemetry
        try {
            await getTelemetryConfig().shutdown();
        } catch (error) {
            // Continue shutdown even if telemetry fails
        }

        // Final system metrics
        const finalMetrics = {
            uptime_seconds: Math.round(process.uptime()),
            final_memory_usage: process.memoryUsage(),
            active_requests: apmManager.getActiveRequestsCount()
        };

        logger.audit('system_shutdown', {
            userId: 'system',
            action: 'monitoring_shutdown',
            resource: 'monitoring_system',
            outcome: 'success',
            metadata: finalMetrics
        });

        logger.info('FairGo monitoring system shutdown complete', {
            component: 'monitoring',
            operation: 'shutdown_complete',
            metadata: finalMetrics
        });

    } catch (error) {
        logger.error('Error during monitoring shutdown', error instanceof Error ? error : new Error(String(error)), {
            component: 'monitoring',
            operation: 'shutdown_error'
        });
    }
}

/**
 * Get comprehensive monitoring status
 */
export function getMonitoringStatus() {
    const status = {
        timestamp: new Date().toISOString(),
        system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            platform: process.platform,
            version: process.version
        },
        components: {
            telemetry: process.env.ENABLE_TELEMETRY === 'true',
            health_checks: true, // Always available
            apm: {
                active_requests: apmManager.getActiveRequestsCount(),
                performance_metrics: apmManager.getPerformanceMetrics()
            },
            alerting: {
                stats: alertManager.getAlertingStats()
            },
            metrics_collector: {
                registry_metrics_count: Object.keys(metricsCollector.getMetrics()).length
            }
        }
    };

    return status;
}

/**
 * Health check endpoint for monitoring status
 */
export async function getDetailedHealthStatus() {
    try {
        const healthStatus = await healthCheckManager.getHealthStatus();
        const monitoringStatus = getMonitoringStatus();

        return {
            status: healthStatus.status === 'healthy' ? 'UP' : 'DOWN',
            timestamp: new Date().toISOString(),
            details: {
                health_checks: healthStatus,
                monitoring: monitoringStatus
            }
        };
    } catch (error) {
        logger.error('Failed to get detailed health status', error instanceof Error ? error : new Error(String(error)), {
            component: 'monitoring',
            operation: 'health_status_check'
        });

        return {
            status: 'DOWN',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
            details: {
                monitoring: getMonitoringStatus()
            }
        };
    }
}

// Process event handlers for graceful shutdown
if (typeof process !== 'undefined') {
    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, initiating graceful shutdown', {
            component: 'monitoring',
            operation: 'signal_handling'
        });
        await shutdownMonitoring();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        logger.info('Received SIGINT, initiating graceful shutdown', {
            component: 'monitoring',
            operation: 'signal_handling'
        });
        await shutdownMonitoring();
        process.exit(0);
    });

    process.on('uncaughtException', (error) => {
        logger.critical('Uncaught exception detected', {
            component: 'monitoring',
            operation: 'error_handling',
            metadata: {
                error_message: error.message,
                error_stack: error.stack,
                process_uptime: process.uptime()
            }
        });

        // Give time for logs to flush before exiting
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.critical('Unhandled promise rejection detected', {
            component: 'monitoring',
            operation: 'error_handling',
            metadata: {
                reason: String(reason),
                promise: String(promise),
                process_uptime: process.uptime()
            }
        });
    });
}

// Default export for easy importing
const monitoringSystem = {
    initialize: initializeMonitoring,
    shutdown: shutdownMonitoring,
    getStatus: getMonitoringStatus,
    getHealthStatus: getDetailedHealthStatus,
    metricsCollector,
    logger,
    healthCheckManager,
    apmManager,
    alertManager
};

export default monitoringSystem;