export declare class ConfigManager {
    private config;
    private lastUpdate;
    private readonly cacheTimeout;
    getConfig(key: string): Promise<string | null>;
    getActiveModelId(): Promise<string>;
    getAllConfig(): Promise<Map<string, string>>;
    updateConfig(key: string, value: string): Promise<void>;
    private refreshConfigIfNeeded;
    private loadConfig;
    private setDefaults;
}
//# sourceMappingURL=ConfigManager.d.ts.map