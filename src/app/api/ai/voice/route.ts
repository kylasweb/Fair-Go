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

    // Parse form data (audio file)
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const language = formData.get('language') as string || 'en'

    if (!audioFile) {
      return NextResponse.json(
        { message: 'Audio file is required' },
        { status: 400 }
      )
    }

    // Process voice request with AI
    const processedRequest = await aiService.processVoiceRequest(audioFile, language)
    
    // Generate AI response
    const aiResponse = await aiService.generateResponse(processedRequest)

    // Store AI call session for analytics
    // In a real app, you would save this to the database
    console.log('AI Voice Call Session:', {
      userId,
      sessionId: `session_${Date.now()}`,
      language,
      intent: processedRequest.intent,
      confidence: processedRequest.confidence,
      transcript: 'Voice input received',
      response: aiResponse
    })

    return NextResponse.json({
      success: true,
      request: processedRequest,
      response: aiResponse,
      sessionId: `session_${Date.now()}`
    })

  } catch (error) {
    console.error('AI voice processing error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to process voice request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}