export type CallState = 'welcome' | 'destination' | 'pickup_time' | 'vehicle_preference' | 'confirmation' | 'booking' | 'end';
export interface BookingContext {
    destination?: string;
    pickupTime?: string;
    vehicleType?: string;
    fareAmount?: number;
    estimatedDuration?: number;
    customerName?: string;
    bookingId?: string;
    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}
export interface CallSession {
    sessionId: string;
    phoneNumber: string;
    language: string;
    state: CallState;
    context: BookingContext;
    startTime: Date;
    lastActivity: Date;
}
export interface SessionData extends CallSession {
    [key: string]: any;
}
export interface IVRRequest {
    CallSid: string;
    From: string;
    To: string;
    SpeechResult?: string;
    Digits?: string;
}
export interface AIResponse {
    message: string;
    action?: string;
    data?: any;
    confidence?: number;
}
export interface TrainingData {
    input: string;
    output: string;
    language: string;
    sessionId: string;
    timestamp: Date;
}
//# sourceMappingURL=index.d.ts.map