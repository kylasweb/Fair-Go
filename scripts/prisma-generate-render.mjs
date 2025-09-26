#!/usr/bin/env node

// Render.com Prisma generation script
// Sets the correct binary targets for Linux deployment

import { execSync } from 'child_process';

// Set environment variable for Prisma binary targets
process.env.PRISMA_CLI_BINARY_TARGETS = 'linux-musl-openssl-3.0.x';

try {
  console.log('🔧 Generating Prisma client for Render.com deployment...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully for Linux platform');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}