# AniMah (Single Project)

AniMah now runs as one root project with:

- Next.js + TypeScript frontend in `src/`
- Express + Prisma backend in `server/`

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Fill backend variables (`DATABASE_URL`, `JWT_SECRET`, `SUPABASE_*`).
3. Set `ADMIN_SETUP_KEY` for one-time admin account bootstrap.
3. Optionally set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000`).

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
3. Ensure backend environment variables are configured:
	- `DATABASE_URL`
	- `JWT_SECRET`
	- `SUPABASE_URL`
	- `SUPABASE_ANON_KEY`
	- `SUPABASE_BUCKET_NAME`
	- `ADMIN_SETUP_KEY`
	- `CORS_ORIGIN=https://your-vercel-app.vercel.app`

Notes:
- You can provide multiple origins in `CORS_ORIGIN` as a comma-separated list.
- If `NEXT_PUBLIC_API_URL` is omitted, the frontend will default to same-origin `/api`.
