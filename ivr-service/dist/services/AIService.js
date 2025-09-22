"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const axios_1 = __importDefault(require("axios"));
class AIService {
    constructor(configManager) {
        this.currentModelId = 'base_model';
        this.configManager = configManager;
        this.loadActiveModel();
    }
    async processVoiceInput(input) {
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
            const response = await axios_1.default.post(`${process.env.FAIRGO_API_URL}/api/ai/voice`, aiRequest, {
                headers: {
                    'Authorization': `Bearer ${process.env.FAIRGO_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            });
            if (response.status === 200) {
                const aiResponse = response.data;
                // Save interaction for training if successful
                if (aiResponse.intent && !aiResponse.error) {
                    this.saveTrainingExample(input, aiResponse);
                }
                return aiResponse;
            }
            else {
                throw new Error(`AI service returned status: ${response.status}`);
            }
        }
        catch (error) {
            console.error('Error processing voice input:', error);
            // Return fallback response
            return this.getFallbackResponse(input.language, error);
        }
    }
    async reloadModel() {
        try {
            await this.loadActiveModel();
            console.log('AI model reloaded successfully');
        }
        catch (error) {
            console.error('Error reloading model:', error);
            throw error;
        }
    }
    async loadActiveModel() {
        try {
            const modelId = await this.configManager.getActiveModelId();
            if (modelId && modelId !== this.currentModelId) {
                this.currentModelId = modelId;
                console.log('Active model updated:', modelId);
            }
        }
        catch (error) {
            console.error('Error loading active model:', error);
            // Keep using current model
        }
    }
    async refreshModelIfNeeded() {
        // Refresh model configuration periodically
        await this.loadActiveModel();
    }
    async saveTrainingExample(input, response) {
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
            await axios_1.default.post(`${process.env.FAIRGO_API_URL}/api/admin/training/examples`, trainingData, {
                headers: {
                    'Authorization': `Bearer ${process.env.FAIRGO_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
        }
        catch (error) {
            console.error('Error saving training example:', error);
            // Don't throw - this is non-critical
        }
    }
    getFallbackResponse(language, error) {
        const fallbackMessages = {
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
    async testConnection() {
        try {
            const response = await axios_1.default.get(`${process.env.FAIRGO_API_URL}/api/health`, {
                timeout: 5000,
                headers: {
                    'Authorization': `Bearer ${process.env.FAIRGO_API_KEY}`
                }
            });
            return response.status === 200;
        }
        catch (error) {
            console.error('AI service connection test failed:', error);
            return false;
        }
    }
    getModelInfo() {
        return {
            modelId: this.currentModelId,
            lastUpdate: new Date()
        };
    }
}
exports.AIService = AIService;
//# sourceMappingURL=AIService.js.map