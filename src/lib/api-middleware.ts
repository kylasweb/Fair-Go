import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface AuthUser {
    id: string
    email: string
    name: string | null
    phone?: string
    role: 'USER' | 'DRIVER' | 'ADMIN' | 'SUPER_ADMIN'
}

export interface AuthResult {
    success: boolean
    user?: AuthUser
    error?: string
}

// Standardized authentication middleware
export async function authenticateRequest(
    request: NextRequest,
    requiredRoles?: ('USER' | 'DRIVER' | 'ADMIN' | 'SUPER_ADMIN')[]
): Promise<AuthResult> {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { success: false, error: 'Authorization header missing or invalid' }
        }

        const token = authHeader.substring(7)

        // Extract user ID from token
        const tokenParts = token.split('_')
        if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
            return { success: false, error: 'Invalid token format' }
        }

        const userId = tokenParts[1]

        // Get user from database
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
                driver: {
                    select: {
                        id: true,
                        isVerified: true
                    }
                }
            }
        })

        if (!user || !user.isActive) {
            return { success: false, error: 'User not found or inactive' }
        }

        // Determine user role from the role field
        const role = user.role

        // Check role requirements
        if (requiredRoles && !requiredRoles.includes(role)) {
            return { success: false, error: 'Insufficient permissions' }
        }

        const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone || undefined,
            role: role as 'USER' | 'DRIVER' | 'ADMIN' | 'SUPER_ADMIN'
        }

        return { success: true, user: authUser }

    } catch (error) {
        console.error('Authentication error:', error)
        return { success: false, error: 'Authentication failed' }
    }
}

// Response helpers for consistent API responses
export function createErrorResponse(
    message: string,
    status: number = 500,
    code?: string
) {
    return NextResponse.json(
        {
            success: false,
            message,
            ...(code ? { code } : {}),
            timestamp: new Date().toISOString()
        },
        { status }
    )
}

export function createSuccessResponse(
    data: any,
    message?: string,
    status: number = 200
) {
    return NextResponse.json(
        {
            success: true,
            data,
            ...(message ? { message } : {}),
            timestamp: new Date().toISOString()
        },
        { status }
    )
}

// Input validation helpers
export function validateRequiredFields(
    data: Record<string, any>,
    requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
    const missingFields = requiredFields.filter(field => {
        const value = data[field]
        return value === undefined || value === null || value === ''
    })

    return {
        isValid: missingFields.length === 0,
        missingFields
    }
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
    // Indian phone number validation (10 digits, optional +91)
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/
    return phoneRegex.test(phone.replace(/\s+/g, ''))
}

export function sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '')
}

// Rate limiting helper (simple in-memory store)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const record = rateLimitStore.get(identifier)

    if (!record || now > record.resetTime) {
        const resetTime = now + windowMs
        rateLimitStore.set(identifier, { count: 1, resetTime })
        return { allowed: true, remaining: maxRequests - 1, resetTime }
    }

    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    record.count++
    rateLimitStore.set(identifier, record)
    return {
        allowed: true,
        remaining: maxRequests - record.count,
        resetTime: record.resetTime
    }
}

// Database error handler
export function handleDatabaseError(error: any): NextResponse {
    console.error('Database error:', error)

    // Prisma specific error handling
    if (error.code) {
        switch (error.code) {
            case 'P2002':
                return createErrorResponse('Duplicate entry', 409, 'DUPLICATE_ENTRY')
            case 'P2025':
                return createErrorResponse('Record not found', 404, 'NOT_FOUND')
            case 'P2003':
                return createErrorResponse('Foreign key constraint failed', 400, 'CONSTRAINT_FAILED')
            default:
                return createErrorResponse('Database operation failed', 500, 'DATABASE_ERROR')
        }
    }

    return createErrorResponse('Internal server error', 500)
}