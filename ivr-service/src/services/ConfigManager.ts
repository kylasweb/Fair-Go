import axios from 'axios';

export class ConfigManager {
    private config: Map<string, string> = new Map();
    private lastUpdate: Date = new Date(0);
    private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

    async getConfig(key: string): Promise<string | null> {
        await this.refreshConfigIfNeeded();
        return this.config.get(key) || null;
    }

    async getActiveModelId(): Promise<string> {
        const modelId = await this.getConfig('active_ai_model_id');
        return modelId || 'base_model';
    }

    async getAllConfig(): Promise<Map<string, string>> {
        await this.refreshConfigIfNeeded();
        return new Map(this.config);
    }

    async updateConfig(key: string, value: string): Promise<void> {
        try {
            // Update in main app database
            const response = await axios.patch(
                `${process.env.FAIRGO_API_URL}/api/admin/config`,
                { key, value },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.FAIRGO_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // Update local cache
                this.config.set(key, value);
            }
        } catch (error) {
            console.error('Error updating config:', error);
            throw new Error(`Failed to update configuration: ${key}`);
        }
    }

    private async refreshConfigIfNeeded(): Promise<void> {
        const now = new Date();
        if (now.getTime() - this.lastUpdate.getTime() > this.cacheTimeout) {
            await this.loadConfig();
        }
    }

    private async loadConfig(): Promise<void> {
        try {
            const response = await axios.get(
                `${process.env.FAIRGO_API_URL}/api/admin/config`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.FAIRGO_API_KEY}`
                    }
                }
            );

            if (response.status === 200 && Array.isArray(response.data)) {
                this.config.clear();
                response.data.forEach((item: any) => {
                    this.config.set(item.key, item.value);
                });
                this.lastUpdate = new Date();
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
            // Use default values if config loading fails
            this.setDefaults();
        }
    }

    private setDefaults(): void {
        this.config.set('active_ai_model_id', 'base_model');
        this.config.set('default_language', 'ml');
        this.config.set('max_retry_attempts', '3');
        this.config.set('speech_timeout', '5');
        this.lastUpdate = new Date();
    }
}