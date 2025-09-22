/**
 * API Middleware Integration
 * Combines all security and performance middleware for easy application setup
 */

import express, { Application } from 'express';
import { APISecurityService } from '../services/APISecurityService';
import Joi from 'joi';

// Validation Schemas
export const ValidationSchemas = {
    // User registration/login
    userAuth: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        phone: Joi.string().pattern(/^[+]?[1-9][\d]{9,15}$/).optional(),
        name: Joi.string().min(2).max(50).optional()
    }),

    // Booking creation
    bookingCreate: Joi.object({
        pickupLocation: Joi.object({
            latitude: Joi.number().min(-90).max(90).required(),
            longitude: Joi.number().min(-180).max(180).required(),
            address: Joi.string().required()
        }).required(),
        dropoffLocation: Joi.object({
            latitude: Joi.number().min(-90).max(90).required(),
            longitude: Joi.number().min(-180).max(180).required(),
            address: Joi.string().required()
        }).required(),
        vehicleType: Joi.string().valid('HATCHBACK', 'SEDAN', 'SUV', 'AUTO', 'BIKE').required(),
        scheduledAt: Joi.date().min('now').optional(),
        notes: Joi.string().max(200).optional()
    }),

    // Driver registration
    driverRegister: Joi.object({
        licenseNumber: Joi.string().alphanum().min(5).max(20).required(),
        vehicleNumber: Joi.string().alphanum().min(5).max(15).required(),
        vehicleType: Joi.string().valid('HATCHBACK', 'SEDAN', 'SUV', 'AUTO', 'BIKE').required(),
        vehicleModel: Joi.string().min(2).max(50).required(),
        rcNumber: Joi.string().alphanum().min(5).max(20).required(),
        insuranceNumber: Joi.string().alphanum().min(5).max(30).required(),
        documents: Joi.object({
            license: Joi.string().uri().required(),
            rc: Joi.string().uri().required(),
            insurance: Joi.string().uri().required(),
            photo: Joi.string().uri().required()
        }).required()
    }),

    // Payment processing
    paymentCreate: Joi.object({
        amount: Joi.number().positive().precision(2).required(),
        currency: Joi.string().length(3).uppercase().default('INR'),
        paymentMethod: Joi.string().valid('CARD', 'UPI', 'WALLET', 'CASH').required(),
        bookingId: Joi.string().required()
    }),

    // API key generation
    apiKeyGenerate: Joi.object({
        name: Joi.string().min(3).max(50).required(),
        permissions: Joi.array().items(Joi.string()).min(1).required(),
        rateLimit: Joi.number().integer().min(100).max(10000).default(1000),
        expiresInDays: Joi.number().integer().min(1).max(365).optional()
    }),

    // Voice booking
    voiceBooking: Joi.object({
        audioData: Joi.string().required(), // Base64 encoded audio
        sessionId: Joi.string().required(),
        language: Joi.string().valid('en', 'hi', 'ta', 'te', 'ml').default('en')
    }),

    // Admin agent configuration
    agentConfig: Joi.object({
        name: Joi.string().min(3).max(50).required(),
        description: Joi.string().max(200).optional(),
        systemPrompt: Joi.string().min(10).max(2000).required(),
        model: Joi.string().valid('gpt-4', 'gpt-3.5-turbo').default('gpt-4'),
        temperature: Joi.number().min(0).max(2).default(0.7),
        maxTokens: Joi.number().integer().min(100).max(4000).default(1000),
        functions: Joi.array().items(Joi.string()).optional(),
        isActive: Joi.boolean().default(true),
        voiceSettings: Joi.object({
            voice: Joi.string().default('en-US-Neural2-F'),
            speed: Joi.number().min(0.5).max(2).default(1),
            pitch: Joi.number().min(-20).max(20).default(0)
        }).optional()
    })
};

export class APIMiddlewareSetup {
    private securityService: APISecurityService;

    constructor() {
        this.securityService = new APISecurityService();
    }

    /**
     * Apply all security middleware to Express app
     */
    public applySecurityMiddleware(app: Application): void {
        // Security headers
        app.use(this.securityService.securityHeaders());

        // CORS configuration
        app.use(this.securityService.corsConfig());

        // Request logging
        app.use(this.securityService.requestLogger());

        // Parse JSON bodies
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    }

    /**
     * Apply authentication middleware for protected routes
     */
    public applyAuthMiddleware(app: Application): void {
        // Public health check endpoint
        app.get('/api/health', async (req, res) => {
            const health = await this.securityService.healthCheck();
            res.status(health.status === 'healthy' ? 200 : 503).json(health);
        });

        // API key authentication for external integrations
        app.use('/api/external', this.securityService.apiKeyAuth());

        // JWT authentication for user-facing APIs
        app.use('/api/user', this.securityService.jwtAuth());
        app.use('/api/driver', this.securityService.jwtAuth());
        app.use('/api/booking', this.securityService.jwtAuth());

        // Admin routes require both JWT and admin permission
        app.use('/api/admin',
            this.securityService.jwtAuth(),
            this.securityService.requirePermission('admin')
        );
    }

    /**
     * Apply rate limiting to different route groups
     */
    public applyRateLimiting(app: Application): void {
        // Authentication endpoints - strict limits
        app.use('/api/auth', this.securityService.createRateLimit('auth'));

        // Booking endpoints - moderate limits
        app.use('/api/booking', this.securityService.createRateLimit('booking'));

        // Payment endpoints - moderate limits
        app.use('/api/payment', this.securityService.createRateLimit('payment'));

        // Default rate limit for all other endpoints
        app.use('/api', this.securityService.createRateLimit('default'));
    }

    /**
     * Apply response caching for appropriate endpoints
     */
    public applyCaching(app: Application): void {
        // Cache static data for 1 hour
        app.use('/api/locations', this.securityService.cacheResponse(3600));
        app.use('/api/vehicle-types', this.securityService.cacheResponse(3600));
        app.use('/api/fare-estimates', this.securityService.cacheResponse(300)); // 5 minutes

        // Cache user profile data for 15 minutes
        app.use('/api/user/profile', this.securityService.cacheResponse(900));
    }

    /**
     * Apply validation middleware for specific routes
     */
    public applyValidation(app: Application): void {
        // Auth routes
        app.use('/api/auth/signup', this.securityService.validateRequest(ValidationSchemas.userAuth));
        app.use('/api/auth/signin', this.securityService.validateRequest(
            ValidationSchemas.userAuth.keys({
                name: Joi.forbidden(),
                phone: Joi.forbidden()
            })
        ));

        // Booking routes
        app.use('/api/booking/create', this.securityService.validateRequest(ValidationSchemas.bookingCreate));

        // Driver routes
        app.use('/api/driver/register', this.securityService.validateRequest(ValidationSchemas.driverRegister));

        // Payment routes
        app.use('/api/payment/create', this.securityService.validateRequest(ValidationSchemas.paymentCreate));

        // Voice booking routes
        app.use('/api/voice/booking', this.securityService.validateRequest(ValidationSchemas.voiceBooking));

        // Admin routes
        app.use('/api/admin/agent/create', this.securityService.validateRequest(ValidationSchemas.agentConfig));
        app.use('/api/admin/api-key/generate', this.securityService.validateRequest(ValidationSchemas.apiKeyGenerate));
    }

    /**
     * Apply error handling middleware (should be last)
     */
    public applyErrorHandling(app: Application): void {
        app.use(this.securityService.errorHandler());
    }

    /**
     * Complete setup - apply all middleware in correct order
     */
    public setupAll(app: Application): void {
        console.log('Setting up API middleware...');

        // 1. Security headers and CORS (first)
        this.applySecurityMiddleware(app);

        // 2. Rate limiting
        this.applyRateLimiting(app);

        // 3. Authentication and authorization
        this.applyAuthMiddleware(app);

        // 4. Response caching
        this.applyCaching(app);

        // 5. Request validation
        this.applyValidation(app);

        // 6. Error handling (last)
        this.applyErrorHandling(app);

        console.log('API middleware setup complete!');
    }

    /**
     * Get security service instance for manual operations
     */
    public getSecurityService(): APISecurityService {
        return this.securityService;
    }
}

// Export singleton instance
export const apiMiddleware = new APIMiddlewareSetup();

// Export individual validation schemas for use in route handlers
export { ValidationSchemas as Schemas };

// Helper function to create custom validation middleware
export function validateSchema(schema: Joi.ObjectSchema) {
    return (req: any, res: any, next: any) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                message: error.details[0].message,
                details: error.details
            });
        }
        next();
    };
}