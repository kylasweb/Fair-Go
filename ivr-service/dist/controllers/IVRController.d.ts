import { Request, Response } from 'express';
import { SessionManager } from '../services/SessionManager';
import { AIService } from '../services/AIService';
import { TwilioService } from '../services/TwilioService';
export declare class IVRController {
    private sessionManager;
    private aiService;
    private twilioService;
    constructor(sessionManager: SessionManager, aiService: AIService, twilioService: TwilioService);
    handleIncomingCall(req: Request, res: Response): Promise<void>;
    processSpeech(req: Request, res: Response): Promise<void>;
    confirmBooking(req: Request, res: Response): Promise<void>;
    handleCallComplete(req: Request, res: Response): Promise<void>;
    getActiveSessions(req: Request, res: Response): Promise<void>;
    private processWithAI;
    private createTwiMLResponse;
    private createConfirmationTwiML;
    private createModificationTwiML;
    private processBooking;
    private saveConversationForTraining;
    private handleError;
    private getGreeting;
    private getBookingPrompt;
    private getTimeoutMessage;
    private getErrorMessage;
    private getConfirmationMessage;
    private getFollowUpPrompt;
    private getModificationPrompt;
    private generateBookingSummary;
    private getBookingSuccessMessage;
    private getVoiceLanguage;
    private getSpeechLanguage;
    handleSpeechInput: (req: Request, res: Response) => Promise<void>;
    handleCallStatus(req: Request, res: Response): Promise<void>;
    getCallStats(req: Request, res: Response): Promise<void>;
    reloadModel(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=IVRController.d.ts.map