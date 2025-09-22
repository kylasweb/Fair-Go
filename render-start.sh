#!/bin/bash

# Render.com startup script for FairGo
echo "🚀 Starting FairGo on Render.com..."

# Ensure Prisma client is generated
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema (for migrations)
echo "🗄️ Pushing database schema..."
npx prisma db push

# Start the application
echo "✅ Starting Next.js server with custom server..."
exec npm run start:render