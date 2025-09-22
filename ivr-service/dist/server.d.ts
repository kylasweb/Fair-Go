declare class IVRServer {
    private app;
    private redisClient;
    private ivrController;
    constructor();
    private setupMiddleware;
    private initializeServices;
    private setupRoutes;
    start(): Promise<void>;
    private shutdown;
}
export { IVRServer };
//# sourceMappingURL=server.d.ts.map