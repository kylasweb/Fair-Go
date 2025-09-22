import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email and check if they have admin role
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Invalid credentials or insufficient permissions' },
        { status: 401 }
      )
    }

    // Check password (in a real app, you'd hash passwords)
    // For demo purposes, we're using plain text comparison
    if (password !== 'admin123') { // In production, use bcrypt.compare
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate admin token
    const token = `admin_token_${user.id}_${Date.now()}`

    // Return user data and token
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'Admin login successful'
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}