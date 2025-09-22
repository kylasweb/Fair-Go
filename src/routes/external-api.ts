/**
 * External API Routes
 * Demonstrates integration with external services through the ExternalAPIService
 */

import { Router } from 'express';
import { ExternalAPIService } from '../services/ExternalAPIService';
import { apiMiddleware, ValidationSchemas } from '../middleware/api-security';

const router = Router();
const externalAPI = new ExternalAPIService();

/**
 * Payment Gateway Integration Routes
 */

// Create payment with Razorpay
router.post('/payment/razorpay/create',
    apiMiddleware.getSecurityService().validateRequest(ValidationSchemas.paymentCreate),
    async (req, res) => {
        try {
            const { amount, currency = 'INR', bookingId } = req.body;

            const paymentData = {
                orderId: `order_${bookingId}_${Date.now()}`,
                amount: amount * 100, // Razorpay expects amount in paise
                currency,
                customerId: req.user?.userId || 'guest',
                customerEmail: req.body.email || 'customer@fairgo.com',
                customerPhone: req.body.phone || '',
                description: `FairGo booking payment for ${bookingId}`,
                callbackUrl: `${process.env.APP_URL}/api/external/payment/razorpay/callback`,
                metadata: {
                    booking_id: bookingId,
                    service: 'fairgo'
                }
            };

            const response = await externalAPI.createPayment('razorpay', paymentData);

            if (response.success && response.data) {
                res.json({
                    success: true,
                    payment: {
                        id: response.data.id || response.data.order_id,
                        amount: amount, // Original amount in rupees
                        currency,
                        order_id: response.data.order_id,
                        status: response.data.status || 'created'
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: response.error || 'Payment creation failed'
                });
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// Payment verification endpoint (webhook)
router.post('/payment/razorpay/webhook', async (req, res) => {
    try {
        // Handle Razorpay webhook
        const { event, payload } = req.body;

        // Log the webhook for audit
        console.log('Razorpay webhook received:', { event, payload });

        // Process based on event type
        switch (event) {
            case 'payment.captured':
                // Update booking status to paid
                console.log('Payment captured:', payload.payment.entity.id);
                break;
            case 'payment.failed':
                // Update booking status to failed
                console.log('Payment failed:', payload.payment.entity.id);
                break;
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Mapping Services Integration Routes
 */

// Get directions between two points
router.post('/maps/directions', async (req, res) => {
    try {
        const { origin, destination, waypoints, mode = 'driving' } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({
                success: false,
                error: 'Origin and destination are required'
            });
        }

        const directionsRequest = {
            origin,
            destination,
            waypoints: waypoints || [],
            mode,
            alternatives: true,
            avoidTolls: false,
            avoidHighways: false
        };

        const response = await externalAPI.getDirections('googlemaps', directionsRequest);

        if (response.success && response.data) {
            const directionsData = response.data;
            res.json({
                success: true,
                directions: {
                    distance: directionsData.distance || 0,
                    duration: directionsData.duration || 0,
                    route: directionsData.polyline || '',
                    steps: directionsData.steps || [],
                    fare_estimate: calculateFare(directionsData.distance || 0, directionsData.duration || 0)
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: response.error || 'Failed to get directions'
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Calculate fare estimate
router.post('/maps/fare-estimate', async (req, res) => {
    try {
        const { origin, destination, vehicleType = 'HATCHBACK' } = req.body;

        const directionsRequest = {
            origin,
            destination,
            waypoints: [],
            mode: 'driving',
            alternatives: false,
            avoidTolls: false,
            avoidHighways: false
        };

        const response = await externalAPI.getDirections('googlemaps', directionsRequest);

        if (response.success && response.data) {
            const directionsData = response.data;
            const fare = calculateFare(directionsData.distance || 0, directionsData.duration || 0, vehicleType);

            res.json({
                success: true,
                estimate: {
                    distance: directionsData.distance || 0,
                    duration: directionsData.duration || 0,
                    base_fare: fare.baseFare,
                    distance_fare: fare.distanceFare,
                    time_fare: fare.timeFare,
                    total: fare.total,
                    surge_multiplier: fare.surgeMultiplier,
                    vehicle_type: vehicleType
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: response.error || 'Failed to calculate fare estimate'
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Vehicle Tracking Integration Routes
 */

// Get real-time vehicle location
router.get('/tracking/:vehicleId/location', async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const trackingRequest = {
            vehicleId,
            driverId: req.query.driverId as string || 'unknown',
            trackingType: 'location' as const
        };

        const response = await externalAPI.trackVehicle(trackingRequest);

        if (response.success && response.data) {
            const locationData = response.data;
            res.json({
                success: true,
                location: {
                    latitude: locationData.lat || 0,
                    longitude: locationData.lng || 0,
                    accuracy: locationData.accuracy || 0,
                    speed: locationData.speed || 0,
                    heading: locationData.bearing || 0,
                    timestamp: locationData.timestamp || new Date().toISOString()
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: response.error || 'Vehicle location not found'
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get vehicle diagnostics
router.get('/tracking/:vehicleId/diagnostics', async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const trackingRequest = {
            vehicleId,
            driverId: req.query.driverId as string || 'unknown',
            trackingType: 'diagnostics' as const
        };

        const response = await externalAPI.trackVehicle(trackingRequest);

        if (response.success && response.data) {
            const diagnosticsData = response.data;
            res.json({
                success: true,
                diagnostics: {
                    fuel_level: diagnosticsData.fuelLevel || 0,
                    battery_voltage: diagnosticsData.batteryVoltage || 12.6,
                    engine_status: diagnosticsData.engineStatus || 'unknown',
                    odometer: diagnosticsData.odometer || 0,
                    last_service: diagnosticsData.lastService || null,
                    next_service_due: diagnosticsData.nextServiceDue || null
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: response.error || 'Vehicle diagnostics not available'
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Third-party Booking Integration Routes
 */

// Create partner booking (Ola/Uber)
router.post('/partner/:platform/booking', async (req, res) => {
    try {
        const { platform } = req.params;

        if (!['ola', 'uber'].includes(platform)) {
            return res.status(400).json({
                success: false,
                error: 'Unsupported platform. Use "ola" or "uber"'
            });
        }

        const bookingRequest = {
            bookingDetails: {
                pickupLocation: req.body.pickupLocation,
                dropoffLocation: req.body.dropoffLocation,
                scheduledTime: req.body.scheduledTime ? new Date(req.body.scheduledTime) : undefined,
                passengerCount: req.body.passengerCount || 1,
                vehicleType: req.body.vehicleType || 'HATCHBACK',
                specialRequests: req.body.specialRequests || []
            },
            customerInfo: {
                name: req.body.customerName,
                phone: req.body.customerPhone,
                email: req.body.customerEmail
            },
            platformId: req.body.platformId || '',
            partnerBookingId: req.body.partnerBookingId
        };

        const response = await externalAPI.createPartnerBooking(platform as 'ola' | 'uber', bookingRequest);

        if (response.success && response.data) {
            const bookingData = response.data;
            res.json({
                success: true,
                booking: {
                    id: bookingData.id || bookingData.booking_id,
                    status: bookingData.status || 'pending',
                    eta: bookingData.eta || null,
                    fare: bookingData.fare || null,
                    driver: bookingData.driver || null
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: response.error || 'Failed to create partner booking'
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get partner booking status (placeholder)
router.get('/partner/:platform/booking/:bookingId', async (req, res) => {
    try {
        const { platform, bookingId } = req.params;

        // This would typically query the partner platform
        res.json({
            success: true,
            status: {
                id: bookingId,
                platform,
                status: 'confirmed', // This would be fetched from the partner API
                last_updated: new Date().toISOString()
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Emergency Services Integration Routes
 */

// Trigger emergency alert
router.post('/emergency/alert', async (req, res) => {
    try {
        const { type, location, bookingId, severity = 'medium', driverId, description } = req.body;

        const alertData = {
            type: type as 'accident' | 'medical' | 'security' | 'breakdown',
            location: {
                latitude: location.latitude || location.lat || 0,
                longitude: location.longitude || location.lng || 0
            },
            driverId: driverId || req.user?.userId || 'unknown',
            customerId: req.user?.userId,
            bookingId,
            description: description || `Emergency alert: ${type}`,
            severity: severity as 'low' | 'medium' | 'high' | 'critical'
        };

        const response = await externalAPI.triggerEmergencyAlert(alertData);

        if (response.success) {
            res.json({
                success: true,
                alert: {
                    id: response.data?.id || `alert_${Date.now()}`,
                    status: response.data?.status || 'triggered',
                    response_time: response.responseTime
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: response.error || 'Failed to trigger emergency alert'
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Service Health and Status Routes
 */

// Get all external service statuses
router.get('/status', async (req, res) => {
    try {
        const serviceStats = externalAPI.getServiceStatistics();
        const connectionTests = await externalAPI.testAllConnections();

        const services: any = {};

        Object.keys(serviceStats).forEach(serviceId => {
            const stats = serviceStats[serviceId];
            services[serviceId] = {
                status: connectionTests[serviceId] ? 'healthy' : 'unhealthy',
                request_count: stats.requestCount,
                enabled: stats.isEnabled,
                rate_limit_remaining: stats.rateLimitRemaining,
                last_check: new Date().toISOString()
            };
        });

        const overallHealthy = Object.values(connectionTests).every(status => status);

        res.json({
            success: true,
            services,
            overall_status: overallHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Helper Functions
 */

function calculateFare(distance: number, duration: number, vehicleType: string = 'HATCHBACK') {
    // Base fare structure (in INR)
    const baseFares = {
        'HATCHBACK': 50,
        'SEDAN': 60,
        'SUV': 80,
        'AUTO': 30,
        'BIKE': 25
    };

    // Per km rates
    const perKmRates = {
        'HATCHBACK': 12,
        'SEDAN': 15,
        'SUV': 20,
        'AUTO': 10,
        'BIKE': 8
    };

    // Per minute rates (for time component)
    const perMinuteRates = {
        'HATCHBACK': 2,
        'SEDAN': 2.5,
        'SUV': 3,
        'AUTO': 1.5,
        'BIKE': 1
    };

    const baseFare = baseFares[vehicleType as keyof typeof baseFares] || baseFares.HATCHBACK;
    const perKmRate = perKmRates[vehicleType as keyof typeof perKmRates] || perKmRates.HATCHBACK;
    const perMinuteRate = perMinuteRates[vehicleType as keyof typeof perMinuteRates] || perMinuteRates.HATCHBACK;

    // Calculate distance fare (distance is in meters, convert to km)
    const distanceKm = distance / 1000;
    const distanceFare = distanceKm * perKmRate;

    // Calculate time fare (duration is in seconds, convert to minutes)
    const durationMinutes = duration / 60;
    const timeFare = durationMinutes * perMinuteRate;

    // Apply surge pricing based on current demand (simplified)
    const currentHour = new Date().getHours();
    let surgeMultiplier = 1;

    // Peak hours surge
    if ((currentHour >= 8 && currentHour <= 10) || (currentHour >= 18 && currentHour <= 21)) {
        surgeMultiplier = 1.2;
    }

    // Late night surge
    if (currentHour >= 23 || currentHour <= 5) {
        surgeMultiplier = 1.5;
    }

    const subtotal = baseFare + distanceFare + timeFare;
    const total = Math.round(subtotal * surgeMultiplier);

    return {
        baseFare,
        distanceFare: Math.round(distanceFare),
        timeFare: Math.round(timeFare),
        subtotal: Math.round(subtotal),
        surgeMultiplier,
        total
    };
}

export default router;