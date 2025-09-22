"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
class SessionManager {
    constructor(redisClient) {
        this.redisClient = redisClient;
        this.sessionTTL = parseInt(process.env.REDIS_SESSION_TTL || '1800'); // 30 minutes default
    }
    async createSession(sessionId, data) {
        try {
            const key = `session:${sessionId}`;
            await this.redisClient.setEx(key, this.sessionTTL, JSON.stringify(data));
        }
        catch (error) {
            console.error('Error creating session:', error);
            throw new Error('Failed to create session');
        }
    }
    async getSession(sessionId) {
        try {
            const key = `session:${sessionId}`;
            const data = await this.redisClient.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }
    async updateSession(sessionId, data) {
        try {
            const key = `session:${sessionId}`;
            await this.redisClient.setEx(key, this.sessionTTL, JSON.stringify(data));
        }
        catch (error) {
            console.error('Error updating session:', error);
            throw new Error('Failed to update session');
        }
    }
    async deleteSession(sessionId) {
        try {
            const key = `session:${sessionId}`;
            await this.redisClient.del(key);
        }
        catch (error) {
            console.error('Error deleting session:', error);
        }
    }
    async extendSession(sessionId) {
        try {
            const key = `session:${sessionId}`;
            await this.redisClient.expire(key, this.sessionTTL);
        }
        catch (error) {
            console.error('Error extending session:', error);
        }
    }
    async getAllActiveSessions() {
        try {
            const keys = await this.redisClient.keys('session:*');
            const sessions = [];
            for (const key of keys) {
                const data = await this.redisClient.get(key);
                if (data) {
                    sessions.push(JSON.parse(data));
                }
            }
            return sessions;
        }
        catch (error) {
            console.error('Error getting all sessions:', error);
            return [];
        }
    }
    async findSessionByCallSid(callSid) {
        try {
            const keys = await this.redisClient.keys('session:*');
            for (const key of keys) {
                const data = await this.redisClient.get(key);
                if (data) {
                    const session = JSON.parse(data);
                    if (session.callSid === callSid) {
                        return key.replace('session:', '');
                    }
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error finding session by call SID:', error);
            return null;
        }
    }
    async getCallStatistics() {
        try {
            const sessions = await this.getAllActiveSessions();
            const stats = {
                activeCalls: sessions.length,
                callsByLanguage: {},
                callsByState: {},
                averageCallDuration: 0,
                totalCalls: sessions.length
            };
            sessions.forEach(session => {
                // Count by language
                const lang = session.language || 'unknown';
                stats.callsByLanguage[lang] = (stats.callsByLanguage[lang] || 0) + 1;
                // Count by state
                const state = session.state || 'unknown';
                stats.callsByState[state] = (stats.callsByState[state] || 0) + 1;
            });
            return stats;
        }
        catch (error) {
            console.error('Error getting call statistics:', error);
            return {
                activeCalls: 0,
                callsByLanguage: {},
                callsByState: {},
                averageCallDuration: 0,
                totalCalls: 0
            };
        }
    }
    async cleanup() {
        try {
            // Clean up expired sessions (Redis handles TTL automatically)
            // But we can implement additional cleanup logic here if needed
            const keys = await this.redisClient.keys('session:*');
            console.log(`Session cleanup check: ${keys.length} active sessions`);
        }
        catch (error) {
            console.error('Error during session cleanup:', error);
        }
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=SessionManager.js.map