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
export declare class AIService {
    private configManager;
    private currentModelId;
    constructor(configManager: ConfigManager);
    processVoiceInput(input: VoiceInput): Promise<AIResponse>;
    reloadModel(): Promise<void>;
    private loadActiveModel;
    private refreshModelIfNeeded;
    private saveTrainingExample;
    private getFallbackResponse;
    testConnection(): Promise<boolean>;
    getModelInfo(): {
        modelId: string;
        lastUpdate: Date;
    };
}
export {};
//# sourceMappingURL=AIService.d.ts.map