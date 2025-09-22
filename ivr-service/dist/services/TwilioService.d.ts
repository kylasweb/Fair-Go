import twilio from 'twilio';
export declare class TwilioService {
    private client;
    private accountSid;
    private authToken;
    private phoneNumber;
    constructor();
    createTwiML(): twilio.twiml.VoiceResponse;
    makeOutboundCall(to: string, webhookUrl: string): Promise<any>;
    sendSMS(to: string, message: string): Promise<any>;
    getCallDetails(callSid: string): Promise<any>;
    hangupCall(callSid: string): Promise<any>;
    getCallLogs(limit?: number): Promise<any[]>;
    validateWebhookSignature(signature: string, url: string, params: any): boolean;
    formatPhoneNumber(phoneNumber: string): string;
    getVoiceLanguageCode(language: string): string;
    getSpeechLanguageCode(language: string): string;
    sendBookingConfirmationSMS(to: string, bookingDetails: any): Promise<any>;
    private generateBookingConfirmationMessage;
    createConferenceCall(participants: string[], webhookUrl: string): Promise<any[]>;
    recordCall(callSid: string): Promise<any>;
    getPhoneNumberInfo(): {
        accountSid: string;
        phoneNumber: string;
    };
}
//# sourceMappingURL=TwilioService.d.ts.map