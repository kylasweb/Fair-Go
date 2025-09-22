import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
    try {
        // Parse form data (audio file)
        const formData = await request.formData()
        const audioFile = formData.get('audio') as File

        if (!audioFile) {
            return NextResponse.json(
                { message: 'Audio file is required' },
                { status: 400 }
            )
        }

        console.log('Processing audio file:', audioFile.name, audioFile.size)

        // Process voice request with existing AI service
        const processedRequest = await aiService.processVoiceRequest(audioFile, 'en-IN')

        if (processedRequest?.intent === 'book_ride') {
            // Generate conversational AI response
            const aiResponse = await aiService.generateResponse(processedRequest)

            // Check if this completes the booking
            const isBookingComplete = processedRequest.entities.pickupLocation &&
                processedRequest.entities.dropLocation &&
                processedRequest.confidence > 0.8

            const response: any = {
                type: 'ai_response',
                message: aiResponse,
                transcription: processedRequest.entities.pickupLocation ||
                    processedRequest.entities.dropLocation ||
                    'User spoke but content unclear'
            }

            if (isBookingComplete) {
                response.booking_complete = true
                response.booking_details = {
                    from: processedRequest.entities.pickupLocation || 'Current Location',
                    to: processedRequest.entities.dropLocation || 'Destination',
                    serviceType: processedRequest.entities.vehicleType || 'FairGo Go',
                    estimatedPrice: '₹95',
                    estimatedTime: '12 minutes',
                    driverETA: '4 minutes'
                }
            }

            return NextResponse.json(response)
        } else {
            // Handle other intents or unclear speech
            return NextResponse.json({
                type: 'ai_response',
                message: "I'm sorry, could you please repeat your destination?",
                transcription: 'Speech not clear'
            })
        }

    } catch (error) {
        console.error('Voice transcription error:', error)

        // Fallback response
        return NextResponse.json({
            type: 'ai_response',
            message: "I'm having trouble processing your voice. Could you please try again or type your destination?",
            transcription: 'Processing failed'
        })
    }
}