# Vercel Deployment Guide - AniMah

This guide covers deploying the AniMah Next.js frontend to Vercel with proper API base URL configuration.

## Prerequisites

1. Backend server deployed and accessible via HTTPS
2. Database connection string (Neon PostgreSQL)
3. Vercel account connected to your GitHub repository

## Step 1: Configure Environment Variables in Vercel

Go to your Vercel project dashboard: **Project Settings > Environment Variables**

### Required Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `DIRECT_URL` | Neon direct connection (for Prisma) | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `JWT_SECRET` | 64-character random string | `openssl rand -base64 48` |
| `ADMIN_SETUP_KEY` | One-time admin setup key (32+ chars) | `openssl rand -base64 48` |
| `NEXT_PUBLIC_API_URL` | **CRITICAL**: Backend API URL for browser | `https://api.yourdomain.com` |
| `API_URL` | Backend API URL for server components | `https://api.yourdomain.com` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `https://your-frontend.vercel.app` |
| `AUTH_COOKIE_SAMESITE` | Cookie behavior for cross-domain | `none` |

### Generate Secure Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 48

# Generate ADMIN_SETUP_KEY
openssl rand -base64 48
```

## Step 2: Set Up Vercel Project

1. **Import Repository**: Connect your GitHub repo to Vercel
2. **Framework Preset**: Next.js (auto-detected)
3. **Root Directory**: Leave as default (unless monorepo)
4. **Build Command**: `npm run build`
5. **Output Directory**: `.next` (default)

### Add Environment Variables

Add all variables from Step 1 in the Vercel dashboard before deploying.

## Step 3: Configure Build Settings

In **Project Settings > Build & Development Settings**:

```
Framework: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

## Step 4: Deploy

1. Click **Deploy** in Vercel dashboard
2. Wait for build to complete
3. Check deployment logs for any errors

## Step 5: Verify Deployment

After deployment, verify:

- [ ] Homepage loads without errors
- [ ] API calls succeed (check browser console)
- [ ] Authentication works (login/register)
- [ ] Protected routes redirect properly
- [ ] Admin dashboard accessible (if admin)

## Troubleshooting

### Error: "Missing API base URL"

**Cause**: `NEXT_PUBLIC_API_URL` not set in Vercel environment variables.

**Fix**:
1. Go to Vercel Dashboard > Project Settings > Environment Variables
2. Add `NEXT_PUBLIC_API_URL` with your backend URL
3. Redeploy the project

### CORS Errors

**Cause**: Backend CORS_ORIGIN doesn't include your Vercel domain.

**Fix**: Update backend's `CORS_ORIGIN` to include:
- `https://your-project.vercel.app` (production)
- `https://your-project-git-branch.vercel.app` (preview deployments)

### Authentication Cookie Issues

**Cause**: Cookies not being sent cross-domain.

**Fix**:
1. Set `AUTH_COOKIE_SAMESITE=none` in Vercel
2. Ensure backend sets `Secure` flag on cookies in production
3. Verify `CORS_ORIGIN` includes your frontend domain

## Preview Deployments

For preview deployments (pull requests), you may need to:

1. Set `NEXT_PUBLIC_API_URL` to point to a staging backend
2. Or use environment variable prefixes in Vercel:
   - **Production**: Use production backend URL
   - **Preview**: Use staging backend URL
   - **Development**: Use localhost URL

## API URL Fallback Behavior

The `src/lib/config.ts` provides intelligent fallbacks:

```
Priority order for NEXT_PUBLIC_API_URL:
1. NEXT_PUBLIC_API_URL (if set)
2. API_URL (server-side fallback)
3. http://localhost:5000 (development only)
4. Empty string (production - prevents crash)
```

This ensures the app never crashes due to missing variables.

## Checklist Before Going Live

- [ ] All environment variables set in Vercel
- [ ] `NEXT_PUBLIC_API_URL` points to production backend
- [ ] `JWT_SECRET` is a secure random value (64+ chars)
- [ ] `ADMIN_SETUP_KEY` is set and secure
- [ ] CORS configured on backend for production domain
- [ ] Database migrations applied
- [ ] Admin account created
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Custom domain configured (optional)

## Post-Deployment

1. **Create Admin Account**: Visit `/admin-setup` with your `ADMIN_SETUP_KEY`
2. **Test All Features**: Browse titles, add reviews, manage watchlist
3. **Monitor Logs**: Check Vercel Functions logs for errors
4. **Set Up Alerts**: Configure Vercel alerts for deployment failures

## Support

For issues, check:
- Vercel Deployment Logs: **Deployments > [Latest] > View Logs**
- Browser Console: F12 > Console (for client errors)
- Backend Logs: Your backend hosting platform
