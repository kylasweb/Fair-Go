# Vercel Environment Variables Guide

## Required Environment Variables for Vercel:

### Database

DATABASE_URL=postgresql://username:password@host:port/database?schema=public

### Next.js

NEXTAUTH_SECRET=your-super-secret-key-32-chars-min
NEXTAUTH_URL=https://your-app.vercel.app

### Optional - Google Cloud APIs (if using speech features)

GOOGLE_APPLICATION_CREDENTIALS_JSON='{...your-service-account-json...}'

### Socket.IO (optional)

SOCKET_IO_SECRET=your-socket-secret

### Performance

NODE_OPTIONS=--max-old-space-size=1024

## Setup Instructions:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable above with your actual values
5. Redeploy your application

## Database Options for Vercel:

### Option 1: Vercel Postgres (Recommended)

- Go to Storage tab in Vercel dashboard
- Create new Postgres database
- Copy connection string to DATABASE_URL

### Option 2: External Database

- Supabase: https://supabase.com (Free tier available)
- PlanetScale: https://planetscale.com (Free tier available)
- Neon: https://neon.tech (Free tier available)
- Railway: https://railway.app (Free tier available)
