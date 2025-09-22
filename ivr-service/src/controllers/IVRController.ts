import { Request, Response } from 'express';
import twilio from 'twilio';
import { v4 as uuidv4 } from 'uuid';
import { CallSession, SessionData, CallState, IVRRequest, AIResponse } from '../types';
import { SessionManager } from '../services/SessionManager';
import { AIService } from '../services/AIService';
import { TwilioService } from '../services/TwilioService';
import winston from 'winston';

const { VoiceResponse } = twilio.twiml;

type LanguageKey = 'ml' | 'en' | 'ml-en';
type VoiceLanguageKey = 'ml' | 'en' | 'ml-en' | 'hi' | 'ta' | 'te';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'ivr-controller' },
});

export class IVRController {
    private sessionManager: SessionManager;
    private aiService: AIService;
    private twilioService: TwilioService;

    constructor(
        sessionManager: SessionManager,
        aiService: AIService,
        twilioService: TwilioService
    ) {
        this.sessionManager = sessionManager;
        this.aiService = aiService;
        this.twilioService = twilioService;
    }

    // Handle incoming calls
    async handleIncomingCall(req: Request, res: Response): Promise<void> {
        try {
            const { CallSid, From } = req.body as IVRRequest;

            // Create new session
            const session: CallSession = {
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
            const voiceLanguage = this.getVoiceLanguage(session.language) as any;

            twiml.say({ voice: 'alice', language: voiceLanguage }, greeting);

            const gather = twiml.gather({
                input: ['speech'] as any,
                speechTimeout: process.env.SPEECH_TIMEOUT || '5',
                language: this.getSpeechLanguage(session.language) as any,
                action: '/api/v1/ivr/process-speech'
            });

            const prompt = this.getBookingPrompt(session.language);
            gather.say({ voice: 'alice', language: voiceLanguage }, prompt);

            // Fallback message
            twiml.say({ voice: 'alice', language: voiceLanguage },
                this.getTimeoutMessage(session.language));

            res.type('text/xml');
            res.send(twiml.toString());

        } catch (error) {
            logger.error('Error handling incoming call:', error);
            const twiml = new VoiceResponse();
            twiml.say({ voice: 'alice' }, 'An error occurred. Please try again later.');
            res.type('text/xml');
            res.send(twiml.toString());
        }
    }

    // Process speech input
    async processSpeech(req: Request, res: Response): Promise<void> {
        try {
            const { CallSid, SpeechResult } = req.body as IVRRequest;
            const sessionData = await this.sessionManager.getSession(CallSid);

            if (!sessionData) {
                logger.error('Session not found:', CallSid);
                return this.handleError(res, 'Session not found');
            }

            const session = sessionData as CallSession;
            session.lastActivity = new Date();

            // Process with AI
            const aiResponse = await this.processWithAI(session, SpeechResult || '');

            // Create TwiML response
            const twiml = await this.createTwiMLResponse(session, aiResponse);

            await this.sessionManager.updateSession(session.sessionId, session);

            res.type('text/xml');
            res.send(twiml.toString());

        } catch (error) {
            logger.error('Error processing speech:', error);
            this.handleError(res, 'Speech processing error');
        }
    }

    // Handle booking confirmation
    async confirmBooking(req: Request, res: Response): Promise<void> {
        try {
            const { CallSid, SpeechResult } = req.body as IVRRequest;
            const sessionData = await this.sessionManager.getSession(CallSid);

            if (!sessionData) {
                return this.handleError(res, 'Session not found');
            }

            const session = sessionData as CallSession;
            const confirmation = SpeechResult?.toLowerCase() || '';

            if (confirmation.includes('yes') || confirmation.includes('സരി') || confirmation.includes('ശരി')) {
                // Proceed with booking
                const booking = await this.processBooking(session);

                if (booking && typeof booking === 'object' && 'id' in booking) {
                    session.context.bookingId = (booking as any).id;
                    session.state = 'booking';

                    // Save for training
                    await this.saveConversationForTraining(session);

                    // Send booking details via SMS
                    await this.twilioService.sendBookingConfirmationSMS(
                        session.phoneNumber,
                        this.generateBookingSummary(session)
                    );

                    const twiml = this.createConfirmationTwiML(session);
                    res.type('text/xml');
                    res.send(twiml.toString());
                } else {
                    this.handleError(res, 'Booking failed');
                }
            } else {
                // User declined or wants to modify
                session.state = 'destination';
                const twiml = this.createModificationTwiML(session);
                res.type('text/xml');
                res.send(twiml.toString());
            }

            await this.sessionManager.updateSession(session.sessionId, session);

        } catch (error) {
            logger.error('Error confirming booking:', error);
            this.handleError(res, 'Booking confirmation error');
        }
    }

    // Handle call completion
    async handleCallComplete(req: Request, res: Response): Promise<void> {
        try {
            const { CallSid } = req.body as IVRRequest;

            // Clean up session
            await this.sessionManager.deleteSession(CallSid);

            logger.info('Call completed and session cleaned up:', CallSid);
            res.status(200).send('OK');

        } catch (error) {
            logger.error('Error handling call completion:', error);
            res.status(500).send('Error');
        }
    }

    // Get all active sessions (for admin)
    async getActiveSessions(req: Request, res: Response): Promise<void> {
        try {
            const sessions = await this.sessionManager.getAllActiveSessions();
            res.json({
                sessions: sessions.map((sessionData: any) => ({
                    sessionId: sessionData.sessionId,
                    phoneNumber: sessionData.phoneNumber,
                    language: sessionData.language,
                    state: sessionData.state,
                    startTime: sessionData.startTime,
                    lastActivity: sessionData.lastActivity
                }))
            });
        } catch (error) {
            logger.error('Error getting active sessions:', error);
            res.status(500).json({ error: 'Failed to get sessions' });
        }
    }

    // Private helper methods
    private async processWithAI(session: CallSession, userInput: string): Promise<AIResponse> {
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
        } catch (error) {
            logger.error('AI processing error:', error);
            return {
                message: this.getErrorMessage(session.language),
                action: 'error'
            };
        }
    }

    private async createTwiMLResponse(session: CallSession, aiResponse: AIResponse): Promise<string> {
        const twiml = new VoiceResponse();
        const voiceLanguage = this.getVoiceLanguage(session.language);

        if (aiResponse.action === 'confirm_booking') {
            const confirmationMessage = this.getConfirmationMessage(session.language);
            twiml.say({ voice: 'alice', language: voiceLanguage as any }, confirmationMessage);

            const gather = twiml.gather({
                input: ['speech'] as any,
                speechTimeout: process.env.SPEECH_TIMEOUT || '5',
                language: this.getSpeechLanguage(session.language) as any,
                action: '/api/v1/ivr/confirm-booking'
            });

            const bookingSummary = this.generateBookingSummary(session);
            gather.say({ voice: 'alice', language: voiceLanguage as any }, bookingSummary);

        } else if (aiResponse.action === 'error') {
            const errorMessage = this.getErrorMessage(session.language);
            twiml.say({ voice: 'alice', language: voiceLanguage as any }, errorMessage);

        } else {
            const responseMessage = aiResponse.message;
            twiml.say({ voice: 'alice', language: voiceLanguage as any }, responseMessage);

            const gather = twiml.gather({
                input: ['speech'] as any,
                speechTimeout: process.env.SPEECH_TIMEOUT || '5',
                language: this.getSpeechLanguage(session.language) as any,
                action: '/api/v1/ivr/process-speech'
            });

            const prompt = this.getFollowUpPrompt(session.language);
            gather.say({ voice: 'alice', language: voiceLanguage as any }, prompt);
        }

        // Fallback hangup
        twiml.say({ voice: 'alice', language: voiceLanguage as any },
            this.getTimeoutMessage(session.language));
        twiml.hangup();

        return twiml.toString();
    }

    private createConfirmationTwiML(session: CallSession): string {
        const twiml = new VoiceResponse();
        const voiceLanguage = this.getVoiceLanguage(session.language);
        const message = this.getBookingSuccessMessage(session.language);

        twiml.say({ voice: 'alice', language: voiceLanguage as any }, message);
        twiml.hangup();

        return twiml.toString();
    }

    private createModificationTwiML(session: CallSession): string {
        const twiml = new VoiceResponse();
        const voiceLanguage = this.getVoiceLanguage(session.language);
        const message = this.getModificationPrompt(session.language);

        const gather = twiml.gather({
            input: ['speech'] as any,
            speechTimeout: process.env.SPEECH_TIMEOUT || '5',
            language: this.getSpeechLanguage(session.language) as any,
            action: '/api/v1/ivr/process-speech'
        });

        gather.say({ voice: 'alice', language: voiceLanguage as any }, message);

        return twiml.toString();
    }

    private async processBooking(session: CallSession): Promise<any> {
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

        } catch (error) {
            logger.error('Error processing booking:', error);
            return null;
        }
    }

    private async saveConversationForTraining(session: CallSession): Promise<void> {
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

        } catch (error) {
            logger.error('Error saving conversation for training:', error);
        }
    }

    private handleError(res: Response, message: string): void {
        const twiml = new VoiceResponse();
        twiml.say({ voice: 'alice' }, 'An error occurred. Please try again later.');
        twiml.hangup();
        res.type('text/xml');
        res.send(twiml.toString());
    }

    // Language-specific message methods
    private getGreeting(language: string): string {
        const greetings: Record<LanguageKey, string> = {
            'ml': 'നമസ്‌കാരം! ഫെയർഗോ ടാക്‌സി സേവനത്തിലേക്ക് സ്വാഗതം. എനിക്ക് നിങ്ങളെ സഹായിക്കാൻ കഴിയും.',
            'en': 'Hello! Welcome to FairGo Taxi Service. I can help you book a ride.',
            'ml-en': 'Hello! FairGo taxi service-ലേക്ക് സ്വാഗതം. ഞാൻ നിങ്ങളെ help ചെയ്യാം.'
        };
        return greetings[language as LanguageKey] || greetings['ml'];
    }

    private getBookingPrompt(language: string): string {
        const prompts: Record<LanguageKey, string> = {
            'ml': 'നിങ്ങൾ എവിടെ പോകണം? എനിക്ക് പറയാമോ?',
            'en': 'Where would you like to go? Please tell me your destination.',
            'ml-en': 'എവിടെ പോണം? Destination പറയാമോ?'
        };
        return prompts[language as LanguageKey] || prompts['ml'];
    }

    private getTimeoutMessage(language: string): string {
        const timeouts: Record<LanguageKey, string> = {
            'ml': 'ക്ഷമിക്കണം, എനിക്ക് കേൾക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും വിളിക്കുക.',
            'en': 'Sorry, I could not hear you. Please call back.',
            'ml-en': 'Sorry, കേൾക്കാൻ പറ്റിയില്ല. വീണ്ടും call ചെയ്യൂ.'
        };
        return timeouts[language as LanguageKey] || timeouts['ml'];
    }

    private getErrorMessage(language: string): string {
        const errors: Record<LanguageKey, string> = {
            'ml': 'എന്തോ തകരാർ സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.',
            'en': 'Something went wrong. Please try again.',
            'ml-en': 'എന്തോ problem ഉണ്ട്. വീണ്ടും try ചെയ്യൂ.'
        };
        return errors[language as LanguageKey] || errors['ml'];
    }

    private getConfirmationMessage(language: string): string {
        const confirmations: Record<LanguageKey, string> = {
            'ml': 'നിങ്ങളുടെ യാത്രാ വിവരങ്ങൾ ശരിയാണോ? ശരിയാണെങ്കിൽ "ഉവ്വ്" അല്ലെങ്കിൽ "Yes" എന്ന് പറയുക.',
            'en': 'Are your trip details correct? Say "Yes" to confirm or "No" to change.',
            'ml-en': 'Trip details ശരിയാണോ? "ഉവ്വ്" അല്ലെങ്കിൽ "Yes" പറയുക.'
        };
        return confirmations[language as LanguageKey] || confirmations['ml'];
    }

    private getFollowUpPrompt(language: string): string {
        const prompts: Record<LanguageKey, string> = {
            'ml': 'മറ്റേതെങ്കിലും വിവരങ്ങൾ വേണോ?',
            'en': 'Do you need any other information?',
            'ml-en': 'മറ്റെന്തെങ്കിലും വേണോ?'
        };
        return prompts[language as LanguageKey] || prompts['ml'];
    }

    private getModificationPrompt(language: string): string {
        const prompts: Record<LanguageKey, string> = {
            'ml': 'നിങ്ങൾ എന്താണ് മാറ്റാൻ ആഗ്രഹിക്കുന്നത്?',
            'en': 'What would you like to change?',
            'ml-en': 'എന്ത് change ചെയ്യണം?'
        };
        return prompts[language as LanguageKey] || prompts['ml'];
    }

    private generateBookingSummary(session: CallSession): string {
        const summaries: Record<LanguageKey, string> = {
            'ml': `നിങ്ങളുടെ യാത്ര: ${session.context.destination || 'സ്ഥലം വ്യക്തമല്ല'}, സമയം: ${session.context.pickupTime || 'ഇപ്പോൾ'}, വാഹനം: ${session.context.vehicleType || 'സാധാരണ'}`,
            'en': `Your trip: to ${session.context.destination || 'destination not clear'}, time: ${session.context.pickupTime || 'now'}, vehicle: ${session.context.vehicleType || 'standard'}`,
            'ml-en': `നിങ്ങളുടെ trip: ${session.context.destination || 'destination വ്യക്തമല്ല'}, time: ${session.context.pickupTime || 'ഇപ്പോൾ'}, vehicle: ${session.context.vehicleType || 'standard'}`
        };
        return summaries[session.language as LanguageKey] || summaries['ml'];
    }

    private getBookingSuccessMessage(language: string): string {
        const messages: Record<LanguageKey, string> = {
            'ml': 'നിങ്ങളുടെ ബുക്കിംഗ് സ്ഥിരീകരിച്ചു! ഡ്രൈവർ വിവരങ്ങൾ SMS ആയി അയച്ചിട്ടുണ്ട്. നന്ദി!',
            'en': 'Your booking is confirmed! Driver details have been sent via SMS. Thank you!',
            'ml-en': 'നിങ്ങളുടെ booking confirm ആയി! Driver details SMS അയച്ചു. Thank you!'
        };
        return messages[language as LanguageKey] || messages['ml'];
    }

    private getVoiceLanguage(language: string): string {
        const voiceLanguageMap: Record<VoiceLanguageKey, string> = {
            'ml': 'ml-IN',
            'en': 'en-US',
            'ml-en': 'ml-IN',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'te': 'te-IN'
        };
        return voiceLanguageMap[language as VoiceLanguageKey] || 'ml-IN';
    }

    private getSpeechLanguage(language: string): string {
        const speechLanguageMap: Record<VoiceLanguageKey, string> = {
            'ml': 'ml-IN',
            'en': 'en-US',
            'ml-en': 'ml-IN',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'te': 'te-IN'
        };
        return speechLanguageMap[language as VoiceLanguageKey] || 'ml-IN';
    }

    // Additional methods for the server routes
    handleSpeechInput = this.processSpeech;

    async handleCallStatus(req: Request, res: Response): Promise<void> {
        try {
            const { CallSid, CallStatus } = req.body;
            logger.info(`Call ${CallSid} status: ${CallStatus}`);
            res.status(200).send('OK');
        } catch (error) {
            logger.error('Error handling call status:', error);
            res.status(500).send('Error');
        }
    }

    async getCallStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await this.sessionManager.getCallStatistics();
            res.json(stats);
        } catch (error) {
            logger.error('Error getting call stats:', error);
            res.status(500).json({ error: 'Failed to get stats' });
        }
    }

    async reloadModel(req: Request, res: Response): Promise<void> {
        try {
            await this.aiService.reloadModel();
            res.json({ success: true, message: 'Model reloaded successfully' });
        } catch (error) {
            logger.error('Error reloading model:', error);
            res.status(500).json({ error: 'Failed to reload model' });
        }
    }
}