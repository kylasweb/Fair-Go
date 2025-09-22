/**
 * FairGo External API Integration Service
 * Provides comprehensive connectivity to external services including:
 * - Payment Gateways (Razorpay, Paytm, PhonePe, Google Pay)
 * - Mapping Services (Google Maps, MapmyIndia)
 * - Vehicle Tracking Systems
 * - Third-party Booking Platforms
 * - Emergency Services Integration
 * - Driver Background Verification Services
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import winston from 'winston';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface ExternalServiceConfig {
    name: string;
    baseUrl: string;
    apiKey?: string;
    secretKey?: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    rateLimitPerMinute: number;
    isEnabled: boolean;
    headers?: Record<string, string>;
    authentication?: {
        type: 'bearer' | 'basic' | 'custom' | 'oauth2';
        credentials: Record<string, string>;
    };
}

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode: number;
    responseTime: number;
    requestId: string;
}

export interface PaymentGatewayRequest {
    amount: number;
    currency: string;
    orderId: string;
    customerId: string;
    customerEmail: string;
    customerPhone: string;
    description: string;
    callbackUrl?: string;
    metadata?: Record<string, any>;
}

export interface MappingServiceRequest {
    origin: {
        latitude: number;
        longitude: number;
    };
    destination: {
        latitude: number;
        longitude: number;
    };
    waypoints?: Array<{
        latitude: number;
        longitude: number;
    }>;
    travelMode?: 'driving' | 'walking' | 'transit' | 'bicycling';
    avoidTolls?: boolean;
    avoidHighways?: boolean;
}

export interface VehicleTrackingRequest {
    vehicleId: string;
    driverId: string;
    trackingType: 'location' | 'route' | 'status' | 'diagnostics';
    timeRange?: {
        startTime: Date;
        endTime: Date;
    };
}

export interface BookingPlatformRequest {
    bookingDetails: {
        pickupLocation: string;
        dropoffLocation: string;
        scheduledTime?: Date;
        passengerCount: number;
        vehicleType: string;
        specialRequests?: string[];
    };
    customerInfo: {
        name: string;
        phone: string;
        email?: string;
    };
    platformId: string;
    partnerBookingId?: string;
}

export class ExternalAPIService extends EventEmitter {
    private logger!: winston.Logger;
    private serviceConfigs: Map<string, ExternalServiceConfig>;
    private axiosInstances: Map<string, AxiosInstance>;
    private requestCounts: Map<string, number>;
    private lastResetTime: Date;

    // Service configurations
    private defaultConfigs: Record<string, ExternalServiceConfig> = {
        razorpay: {
            name: 'Razorpay',
            baseUrl: 'https://api.razorpay.com/v1',
            timeout: 10000,
            retryAttempts: 3,
            retryDelay: 1000,
            rateLimitPerMinute: 100,
            isEnabled: false,
            authentication: {
                type: 'basic',
                credentials: {}
            }
        },
        paytm: {
            name: 'Paytm',
            baseUrl: 'https://securegw.paytm.in/theia/api/v1',
            timeout: 10000,
            retryAttempts: 3,
            retryDelay: 1000,
            rateLimitPerMinute: 200,
            isEnabled: false,
            authentication: {
                type: 'custom',
                credentials: {}
            }
        },
        googlemaps: {
            name: 'Google Maps',
            baseUrl: 'https://maps.googleapis.com/maps/api',
            timeout: 5000,
            retryAttempts: 2,
            retryDelay: 500,
            rateLimitPerMinute: 1000,
            isEnabled: false,
            authentication: {
                type: 'bearer',
                credentials: {}
            }
        },
        mapmyindia: {
            name: 'MapmyIndia',
            baseUrl: 'https://apis.mapmyindia.com',
            timeout: 5000,
            retryAttempts: 2,
            retryDelay: 500,
            rateLimitPerMinute: 500,
            isEnabled: false,
            authentication: {
                type: 'bearer',
                credentials: {}
            }
        },
        vehicletracking: {
            name: 'Vehicle Tracking System',
            baseUrl: 'https://api.vehicletracking.com/v2',
            timeout: 8000,
            retryAttempts: 3,
            retryDelay: 1500,
            rateLimitPerMinute: 300,
            isEnabled: false,
            authentication: {
                type: 'bearer',
                credentials: {}
            }
        },
        ola: {
            name: 'Ola Partner API',
            baseUrl: 'https://partners.olacabs.com/api/v1',
            timeout: 12000,
            retryAttempts: 2,
            retryDelay: 2000,
            rateLimitPerMinute: 50,
            isEnabled: false,
            authentication: {
                type: 'oauth2',
                credentials: {}
            }
        },
        uber: {
            name: 'Uber API',
            baseUrl: 'https://api.uber.com/v1.2',
            timeout: 12000,
            retryAttempts: 2,
            retryDelay: 2000,
            rateLimitPerMinute: 100,
            isEnabled: false,
            authentication: {
                type: 'bearer',
                credentials: {}
            }
        },
        emergencyservices: {
            name: 'Emergency Services',
            baseUrl: 'https://emergency-api.kerala.gov.in/v1',
            timeout: 3000,
            retryAttempts: 5,
            retryDelay: 500,
            rateLimitPerMinute: 1000,
            isEnabled: false,
            authentication: {
                type: 'bearer',
                credentials: {}
            }
        }
    };

    constructor() {
        super();

        this.serviceConfigs = new Map();
        this.axiosInstances = new Map();
        this.requestCounts = new Map();
        this.lastResetTime = new Date();

        this.setupLogger();
        this.initializeServices();
        this.startRateLimitReset();
    }

    private setupLogger(): void {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'external-api' },
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({
                    filename: 'logs/external-api.log',
                    maxsize: 5242880,
                    maxFiles: 5
                })
            ]
        });
    }

    private initializeServices(): void {
        for (const [serviceId, config] of Object.entries(this.defaultConfigs)) {
            this.serviceConfigs.set(serviceId, { ...config });
            this.requestCounts.set(serviceId, 0);
            this.createAxiosInstance(serviceId, config);
        }

        this.logger.info('External API service initialized with default configurations');
    }

    private createAxiosInstance(serviceId: string, config: ExternalServiceConfig): void {
        const instance = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FairGo-API-Client/1.0',
                ...config.headers
            }
        });

        // Request interceptor
        instance.interceptors.request.use(
            (requestConfig) => {
                const requestId = crypto.randomUUID();
                (requestConfig as any).metadata = { startTime: Date.now(), requestId };

                this.logger.info('API request started', {
                    service: serviceId,
                    requestId,
                    url: requestConfig.url,
                    method: requestConfig.method?.toUpperCase()
                });

                return requestConfig;
            },
            (error) => {
                this.logger.error('Request interceptor error', { service: serviceId, error });
                return Promise.reject(error);
            }
        );

        // Response interceptor
        instance.interceptors.response.use(
            (response) => {
                const metadata = (response.config as any).metadata;
                const responseTime = Date.now() - metadata.startTime;
                this.logger.info('API request completed', {
                    service: serviceId,
                    requestId: metadata.requestId,
                    status: response.status,
                    responseTime
                });

                return response;
            },
            (error) => {
                const responseTime = error.config?.metadata ? Date.now() - error.config.metadata.startTime : 0;
                this.logger.error('API request failed', {
                    service: serviceId,
                    requestId: error.config?.metadata?.requestId,
                    error: error.message,
                    responseTime,
                    status: error.response?.status
                });

                return Promise.reject(error);
            }
        );

        this.axiosInstances.set(serviceId, instance);
    }

    /**
     * Configure external service
     */
    public configureService(serviceId: string, config: Partial<ExternalServiceConfig>): void {
        const existingConfig = this.serviceConfigs.get(serviceId) || this.defaultConfigs[serviceId];
        if (!existingConfig) {
            throw new Error(`Unknown service: ${serviceId}`);
        }

        const updatedConfig = { ...existingConfig, ...config };
        this.serviceConfigs.set(serviceId, updatedConfig);

        // Recreate axios instance with new config
        this.createAxiosInstance(serviceId, updatedConfig);

        this.logger.info('Service configuration updated', { serviceId, config: updatedConfig });
    }

    /**
     * Check if service is available and properly configured
     */
    public isServiceAvailable(serviceId: string): boolean {
        const config = this.serviceConfigs.get(serviceId);
        return config?.isEnabled || false;
    }

    /**
     * Check rate limit for service
     */
    private checkRateLimit(serviceId: string): boolean {
        const config = this.serviceConfigs.get(serviceId);
        const currentCount = this.requestCounts.get(serviceId) || 0;

        if (!config || currentCount >= config.rateLimitPerMinute) {
            this.logger.warn('Rate limit exceeded', { serviceId, currentCount, limit: config?.rateLimitPerMinute });
            return false;
        }

        return true;
    }

    /**
     * Make API request with retry logic and rate limiting
     */
    private async makeRequest<T>(
        serviceId: string,
        requestConfig: AxiosRequestConfig,
        retryCount = 0
    ): Promise<APIResponse<T>> {
        if (!this.isServiceAvailable(serviceId)) {
            return {
                success: false,
                error: `Service ${serviceId} is not available`,
                statusCode: 503,
                responseTime: 0,
                requestId: crypto.randomUUID()
            };
        }

        if (!this.checkRateLimit(serviceId)) {
            return {
                success: false,
                error: 'Rate limit exceeded',
                statusCode: 429,
                responseTime: 0,
                requestId: crypto.randomUUID()
            };
        }

        const instance = this.axiosInstances.get(serviceId);
        const config = this.serviceConfigs.get(serviceId);

        if (!instance || !config) {
            return {
                success: false,
                error: 'Service not properly configured',
                statusCode: 500,
                responseTime: 0,
                requestId: crypto.randomUUID()
            };
        }

        // Increment request count
        const currentCount = this.requestCounts.get(serviceId) || 0;
        this.requestCounts.set(serviceId, currentCount + 1);

        try {
            const startTime = Date.now();
            const response: AxiosResponse<T> = await instance.request(requestConfig);
            const responseTime = Date.now() - startTime;

            this.emit('requestSuccess', { serviceId, responseTime, statusCode: response.status });

            return {
                success: true,
                data: response.data,
                statusCode: response.status,
                responseTime,
                requestId: (response.config as any).metadata.requestId
            };

        } catch (error: any) {
            const metadata = (error.config as any)?.metadata;
            const responseTime = Date.now() - (metadata?.startTime || Date.now());

            this.emit('requestError', { serviceId, error: error.message, statusCode: error.response?.status });

            // Retry logic
            if (retryCount < config.retryAttempts && this.shouldRetry(error)) {
                this.logger.info('Retrying request', { serviceId, retryCount: retryCount + 1 });
                await this.delay(config.retryDelay * (retryCount + 1));
                return this.makeRequest<T>(serviceId, requestConfig, retryCount + 1);
            }

            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Request failed',
                statusCode: error.response?.status || 500,
                responseTime,
                requestId: error.config?.metadata?.requestId || crypto.randomUUID()
            };
        }
    }

    private shouldRetry(error: any): boolean {
        const retryableStatuses = [408, 429, 500, 502, 503, 504];
        return retryableStatuses.includes(error.response?.status) || !error.response;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Payment Gateway Integration
     */
    public async createPayment(gateway: 'razorpay' | 'paytm', request: PaymentGatewayRequest): Promise<APIResponse> {
        switch (gateway) {
            case 'razorpay':
                return this.createRazorpayPayment(request);
            case 'paytm':
                return this.createPaytmPayment(request);
            default:
                return {
                    success: false,
                    error: 'Unsupported payment gateway',
                    statusCode: 400,
                    responseTime: 0,
                    requestId: crypto.randomUUID()
                };
        }
    }

    private async createRazorpayPayment(request: PaymentGatewayRequest): Promise<APIResponse> {
        const config = this.serviceConfigs.get('razorpay');

        const requestConfig: AxiosRequestConfig = {
            method: 'POST',
            url: '/orders',
            data: {
                amount: request.amount * 100, // Convert to paise
                currency: request.currency,
                receipt: request.orderId,
                notes: request.metadata
            },
            auth: {
                username: config?.authentication?.credentials.keyId || '',
                password: config?.authentication?.credentials.keySecret || ''
            }
        };

        return this.makeRequest('razorpay', requestConfig);
    }

    private async createPaytmPayment(request: PaymentGatewayRequest): Promise<APIResponse> {
        const config = this.serviceConfigs.get('paytm');
        const checksum = this.generatePaytmChecksum(request);

        const requestConfig: AxiosRequestConfig = {
            method: 'POST',
            url: '/initiateTransaction',
            data: {
                MID: config?.authentication?.credentials.merchantId,
                WEBSITE: config?.authentication?.credentials.website,
                ORDER_ID: request.orderId,
                CUST_ID: request.customerId,
                TXN_AMOUNT: request.amount.toString(),
                CURRENCY: request.currency,
                EMAIL: request.customerEmail,
                MOBILE_NO: request.customerPhone,
                CHECKSUMHASH: checksum
            }
        };

        return this.makeRequest('paytm', requestConfig);
    }

    private generatePaytmChecksum(request: PaymentGatewayRequest): string {
        // Simplified checksum generation - in production, use Paytm's official library
        const config = this.serviceConfigs.get('paytm');
        const data = `${request.orderId}|${request.amount}|${config?.authentication?.credentials.merchantKey}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Mapping Services Integration
     */
    public async getDirections(provider: 'googlemaps' | 'mapmyindia', request: MappingServiceRequest): Promise<APIResponse> {
        switch (provider) {
            case 'googlemaps':
                return this.getGoogleMapsDirections(request);
            case 'mapmyindia':
                return this.getMapMyIndiaDirections(request);
            default:
                return {
                    success: false,
                    error: 'Unsupported mapping provider',
                    statusCode: 400,
                    responseTime: 0,
                    requestId: crypto.randomUUID()
                };
        }
    }

    private async getGoogleMapsDirections(request: MappingServiceRequest): Promise<APIResponse> {
        const config = this.serviceConfigs.get('googlemaps');

        const params = new URLSearchParams({
            origin: `${request.origin.latitude},${request.origin.longitude}`,
            destination: `${request.destination.latitude},${request.destination.longitude}`,
            mode: request.travelMode || 'driving',
            key: config?.authentication?.credentials.apiKey || ''
        });

        if (request.waypoints && request.waypoints.length > 0) {
            const waypoints = request.waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');
            params.append('waypoints', waypoints);
        }

        if (request.avoidTolls) params.append('avoid', 'tolls');
        if (request.avoidHighways) params.append('avoid', 'highways');

        const requestConfig: AxiosRequestConfig = {
            method: 'GET',
            url: `/directions/json?${params.toString()}`
        };

        return this.makeRequest('googlemaps', requestConfig);
    }

    private async getMapMyIndiaDirections(request: MappingServiceRequest): Promise<APIResponse> {
        const config = this.serviceConfigs.get('mapmyindia');

        const requestConfig: AxiosRequestConfig = {
            method: 'POST',
            url: '/api/places/directions/json',
            headers: {
                'Authorization': `Bearer ${config?.authentication?.credentials.accessToken}`
            },
            data: {
                start: `${request.origin.latitude},${request.origin.longitude}`,
                end: `${request.destination.latitude},${request.destination.longitude}`,
                profile: request.travelMode || 'driving'
            }
        };

        return this.makeRequest('mapmyindia', requestConfig);
    }

    /**
     * Vehicle Tracking Integration
     */
    public async trackVehicle(request: VehicleTrackingRequest): Promise<APIResponse> {
        const requestConfig: AxiosRequestConfig = {
            method: 'GET',
            url: `/vehicles/${request.vehicleId}/${request.trackingType}`,
            params: {
                driver_id: request.driverId,
                start_time: request.timeRange?.startTime?.toISOString(),
                end_time: request.timeRange?.endTime?.toISOString()
            }
        };

        return this.makeRequest('vehicletracking', requestConfig);
    }

    /**
     * Third-party Booking Platform Integration
     */
    public async createPartnerBooking(platform: 'ola' | 'uber', request: BookingPlatformRequest): Promise<APIResponse> {
        switch (platform) {
            case 'ola':
                return this.createOlaBooking(request);
            case 'uber':
                return this.createUberBooking(request);
            default:
                return {
                    success: false,
                    error: 'Unsupported booking platform',
                    statusCode: 400,
                    responseTime: 0,
                    requestId: crypto.randomUUID()
                };
        }
    }

    private async createOlaBooking(request: BookingPlatformRequest): Promise<APIResponse> {
        const requestConfig: AxiosRequestConfig = {
            method: 'POST',
            url: '/bookings',
            data: {
                pickup_location: request.bookingDetails.pickupLocation,
                drop_location: request.bookingDetails.dropoffLocation,
                pickup_time: request.bookingDetails.scheduledTime?.toISOString(),
                category: request.bookingDetails.vehicleType,
                customer: {
                    name: request.customerInfo.name,
                    phone: request.customerInfo.phone,
                    email: request.customerInfo.email
                },
                partner_booking_id: request.partnerBookingId
            }
        };

        return this.makeRequest('ola', requestConfig);
    }

    private async createUberBooking(request: BookingPlatformRequest): Promise<APIResponse> {
        const requestConfig: AxiosRequestConfig = {
            method: 'POST',
            url: '/requests',
            data: {
                start_latitude: 0, // Would be parsed from pickupLocation
                start_longitude: 0,
                end_latitude: 0, // Would be parsed from dropoffLocation
                end_longitude: 0,
                product_id: request.bookingDetails.vehicleType
            }
        };

        return this.makeRequest('uber', requestConfig);
    }

    /**
     * Emergency Services Integration
     */
    public async triggerEmergencyAlert(alertData: {
        type: 'accident' | 'medical' | 'security' | 'breakdown';
        location: { latitude: number; longitude: number };
        driverId: string;
        customerId?: string;
        bookingId: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }): Promise<APIResponse> {
        const requestConfig: AxiosRequestConfig = {
            method: 'POST',
            url: '/alerts',
            data: {
                alert_type: alertData.type,
                location: alertData.location,
                driver_id: alertData.driverId,
                customer_id: alertData.customerId,
                booking_id: alertData.bookingId,
                description: alertData.description,
                severity: alertData.severity,
                timestamp: new Date().toISOString()
            }
        };

        return this.makeRequest('emergencyservices', requestConfig);
    }

    /**
     * Get service statistics
     */
    public getServiceStatistics(): Record<string, {
        requestCount: number;
        isEnabled: boolean;
        rateLimitRemaining: number;
    }> {
        const stats: Record<string, any> = {};

        for (const [serviceId, config] of this.serviceConfigs) {
            const requestCount = this.requestCounts.get(serviceId) || 0;
            stats[serviceId] = {
                requestCount,
                isEnabled: config.isEnabled,
                rateLimitRemaining: Math.max(0, config.rateLimitPerMinute - requestCount)
            };
        }

        return stats;
    }

    /**
     * Reset rate limit counters (called every minute)
     */
    private startRateLimitReset(): void {
        setInterval(() => {
            this.requestCounts.clear();
            for (const serviceId of this.serviceConfigs.keys()) {
                this.requestCounts.set(serviceId, 0);
            }
            this.lastResetTime = new Date();
            this.logger.debug('Rate limit counters reset');
        }, 60000); // Reset every minute
    }

    /**
     * Test connectivity to all enabled services
     */
    public async testAllConnections(): Promise<Record<string, boolean>> {
        const results: Record<string, boolean> = {};

        const testPromises = Array.from(this.serviceConfigs.entries())
            .filter(([_, config]) => config.isEnabled)
            .map(async ([serviceId, _]) => {
                try {
                    const response = await this.makeRequest(serviceId, {
                        method: 'GET',
                        url: '/health' // Most APIs have a health endpoint
                    });
                    results[serviceId] = response.success;
                } catch {
                    results[serviceId] = false;
                }
            });

        await Promise.allSettled(testPromises);
        return results;
    }

    /**
     * Graceful shutdown
     */
    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down External API Service');
        this.removeAllListeners();
    }
}