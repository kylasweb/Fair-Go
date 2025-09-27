## Codebase Status Report

Last updated: 2025-09-26

### Overview

This repository contains a Next.js 15 + React 19 application with a custom Express 5 server, Prisma 6 for data access, Tailwind CSS 4 for styling, shadcn/Radix UI components, and comprehensive observability (OpenTelemetry, New Relic, Prometheus, Winston). It also includes a separate IVR microservice (`ivr-service/`) built on Express + Twilio for voice booking.

### Tech Stack

- Framework: Next.js 15 (App Router) + React 19 + TypeScript 5
- Styling/UI: Tailwind CSS 4, shadcn/ui, Radix UI, `clsx`, `tailwind-merge`, animations
- Server: Express 5, custom `server.ts` which orchestrates Next and server middlewares
- Data: Prisma 6, SQLite for local dev; production schema variants included
- Auth: NextAuth
- Realtime: Socket.IO and `ws`
- Caching/Queues: Redis (main app uses `ioredis` and `redis`), IVR uses `redis@4`
- Validation/Security: Zod, Joi, Helmet, express-rate-limit, XSS sanitization
- Observability: OpenTelemetry (HTTP/Express), Jaeger exporter, New Relic, Prometheus `prom-client`, Winston with ECS format and daily rotate
- PWA: `next-pwa`, Workbox, `public/manifest.json`
- AI/Voice: Google Cloud Speech-to-Text, Text-to-Speech, OpenAI SDK; IVR via Twilio
- Testing: Jest 30, Testing Library, MSW

### Repository Layout

- App/API: `src/app/` (Next App Router pages and 45+ API routes under `src/app/api`)
- Shared code: `src/lib/`, `src/components/`, `src/contexts/`, `src/hooks/`, `src/services/`, `src/monitoring/`, `src/types/`, `src/middleware/`
- Server entry: `server.ts` at repo root (development via `tsx`), plus IVR `src/server.ts`
- Database: `prisma/schema.prisma`, `prisma/migrations/*`, local SQLite at `prisma/db/custom.db`
- Production schemas: `prisma/schema.prod.prisma`, `deployment/schema.production.prisma`
- IVR microservice: `ivr-service/` with its own `package.json`, TypeScript sources, `dist/` build output, and Prisma schema
- Config/Docs: Deployment and Prisma guides, API docs, checklists, Netlify/Vercel/Render/Railway configs, Dockerfile

### Key Dependencies (selected)

- App: `next@15.3.5`, `react@19`, `react-dom@19`, `typescript@^5`
- Server: `express@5.1.0`, `helmet`, `express-rate-limit`, `cors`
- Data: `prisma@6.5.0`, `@prisma/client@6.5.0`, `zod@^4`, `joi@^18`
- Auth: `next-auth@^4.24.11`
- Realtime: `socket.io@^4.8`, `ws@^8.18`
- Cache: `ioredis@^5.7`, `redis@^5.8` (main app), `redis@^4.6` (IVR)
- Observability: `@opentelemetry/sdk-node@^0.205`, Jaeger exporter, `newrelic@^13.3`, `prom-client@^13.2`, `winston@^3.17`, `@elastic/ecs-winston-format`
- PWA: `next-pwa@^5.6`, `workbox-webpack-plugin@^7.3`
- AI/Voice: `@google-cloud/speech@^7.2`, `@google-cloud/text-to-speech@^6.3`, `openai@^5.22`
- UI/UX: Radix UI suite, `shadcn` components, `framer-motion`, `react-day-picker`, `recharts`
- Testing: `jest@^30.1`, `jest-environment-jsdom`, Testing Library, `msw`

### Scripts

- Development: `npm run dev` (nodemon + `tsx server.ts`, watches `src` and entry)
- Build: `npm run build` (Prisma generate + Next build)
- Start (prod): `npm start` (runs `server.ts` with `tsx`, `NODE_ENV=production`)
- Prisma: `db:push`, `db:generate`, `db:migrate`, `db:reset`
- Testing: `npm test`, `npm run test:watch`, `npm run test:coverage`
- Platform builds: `vercel-build`, `railway-build`, `render-build`

IVR service scripts (`ivr-service/`):
- Development: `npm run dev` (nodemon `src/server.ts`)
- Build: `npm run build` (tsc)
- Start (prod): `npm start` (node `dist/server.js`)
- Test: `npm test`

### Database and Migrations

- Prisma migrations present between 2025-09-20 and 2025-09-22, including:
  - AI training/configuration tables
  - Additional fields and API security-related models
- Local development DB: SQLite at `prisma/db/custom.db`
- Production schemas: `prisma/schema.prod.prisma` and `deployment/schema.production.prisma`

### Features and Modules

- App routes for admin, booking, driver, profile, support, mobile, offline
- 45+ API endpoints in `src/app/api/*`
- Realtime support via WebSocket/Socket.IO with an example page `examples/websocket/page.tsx`
- UI: 50+ shadcn-style components with Radix primitives
- PWA support with Workbox and `manifest.json`
- Voice booking and AI features (STT/TTS, IVR microservice)

### Logging and Monitoring

- Structured logs (Winston) with daily rotation; ECS-compatible format
- Logs stored in `logs/` with categories: application, error, audit, security, performance, exceptions, rejections, and AI
- OpenTelemetry instrumentation for HTTP/Express; Jaeger exporter wiring present
- New Relic agent included for APM
- Prometheus metrics via `prom-client`

### Deployment Readiness

- Vercel: `vercel.json`, `VERCEL_SETUP.md`, `vercel-build` script
- Render: `render.yaml`, `render-start.sh`, `RENDER_SETUP.md`, `render-build` (uses legacy peer deps and Prisma push)
- Railway: `railway.json`, `railway-start.sh`, `RAILWAY_SETUP.md`
- Netlify: `netlify.toml`
- Docker: `Dockerfile`
- Nixpacks: `nixpacks.toml`
- Multiple checklists and guides: `DEPLOYMENT_CHECKLIST.md`, `MIGRATION_CHECKLIST.md`, `QUICK_START.md`, etc.

### Environment Variables (expected)

- `DATABASE_URL` (Prisma)
- `NEXTAUTH_SECRET` and any OAuth provider secrets if configured
- Redis connection (`REDIS_URL` or host/port)
- OpenTelemetry exporter and/or Jaeger endpoint configuration
- New Relic license key/app name
- Twilio credentials for IVR service
- Google Cloud credentials for Speech/TTS
- `OPENAI_API_KEY`

### Risks and Caveats

- Cutting-edge versions (Next 15, React 19, Tailwind 4) require alignment across tooling; some third-party libs may need compatibility flags (Render build already uses `--legacy-peer-deps`)
- Redis client versions differ between main app and IVR; ensure deployment images have compatible Redis features
- Two SQLite locations exist (`prisma/db/` and root `db/` folder with backups) — confirm authoritative source to avoid schema drift
- Observability requires proper env configuration to be fully active; otherwise, exporters may no-op
- Test and lint health not verified in this report; needs execution

### What Appears Working vs Unknown

- Working by structure: Build scripts, Prisma migrations, Next App Router, logging framework, PWA scaffolding
- Unknown without runtime: Exact `server.ts` integration details, DB connections in current environment, IVR Twilio webhooks and flows, coverage of all API routes

### Suggested Next Steps

1. Install dependencies and run dev servers
   - Main app: `npm ci && npm run dev`
   - IVR service: `cd ivr-service && npm ci && npm run dev`
2. Validate Prisma locally
   - `npm run db:generate && npm run db:push`
3. Execute tests and lint
   - `npm test` and `npm run lint`
4. Smoke test critical routes and websockets
   - Check `src/app/api/*`, pages under `src/app/*`, and `examples/websocket/page.tsx`
5. Verify PWA and service worker in dev and production build
6. Configure observability targets (Jaeger/New Relic) and validate traces/metrics/logs

### Evidence (Manifests)

- Root `package.json` indicates Next 15, React 19, Express 5, Prisma 6, OpenTelemetry, New Relic, Prometheus, Socket.IO, Google Cloud STT/TTS, and OpenAI, with scripts for dev/build/start and deployment-specific builds.
- `ivr-service/package.json` shows an independent Node/Express TS service using Twilio, Redis, Winston, with standard dev/build/test scripts.

Note: Some large configuration files timed out during inspection. The above reflects the actual file tree plus the parsed manifests and visible project structure.


### Database and migrations
Prisma with multiple recent migrations under prisma/migrations/20250920* through 20250922*, including API security models and AI training tables.
Local development uses SQLite (prisma/db/custom.db). Production schema exists (prisma/schema.prod.prisma, deployment/schema.production.prisma).
Scripts: db:push, db:migrate, db:reset. Deployment builds push/generate before Next build.
App/API features
Next App Router with routes for admin, driver, booking, profile, support, mobile, offline, and 45+ API endpoints under src/app/api.
UI components: 50+ shadcn-style components, responsive layouts, toasts, network status provider, voice-booking component, booking/driver cards.
Middleware and monitoring integrated under src/middleware and src/monitoring respectively.
Logging and monitoring
File-based logs in logs/ with daily rotation for application, error, audit, security, performance, exceptions, rejections. ECS-compatible format present.
OpenTelemetry instrumentation likely wraps HTTP/Express and exports to Jaeger; New Relic agent included.
### Testing status
Jest 30 configured via jest.config.js and jest.setup.js. Integration tests present under src/__tests__/integration.test.tsx and component tests exist.
MSW is included for API mocking.
No test run was executed yet in this session; test health unknown until run.
Deployment readiness
Vercel: vercel.json, VERCEL_SETUP.md, and vercel-build script.
Render: render.yaml, render-start.sh, RENDER_SETUP.md, render-build script, Prisma engine fix docs.
Railway: railway.json, railway-start.sh, RAILWAY_SETUP.md.
Netlify: netlify.toml.
Nixpacks: nixpacks.toml.
Docker: Dockerfile present.
Multiple deployment checklists and quick start guides included.
### IVR microservice
Standalone Node/Express TypeScript service, compiled to dist/.
Twilio integration for phone-based booking, Redis for state, Winston for logs.
Has its own prisma/schema.prisma (present in the folder) and build/test scripts.
Scripts you’ll use
Dev (main): npm run dev (starts server.ts via tsx, watches src and entry).
Build (main): npm run build (Prisma generate + Next build).
Start (prod, main): npm start (tsx server.ts).
Dev (ivr-service): cd ivr-service && npm run dev.
Build/start (ivr-service): npm run build && npm start.
Env/config expectations
Likely required: DATABASE_URL, NEXTAUTH_SECRET, OAuth providers (if used), REDIS_URL or host/port, OpenTelemetry exporter config, New Relic license key, Twilio credentials (in ivr-service), Google Cloud credentials for STT/TTS, OpenAI API key.
PWA options are configured via next.config.pwa.js.
Current risks and caveats
Framework bleeding edge: Next 15 and React 19 with Tailwind 4 require toolchain alignment; some libraries may lag or need --legacy-peer-deps (already used for Render).
Two different Redis client versions across main app and IVR; ensure compatibility in production environments.
Two SQLite DB locations (prisma/db/ and db/); clarify the authoritative path for dev/prod to avoid drift.
Observability needs env config (Jaeger/New Relic); without it, exporters may no-op or warn.
No executed test/lint in this session; actual health status depends on running them locally/CI.
What’s working vs unknown
Working by structure: Build scripts, routing structure, Prisma migrations, logging, and PWA scaffolding.
Unknown without execution: Next and Express integration in server.ts, API route behavior, DB connectivity, and IVR Twilio flows.
Logs indicate recent activity up to 2025-09-23, suggesting the app has run recently.


### High-level overview
Core app: Next.js 15 + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui, Radix UI.
API and server: Custom server.ts bootstrapped with Express 5, integrates Next, OpenTelemetry, New Relic, Winston logging, and Prometheus prom-client.
Auth and data: NextAuth, Prisma 6 with SQLite (local) and migrations prepared for production.
Realtime: Socket.IO and WS present; example WebSocket page under examples/websocket/page.tsx.
Caching/queues: Redis (ioredis and redis libraries are present).
Observability: OpenTelemetry SDK (Node, HTTP, Express), Jaeger exporter, New Relic agent, structured logs via Winston + ECS format and daily rotate.
Security: Helmet, express-rate-limit, input validation (Joi/Zod), XSS library.
PWA: next-pwa + workbox-webpack-plugin, public/manifest.json, and next.config.pwa.js.
Voice/AI: Google Cloud Speech-to-Text and Text-to-Speech SDKs, Twilio-driven IVR microservice in ivr-service/.
Testing: Jest 30 with jsdom, Testing Library for React, MSW for mocks; integration tests exist.
Deployment targets: Vercel, Railway, Render, Netlify files are present with tailored build scripts.
### Monorepo layout
Web app and API: src/ with app/ (Next App Router), src/app/api/* (API routes), shared libs in src/lib, UI in src/components, middleware, monitoring, types, services.
Prisma and DB: prisma/schema.prisma, prisma/migrations/*, local SQLite at prisma/db/custom.db. A separate db/ folder also exists (legacy or backups).
Server entrypoints: server.ts (root) plus src/server.ts inside ivr-service (compiled to dist/server.js).
IVR microservice: ivr-service/ with its own package.json, src/, dist/, Prisma schema, and Twilio integration.
Config/docs: Multiple deployment guides, Prisma instructions, migration checklist, API docs.
### Key dependencies and versions
Frameworks: next 15.3.5, react 19, react-dom 19, typescript 5.
Styling: tailwindcss 4, tailwind-merge, tailwindcss-animate, shadcn stack, Radix components.
Server: express 5.1.0, cors, helmet, express-rate-limit.
Data: prisma 6.5.0, @prisma/client 6.5.0, zod 4, joi 18.
Auth: next-auth 4.24.11, jsonwebtoken 9 (dev).
Realtime: socket.io 4.8, ws 8.18.
Cache/queue: ioredis 5.7, redis 5.8 (app) / redis 4.6 (ivr-service).
Observability: @opentelemetry/* 0.205/2.1 series, newrelic 13.3, prom-client 13.2, winston 3.17.
AI/Voice: @google-cloud/speech 7.2, text-to-speech 6.3, openai 5.22 (for web dev SDK too).
Testing: jest 30.1, jest-environment-jsdom 30.1, @testing-library/* latest, msw 2.11.

