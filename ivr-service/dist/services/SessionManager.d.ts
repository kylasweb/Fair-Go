interface SessionData {
    [key: string]: any;
}
export declare class SessionManager {
    private redisClient;
    private readonly sessionTTL;
    constructor(redisClient: any);
    createSession(sessionId: string, data: SessionData): Promise<void>;
    getSession(sessionId: string): Promise<SessionData | null>;
    updateSession(sessionId: string, data: SessionData): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
    extendSession(sessionId: string): Promise<void>;
    getAllActiveSessions(): Promise<SessionData[]>;
    findSessionByCallSid(callSid: string): Promise<string | null>;
    getCallStatistics(): Promise<any>;
    cleanup(): Promise<void>;
}
export {};
//# sourceMappingURL=SessionManager.d.ts.map