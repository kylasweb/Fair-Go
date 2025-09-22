import express, { Request, Response } from 'express';
import { Server } from 'http';
import WebSocket from 'ws';
import winston from 'winston';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

// Import our AI services
import { SpeechToTextService } from './services/SpeechToTextService';
import { TextToSpeechService } from './services/TextToSpeechService';
import { ConversationalAIService } from './services/ConversationalAIService';
import { AudioStreamHandler } from './services/AudioStreamHandler';
import { SessionManager } from './services/SessionManager';
import ConfigManager from './config/ConfigManager';

/**
 * Main IVR Service Server
 * Integrates all AI services for conversational voice booking system
 */
class IVRServer {
    private app: express.Application;
    private server: Server;
    private logger: winston.Logger;
    private config: ConfigManager;
    private prisma: PrismaClient;

    // AI Services
    private sttService: SpeechToTextService;
    private ttsService: TextToSpeechService;
    private aiService: ConversationalAIService;
    private audioHandler: AudioStreamHandler;
    private sessionManager: SessionManager;

    constructor() {
        this.app = express();
        this.config = ConfigManager.getInstance();
        this.prisma = new PrismaClient();

        this.setupLogger();
        this.validateConfiguration();
        this.initializeServices();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupLogger(): void {
        const systemConfig = this.config.getSystemConfig();

        this.logger = winston.createLogger({
            level: systemConfig.logging.level,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'ivr-server' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                })
            ]
        });

        this.logger.info('Logger initialized');
    }

    private validateConfiguration(): void {
        const validation = this.config.validateConfiguration();
        if (!validation.isValid) {
            this.logger.error('Configuration validation failed:', validation.errors);
            process.exit(1);
        }
        this.logger.info('Configuration validated successfully');
    }

    private initializeServices(): void {
        try {
            // Initialize session manager
            this.sessionManager = new SessionManager(this.config.getSessionConfig());

            // Initialize AI services
            this.sttService = new SpeechToTextService(this.config);
            this.ttsService = new TextToSpeechService(this.config);
            this.aiService = new ConversationalAIService(this.config);

            // Initialize audio stream handler
            this.audioHandler = new AudioStreamHandler(
                this.sttService,
                this.ttsService,
                this.aiService,
                this.sessionManager
            );

            // Setup booking event handler
            this.audioHandler.on('createBooking', async (data) => {
                await this.handleBookingCreation(data);
            });

            this.logger.info('AI services initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize services:', error);
            process.exit(1);
        }
    }

    private setupMiddleware(): void {
        const systemConfig = this.config.getSystemConfig();

        // CORS
        this.app.use(cors({
            origin: systemConfig.cors.origin,
            credentials: systemConfig.cors.credentials
        }));

        // Rate limiting
        this.app.use(rateLimit({
            windowMs: systemConfig.rateLimit.windowMs,
            max: systemConfig.rateLimit.max,
            message: 'Too many requests from this IP, please try again later.'
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.raw({ type: 'audio/*', limit: '50mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            this.logger.info('Request received', {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
            next();
        });
    }

    private setupRoutes(): void {
        // Health check
        this.app.get('/health', (req: Request, res: Response) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: this.config.getEnvironmentInfo(),
                services: {
                    database: 'connected', // Would check actual connection
                    ai: 'ready',
                    websocket: 'active'
                }
            });
        });

        // Twilio webhook endpoints
        this.app.post('/webhook/voice', this.handleVoiceWebhook.bind(this));
        this.app.post('/webhook/status', this.handleStatusWebhook.bind(this));

        // AI service endpoints
        this.app.post('/api/ai/process-text', this.handleTextProcessing.bind(this));
        this.app.post('/api/ai/synthesize-speech', this.handleSpeechSynthesis.bind(this));

        // Session management endpoints
        this.app.get('/api/sessions', this.handleGetSessions.bind(this));
        this.app.get('/api/sessions/:sessionId', this.handleGetSession.bind(this));
        this.app.get('/api/sessions/:sessionId/stats', this.handleGetSessionStats.bind(this));

        // Analytics endpoints
        this.app.get('/api/analytics/overview', this.handleAnalyticsOverview.bind(this));

        // Error handling
        this.app.use(this.handleErrors.bind(this));
    }

    private async handleVoiceWebhook(req: Request, res: Response): Promise<void> {
        try {
            this.logger.info('Voice webhook received', { body: req.body });

            const twimlResponse = `
                <?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <Connect>
                        <Stream url="wss://${req.get('host')}/audio-stream">
                            <Parameter name="caller" value="${req.body.From}" />
                            <Parameter name="called" value="${req.body.To}" />
                        </Stream>
                    </Connect>
                </Response>
            `;

            res.type('text/xml').send(twimlResponse);

        } catch (error) {
            this.logger.error('Error handling voice webhook:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    private async handleStatusWebhook(req: Request, res: Response): Promise<void> {
        try {
            this.logger.info('Status webhook received', { body: req.body });

            // Log call completion statistics
            if (req.body.CallStatus === 'completed') {
                const duration = parseInt(req.body.CallDuration || '0');
                this.logger.info('Call completed', {
                    callSid: req.body.CallSid,
                    from: req.body.From,
                    to: req.body.To,
                    duration
                });
            }

            res.status(200).send('OK');
        } catch (error) {
            this.logger.error('Error handling status webhook:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    private async handleTextProcessing(req: Request, res: Response): Promise<void> {
        try {
            const { text, sessionId } = req.body;

            if (!text || !sessionId) {
                return res.status(400).json({ error: 'Text and sessionId are required' });
            }

            const context = this.sessionManager.getConversationContext(sessionId);
            if (!context) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const aiResponse = await this.aiService.processConversation(text, context);

            res.json({
                response: aiResponse.message,
                nextStep: aiResponse.nextStep,
                extractedData: aiResponse.extractedData,
                shouldEndCall: aiResponse.shouldEndCall
            });

        } catch (error) {
            this.logger.error('Error processing text:', error);
            res.status(500).json({ error: 'Failed to process text' });
        }
    }

    private async handleSpeechSynthesis(req: Request, res: Response): Promise<void> {
        try {
            const { text, language = 'en', options = {} } = req.body;

            if (!text) {
                return res.status(400).json({ error: 'Text is required' });
            }

            const result = await this.ttsService.synthesizeConversationalSpeech(
                text,
                options,
                language
            );

            res.set({
                'Content-Type': result.audioFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav',
                'Content-Length': result.audioContent.length.toString()
            });

            res.send(result.audioContent);

        } catch (error) {
            this.logger.error('Error synthesizing speech:', error);
            res.status(500).json({ error: 'Failed to synthesize speech' });
        }
    }

    private async handleGetSessions(req: Request, res: Response): Promise<void> {
        try {
            const { active, phone } = req.query;

            const criteria: any = {};
            if (active !== undefined) {
                criteria.isActive = active === 'true';
            }
            if (phone) {
                criteria.phoneNumber = phone as string;
            }

            const sessions = this.sessionManager.findSessions(criteria);
            const stats = this.sessionManager.getGlobalStats();

            res.json({
                sessions: sessions.map(session => ({
                    sessionId: session.sessionId,
                    phoneNumber: session.phoneNumber,
                    currentStep: session.currentStep,
                    isActive: session.isActive,
                    startTime: session.startTime,
                    lastActivity: session.lastActivity
                })),
                stats
            });

        } catch (error) {
            this.logger.error('Error getting sessions:', error);
            res.status(500).json({ error: 'Failed to get sessions' });
        }
    }

    private async handleGetSession(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;
            const sessionData = this.sessionManager.exportSessionData(sessionId);

            if (!sessionData) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json(sessionData);

        } catch (error) {
            this.logger.error('Error getting session:', error);
            res.status(500).json({ error: 'Failed to get session' });
        }
    }

    private async handleGetSessionStats(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;
            const stats = this.sessionManager.getSessionStats(sessionId);

            if (!stats) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json(stats);

        } catch (error) {
            this.logger.error('Error getting session stats:', error);
            res.status(500).json({ error: 'Failed to get session stats' });
        }
    }

    private async handleAnalyticsOverview(req: Request, res: Response): Promise<void> {
        try {
            const sessionStats = this.sessionManager.getGlobalStats();
            const audioStats = this.audioHandler.getSessionStats();

            res.json({
                sessions: sessionStats,
                audio: audioStats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Error getting analytics:', error);
            res.status(500).json({ error: 'Failed to get analytics' });
        }
    }

    private async handleBookingCreation(data: any): Promise<void> {
        try {
            this.logger.info('Creating booking from voice call', {
                sessionId: data.sessionId,
                bookingData: data.bookingData
            });

            // Here you would integrate with your existing FairGo booking API
            // For now, we'll simulate a successful booking creation

            const bookingId = `BK${Date.now()}`;
            const success = true; // Would be actual booking result

            // Call the callback to notify the audio handler
            data.callback(success, bookingId);

            // Store booking in database (simulate)
            this.logger.info('Booking created successfully', {
                bookingId,
                sessionId: data.sessionId
            });

        } catch (error) {
            this.logger.error('Error creating booking:', error);
            data.callback(false);
        }
    }

    private handleErrors(error: any, req: Request, res: Response, next: any): void {
        this.logger.error('Unhandled error:', error);

        if (res.headersSent) {
            return next(error);
        }

        res.status(500).json({
            error: 'Internal server error',
            requestId: req.get('x-request-id') || 'unknown'
        });
    }

    public async start(): Promise<void> {
        try {
            const systemConfig = this.config.getSystemConfig();

            this.server = this.app.listen(systemConfig.server.port, systemConfig.server.host, () => {
                this.logger.info(`IVR Service started on ${systemConfig.server.host}:${systemConfig.server.port}`);
            });

            // Initialize WebSocket server for audio streaming
            this.audioHandler.initializeWebSocketServer(this.server);

            // Setup graceful shutdown
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());

        } catch (error) {
            this.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down IVR Service...');

        try {
            // Close server
            if (this.server) {
                await new Promise<void>((resolve) => {
                    this.server.close(() => resolve());
                });
            }

            // Shutdown services
            await this.audioHandler.shutdown();
            this.sessionManager.shutdown();
            await this.prisma.$disconnect();

            this.logger.info('IVR Service shutdown complete');
            process.exit(0);

        } catch (error) {
            this.logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    const server = new IVRServer();
    server.start().catch(error => {
        console.error('Failed to start IVR Service:', error);
        process.exit(1);
    });
}

export default IVRServer;