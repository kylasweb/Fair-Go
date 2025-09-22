"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
const twilio_1 = __importDefault(require("twilio"));
class TwilioService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!this.accountSid || !this.authToken || !this.phoneNumber) {
            throw new Error('Missing required Twilio environment variables');
        }
        this.client = (0, twilio_1.default)(this.accountSid, this.authToken);
    }
    createTwiML() {
        return new twilio_1.default.twiml.VoiceResponse();
    }
    async makeOutboundCall(to, webhookUrl) {
        try {
            const call = await this.client.calls.create({
                to,
                from: this.phoneNumber,
                url: webhookUrl,
                method: 'POST'
            });
            return call;
        }
        catch (error) {
            console.error('Error making outbound call:', error);
            throw error;
        }
    }
    async sendSMS(to, message) {
        try {
            const sms = await this.client.messages.create({
                to,
                from: this.phoneNumber,
                body: message
            });
            return sms;
        }
        catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }
    async getCallDetails(callSid) {
        try {
            const call = await this.client.calls(callSid).fetch();
            return call;
        }
        catch (error) {
            console.error('Error fetching call details:', error);
            throw error;
        }
    }
    async hangupCall(callSid) {
        try {
            const call = await this.client.calls(callSid).update({
                status: 'completed'
            });
            return call;
        }
        catch (error) {
            console.error('Error hanging up call:', error);
            throw error;
        }
    }
    async getCallLogs(limit = 50) {
        try {
            const calls = await this.client.calls.list({ limit });
            return calls;
        }
        catch (error) {
            console.error('Error fetching call logs:', error);
            throw error;
        }
    }
    validateWebhookSignature(signature, url, params) {
        try {
            return twilio_1.default.validateRequest(this.authToken, signature, url, params);
        }
        catch (error) {
            console.error('Error validating webhook signature:', error);
            return false;
        }
    }
    formatPhoneNumber(phoneNumber) {
        // Basic phone number formatting for Indian numbers
        let formatted = phoneNumber.replace(/\D/g, '');
        if (formatted.startsWith('91') && formatted.length === 12) {
            return `+${formatted}`;
        }
        else if (formatted.length === 10) {
            return `+91${formatted}`;
        }
        else if (formatted.startsWith('+')) {
            return phoneNumber;
        }
        return `+91${formatted}`;
    }
    getVoiceLanguageCode(language) {
        const languageMap = {
            'ml': 'ml-IN',
            'en': 'en-IN',
            'ml-en': 'ml-IN',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'te': 'te-IN'
        };
        return languageMap[language] || 'ml-IN';
    }
    getSpeechLanguageCode(language) {
        const languageMap = {
            'ml': 'ml-IN',
            'en': 'en-IN',
            'ml-en': 'ml-IN',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'te': 'te-IN'
        };
        return languageMap[language] || 'ml-IN';
    }
    async sendBookingConfirmationSMS(to, bookingDetails) {
        const message = this.generateBookingConfirmationMessage(bookingDetails);
        return this.sendSMS(to, message);
    }
    generateBookingConfirmationMessage(booking) {
        // Generate localized booking confirmation message
        const templates = {
            'ml': `നിങ്ങളുടെ FairGo ബുക്കിംഗ് സ്ഥിരീകരിച്ചു! 
📍 ${booking.pickup} ➜ ${booking.dropoff}
🚗 ഡ്രൈവർ: ${booking.driverName}
📞 ${booking.driverPhone}
🆔 ബുക്കിംഗ് ID: ${booking.id}`,
            'en': `Your FairGo booking is confirmed!
📍 ${booking.pickup} ➜ ${booking.dropoff}  
🚗 Driver: ${booking.driverName}
📞 ${booking.driverPhone}
🆔 Booking ID: ${booking.id}`,
            'ml-en': `Ningalde FairGo booking confirm aayi!
📍 ${booking.pickup} ➜ ${booking.dropoff}
🚗 Driver: ${booking.driverName}  
📞 ${booking.driverPhone}
🆔 Booking ID: ${booking.id}`
        };
        return templates[booking.language] || templates['ml'];
    }
    async createConferenceCall(participants, webhookUrl) {
        try {
            const calls = [];
            for (const participant of participants) {
                const call = await this.makeOutboundCall(participant, webhookUrl);
                calls.push(call);
            }
            return calls;
        }
        catch (error) {
            console.error('Error creating conference call:', error);
            throw error;
        }
    }
    async recordCall(callSid) {
        try {
            const recording = await this.client.calls(callSid).recordings.create();
            return recording;
        }
        catch (error) {
            console.error('Error recording call:', error);
            throw error;
        }
    }
    getPhoneNumberInfo() {
        return {
            accountSid: this.accountSid,
            phoneNumber: this.phoneNumber
        };
    }
}
exports.TwilioService = TwilioService;
//# sourceMappingURL=TwilioService.js.map