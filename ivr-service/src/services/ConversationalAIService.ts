import OpenAI from 'openai';
import winston from 'winston';
import { ConfigManager } from './ConfigManager';

interface ConversationContext {
    sessionId: string;
    userId?: string;
    currentStep: ConversationStep;
    extractedData: BookingData;
    conversationHistory: Message[];
    language: 'en' | 'ml' | 'hi';
    retryCount: number;
}

interface BookingData {
    pickupLocation?: string;
    dropoffLocation?: string;
    vehicleType?: 'AUTO' | 'CAR_ECONOMY' | 'CAR_PREMIUM';
    scheduledTime?: string;
    specialRequests?: string;
    pickupCoordinates?: { lat: number; lng: number };
    dropoffCoordinates?: { lat: number; lng: number };
    confirmed: boolean;
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    functionCall?: any;
}

enum ConversationStep {
    GREETING = 'greeting',
    PICKUP_LOCATION = 'pickup_location',
    DROPOFF_LOCATION = 'dropoff_location',
    VEHICLE_TYPE = 'vehicle_type',
    CONFIRMATION = 'confirmation',
    BOOKING_PROCESSING = 'booking_processing',
    COMPLETION = 'completion',
    ERROR_HANDLING = 'error_handling'
}

interface AIResponse {
    message: string;
    nextStep: ConversationStep;
    shouldEndCall: boolean;
    functionCalls?: Array<{
        name: string;
        arguments: any;
    }>;
    extractedData?: Partial<BookingData>;
}

export class ConversationalAIService {
    private openai: OpenAI;
    private logger: winston.Logger;
    private configManager: ConfigManager;
    private keralaLocations: Set<string>;

    constructor(configManager: ConfigManager) {
        this.configManager = configManager;

        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'conversational-ai' },
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/ai-conversation.log' })
            ],
        });

        // Initialize Kerala-specific locations
        this.keralaLocations = new Set([
            // Kochi/Ernakulam
            'marine drive', 'mg road', 'broadway', 'vytilla', 'kakkanad', 'infopark',
            'airport', 'kochi airport', 'nedumbassery', 'edappally', 'palarivattom',
            'kaloor', 'maharajas college', 'ernakulam junction', 'ernakulam south',
            'fort kochi', 'mattancherry', 'willingdon island',

            // Thiruvananthapuram
            'technopark', 'trivandrum', 'central station', 'secretariat',
            'kovalam', 'vellayani', 'neyyattinkara', 'attingal',

            // Kozhikode
            'calicut', 'beach road', 'sweet meat street', 'mavoor road',

            // Thrissur
            'thrissur', 'vadakkumnathan temple', 'sobha city',

            // Kollam
            'kollam', 'quilon', 'chinnakada',

            // Common landmarks
            'railway station', 'bus stand', 'hospital', 'mall', 'metro station',
            'lulu mall', 'oberon mall', 'centre square mall'
        ]);
    }

    private getSystemPrompt(context: ConversationContext): string {
        const locationsList = Array.from(this.keralaLocations).join(', ');

        return `You are Priya, a friendly and efficient booking assistant for FairGo, Kerala's leading ride-hailing service. You help customers book rides through voice calls.

PERSONALITY & TONE:
- Warm, professional, and patient
- Speak clearly and concisely
- Use simple language that's easy to understand over phone
- Be encouraging and supportive
- Never rush the customer

YOUR GOAL:
Extract the following information to book a ride:
1. Pickup location (required)
2. Drop-off location (required) 
3. Vehicle preference (optional - auto, economy car, premium car)

CONVERSATION RULES:
- Always confirm details before proceeding
- If unsure about a location, ask for clarification
- Offer alternatives if the exact location isn't clear
- Handle multiple languages naturally (English, Malayalam, Hindi)
- Keep responses under 25 words for phone clarity

KERALA LOCATIONS CONTEXT:
Common places include: ${locationsList}

FUNCTION CALLING:
Use these functions when appropriate:
- extractLocationData: When user mentions pickup/dropoff locations
- confirmBookingDetails: When you have complete booking information
- searchNearbyPlaces: When location is ambiguous

CURRENT SESSION:
- Step: ${context.currentStep}
- Language: ${context.language}
- Extracted so far: ${JSON.stringify(context.extractedData, null, 2)}

Respond naturally and guide the conversation toward completion.`;
    }

    private getAvailableFunctions() {
        return [
            {
                name: 'extractLocationData',
                description: 'Extract and validate pickup and dropoff locations from user input',
                parameters: {
                    type: 'object',
                    properties: {
                        pickupLocation: {
                            type: 'string',
                            description: 'The pickup location mentioned by user'
                        },
                        dropoffLocation: {
                            type: 'string',
                            description: 'The destination/dropoff location mentioned by user'
                        },
                        isPickupClear: {
                            type: 'boolean',
                            description: 'Whether the pickup location is clearly understood'
                        },
                        isDropoffClear: {
                            type: 'boolean',
                            description: 'Whether the dropoff location is clearly understood'
                        }
                    }
                }
            },
            {
                name: 'confirmBookingDetails',
                description: 'Confirm all booking details are complete and ready for processing',
                parameters: {
                    type: 'object',
                    properties: {
                        pickup: { type: 'string' },
                        dropoff: { type: 'string' },
                        vehicleType: {
                            type: 'string',
                            enum: ['AUTO', 'CAR_ECONOMY', 'CAR_PREMIUM']
                        },
                        estimatedFare: { type: 'number' },
                        estimatedTime: { type: 'string' }
                    },
                    required: ['pickup', 'dropoff']
                }
            },
            {
                name: 'searchNearbyPlaces',
                description: 'Search for places near a given location when user input is ambiguous',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' },
                        location: { type: 'string' }
                    },
                    required: ['query']
                }
            },
            {
                name: 'setVehiclePreference',
                description: 'Set user vehicle type preference',
                parameters: {
                    type: 'object',
                    properties: {
                        vehicleType: {
                            type: 'string',
                            enum: ['AUTO', 'CAR_ECONOMY', 'CAR_PREMIUM']
                        }
                    },
                    required: ['vehicleType']
                }
            }
        ];
    }

    async processConversation(
        userInput: string,
        context: ConversationContext
    ): Promise<AIResponse> {
        try {
            // Add user message to history
            context.conversationHistory.push({
                role: 'user',
                content: userInput,
                timestamp: new Date()
            });

            const messages = [
                {
                    role: 'system' as const,
                    content: this.getSystemPrompt(context)
                },
                ...context.conversationHistory.slice(-5).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            ];

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages,
                functions: this.getAvailableFunctions(),
                function_call: 'auto',
                temperature: 0.7,
                max_tokens: 150, // Keep responses concise for phone calls
                presence_penalty: 0.1,
                frequency_penalty: 0.1
            });

            const assistantMessage = completion.choices[0].message;
            let response: AIResponse;

            // Handle function calls
            if (assistantMessage.function_call) {
                response = await this.handleFunctionCall(
                    assistantMessage.function_call,
                    context
                );
            } else {
                response = {
                    message: assistantMessage.content || "I'm here to help you book a ride. Where would you like to go?",
                    nextStep: this.determineNextStep(context),
                    shouldEndCall: false
                };
            }

            // Add assistant response to history
            context.conversationHistory.push({
                role: 'assistant',
                content: response.message,
                timestamp: new Date(),
                functionCall: assistantMessage.function_call
            });

            this.logger.info('AI Response generated', {
                sessionId: context.sessionId,
                currentStep: context.currentStep,
                nextStep: response.nextStep,
                functionCalls: assistantMessage.function_call
            });

            return response;

        } catch (error) {
            this.logger.error('Error processing conversation:', error);

            return {
                message: "I'm sorry, I had trouble understanding. Could you please repeat that?",
                nextStep: ConversationStep.ERROR_HANDLING,
                shouldEndCall: false
            };
        }
    }

    private async handleFunctionCall(
        functionCall: any,
        context: ConversationContext
    ): Promise<AIResponse> {
        const { name, arguments: args } = functionCall;
        const parsedArgs = JSON.parse(args);

        switch (name) {
            case 'extractLocationData':
                return this.handleLocationExtraction(parsedArgs, context);

            case 'confirmBookingDetails':
                return this.handleBookingConfirmation(parsedArgs, context);

            case 'searchNearbyPlaces':
                return this.handlePlaceSearch(parsedArgs, context);

            case 'setVehiclePreference':
                return this.handleVehiclePreference(parsedArgs, context);

            default:
                return {
                    message: "Let me help you book your ride. Where are you starting from?",
                    nextStep: ConversationStep.PICKUP_LOCATION,
                    shouldEndCall: false
                };
        }
    }

    private handleLocationExtraction(
        args: any,
        context: ConversationContext
    ): AIResponse {
        if (args.pickupLocation) {
            context.extractedData.pickupLocation = args.pickupLocation;
        }
        if (args.dropoffLocation) {
            context.extractedData.dropoffLocation = args.dropoffLocation;
        }

        // Determine next step based on what we have
        if (!context.extractedData.pickupLocation) {
            return {
                message: "Got it! Where would you like to be picked up from?",
                nextStep: ConversationStep.PICKUP_LOCATION,
                shouldEndCall: false,
                extractedData: context.extractedData
            };
        } else if (!context.extractedData.dropoffLocation) {
            return {
                message: `Perfect! Pickup from ${context.extractedData.pickupLocation}. Where are you heading to?`,
                nextStep: ConversationStep.DROPOFF_LOCATION,
                shouldEndCall: false,
                extractedData: context.extractedData
            };
        } else {
            return {
                message: `Great! From ${context.extractedData.pickupLocation} to ${context.extractedData.dropoffLocation}. Would you prefer an auto or car?`,
                nextStep: ConversationStep.VEHICLE_TYPE,
                shouldEndCall: false,
                extractedData: context.extractedData
            };
        }
    }

    private handleBookingConfirmation(
        args: any,
        context: ConversationContext
    ): AIResponse {
        // Merge confirmed details
        context.extractedData = { ...context.extractedData, ...args };
        context.extractedData.confirmed = true;

        return {
            message: `Perfect! I'm booking your ${args.vehicleType || 'ride'} from ${args.pickup} to ${args.dropoff}. This should take about ${args.estimatedTime || '10-15 minutes'}.`,
            nextStep: ConversationStep.BOOKING_PROCESSING,
            shouldEndCall: false,
            extractedData: context.extractedData,
            functionCalls: [{
                name: 'createBooking',
                arguments: context.extractedData
            }]
        };
    }

    private handlePlaceSearch(args: any, context: ConversationContext): AIResponse {
        // Simple place matching for now - could be enhanced with actual geocoding
        const query = args.query.toLowerCase();
        const matches = Array.from(this.keralaLocations)
            .filter(place => place.includes(query) || query.includes(place));

        if (matches.length === 0) {
            return {
                message: `I couldn't find "${args.query}". Could you be more specific or mention a nearby landmark?`,
                nextStep: context.currentStep,
                shouldEndCall: false
            };
        } else if (matches.length === 1) {
            return {
                message: `Found it! Did you mean ${matches[0]}?`,
                nextStep: context.currentStep,
                shouldEndCall: false
            };
        } else {
            const topMatches = matches.slice(0, 2).join(' or ');
            return {
                message: `I found a few options: ${topMatches}. Which one?`,
                nextStep: context.currentStep,
                shouldEndCall: false
            };
        }
    }

    private handleVehiclePreference(args: any, context: ConversationContext): AIResponse {
        context.extractedData.vehicleType = args.vehicleType;

        return {
            message: `${args.vehicleType === 'AUTO' ? 'Auto rickshaw' : 'Car'} it is! Let me confirm: ${context.extractedData.vehicleType} from ${context.extractedData.pickupLocation} to ${context.extractedData.dropoffLocation}. Shall I book this for you?`,
            nextStep: ConversationStep.CONFIRMATION,
            shouldEndCall: false,
            extractedData: context.extractedData
        };
    }

    private determineNextStep(context: ConversationContext): ConversationStep {
        const { extractedData } = context;

        if (!extractedData.pickupLocation) {
            return ConversationStep.PICKUP_LOCATION;
        } else if (!extractedData.dropoffLocation) {
            return ConversationStep.DROPOFF_LOCATION;
        } else if (!extractedData.confirmed) {
            return ConversationStep.CONFIRMATION;
        } else {
            return ConversationStep.BOOKING_PROCESSING;
        }
    }

    createNewContext(sessionId: string, language: 'en' | 'ml' | 'hi' = 'en'): ConversationContext {
        return {
            sessionId,
            currentStep: ConversationStep.GREETING,
            extractedData: {
                confirmed: false
            },
            conversationHistory: [],
            language,
            retryCount: 0
        };
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 5
            });
            return !!response.choices[0];
        } catch (error) {
            this.logger.error('OpenAI connection test failed:', error);
            return false;
        }
    }
}