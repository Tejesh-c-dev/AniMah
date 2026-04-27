# Vercel Deployment Guide - AniMah

This guide covers deploying the AniMah Next.js frontend to Vercel with proper API base URL configuration for a **separate Express backend**.

## 🎯 Quick Summary

Your app has:
- **Frontend**: Next.js on Vercel (https://animah.vercel.app)
- **Backend**: Express server that must be deployed separately (Render, Railway, Heroku, etc.)
- **Database**: Neon PostgreSQL

**The Problem**: In `.env`, `NEXT_PUBLIC_API_URL="http://localhost:5002"` only works locally. On Vercel, the frontend can't reach localhost.

**The Solution**: Deploy your Express backend separately, then set `NEXT_PUBLIC_API_URL` to that backend's URL in Vercel's environment variables.

---

## Prerequisites

1. **Backend deployed separately** (see "Backend Deployment" section below)
   - Must be accessible via public HTTPS URL
   - Example: `https://animah-api.render.com` or `https://animah-api.onrender.com`
2. **Database connection strings** (Neon PostgreSQL)
   - DATABASE_URL (with pooler)
   - DIRECT_URL (direct connection)
3. **Vercel account** connected to your GitHub repository
4. **GitHub repository** with your code

---

## Step 1: Deploy Your Express Backend Separately

### Option A: Render (Recommended - Free tier available)

1. Go to https://render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `animah-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build:server`
   - **Start Command**: `node server/dist/index.js`
   - **Region**: Pick closest to users
5. Click **Advanced** → **Environment Variables**
   - Add all from `.env.example` (DATABASE_URL, JWT_SECRET, etc.)
   - Set `PORT=10000` (or leave blank, Render assigns it)
   - Set `NODE_ENV=production`
   - Set `CORS_ORIGIN="https://your-frontend-domain.vercel.app"`
6. Click **Create Web Service**
7. Wait for deployment to finish
8. Copy the URL from the Render dashboard (e.g., `https://animah-api-xxxxx.onrender.com`)

### Option B: Railway (No free tier, ~$5/month)

1. Go to https://railway.app
2. Click **New Project** → **GitHub Repo**
3. Select your repository
4. Configure environment variables in Railway dashboard
5. Railway auto-deploys on git push
6. Copy your Railway app URL

### Option C: Heroku (Free tier removed, ~$7+/month)

1. Deploy via Heroku dashboard or CLI
2. Set environment variables in Heroku dashboard
3. Copy your Heroku app URL

### Option D: AWS/Google Cloud/Azure (Advanced)

Use your cloud provider's container/VM services. See their docs.

**Once deployed**, your backend URL will be something like:
- Render: `https://animah-api-xxxxx.onrender.com`
- Railway: `https://animah-xxxxx.railway.app`
- Heroku: `https://animah-api.herokuapp.com`

---

## Step 2: Configure Environment Variables in Vercel

### 2a. Go to Vercel Dashboard

1. Open https://vercel.com/dashboard
2. Click your **AniMah** project
3. Go to **Settings** → **Environment Variables**

### 2b. Add Variables

Add these variables (all production variables):

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | Copy from Neon dashboard (pooler endpoint) | `postgresql://neondb_owner:npg_...@ep-calm-thunder-amnwprre-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | Copy from Neon dashboard (direct endpoint) | `postgresql://neondb_owner:npg_...@ep-calm-thunder-amnwprre.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `JWT_SECRET` | Generate with `openssl rand -base64 48` | `Nz7kL2mP9qR4sT8vW3xY6zB1cD5eF9gH...` |
| `ADMIN_SETUP_KEY` | Generate with `openssl rand -base64 48` | `aB9cD3eF7gH1jK5lM9nO2pQ6rS0tU4vW...` |
| **`NEXT_PUBLIC_API_URL`** | **Your backend URL** | `https://animah-api-xxxxx.onrender.com` |
| `API_URL` | Same as NEXT_PUBLIC_API_URL | `https://animah-api-xxxxx.onrender.com` |
| `CORS_ORIGIN` | Your Vercel frontend URL(s) | `https://animah.vercel.app,https://animah-*.vercel.app` |

### ⚠️ CRITICAL: NEXT_PUBLIC_API_URL Setting

This is the most important part. Set it to your deployed backend:

```
NEXT_PUBLIC_API_URL=https://animah-api-xxxxx.onrender.com
```

**NOT:**
- ❌ `http://localhost:5002` (won't work on Vercel)
- ❌ `http://localhost:3000` (that's the frontend)
- ❌ Empty string (causes "Unable to reach API server" error)

### Step-by-Step: Setting NEXT_PUBLIC_API_URL in Vercel

1. In Vercel dashboard, go to **Settings → Environment Variables**
2. Click **Add New**
3. Fill in:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://animah-api-xxxxx.onrender.com` (your actual backend URL)
   - **Environments**: Select `Production`, `Preview`, `Development`
4. Click **Save**
5. Click **Redeploy** (or push to GitHub to auto-redeploy)

---

## Step 3: Update Backend CORS for Your Vercel Domain

Your Neon database and API are configured, but the Express backend needs to allow requests from your Vercel frontend.

1. Go to your backend's environment variables (Render/Railway/Heroku dashboard)
2. Find or update `CORS_ORIGIN` to include:
   - `https://animah.vercel.app` (production)
   - `https://animah-*.vercel.app` (preview deployments)
3. Re-deploy backend

**Example in Render**:
```
CORS_ORIGIN=https://animah.vercel.app,https://animah-*.vercel.app
```

---

## Step 4: Trigger Vercel Redeploy

After setting environment variables:

1. In Vercel dashboard, go to **Deployments**
2. Click the three dots (**...**) next to the latest deployment
3. Click **Redeploy** (or just push a commit to GitHub)
4. Wait for build to complete

---

## Step 5: Verify Everything Works

### Check 1: Browse the app

1. Go to https://animah.vercel.app
2. Homepage should load without errors
3. Open **Browser Dev Tools** (F12 → **Console**)
4. You should NOT see "Unable to reach the API server" error

### Check 2: Test API calls

1. Try logging in (should make request to backend)
2. Check **Network** tab → see API requests
3. All requests should be to `https://animah-api-xxxxx.onrender.com/api/*`
4. Should return 200 status (not 404 or connection errors)

### Check 3: Test authentication

1. Try **Register** for a new account
2. Should work without errors
3. Should be able to login

---

## 🚨 Troubleshooting

### Error: "Unable to reach the API server. Check NEXT_PUBLIC_API_URL/API_URL."

**Causes & Fixes**:

1. **NEXT_PUBLIC_API_URL not set in Vercel**
   - ✅ Fix: Add `NEXT_PUBLIC_API_URL=https://your-backend-url.com` in Vercel dashboard
   - ✅ Redeploy

2. **NEXT_PUBLIC_API_URL points to localhost**
   - ✅ Fix: Change to your actual deployed backend URL (e.g., Render URL)
   - ✅ Redeploy

3. **Backend not deployed or not running**
   - ✅ Fix: Check Render/Railway dashboard → make sure backend deployed and running
   - ✅ Test backend manually: `curl https://your-backend-url.com/api/health`
   - ✅ Should return `{"status":"ok",...}`

4. **CORS error** (request blocked by browser)
   - ✅ Fix: Update backend's `CORS_ORIGIN` to include your Vercel URL
   - ✅ Redeploy backend
   - ✅ In browser console, error will say "CORS policy"

### CORS Error: "Access to XMLHttpRequest blocked by CORS policy"

**Cause**: Backend doesn't allow requests from your Vercel frontend.

**Fix**:
1. Go to backend deployment (Render/Railway)
2. Update `CORS_ORIGIN` environment variable to include your Vercel URL:
   ```
   CORS_ORIGIN=https://animah.vercel.app,https://animah-*.vercel.app
   ```
3. Redeploy backend
4. Refresh frontend and try again

### 404 Error on API calls

**Cause**: Backend is not running or API routes don't exist.

**Fix**:
1. Test backend directly:
   ```bash
   curl https://your-backend-url.com/api/health
   ```
2. Should see:
   ```json
   {"status":"ok","timestamp":"...","uptime":...}
   ```
3. If not, check backend deployment logs (Render/Railway dashboard)
4. Ensure `npm run build:server` produces files in `server/dist/`

### Login/Register not working

**Cause**: Backend not running or database not connected.

**Fix**:
1. Check backend logs: Go to Render/Railway dashboard → **Logs**
2. Look for connection errors to Neon database
3. Verify DATABASE_URL is set correctly in backend environment variables
4. Verify DIRECT_URL is set for migrations
5. Manually trigger migration:
   - For Render: Use SSH or CLI
   - For Railway: Use CLI: `railway run npx prisma migrate deploy`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel (Production)                         │
├─────────────────────────────────────────────────────────────────┤
│                    Next.js Frontend                             │
│    https://animah.vercel.app                                   │
│    - React/TypeScript                                          │
│    - Server Components                                         │
│    - Client Components                                         │
│    Environment: NEXT_PUBLIC_API_URL=https://backend-url.com   │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ API Calls to
             │ https://backend-url.com/api/*
             │
┌────────────▼────────────────────────────────────────────────────┐
│          Render/Railway/Heroku (Backend Server)                │
├─────────────────────────────────────────────────────────────────┤
│                    Express API Server                           │
│    https://animah-api-xxxxx.onrender.com                      │
│    - /api/auth (login, register, logout)                       │
│    - /api/titles (CRUD operations)                             │
│    - /api/reviews (create, list, update, delete)               │
│    - /api/watchlist (add, remove, list)                        │
│    - /api/favorites (add, remove, list)                        │
│    - /api/admin (admin operations)                             │
│    Environment: CORS_ORIGIN=https://animah.vercel.app         │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Database Queries
             │ postgresql://...
             │
┌────────────▼────────────────────────────────────────────────────┐
│              Neon PostgreSQL (Database)                         │
├─────────────────────────────────────────────────────────────────┤
│    https://console.neon.tech                                   │
│    - DATABASE_URL: pooler endpoint (runtime)                   │
│    - DIRECT_URL: direct endpoint (migrations)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist Before Going Live

- [ ] Backend deployed to Render/Railway/Heroku with its own URL
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel to your backend URL
- [ ] `API_URL` set in Vercel to same backend URL
- [ ] `DATABASE_URL` and `DIRECT_URL` set in Vercel (from Neon)
- [ ] `JWT_SECRET` is a strong random value (64+ chars)
- [ ] `ADMIN_SETUP_KEY` is set and kept secret
- [ ] `CORS_ORIGIN` on backend includes your Vercel frontend URL
- [ ] Backend tested: `curl https://your-backend-url.com/api/health` returns 200
- [ ] Frontend tested: homepage loads without "API server" error
- [ ] Login/register works
- [ ] Protected routes redirect properly
- [ ] Created admin account via `/admin-setup`
- [ ] HTTPS enforced (automatic with Vercel)

---

## API URL Fallback Behavior

The `src/lib/config.ts` provides intelligent fallbacks:

**In Development**:
```
1. NEXT_PUBLIC_API_URL ✅
2. API_URL ✅
3. http://localhost:5002 ✅
4. http://localhost:5000 ✅
→ Never fails
```

**In Production**:
```
1. NEXT_PUBLIC_API_URL (must be set!) ✅
2. API_URL (fallback) ✅
3. VERCEL_URL (auto-use Vercel domain) ⚠️
4. Returns empty string ❌ (causes error)
→ Throws clear error if not configured
```

---

## Support

For issues:
1. Check Vercel logs: **Deployments** → **Logs**
2. Check backend logs: Render/Railway dashboard → **Logs**
3. Check browser console (F12): Look for API errors
4. Verify environment variables: Vercel **Settings** → **Environment Variables**
5. Test backend directly:
   ```bash
   curl -H "Content-Type: application/json" \
     https://your-backend-url.com/api/health
   ```
- Vercel Deployment Logs: **Deployments > [Latest] > View Logs**
- Browser Console: F12 > Console (for client errors)
- Backend Logs: Your backend hosting platform
