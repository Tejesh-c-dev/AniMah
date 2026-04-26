# AniMah (Single Project)

AniMah now runs as one root project with:

- Next.js + TypeScript frontend in `src/`
- Express + Prisma backend in `server/`

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Fill backend variables (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ADMIN_SETUP_KEY`, `CORS_ORIGIN`).
3. Set `ADMIN_SETUP_KEY` for one-time admin account bootstrap.
4. Set `NEXT_PUBLIC_API_URL` to your backend base URL.
5. For split-domain production (Vercel frontend + separate API), set `AUTH_COOKIE_SAMESITE=none`.

## Admin Account Setup

1. Start the backend.
2. Call `POST /api/auth/admin/bootstrap` with:
	- `username`
	- `email`
	- `password`
	- `setupKey` (must match `ADMIN_SETUP_KEY`)
3. Use `POST /api/auth/admin/login` for admin-only login checks.

Admin-only management endpoints:
- `GET /api/auth/users` list users
- `DELETE /api/auth/users/:id` remove user
- `DELETE /api/titles/:id` remove any title
- `PATCH /api/auth/users/:id/role` change roles

## Scripts

- `npm run dev` - Run backend and frontend together
- `npm run dev:server` - Run only backend
- `npm run dev:web` - Run only Next.js frontend
- `npm run build` - Build backend and frontend
- `npm run start` - Run built backend and frontend
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run Prisma migrations

## Vercel Deployment

Deploy the Next.js frontend to Vercel and host the Express API on a separate backend host.

1. Deploy backend (`server/`) to your backend provider.
2. In Vercel project settings, set:
	- `NEXT_PUBLIC_API_URL=https://your-backend-domain.com`
3. Vercel build command should be `npm run build:web`.
4. Ensure backend environment variables are configured:
	- `DATABASE_URL`
	- `DIRECT_URL`
	- `JWT_SECRET`
	- `ADMIN_SETUP_KEY`
	- `CORS_ORIGIN=https://your-vercel-app.vercel.app`
	- `AUTH_COOKIE_SAMESITE=none`

Notes:
- You can provide multiple origins in `CORS_ORIGIN` as a comma-separated list.
- `JWT_SECRET` and `ADMIN_SETUP_KEY` must each be at least 32 characters.
- `NEXT_PUBLIC_API_URL` is required in production for this split deployment.
- If backend and frontend run on different domains, `AUTH_COOKIE_SAMESITE` must be `none` and HTTPS must be enabled.
