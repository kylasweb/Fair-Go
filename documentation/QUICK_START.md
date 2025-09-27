# FairGo Platform - Quick Start Guide

## Get Up and Running in 5 Minutes

Welcome to FairGo! This quick start guide will help you get the platform running locally in just a few minutes.

## Prerequisites Checklist

Before you start, make sure you have:

- [x] **Node.js 18+ LTS** ([Download here](https://nodejs.org/))
- [x] **PostgreSQL 14+** ([Download here](https://postgresql.org/download/))
- [x] **Git** ([Download here](https://git-scm.com/))
- [x] **Code editor** (VS Code recommended)

## 🚀 Quick Setup (5 steps)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/fairgo-official/fairgo-platform.git
cd fairgo-platform

# Install dependencies (this may take a few minutes)
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local
```

Open `.env.local` and add your configuration:

```env
# Database (replace with your PostgreSQL connection)
DATABASE_URL="postgresql://username:password@localhost:5432/fairgo_dev"

# Required for authentication
JWT_SECRET="your-super-secure-jwt-secret-key-change-this"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-change-this"

# Optional: Add later for full functionality
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_SECRET="your-razorpay-secret"

NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create and run database migrations
npx prisma migrate dev --name init

# (Optional) Seed with test data
npx prisma db seed
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev
```

### 5. Open in Browser

Open [http://localhost:3000](http://localhost:3000) in your browser.

**🎉 You're ready to go!**

---

## What You Can Do Now

### For Users (Passengers)

1. **Sign Up**: Create a new passenger account
2. **Book a Ride**: Try the booking interface
3. **View Bookings**: See your ride history

### For Drivers

1. **Register as Driver**: Go to `/driver/register`
2. **Driver Dashboard**: Access driver features at `/driver/dashboard`

### For Admins

1. **Admin Panel**: Access admin features at `/admin`
2. **Manage Users**: View and manage users and drivers

---

## Optional: External Services Setup

For full functionality, you'll want to set up these external services:

### Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API and Places API
3. Create API key and add to `GOOGLE_MAPS_API_KEY`

### Payment Processing (Razorpay)

1. Sign up at [Razorpay](https://razorpay.com/)
2. Get your API keys from the dashboard
3. Add to `RAZORPAY_KEY_ID` and `RAZORPAY_SECRET`

---

## Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Check code quality
npm run lint

# Type check
npm run type-check

# Database commands
npx prisma studio        # Open database viewer
npx prisma migrate dev   # Run new migrations
npx prisma db seed       # Seed test data
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
# Windows: Check services
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Test connection
psql -U username -d fairgo_dev -c "SELECT version();"
```

### Port Already in Use

```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Package Installation Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

1. **Read the Documentation**

   - [User Guide](./USER_GUIDE.md) - Learn how to use the platform
   - [Developer Guide](./DEVELOPER_GUIDE.md) - Dive deeper into development
   - [API Documentation](./API_DOCUMENTATION.md) - Understand the API

2. **Explore the Code**

   - Check out `src/app/page.tsx` for the homepage
   - Look at `src/components/` for React components
   - Explore `src/app/api/` for backend API routes

3. **Start Contributing**
   - Read [Contributing Guidelines](./CONTRIBUTING.md)
   - Find a "good first issue" on GitHub
   - Join our community discussions

---

## Getting Help

- **Documentation**: Check our comprehensive guides
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions in GitHub Discussions
- **Discord**: Join our community chat
- **Email**: Contact us at support@fairgo.com

---

## What's Included

✅ **User Authentication** - Sign up, sign in, password reset  
✅ **Booking System** - Create, manage, and track ride bookings  
✅ **Driver Registration** - Driver onboarding and verification  
✅ **Admin Dashboard** - Platform management interface  
✅ **Payment Integration** - Secure payment processing  
✅ **Real-time Updates** - WebSocket-based live updates  
✅ **Mobile Responsive** - Works great on all devices  
✅ **Performance Optimized** - Fast loading and smooth experience

---

**Happy coding! 🚀**

Need help? Don't hesitate to ask in our community channels!
