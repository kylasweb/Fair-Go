# 🚨 URGENT: Fix Your Render Build Command

## The Problem

Render is still using the default build command instead of our custom one:

**❌ Current (Wrong):**

- Build Command: `npm install; npm run build`
- This causes ERESOLVE errors with Express 5.x dependencies

**✅ Required (Correct):**

- Build Command: `npm run render-build`
- This includes `--legacy-peer-deps` to resolve dependency conflicts

## 🔧 Fix Steps (2 minutes)

### Step 1: Go to Render Dashboard

1. Open https://dashboard.render.com
2. Click on your **fairgo-production** service
3. Click on **"Settings"** tab

### Step 2: Update Build Commands

Find the **"Build & Deploy"** section and change:

```
Build Command: npm run render-build
Start Command: npm run start:render
```

### Step 3: Save and Deploy

1. Click **"Save Changes"** (blue button)
2. Go to **"Deploys"** tab
3. Click **"Deploy latest commit"** (blue button)

## 📋 Complete Settings Checklist

**Build & Deploy Section:**

- ✅ Build Command: `npm run render-build`
- ✅ Start Command: `npm run start:render`
- ✅ Auto-Deploy: Yes
- ✅ Root Directory: (leave blank)

**Environment Variables:**

- ✅ `NODE_ENV=production`
- ✅ `DATABASE_URL=<your-postgres-url>`
- ✅ `NEXTAUTH_SECRET=<your-32-char-secret>`
- ✅ `NEXTAUTH_URL=<your-render-app-url>`
- ✅ `SOCKET_IO_SECRET=<your-socket-secret>`

## 🎯 Why This Will Work

The `render-build` script we created includes:

```json
"render-build": "npm install --legacy-peer-deps && prisma generate && prisma db push && next build"
```

This resolves the Express 5.x vs express-prometheus-middleware conflict that's causing your build to fail.

## 📊 Expected Results After Fix

```
✅ Build starts with correct command
✅ Dependencies install with --legacy-peer-deps
✅ Prisma generates successfully
✅ Database schema pushes
✅ Next.js builds successfully
✅ Health checks pass
✅ Application deploys successfully
```

## 🚀 Ready to Fix

The solution is just updating that one build command setting in your Render dashboard. The code is already fixed and pushed to GitHub - Render just needs to use the right build script!

Update the build command and redeploy - your FairGo app will work perfectly! 🎉
