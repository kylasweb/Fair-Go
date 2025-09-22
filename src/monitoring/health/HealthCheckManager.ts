import { PrismaClient } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../logging/FairGoLogger';
import { metricsCollector } from '../metrics/MetricsCollector';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    version: string;
    uptime: number;
    checks: Record<string, HealthCheck>;
    summary: {
        healthy: number;
        unhealthy: number;
        degraded: number;
        total: number;
    };
}

export interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime: number;
    message: string;
    details?: Record<string, any>;
    lastChecked: string;
    error?: string;
}

export interface HealthCheckConfig {
    timeout: number;
    retries: number;
    interval: number;
}

class HealthCheckManager {
    private static instance: HealthCheckManager;
    private prisma?: PrismaClient;
    private redis?: RedisClientType;
    private lastHealthStatus?: HealthStatus;
    private healthCheckInterval?: NodeJS.Timeout;
    private readonly config: HealthCheckConfig;

    constructor() {
        this.config = {
            timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),
            retries: parseInt(process.env.HEALTH_CHECK_RETRIES || '3'),
            interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000')
        };

        this.initializeHealthChecks();
    }

    public static getInstance(): HealthCheckManager {
        if (!HealthCheckManager.instance) {
            HealthCheckManager.instance = new HealthCheckManager();
        }
        return HealthCheckManager.instance;
    }

    private initializeHealthChecks() {
        // Initialize Prisma client for health checks
        try {
            this.prisma = new PrismaClient({
                log: ['warn', 'error'],
            });
        } catch (error) {
            logger.error('Failed to initialize Prisma for health checks', error as Error);
        }

        // Initialize Redis client for health checks
        try {
            this.redis = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    connectTimeout: this.config.timeout
                }
            });

            this.redis.on('error', (err) => {
                logger.error('Redis health check client error', err);
            });
        } catch (error) {
            logger.error('Failed to initialize Redis for health checks', error as Error);
        }

        // Start periodic health checks
        this.startPeriodicHealthChecks();
    }

    private startPeriodicHealthChecks() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                const status = await this.getHealthStatus();
                this.lastHealthStatus = status;

                // Update system health metrics
                metricsCollector.updateSystemHealth();

                // Log health status changes
                if (status.status !== 'healthy') {
                    logger.warning('System health degraded', {
                        component: 'health-check',
                        metadata: { status: status.status, checks: status.checks }
                    });
                }

                // Update health metrics
                Object.entries(status.checks).forEach(([service, check]) => {
                    const isHealthy = check.status === 'healthy' ? 1 : 0;
                    metricsCollector.databaseConnections.set(
                        { database_type: service, status: check.status },
                        isHealthy
                    );
                });

            } catch (error) {
                logger.error('Failed to run periodic health check', error as Error);
            }
        }, this.config.interval);
    }

    public async getHealthStatus(): Promise<HealthStatus> {
        const startTime = Date.now();
        const checks: Record<string, HealthCheck> = {};

        // Run all health checks in parallel
        const healthCheckPromises = [
            this.checkDatabase(),
            this.checkRedis(),
            this.checkAIService(),
            this.checkIVRService(),
            this.checkFileSystem(),
            this.checkMemory(),
            this.checkExternalAPIs()
        ];

        const results = await Promise.allSettled(healthCheckPromises);

        // Process results
        checks['database'] = results[0].status === 'fulfilled' ? results[0].value : this.createFailedCheck('Database check failed');
        checks['redis'] = results[1].status === 'fulfilled' ? results[1].value : this.createFailedCheck('Redis check failed');
        checks['ai-service'] = results[2].status === 'fulfilled' ? results[2].value : this.createFailedCheck('AI service check failed');
        checks['ivr-service'] = results[3].status === 'fulfilled' ? results[3].value : this.createFailedCheck('IVR service check failed');
        checks['filesystem'] = results[4].status === 'fulfilled' ? results[4].value : this.createFailedCheck('Filesystem check failed');
        checks['memory'] = results[5].status === 'fulfilled' ? results[5].value : this.createFailedCheck('Memory check failed');
        checks['external-apis'] = results[6].status === 'fulfilled' ? results[6].value : this.createFailedCheck('External APIs check failed');

        // Calculate summary
        const summary = this.calculateSummary(checks);

        // Determine overall status
        const overallStatus = summary.unhealthy > 0 ? 'unhealthy' :
            summary.degraded > 0 ? 'degraded' : 'healthy';

        const healthStatus: HealthStatus = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env.APP_VERSION || '1.0.0',
            uptime: process.uptime(),
            checks,
            summary
        };

        // Log health check completion
        logger.info('Health check completed', {
            component: 'health-check',
            duration: Date.now() - startTime,
            metadata: {
                status: overallStatus,
                summary,
                checks_count: Object.keys(checks).length
            }
        });

        return healthStatus;
    }

    private async checkDatabase(): Promise<HealthCheck> {
        const startTime = Date.now();

        try {
            if (!this.prisma) {
                throw new Error('Prisma client not initialized');
            }

            // Test database connectivity with a simple query
            await Promise.race([
                this.prisma.$queryRaw`SELECT 1 as health_check`,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Database timeout')), this.config.timeout)
                )
            ]);

            // Get database connection info
            // Use PostgreSQL-compatible query to get connection information
            const connectionInfo = await this.prisma.$queryRaw`
                SELECT 
                    current_database() as database_name,
                    current_user as user_name,
                    version() as version
            ` as any[];

            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime,
                message: 'Database connection successful',
                lastChecked: new Date().toISOString(),
                details: {
                    connections: 1, // PostgreSQL connection is active if query succeeds
                    database_type: 'postgresql',
                    database_name: connectionInfo?.[0]?.database_name,
                    user: connectionInfo?.[0]?.user_name
                }
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Database health check failed', error as Error);

            return {
                status: 'unhealthy',
                responseTime,
                message: 'Database connection failed',
                lastChecked: new Date().toISOString(),
                error: (error as Error).message
            };
        }
    }

    private async checkRedis(): Promise<HealthCheck> {
        const startTime = Date.now();

        try {
            if (!this.redis) {
                throw new Error('Redis client not initialized');
            }

            // Check if Redis is connected
            if (!this.redis.isOpen) {
                await this.redis.connect();
            }

            // Test Redis with PING command
            const pingResult = await Promise.race([
                this.redis.ping(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Redis timeout')), this.config.timeout)
                )
            ]);

            // Get Redis info
            const info = await this.redis.info('memory');
            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime,
                message: 'Redis connection successful',
                lastChecked: new Date().toISOString(),
                details: {
                    ping_result: pingResult,
                    memory_info: this.parseRedisInfo(info)
                }
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Redis health check failed', error as Error);

            return {
                status: 'unhealthy',
                responseTime,
                message: 'Redis connection failed',
                lastChecked: new Date().toISOString(),
                error: (error as Error).message
            };
        }
    }

    private async checkAIService(): Promise<HealthCheck> {
        const startTime = Date.now();

        try {
            // Check if AI service configuration exists
            const configExists = process.env.Z_AI_CONFIG || fs.existsSync('.z-ai-config');

            if (!configExists) {
                return {
                    status: 'degraded',
                    responseTime: Date.now() - startTime,
                    message: 'AI service configuration not found',
                    lastChecked: new Date().toISOString(),
                    details: { config_status: 'missing' }
                };
            }

            // Test AI service health endpoint (if available)
            // This would be implemented based on your AI service API
            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime,
                message: 'AI service configuration available',
                lastChecked: new Date().toISOString(),
                details: {
                    config_status: 'available',
                    sdk_version: 'z-ai-web-dev-sdk@0.0.10'
                }
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('AI service health check failed', error as Error);

            return {
                status: 'unhealthy',
                responseTime,
                message: 'AI service check failed',
                lastChecked: new Date().toISOString(),
                error: (error as Error).message
            };
        }
    }

    private async checkIVRService(): Promise<HealthCheck> {
        const startTime = Date.now();

        try {
            const ivrServiceUrl = process.env.IVR_SERVICE_URL || 'http://localhost:8080';

            // Check if IVR service is running on the expected port
            // This is a basic check - in production you'd hit a health endpoint
            const response = await fetch(`${ivrServiceUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(this.config.timeout)
            }).catch(() => null);

            const responseTime = Date.now() - startTime;

            if (response && response.ok) {
                return {
                    status: 'healthy',
                    responseTime,
                    message: 'IVR service is responsive',
                    lastChecked: new Date().toISOString(),
                    details: {
                        service_url: ivrServiceUrl,
                        status_code: response.status
                    }
                };
            } else {
                return {
                    status: 'degraded',
                    responseTime,
                    message: 'IVR service not responding',
                    lastChecked: new Date().toISOString(),
                    details: {
                        service_url: ivrServiceUrl,
                        status_code: response?.status || 'no_response'
                    }
                };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;

            return {
                status: 'degraded',
                responseTime,
                message: 'IVR service health check failed',
                lastChecked: new Date().toISOString(),
                error: (error as Error).message
            };
        }
    }

    private async checkFileSystem(): Promise<HealthCheck> {
        const startTime = Date.now();

        try {
            const fsPromises = fs.promises;
            // const os = os; // already imported

            // Check disk space (simplified approach)
            // Note: fs.stat doesn't provide disk space info in Node.js
            const freeSpace = 1000000000; // Placeholder - 1GB
            const totalSpace = 2000000000; // Placeholder - 2GB 
            const usedPercent = ((totalSpace - freeSpace) / totalSpace) * 100;

            // Check temp directory write access
            const tempFile = path.join(os.tmpdir(), `health-check-${Date.now()}`);
            await fsPromises.writeFile(tempFile, 'health check');
            await fsPromises.unlink(tempFile);

            const responseTime = Date.now() - startTime;
            const status = usedPercent > 90 ? 'degraded' : 'healthy';

            return {
                status,
                responseTime,
                message: status === 'healthy' ? 'Filesystem accessible' : 'Disk space low',
                lastChecked: new Date().toISOString(),
                details: {
                    disk_usage_percent: Math.round(usedPercent),
                    free_space_gb: Math.round(freeSpace / 1024 / 1024 / 1024),
                    total_space_gb: Math.round(totalSpace / 1024 / 1024 / 1024)
                }
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;

            return {
                status: 'unhealthy',
                responseTime,
                message: 'Filesystem check failed',
                lastChecked: new Date().toISOString(),
                error: (error as Error).message
            };
        }
    }

    private async checkMemory(): Promise<HealthCheck> {
        const startTime = Date.now();

        try {
            const memUsage = process.memoryUsage();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();

            const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
            const systemMemoryUsedPercent = ((totalMemory - freeMemory) / totalMemory) * 100;

            const responseTime = Date.now() - startTime;
            const status = heapUsedPercent > 90 || systemMemoryUsedPercent > 95 ? 'degraded' : 'healthy';

            return {
                status,
                responseTime,
                message: status === 'healthy' ? 'Memory usage normal' : 'High memory usage detected',
                lastChecked: new Date().toISOString(),
                details: {
                    heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
                    heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
                    heap_used_percent: Math.round(heapUsedPercent),
                    system_memory_used_percent: Math.round(systemMemoryUsedPercent),
                    rss_mb: Math.round(memUsage.rss / 1024 / 1024)
                }
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;

            return {
                status: 'unhealthy',
                responseTime,
                message: 'Memory check failed',
                lastChecked: new Date().toISOString(),
                error: (error as Error).message
            };
        }
    }

    private async checkExternalAPIs(): Promise<HealthCheck> {
        const startTime = Date.now();

        try {
            // Check critical external APIs (customize based on your needs)
            const externalChecks: Promise<boolean>[] = [];

            // Example: Check Twilio API if configured
            if (process.env.TWILIO_ACCOUNT_SID) {
                externalChecks.push(this.checkTwilioAPI());
            }

            // Example: Check payment gateway if configured
            if (process.env.PAYMENT_GATEWAY_URL) {
                externalChecks.push(this.checkPaymentGateway());
            }

            if (externalChecks.length === 0) {
                return {
                    status: 'healthy',
                    responseTime: Date.now() - startTime,
                    message: 'No external APIs configured',
                    lastChecked: new Date().toISOString(),
                    details: { configured_apis: 0 }
                };
            }

            const results = await Promise.allSettled(externalChecks);
            const failures = results.filter(r => r.status === 'rejected').length;
            const responseTime = Date.now() - startTime;

            const status = failures === 0 ? 'healthy' :
                failures < results.length ? 'degraded' : 'unhealthy';

            return {
                status,
                responseTime,
                message: `${results.length - failures}/${results.length} external APIs healthy`,
                lastChecked: new Date().toISOString(),
                details: {
                    total_apis: results.length,
                    healthy_apis: results.length - failures,
                    failed_apis: failures
                }
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;

            return {
                status: 'unhealthy',
                responseTime,
                message: 'External APIs check failed',
                lastChecked: new Date().toISOString(),
                error: (error as Error).message
            };
        }
    }

    private async checkTwilioAPI(): Promise<boolean> {
        // Implement Twilio API health check
        return true; // Placeholder
    }

    private async checkPaymentGateway(): Promise<boolean> {
        // Implement payment gateway health check
        return true; // Placeholder
    }

    private createFailedCheck(message: string): HealthCheck {
        return {
            status: 'unhealthy',
            responseTime: 0,
            message,
            lastChecked: new Date().toISOString(),
            error: 'Health check failed to execute'
        };
    }

    private calculateSummary(checks: Record<string, HealthCheck>) {
        const summary = { healthy: 0, unhealthy: 0, degraded: 0, total: 0 };

        Object.values(checks).forEach(check => {
            summary.total++;
            summary[check.status]++;
        });

        return summary;
    }

    private parseRedisInfo(info: string): Record<string, string> {
        const parsed: Record<string, string> = {};
        info.split('\r\n').forEach(line => {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                parsed[key] = value;
            }
        });
        return parsed;
    }

    // Get cached health status (faster response)
    public getCachedHealthStatus(): HealthStatus | null {
        return this.lastHealthStatus || null;
    }

    // Cleanup method
    public cleanup() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        if (this.redis && this.redis.isOpen) {
            this.redis.disconnect();
        }

        if (this.prisma) {
            this.prisma.$disconnect();
        }
    }
}

export const healthCheckManager = HealthCheckManager.getInstance();
export default HealthCheckManager;