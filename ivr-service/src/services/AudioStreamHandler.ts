import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import winston from 'winston';
import { EventEmitter } from 'events';
import { SpeechToTextService } from './SpeechToTextService';
import { TextToSpeechService } from './TextToSpeechService';
import { ConversationalAIService } from './ConversationalAIService';
import { SessionManager } from './SessionManager';

interface AudioStreamSession {
    sessionId: string;
    websocket: WebSocket;
    isActive: boolean;
    startTime: Date;
    audioBuffer: Buffer[];
    conversationContext: any;
    sttStream?: any;
    currentAudioChunk?: Buffer;
}

interface AudioMessage {
    event: 'connected' | 'start' | 'media' | 'stop' | 'mark';
    media?: {
        track: 'inbound' | 'outbound';
        chunk: string; // base64 encoded audio
        timestamp: string;
        payload?: any;
    };
    mark?: {
        name: string;
    };
    sequenceNumber?: string;
    streamSid?: string;
}

interface OutboundAudioMessage {
    event: 'media';
    media: {
        payload: string; // base64 encoded audio
    };
    streamSid?: string;
}

export class AudioStreamHandler extends EventEmitter {
    private logger: winston.Logger;
    private sttService: SpeechToTextService;
    private ttsService: TextToSpeechService;
    private aiService: ConversationalAIService;
    private sessionManager: SessionManager;
    private activeSessions: Map<string, AudioStreamSession>;
    private audioCache: Map<string, Buffer>;

    constructor(
        sttService: SpeechToTextService,
        ttsService: TextToSpeechService,
        aiService: ConversationalAIService,
        sessionManager: SessionManager
    ) {
        super();

        this.sttService = sttService;
        this.ttsService = ttsService;
        this.aiService = aiService;
        this.sessionManager = sessionManager;
        this.activeSessions = new Map();
        this.audioCache = new Map();

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'audio-stream' },
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/audio-stream.log' })
            ],
        });

        this.initializeAudioCache();
    }

    private async initializeAudioCache(): Promise<void> {
        try {
            // Pre-generate common phrases for faster response
            this.audioCache = await this.ttsService.generateCommonPhrases('en');
            this.logger.info('Audio cache initialized with common phrases');
        } catch (error) {
            this.logger.error('Failed to initialize audio cache:', error);
        }
    }

    /**
     * Initialize WebSocket server for audio streaming
     */
    initializeWebSocketServer(server: Server): WebSocketServer {
        const wss = new WebSocketServer({
            server,
            path: '/audio-stream'
        });

        wss.on('connection', (ws: WebSocket, request) => {
            const sessionId = this.generateSessionId();
            this.logger.info('New audio stream connection', { sessionId });

            const session: AudioStreamSession = {
                sessionId,
                websocket: ws,
                isActive: true,
                startTime: new Date(),
                audioBuffer: [],
                conversationContext: this.aiService.createNewContext(sessionId)
            };

            this.activeSessions.set(sessionId, session);
            this.setupWebSocketHandlers(ws, session);
        });

        this.logger.info('WebSocket server initialized for audio streaming');
        return wss;
    }

    private setupWebSocketHandlers(ws: WebSocket, session: AudioStreamSession): void {
        ws.on('message', async (message: WebSocket.Data) => {
            try {
                const data: AudioMessage = JSON.parse(message.toString());
                await this.handleAudioMessage(data, session);
            } catch (error) {
                this.logger.error('Error handling WebSocket message:', error);
                this.sendErrorResponse(session, 'Failed to process audio message');
            }
        });

        ws.on('close', () => {
            this.logger.info('WebSocket connection closed', {
                sessionId: session.sessionId,
                duration: Date.now() - session.startTime.getTime()
            });
            this.cleanupSession(session.sessionId);
        });

        ws.on('error', (error) => {
            this.logger.error('WebSocket error:', error);
            this.cleanupSession(session.sessionId);
        });

        // Send initial greeting
        this.sendGreeting(session);
    }

    private async handleAudioMessage(message: AudioMessage, session: AudioStreamSession): Promise<void> {
        switch (message.event) {
            case 'connected':
                this.logger.info('Twilio stream connected', { sessionId: session.sessionId });
                await this.initializeSTTStream(session);
                break;

            case 'start':
                this.logger.info('Audio stream started', {
                    sessionId: session.sessionId,
                    streamSid: message.streamSid
                });
                session.conversationContext.streamSid = message.streamSid;
                break;

            case 'media':
                if (message.media && message.media.track === 'inbound') {
                    await this.processInboundAudio(message.media, session);
                }
                break;

            case 'stop':
                this.logger.info('Audio stream stopped', { sessionId: session.sessionId });
                this.stopSTTStream(session);
                break;

            case 'mark':
                if (message.mark) {
                    this.handleAudioMark(message.mark.name, session);
                }
                break;
        }
    }

    private async initializeSTTStream(session: AudioStreamSession): Promise<void> {
        try {
            const sttStream = this.sttService.createStreamingRecognition({
                languageCode: 'en-IN',
                enableAutomaticPunctuation: true,
                model: 'phone_call'
            });

            session.sttStream = sttStream;

            // Handle transcription results
            sttStream.stream.on('transcript', async (result: any) => {
                if (result.isFinal) {
                    this.logger.info('Final transcript received', {
                        sessionId: session.sessionId,
                        transcript: result.transcript,
                        confidence: result.confidence
                    });

                    await this.processTranscript(result.transcript, session);
                }
            });

            sttStream.stream.on('error', (error: Error) => {
                this.logger.error('STT stream error:', error);
                this.sendErrorResponse(session, 'Speech recognition error');
            });

            await sttStream.startRecognition();
            this.logger.info('STT stream initialized', { sessionId: session.sessionId });

        } catch (error) {
            this.logger.error('Failed to initialize STT stream:', error);
            this.sendErrorResponse(session, 'Failed to start speech recognition');
        }
    }

    private async processInboundAudio(media: any, session: AudioStreamSession): Promise<void> {
        try {
            // Decode base64 audio chunk
            const audioChunk = Buffer.from(media.chunk, 'base64');
            session.audioBuffer.push(audioChunk);

            // Forward to STT stream
            if (session.sttStream) {
                session.sttStream.stream.push(audioChunk);
            }

        } catch (error) {
            this.logger.error('Error processing inbound audio:', error);
        }
    }

    private async processTranscript(transcript: string, session: AudioStreamSession): Promise<void> {
        try {
            this.logger.info('Processing transcript with AI', {
                sessionId: session.sessionId,
                transcript
            });

            // Process with conversational AI
            const aiResponse = await this.aiService.processConversation(
                transcript,
                session.conversationContext
            );

            // Update conversation context
            session.conversationContext.currentStep = aiResponse.nextStep;
            if (aiResponse.extractedData) {
                session.conversationContext.extractedData = {
                    ...session.conversationContext.extractedData,
                    ...aiResponse.extractedData
                };
            }

            // Handle function calls (like booking creation)
            if (aiResponse.functionCalls) {
                await this.handleFunctionCalls(aiResponse.functionCalls, session);
            }

            // Generate and send audio response
            await this.sendAudioResponse(aiResponse.message, session);

            // Check if conversation should end
            if (aiResponse.shouldEndCall) {
                setTimeout(() => {
                    this.endCall(session);
                }, 2000); // Give time for final message to play
            }

        } catch (error) {
            this.logger.error('Error processing transcript:', error);
            await this.sendAudioResponse(
                "I'm sorry, I had trouble understanding. Could you please repeat that?",
                session
            );
        }
    }

    private async handleFunctionCalls(functionCalls: any[], session: AudioStreamSession): Promise<void> {
        for (const funcCall of functionCalls) {
            if (funcCall.name === 'createBooking') {
                try {
                    // Here you would integrate with the FairGo booking API
                    this.logger.info('Creating booking', {
                        sessionId: session.sessionId,
                        bookingData: funcCall.arguments
                    });

                    // Emit event to be handled by booking service
                    this.emit('createBooking', {
                        sessionId: session.sessionId,
                        bookingData: funcCall.arguments,
                        callback: (success: boolean, bookingId?: string) => {
                            if (success) {
                                this.sendAudioResponse(
                                    `Excellent! Your booking ${bookingId} is confirmed. Your driver will arrive shortly.`,
                                    session
                                );
                            } else {
                                this.sendAudioResponse(
                                    "I'm sorry, there was an issue creating your booking. Please try again.",
                                    session
                                );
                            }
                        }
                    });

                } catch (error) {
                    this.logger.error('Error creating booking:', error);
                }
            }
        }
    }

    private async sendAudioResponse(text: string, session: AudioStreamSession): Promise<void> {
        try {
            this.logger.info('Sending audio response', {
                sessionId: session.sessionId,
                text: text.substring(0, 100)
            });

            // Check cache first
            const cacheKey = this.getCacheKey(text);
            let audioBuffer = this.audioCache.get(cacheKey);

            if (!audioBuffer) {
                // Generate speech with conversational context
                const ttsResult = await this.ttsService.synthesizeConversationalSpeech(
                    text,
                    {
                        emotion: 'friendly',
                        emphasis: ['FairGo', 'booking', 'confirmed'],
                        pauseAfter: ['Hello', 'Great', 'Perfect']
                    },
                    'en'
                );
                audioBuffer = ttsResult.audioContent;
            }

            // Send audio to Twilio stream
            const base64Audio = audioBuffer.toString('base64');
            const audioMessage: OutboundAudioMessage = {
                event: 'media',
                media: {
                    payload: base64Audio
                },
                streamSid: session.conversationContext.streamSid
            };

            if (session.websocket.readyState === WebSocket.OPEN) {
                session.websocket.send(JSON.stringify(audioMessage));
            }

        } catch (error) {
            this.logger.error('Error sending audio response:', error);
        }
    }

    private async sendGreeting(session: AudioStreamSession): Promise<void> {
        const greetingText = "Hello! Welcome to FairGo. I'm Priya, your booking assistant. How can I help you today?";
        await this.sendAudioResponse(greetingText, session);
    }

    private sendErrorResponse(session: AudioStreamSession, message: string): void {
        if (session.websocket.readyState === WebSocket.OPEN) {
            session.websocket.send(JSON.stringify({
                event: 'error',
                error: message
            }));
        }
    }

    private stopSTTStream(session: AudioStreamSession): void {
        if (session.sttStream) {
            session.sttStream.stopRecognition();
            session.sttStream = null;
        }
    }

    private handleAudioMark(markName: string, session: AudioStreamSession): void {
        this.logger.info('Audio mark received', {
            sessionId: session.sessionId,
            markName
        });

        // Handle specific audio marks (e.g., when TTS playback completes)
        if (markName === 'playback_complete') {
            // Resume STT listening if it was paused
            if (session.sttStream) {
                // Resume listening logic here
            }
        }
    }

    private endCall(session: AudioStreamSession): void {
        this.logger.info('Ending call', { sessionId: session.sessionId });

        if (session.websocket.readyState === WebSocket.OPEN) {
            session.websocket.close();
        }

        this.cleanupSession(session.sessionId);
    }

    private cleanupSession(sessionId: string): void {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.isActive = false;
            this.stopSTTStream(session);
            this.activeSessions.delete(sessionId);

            this.logger.info('Session cleaned up', {
                sessionId,
                duration: Date.now() - session.startTime.getTime()
            });
        }
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getCacheKey(text: string): string {
        // Simple cache key generation - could be enhanced with text normalization
        return text.toLowerCase().replace(/[^\w\s]/g, '').substring(0, 50);
    }

    /**
     * Get current session statistics
     */
    getSessionStats(): {
        activeSessions: number;
        totalProcessed: number;
        averageDuration: number;
    } {
        return {
            activeSessions: this.activeSessions.size,
            totalProcessed: 0, // Would be tracked over time
            averageDuration: 0 // Would be calculated from historical data
        };
    }

    /**
     * Gracefully shutdown all active sessions
     */
    async shutdown(): Promise<void> {
        this.logger.info('Shutting down audio stream handler');

        for (const [sessionId, session] of this.activeSessions) {
            try {
                this.endCall(session);
            } catch (error) {
                this.logger.error(`Error closing session ${sessionId}:`, error);
            }
        }

        this.activeSessions.clear();
        this.logger.info('Audio stream handler shutdown complete');
    }
}