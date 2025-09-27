# FairGo Platform - Developer Guide

## Overview

FairGo is a comprehensive taxi booking platform built with modern web technologies. This guide provides developers with all the information needed to understand, modify, extend, and maintain the platform.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Core Features](#core-features)
- [API Development](#api-development)
- [Database Schema](#database-schema)
- [Real-time Features](#real-time-features)
- [Testing Strategy](#testing-strategy)
- [Performance Optimization](#performance-optimization)
- [Security Implementation](#security-implementation)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)
- [Contributing Guidelines](#contributing-guidelines)

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
│                     (Nginx)                            │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                  Application Layer                      │
│                   (Next.js)                           │
├─────────────────────────────────────────────────────────┤
│                  API Routes                            │
│           (/api/auth, /api/bookings, etc.)            │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                  Database Layer                        │
│                 (PostgreSQL)                          │
│                  + Prisma ORM                         │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                External Services                       │
│         (Maps API, Payment Gateway, SMS)              │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

- **Frontend**: React with Next.js for SSR/SSG
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: JWT-based with secure token management
- **Real-time**: WebSocket connections for live updates
- **Testing**: Jest + Testing Library + Playwright
- **Deployment**: Docker containers with CI/CD pipeline

## Technology Stack

### Frontend Technologies

- **Next.js 14**: React framework with App Router
- **React 18**: Component library with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library
- **Framer Motion**: Animation library

### Backend Technologies

- **Node.js**: Runtime environment
- **Next.js API Routes**: Backend API endpoints
- **Prisma**: Database ORM and query builder
- **PostgreSQL**: Primary database
- **Redis**: Caching and session management
- **WebSocket**: Real-time communication

### Development Tools

- **ESLint + Prettier**: Code formatting and linting
- **Husky**: Git hooks for quality assurance
- **Jest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Storybook**: Component development and testing

### DevOps and Deployment

- **Docker**: Containerization
- **GitHub Actions**: CI/CD pipeline
- **Nginx**: Reverse proxy and load balancer
- **PM2**: Process management
- **Sentry**: Error monitoring and performance tracking

## Development Setup

### Prerequisites

```bash
# Required software
- Node.js 18+ LTS
- npm or yarn
- PostgreSQL 14+
- Redis 6+ (optional for development)
- Git
```

### Environment Setup

1. **Clone the Repository**

```bash
git clone https://github.com/yourorg/fairgo-platform.git
cd fairgo-platform
```

2. **Install Dependencies**

```bash
npm install
# or
yarn install
```

3. **Environment Configuration**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fairgo_dev"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# External APIs
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_SECRET="your-razorpay-secret"

# Development
NODE_ENV="development"
```

4. **Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

5. **Start Development Server**

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

### Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
npm run db:seed      # Seed database with test data
npm run db:studio    # Open Prisma Studio

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Generate test coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking

# Build and Deployment
npm run build        # Production build
npm run analyze      # Analyze bundle size
npm run docker:build # Build Docker image
npm run docker:run   # Run Docker container
```

## Project Structure

```
fairgo-platform/
├── public/                  # Static assets
│   ├── images/
│   ├── icons/
│   └── manifest.json
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Authentication pages
│   │   ├── (dashboard)/    # Dashboard pages
│   │   ├── api/            # API routes
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── forms/         # Form components
│   │   ├── layouts/       # Layout components
│   │   └── features/      # Feature-specific components
│   ├── lib/               # Utility libraries
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── db.ts          # Database connection
│   │   ├── utils.ts       # General utilities
│   │   ├── validation.ts  # Input validation schemas
│   │   └── api.ts         # API client utilities
│   ├── hooks/             # Custom React hooks
│   ├── store/             # State management (Zustand)
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Additional styling
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── docs/                 # Documentation
├── .github/              # GitHub workflows
├── docker-compose.yml    # Docker composition
├── Dockerfile           # Docker configuration
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

### Key Directories Explained

#### `/src/app/`

Next.js 14 App Router structure:

- `layout.tsx`: Root layout component
- `page.tsx`: Home page component
- `api/`: Backend API endpoints
- Route groups `(auth)`, `(dashboard)` for organization

#### `/src/components/`

Reusable React components:

- `ui/`: Base UI components from shadcn/ui
- `forms/`: Form-specific components
- `features/`: Business logic components (BookingInterface, DriverDashboard, etc.)

#### `/src/lib/`

Core utility libraries:

- `auth.ts`: Authentication and authorization logic
- `db.ts`: Database connection and utilities
- `validation.ts`: Zod schemas for input validation
- `utils.ts`: General utility functions

#### `/src/store/`

Zustand store definitions:

- `authStore.ts`: Authentication state
- `bookingStore.ts`: Booking management state
- `uiStore.ts`: UI state (modals, loading, etc.)

## Core Features

### Authentication System

The platform implements JWT-based authentication with the following features:

```typescript
// Example: Authentication hook
const useAuth = () => {
  const { user, token, login, logout } = useAuthStore();

  const signIn = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post("/api/auth/signin", credentials);
      const { user, token } = response.data;

      // Store in memory and localStorage
      useAuthStore.getState().setAuth(user, token);

      return { user, token };
    } catch (error) {
      throw new Error("Authentication failed");
    }
  };

  return { user, token, signIn, logout };
};
```

**Key Components:**

- JWT token generation and validation
- Secure password hashing with bcrypt
- Role-based access control (user, driver, admin)
- Session management with automatic refresh

### Booking System

Real-time booking management with the following workflow:

```typescript
// Example: Booking creation
const createBooking = async (bookingData: BookingRequest) => {
  // 1. Validate booking data
  const validatedData = bookingSchema.parse(bookingData);

  // 2. Calculate fare estimate
  const fareEstimate = calculateFare(
    validatedData.pickupLocation,
    validatedData.dropoffLocation,
    validatedData.vehicleType
  );

  // 3. Find available drivers
  const availableDrivers = await findNearbyDrivers(
    validatedData.pickupLocation,
    5 // 5km radius
  );

  // 4. Create booking in database
  const booking = await prisma.booking.create({
    data: {
      ...validatedData,
      fareEstimate,
      status: "PENDING",
    },
  });

  // 5. Notify nearby drivers via WebSocket
  notifyDrivers(availableDrivers, booking);

  return booking;
};
```

**Features:**

- Real-time driver matching
- Dynamic fare calculation
- Route optimization
- Multi-stop support
- Scheduled booking capability

### Real-time Communication

WebSocket implementation for live updates:

```typescript
// WebSocket connection management
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    this.ws = new WebSocket(`ws://localhost:3001?token=${token}`);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      this.handleReconnect();
    };
  }

  private handleMessage(data: WebSocketMessage) {
    switch (data.type) {
      case "BOOKING_UPDATE":
        useBookingStore.getState().updateBooking(data.booking);
        break;
      case "DRIVER_LOCATION":
        useMapStore.getState().updateDriverLocation(data.location);
        break;
    }
  }
}
```

### Payment Processing

Secure payment handling with multiple gateways:

```typescript
// Payment processing workflow
const processPayment = async (
  bookingId: string,
  paymentMethod: PaymentMethod
) => {
  const booking = await getBooking(bookingId);

  // Create payment intent
  const paymentIntent = await createPaymentIntent({
    amount: booking.finalFare,
    currency: "USD",
    paymentMethod,
    metadata: { bookingId },
  });

  try {
    // Process payment
    const result = await confirmPayment(paymentIntent.id, paymentMethod);

    if (result.status === "succeeded") {
      // Update booking status
      await updateBookingStatus(bookingId, "COMPLETED");

      // Record payment
      await recordPayment({
        bookingId,
        amount: booking.finalFare,
        paymentIntentId: paymentIntent.id,
        status: "COMPLETED",
      });

      return { success: true, paymentId: result.id };
    }
  } catch (error) {
    // Handle payment failure
    await recordPayment({
      bookingId,
      amount: booking.finalFare,
      status: "FAILED",
      error: error.message,
    });

    throw error;
  }
};
```

## API Development

### API Route Structure

Next.js API routes are organized by feature:

```
/api/
├── auth/
│   ├── signin/route.ts
│   ├── signup/route.ts
│   ├── signout/route.ts
│   └── me/route.ts
├── bookings/
│   ├── route.ts           # GET /api/bookings, POST /api/bookings
│   ├── [id]/route.ts      # GET, PUT, DELETE /api/bookings/:id
│   └── nearby/route.ts    # GET /api/bookings/nearby
├── drivers/
│   ├── route.ts
│   ├── [id]/route.ts
│   ├── register/route.ts
│   └── location/route.ts
├── payments/
│   ├── route.ts
│   ├── intents/route.ts
│   └── webhooks/route.ts
└── admin/
    ├── dashboard/route.ts
    ├── users/route.ts
    └── drivers/route.ts
```

### API Route Example

```typescript
// /src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { bookingSchema } from "@/lib/validation";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            rating: true,
            vehicle: true,
          },
        },
      },
    });

    return NextResponse.json({ bookings, page, limit });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

    const booking = await prisma.booking.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    // Emit real-time event for driver matching
    await notifyAvailableDrivers(booking);

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Failed to create booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Middleware Implementation

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Protect API routes
  if (pathname.startsWith("/api/protected/")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Role-based access control
  if (pathname.startsWith("/api/admin/")) {
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Rate limiting
  const ip =
    request.ip || request.headers.get("x-forwarded-for") || "anonymous";
  const rateLimitResult = await checkRateLimit(ip, pathname);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/driver/:path*"],
};
```

## Database Schema

### Core Entities

The database schema is defined using Prisma ORM:

```prisma
// schema.prisma

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  phone     String   @unique
  name      String?
  avatar    String?
  role      UserRole @default(USER)
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  bookings     Booking[]
  driver       Driver?
  payments     Payment[]
  reviews      Review[]
  wallet       Wallet?

  @@map("users")
}

model Driver {
  id              String       @id @default(cuid())
  userId          String       @unique
  licenseNumber   String       @unique
  status          DriverStatus @default(PENDING)
  isAvailable     Boolean      @default(false)
  currentLocation Json?
  rating          Float        @default(0)
  totalRides      Int          @default(0)
  totalEarnings   Float        @default(0)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Relations
  user        User        @relation(fields: [userId], references: [id])
  vehicle     Vehicle?
  bookings    Booking[]
  reviews     Review[]
  earnings    Earning[]

  @@map("drivers")
}

model Booking {
  id               String        @id @default(cuid())
  userId           String
  driverId         String?
  pickupLocation   Json
  dropoffLocation  Json
  status           BookingStatus @default(PENDING)
  vehicleType      VehicleType
  fareEstimate     Float
  finalFare        Float?
  distance         Float?
  duration         Int? // in minutes
  scheduledAt      DateTime?
  startedAt        DateTime?
  completedAt      DateTime?
  cancelledAt      DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  // Relations
  user      User      @relation(fields: [userId], references: [id])
  driver    Driver?   @relation(fields: [driverId], references: [id])
  payment   Payment?
  review    Review?

  @@map("bookings")
}

model Vehicle {
  id               String @id @default(cuid())
  driverId         String @unique
  make             String
  model            String
  year             Int
  color            String
  licensePlate     String @unique
  registrationNumber String
  insuranceExpiry  DateTime
  inspectionExpiry DateTime
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  driver Driver @relation(fields: [driverId], references: [id])

  @@map("vehicles")
}

// Enums
enum UserRole {
  USER
  DRIVER
  ADMIN
}

enum DriverStatus {
  PENDING
  APPROVED
  SUSPENDED
  REJECTED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  DRIVER_EN_ROUTE
  ARRIVED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum VehicleType {
  ECONOMY
  COMFORT
  PREMIUM
}
```

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_user_wallet

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Database Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@fairgo.com",
      phone: "+1234567890",
      name: "Admin User",
      role: "ADMIN",
      verified: true,
      password: adminPassword,
    },
  });

  // Create test drivers
  const drivers = await Promise.all([
    createDriver("driver1@fairgo.com", "John Smith", "+1234567891"),
    createDriver("driver2@fairgo.com", "Jane Doe", "+1234567892"),
  ]);

  // Create test users
  const users = await Promise.all([
    createUser("user1@fairgo.com", "Alice Johnson", "+1234567893"),
    createUser("user2@fairgo.com", "Bob Wilson", "+1234567894"),
  ]);

  console.log("Seed data created successfully");
}

async function createDriver(email: string, name: string, phone: string) {
  const password = await bcrypt.hash("driver123", 12);
  return prisma.user.create({
    data: {
      email,
      phone,
      name,
      role: "DRIVER",
      verified: true,
      password,
      driver: {
        create: {
          licenseNumber: `DL${Math.random().toString().substr(2, 8)}`,
          status: "APPROVED",
          isAvailable: true,
          vehicle: {
            create: {
              make: "Toyota",
              model: "Camry",
              year: 2020,
              color: "White",
              licensePlate: `ABC${Math.random().toString().substr(2, 4)}`,
              registrationNumber: `REG${Math.random().toString().substr(2, 6)}`,
              insuranceExpiry: new Date("2024-12-31"),
              inspectionExpiry: new Date("2024-06-30"),
            },
          },
        },
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Testing Strategy

### Unit Testing

```typescript
// tests/unit/utils.test.ts
import { calculateFare, calculateDistance } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("calculateFare", () => {
    it("calculates basic fare correctly", () => {
      const fare = calculateFare(5.0, "ECONOMY", 1.0);
      expect(fare).toBe(12.5); // $2.50 base + $2.00/km * 5km
    });

    it("applies surge pricing", () => {
      const fare = calculateFare(5.0, "ECONOMY", 1.5);
      expect(fare).toBe(18.75); // Basic fare * 1.5 surge
    });

    it("handles premium vehicle pricing", () => {
      const fare = calculateFare(5.0, "PREMIUM", 1.0);
      expect(fare).toBe(22.5); // Higher rate for premium vehicles
    });
  });

  describe("calculateDistance", () => {
    it("calculates distance between two points", () => {
      const distance = calculateDistance(
        { lat: 40.7128, lng: -74.006 }, // NYC
        { lat: 40.7589, lng: -73.9851 } // Times Square
      );
      expect(distance).toBeCloseTo(5.86, 1); // Approximately 5.86 km
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/booking.test.ts
import { createMocks } from "node-mocks-http";
import handler from "@/app/api/bookings/route";
import { prisma } from "@/lib/db";

describe("/api/bookings", () => {
  beforeEach(async () => {
    await prisma.booking.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("POST /api/bookings", () => {
    it("creates a new booking", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          pickupLocation: { lat: 40.7128, lng: -74.006 },
          dropoffLocation: { lat: 40.7589, lng: -73.9851 },
          vehicleType: "ECONOMY",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.booking).toMatchObject({
        status: "PENDING",
        vehicleType: "ECONOMY",
      });
    });

    it("validates required fields", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {}, // Missing required fields
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Validation failed");
    });
  });
});
```

### End-to-End Testing

```typescript
// tests/e2e/booking-flow.test.ts
import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  test("complete booking journey", async ({ page }) => {
    // Login as user
    await page.goto("/auth/signin");
    await page.fill("[data-testid=email]", "user@fairgo.com");
    await page.fill("[data-testid=password]", "password123");
    await page.click("[data-testid=signin-button]");

    // Navigate to booking page
    await page.goto("/booking");

    // Fill pickup location
    await page.fill("[data-testid=pickup-input]", "123 Main St, New York");
    await page.waitForSelector("[data-testid=pickup-suggestions]");
    await page.click("[data-testid=pickup-suggestion]:first-child");

    // Fill dropoff location
    await page.fill("[data-testid=dropoff-input]", "456 Broadway, New York");
    await page.waitForSelector("[data-testid=dropoff-suggestions]");
    await page.click("[data-testid=dropoff-suggestion]:first-child");

    // Select vehicle type
    await page.click("[data-testid=vehicle-economy]");

    // Verify fare estimate
    await page.waitForSelector("[data-testid=fare-estimate]");
    const fareText = await page.textContent("[data-testid=fare-estimate]");
    expect(fareText).toContain("$");

    // Create booking
    await page.click("[data-testid=book-ride-button]");

    // Verify booking confirmation
    await page.waitForSelector("[data-testid=booking-confirmation]");
    expect(page.url()).toContain("/booking/");

    const confirmationText = await page.textContent(
      "[data-testid=booking-status]"
    );
    expect(confirmationText).toContain("Looking for drivers");
  });

  test("handles geolocation permission", async ({ context, page }) => {
    // Grant geolocation permission
    await context.grantPermissions(["geolocation"], {
      origin: "http://localhost:3000",
    });

    await page.goto("/booking");

    // Click use current location
    await page.click("[data-testid=use-current-location]");

    // Verify location was populated
    await expect(page.locator("[data-testid=pickup-input]")).not.toBeEmpty();
  });
});
```

## Performance Optimization

### Code Splitting and Lazy Loading

```typescript
// Lazy load components
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const BookingInterface = lazy(
  () => import("@/components/booking/booking-interface")
);
const DriverDashboard = lazy(
  () => import("@/components/driver/driver-dashboard")
);

function App() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <BookingInterface />
    </Suspense>
  );
}
```

### Database Query Optimization

```typescript
// Optimized booking queries
async function getBookingsWithDrivers(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  return prisma.booking.findMany({
    where: { userId },
    select: {
      id: true,
      status: true,
      pickupLocation: true,
      dropoffLocation: true,
      finalFare: true,
      createdAt: true,
      driver: {
        select: {
          id: true,
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
          rating: true,
          vehicle: {
            select: {
              make: true,
              model: true,
              color: true,
              licensePlate: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}
```

### Caching Strategy

```typescript
// Redis caching implementation
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  static async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

// Usage in API routes
export async function GET(request: NextRequest) {
  const cacheKey = `bookings:${userId}:${page}:${limit}`;

  // Try cache first
  let bookings = await CacheService.get(cacheKey);

  if (!bookings) {
    // Fetch from database
    bookings = await getBookingsWithDrivers(userId, page, limit);

    // Cache for 5 minutes
    await CacheService.set(cacheKey, bookings, 300);
  }

  return NextResponse.json({ bookings });
}
```

### Image Optimization

```typescript
// Next.js Image component with optimization
import Image from "next/image";

export function DriverAvatar({ driver }: { driver: Driver }) {
  return (
    <Image
      src={driver.avatar || "/images/default-avatar.png"}
      alt={`${driver.name} profile picture`}
      width={48}
      height={48}
      className="rounded-full"
      priority={false}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
    />
  );
}
```

## Security Implementation

### Input Validation

```typescript
// Zod validation schemas
import { z } from "zod";

export const bookingSchema = z.object({
  pickupLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(5).max(200),
  }),
  dropoffLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(5).max(200),
  }),
  vehicleType: z.enum(["ECONOMY", "COMFORT", "PREMIUM"]),
  scheduledAt: z.string().datetime().optional(),
  paymentMethod: z.enum(["CARD", "WALLET", "CASH"]).default("CARD"),
  specialRequests: z.string().max(500).optional(),
});

export const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{10,14}$/),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  role: z.enum(["USER", "DRIVER"]).default("USER"),
});
```

### Rate Limiting

```typescript
// Rate limiting middleware
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limits for different endpoints
const rateLimits = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
    analytics: true,
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 requests per hour
    analytics: true,
  }),
  booking: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 m"), // 10 bookings per 10 minutes
    analytics: true,
  }),
};

export async function applyRateLimit(
  identifier: string,
  type: keyof typeof rateLimits
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  const rateLimit = rateLimits[type];
  const result = await rateLimit.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: new Date(result.reset),
  };
}
```

### SQL Injection Prevention

```typescript
// Always use Prisma queries or parameterized queries
// ✅ Good - Using Prisma ORM
async function getUserBookings(userId: string, status?: string) {
  return prisma.booking.findMany({
    where: {
      userId, // Prisma handles parameterization automatically
      ...(status && { status }),
    },
  });
}

// ❌ Bad - String concatenation (vulnerable to SQL injection)
// async function getUserBookings(userId: string) {
//   return prisma.$queryRaw`SELECT * FROM bookings WHERE user_id = ${userId}`
// }

// ✅ Good - If raw queries are needed, use parameterized queries
async function getUserBookingsRaw(userId: string) {
  return prisma.$queryRaw`
    SELECT b.*, d.name as driver_name 
    FROM bookings b 
    LEFT JOIN drivers d ON b.driver_id = d.id 
    WHERE b.user_id = ${userId}
  `;
}
```

### XSS Prevention

```typescript
// Input sanitization
import DOMPurify from "isomorphic-dompurify";

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous HTML/JavaScript
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });
}

// Content Security Policy headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://api.razorpay.com wss:",
      "frame-src https://js.stripe.com https://checkout.razorpay.com",
    ].join("; "),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=self, microphone=(), camera=()",
  };
}
```

## Deployment Guide

Refer to the comprehensive [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed production deployment instructions.

### Quick Docker Deployment

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Environment Variables

```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://username:password@localhost:5432/fairgo_prod
JWT_SECRET=your-super-secure-jwt-secret
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret

# External services
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_SECRET=your-razorpay-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connection
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

#### Build Issues

```bash
# Clear Next.js cache
rm -rf .next/

# Clear node_modules
rm -rf node_modules/
npm install

# Type check
npx tsc --noEmit
```

#### Performance Issues

```bash
# Analyze bundle size
npm run analyze

# Check for memory leaks
node --inspect --max-old-space-size=4096 node_modules/.bin/next dev

# Profile React components
npm install --save-dev @welldone-software/why-did-you-render
```

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem("debug", "fairgo:*");

// Debug specific modules
localStorage.setItem("debug", "fairgo:booking,fairgo:payment");

// In code
import debug from "debug";
const log = debug("fairgo:booking");

log("Creating booking", { userId, bookingData });
```

### Error Reporting

The platform uses Sentry for error tracking:

```typescript
// Custom error boundary
import * as Sentry from "@sentry/nextjs";

export class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: errorInfo,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

## Contributing Guidelines

### Code Standards

1. **TypeScript**: All code must be written in TypeScript with strict mode enabled
2. **ESLint**: Follow the configured ESLint rules
3. **Prettier**: Code must be formatted with Prettier
4. **Testing**: All new features must include tests
5. **Documentation**: Update documentation for any API changes

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/booking-improvements
git commit -m "feat: add booking cancellation feature"
git push origin feature/booking-improvements
```

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

### Pull Request Process

1. Create feature branch from `main`
2. Write tests for new functionality
3. Update documentation if needed
4. Run full test suite
5. Create pull request with detailed description
6. Get code review approval
7. Merge to main

### Development Checklist

Before submitting code:

- [ ] Tests pass locally
- [ ] TypeScript compilation succeeds
- [ ] ESLint passes without errors
- [ ] Code is formatted with Prettier
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Security considerations addressed

---

## Support and Resources

### Documentation Links

- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [User Guide](./USER_GUIDE.md)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community

- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas
- Discord: Real-time community chat
- Stack Overflow: Technical questions with `fairgo` tag

---

**Happy coding! 🚀**
