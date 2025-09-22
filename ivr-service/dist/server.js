"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IVRServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const redis_1 = require("redis");
const winston_1 = __importDefault(require("winston"));
const IVRController_1 = require("./controllers/IVRController");
const ConfigManager_1 = require("./services/ConfigManager");
const AIService_1 = require("./services/AIService");
const TwilioService_1 = require("./services/TwilioService");
const SessionManager_1 = require("./services/SessionManager");
// Load environment variables
dotenv_1.default.config();
// Configure logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'fairgo-ivr' },
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: process.env.LOG_FILE || 'logs/ivr-service.log' }),
    ],
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple()
    }));
}
class IVRServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.initializeServices();
    }
    setupMiddleware() {
        // Enable CORS
        this.app.use((0, cors_1.default)({
            origin: process.env.FAIRGO_API_URL || 'http://localhost:3000',
            credentials: true
        }));
        // Parse JSON and URL-encoded data
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
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
    async initializeServices() {
        try {
            // Initialize Redis client
            this.redisClient = (0, redis_1.createClient)({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });
            this.redisClient.on('error', (err) => {
                logger.error('Redis client error:', err);
            });
            await this.redisClient.connect();
            logger.info('Connected to Redis');
            // Initialize services
            const configManager = new ConfigManager_1.ConfigManager();
            const sessionManager = new SessionManager_1.SessionManager(this.redisClient);
            const aiService = new AIService_1.AIService(configManager);
            const twilioService = new TwilioService_1.TwilioService();
            // Initialize IVR controller
            this.ivrController = new IVRController_1.IVRController(sessionManager, aiService, twilioService);
            this.setupRoutes();
            logger.info('IVR services initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize services:', error);
            process.exit(1);
        }
    }
    setupRoutes() {
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
        this.app.use((err, req, res, next) => {
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
    async start() {
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
    async shutdown() {
        logger.info('Shutting down IVR service...');
        try {
            if (this.redisClient) {
                await this.redisClient.quit();
                logger.info('Redis connection closed');
            }
            logger.info('IVR service shut down successfully');
            process.exit(0);
        }
        catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}
exports.IVRServer = IVRServer;
// Start the server
if (require.main === module) {
    const server = new IVRServer();
    server.start().catch((error) => {
        console.error('Failed to start IVR service:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=server.js.map