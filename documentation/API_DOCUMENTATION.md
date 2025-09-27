# FairGo Platform - API Documentation

## Overview

Complete API documentation for the FairGo taxi booking platform, including all endpoints, authentication, request/response formats, and integration examples.

## Base URL

```
Production: https://api.fairgo.com
Development: http://localhost:3000
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Structure

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "user|driver|admin",
  "iat": 1640995200,
  "exp": 1641081600
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per minute
- **Booking Creation**: 10 requests per minute
- **Location Updates**: 60 requests per minute

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995800
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {},
    "timestamp": "2023-01-01T12:00:00Z",
    "request_id": "req_123456789"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## API Endpoints

### Authentication

#### POST /api/auth/signup

Register a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "user"
}
```

**Response:**

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "user",
    "verified": false,
    "created_at": "2023-01-01T12:00:00Z"
  },
  "token": "jwt-token-here",
  "expires_at": "2023-01-08T12:00:00Z"
}
```

#### POST /api/auth/signin

Authenticate user and get access token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "jwt-token-here",
  "expires_at": "2023-01-08T12:00:00Z"
}
```

#### POST /api/auth/signout

Sign out current user (invalidate token).

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Successfully signed out"
}
```

#### GET /api/auth/me

Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "user",
    "verified": true,
    "wallet_balance": 150.5,
    "created_at": "2023-01-01T12:00:00Z"
  }
}
```

### Users

#### PUT /api/users/profile

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "name": "Jane Doe",
  "phone": "+1234567891",
  "email": "jane@example.com"
}
```

**Response:**

```json
{
  "user": {
    "id": "user-uuid",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "phone": "+1234567891",
    "updated_at": "2023-01-01T12:30:00Z"
  }
}
```

### Bookings

#### POST /api/bookings

Create a new booking.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "pickup_location": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "address": "123 Main Street, Bangalore"
  },
  "dropoff_location": {
    "latitude": 12.935,
    "longitude": 77.6245,
    "address": "456 Commercial Street, Bangalore"
  },
  "ride_type": "economy",
  "scheduled_time": "2023-01-01T15:00:00Z",
  "payment_method": "wallet",
  "special_requests": "Please call when you arrive"
}
```

**Response:**

```json
{
  "booking": {
    "id": "booking-uuid",
    "user_id": "user-uuid",
    "pickup_location": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "address": "123 Main Street, Bangalore"
    },
    "dropoff_location": {
      "latitude": 12.935,
      "longitude": 77.6245,
      "address": "456 Commercial Street, Bangalore"
    },
    "ride_type": "economy",
    "status": "pending",
    "estimated_fare": 85.5,
    "estimated_duration": 18,
    "estimated_distance": 5.2,
    "scheduled_time": "2023-01-01T15:00:00Z",
    "payment_method": "wallet",
    "special_requests": "Please call when you arrive",
    "created_at": "2023-01-01T12:45:00Z"
  }
}
```

#### GET /api/bookings

Get user's booking history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (pending, confirmed, in_progress, completed, cancelled)
- `from_date` (optional): Start date (ISO 8601)
- `to_date` (optional): End date (ISO 8601)

**Response:**

```json
{
  "bookings": [
    {
      "id": "booking-uuid",
      "pickup_location": {
        "latitude": 12.9716,
        "longitude": 77.5946,
        "address": "123 Main Street, Bangalore"
      },
      "dropoff_location": {
        "latitude": 12.935,
        "longitude": 77.6245,
        "address": "456 Commercial Street, Bangalore"
      },
      "driver": {
        "id": "driver-uuid",
        "name": "Driver Name",
        "phone": "+1234567892",
        "vehicle": {
          "make": "Toyota",
          "model": "Camry",
          "license_plate": "AB12CD34",
          "color": "White"
        }
      },
      "status": "completed",
      "fare": 92.5,
      "distance": 5.8,
      "duration": 22,
      "created_at": "2023-01-01T12:45:00Z",
      "completed_at": "2023-01-01T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

#### GET /api/bookings/:id

Get specific booking details.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "booking": {
    "id": "booking-uuid",
    "user_id": "user-uuid",
    "driver_id": "driver-uuid",
    "pickup_location": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "address": "123 Main Street, Bangalore"
    },
    "dropoff_location": {
      "latitude": 12.935,
      "longitude": 77.6245,
      "address": "456 Commercial Street, Bangalore"
    },
    "status": "in_progress",
    "fare": 85.5,
    "driver": {
      "id": "driver-uuid",
      "name": "Driver Name",
      "phone": "+1234567892",
      "rating": 4.8,
      "vehicle": {
        "make": "Toyota",
        "model": "Camry",
        "license_plate": "AB12CD34",
        "color": "White"
      },
      "current_location": {
        "latitude": 12.95,
        "longitude": 77.6
      }
    },
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2023-01-01T12:45:00Z"
      },
      {
        "status": "confirmed",
        "timestamp": "2023-01-01T12:47:00Z"
      },
      {
        "status": "driver_en_route",
        "timestamp": "2023-01-01T12:50:00Z"
      }
    ],
    "created_at": "2023-01-01T12:45:00Z"
  }
}
```

#### PUT /api/bookings/:id/cancel

Cancel a booking.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "reason": "Plans changed"
}
```

**Response:**

```json
{
  "booking": {
    "id": "booking-uuid",
    "status": "cancelled",
    "cancellation_reason": "Plans changed",
    "cancelled_at": "2023-01-01T13:00:00Z",
    "refund_amount": 85.5
  }
}
```

### Drivers

#### GET /api/drivers/nearby

Find nearby available drivers.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `latitude` (required): Pickup latitude
- `longitude` (required): Pickup longitude
- `radius` (optional): Search radius in km (default: 5)

**Response:**

```json
{
  "drivers": [
    {
      "id": "driver-uuid",
      "name": "Driver Name",
      "rating": 4.8,
      "vehicle": {
        "make": "Toyota",
        "model": "Camry",
        "license_plate": "AB12CD34",
        "color": "White",
        "year": 2020
      },
      "current_location": {
        "latitude": 12.965,
        "longitude": 77.59
      },
      "distance": 1.2,
      "estimated_arrival": 5
    }
  ]
}
```

#### POST /api/drivers/register

Register as a driver.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "license_number": "DL1234567890",
  "vehicle": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "license_plate": "AB12CD34",
    "color": "White",
    "registration_number": "REG123456"
  },
  "documents": {
    "license_photo": "base64-encoded-image",
    "vehicle_registration": "base64-encoded-image",
    "insurance_certificate": "base64-encoded-image"
  },
  "bank_details": {
    "account_number": "1234567890",
    "ifsc_code": "ABCD0123456",
    "account_holder_name": "Driver Name"
  }
}
```

**Response:**

```json
{
  "driver": {
    "id": "driver-uuid",
    "user_id": "user-uuid",
    "status": "pending_verification",
    "license_number": "DL1234567890",
    "vehicle": {
      "make": "Toyota",
      "model": "Camry",
      "year": 2020,
      "license_plate": "AB12CD34",
      "color": "White"
    },
    "created_at": "2023-01-01T12:00:00Z"
  }
}
```

#### GET /api/drivers/profile

Get driver profile and stats.

**Headers:** `Authorization: Bearer <token>` (Driver role required)

**Response:**

```json
{
  "driver": {
    "id": "driver-uuid",
    "user_id": "user-uuid",
    "status": "active",
    "is_available": true,
    "rating": 4.8,
    "total_rides": 145,
    "total_earnings": 12450.75,
    "vehicle": {
      "make": "Toyota",
      "model": "Camry",
      "license_plate": "AB12CD34",
      "color": "White"
    },
    "current_location": {
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "stats": {
      "today_rides": 8,
      "today_earnings": 456.5,
      "this_week_rides": 42,
      "this_week_earnings": 2340.25,
      "acceptance_rate": 0.92,
      "cancellation_rate": 0.03
    }
  }
}
```

#### PUT /api/drivers/location

Update driver location.

**Headers:** `Authorization: Bearer <token>` (Driver role required)

**Request:**

```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "heading": 45.5,
  "speed": 25.0
}
```

**Response:**

```json
{
  "success": true,
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "updated_at": "2023-01-01T12:15:00Z"
  }
}
```

#### PUT /api/drivers/availability

Toggle driver availability.

**Headers:** `Authorization: Bearer <token>` (Driver role required)

**Request:**

```json
{
  "is_available": true
}
```

**Response:**

```json
{
  "driver": {
    "id": "driver-uuid",
    "is_available": true,
    "updated_at": "2023-01-01T12:20:00Z"
  }
}
```

### Payments

#### POST /api/payments/create-intent

Create payment intent for booking.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "booking_id": "booking-uuid",
  "amount": 85.5,
  "currency": "INR",
  "payment_method": "razorpay"
}
```

**Response:**

```json
{
  "payment_intent": {
    "id": "pi_123456789",
    "client_secret": "pi_123456789_secret_abc",
    "amount": 8550,
    "currency": "INR",
    "status": "requires_payment_method"
  }
}
```

#### POST /api/payments/confirm

Confirm payment for booking.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "payment_intent_id": "pi_123456789",
  "payment_method_id": "pm_123456789",
  "booking_id": "booking-uuid"
}
```

**Response:**

```json
{
  "payment": {
    "id": "payment-uuid",
    "booking_id": "booking-uuid",
    "amount": 85.5,
    "currency": "INR",
    "status": "succeeded",
    "payment_method": "razorpay",
    "transaction_id": "txn_123456789",
    "created_at": "2023-01-01T12:30:00Z"
  }
}
```

#### GET /api/payments/history

Get payment history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `from_date` (optional): Start date
- `to_date` (optional): End date

**Response:**

```json
{
  "payments": [
    {
      "id": "payment-uuid",
      "booking_id": "booking-uuid",
      "amount": 85.5,
      "currency": "INR",
      "status": "succeeded",
      "payment_method": "razorpay",
      "created_at": "2023-01-01T12:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

### Wallet

#### GET /api/wallet/balance

Get wallet balance.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "wallet": {
    "balance": 150.5,
    "currency": "INR",
    "last_updated": "2023-01-01T12:00:00Z"
  }
}
```

#### POST /api/wallet/add-money

Add money to wallet.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "amount": 100.0,
  "payment_method_id": "pm_123456789"
}
```

**Response:**

```json
{
  "transaction": {
    "id": "txn-uuid",
    "type": "credit",
    "amount": 100.0,
    "status": "completed",
    "description": "Wallet top-up",
    "created_at": "2023-01-01T12:45:00Z"
  },
  "new_balance": 250.5
}
```

#### GET /api/wallet/transactions

Get wallet transaction history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Transaction type (credit, debit)

**Response:**

```json
{
  "transactions": [
    {
      "id": "txn-uuid",
      "type": "debit",
      "amount": 85.5,
      "status": "completed",
      "description": "Ride payment - Booking #ABC123",
      "booking_id": "booking-uuid",
      "created_at": "2023-01-01T12:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "total_pages": 2
  }
}
```

### Admin APIs

#### GET /api/admin/dashboard

Get admin dashboard data.

**Headers:** `Authorization: Bearer <token>` (Admin role required)

**Response:**

```json
{
  "stats": {
    "total_users": 1250,
    "total_drivers": 185,
    "active_bookings": 42,
    "today_revenue": 15670.5,
    "pending_driver_approvals": 8
  },
  "metrics": {
    "bookings_today": 156,
    "bookings_this_week": 1024,
    "avg_rating": 4.6,
    "completion_rate": 0.94
  },
  "recent_activities": [
    {
      "type": "new_booking",
      "message": "New booking created by user John Doe",
      "timestamp": "2023-01-01T12:45:00Z"
    }
  ]
}
```

#### GET /api/admin/drivers/pending

Get drivers pending approval.

**Headers:** `Authorization: Bearer <token>` (Admin role required)

**Response:**

```json
{
  "drivers": [
    {
      "id": "driver-uuid",
      "user": {
        "name": "Driver Name",
        "email": "driver@example.com",
        "phone": "+1234567890"
      },
      "license_number": "DL1234567890",
      "vehicle": {
        "make": "Toyota",
        "model": "Camry",
        "license_plate": "AB12CD34"
      },
      "documents": {
        "license_verified": false,
        "vehicle_registration_verified": false,
        "insurance_verified": false
      },
      "applied_at": "2023-01-01T10:00:00Z"
    }
  ]
}
```

#### PUT /api/admin/drivers/:id/approve

Approve driver application.

**Headers:** `Authorization: Bearer <token>` (Admin role required)

**Request:**

```json
{
  "approved": true,
  "notes": "All documents verified successfully"
}
```

**Response:**

```json
{
  "driver": {
    "id": "driver-uuid",
    "status": "active",
    "approved_at": "2023-01-01T12:50:00Z",
    "approved_by": "admin-uuid"
  }
}
```

## WebSocket Events

### Connection

```javascript
const socket = io("wss://api.fairgo.com", {
  auth: {
    token: "jwt-token-here",
  },
});
```

### User Events

- `booking_status_update`: Booking status changed
- `driver_assigned`: Driver assigned to booking
- `driver_location_update`: Driver location update during trip
- `trip_started`: Trip started
- `trip_completed`: Trip completed

### Driver Events

- `new_booking_request`: New booking available
- `booking_cancelled`: Booking cancelled by user
- `payment_received`: Payment received for completed trip

### Example Event Payloads

**booking_status_update:**

```json
{
  "booking_id": "booking-uuid",
  "status": "confirmed",
  "driver": {
    "id": "driver-uuid",
    "name": "Driver Name",
    "phone": "+1234567890",
    "vehicle": {
      "make": "Toyota",
      "model": "Camry",
      "license_plate": "AB12CD34"
    }
  },
  "estimated_arrival": 8
}
```

**driver_location_update:**

```json
{
  "booking_id": "booking-uuid",
  "driver_location": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "heading": 45.5
  },
  "estimated_time_to_pickup": 3
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require("axios");

class FairGoAPI {
  constructor(baseURL = "https://api.fairgo.com", token = null) {
    this.baseURL = baseURL;
    this.token = token;
    this.client = axios.create({
      baseURL,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async signin(email, password) {
    const response = await this.client.post("/api/auth/signin", {
      email,
      password,
    });
    this.token = response.data.token;
    this.client.defaults.headers.Authorization = `Bearer ${this.token}`;
    return response.data;
  }

  async createBooking(bookingData) {
    const response = await this.client.post("/api/bookings", bookingData);
    return response.data;
  }

  async getBookings(params = {}) {
    const response = await this.client.get("/api/bookings", { params });
    return response.data;
  }
}

// Usage
const api = new FairGoAPI();
await api.signin("user@example.com", "password");
const booking = await api.createBooking({
  pickup_location: { latitude: 12.9716, longitude: 77.5946 },
  dropoff_location: { latitude: 12.935, longitude: 77.6245 },
  ride_type: "economy",
});
```

### Python

```python
import requests
from typing import Dict, Optional

class FairGoAPI:
    def __init__(self, base_url: str = "https://api.fairgo.com", token: Optional[str] = None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        if token:
            self.session.headers.update({"Authorization": f"Bearer {token}"})

    def signin(self, email: str, password: str) -> Dict:
        response = self.session.post(f"{self.base_url}/api/auth/signin", json={
            "email": email,
            "password": password
        })
        response.raise_for_status()
        data = response.json()
        self.token = data["token"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        return data

    def create_booking(self, booking_data: Dict) -> Dict:
        response = self.session.post(f"{self.base_url}/api/bookings", json=booking_data)
        response.raise_for_status()
        return response.json()

# Usage
api = FairGoAPI()
api.signin("user@example.com", "password")
booking = api.create_booking({
    "pickup_location": {"latitude": 12.9716, "longitude": 77.5946},
    "dropoff_location": {"latitude": 12.9350, "longitude": 77.6245},
    "ride_type": "economy"
})
```

This comprehensive API documentation provides all necessary information for integrating with the FairGo platform.
