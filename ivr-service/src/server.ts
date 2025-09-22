import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import winston from 'winston';
import { IVRController } from './controllers/IVRController';
import { ConfigManager } from './services/ConfigManager';
import { AIService } from './services/AIService';
import { TwilioService } from './services/TwilioService';
import { SessionManager } from './services/SessionManager';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'fairgo-ivr' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/ivr-service.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

class IVRServer {
    private app: express.Application;
    private redisClient: any;
    private ivrController!: IVRController;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.initializeServices();
    }

    private setupMiddleware(): void {
        // Enable CORS
        this.app.use(cors({
            origin: process.env.FAIRGO_API_URL || 'http://localhost:3000',
            credentials: true
        }));

        // Parse JSON and URL-encoded data
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Request logging
        this.app.use((req, res, next) => {
            logger.info('Incoming request', {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    private async initializeServices(): Promise<void> {
        try {
            // Initialize Redis client
            this.redisClient = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            this.redisClient.on('error', (err: Error) => {
                logger.error('Redis client error:', err);
            });

            await this.redisClient.connect();
            logger.info('Connected to Redis');

            // Initialize services
            const configManager = new ConfigManager();
            const sessionManager = new SessionManager(this.redisClient);
            const aiService = new AIService(configManager);
            const twilioService = new TwilioService();

            // Initialize IVR controller
            this.ivrController = new IVRController(
                sessionManager,
                aiService,
                twilioService
            );

            this.setupRoutes();

            logger.info('IVR services initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize services:', error);
            process.exit(1);
        }
    }

    private setupRoutes(): void {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });

        // Twilio webhook endpoints
        this.app.post('/voice', this.ivrController.handleIncomingCall.bind(this.ivrController));
        this.app.post('/voice/gather', this.ivrController.handleSpeechInput.bind(this.ivrController));
        this.app.post('/voice/status', this.ivrController.handleCallStatus.bind(this.ivrController));

        // Admin endpoints
        this.app.get('/admin/sessions', this.ivrController.getActiveSessions.bind(this.ivrController));
        this.app.get('/admin/stats', this.ivrController.getCallStats.bind(this.ivrController));
        this.app.post('/admin/model/reload', this.ivrController.reloadModel.bind(this.ivrController));

        // Error handling middleware
        this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            logger.error('Unhandled error:', {
                error: err.message,
                stack: err.stack,
                url: req.url,
                method: req.method
            });

            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not found',
                path: req.originalUrl
            });
        });
    }

    public async start(): Promise<void> {
        const port = process.env.PORT || 8080;

        this.app.listen(port, () => {
            logger.info(`IVR service started on port ${port}`);
            console.log(`🚀 FairGo IVR Service running on port ${port}`);
            console.log(`📞 Webhook URL: http://localhost:${port}/voice`);
            console.log(`💊 Health check: http://localhost:${port}/health`);
        });

        // Graceful shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    private async shutdown(): Promise<void> {
        logger.info('Shutting down IVR service...');

        try {
            if (this.redisClient) {
                await this.redisClient.quit();
                logger.info('Redis connection closed');
            }

            logger.info('IVR service shut down successfully');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Start the server
if (require.main === module) {
    const server = new IVRServer();
    server.start().catch((error) => {
        console.error('Failed to start IVR service:', error);
        process.exit(1);
    });
}

export { IVRServer };