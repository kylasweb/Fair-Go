"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const axios_1 = __importDefault(require("axios"));
class ConfigManager {
    constructor() {
        this.config = new Map();
        this.lastUpdate = new Date(0);
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    async getConfig(key) {
        await this.refreshConfigIfNeeded();
        return this.config.get(key) || null;
    }
    async getActiveModelId() {
        const modelId = await this.getConfig('active_ai_model_id');
        return modelId || 'base_model';
    }
    async getAllConfig() {
        await this.refreshConfigIfNeeded();
        return new Map(this.config);
    }
    async updateConfig(key, value) {
        try {
            // Update in main app database
            const response = await axios_1.default.patch(`${process.env.FAIRGO_API_URL}/api/admin/config`, { key, value }, {
                headers: {
                    'Authorization': `Bearer ${process.env.FAIRGO_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 200) {
                // Update local cache
                this.config.set(key, value);
            }
        }
        catch (error) {
            console.error('Error updating config:', error);
            throw new Error(`Failed to update configuration: ${key}`);
        }
    }
    async refreshConfigIfNeeded() {
        const now = new Date();
        if (now.getTime() - this.lastUpdate.getTime() > this.cacheTimeout) {
            await this.loadConfig();
        }
    }
    async loadConfig() {
        try {
            const response = await axios_1.default.get(`${process.env.FAIRGO_API_URL}/api/admin/config`, {
                headers: {
                    'Authorization': `Bearer ${process.env.FAIRGO_API_KEY}`
                }
            });
            if (response.status === 200 && Array.isArray(response.data)) {
                this.config.clear();
                response.data.forEach((item) => {
                    this.config.set(item.key, item.value);
                });
                this.lastUpdate = new Date();
            }
        }
        catch (error) {
            console.error('Error loading configuration:', error);
            // Use default values if config loading fails
            this.setDefaults();
        }
    }
    setDefaults() {
        this.config.set('active_ai_model_id', 'base_model');
        this.config.set('default_language', 'ml');
        this.config.set('max_retry_attempts', '3');
        this.config.set('speech_timeout', '5');
        this.lastUpdate = new Date();
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map