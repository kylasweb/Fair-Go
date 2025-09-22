/**
 * FairGo Platform Monitoring Initialization
 * This file initializes the comprehensive monitoring system for the FairGo platform
 * Should be imported early in the application lifecycle
 */

import monitoring, { initializeMonitoring } from '@/monitoring';
import { logger } from '@/monitoring';

// Environment configuration
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const ENABLE_TELEMETRY = process.env.ENABLE_TELEMETRY !== 'false';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const HEALTH_CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000');

let monitoringInitialized = false;

export async function initializeFairGoMonitoring(): Promise<void> {
    if (monitoringInitialized) {
        return;
    }

    try {
        await initializeMonitoring({
            enableTelemetry: ENABLE_TELEMETRY,
            healthCheckInterval: HEALTH_CHECK_INTERVAL,
            logLevel: LOG_LEVEL,
            environment: ENVIRONMENT
        });

        monitoringInitialized = true;

        logger.info('FairGo monitoring system startup completed', {
            component: 'app',
            operation: 'monitoring_init',
            metadata: {
                environment: ENVIRONMENT,
                telemetry_enabled: ENABLE_TELEMETRY,
                log_level: LOG_LEVEL,
                health_check_interval: HEALTH_CHECK_INTERVAL,
                process_id: process.pid,
                node_version: process.version
            }
        });

    } catch (error) {
        console.error('Failed to initialize FairGo monitoring:', error);

        // Log the error using basic console since monitoring may not be working
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: 'Failed to initialize FairGo monitoring system',
            component: 'app',
            operation: 'monitoring_init_failed',
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack
            } : String(error),
            metadata: {
                environment: ENVIRONMENT,
                process_id: process.pid,
                node_version: process.version
            }
        }));

        // Re-throw to prevent application startup with broken monitoring
        throw error;
    }
}

export function isMonitoringInitialized(): boolean {
    return monitoringInitialized;
}

export { monitoring, logger };

// Auto-initialize in server environments
if (typeof window === 'undefined' && process.env.AUTO_INIT_MONITORING !== 'false') {
    // Initialize asynchronously to avoid blocking module loading
    setImmediate(async () => {
        try {
            await initializeFairGoMonitoring();
        } catch (error) {
            console.error('Auto-initialization of monitoring failed:', error);

            // In development, we might want to continue without monitoring
            if (ENVIRONMENT === 'development') {
                console.warn('Continuing without monitoring in development mode');
            } else {
                // In production, we should fail fast
                process.exit(1);
            }
        }
    });
}