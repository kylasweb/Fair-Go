/**
 * API Security and Performance Layer
 * Provides authentication, authorization, rate limiting, caching, and monitoring
 * for all external API integrations
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

export interface APIKey {
    id: string;
    name: string;
    key: string;
    hashedKey: string;
    permissions: string[];
    rateLimit: number;
    isActive: boolean;
    expiresAt?: Date;
    createdAt: Date;
    lastUsedAt?: Date;
    usage: {
        totalRequests: number;
        todayRequests: number;
        errorCount: number;
    };
}

export interface JWTPayload {
    userId: string;
    role: string;
    permissions: string[];
    apiKeyId?: string;
}

export interface RateLimitConfig {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
}

export interface CacheConfig {
    ttl: number; // Time to live in seconds
    maxSize: number; // Maximum cache size in MB
    keyPrefix: string;
}

export class APISecurityService {
    private prisma: PrismaClient;
    private redis: Redis;
    private logger!: winston.Logger;
    private jwtSecret: string;
    private rateLimitConfigs: Map<string, RateLimitConfig>;
    private cacheConfig: CacheConfig;

    constructor() {
        this.prisma = new PrismaClient();
        this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        this.rateLimitConfigs = new Map();

        this.cacheConfig = {
            ttl: 3600, // 1 hour
            maxSize: 100, // 100MB
            keyPrefix: 'fairgo:api:cache:'
        };

        this.setupLogger();
        this.setupRateLimitConfigs();
    }

    private setupLogger(): void {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'api-security' },
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({
                    filename: 'logs/api-security.log',
                    maxsize: 5242880,
                    maxFiles: 5
                })
            ]
        });
    }

    private setupRateLimitConfigs(): void {
        // Different rate limits for different endpoints
        this.rateLimitConfigs.set('default', {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // 100 requests per window
            message: 'Too many requests, please try again later',
            standardHeaders: true,
            legacyHeaders: false
        });

        this.rateLimitConfigs.set('auth', {
            windowMs: 15 * 60 * 1000,
            max: 5, // Stricter for auth endpoints
            message: 'Too many authentication attempts, please try again later',
            standardHeaders: true,
            legacyHeaders: false
        });

        this.rateLimitConfigs.set('booking', {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 10, // 10 bookings per minute
            message: 'Too many booking requests, please slow down',
            standardHeaders: true,
            legacyHeaders: false
        });

        this.rateLimitConfigs.set('payment', {
            windowMs: 5 * 60 * 1000, // 5 minutes
            max: 20, // 20 payment requests per 5 minutes
            message: 'Too many payment requests, please try again later',
            standardHeaders: true,
            legacyHeaders: false
        });
    }

    /**
     * Generate API Key
     */
    public async generateAPIKey(name: string, permissions: string[], rateLimit: number = 1000): Promise<APIKey> {
        const key = `fg_${crypto.randomBytes(20).toString('hex')}`;
        const hashedKey = await bcrypt.hash(key, 12);

        const apiKey: APIKey = {
            id: crypto.randomUUID(),
            name,
            key,
            hashedKey,
            permissions,
            rateLimit,
            isActive: true,
            createdAt: new Date(),
            usage: {
                totalRequests: 0,
                todayRequests: 0,
                errorCount: 0
            }
        };

        // Store in database (hashed version)
        await this.prisma.apiCredential.create({
            data: {
                id: apiKey.id,
                service: 'fairgo-api',
                keyName: name,
                encryptedValue: hashedKey,
                isActive: true,
                permissions: JSON.stringify(permissions),
                createdAt: apiKey.createdAt,
                updatedAt: apiKey.createdAt
            }
        });

        this.logger.info('API key generated', { keyId: apiKey.id, name, permissions });
        return apiKey;
    }

    /**
     * Validate API Key
     */
    public async validateAPIKey(apiKey: string): Promise<APIKey | null> {
        try {
            // Extract key ID from the key format
            if (!apiKey.startsWith('fg_')) {
                return null;
            }

            // Get all active API keys from database
            const apiKeys = await this.prisma.apiCredential.findMany({
                where: {
                    service: 'fairgo-api',
                    isActive: true
                }
            });

            // Check each key
            for (const dbKey of apiKeys) {
                const isValid = await bcrypt.compare(apiKey, dbKey.encryptedValue);
                if (isValid) {
                    // Update last used time
                    await this.prisma.apiCredential.update({
                        where: { id: dbKey.id },
                        data: { updatedAt: new Date() }
                    });

                    return {
                        id: dbKey.id,
                        name: dbKey.keyName,
                        key: apiKey,
                        hashedKey: dbKey.encryptedValue,
                        permissions: ['read', 'write'], // Would be stored in metadata
                        rateLimit: 1000, // Would be stored in metadata
                        isActive: dbKey.isActive,
                        createdAt: dbKey.createdAt,
                        usage: {
                            totalRequests: 0, // Would be fetched from usage tracking
                            todayRequests: 0,
                            errorCount: 0
                        }
                    };
                }
            }

            return null;
        } catch (error) {
            this.logger.error('API key validation error', { error });
            return null;
        }
    }

    /**
     * JWT Token Generation
     */
    public generateJWTToken(payload: JWTPayload, expiresIn: string = '24h'): string {
        if (!this.jwtSecret) {
            throw new Error('JWT secret is not configured');
        }
        try {
            const options: jwt.SignOptions = {
                expiresIn: expiresIn as any,
                issuer: 'fairgo-api',
                audience: 'fairgo-clients'
            };

            return jwt.sign(payload, this.jwtSecret, options);
        } catch (error) {
            throw new Error('Failed to generate JWT token');
        }
    }

    /**
     * JWT Token Validation
     */
    public validateJWTToken(token: string): JWTPayload | null {
        try {
            const decoded = jwt.verify(token, this.jwtSecret, {
                issuer: 'fairgo-api',
                audience: 'fairgo-clients'
            }) as JWTPayload;

            return decoded;
        } catch (error: any) {
            this.logger.warn('JWT validation failed', { error: error.message });
            return null;
        }
    }

    /**
     * API Key Authentication Middleware
     */
    public apiKeyAuth() {
        return async (req: Request, res: Response, next: NextFunction) => {
            const apiKey = req.headers['x-api-key'] as string;

            if (!apiKey) {
                return res.status(401).json({
                    error: 'API key required',
                    message: 'Please provide a valid API key in the x-api-key header'
                });
            }

            const validKey = await this.validateAPIKey(apiKey);
            if (!validKey) {
                return res.status(401).json({
                    error: 'Invalid API key',
                    message: 'The provided API key is invalid or expired'
                });
            }

            // Check if key has expired
            if (validKey.expiresAt && validKey.expiresAt < new Date()) {
                return res.status(401).json({
                    error: 'API key expired',
                    message: 'The provided API key has expired'
                });
            }

            // Attach key info to request
            req.apiKey = validKey;
            next();
        };
    }

    /**
     * JWT Authentication Middleware
     */
    public jwtAuth() {
        return (req: Request, res: Response, next: NextFunction) => {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

            if (!token) {
                return res.status(401).json({
                    error: 'Access token required',
                    message: 'Please provide a valid JWT token'
                });
            }

            const payload = this.validateJWTToken(token);
            if (!payload) {
                return res.status(401).json({
                    error: 'Invalid token',
                    message: 'The provided token is invalid or expired'
                });
            }

            req.user = payload;
            next();
        };
    }

    /**
     * Permission Check Middleware
     */
    public requirePermission(permission: string) {
        return (req: Request, res: Response, next: NextFunction) => {
            const userPermissions = req.user?.permissions || req.apiKey?.permissions || [];

            if (!userPermissions.includes(permission) && !userPermissions.includes('admin')) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: `This action requires the '${permission}' permission`
                });
            }

            next();
        };
    }

    /**
     * Rate Limiting Middleware
     */
    public createRateLimit(type: string = 'default') {
        const config = this.rateLimitConfigs.get(type) || this.rateLimitConfigs.get('default')!;

        return rateLimit({
            ...config,
            keyGenerator: (req) => {
                // Use API key or user ID for rate limiting
                return req.apiKey?.id || req.user?.userId || req.ip || 'unknown';
            },
            handler: (req, res) => {
                this.logger.warn('Rate limit exceeded', {
                    ip: req.ip,
                    apiKey: req.apiKey?.id,
                    userId: req.user?.userId,
                    endpoint: req.path
                });
                res.status(429).json({
                    error: 'Too many requests',
                    message: config.message,
                    retryAfter: Math.ceil(config.windowMs / 1000)
                });
            }
        });
    }

    /**
     * Response Caching Middleware
     */
    public cacheResponse(ttl: number = this.cacheConfig.ttl) {
        return async (req: Request, res: Response, next: NextFunction) => {
            // Only cache GET requests
            if (req.method !== 'GET') {
                return next();
            }

            const cacheKey = `${this.cacheConfig.keyPrefix}${req.originalUrl}`;

            try {
                const cachedResponse = await this.redis.get(cacheKey);

                if (cachedResponse) {
                    const data = JSON.parse(cachedResponse);
                    const ttl = await this.redis.ttl(cacheKey);
                    res.set('X-Cache', 'HIT');
                    res.set('X-Cache-TTL', ttl.toString());
                    return res.json(data);
                }

                // Store original json method
                const originalJson = res.json.bind(res);

                // Override json method to cache response
                res.json = (body: any) => {
                    res.set('X-Cache', 'MISS');

                    // Cache successful responses
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        this.redis.setex(cacheKey, ttl, JSON.stringify(body));
                    }

                    return originalJson(body);
                };

                next();
            } catch (error) {
                this.logger.error('Cache middleware error', { error });
                next();
            }
        };
    }

    /**
     * Request Validation Middleware
     */
    public validateRequest(schema: any) {
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                // Use Joi or similar validation library
                const { error } = schema.validate(req.body);

                if (error) {
                    return res.status(400).json({
                        error: 'Validation error',
                        message: error.details[0].message,
                        details: error.details
                    });
                }

                next();
            } catch (error) {
                this.logger.error('Request validation error', { error });
                res.status(500).json({
                    error: 'Internal server error',
                    message: 'Request validation failed'
                });
            }
        };
    }

    /**
     * Security Headers Middleware
     */
    public securityHeaders() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        });
    }

    /**
     * CORS Configuration
     */
    public corsConfig() {
        return cors({
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, etc.)
                if (!origin) return callback(null, true);

                // Define allowed origins
                const allowedOrigins = [
                    'http://localhost:3000',
                    'https://fairgo.com',
                    'https://admin.fairgo.com',
                    'https://api.fairgo.com'
                ];

                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
        });
    }

    /**
     * Request Logging Middleware
     */
    public requestLogger() {
        return (req: Request, res: Response, next: NextFunction) => {
            const startTime = Date.now();

            // Log request
            this.logger.info('API request', {
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                apiKey: req.apiKey?.id,
                userId: req.user?.userId,
                timestamp: new Date().toISOString()
            });

            // Log response
            const originalSend = res.send.bind(res);
            res.send = (body: any) => {
                const responseTime = Date.now() - startTime;

                this.logger.info('API response', {
                    method: req.method,
                    url: req.originalUrl,
                    statusCode: res.statusCode,
                    responseTime,
                    contentLength: Buffer.byteLength(body || ''),
                    timestamp: new Date().toISOString()
                });

                return originalSend(body);
            };

            next();
        };
    }

    /**
     * Error Handling Middleware
     */
    public errorHandler() {
        return (error: any, req: Request, res: Response, next: NextFunction) => {
            this.logger.error('API error', {
                error: error.message,
                stack: error.stack,
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                apiKey: req.apiKey?.id,
                userId: req.user?.userId
            });

            // Don't leak error details in production
            const isDevelopment = process.env.NODE_ENV === 'development';

            res.status(error.statusCode || 500).json({
                error: 'Internal server error',
                message: isDevelopment ? error.message : 'Something went wrong',
                ...(isDevelopment && { stack: error.stack })
            });
        };
    }

    /**
     * Usage Tracking
     */
    public async trackAPIUsage(apiKeyId: string, endpoint: string, success: boolean): Promise<void> {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const key = `usage:${apiKeyId}:${date}`;

        try {
            await this.redis.hincrby(key, 'total', 1);
            await this.redis.hincrby(key, endpoint, 1);
            if (!success) {
                await this.redis.hincrby(key, 'errors', 1);
            }

            // Set expiry to 30 days
            await this.redis.expire(key, 30 * 24 * 60 * 60);
        } catch (error) {
            this.logger.error('Usage tracking error', { error });
        }
    }

    /**
     * Get Usage Statistics
     */
    public async getUsageStats(apiKeyId: string, days: number = 7): Promise<Array<{ date: string;[key: string]: any }>> {
        const stats: Array<{ date: string;[key: string]: any }> = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const key = `usage:${apiKeyId}:${dateStr}`;

            const usage = await this.redis.hgetall(key);
            stats.push({
                date: dateStr,
                ...usage
            });
        }

        return stats;
    }

    /**
     * Cleanup expired cache entries
     */
    public async cleanupCache(): Promise<void> {
        try {
            const pattern = `${this.cacheConfig.keyPrefix}*`;
            const keys = await this.redis.keys(pattern);

            if (keys.length > 0) {
                // Remove expired keys
                const pipeline = this.redis.pipeline();
                keys.forEach(key => pipeline.del(key));
                await pipeline.exec();

                this.logger.info('Cache cleanup completed', { keysRemoved: keys.length });
            }
        } catch (error) {
            this.logger.error('Cache cleanup error', { error });
        }
    }

    /**
     * Health Check
     */
    public async healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        services: Record<string, boolean>;
        timestamp: string;
    }> {
        const services = {
            database: false,
            redis: false
        };

        try {
            // Test database connection
            await this.prisma.$queryRaw`SELECT 1`;
            services.database = true;
        } catch (error) {
            this.logger.error('Database health check failed', { error });
        }

        try {
            // Test Redis connection
            await this.redis.ping();
            services.redis = true;
        } catch (error) {
            this.logger.error('Redis health check failed', { error });
        }

        const isHealthy = Object.values(services).every(status => status);

        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            services,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Graceful shutdown
     */
    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down API Security Service');
        await this.redis.quit();
        await this.prisma.$disconnect();
    }
}

// Extend Express Request type
declare module 'express-serve-static-core' {
    interface Request {
        user?: JWTPayload;
        apiKey?: APIKey;
    }
}