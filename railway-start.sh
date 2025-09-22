#!/bin/bash
# railway-start.sh - Railway startup script

echo "🚂 Starting Railway deployment..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗃️ Running database migrations..."
npx prisma db push

# Start the application
echo "🚀 Starting application..."
exec npm start