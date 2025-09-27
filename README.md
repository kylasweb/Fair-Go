# � FairGo - Modern Ride-Hailing Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.5-green)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive, AI-powered ride-hailing platform built with modern web technologies. FairGo revolutionizes ride-sharing with competitive bidding, real-time navigation, and advanced driver-rider matching.

## � Key Features

### 🏆 **Competitive Bidding System**

- **Auction-style ride allocation** with real-time bidding
- **Dynamic pricing** based on demand and driver competition
- **Time-limited auctions** with automatic winner selection
- **Transparent bidding history** and driver ratings

### 💰 **Advanced Commission & Earnings**

- **Customizable commission rates** by time, day, and distance
- **Real-time earnings tracking** for drivers
- **Admin commission management** with detailed analytics
- **Wallet system** with deposits, withdrawals, and transaction history

### 🗺️ **Real-Time Navigation & Tracking**

- **Live GPS tracking** for drivers and riders
- **Route optimization** with Google Maps integration
- **ETA calculations** with traffic-aware routing
- **WebSocket-powered** real-time location updates

### 🎯 **AI-Powered Features**

- **Voice booking** with Google Speech-to-Text
- **AI chat support** for customer service
- **Smart matching** algorithms for optimal ride allocation
- **Predictive pricing** based on historical data

### � **Multi-Role User Management**

- **Riders**: Book rides, track drivers, manage payments
- **Drivers**: Accept rides, manage earnings, update location
- **Admins**: Platform management, analytics, commission control

## �️ Technology Stack

### 🎯 **Core Framework**

- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript 5** - Type-safe JavaScript development
- **� Tailwind CSS 4** - Utility-first CSS framework
- **🧩 shadcn/ui** - High-quality component library

### 🗄️ **Database & Backend**

- **🗄️ Prisma ORM** - Type-safe database operations
- **🐘 PostgreSQL** - Robust relational database
- **🔐 Custom Auth** - Secure authentication system
- **🌐 WebSocket** - Real-time communication

### 🗺️ **Maps & Location**

- **�️ Google Maps API** - Location services and routing
- **📍 GPS Tracking** - Real-time location updates
- **🧭 Route Optimization** - Efficient path finding

### 🎤 **AI & Voice**

- **🎤 Google Speech-to-Text** - Voice command processing
- **🔊 Google Text-to-Speech** - Audio feedback
- **🤖 AI Chat Integration** - Intelligent customer support

### 📊 **Data & Analytics**

- **📊 Winston Logging** - Comprehensive logging system
- **📈 Performance Monitoring** - Application metrics
- **� Audit Trails** - Security and compliance logging

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **PostgreSQL 15+**
- **Google Maps API Key**
- **Google Cloud Speech API credentials**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/kylasweb/Fair-Go.git
   cd Fair-Go
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/fairgo"
   GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
   GOOGLE_CLOUD_PROJECT_ID="your_project_id"
   NEXTAUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push database schema
   npm run db:push

   # (Optional) Run migrations
   npm run db:migrate
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
fair-go/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── bookings/      # Ride booking APIs
│   │   │   ├── drivers/       # Driver management
│   │   │   ├── wallet/        # Payment & wallet
│   │   │   └── admin/         # Admin panel APIs
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── auth/              # Authentication pages
│   │   ├── booking/           # Ride booking interface
│   │   ├── driver/            # Driver dashboard
│   │   └── profile/           # User profiles
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── auth/              # Authentication components
│   │   ├── booking/           # Booking-related components
│   │   ├── driver/            # Driver components
│   │   ├── bidding/           # Auction system components
│   │   ├── payment/           # Payment components
│   │   └── navigation/        # Maps & navigation
│   ├── lib/                   # Utility libraries
│   │   ├── db.ts              # Database client
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── ai-service.ts      # AI integration
│   │   ├── socket.ts          # WebSocket client
│   │   └── commission/        # Commission calculations
│   └── hooks/                 # Custom React hooks
├── server.ts                  # Express server for WebSocket
├── tailwind.config.ts         # Tailwind configuration
├── next.config.ts            # Next.js configuration
├── prisma.config.ts          # Prisma configuration
└── eslint.config.mjs         # ESLint configuration
```

## 🎯 Core Features Breakdown

### 🏆 **Bidding System**

- **Real-time auctions** for ride allocation
- **Driver bidding interface** with location-based filtering
- **Rider bid management** with countdown timers
- **Automatic winner selection** and booking assignment

### � **Commission Management**

- **Dynamic commission rates** based on multiple factors
- **Driver earnings dashboard** with detailed breakdowns
- **Admin commission controls** with analytics
- **Transparent fee structure** for all stakeholders

### 🗺️ **Navigation & Tracking**

- **Live GPS tracking** with WebSocket updates
- **Route visualization** on interactive maps
- **ETA calculations** with traffic consideration
- **Driver location sharing** with riders

### 👥 **User Management**

- **Role-based access control** (Rider, Driver, Admin)
- **Profile management** with document verification
- **Secure authentication** with session management
- **Multi-device support** with real-time sync

## � API Reference

### Authentication Endpoints

```
POST /api/auth/signin          # User login
POST /api/auth/signup          # User registration
GET  /api/auth/me              # Get current user
POST /api/auth/signout         # User logout
```

### Booking Endpoints

```
GET  /api/bookings             # List user bookings
POST /api/bookings             # Create new booking
GET  /api/bookings/[id]        # Get booking details
PATCH /api/bookings/[id]       # Update booking status
POST /api/bookings/create-bid-ride  # Create bidding-enabled booking
```

### Bidding System

```
POST /api/bookings/[id]/bid    # Place bid on booking
GET  /api/bookings/[id]/bid    # Get bids for booking
POST /api/bookings/[id]/accept-bid/[bidId]  # Accept winning bid
GET  /api/drivers/available-bids  # Get available bidding opportunities
```

### Driver Management

```
GET  /api/drivers/profile      # Get driver profile
POST /api/drivers/register     # Register as driver
GET  /api/drivers/navigation-status/[id]  # Get driver location
```

### Payment & Wallet

```
GET  /api/wallet               # Get wallet balance
GET  /api/wallet/transactions  # Get transaction history
POST /api/wallet/withdrawals/request  # Request withdrawal
```

### Admin Endpoints

```
GET  /api/admin/dashboard      # Admin dashboard data
GET  /api/admin/commissions    # Commission management
GET  /api/admin/withdrawals    # Withdrawal requests
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are set in your deployment platform:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="https://your-domain.com"

# Google Services
GOOGLE_MAPS_API_KEY="..."
GOOGLE_CLOUD_PROJECT_ID="..."

# AI Services (Optional)
OPENAI_API_KEY="..."
```

### Build Commands

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Supported Platforms

- **Vercel** (recommended for Next.js)
- **Railway**
- **Render**
- **AWS/GCP/Azure** (with custom deployment)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📊 Performance & Monitoring

### Logging System

- **Application logs**: General app events
- **Error logs**: Exceptions and failures
- **Audit logs**: Security and compliance events
- **Performance logs**: Response times and metrics

### Monitoring Features

- **Real-time metrics** dashboard
- **Error tracking** and alerting
- **Performance monitoring** with OpenTelemetry
- **Database query optimization**

## � Security

### Authentication & Authorization

- **JWT-based authentication** with secure session management
- **Role-based access control** (RBAC)
- **API rate limiting** and request validation
- **Input sanitization** and SQL injection prevention

### Data Protection

- **GDPR compliance** features
- **Data encryption** at rest and in transit
- **Secure payment processing** with PCI compliance
- **Audit trails** for sensitive operations

## 📈 Roadmap

### Phase 3 (Upcoming)

- [ ] **Advanced Analytics Dashboard**
- [ ] **Mobile App Development**
- [ ] **Multi-city Support**
- [ ] **Integration APIs** for third-party services
- [ ] **Advanced AI Features**

### Future Enhancements

- [ ] **Machine Learning** for demand prediction
- [ ] **Blockchain Integration** for transparent transactions
- [ ] **IoT Integration** for smart vehicle features
- [ ] **Sustainability Features** (eco-friendly routing)

## 📞 Support

- **Documentation**: [docs.fairgo.com](https://docs.fairgo.com)
- **Issues**: [GitHub Issues](https://github.com/kylasweb/Fair-Go/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kylasweb/Fair-Go/discussions)
- **Email**: support@fairgo.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Prisma Team** for the excellent ORM
- **shadcn** for the beautiful UI components
- **Google Cloud** for AI and Maps services
- **Open Source Community** for the incredible tools and libraries

---

**Built with ❤️ for safer, smarter, and more efficient transportation.**

⭐ **Star this repo** if you find it helpful!
