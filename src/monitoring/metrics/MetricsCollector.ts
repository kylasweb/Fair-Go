import { Registry, Histogram, Counter, Gauge, collectDefaultMetrics } from 'prom-client';

class MetricsCollector {
    private static instance: MetricsCollector;
    private registry: Registry;
    private initialized = false;

    // HTTP Metrics
    public httpRequestDuration!: Histogram<string>;
    public httpRequestsTotal!: Counter<string>;
    public httpRequestErrors!: Counter<string>;

    // Business Metrics
    public activeBookings!: Gauge<string>;
    public totalBookings!: Counter<string>;
    public bookingCompletionRate!: Gauge<string>;
    public driverAvailability!: Gauge<string>;
    public averageRating!: Gauge<string>;

    // AI Model Metrics
    public aiModelLatency!: Histogram<string>;
    public aiModelAccuracy!: Gauge<string>;
    public aiTrainingJobs!: Counter<string>;
    public aiModelDrift!: Gauge<string>;

    // System Metrics
    public databaseConnections!: Gauge<string>;
    public redisConnections!: Gauge<string>;
    public activeWebsockets!: Gauge<string>;
    public memoryUsage!: Gauge<string>;
    public cpuUsage!: Gauge<string>;

    // Security Metrics
    public authenticationAttempts!: Counter<string>;
    public authenticationFailures!: Counter<string>;
    public suspiciousActivity!: Counter<string>;
    public dataAccessEvents!: Counter<string>;

    // Alert Metrics
    public alertsFired!: Counter<string>;
    public alertsResolved!: Counter<string>;
    public notificationsSent!: Counter<string>;
    public notificationErrors!: Counter<string>;

    constructor() {
        this.registry = new Registry();
        this.initializeMetrics();
    }

    public static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    private initializeMetrics() {
        if (this.initialized) return;

        // Collect default Node.js metrics
        collectDefaultMetrics({ register: this.registry });

        // HTTP Metrics
        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code', 'user_type'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
            registers: [this.registry]
        });

        this.httpRequestsTotal = new Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code', 'user_type'],
            registers: [this.registry]
        });

        this.httpRequestErrors = new Counter({
            name: 'http_request_errors_total',
            help: 'Total number of HTTP request errors',
            labelNames: ['method', 'route', 'error_type', 'status_code'],
            registers: [this.registry]
        });

        // Business Metrics
        this.activeBookings = new Gauge({
            name: 'fairgo_active_bookings',
            help: 'Number of currently active bookings',
            labelNames: ['status', 'vehicle_type', 'language'],
            registers: [this.registry]
        });

        this.totalBookings = new Counter({
            name: 'fairgo_bookings_total',
            help: 'Total number of bookings created',
            labelNames: ['vehicle_type', 'language', 'booking_source'],
            registers: [this.registry]
        });

        this.bookingCompletionRate = new Gauge({
            name: 'fairgo_booking_completion_rate',
            help: 'Rate of successful booking completions',
            labelNames: ['vehicle_type', 'time_period'],
            registers: [this.registry]
        });

        this.driverAvailability = new Gauge({
            name: 'fairgo_driver_availability',
            help: 'Number of available drivers by vehicle type',
            labelNames: ['vehicle_type', 'location_zone'],
            registers: [this.registry]
        });

        this.averageRating = new Gauge({
            name: 'fairgo_average_rating',
            help: 'Average rating by service type',
            labelNames: ['service_type', 'time_period'],
            registers: [this.registry]
        });

        // AI Model Metrics
        this.aiModelLatency = new Histogram({
            name: 'fairgo_ai_model_latency_seconds',
            help: 'AI model response time in seconds',
            labelNames: ['model_type', 'language', 'input_type'],
            buckets: [0.1, 0.2, 0.5, 1, 2, 5, 10],
            registers: [this.registry]
        });

        this.aiModelAccuracy = new Gauge({
            name: 'fairgo_ai_model_accuracy',
            help: 'AI model accuracy score',
            labelNames: ['model_type', 'language', 'evaluation_type'],
            registers: [this.registry]
        });

        this.aiTrainingJobs = new Counter({
            name: 'fairgo_ai_training_jobs_total',
            help: 'Total number of AI training jobs',
            labelNames: ['job_type', 'status', 'model_type'],
            registers: [this.registry]
        });

        this.aiModelDrift = new Gauge({
            name: 'fairgo_ai_model_drift',
            help: 'AI model drift detection score',
            labelNames: ['model_type', 'metric_type'],
            registers: [this.registry]
        });

        // System Metrics
        this.databaseConnections = new Gauge({
            name: 'fairgo_database_connections',
            help: 'Number of active database connections',
            labelNames: ['database_type', 'status'],
            registers: [this.registry]
        });

        this.redisConnections = new Gauge({
            name: 'fairgo_redis_connections',
            help: 'Number of active Redis connections',
            labelNames: ['instance', 'status'],
            registers: [this.registry]
        });

        this.activeWebsockets = new Gauge({
            name: 'fairgo_websocket_connections',
            help: 'Number of active WebSocket connections',
            labelNames: ['connection_type', 'user_type'],
            registers: [this.registry]
        });

        this.memoryUsage = new Gauge({
            name: 'fairgo_memory_usage_mb',
            help: 'Memory usage in megabytes',
            labelNames: ['type'],
            registers: [this.registry]
        });

        this.cpuUsage = new Gauge({
            name: 'fairgo_cpu_usage_microseconds',
            help: 'CPU usage in microseconds',
            labelNames: ['type'],
            registers: [this.registry]
        });

        // Security Metrics
        this.authenticationAttempts = new Counter({
            name: 'fairgo_auth_attempts_total',
            help: 'Total authentication attempts',
            labelNames: ['auth_type', 'user_type', 'result'],
            registers: [this.registry]
        });

        this.authenticationFailures = new Counter({
            name: 'fairgo_auth_failures_total',
            help: 'Total authentication failures',
            labelNames: ['auth_type', 'failure_reason', 'ip_address'],
            registers: [this.registry]
        });

        this.suspiciousActivity = new Counter({
            name: 'fairgo_suspicious_activity_total',
            help: 'Total suspicious activity events',
            labelNames: ['activity_type', 'severity', 'source'],
            registers: [this.registry]
        });

        this.dataAccessEvents = new Counter({
            name: 'fairgo_data_access_total',
            help: 'Total data access events for audit',
            labelNames: ['resource', 'action', 'user_role', 'access_granted'],
            registers: [this.registry]
        });

        // Alert Metrics
        this.alertsFired = new Counter({
            name: 'fairgo_alerts_fired_total',
            help: 'Total number of alerts fired',
            labelNames: ['severity', 'service', 'type'],
            registers: [this.registry]
        });

        this.alertsResolved = new Counter({
            name: 'fairgo_alerts_resolved_total',
            help: 'Total number of alerts resolved',
            labelNames: ['severity', 'service'],
            registers: [this.registry]
        });

        this.notificationsSent = new Counter({
            name: 'fairgo_notifications_sent_total',
            help: 'Total number of notifications sent',
            labelNames: ['channel', 'alert_severity', 'success'],
            registers: [this.registry]
        });

        this.notificationErrors = new Counter({
            name: 'fairgo_notification_errors_total',
            help: 'Total number of notification failures',
            labelNames: ['channel', 'error_type'],
            registers: [this.registry]
        });

        this.initialized = true;
    }

    public getRegistry(): Registry {
        return this.registry;
    }

    public getMetrics(): Promise<string> {
        return this.registry.metrics();
    }

    // Helper methods for common metric operations
    public recordHttpRequest(method: string, route: string, statusCode: number, duration: number, userType: string = 'anonymous') {
        const labels = { method, route, status_code: statusCode.toString(), user_type: userType };
        this.httpRequestsTotal.inc(labels);
        this.httpRequestDuration.observe(labels, duration);

        if (statusCode >= 400) {
            this.httpRequestErrors.inc({
                method,
                route,
                error_type: statusCode >= 500 ? 'server_error' : 'client_error',
                status_code: statusCode.toString()
            });
        }
    }

    public recordBooking(vehicleType: string, language: string, source: string = 'web') {
        this.totalBookings.inc({ vehicle_type: vehicleType, language, booking_source: source });
    }

    public updateActiveBookings(count: number, status: string, vehicleType: string, language: string) {
        this.activeBookings.set({ status, vehicle_type: vehicleType, language }, count);
    }

    public recordAIModelLatency(modelType: string, language: string, inputType: string, latency: number) {
        this.aiModelLatency.observe({ model_type: modelType, language, input_type: inputType }, latency);
    }

    public updateAIModelAccuracy(modelType: string, language: string, evaluationType: string, accuracy: number) {
        this.aiModelAccuracy.set({ model_type: modelType, language, evaluation_type: evaluationType }, accuracy);
    }

    public recordAuthAttempt(authType: string, userType: string, result: 'success' | 'failure') {
        this.authenticationAttempts.inc({ auth_type: authType, user_type: userType, result });

        if (result === 'failure') {
            // Also record in failures counter with more detail
            this.authenticationFailures.inc({
                auth_type: authType,
                failure_reason: 'invalid_credentials',
                ip_address: 'unknown'
            });
        }
    }

    public recordSuspiciousActivity(activityType: string, severity: 'low' | 'medium' | 'high' | 'critical', source: string) {
        this.suspiciousActivity.inc({ activity_type: activityType, severity, source });
    }

    public recordDataAccess(resource: string, action: string, userRole: string, accessGranted: boolean) {
        this.dataAccessEvents.inc({
            resource,
            action,
            user_role: userRole,
            access_granted: accessGranted.toString()
        });
    }

    // System health metrics
    public updateSystemHealth() {
        // Update memory usage
        const memUsage = process.memoryUsage();
        this.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed / 1024 / 1024); // MB
        this.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal / 1024 / 1024); // MB
        this.memoryUsage.set({ type: 'rss' }, memUsage.rss / 1024 / 1024); // MB
    }

    // Cleanup method
    public reset() {
        this.registry.clear();
        this.initialized = false;
        this.initializeMetrics();
    }
}

export const metricsCollector = MetricsCollector.getInstance();
export default MetricsCollector;