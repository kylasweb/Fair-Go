import axios from 'axios';
import { ConfigManager } from './ConfigManager';

interface VoiceInput {
    text: string;
    language: string;
    context?: string;
    sessionId?: string;
}

interface AIResponse {
    response?: string;
    message?: string;
    intent?: string;
    bookingData?: {
        pickup?: string;
        dropoff?: string;
        vehicleType?: string;
        urgency?: string;
        pickupLat?: number;
        pickupLng?: number;
        dropoffLat?: number;
        dropoffLng?: number;
    };
    confidence?: number;
    error?: string;
}

export class AIService {
    private configManager: ConfigManager;
    private currentModelId: string = 'base_model';

    constructor(configManager: ConfigManager) {
        this.configManager = configManager;
        this.loadActiveModel();
    }

    async processVoiceInput(input: VoiceInput): Promise<AIResponse> {
        try {
            // Get current active model
            await this.refreshModelIfNeeded();

            // Prepare the AI request
            const aiRequest = {
                text: input.text,
                language: input.language,
                context: input.context,
                model: this.currentModelId,
                sessionId: input.sessionId
            };

            // Call the main app's AI service
            const response = await axios.post(
                `${process.env.FAIRGO_API_URL}/api/ai/voice`,
                aiRequest,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.FAIRGO_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout
                }
            );

            if (response.status === 200) {
                const aiResponse: AIResponse = response.data;

                // Save interaction for training if successful
                if (aiResponse.intent && !aiResponse.error) {
                    this.saveTrainingExample(input, aiResponse);
                }

                return aiResponse;
            } else {
                throw new Error(`AI service returned status: ${response.status}`);
            }

        } catch (error) {
            console.error('Error processing voice input:', error);

            // Return fallback response
            return this.getFallbackResponse(input.language, error);
        }
    }

    async reloadModel(): Promise<void> {
        try {
            await this.loadActiveModel();
            console.log('AI model reloaded successfully');
        } catch (error) {
            console.error('Error reloading model:', error);
            throw error;
        }
    }

    private async loadActiveModel(): Promise<void> {
        try {
            const modelId = await this.configManager.getActiveModelId();
            if (modelId && modelId !== this.currentModelId) {
                this.currentModelId = modelId;
                console.log('Active model updated:', modelId);
            }
        } catch (error) {
            console.error('Error loading active model:', error);
            // Keep using current model
        }
    }

    private async refreshModelIfNeeded(): Promise<void> {
        // Refresh model configuration periodically
        await this.loadActiveModel();
    }

    private async saveTrainingExample(input: VoiceInput, response: AIResponse): Promise<void> {
        try {
            const trainingData = {
                prompt: input.text,
                completion: JSON.stringify(response.bookingData || response),
                language: input.language,
                source: 'API_SUBMISSION',
                metadata: {
                    sessionId: input.sessionId,
                    confidence: response.confidence,
                    intent: response.intent,
                    timestamp: new Date().toISOString()
                },
                createdBy: 'ivr-system'
            };

            await axios.post(
                `${process.env.FAIRGO_API_URL}/api/admin/training/examples`,
                trainingData,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.FAIRGO_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.error('Error saving training example:', error);
            // Don't throw - this is non-critical
        }
    }

    private getFallbackResponse(language: string, error: any): AIResponse {
        const fallbackMessages: { [key: string]: string } = {
            'ml': 'ക്ഷമിക്കണം, എനിക്ക് അത് മനസ്സിലായില്ല. ദയവായി വീണ്ടും പറയൂ.',
            'en': 'Sorry, I didn\'t understand that. Please try again.',
            'ml-en': 'Sorry, athenthu manassilayilla. Please again parayuka.',
            'hi': 'माफ़ करें, मुझे समझ नहीं आया। कृपया दोबारा कहें।',
            'ta': 'மன்னிக்கவும், எனக்கு புரியவில்லை. தயவுসெய்து மீண்டும் சொல்லুங்கள்.',
            'te': 'క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మళ్లీ చెప్పండి.'
        };

        return {
            response: fallbackMessages[language] || fallbackMessages['ml'],
            intent: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            confidence: 0
        };
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await axios.get(
                `${process.env.FAIRGO_API_URL}/api/health`,
                {
                    timeout: 5000,
                    headers: {
                        'Authorization': `Bearer ${process.env.FAIRGO_API_KEY}`
                    }
                }
            );
            return response.status === 200;
        } catch (error) {
            console.error('AI service connection test failed:', error);
            return false;
        }
    }

    getModelInfo(): { modelId: string; lastUpdate: Date } {
        return {
            modelId: this.currentModelId,
            lastUpdate: new Date()
        };
    }
}