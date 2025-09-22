#!/bin/bash
# migrate-production.sh - Production database migration script

set -e

echo "🔄 Starting production database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema (creates tables if they don't exist)
echo "🗃️ Pushing database schema..."
npx prisma db push --accept-data-loss

# Optional: Seed the database
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
fi

echo "✅ Database migration completed successfully!"