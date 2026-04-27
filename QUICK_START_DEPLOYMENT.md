# Quick Reference: AniMah Deployment

## 🎯 The Problem

`NEXT_PUBLIC_API_URL="http://localhost:5002"` works locally but NOT on Vercel.

## ✅ The Solution

1. Deploy Express backend to Render/Railway/Heroku → Get URL like `https://animah-api-xxxxx.onrender.com`
2. Set that URL in Vercel environment variables
3. Redeploy frontend

---

## 📋 DEPLOYMENT STEPS (5 minutes)

### Step 1: Deploy Express Backend (Choose ONE)

**RENDER (Recommended - Free)**
```
1. Go to render.com → New Web Service
2. Connect GitHub repo
3. Build: npm install && npm run build:server
4. Start: node server/dist/index.js
5. Add env vars: DATABASE_URL, DIRECT_URL, JWT_SECRET, ADMIN_SETUP_KEY, 
                 CORS_ORIGIN, NODE_ENV=production
6. Copy URL when deployed
```

**RAILWAY (Better - $5/mo)**
```
1. Go to railway.app → New Project
2. Select GitHub repo
3. Set build & start commands
4. Add environment variables
5. Copy URL when deployed
```

**HEROKU (CLI)**
```bash
heroku login
heroku create animah-api
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set JWT_SECRET="your-secret"
heroku config:set ADMIN_SETUP_KEY="your-secret"
heroku config:set CORS_ORIGIN="https://animah.vercel.app,https://animah-*.vercel.app"
git push heroku main
```

**See** [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md) for detailed steps.

---

### Step 2: Update Vercel (2 minutes)

1. Go to https://vercel.com/dashboard
2. Click **AniMah** project
3. **Settings** → **Environment Variables**
4. Update these variables:

```
NEXT_PUBLIC_API_URL = https://animah-api-xxxxx.onrender.com
API_URL = https://animah-api-xxxxx.onrender.com
DATABASE_URL = postgresql://neondb_owner:...pooler... (same as local)
DIRECT_URL = postgresql://neondb_owner:... (same as local)
JWT_SECRET = animah-secure-auth-key-2026-v2-ultra-safe-layer
ADMIN_SETUP_KEY = animah_admin_setup_key_2026_prod_ready_secure_9x7k
CORS_ORIGIN = https://animah.vercel.app,https://animah-*.vercel.app
```

5. **Redeploy**: Deployments tab → three dots (…) → Redeploy

---

### Step 3: Update Backend CORS (1 minute)

Go to your backend deployment dashboard (Render/Railway/Heroku):

Set environment variable:
```
CORS_ORIGIN = https://animah.vercel.app,https://animah-*.vercel.app
```

Redeploy.

---

### Step 4: Test (1 minute)

1. Go to https://animah.vercel.app
2. Should NOT see "Unable to reach API server" error
3. Try login - should work ✅

---

## 🔑 Environment Variables at a Glance

| Variable | Local | Vercel | Where From |
|----------|-------|--------|-----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5002` | `https://api-xxxxx.onrender.com` | Backend URL |
| `API_URL` | `http://localhost:5002` | `https://api-xxxxx.onrender.com` | Backend URL |
| `DATABASE_URL` | See .env | Copy from Neon | Neon Dashboard |
| `DIRECT_URL` | See .env | Copy from Neon | Neon Dashboard |
| `JWT_SECRET` | See .env | `openssl rand -base64 48` | Generate |
| `ADMIN_SETUP_KEY` | See .env | `openssl rand -base64 48` | Generate |
| `CORS_ORIGIN` | `http://localhost:3000,...` | `https://animah.vercel.app,...` | Your domain |
| `PORT` | 5002 | (omit) | Render/Railway assign |

---

## 🧪 Testing Your Backend

After deploying, test it works:

```bash
# Should return 200 and {"status":"ok",...}
curl https://animah-api-xxxxx.onrender.com/api/health

# Should return list of titles
curl https://animah-api-xxxxx.onrender.com/api/titles
```

---

## 🆘 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Unable to reach API server" | `NEXT_PUBLIC_API_URL` not set or wrong | Set it to your backend URL in Vercel |
| CORS error in console | Backend CORS_ORIGIN doesn't include Vercel URL | Update backend's `CORS_ORIGIN` |
| Backend crashes on startup | Database connection wrong | Check DATABASE_URL has `-pooler` endpoint |
| Vercel redeploy failed | Build error | Check build logs in Vercel dashboard |

---

## 📚 Full Guides

- **Frontend setup**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **Backend setup**: [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md)
- **Complete summary**: [API_URL_FIX_SUMMARY.md](API_URL_FIX_SUMMARY.md)
- **Env vars explained**: [.env.example](.env.example)

---

## 🚀 Done?

Admin setup at: https://animah.vercel.app/admin-setup?key=YOUR_ADMIN_SETUP_KEY
