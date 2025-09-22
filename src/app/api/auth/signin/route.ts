import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
  validateEmail,
  checkRateLimit,
  handleDatabaseError
} from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for login attempts
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = checkRateLimit(`auth_signin_${clientIP}`, 5, 300000) // 5 attempts per 5 minutes
    if (!rateLimit.allowed) {
      return createErrorResponse('Too many login attempts. Please try again later.', 429)
    }

    const body = await request.json()

    // Validate required fields
    const validation = validateRequiredFields(body, ['email', 'password'])
    if (!validation.isValid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      )
    }

    const { email, password } = body

    // Validate email format
    if (!validateEmail(email)) {
      return createErrorResponse('Invalid email format', 400)
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        driver: {
          select: {
            id: true,
            isVerified: true
          }
        }
      }
    })

    if (!user) {
      return createErrorResponse('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    // Check if user account is suspended
    if (user.status === 'SUSPENDED') {
      return createErrorResponse('Account has been suspended', 403, 'ACCOUNT_SUSPENDED')
    }

    // Check password
    let isValidPassword = false
    if (user.password) {
      // Use bcrypt for hashed passwords
      isValidPassword = await bcrypt.compare(password, user.password)
    } else {
      // Fallback for demo (remove in production)
      isValidPassword = password === 'password'
    }

    if (!isValidPassword) {
      return createErrorResponse('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    // Generate a simple token (in production, use JWT with expiration)
    const token = `token_${user.id}_${Date.now()}`

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Use the role from the user model
    const role = user.role

    // Return user data and token (excluding password)
    const { password: _, ...userWithoutPassword } = user
    return createSuccessResponse({
      user: {
        ...userWithoutPassword,
        role
      },
      token
    }, 'Login successful')

  } catch (error) {
    return handleDatabaseError(error)
  }
}