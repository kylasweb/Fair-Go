import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // In a real app, you might want to blacklist the token
    // For now, we'll just return success
    
    return NextResponse.json({
      message: 'Signed out successfully'
    })

  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}