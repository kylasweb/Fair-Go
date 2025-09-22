"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IVRController = void 0;
const twilio_1 = __importDefault(require("twilio"));
const winston_1 = __importDefault(require("winston"));
const { VoiceResponse } = twilio_1.default.twiml;
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    defaultMeta: { service: 'ivr-controller' },
});
class IVRController {
    constructor(sessionManager, aiService, twilioService) {
        // Additional methods for the server routes
        this.handleSpeechInput = this.processSpeech;
        this.sessionManager = sessionManager;
        this.aiService = aiService;
        this.twilioService = twilioService;
    }
    // Handle incoming calls
    async handleIncomingCall(req, res) {
        try {
            const { CallSid, From } = req.body;
            // Create new session
            const session = {
                sessionId: CallSid,
                phoneNumber: From,
                language: 'ml', // Default to Malayalam
                state: 'welcome',
                context: {},
                startTime: new Date(),
                lastActivity: new Date()
            };
            await this.sessionManager.createSession(session.sessionId, session);
            const twiml = new VoiceResponse();
            const greeting = this.getGreeting(session.language);
            const voiceLanguage = this.getVoiceLanguage(session.language);
            twiml.say({ voice: 'alice', language: voiceLanguage }, greeting);
            const gather = twiml.gather({
                input: ['speech'],
                speechTimeout: process.env.SPEECH_TIMEOUT || '5',
                language: this.getSpeechLanguage(session.language),
                action: '/api/v1/ivr/process-speech'
            });
            const prompt = this.getBookingPrompt(session.language);
            gather.say({ voice: 'alice', language: voiceLanguage }, prompt);
            // Fallback message
            twiml.say({ voice: 'alice', language: voiceLanguage }, this.getTimeoutMessage(session.language));
            res.type('text/xml');
            res.send(twiml.toString());
        }
        catch (error) {
            logger.error('Error handling incoming call:', error);
            const twiml = new VoiceResponse();
            twiml.say({ voice: 'alice' }, 'An error occurred. Please try again later.');
            res.type('text/xml');
            res.send(twiml.toString());
        }
    }
    // Process speech input
    async processSpeech(req, res) {
        try {
            const { CallSid, SpeechResult } = req.body;
            const sessionData = await this.sessionManager.getSession(CallSid);
            if (!sessionData) {
                logger.error('Session not found:', CallSid);
                return this.handleError(res, 'Session not found');
            }
            const session = sessionData;
            session.lastActivity = new Date();
            // Process with AI
            const aiResponse = await this.processWithAI(session, SpeechResult || '');
            // Create TwiML response
            const twiml = await this.createTwiMLResponse(session, aiResponse);
            await this.sessionManager.updateSession(session.sessionId, session);
            res.type('text/xml');
            res.send(twiml.toString());
        }
        catch (error) {
            logger.error('Error processing speech:', error);
            this.handleError(res, 'Speech processing error');
        }
    }
    // Handle booking confirmation
    async confirmBooking(req, res) {
        try {
            const { CallSid, SpeechResult } = req.body;
            const sessionData = await this.sessionManager.getSession(CallSid);
            if (!sessionData) {
                return this.handleError(res, 'Session not found');
            }
            const session = sessionData;
            const confirmation = SpeechResult?.toLowerCase() || '';
            if (confirmation.includes('yes') || confirmation.includes('സരി') || confirmation.includes('ശരി')) {
                // Proceed with booking
                const booking = await this.processBooking(session);
                if (booking && typeof booking === 'object' && 'id' in booking) {
                    session.context.bookingId = booking.id;
                    session.state = 'booking';
                    // Save for training
                    await this.saveConversationForTraining(session);
                    // Send booking details via SMS
                    await this.twilioService.sendBookingConfirmationSMS(session.phoneNumber, this.generateBookingSummary(session));
                    const twiml = this.createConfirmationTwiML(session);
                    res.type('text/xml');
                    res.send(twiml.toString());
                }
                else {
                    this.handleError(res, 'Booking failed');
                }
            }
            else {
                // User declined or wants to modify
                session.state = 'destination';
                const twiml = this.createModificationTwiML(session);
                res.type('text/xml');
                res.send(twiml.toString());
            }
            await this.sessionManager.updateSession(session.sessionId, session);
        }
        catch (error) {
            logger.error('Error confirming booking:', error);
            this.handleError(res, 'Booking confirmation error');
        }
    }
    // Handle call completion
    async handleCallComplete(req, res) {
        try {
            const { CallSid } = req.body;
            // Clean up session
            await this.sessionManager.deleteSession(CallSid);
            logger.info('Call completed and session cleaned up:', CallSid);
            res.status(200).send('OK');
        }
        catch (error) {
            logger.error('Error handling call completion:', error);
            res.status(500).send('Error');
        }
    }
    // Get all active sessions (for admin)
    async getActiveSessions(req, res) {
        try {
            const sessions = await this.sessionManager.getAllActiveSessions();
            res.json({
                sessions: sessions.map((sessionData) => ({
                    sessionId: sessionData.sessionId,
                    phoneNumber: sessionData.phoneNumber,
                    language: sessionData.language,
                    state: sessionData.state,
                    startTime: sessionData.startTime,
                    lastActivity: sessionData.lastActivity
                }))
            });
        }
        catch (error) {
            logger.error('Error getting active sessions:', error);
            res.status(500).json({ error: 'Failed to get sessions' });
        }
    }
    // Private helper methods
    async processWithAI(session, userInput) {
        try {
            const aiResponse = await this.aiService.processVoiceInput({
                text: userInput,
                language: session.language,
                context: JSON.stringify(session.context),
                sessionId: session.sessionId
            });
            // Convert to our expected format
            return {
                message: aiResponse.response || aiResponse.message || this.getErrorMessage(session.language),
                action: aiResponse.intent,
                data: aiResponse.bookingData,
                confidence: aiResponse.confidence
            };
        }
        catch (error) {
            logger.error('AI processing error:', error);
            return {
                message: this.getErrorMessage(session.language),
                action: 'error'
            };
        }
    }
    async createTwiMLResponse(session, aiResponse) {
        const twiml = new VoiceResponse();
        const voiceLanguage = this.getVoiceLanguage(session.language);
        if (aiResponse.action === 'confirm_booking') {
            const confirmationMessage = this.getConfirmationMessage(session.language);
            twiml.say({ voice: 'alice', language: voiceLanguage }, confirmationMessage);
            const gather = twiml.gather({
                input: ['speech'],
                speechTimeout: process.env.SPEECH_TIMEOUT || '5',
                language: this.getSpeechLanguage(session.language),
                action: '/api/v1/ivr/confirm-booking'
            });
            const bookingSummary = this.generateBookingSummary(session);
            gather.say({ voice: 'alice', language: voiceLanguage }, bookingSummary);
        }
        else if (aiResponse.action === 'error') {
            const errorMessage = this.getErrorMessage(session.language);
            twiml.say({ voice: 'alice', language: voiceLanguage }, errorMessage);
        }
        else {
            const responseMessage = aiResponse.message;
            twiml.say({ voice: 'alice', language: voiceLanguage }, responseMessage);
            const gather = twiml.gather({
                input: ['speech'],
                speechTimeout: process.env.SPEECH_TIMEOUT || '5',
                language: this.getSpeechLanguage(session.language),
                action: '/api/v1/ivr/process-speech'
            });
            const prompt = this.getFollowUpPrompt(session.language);
            gather.say({ voice: 'alice', language: voiceLanguage }, prompt);
        }
        // Fallback hangup
        twiml.say({ voice: 'alice', language: voiceLanguage }, this.getTimeoutMessage(session.language));
        twiml.hangup();
        return twiml.toString();
    }
    createConfirmationTwiML(session) {
        const twiml = new VoiceResponse();
        const voiceLanguage = this.getVoiceLanguage(session.language);
        const message = this.getBookingSuccessMessage(session.language);
        twiml.say({ voice: 'alice', language: voiceLanguage }, message);
        twiml.hangup();
        return twiml.toString();
    }
    createModificationTwiML(session) {
        const twiml = new VoiceResponse();
        const voiceLanguage = this.getVoiceLanguage(session.language);
        const message = this.getModificationPrompt(session.language);
        const gather = twiml.gather({
            input: ['speech'],
            speechTimeout: process.env.SPEECH_TIMEOUT || '5',
            language: this.getSpeechLanguage(session.language),
            action: '/api/v1/ivr/process-speech'
        });
        gather.say({ voice: 'alice', language: voiceLanguage }, message);
        return twiml.toString();
    }
    async processBooking(session) {
        try {
            // Create booking in database
            const booking = {
                id: 'BK' + Date.now(),
                phoneNumber: session.phoneNumber,
                destination: session.context.destination,
                pickupTime: session.context.pickupTime,
                vehicleType: session.context.vehicleType,
                fareAmount: session.context.fareAmount,
                language: session.language,
                status: 'confirmed'
            };
            // Here you would typically save to your main database
            return booking;
        }
        catch (error) {
            logger.error('Error processing booking:', error);
            return null;
        }
    }
    async saveConversationForTraining(session) {
        try {
            // Save conversation data for AI training
            const trainingData = {
                sessionId: session.sessionId,
                phoneNumber: session.phoneNumber,
                language: session.language,
                context: session.context,
                timestamp: new Date()
            };
            // Here you would save to your training database
            logger.info('Conversation saved for training:', trainingData);
        }
        catch (error) {
            logger.error('Error saving conversation for training:', error);
        }
    }
    handleError(res, message) {
        const twiml = new VoiceResponse();
        twiml.say({ voice: 'alice' }, 'An error occurred. Please try again later.');
        twiml.hangup();
        res.type('text/xml');
        res.send(twiml.toString());
    }
    // Language-specific message methods
    getGreeting(language) {
        const greetings = {
            'ml': 'നമസ്‌കാരം! ഫെയർഗോ ടാക്‌സി സേവനത്തിലേക്ക് സ്വാഗതം. എനിക്ക് നിങ്ങളെ സഹായിക്കാൻ കഴിയും.',
            'en': 'Hello! Welcome to FairGo Taxi Service. I can help you book a ride.',
            'ml-en': 'Hello! FairGo taxi service-ലേക്ക് സ്വാഗതം. ഞാൻ നിങ്ങളെ help ചെയ്യാം.'
        };
        return greetings[language] || greetings['ml'];
    }
    getBookingPrompt(language) {
        const prompts = {
            'ml': 'നിങ്ങൾ എവിടെ പോകണം? എനിക്ക് പറയാമോ?',
            'en': 'Where would you like to go? Please tell me your destination.',
            'ml-en': 'എവിടെ പോണം? Destination പറയാമോ?'
        };
        return prompts[language] || prompts['ml'];
    }
    getTimeoutMessage(language) {
        const timeouts = {
            'ml': 'ക്ഷമിക്കണം, എനിക്ക് കേൾക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും വിളിക്കുക.',
            'en': 'Sorry, I could not hear you. Please call back.',
            'ml-en': 'Sorry, കേൾക്കാൻ പറ്റിയില്ല. വീണ്ടും call ചെയ്യൂ.'
        };
        return timeouts[language] || timeouts['ml'];
    }
    getErrorMessage(language) {
        const errors = {
            'ml': 'എന്തോ തകരാർ സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.',
            'en': 'Something went wrong. Please try again.',
            'ml-en': 'എന്തോ problem ഉണ്ട്. വീണ്ടും try ചെയ്യൂ.'
        };
        return errors[language] || errors['ml'];
    }
    getConfirmationMessage(language) {
        const confirmations = {
            'ml': 'നിങ്ങളുടെ യാത്രാ വിവരങ്ങൾ ശരിയാണോ? ശരിയാണെങ്കിൽ "ഉവ്വ്" അല്ലെങ്കിൽ "Yes" എന്ന് പറയുക.',
            'en': 'Are your trip details correct? Say "Yes" to confirm or "No" to change.',
            'ml-en': 'Trip details ശരിയാണോ? "ഉവ്വ്" അല്ലെങ്കിൽ "Yes" പറയുക.'
        };
        return confirmations[language] || confirmations['ml'];
    }
    getFollowUpPrompt(language) {
        const prompts = {
            'ml': 'മറ്റേതെങ്കിലും വിവരങ്ങൾ വേണോ?',
            'en': 'Do you need any other information?',
            'ml-en': 'മറ്റെന്തെങ്കിലും വേണോ?'
        };
        return prompts[language] || prompts['ml'];
    }
    getModificationPrompt(language) {
        const prompts = {
            'ml': 'നിങ്ങൾ എന്താണ് മാറ്റാൻ ആഗ്രഹിക്കുന്നത്?',
            'en': 'What would you like to change?',
            'ml-en': 'എന്ത് change ചെയ്യണം?'
        };
        return prompts[language] || prompts['ml'];
    }
    generateBookingSummary(session) {
        const summaries = {
            'ml': `നിങ്ങളുടെ യാത്ര: ${session.context.destination || 'സ്ഥലം വ്യക്തമല്ല'}, സമയം: ${session.context.pickupTime || 'ഇപ്പോൾ'}, വാഹനം: ${session.context.vehicleType || 'സാധാരണ'}`,
            'en': `Your trip: to ${session.context.destination || 'destination not clear'}, time: ${session.context.pickupTime || 'now'}, vehicle: ${session.context.vehicleType || 'standard'}`,
            'ml-en': `നിങ്ങളുടെ trip: ${session.context.destination || 'destination വ്യക്തമല്ല'}, time: ${session.context.pickupTime || 'ഇപ്പോൾ'}, vehicle: ${session.context.vehicleType || 'standard'}`
        };
        return summaries[session.language] || summaries['ml'];
    }
    getBookingSuccessMessage(language) {
        const messages = {
            'ml': 'നിങ്ങളുടെ ബുക്കിംഗ് സ്ഥിരീകരിച്ചു! ഡ്രൈവർ വിവരങ്ങൾ SMS ആയി അയച്ചിട്ടുണ്ട്. നന്ദി!',
            'en': 'Your booking is confirmed! Driver details have been sent via SMS. Thank you!',
            'ml-en': 'നിങ്ങളുടെ booking confirm ആയി! Driver details SMS അയച്ചു. Thank you!'
        };
        return messages[language] || messages['ml'];
    }
    getVoiceLanguage(language) {
        const voiceLanguageMap = {
            'ml': 'ml-IN',
            'en': 'en-US',
            'ml-en': 'ml-IN',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'te': 'te-IN'
        };
        return voiceLanguageMap[language] || 'ml-IN';
    }
    getSpeechLanguage(language) {
        const speechLanguageMap = {
            'ml': 'ml-IN',
            'en': 'en-US',
            'ml-en': 'ml-IN',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'te': 'te-IN'
        };
        return speechLanguageMap[language] || 'ml-IN';
    }
    async handleCallStatus(req, res) {
        try {
            const { CallSid, CallStatus } = req.body;
            logger.info(`Call ${CallSid} status: ${CallStatus}`);
            res.status(200).send('OK');
        }
        catch (error) {
            logger.error('Error handling call status:', error);
            res.status(500).send('Error');
        }
    }
    async getCallStats(req, res) {
        try {
            const stats = await this.sessionManager.getCallStatistics();
            res.json(stats);
        }
        catch (error) {
            logger.error('Error getting call stats:', error);
            res.status(500).json({ error: 'Failed to get stats' });
        }
    }
    async reloadModel(req, res) {
        try {
            await this.aiService.reloadModel();
            res.json({ success: true, message: 'Model reloaded successfully' });
        }
        catch (error) {
            logger.error('Error reloading model:', error);
            res.status(500).json({ error: 'Failed to reload model' });
        }
    }
}
exports.IVRController = IVRController;
//# sourceMappingURL=IVRController.js.map