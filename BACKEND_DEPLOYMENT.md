# Backend Deployment Guide - AniMah Express Server

This guide covers deploying the Express backend (`/server` directory) to production services so your Vercel frontend can reach it.

## 🎯 Architecture Overview

```
Your Vercel Frontend (https://animah.vercel.app)
        ↓
        ↓ Calls https://api.yourdomain.com/api/*
        ↓
Your Express Backend (deployed separately)
        ↓
        ↓ Queries
        ↓
Neon PostgreSQL Database
```

The **Express backend** must be deployed to a publicly accessible URL so your Vercel frontend can reach it.

---

## Option 1: Render (Recommended for Free Tier)

Render offers a free tier perfect for small projects. Deploy is automatic on git push.

### Prerequisites

1. Create account at https://render.com
2. Connect your GitHub account
3. Your repository pushed to GitHub

### Step 1: Create Web Service on Render

1. Go to https://render.com/dashboard
2. Click **New +** button (top right)
3. Select **Web Service**
4. Choose **Build and deploy from a Git repository**
5. Click **Connect** and authorize GitHub
6. Select your AniMah repository

### Step 2: Configure Service

Fill in the configuration form:

```
Name:                    animah-api
Environment:             Node
Region:                  Choose closest to your users (e.g., Ohio)
Branch:                  main
Root Directory:          (leave empty - will auto-detect)
```

### Step 3: Build & Start Commands

```
Build Command:   npm install && npm run build:server
Start Command:   node server/dist/index.js
```

### Step 4: Environment Variables

Click **Advanced** → **Add Environment Variables**

Add these variables:

| Key | Value | Where to get it |
|-----|-------|-----------------|
| `DATABASE_URL` | `postgresql://...pooler...` | Neon dashboard (pooled endpoint) |
| `DIRECT_URL` | `postgresql://...` | Neon dashboard (direct endpoint) |
| `JWT_SECRET` | `[generate with openssl rand -base64 48]` | Your choice - keep it secret |
| `ADMIN_SETUP_KEY` | `[generate with openssl rand -base64 48]` | Your choice - keep it secret |
| `CORS_ORIGIN` | `https://animah.vercel.app,https://animah-*.vercel.app` | Your Vercel frontend URL |
| `NODE_ENV` | `production` | Fixed value |
| `PORT` | (leave empty or `10000`) | Render assigns automatically |

### Step 5: Deploy

1. Click **Create Web Service**
2. Wait for build to complete (watch the logs)
3. Once deployed, copy the URL from the top (e.g., `https://animah-api-xxxxx.onrender.com`)

### Step 6: Keep Backend Awake (Optional)

Free Render services spin down after 15 minutes of inactivity. To keep it running:

1. Go to https://render.com/docs/free-tier#free-tier-limits
2. Recommended: Upgrade to **Starter** plan ($7/month) for always-on

Or add a cron job that pings your backend every 10 minutes (outside scope of this guide).

### Step 7: Use Backend URL

1. Go to your Vercel dashboard
2. **Settings** → **Environment Variables**
3. Set `NEXT_PUBLIC_API_URL=https://animah-api-xxxxx.onrender.com`
4. Set `API_URL=https://animah-api-xxxxx.onrender.com`
5. Redeploy Vercel frontend

**Done!** Your backend is now deployed and your frontend can reach it.

---

## Option 2: Railway

Railway offers a more generous free tier and better performance. No credit card required initially.

### Prerequisites

1. Create account at https://railway.app
2. Connect GitHub account

### Step 1: Create New Project

1. Go to https://railway.app/dashboard
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Select your AniMah repository
5. Choose **Confirm** when asked which directory to deploy

### Step 2: Configure Service

Railway auto-detects Node.js setup. But we need to specify commands:

1. Go to **Service** settings (gear icon)
2. Set **Build Command**:
   ```
   npm install && npm run build:server
   ```
3. Set **Start Command**:
   ```
   node server/dist/index.js
   ```

### Step 3: Add Environment Variables

1. Go to **Variables** tab
2. Click **Add Variable** and add all required variables:

```
DATABASE_URL = postgresql://...pooler...
DIRECT_URL = postgresql://...
JWT_SECRET = [generate with openssl rand -base64 48]
ADMIN_SETUP_KEY = [generate with openssl rand -base64 48]
CORS_ORIGIN = https://animah.vercel.app,https://animah-*.vercel.app
NODE_ENV = production
PORT = 8000
```

### Step 4: Deploy

1. Click **Deploy** button
2. Monitor logs to ensure successful build
3. Once live, copy your Railway URL from dashboard (e.g., `https://animah-xxxxx.up.railway.app`)

### Step 5: Use Backend URL

1. Go to Vercel dashboard
2. **Settings** → **Environment Variables**
3. Set `NEXT_PUBLIC_API_URL=https://animah-xxxxx.up.railway.app`
4. Set `API_URL=https://animah-xxxxx.up.railway.app`
5. Redeploy frontend

**Done!** Railway automatically redeploys on every git push.

---

## Option 3: Heroku (Paid, ~$7+/month)

Heroku removed free tier, but it's still straightforward.

### Prerequisites

1. Create account at https://heroku.com
2. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
3. Verify with: `heroku --version`

### Step 1: Create Heroku App

```bash
heroku login
cd /path/to/AniMah
heroku create animah-api
```

### Step 2: Add PostgreSQL Add-on (if needed)

Skip if you're using Neon (recommended):

```bash
# Only if NOT using Neon
heroku addons:create heroku-postgresql:standard-0
```

### Step 3: Set Environment Variables

```bash
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set DIRECT_URL="postgresql://..."
heroku config:set JWT_SECRET="[your secure key]"
heroku config:set ADMIN_SETUP_KEY="[your secure key]"
heroku config:set CORS_ORIGIN="https://animah.vercel.app,https://animah-*.vercel.app"
heroku config:set NODE_ENV=production
```

### Step 4: Create Procfile

Create `Procfile` in your project root:

```
web: npm run build:server && node server/dist/index.js
```

### Step 5: Deploy

```bash
git push heroku main
```

### Step 6: Monitor Logs

```bash
heroku logs --tail
```

### Step 7: Get Your URL

```bash
heroku apps:info -a animah-api
```

Copy the **Web URL** (e.g., `https://animah-api.herokuapp.com`)

### Step 8: Use Backend URL

1. Go to Vercel dashboard
2. **Settings** → **Environment Variables**
3. Set `NEXT_PUBLIC_API_URL=https://animah-api.herokuapp.com`
4. Set `API_URL=https://animah-api.herokuapp.com`
5. Redeploy frontend

---

## Option 4: AWS/Azure/Google Cloud (Advanced)

For experienced users:

### AWS EC2
- Launch Ubuntu instance
- Install Node.js, PM2
- Clone repo, build, and run with PM2
- Point domain via Route53

### AWS Elastic Beanstalk
- Create Node.js environment
- Set environment variables
- Deploy with `eb deploy`

### Google Cloud Run
```bash
gcloud run deploy animah-api --source .
```

### Azure App Service
- Create Node.js app in Azure Portal
- Connect GitHub for auto-deploy
- Set environment variables in Configuration

These options require more setup but offer better scalability.

---

## Environment Variable Reference

All backend deployments need these environment variables:

### Required for API

```
DATABASE_URL        Neon pooled connection string (with ?pgbouncer=true)
DIRECT_URL          Neon direct connection string (for migrations)
JWT_SECRET          64-character random string (openssl rand -base64 48)
ADMIN_SETUP_KEY     64-character random string (openssl rand -base64 48)
NODE_ENV            "production"
CORS_ORIGIN         "https://animah.vercel.app,https://animah-*.vercel.app"
PORT                (optional - service assigns if omitted)
```

### Optional

```
LOG_LEVEL           "debug" or "error" (defaults to error in production)
```

---

## Testing Your Backend After Deployment

Once deployed, test that it's working:

### Test 1: Health Check

```bash
curl -H "Content-Type: application/json" \
  https://your-backend-url.com/api/health
```

**Expected response**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-27T12:34:56.789Z",
  "uptime": 123.456
}
```

### Test 2: Database Connection

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://your-backend-url.com/api/titles
```

Should return title list (may be empty initially), NOT a database error.

### Test 3: CORS Check

```bash
curl -i -X OPTIONS \
  -H "Origin: https://animah.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  https://your-backend-url.com/api/auth/login
```

Should return `200` with `Access-Control-Allow-Origin` header.

---

## Troubleshooting Backend Deployment

### Backend Build Fails

**Check logs** in your deployment service:
- Render: Logs tab in dashboard
- Railway: Logs in Variables tab
- Heroku: `heroku logs --tail`

**Common issues**:
- Missing environment variables
- Wrong Node.js version
- TypeScript build errors: `npm run build:server` locally to test

### Database Connection Error

**Symptoms**: Server starts but errors when accessing `/api/titles`

**Fixes**:
1. Verify `DATABASE_URL` is correct in deployment dashboard
2. Verify Neon database is running (https://console.neon.tech)
3. Test connection locally:
   ```bash
   DATABASE_URL="postgresql://..." npm run dev:server
   ```

### CORS Errors in Frontend

**Symptoms**: Browser console shows "CORS policy blocked"

**Fixes**:
1. Ensure `CORS_ORIGIN` includes your Vercel URL
2. Verify format: `https://animah.vercel.app,https://animah-*.vercel.app`
3. Redeploy backend after updating CORS_ORIGIN

### Port Already in Use (Local Dev)

If you get "Port 5002 already in use" locally:

```bash
# Find process using port 5002
lsof -i :5002  (macOS/Linux)
netstat -ano | findstr 5002  (Windows)

# Kill it
kill -9 [PID]  (macOS/Linux)
taskkill /PID [PID] /F  (Windows)
```

---

## Deployment Comparison

| Service | Cost | Free Tier | Auto-deploy | Deploy Time | Performance |
|---------|------|-----------|-------------|-------------|-------------|
| **Render** | $7+/mo | 1 free web service (sleeps) | Yes, on git push | ~5 min | Good |
| **Railway** | $5+/mo | $5 free credits | Yes, on git push | ~3 min | Very Good |
| **Heroku** | $7+/mo | ❌ None | `git push heroku` | ~2 min | Good |
| **AWS** | Variable | 1 year free tier | Via CodePipeline | ~10 min | Excellent |
| **Azure** | Variable | Free tier | GitHub integration | ~5 min | Excellent |

**Recommendation**: Start with **Render** (free, auto-deploy), upgrade to **Railway** ($5/mo, better performance) once you get users.

---

## After Deployment

1. **Test Frontend**: Go to https://animah.vercel.app
   - Should load without "Unable to reach API server" error
   - Login/register should work
   
2. **Create Admin Account**: Go to https://animah.vercel.app/admin-setup
   - Use your `ADMIN_SETUP_KEY`
   - Create first admin account

3. **Monitor Logs**:
   - Render: Dashboard → Logs tab
   - Railway: Dashboard → Logs
   - Heroku: `heroku logs --tail`

4. **Set Up CI/CD**:
   - All services auto-deploy on git push
   - Push changes to `main` → automatic redeploy

---

## Next Steps

1. ✅ Deploy Express backend to Render/Railway/Heroku
2. ✅ Copy backend URL (e.g., `https://animah-api-xxxxx.onrender.com`)
3. ✅ Set `NEXT_PUBLIC_API_URL` in Vercel to backend URL
4. ✅ Redeploy Vercel frontend
5. ✅ Test frontend - should work without API errors

See **VERCEL_DEPLOYMENT.md** for frontend deployment details.
