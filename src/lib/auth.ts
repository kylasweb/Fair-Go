import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export interface AuthSession {
    user: {
        id: string
        email: string
        name?: string
        phone?: string
        role: string
    }
}

export async function auth(request: NextRequest): Promise<AuthSession | null> {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null
        }

        const token = authHeader.substring(7)

        // Extract user ID from token (simple approach for demo)
        // Token format: token_{userId}
        const tokenParts = token.split('_')
        if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
            return null
        }

        const userId = tokenParts[1]

        // Find user by ID
        const user = await db.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return null
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name || undefined,
                phone: user.phone || undefined,
                role: user.role
            }
        }
    } catch (error) {
        console.error('Auth error:', error)
        return null
    }
}