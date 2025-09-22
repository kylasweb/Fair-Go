import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ecsFormat } from '@elastic/ecs-winston-format';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define custom log levels for FairGo platform
const customLevels = {
    levels: {
        emergency: 0,
        alert: 1,
        critical: 2,
        error: 3,
        warning: 4,
        notice: 5,
        info: 6,
        debug: 7,
        trace: 8
    },
    colors: {
        emergency: 'red',
        alert: 'red',
        critical: 'red',
        error: 'red',
        warning: 'yellow',
        notice: 'cyan',
        info: 'green',
        debug: 'blue',
        trace: 'gray'
    }
};

// Add colors to Winston
winston.addColors(customLevels.colors);

interface LogContext {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    bookingId?: string;
    driverId?: string;
    ipAddress?: string;
    userAgent?: string;
    component?: string;
    operation?: string;
    duration?: number;
    metadata?: Record<string, any>;
}

class FairGoLogger {
    private static instance: FairGoLogger;
    private logger!: winston.Logger;
    private auditLogger!: winston.Logger;
    private securityLogger!: winston.Logger;
    private performanceLogger!: winston.Logger;
    private aiLogger!: winston.Logger;

    constructor() {
        this.initializeLoggers();
    }

    public static getInstance(): FairGoLogger {
        if (!FairGoLogger.instance) {
            FairGoLogger.instance = new FairGoLogger();
        }
        return FairGoLogger.instance;
    }

    private initializeLoggers() {
        // Console format for development
        const consoleFormat = winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${timestamp} [${level}]: ${message} ${stack || ''} ${metaString}`;
            })
        );

        // File format using ECS (Elastic Common Schema)
        const fileFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            ecsFormat({
                serviceName: 'fairgo-platform',
                serviceVersion: process.env.APP_VERSION || '1.0.0',
                convertReqRes: true
            })
        );

        // Main application logger
        this.logger = winston.createLogger({
            levels: customLevels.levels,
            level: process.env.LOG_LEVEL || 'info',
            format: fileFormat,
            defaultMeta: {
                service: 'fairgo-main',
                environment: process.env.NODE_ENV || 'development',
                hostname: os.hostname(),
                pid: process.pid
            },
            transports: [
                // Application logs with rotation
                new DailyRotateFile({
                    filename: path.join(logsDir, 'application-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '100m',
                    maxFiles: '30d',
                    level: 'info',
                    zippedArchive: true
                }),

                // Error logs with rotation
                new DailyRotateFile({
                    filename: path.join(logsDir, 'error-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '100m',
                    maxFiles: '30d',
                    level: 'error',
                    zippedArchive: true
                }),

                // Debug logs (only in development)
                ...(process.env.NODE_ENV !== 'production' ? [
                    new DailyRotateFile({
                        filename: path.join(logsDir, 'debug-%DATE%.log'),
                        datePattern: 'YYYY-MM-DD',
                        maxSize: '50m',
                        maxFiles: '7d',
                        level: 'debug',
                        zippedArchive: true
                    })
                ] : [])
            ]
        });

        // Audit logger for compliance and security
        this.auditLogger = winston.createLogger({
            format: fileFormat,
            defaultMeta: {
                service: 'fairgo-audit',
                logType: 'audit'
            },
            transports: [
                new DailyRotateFile({
                    filename: path.join(logsDir, 'audit-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '200m',
                    maxFiles: '365d', // Keep audit logs for a year
                    zippedArchive: true
                })
            ]
        });

        // Security logger for security events
        this.securityLogger = winston.createLogger({
            format: fileFormat,
            defaultMeta: {
                service: 'fairgo-security',
                logType: 'security'
            },
            transports: [
                new DailyRotateFile({
                    filename: path.join(logsDir, 'security-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '100m',
                    maxFiles: '90d',
                    zippedArchive: true
                }),

                // Also log critical security events to console
                new winston.transports.Console({
                    level: 'critical',
                    format: consoleFormat
                })
            ]
        });

        // Performance logger for APM data
        this.performanceLogger = winston.createLogger({
            format: fileFormat,
            defaultMeta: {
                service: 'fairgo-performance',
                logType: 'performance'
            },
            transports: [
                new DailyRotateFile({
                    filename: path.join(logsDir, 'performance-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '50m',
                    maxFiles: '14d',
                    zippedArchive: true
                })
            ]
        });

        // AI/ML specific logger
        this.aiLogger = winston.createLogger({
            format: fileFormat,
            defaultMeta: {
                service: 'fairgo-ai',
                logType: 'ai-ml'
            },
            transports: [
                new DailyRotateFile({
                    filename: path.join(logsDir, 'ai-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '100m',
                    maxFiles: '30d',
                    zippedArchive: true
                })
            ]
        });

        // Add console transport for development
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: consoleFormat
            }));
        }

        // Handle uncaught exceptions and unhandled rejections
        this.logger.exceptions.handle(
            new DailyRotateFile({
                filename: path.join(logsDir, 'exceptions-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '30d',
                zippedArchive: true
            })
        );

        this.logger.rejections.handle(
            new DailyRotateFile({
                filename: path.join(logsDir, 'rejections-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '30d',
                zippedArchive: true
            })
        );
    }

    // Main logging methods with context
    public emergency(message: string, context?: LogContext) {
        this.logger.log('emergency', message, this.formatContext(context));
    }

    public alert(message: string, context?: LogContext) {
        this.logger.log('alert', message, this.formatContext(context));
    }

    public critical(message: string, context?: LogContext) {
        this.logger.log('critical', message, this.formatContext(context));
    }

    public error(message: string, error?: Error, context?: LogContext) {
        this.logger.error(message, {
            ...this.formatContext(context),
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : undefined
        });
    }

    public warning(message: string, context?: LogContext) {
        this.logger.log('warning', message, this.formatContext(context));
    }

    public notice(message: string, context?: LogContext) {
        this.logger.log('notice', message, this.formatContext(context));
    }

    public info(message: string, context?: LogContext) {
        this.logger.info(message, this.formatContext(context));
    }

    public debug(message: string, context?: LogContext) {
        this.logger.debug(message, this.formatContext(context));
    }

    public trace(message: string, context?: LogContext) {
        this.logger.log('trace', message, this.formatContext(context));
    }

    // Audit logging for compliance
    public audit(event: string, details: {
        userId?: string;
        action: string;
        resource: string;
        outcome: 'success' | 'failure';
        reason?: string;
        ipAddress?: string;
        userAgent?: string;
        sensitive?: boolean;
        metadata?: Record<string, any>;
    }) {
        this.auditLogger.info('audit_event', {
            event,
            user: { id: details.userId },
            action: details.action,
            resource: details.resource,
            outcome: details.outcome,
            reason: details.reason,
            client: {
                ip: details.ipAddress,
                user_agent: details.userAgent
            },
            labels: {
                sensitive: details.sensitive || false
            },
            metadata: details.metadata
        });
    }

    // Security logging
    public security(event: 'auth_failure' | 'suspicious_activity' | 'data_breach' | 'privilege_escalation' | 'injection_attempt', details: {
        severity: 'low' | 'medium' | 'high' | 'critical';
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
        description: string;
        indicators?: string[];
        metadata?: Record<string, any>;
    }) {
        const level = details.severity === 'critical' ? 'critical' :
            details.severity === 'high' ? 'error' :
                details.severity === 'medium' ? 'warning' : 'info';

        this.securityLogger.log(level, `security_event:${event}`, {
            event,
            severity: details.severity,
            user: { id: details.userId },
            client: {
                ip: details.ipAddress,
                user_agent: details.userAgent
            },
            description: details.description,
            indicators: details.indicators,
            metadata: details.metadata
        });
    }

    // Performance logging
    public performance(operation: string, details: {
        duration: number;
        userId?: string;
        component: string;
        success: boolean;
        metadata?: Record<string, any>;
    }) {
        this.performanceLogger.info('performance_metric', {
            operation,
            duration: details.duration,
            user: { id: details.userId },
            component: details.component,
            success: details.success,
            labels: {
                slow_query: details.duration > 5000, // Flag slow operations
                performance_issue: details.duration > 10000
            },
            metadata: details.metadata
        });
    }

    // AI/ML specific logging
    public ai(event: 'model_inference' | 'training_start' | 'training_complete' | 'model_drift' | 'accuracy_drop', details: {
        modelType: string;
        language?: string;
        accuracy?: number;
        latency?: number;
        inputType?: string;
        outputType?: string;
        confidence?: number;
        metadata?: Record<string, any>;
    }) {
        this.aiLogger.info(`ai_event:${event}`, {
            event,
            model: {
                type: details.modelType,
                language: details.language
            },
            performance: {
                accuracy: details.accuracy,
                latency: details.latency,
                confidence: details.confidence
            },
            input_type: details.inputType,
            output_type: details.outputType,
            metadata: details.metadata
        });
    }

    // Business event logging
    public business(event: 'booking_created' | 'booking_completed' | 'booking_cancelled' | 'driver_assigned' | 'payment_processed', details: {
        bookingId?: string;
        userId?: string;
        driverId?: string;
        amount?: number;
        currency?: string;
        vehicleType?: string;
        language?: string;
        source?: string;
        metadata?: Record<string, any>;
    }) {
        this.logger.info(`business_event:${event}`, {
            event,
            booking: { id: details.bookingId },
            user: { id: details.userId },
            driver: { id: details.driverId },
            payment: {
                amount: details.amount,
                currency: details.currency
            },
            vehicle_type: details.vehicleType,
            language: details.language,
            source: details.source,
            metadata: details.metadata
        });
    }

    // HTTP request logging
    public http(method: string, url: string, statusCode: number, duration: number, context?: LogContext & {
        requestSize?: number;
        responseSize?: number;
        referrer?: string;
    }) {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warning' : 'info';

        this.logger.log(level, 'http_request', {
            http: {
                request: {
                    method,
                    url,
                    referrer: context?.referrer,
                    bytes: context?.requestSize
                },
                response: {
                    status_code: statusCode,
                    bytes: context?.responseSize
                }
            },
            user: { id: context?.userId },
            session: { id: context?.sessionId },
            client: {
                ip: context?.ipAddress,
                user_agent: context?.userAgent
            },
            duration,
            component: context?.component,
            operation: context?.operation,
            metadata: context?.metadata
        });
    }

    private formatContext(context?: LogContext): Record<string, any> {
        if (!context) return {};

        return {
            user: context.userId ? { id: context.userId } : undefined,
            session: context.sessionId ? { id: context.sessionId } : undefined,
            request: context.requestId ? { id: context.requestId } : undefined,
            booking: context.bookingId ? { id: context.bookingId } : undefined,
            driver: context.driverId ? { id: context.driverId } : undefined,
            client: {
                ip: context.ipAddress,
                user_agent: context.userAgent
            },
            component: context.component,
            operation: context.operation,
            duration: context.duration,
            metadata: context.metadata
        };
    }

    // Get logger instance for advanced usage
    public getLogger(): winston.Logger {
        return this.logger;
    }

    public getAuditLogger(): winston.Logger {
        return this.auditLogger;
    }

    public getSecurityLogger(): winston.Logger {
        return this.securityLogger;
    }

    public getPerformanceLogger(): winston.Logger {
        return this.performanceLogger;
    }

    public getAILogger(): winston.Logger {
        return this.aiLogger;
    }
}

export const logger = FairGoLogger.getInstance();
export default FairGoLogger;