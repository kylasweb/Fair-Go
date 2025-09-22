import twilio from 'twilio';

export class TwilioService {
    private client: twilio.Twilio;
    private accountSid: string;
    private authToken: string;
    private phoneNumber: string;

    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID!;
        this.authToken = process.env.TWILIO_AUTH_TOKEN!;
        this.phoneNumber = process.env.TWILIO_PHONE_NUMBER!;

        if (!this.accountSid || !this.authToken || !this.phoneNumber) {
            throw new Error('Missing required Twilio environment variables');
        }

        this.client = twilio(this.accountSid, this.authToken);
    }

    createTwiML(): twilio.twiml.VoiceResponse {
        return new twilio.twiml.VoiceResponse();
    }

    async makeOutboundCall(to: string, webhookUrl: string): Promise<any> {
        try {
            const call = await this.client.calls.create({
                to,
                from: this.phoneNumber,
                url: webhookUrl,
                method: 'POST'
            });
            return call;
        } catch (error) {
            console.error('Error making outbound call:', error);
            throw error;
        }
    }

    async sendSMS(to: string, message: string): Promise<any> {
        try {
            const sms = await this.client.messages.create({
                to,
                from: this.phoneNumber,
                body: message
            });
            return sms;
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }

    async getCallDetails(callSid: string): Promise<any> {
        try {
            const call = await this.client.calls(callSid).fetch();
            return call;
        } catch (error) {
            console.error('Error fetching call details:', error);
            throw error;
        }
    }

    async hangupCall(callSid: string): Promise<any> {
        try {
            const call = await this.client.calls(callSid).update({
                status: 'completed'
            });
            return call;
        } catch (error) {
            console.error('Error hanging up call:', error);
            throw error;
        }
    }

    async getCallLogs(limit: number = 50): Promise<any[]> {
        try {
            const calls = await this.client.calls.list({ limit });
            return calls;
        } catch (error) {
            console.error('Error fetching call logs:', error);
            throw error;
        }
    }

    validateWebhookSignature(signature: string, url: string, params: any): boolean {
        try {
            return twilio.validateRequest(this.authToken, signature, url, params);
        } catch (error) {
            console.error('Error validating webhook signature:', error);
            return false;
        }
    }

    formatPhoneNumber(phoneNumber: string): string {
        // Basic phone number formatting for Indian numbers
        let formatted = phoneNumber.replace(/\D/g, '');

        if (formatted.startsWith('91') && formatted.length === 12) {
            return `+${formatted}`;
        } else if (formatted.length === 10) {
            return `+91${formatted}`;
        } else if (formatted.startsWith('+')) {
            return phoneNumber;
        }

        return `+91${formatted}`;
    }

    getVoiceLanguageCode(language: string): string {
        const languageMap: { [key: string]: string } = {
            'ml': 'ml-IN',
            'en': 'en-IN',
            'ml-en': 'ml-IN',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'te': 'te-IN'
        };

        return languageMap[language] || 'ml-IN';
    }

    getSpeechLanguageCode(language: string): string {
        const languageMap: { [key: string]: string } = {
            'ml': 'ml-IN',
            'en': 'en-IN',
            'ml-en': 'ml-IN',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'te': 'te-IN'
        };

        return languageMap[language] || 'ml-IN';
    }

    async sendBookingConfirmationSMS(to: string, bookingDetails: any): Promise<any> {
        const message = this.generateBookingConfirmationMessage(bookingDetails);
        return this.sendSMS(to, message);
    }

    private generateBookingConfirmationMessage(booking: any): string {
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

        return templates[booking.language as 'ml' | 'en' | 'ml-en'] || templates['ml'];
    }

    async createConferenceCall(participants: string[], webhookUrl: string): Promise<any[]> {
        try {
            const calls: any[] = [];
            for (const participant of participants) {
                const call = await this.makeOutboundCall(participant, webhookUrl);
                calls.push(call);
            }
            return calls;
        } catch (error) {
            console.error('Error creating conference call:', error);
            throw error;
        }
    }

    async recordCall(callSid: string): Promise<any> {
        try {
            const recording = await this.client.calls(callSid).recordings.create();
            return recording;
        } catch (error) {
            console.error('Error recording call:', error);
            throw error;
        }
    }

    getPhoneNumberInfo(): { accountSid: string; phoneNumber: string } {
        return {
            accountSid: this.accountSid,
            phoneNumber: this.phoneNumber
        };
    }
}