# FairGo External API Service Integration Guide

This guide provides comprehensive information about the FairGo External API Service, which enables seamless integration with payment gateways, mapping services, vehicle tracking systems, and partner platforms.

## Overview

The FairGo External API Service provides a unified interface for connecting with various third-party services essential for ride-hailing operations. It includes comprehensive security, authentication, rate limiting, and monitoring features.

## Service Architecture

### Core Components

1. **ExternalAPIService** (`src/services/ExternalAPIService.ts`)

   - Main service class handling external API integrations
   - Supports payment gateways, mapping services, vehicle tracking, and partner platforms
   - Built-in retry logic, rate limiting, and error handling

2. **APISecurityService** (`src/services/APISecurityService.ts`)

   - Authentication and authorization management
   - API key generation and validation
   - JWT token handling
   - Rate limiting and request monitoring

3. **API Middleware** (`src/middleware/api-security.ts`)

   - Express middleware integration
   - Request validation using Joi schemas
   - Security headers and CORS configuration
   - Response caching and logging

4. **External API Routes** (`src/routes/external-api.ts`)
   - RESTful API endpoints for external service integration
   - Payment processing, mapping, tracking, and emergency services
   - Comprehensive error handling and response formatting

## Supported External Services

### Payment Gateways

#### Razorpay Integration

- **Create Payment Orders**: Create secure payment orders with checksums
- **Payment Verification**: Verify payment success using webhooks
- **Refund Processing**: Handle refunds and payment failures
- **Real-time Webhooks**: Process payment status updates

#### Paytm Integration

- **Payment Initiation**: Create Paytm payment transactions
- **Transaction Status**: Check payment transaction status
- **Checksum Verification**: Secure checksum generation and validation

### Mapping Services

#### Google Maps Integration

- **Directions API**: Get optimized routes between locations
- **Distance Matrix**: Calculate travel times and distances
- **Geocoding**: Convert addresses to coordinates and vice versa
- **Places API**: Search for locations and get place details

#### MapmyIndia Integration

- **Indian Map Data**: Specialized mapping data for India
- **Local Navigation**: Optimized routes for Indian road conditions
- **Regional Support**: Support for local languages and landmarks

### Vehicle Tracking Systems

#### Real-time Location Tracking

- **GPS Coordinates**: Live vehicle location updates
- **Speed and Heading**: Vehicle movement data
- **Geofencing**: Location-based alerts and triggers
- **Route Tracking**: Complete trip route logging

#### Vehicle Diagnostics

- **Fuel Monitoring**: Real-time fuel level tracking
- **Battery Status**: Vehicle battery health monitoring
- **Engine Diagnostics**: Engine status and health checks
- **Maintenance Alerts**: Service reminders and alerts

### Partner Platform Integration

#### Ola Platform

- **Booking Creation**: Create bookings on Ola platform
- **Driver Assignment**: Get assigned driver details
- **Trip Tracking**: Real-time trip status updates
- **Fare Management**: Handle fare calculations and payments

#### Uber Platform

- **Ride Requests**: Create ride requests via Uber API
- **Ride Tracking**: Monitor ride progress and status
- **Driver Communication**: Facilitate driver-passenger communication
- **Pricing Integration**: Dynamic pricing and surge calculations

## API Endpoints

### Authentication Endpoints

```http
POST /api/auth/signup
POST /api/auth/signin
GET /api/auth/me
POST /api/auth/signout
```

### Payment Gateway Endpoints

```http
POST /api/external/payment/razorpay/create
POST /api/external/payment/razorpay/webhook
POST /api/external/payment/paytm/create
POST /api/external/payment/paytm/verify
```

### Mapping Service Endpoints

```http
POST /api/external/maps/directions
POST /api/external/maps/fare-estimate
GET /api/external/maps/geocode
POST /api/external/maps/places/search
```

### Vehicle Tracking Endpoints

```http
GET /api/external/tracking/:vehicleId/location
GET /api/external/tracking/:vehicleId/diagnostics
POST /api/external/tracking/:vehicleId/geofence
GET /api/external/tracking/:vehicleId/history
```

### Partner Platform Endpoints

```http
POST /api/external/partner/:platform/booking
GET /api/external/partner/:platform/booking/:bookingId
PUT /api/external/partner/:platform/booking/:bookingId/cancel
GET /api/external/partner/:platform/drivers/nearby
```

### Emergency Service Endpoints

```http
POST /api/external/emergency/alert
GET /api/external/emergency/alert/:alertId
PUT /api/external/emergency/alert/:alertId/update
```

### System Status Endpoints

```http
GET /api/external/status
GET /api/external/health
GET /api/external/metrics
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="file:./db/custom.db"

# Redis (for caching and rate limiting)
REDIS_URL="redis://localhost:6379"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# Payment Gateways
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
PAYTM_MID="your-paytm-merchant-id"
PAYTM_KEY="your-paytm-key"

# Mapping Services
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
MAPMYINDIA_API_KEY="your-mapmyindia-api-key"

# Partner Platforms
OLA_API_KEY="your-ola-api-key"
UBER_API_KEY="your-uber-api-key"

# Application Settings
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Service Configuration

Each external service can be configured individually:

```typescript
// Configure Razorpay
externalAPI.configureService("razorpay", {
  isEnabled: true,
  authentication: {
    type: "basic",
    credentials: {
      username: process.env.RAZORPAY_KEY_ID,
      password: process.env.RAZORPAY_KEY_SECRET,
    },
  },
  rateLimitPerMinute: 100,
  timeout: 10000,
});
```

## Usage Examples

### Payment Processing

```typescript
import { ExternalAPIService } from "../services/ExternalAPIService";

const externalAPI = new ExternalAPIService();

// Create a payment order
const paymentRequest = {
  orderId: "order_123456",
  amount: 25000, // Amount in paise (₹250.00)
  currency: "INR",
  customerId: "customer_123",
  customerEmail: "customer@example.com",
  customerPhone: "+919876543210",
  description: "Ride payment for booking #12345",
};

const response = await externalAPI.createPayment("razorpay", paymentRequest);

if (response.success) {
  console.log("Payment order created:", response.data);
} else {
  console.error("Payment failed:", response.error);
}
```

### Getting Directions

```typescript
// Get directions between two points
const directionsRequest = {
  origin: {
    latitude: 12.9716,
    longitude: 77.5946,
  },
  destination: {
    latitude: 13.0827,
    longitude: 80.2707,
  },
  travelMode: "driving" as const,
  avoidTolls: false,
  avoidHighways: false,
};

const directions = await externalAPI.getDirections(
  "googlemaps",
  directionsRequest
);

if (directions.success && directions.data) {
  console.log("Distance:", directions.data.distance);
  console.log("Duration:", directions.data.duration);
  console.log("Route:", directions.data.polyline);
}
```

### Vehicle Tracking

```typescript
// Track vehicle location
const trackingRequest = {
  vehicleId: "vehicle_123",
  driverId: "driver_456",
  trackingType: "location" as const,
};

const location = await externalAPI.trackVehicle(trackingRequest);

if (location.success && location.data) {
  console.log("Vehicle location:", {
    latitude: location.data.lat,
    longitude: location.data.lng,
    speed: location.data.speed,
    timestamp: location.data.timestamp,
  });
}
```

### Partner Booking

```typescript
// Create booking on partner platform
const bookingRequest = {
  bookingDetails: {
    pickupLocation: "Koramangala, Bangalore",
    dropoffLocation: "Electronic City, Bangalore",
    passengerCount: 2,
    vehicleType: "HATCHBACK",
    specialRequests: ["AC", "Non-smoking"],
  },
  customerInfo: {
    name: "John Doe",
    phone: "+919876543210",
    email: "john@example.com",
  },
  platformId: "ola",
};

const booking = await externalAPI.createPartnerBooking("ola", bookingRequest);

if (booking.success && booking.data) {
  console.log("Booking created:", booking.data);
}
```

## Security Features

### API Key Management

- **Secure Generation**: Cryptographically secure API key generation
- **Hashed Storage**: API keys are stored as bcrypt hashes
- **Permission-based Access**: Fine-grained permissions for different operations
- **Usage Tracking**: Monitor API key usage and detect anomalies
- **Expiration Support**: Automatic key expiration and renewal

### Rate Limiting

- **Per-endpoint Limits**: Different rate limits for different operations
- **User-based Limiting**: Rate limiting per API key or user
- **Redis-backed Storage**: Distributed rate limiting using Redis
- **Graceful Degradation**: Informative error messages when limits are exceeded

### Authentication Methods

1. **API Key Authentication** (for server-to-server communication)
2. **JWT Authentication** (for user-facing applications)
3. **OAuth Integration** (for partner platform access)
4. **Webhook Verification** (for secure callback handling)

### Request Validation

- **Joi Schema Validation**: Comprehensive input validation
- **Type Safety**: TypeScript interfaces for all request/response types
- **Sanitization**: Input sanitization to prevent injection attacks
- **Size Limits**: Request payload size restrictions

## Monitoring and Analytics

### Logging

- **Structured Logging**: JSON-formatted logs with Winston
- **Request/Response Logging**: Complete audit trail of all API calls
- **Error Tracking**: Detailed error logging with stack traces
- **Performance Metrics**: Response time and throughput monitoring

### Health Monitoring

- **Service Health Checks**: Regular health checks for all external services
- **Connection Testing**: Verify connectivity to external APIs
- **Dependency Monitoring**: Track the status of critical dependencies
- **Alerting**: Automated alerts for service failures

### Usage Analytics

- **Request Statistics**: Track request counts, success rates, and response times
- **User Analytics**: Monitor usage patterns by API key or user
- **Service Performance**: Track performance metrics for each external service
- **Cost Optimization**: Monitor API usage costs and optimize accordingly

## Error Handling

### Error Types

1. **Network Errors**: Connection timeouts, DNS failures, network issues
2. **Authentication Errors**: Invalid credentials, expired tokens
3. **Validation Errors**: Invalid request parameters, missing fields
4. **Rate Limit Errors**: Exceeded API rate limits
5. **Service Errors**: Downstream service failures, maintenance windows

### Error Responses

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": "Payment processing failed",
  "details": {
    "code": "PAYMENT_DECLINED",
    "message": "Insufficient funds in the account",
    "reference": "txn_1234567890"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_abcdef123456"
}
```

### Retry Logic

- **Exponential Backoff**: Intelligent retry with increasing delays
- **Circuit Breaker Pattern**: Prevent cascading failures
- **Fallback Mechanisms**: Alternative services when primary fails
- **Dead Letter Queues**: Store failed requests for later processing

## Testing

### Unit Tests

```typescript
import { ExternalAPIService } from "../services/ExternalAPIService";

describe("ExternalAPIService", () => {
  let externalAPI: ExternalAPIService;

  beforeEach(() => {
    externalAPI = new ExternalAPIService();
  });

  it("should create payment order successfully", async () => {
    const paymentRequest = {
      orderId: "test_order_123",
      amount: 10000,
      currency: "INR",
      customerId: "test_customer",
      customerEmail: "test@example.com",
      customerPhone: "+919999999999",
      description: "Test payment",
    };

    const response = await externalAPI.createPayment(
      "razorpay",
      paymentRequest
    );
    expect(response.success).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe("Payment Integration", () => {
  it("should process end-to-end payment flow", async () => {
    // Create payment order
    const paymentOrder = await createPaymentOrder();
    expect(paymentOrder).toBeDefined();

    // Simulate payment completion
    const paymentResult = await simulatePayment(paymentOrder.id);
    expect(paymentResult.status).toBe("captured");

    // Verify webhook processing
    const webhookResponse = await processWebhook(paymentResult);
    expect(webhookResponse.success).toBe(true);
  });
});
```

## Deployment

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/external/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Production Considerations

1. **Load Balancing**: Use multiple instances behind a load balancer
2. **Database Scaling**: Consider read replicas for high-traffic scenarios
3. **Caching Strategy**: Implement Redis clustering for cache redundancy
4. **SSL/TLS**: Use HTTPS for all external communications
5. **Backup Strategy**: Regular database backups and disaster recovery plans

## Support and Troubleshooting

### Common Issues

1. **Connection Timeouts**: Check network connectivity and firewall rules
2. **Authentication Failures**: Verify API credentials and token validity
3. **Rate Limit Exceeded**: Implement proper rate limiting on client side
4. **Invalid Request Format**: Check request payload against API documentation

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development DEBUG=fairgo:external:* npm start
```

### Health Checks

Monitor service health:

```bash
curl -X GET http://localhost:3000/api/external/health
```

### Performance Monitoring

Use the metrics endpoint to monitor performance:

```bash
curl -X GET http://localhost:3000/api/external/metrics
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

For technical support or questions, please contact the FairGo development team or create an issue in the project repository.
