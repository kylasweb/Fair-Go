import { NextRequest } from 'next/server'
import { WebSocket, WebSocketServer } from 'ws'
import { aiService } from '@/lib/ai-service'

interface AIWebSocketData {
    type: string
    audio?: string
    text?: string
    service?: string
    format?: string
}

class MobileAIWebSocketHandler {
    private connections: Map<WebSocket, any>

    constructor() {
        this.connections = new Map()
    }

    handleConnection(ws: WebSocket) {
        console.log('Mobile AI WebSocket connected')

        // Store connection context
        this.connections.set(ws, {
            sessionId: Date.now().toString(),
            conversationHistory: [],
            currentService: null
        })

        ws.on('message', async (data: Buffer) => {
            try {
                const message: AIWebSocketData = JSON.parse(data.toString())
                await this.handleMessage(ws, message)
            } catch (error) {
                console.error('WebSocket message error:', error)
                this.sendError(ws, 'Invalid message format')
            }
        })

        ws.on('close', () => {
            console.log('Mobile AI WebSocket disconnected')
            this.connections.delete(ws)
        })

        ws.on('error', (error) => {
            console.error('Mobile AI WebSocket error:', error)
        })
    }

    private async handleMessage(ws: WebSocket, message: AIWebSocketData) {
        const context = this.connections.get(ws)
        if (!context) return

        try {
            switch (message.type) {
                case 'greeting':
                    await this.handleGreeting(ws, message.service, context)
                    break

                case 'audio_data':
                    await this.handleAudioData(ws, message.audio, context)
                    break

                case 'text_input':
                    await this.handleTextInput(ws, message.text, context)
                    break

                default:
                    this.sendError(ws, 'Unknown message type')
            }
        } catch (error) {
            console.error('Message handling error:', error)
            this.sendError(ws, 'Processing error occurred')
        }
    }

    private async handleGreeting(ws: WebSocket, service: string | undefined, context: any) {
        context.currentService = service || 'FairGo Go'

        const greeting = `Hi! I'm your FairGo AI assistant. I can help you book your ${context.currentService} ride quickly. Where would you like to go?`

        this.sendMessage(ws, {
            type: 'greeting',
            message: greeting
        })

        context.conversationHistory.push({
            role: 'assistant',
            content: greeting
        })
    }

    private async handleAudioData(ws: WebSocket, audioBase64: string | undefined, context: any) {
        if (!audioBase64) {
            this.sendError(ws, 'No audio data provided')
            return
        }

        try {
            // Convert base64 to buffer and create a File-like object
            const audioBuffer = Buffer.from(audioBase64, 'base64')
            const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })
            const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })

            // Use existing AI service for voice processing
            const processedRequest = await aiService.processVoiceRequest(audioFile, 'en-IN')

            if (processedRequest) {
                // Extract transcription from processed request
                const transcription = processedRequest.entities.pickupLocation ||
                    processedRequest.entities.dropLocation ||
                    'Could not understand speech clearly'

                // Send transcription to client
                this.sendMessage(ws, {
                    type: 'transcription',
                    text: transcription
                })

                // Process with conversational AI
                await this.processUserInput(ws, transcription, context)
            } else {
                this.sendError(ws, 'Could not process audio')
            }

        } catch (error) {
            console.error('Audio processing error:', error)
            this.sendError(ws, 'Audio processing failed')
        }
    }

    private async handleTextInput(ws: WebSocket, text: string | undefined, context: any) {
        if (!text) {
            this.sendError(ws, 'No text provided')
            return
        }

        await this.processUserInput(ws, text, context)
    }

    private async processUserInput(ws: WebSocket, userInput: string, context: any) {
        try {
            // Add user message to history
            context.conversationHistory.push({
                role: 'user',
                content: userInput
            })

            // Create a mock processed request for the AI service
            const mockProcessedRequest = {
                intent: 'book_ride' as const,
                entities: {
                    pickupLocation: context.conversationHistory.find((msg: any) => msg.role === 'user')?.content.includes('from') ? userInput : '',
                    dropLocation: userInput,
                    vehicleType: context.currentService,
                    urgency: 'immediate' as const
                },
                confidence: 0.9,
                language: 'en'
            }

            // Generate AI response using existing service
            const aiResponse = await aiService.generateResponse(mockProcessedRequest)

            // Check if booking should be completed
            const isBookingComplete = this.checkBookingCompletion(userInput, aiResponse)

            const response: any = {
                type: 'ai_response',
                message: aiResponse
            }

            if (isBookingComplete) {
                response.booking_complete = true
                response.booking_details = this.generateBookingDetails(context)
            }

            this.sendMessage(ws, response)

            context.conversationHistory.push({
                role: 'assistant',
                content: aiResponse
            })

        } catch (error) {
            console.error('AI processing error:', error)
            this.sendError(ws, 'AI processing failed')
        }
    }

    private checkBookingCompletion(userInput: string, aiResponse: string): boolean {
        const completionKeywords = ['yes, book it', 'confirm booking', 'book the ride', 'yes please']
        const userConfirmed = completionKeywords.some(keyword =>
            userInput.toLowerCase().includes(keyword)
        )

        const aiConfirming = aiResponse.toLowerCase().includes('booking confirmed') ||
            aiResponse.toLowerCase().includes('ride has been booked')

        return userConfirmed || aiConfirming
    }

    private generateBookingDetails(context: any) {
        return {
            from: 'Current Location',
            to: 'User Destination', // In real implementation, extract from conversation
            serviceType: context.currentService,
            estimatedPrice: '₹95',
            estimatedTime: '12 minutes',
            driverETA: '4 minutes'
        }
    }

    private sendMessage(ws: WebSocket, data: any) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data))
        }
    }

    private sendError(ws: WebSocket, message: string) {
        this.sendMessage(ws, {
            type: 'error',
            message
        })
    }
}

// Create global handler instance
const aiHandler = new MobileAIWebSocketHandler()

export { aiHandler as MobileAIWebSocketHandler }