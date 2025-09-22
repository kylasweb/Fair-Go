// Security Configuration and Middleware for FairGo Platform
import { NextRequest, NextResponse } from 'next/server';
import helmet from 'helmet';
import cors from 'cors';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

// XSS import with type declaration
const xss = require('xss');

// Rate limiting configurations (basic implementation for Next.js)
export const rateLimitConfigs = {
    // General API rate limiting
    general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
            error: 'Too many requests from this IP, please try again later.',
            code: 'RATE_LIMITED',
        },
    },

    // Authentication endpoints rate limiting
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 login attempts per windowMs
        message: {
            error: 'Too many authentication attempts, please try again later.',
            code: 'AUTH_RATE_LIMITED',
            retryAfter: '15m'
        },
        skipSuccessfulRequests: true,
    },

    // Booking creation rate limiting
    booking: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 10, // limit each IP to 10 booking requests per 5 minutes
        message: {
            error: 'Too many booking requests, please wait before creating another booking.',
            code: 'BOOKING_RATE_LIMITED',
            retryAfter: '5m'
        },
    },

    // Location update rate limiting (for drivers)
    location: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 60, // allow 60 location updates per minute
        message: {
            error: 'Location update rate exceeded.',
            code: 'LOCATION_RATE_LIMITED',
            retryAfter: '1m'
        },
    },
};

// Helmet security configuration
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
            connectSrc: [
                "'self'",
                "https://api.razorpay.com",
                "https://maps.googleapis.com",
                "wss:",
                "ws:"
            ],
            frameSrc: ["'self'", "https://api.razorpay.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// CORS configuration
export const corsConfig = cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://fairgo.com',
            'https://www.fairgo.com',
            'https://app.fairgo.com',
        ];

        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// Input validation schemas
export const validationSchemas = {
    // User registration validation
    userRegistration: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                'Password must contain uppercase, lowercase, number and special character'),
        name: z.string()
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name must be less than 100 characters')
            .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
        phone: z.string()
            .regex(/^\+[1-9]\d{10,14}$/, 'Invalid phone number format'),
        role: z.enum(['user', 'driver']).optional().default('user'),
    }),

    // User login validation
    userLogin: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    }),

    // Booking creation validation
    bookingCreation: z.object({
        pickup_location: z.object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
            address: z.string().min(5).max(500),
        }),
        dropoff_location: z.object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
            address: z.string().min(5).max(500),
        }),
        ride_type: z.enum(['economy', 'comfort', 'premium']),
        scheduled_time: z.string().datetime().optional(),
        payment_method: z.enum(['wallet', 'card', 'cash']),
        special_requests: z.string().max(500).optional(),
    }),

    // Driver registration validation
    driverRegistration: z.object({
        license_number: z.string()
            .regex(/^[A-Z]{2}[0-9]{13}$/, 'Invalid license number format'),
        vehicle: z.object({
            make: z.string().min(2).max(50),
            model: z.string().min(1).max(50),
            year: z.number().min(2000).max(new Date().getFullYear() + 1),
            license_plate: z.string()
                .regex(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/, 'Invalid license plate format'),
            color: z.string().min(3).max(20),
            registration_number: z.string().min(5).max(20),
        }),
        bank_details: z.object({
            account_number: z.string().regex(/^[0-9]{9,18}$/, 'Invalid account number'),
            ifsc_code: z.string().regex(/^[A-Z]{4}[0-9]{7}$/, 'Invalid IFSC code'),
            account_holder_name: z.string().min(2).max(100),
        }),
    }),

    // Location update validation
    locationUpdate: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        heading: z.number().min(0).max(360).optional(),
        speed: z.number().min(0).max(200).optional(),
    }),

    // Payment validation
    paymentCreation: z.object({
        booking_id: z.string().uuid(),
        amount: z.number().min(0.01).max(10000),
        currency: z.enum(['INR', 'USD']),
        payment_method: z.enum(['razorpay', 'stripe']),
    }),
};

// Input sanitization functions
export const sanitization = {
    // Sanitize string input to prevent XSS
    sanitizeString: (input: string): string => {
        if (typeof input !== 'string') return '';

        // Remove XSS attempts
        let sanitized = xss(input, {
            whiteList: {}, // No HTML tags allowed
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script']
        });

        // Trim whitespace
        sanitized = sanitized.trim();

        return sanitized;
    },

    // Sanitize email
    sanitizeEmail: (email: string): string => {
        if (typeof email !== 'string') return '';
        return validator.normalizeEmail(email.toLowerCase().trim()) || '';
    },

    // Sanitize phone number
    sanitizePhone: (phone: string): string => {
        if (typeof phone !== 'string') return '';
        // Remove all non-digit characters except +
        return phone.replace(/[^\d+]/g, '');
    },

    // Sanitize coordinates
    sanitizeCoordinates: (lat: any, lng: any): { latitude: number; longitude: number } | null => {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) return null;
        if (latitude < -90 || latitude > 90) return null;
        if (longitude < -180 || longitude > 180) return null;

        return { latitude, longitude };
    },

    // Sanitize object recursively
    sanitizeObject: (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;

        const sanitized: any = Array.isArray(obj) ? [] : {};

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'string') {
                    sanitized[key] = sanitization.sanitizeString(value);
                } else if (typeof value === 'object' && value !== null) {
                    sanitized[key] = sanitization.sanitizeObject(value);
                } else {
                    sanitized[key] = value;
                }
            }
        }

        return sanitized;
    },
};

// Authentication middleware
export const authMiddleware = async (req: NextRequest, requiredRole?: string) => {
    try {
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication token required',
                    timestamp: new Date().toISOString()
                }
            }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Check if token is expired
        if (decoded.exp < Date.now() / 1000) {
            return NextResponse.json({
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Authentication token has expired',
                    timestamp: new Date().toISOString()
                }
            }, { status: 401 });
        }

        // Check role if required
        if (requiredRole && decoded.role !== requiredRole && decoded.role !== 'admin') {
            return NextResponse.json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions',
                    timestamp: new Date().toISOString()
                }
            }, { status: 403 });
        }

        // Add user info to request
        (req as any).user = decoded;
        return null; // No error
    } catch (error) {
        return NextResponse.json({
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid authentication token',
                timestamp: new Date().toISOString()
            }
        }, { status: 401 });
    }
};

// Validation utility for App Router
export const validateRequestBody = async (request: NextRequest, schema: z.ZodSchema) => {
    try {
        const body = await request.json();

        // Sanitize input first
        const sanitizedBody = sanitization.sanitizeObject(body);

        // Validate against schema
        const validatedData = schema.parse(sanitizedBody);

        return { success: true, data: validatedData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    })),
                    timestamp: new Date().toISOString()
                }
            };
        }

        return {
            success: false,
            error: {
                code: 'INVALID_INPUT',
                message: 'Invalid request format',
                timestamp: new Date().toISOString()
            }
        };
    }
};

// Password hashing utilities
export const passwordUtils = {
    // Hash password
    hashPassword: async (password: string): Promise<string> => {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        return await bcrypt.hash(password, saltRounds);
    },

    // Verify password
    verifyPassword: async (password: string, hashedPassword: string): Promise<boolean> => {
        return await bcrypt.compare(password, hashedPassword);
    },

    // Generate secure random password
    generateSecurePassword: (length: number = 16): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
        let password = '';

        // Ensure at least one of each required character type
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
        password += '0123456789'[Math.floor(Math.random() * 10)];
        password += '@$!%*?&'[Math.floor(Math.random() * 7)];

        // Fill the rest randomly
        for (let i = 4; i < length; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }

        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    },
};

// JWT utilities
export const jwtUtils = {
    // Generate JWT token
    generateToken: (payload: object): string => {
        return jwt.sign(
            {
                ...payload,
                iat: Math.floor(Date.now() / 1000),
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: '7d',
                issuer: 'fairgo-api',
                audience: 'fairgo-client',
            }
        );
    },

    // Verify JWT token
    verifyToken: (token: string): any => {
        return jwt.verify(token, process.env.JWT_SECRET!, {
            issuer: 'fairgo-api',
            audience: 'fairgo-client',
        });
    },

    // Generate refresh token
    generateRefreshToken: (): string => {
        return crypto.randomBytes(32).toString('hex');
    },
};

// File upload security
export const fileUploadSecurity = {
    // Validate file type
    validateFileType: (filename: string, allowedTypes: string[]): boolean => {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ext ? allowedTypes.includes(ext) : false;
    },

    // Validate file size
    validateFileSize: (size: number, maxSize: number): boolean => {
        return size <= maxSize;
    },

    // Generate secure filename
    generateSecureFilename: (originalFilename: string): string => {
        const ext = originalFilename.split('.').pop()?.toLowerCase();
        const hash = crypto.createHash('sha256').update(Date.now().toString()).digest('hex');
        return `${hash}.${ext}`;
    },

    // Validate image file
    validateImageFile: (file: any): { valid: boolean; error?: string } => {
        const allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!fileUploadSecurity.validateFileType(file.originalname, allowedTypes)) {
            return { valid: false, error: 'Invalid file type. Only JPG, PNG, and GIF allowed.' };
        }

        if (!fileUploadSecurity.validateFileSize(file.size, maxSize)) {
            return { valid: false, error: 'File size too large. Maximum 5MB allowed.' };
        }

        return { valid: true };
    },
};

// Security headers middleware
// Security headers utility for App Router
export const getSecurityHeaders = () => {
    const headers = new Headers();

    // Prevent clickjacking
    headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    headers.set('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    headers.set('X-XSS-Protection', '1; mode=block');

    // Prevent referrer leakage
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Enforce HTTPS
    if (process.env.NODE_ENV === 'production') {
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Content Security Policy
    headers.set('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https: blob:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' https://api.razorpay.com wss: ws:; " +
        "frame-src 'self' https://api.razorpay.com;"
    );

    return headers;
};

// Audit logging
export const auditLogger = {
    log: (action: string, userId: string, details: any) => {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            action,
            userId,
            details,
            ip: details.ip,
            userAgent: details.userAgent,
        };

        // Log to file or database
        console.log('AUDIT:', JSON.stringify(auditEntry));

        // In production, send to centralized logging service
        if (process.env.NODE_ENV === 'production') {
            // Send to Sentry, DataDog, or other logging service
        }
    },
};

// Export all security configurations
const securityConfig = {
    rateLimitConfigs,
    helmetConfig,
    corsConfig,
    validationSchemas,
    sanitization,
    authMiddleware,
    validateRequestBody,
    passwordUtils,
    jwtUtils,
    fileUploadSecurity,
    getSecurityHeaders,
    auditLogger,
};

export default securityConfig;