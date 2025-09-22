# Quick Deployment Commands

## 🚀 Option 1: Vercel (Recommended for Next.js)

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login and Deploy

```bash
vercel login
vercel --prod
```

### Step 3: Set Environment Variables

```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

### Step 4: Redeploy with Env Vars

```bash
vercel --prod
```

---

## 🚂 Option 2: Railway (Recommended for Socket.IO)

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login and Initialize

```bash
railway login
railway init
```

### Step 3: Add PostgreSQL Database

```bash
railway add --database postgresql
```

### Step 4: Set Environment Variables

```bash
railway variables set NEXTAUTH_SECRET=your-secret
railway variables set NODE_ENV=production
```

### Step 5: Deploy

```bash
railway up
```

---

## 🔧 Local Testing Before Deploy

### Test Production Build

```bash
npm run build
npm start
```

### Test Database Connection

```bash
npm run db:push
```

### Check Health Endpoint

```bash
curl http://localhost:3000/api/health
```

---

## 📊 Monitoring After Deployment

### Vercel

- Dashboard: https://vercel.com/dashboard
- Logs: `vercel logs`
- Analytics: Built-in performance metrics

### Railway

- Dashboard: https://railway.app/dashboard
- Logs: Real-time in dashboard
- Metrics: CPU, Memory, Network usage
