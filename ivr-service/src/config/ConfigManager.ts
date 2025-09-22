import { AdminDashboardConfigService } from '../services/AdminDashboardConfigService';

/**
 * Configuration Manager for IVR Service
 * Now integrates with Admin Dashboard for dynamic configuration management
 * All settings can be configured through the FairGo admin panel
 */

export interface AIServiceConfig {
    googleCloud: {
        projectId: string;
        keyFilename: string;
        speech: {
            languageCode: string;
            model: string;
            encoding: string;
            sampleRateHertz: number;
            audioChannelCount: number;
            enableSpeakerDiarization: boolean;
            enableAutomaticPunctuation: boolean;
            enableWordTimeOffsets: boolean;
            enableWordConfidence: boolean;
            profanityFilter: boolean;
            speechContexts: Array<{
                phrases: string[];
                boost: number;
            }>;
        };
        textToSpeech: {
            languageCode: string;
            voiceName: string;
            ssmlGender: 'NEUTRAL' | 'FEMALE' | 'MALE';
            audioEncoding: string;
            speakingRate: number;
            pitch: number;
            volumeGainDb: number;
            sampleRateHertz: number;
            effectsProfileId: string[];
        };
    };
    openai: {
        apiKey: string;
        model: string;
        temperature: number;
        maxTokens: number;
        topP: number;
        frequencyPenalty: number;
        presencePenalty: number;
        timeout: number;
        maxRetries: number;
    };
    twilio: {
        accountSid: string;
        authToken: string;
        webhookUrl: string;
        recordCalls: boolean;
        transcribeCallback: string;
    };
}

export interface SystemConfig {
    server: {
        port: number;
        host: string;
        environment: 'development' | 'staging' | 'production';
        cors: {
            origin: string[];
            credentials: boolean;
        };
        rateLimit: {
            windowMs: number;
            max: number;
        };
    };
    database: {
        url: string;
        maxConnections: number;
        timeout: number;
    };
    redis: {
        url: string;
        keyPrefix: string;
        ttl: number;
    };
    logging: {
        level: 'error' | 'warn' | 'info' | 'debug';
        format: 'json' | 'simple';
        maxFiles: number;
        maxSize: string;
    };
    session: {
        timeoutMinutes: number;
        maxConversationTurns: number;
        enablePersistence: boolean;
    };
    audio: {
        chunkSize: number;
        sampleRate: number;
        bitDepth: number;
        channels: number;
        bufferSize: number;
        maxDuration: number;
    };
}

export interface LocationConfig {
    kerala: {
        districts: string[];
        majorCities: string[];
        landmarks: Array<{
            name: string;
            aliases: string[];
            district: string;
            type: 'airport' | 'railway' | 'hospital' | 'mall' | 'temple' | 'beach' | 'hill-station' | 'other';
            coordinates?: {
                lat: number;
                lng: number;
            };
        }>;
        commonPhrases: Array<{
            malayalam: string;
            english: string;
            context: string;
        }>;
    };
}

class ConfigManager {
    private static instance: ConfigManager;
    private config: {
        ai: AIServiceConfig;
        system: SystemConfig;
        location: LocationConfig;
    };
    private adminService: AdminDashboardConfigService;

    private constructor() {
        this.adminService = new AdminDashboardConfigService();
        this.config = this.loadConfiguration();
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    /**
     * Load configuration from Admin Dashboard (database) with fallback to environment variables
     */
    private loadConfiguration() {
        // Start with environment-based defaults, will be overridden by database config
        return this.getEnvironmentDefaults();
    }

    /**
     * Initialize configuration from Admin Dashboard database
     */
    public async initializeFromDatabase(): Promise<void> {
        try {
            const dashboardConfig = await this.adminService.getConfiguration();

            // Update AI service configuration
            this.config.ai = {
                googleCloud: {
                    projectId: dashboardConfig.aiServices.googleCloud.projectId || this.config.ai.googleCloud.projectId,
                    keyFilename: this.config.ai.googleCloud.keyFilename, // File path remains environment-based
                    speech: this.config.ai.googleCloud.speech,
                    textToSpeech: this.config.ai.googleCloud.textToSpeech
                },
                openai: {
                    apiKey: dashboardConfig.aiServices.openai.apiKey || this.config.ai.openai.apiKey,
                    model: dashboardConfig.aiServices.openai.model || this.config.ai.openai.model,
                    temperature: dashboardConfig.aiServices.openai.temperature || this.config.ai.openai.temperature,
                    maxTokens: dashboardConfig.aiServices.openai.maxTokens || this.config.ai.openai.maxTokens,
                    topP: this.config.ai.openai.topP,
                    frequencyPenalty: this.config.ai.openai.frequencyPenalty,
                    presencePenalty: this.config.ai.openai.presencePenalty,
                    timeout: this.config.ai.openai.timeout,
                    maxRetries: this.config.ai.openai.maxRetries
                },
                twilio: {
                    accountSid: dashboardConfig.aiServices.twilio.accountSid || this.config.ai.twilio.accountSid,
                    authToken: dashboardConfig.aiServices.twilio.authToken || this.config.ai.twilio.authToken,
                    webhookUrl: this.config.ai.twilio.webhookUrl,
                    recordCalls: this.config.ai.twilio.recordCalls,
                    transcribeCallback: this.config.ai.twilio.transcribeCallback
                }
            };

            // Update system configuration
            this.config.system.session.timeoutMinutes = dashboardConfig.systemSettings.sessionTimeout;
            this.config.system.session.maxConversationTurns = this.config.system.session.maxConversationTurns;

            console.log('Configuration loaded from Admin Dashboard');
        } catch (error) {
            console.warn('Failed to load configuration from database, using environment defaults:', error);
        }
    }

    /**
     * Get environment-based default configuration
     */
    private getEnvironmentDefaults() {
        return {
            ai: {
                googleCloud: {
                    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'fairgo-ivr',
                    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || './config/google-cloud-key.json',
                    speech: {
                        languageCode: 'en-IN',
                        model: 'phone_call',
                        encoding: 'MULAW',
                        sampleRateHertz: 8000,
                        audioChannelCount: 1,
                        enableSpeakerDiarization: false,
                        enableAutomaticPunctuation: true,
                        enableWordTimeOffsets: true,
                        enableWordConfidence: true,
                        profanityFilter: true,
                        speechContexts: [
                            {
                                phrases: ['FairGo', 'Kerala', 'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
                                boost: 20.0
                            },
                            {
                                phrases: ['pickup', 'drop off', 'destination', 'airport', 'railway station'],
                                boost: 15.0
                            }
                        ]
                    },
                    textToSpeech: {
                        languageCode: 'en-IN',
                        voiceName: 'en-IN-Wavenet-A',
                        ssmlGender: 'FEMALE' as const,
                        audioEncoding: 'MULAW',
                        speakingRate: 0.9,
                        pitch: -2.0,
                        volumeGainDb: 0.0,
                        sampleRateHertz: 8000,
                        effectsProfileId: ['telephony-class-application']
                    }
                },
                openai: {
                    apiKey: process.env.OPENAI_API_KEY || '',
                    model: 'gpt-4',
                    temperature: 0.3,
                    maxTokens: 150,
                    topP: 1.0,
                    frequencyPenalty: 0.0,
                    presencePenalty: 0.1,
                    timeout: 10000,
                    maxRetries: 3
                },
                twilio: {
                    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
                    authToken: process.env.TWILIO_AUTH_TOKEN || '',
                    webhookUrl: process.env.TWILIO_WEBHOOK_URL || 'https://your-domain.com/webhook',
                    recordCalls: true,
                    transcribeCallback: process.env.TWILIO_TRANSCRIBE_CALLBACK || ''
                }
            },
            system: {
                server: {
                    port: parseInt(process.env.PORT || '3000'),
                    host: process.env.HOST || 'localhost',
                    environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
                    cors: {
                        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
                        credentials: true
                    },
                    rateLimit: {
                        windowMs: 15 * 60 * 1000, // 15 minutes
                        max: 100 // limit each IP to 100 requests per windowMs
                    }
                },
                database: {
                    url: process.env.DATABASE_URL || 'sqlite:./db/fairgo.db',
                    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
                    timeout: parseInt(process.env.DB_TIMEOUT || '30000')
                },
                redis: {
                    url: process.env.REDIS_URL || 'redis://localhost:6379',
                    keyPrefix: 'fairgo:ivr:',
                    ttl: 3600 // 1 hour
                },
                logging: {
                    level: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
                    format: (process.env.LOG_FORMAT as 'json' | 'simple') || 'json',
                    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
                    maxSize: process.env.LOG_MAX_SIZE || '20m'
                },
                session: {
                    timeoutMinutes: parseInt(process.env.SESSION_TIMEOUT || '15'),
                    maxConversationTurns: parseInt(process.env.MAX_CONVERSATION_TURNS || '50'),
                    enablePersistence: process.env.ENABLE_SESSION_PERSISTENCE === 'true'
                },
                audio: {
                    chunkSize: parseInt(process.env.AUDIO_CHUNK_SIZE || '1024'),
                    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '8000'),
                    bitDepth: parseInt(process.env.AUDIO_BIT_DEPTH || '16'),
                    channels: parseInt(process.env.AUDIO_CHANNELS || '1'),
                    bufferSize: parseInt(process.env.AUDIO_BUFFER_SIZE || '4096'),
                    maxDuration: parseInt(process.env.MAX_AUDIO_DURATION || '300') // 5 minutes
                }
            },
            location: {
                kerala: {
                    districts: [
                        'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
                        'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode',
                        'Wayanad', 'Kannur', 'Kasaragod'
                    ],
                    majorCities: [
                        'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Alappuzha',
                        'Kollam', 'Palakkad', 'Kannur', 'Kottayam', 'Malappuram'
                    ],
                    landmarks: [
                        {
                            name: 'Cochin International Airport',
                            aliases: ['Kochi Airport', 'COK', 'CIAL'],
                            district: 'Ernakulam',
                            type: 'airport' as const,
                            coordinates: { lat: 10.1520, lng: 76.4019 }
                        },
                        {
                            name: 'Trivandrum International Airport',
                            aliases: ['TRV', 'Thiruvananthapuram Airport'],
                            district: 'Thiruvananthapuram',
                            type: 'airport' as const,
                            coordinates: { lat: 8.4821, lng: 76.9199 }
                        },
                        {
                            name: 'Ernakulam Junction',
                            aliases: ['Ernakulam Railway Station', 'ERS'],
                            district: 'Ernakulam',
                            type: 'railway' as const
                        },
                        {
                            name: 'Lulu Mall',
                            aliases: ['Lulu International Shopping Mall'],
                            district: 'Ernakulam',
                            type: 'mall' as const
                        },
                        {
                            name: 'Fort Kochi',
                            aliases: ['Fort Cochin'],
                            district: 'Ernakulam',
                            type: 'other' as const
                        },
                        {
                            name: 'Marine Drive',
                            aliases: ['Kochi Marine Drive'],
                            district: 'Ernakulam',
                            type: 'other' as const
                        },
                        {
                            name: 'Munnar',
                            aliases: [],
                            district: 'Idukki',
                            type: 'hill-station' as const
                        },
                        {
                            name: 'Alleppey Backwaters',
                            aliases: ['Alappuzha Backwaters'],
                            district: 'Alappuzha',
                            type: 'other' as const
                        }
                    ],
                    commonPhrases: [
                        {
                            malayalam: 'എയർപോർട്ടിലേക്ക്',
                            english: 'to the airport',
                            context: 'destination'
                        },
                        {
                            malayalam: 'റെയിൽവേ സ്റ്റേഷൻ',
                            english: 'railway station',
                            context: 'location'
                        },
                        {
                            malayalam: 'എത്രയാണ് ചാർജ്',
                            english: 'how much is the charge',
                            context: 'pricing'
                        }
                    ]
                }
            }
        };
    }

    public getAIConfig(): AIServiceConfig {
        return this.config.ai;
    }

    public getSystemConfig(): SystemConfig {
        return this.config.system;
    }

    public getLocationConfig(): LocationConfig {
        return this.config.location;
    }

    public getGoogleCloudConfig() {
        return this.config.ai.googleCloud;
    }

    public getOpenAIConfig() {
        return this.config.ai.openai;
    }

    public getTwilioConfig() {
        return this.config.ai.twilio;
    }

    public getAudioConfig() {
        return this.config.system.audio;
    }

    public getSessionConfig() {
        return this.config.system.session;
    }

    public validateConfiguration(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check required environment variables
        if (!this.config.ai.openai.apiKey) {
            errors.push('OPENAI_API_KEY is required');
        }

        if (!this.config.ai.twilio.accountSid) {
            errors.push('TWILIO_ACCOUNT_SID is required');
        }

        if (!this.config.ai.twilio.authToken) {
            errors.push('TWILIO_AUTH_TOKEN is required');
        }

        // Validate numeric ranges
        if (this.config.system.server.port < 1000 || this.config.system.server.port > 65535) {
            errors.push('PORT must be between 1000 and 65535');
        }

        if (this.config.ai.openai.temperature < 0 || this.config.ai.openai.temperature > 2) {
            errors.push('OpenAI temperature must be between 0 and 2');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get admin dashboard service for direct access
     */
    public getAdminService(): AdminDashboardConfigService {
        return this.adminService;
    }

    /**
     * Update configuration from admin dashboard
     */
    public async updateFromDashboard(): Promise<void> {
        await this.initializeFromDatabase();
    }

    public getEnvironmentInfo(): {
        environment: string;
        nodeVersion: string;
        platform: string;
        uptime: number;
    } {
        return {
            environment: this.config.system.server.environment,
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime()
        };
    }
}

export default ConfigManager;