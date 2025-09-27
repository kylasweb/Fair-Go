# FairGo Platform - Production Deployment Guide

## Overview

This guide covers the complete production deployment setup for the FairGo taxi booking platform, including environment configuration, CI/CD pipeline, monitoring, and optimizations.

## Environment Setup

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 14+ or MySQL 8+
- Redis 6+ (for caching and sessions)
- PM2 (for process management)
- Nginx (reverse proxy)
- SSL certificates

### Environment Variables

Create a `.env.production` file:

```bash
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://fairgo.com
NEXT_PUBLIC_API_URL=https://api.fairgo.com

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fairgo_prod"

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-256-bits
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Redis Cache
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# External Services
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Maps and Location
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_SECRET=your-razorpay-secret

# Monitoring and Logging
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
ENABLE_METRICS=true

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# WebSocket
WS_PORT=3001
WS_CORS_ORIGIN=https://fairgo.com

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=5MB
UPLOAD_PATH=/var/www/uploads

# Security
CORS_ORIGIN=https://fairgo.com
HELMET_CSP=default-src 'self'
```

## Build and Deployment

### Build Process

```bash
# Install dependencies
npm ci --only=production

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Build the application
npm run build

# Start the application
npm start
```

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "fairgo-app",
      script: "server.ts",
      interpreter: "npx",
      interpreter_args: "tsx",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/fairgo/error.log",
      out_file: "/var/log/fairgo/out.log",
      log_file: "/var/log/fairgo/combined.log",
      time: true,
      watch: false,
      max_memory_restart: "1G",
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s",
    },
    {
      name: "fairgo-websocket",
      script: "websocket-server.ts",
      interpreter: "npx",
      interpreter_args: "tsx",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        WS_PORT: 3001,
      },
    },
  ],
};
```

### Nginx Configuration

Create `/etc/nginx/sites-available/fairgo`:

```nginx
# Upstream servers
upstream fairgo_app {
    least_conn;
    server 127.0.0.1:3000;
    # Add more servers for load balancing
    # server 127.0.0.1:3001;
}

upstream fairgo_ws {
    server 127.0.0.1:3001;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name fairgo.com www.fairgo.com;
    return 301 https://fairgo.com$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name fairgo.com www.fairgo.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/fairgo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fairgo.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Client max body size
    client_max_body_size 10M;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Static files
    location /_next/static/ {
        alias /var/www/fairgo/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias /var/www/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://fairgo_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }

    # Auth endpoints with stricter rate limiting
    location /api/auth/ {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://fairgo_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket connections
    location /ws/ {
        proxy_pass http://fairgo_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js app
    location / {
        proxy_pass http://fairgo_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }
}
```

### Database Optimization

Create `database-tuning.sql`:

```sql
-- Performance tuning for PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_available ON drivers(is_available) WHERE is_available = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);

-- Reload configuration
SELECT pg_reload_conf();
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test -- --coverage --watchAll=false
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Archive production artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: |
            .next/
            public/
            package.json
            package-lock.json

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          script: |
            cd /var/www/fairgo
            git pull origin main
            npm ci --only=production
            npm run db:migrate
            npm run build
            pm2 restart fairgo-app
            pm2 restart fairgo-websocket

  notify:
    needs: [test, build, deploy]
    runs-on: ubuntu-latest
    if: always()

    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: "#deployments"
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Docker Configuration

Create `Dockerfile`:

```dockerfile
# Multi-stage build
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Create `docker-compose.production.yml`:

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://fairgo:${DB_PASSWORD}@db:5432/fairgo
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  websocket:
    build:
      context: .
      dockerfile: Dockerfile.websocket
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=fairgo
      - POSTGRES_USER=fairgo
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## Monitoring and Logging

### Health Check Endpoint

The application includes health check endpoints:

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status

### Logging Configuration

Configure Winston for production logging:

```javascript
// logger.config.js
const winston = require("winston");
const { format } = winston;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: "fairgo-api" },
  transports: [
    new winston.transports.File({
      filename: "/var/log/fairgo/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "/var/log/fairgo/combined.log",
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

module.exports = logger;
```

### Performance Monitoring

Set up monitoring with Prometheus and Grafana:

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
sudo cp prometheus-*/prometheus /usr/local/bin/
sudo cp prometheus-*/promtool /usr/local/bin/

# Create Prometheus configuration
cat > /etc/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'fairgo-app'
    static_configs:
      - targets: ['localhost:3000']
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
EOF
```

### Security Considerations

1. **SSL/TLS Configuration**: Use Let's Encrypt for SSL certificates
2. **Rate Limiting**: Implement rate limiting at nginx level
3. **CORS**: Configure proper CORS policies
4. **Input Validation**: Validate all API inputs
5. **SQL Injection Prevention**: Use parameterized queries
6. **Authentication**: Implement JWT with proper expiration
7. **File Upload Security**: Validate file types and sizes
8. **Environment Variables**: Never commit secrets to version control

### Backup Strategy

Create automated backup script:

```bash
#!/bin/bash
# backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/fairgo"
DB_NAME="fairgo"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump $DB_NAME | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# File uploads backup
tar -czf $BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz /var/www/uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz s3://fairgo-backups/
```

Add to crontab:

```bash
# Run backup daily at 2 AM
0 2 * * * /usr/local/bin/backup.sh
```

This comprehensive production setup ensures scalability, security, and reliability for the FairGo platform.
