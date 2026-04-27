# AniMah API URL Fix - Complete Summary

## 🎯 Problem You Had

Your Vercel deployment shows:  
**"Unable to reach the API server. Check NEXT_PUBLIC_API_URL/API_URL."**

## 🔍 Root Cause

Your `.env` has:
```
NEXT_PUBLIC_API_URL="http://localhost:5002"
API_URL="http://localhost:5002"
```

This works **locally** because:
- Your laptop runs both Next.js frontend (port 3000) and Express backend (port 5002)
- Both are on the same machine (`localhost`)

But on **Vercel**, there is NO localhost server running. Your frontend is deployed to `https://animah.vercel.app`, but:
- ❌ There's no Vercel service listening on port 5002
- ❌ There's no localhost on Vercel machines
- ❌ The frontend has no idea where the backend is

**Result**: Frontend tries to call `http://localhost:5002` → fails → shows error

---

## ✅ What We Fixed

### 1. **config.ts - Better Error Messages** ✓

**File**: [src/lib/config.ts](src/lib/config.ts)

- Added warnings when API URL not configured in production
- `getClientApiUrl()` now throws clear error message instead of silent failure
- `getServerApiUrl()` same improvement
- Tells users exactly what to set in Vercel dashboard

**What you'll see now** (instead of vague error):
```
Missing NEXT_PUBLIC_API_URL in production.
Set NEXT_PUBLIC_API_URL in Vercel Project Settings → Environment Variables.
```

### 2. **.env.example - Complete Guide** ✓

**File**: [.env.example](.env.example)

Complete, documented example with:
- Explanations for each environment variable
- Separate sections for local dev vs production
- Clear examples of what to set in Vercel
- Warnings about common mistakes (❌ `http://localhost`)
- Quick setup checklist
- Links to documentation

### 3. **VERCEL_DEPLOYMENT.md - Step-by-Step** ✓

**File**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

Complete frontend deployment guide:
- **Architecture explained** with diagram
- **Step-by-step Vercel setup** with screenshots descriptions
- **How to set NEXT_PUBLIC_API_URL** in Vercel dashboard
- **Troubleshooting section** for common errors
- **CORS configuration** for cross-domain requests
- **Backend URL options** (separate deployment vs same project)

### 4. **BACKEND_DEPLOYMENT.md - New Guide** ✓

**File**: [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md) (NEW)

Complete backend deployment guide covering:
- **4 deployment options**: Render, Railway, Heroku, AWS/Azure/Google Cloud
- **Step-by-step for each**: Environment variables, build commands, getting the URL
- **Which to choose**: Cost/performance comparison table
- **Testing**: How to verify backend is working
- **Troubleshooting**: Database errors, CORS issues, etc.

---

## 🚀 What You Need to Do NOW

### Step 1: Deploy Your Express Backend (Choose One)

**Recommended**: Render (free tier available, auto-deploy)

Follow one of these in [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md):
- ✅ Option 1: **Render** (recommended, free tier)
- ✅ Option 2: Railway (paid, better performance)
- ✅ Option 3: Heroku (paid, most familiar)
- ✅ Option 4: AWS/Azure/Google Cloud (advanced, scalable)

**Result**: You'll get a public URL like:
- `https://animah-api-xxxxx.onrender.com`
- `https://animah-xxxxx.up.railway.app`
- `https://animah-api.herokuapp.com`

### Step 2: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Click your **AniMah** project
3. Go to **Settings** → **Environment Variables**
4. **Add or Update these variables**:

```
DATABASE_URL              postgresql://neondb_owner:npg_...@ep-calm-thunder-amnwprre-pooler...
DIRECT_URL              postgresql://neondb_owner:npg_...@ep-calm-thunder-amnwprre.c-5...
JWT_SECRET              animah-secure-auth-key-2026-v2-ultra-safe-layer
ADMIN_SETUP_KEY         animah_admin_setup_key_2026_prod_ready_secure_9x7k
NEXT_PUBLIC_API_URL     https://animah-api-xxxxx.onrender.com     ← YOUR BACKEND URL
API_URL                 https://animah-api-xxxxx.onrender.com     ← SAME AS ABOVE
CORS_ORIGIN             https://animah.vercel.app,https://animah-*.vercel.app
```

### Step 3: Update Backend Environment Variables

Go to your backend deployment (Render/Railway/etc) dashboard and set:

```
CORS_ORIGIN = https://animah.vercel.app,https://animah-*.vercel.app
```

This allows your Vercel frontend to call your backend (CORS policy).

### Step 4: Redeploy Vercel Frontend

1. In Vercel dashboard, go to **Deployments**
2. Click the three dots (...) next to latest deployment
3. Click **Redeploy**
4. Wait ~2-3 minutes for redeploy

### Step 5: Test

1. Go to https://animah.vercel.app
2. **Should NOT see** "Unable to reach API server" error
3. Try logging in - should work
4. Try adding a title - should work

---

## 📋 ARCHITECTURE: What's Deployed Where

```
┌─────────────────────────────────────┐
│  Vercel (Your Frontend)             │
│  https://animah.vercel.app          │
│  - Next.js app                      │
│  - React components                 │
│  - Calls https://api-url/api/*      │
└─────────────┬───────────────────────┘
              │ HTTPS API Calls
              ↓
┌─────────────────────────────────────┐
│  Render/Railway/Heroku (Backend)    │
│  https://animah-api-xxxxx...        │
│  - Express server                   │
│  - Routes: /api/auth, /api/titles   │
│  - Connects to Neon database        │
└─────────────┬───────────────────────┘
              │ SQL Queries
              ↓
┌─────────────────────────────────────┐
│  Neon PostgreSQL (Database)         │
│  ep-calm-thunder-amnwprre...        │
│  - Your data                        │
└─────────────────────────────────────┘
```

---

## 🔧 Code Changes Made

### 1. src/lib/config.ts

```javascript
// Before: Silently returned empty string in production
// After: Throws clear error with instructions
export function getClientApiUrl(): string {
  const url = getApiUrl({ isServer: false });
  
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing NEXT_PUBLIC_API_URL in production. ' +
      'Set NEXT_PUBLIC_API_URL in Vercel Project Settings → Environment Variables.'
    );
  }
  
  return url;
}
```

### 2. .env.example

- Complete rewrite with proper documentation
- Added development vs production sections
- Added quick setup checklist
- Added warning boxes for common mistakes

### 3. VERCEL_DEPLOYMENT.md

- Updated with detailed step-by-step
- Added architecture diagram
- Added comprehensive troubleshooting
- Added CORS configuration section

### 4. BACKEND_DEPLOYMENT.md (New)

- Step-by-step for 4 deployment services
- Environment variable checklists
- Testing instructions
- Cost/performance comparison

---

## 🛠️ Environment Variables Explained

### For Local Development (your laptop)

Your `.env` file:
```
PORT=5002                                          # Express backend port
NEXT_PUBLIC_API_URL="http://localhost:5002"        # Frontend calls backend on port 5002
API_URL="http://localhost:5002"                    # Server components call backend
DATABASE_URL="postgresql://..."                    # Neon database (pooler)
DIRECT_URL="postgresql://..."                      # Neon database (direct)
JWT_SECRET="animah-secure-auth-key-..."           # JWT signing secret
ADMIN_SETUP_KEY="animah_admin_setup_key_..."      # One-time admin setup key
CORS_ORIGIN="http://localhost:3000,..."           # Allows localhost frontend
```

**Why it works locally**:
- Frontend and backend both on your laptop
- Both can reach `http://localhost:5002`
- No HTTPS needed
- No CORS issues (both on localhost)

### For Vercel Production

Set in **Vercel Dashboard → Settings → Environment Variables**:

```
NEXT_PUBLIC_API_URL="https://animah-api-xxxxx.onrender.com"   # ⚠️ CRITICAL
API_URL="https://animah-api-xxxxx.onrender.com"               # ⚠️ CRITICAL
DATABASE_URL="postgresql://..."                               # Same as local
DIRECT_URL="postgresql://..."                                 # Same as local
JWT_SECRET="animah-secure-auth-key-..."                       # Same as local
ADMIN_SETUP_KEY="animah_admin_setup_key_..."                  # Same as local
CORS_ORIGIN="https://animah.vercel.app,https://animah-*.vercel.app"
```

**Why these specific values**:
- `NEXT_PUBLIC_API_URL`: Frontend needs to know where backend is deployed
- `API_URL`: Server components (like in pages) need the URL too
- Both point to your **deployed backend service** (not localhost!)
- Database URLs stay the same (same Neon database)
- Secrets stay the same (same encryption keys)
- CORS origin includes your Vercel URL(s)

### Why NEXT_PUBLIC_API_URL is Public

The `NEXT_PUBLIC_` prefix means this variable is sent to the **browser**:
- Accessible in client components: ✅ `process.env.NEXT_PUBLIC_API_URL`
- Accessible in server components: ✅ `process.env.NEXT_PUBLIC_API_URL`
- Visible in browser console: ⚠️ Yes (that's fine, just a URL, not secret)
- Used by browser to make API calls: ✅ Yes

**Never put secrets in NEXT_PUBLIC variables!** The JWT_SECRET, ADMIN_SETUP_KEY, and database passwords are NOT public.

---

## 🧪 Verification Checklist

Before going to production:

- [ ] Backend deployed (Render/Railway/Heroku)
- [ ] Backend URL copied (e.g., `https://animah-api-xxxxx.onrender.com`)
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel to backend URL
- [ ] `API_URL` set in Vercel to same backend URL
- [ ] Backend's `CORS_ORIGIN` includes your Vercel URL
- [ ] Database credentials in Vercel (`DATABASE_URL`, `DIRECT_URL`)
- [ ] JWT_SECRET set in Vercel (64 character secure value)
- [ ] ADMIN_SETUP_KEY set in Vercel (64 character secure value)
- [ ] Vercel frontend redeployed
- [ ] Frontend loads at `https://animah.vercel.app` without errors
- [ ] No "Unable to reach API server" error in console
- [ ] Login/Register works
- [ ] Can create titles
- [ ] Admin setup page works

---

## 📞 If Something Still Breaks

### "Unable to reach the API server"

1. Check Vercel logs: **Deployments** → **Logs**
2. Check env vars are set: **Settings** → **Environment Variables**
3. Test backend: `curl https://animah-api-xxxxx.onrender.com/api/health`
4. Should return: `{"status":"ok",...}`

### CORS Error in Browser Console

1. Check backend CORS_ORIGIN setting
2. Includes your Vercel URL (e.g., `https://animah.vercel.app`)
3. Redeploy backend
4. Refresh browser

### Database Connection Error

1. Check `DATABASE_URL` is correct in Vercel
2. Check Neon database is running: https://console.neon.tech
3. Verify `-pooler` is in the hostname for runtime queries
4. Test locally: Copy DATABASE_URL to `.env` and run `npm run dev`

### Backend Not Deploying

1. Check deployment logs in Render/Railway/Heroku
2. Run `npm run build:server` locally - should produce no errors
3. Verify all environment variables are set
4. Check Node.js version compatibility

---

## 📚 Documentation Files Updated

| File | What Changed |
|------|--------------|
| [src/lib/config.ts](src/lib/config.ts) | Better error messages in production |
| [.env.example](.env.example) | Complete rewrite with dev/prod sections |
| [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) | Updated with detailed Vercel setup |
| [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md) | NEW - Guide for deploying Express backend |

---

## Next: Create Admin Account

Once everything is deployed and working:

1. Go to https://animah.vercel.app/admin-setup
2. Enter your `ADMIN_SETUP_KEY` value
3. Create admin account
4. Login as admin
5. Access admin dashboard at https://animah.vercel.app/admin

---

## Questions?

See:
- **Frontend setup**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **Backend setup**: [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md)
- **Environment variables**: [.env.example](.env.example)
- **Database setup**: [DATABASE_SETUP.md](DATABASE_SETUP.md)

Good luck! 🚀
