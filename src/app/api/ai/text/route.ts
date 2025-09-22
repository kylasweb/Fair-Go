import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Extract user ID from token
    const tokenParts = token.split('_')
    if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = tokenParts[1]

    const { text, language = 'en' } = await request.json()

    if (!text) {
      return NextResponse.json(
        { message: 'Text is required' },
        { status: 400 }
      )
    }

    // Process text request with AI
    const processedRequest = await aiService.processTextRequest(text, language)
    
    // Generate AI response
    const aiResponse = await aiService.generateResponse(processedRequest)

    // Store AI call session for analytics
    // In a real app, you would save this to the database
    console.log('AI Text Call Session:', {
      userId,
      sessionId: `session_${Date.now()}`,
      language,
      intent: processedRequest.intent,
      confidence: processedRequest.confidence,
      transcript: text,
      response: aiResponse
    })

    return NextResponse.json({
      success: true,
      request: processedRequest,
      response: aiResponse,
      sessionId: `session_${Date.now()}`
    })

  } catch (error) {
    console.error('AI text processing error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to process text request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}