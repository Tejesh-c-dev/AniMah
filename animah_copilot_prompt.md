# AniMah — GitHub Copilot Scaffold Prompt

You are a senior full-stack engineer. Scaffold a production-ready full-stack web application called **AniMah** — a community platform for tracking anime, manhwa, and movies.

---

## Tech Stack

- **Frontend + Backend**: Next.js 14 (App Router) with TypeScript
- **Database**: PostgreSQL (self-hosted or Neon/Railway)
- **ORM**: Prisma with full migrations
- **Auth**: JWT (via `jsonwebtoken` + `bcryptjs`), stored in httpOnly cookies
- **File uploads**: Next.js API route with `formidable`, saved to `/public/uploads` or a cloud bucket
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Deployment**: Vercel (frontend + API routes as serverless functions)

---

## Project Structure

Use the Next.js App Router layout:

```
/app
  /api
    /auth/[...route]/route.ts
    /titles/[...route]/route.ts
    /reviews/[...route]/route.ts
    /watchlist/[...route]/route.ts
    /favorites/[...route]/route.ts
    /admin/[...route]/route.ts
    /health/route.ts
  /(auth)
    /login/page.tsx
    /register/page.tsx
  /(main)
    /page.tsx                   ← home/browse
    /titles/[id]/page.tsx       ← title detail
    /add-title/page.tsx
    /profile/page.tsx
    /admin/page.tsx
/components
  /ui      ← StarRating, FavoriteButton, WatchlistDropdown, Skeleton, Toast, etc.
  /layout  ← Navbar, ThemeToggle, RouteGuard, MobileMenu
/lib
  /prisma.ts
  /auth.ts         ← JWT helpers (sign, verify, extract from cookie)
  /middleware.ts   ← withAuth, withAdmin, inputSanitizer
  /uploadHandler.ts
/prisma
  /schema.prisma
  /migrations/
/types
  /index.ts        ← shared TypeScript types and enums
```

---

## Environment Variables

Create a `.env.local` file with the following:

```env
DATABASE_URL="postgresql://user:password@host:5432/animah"
JWT_SECRET="your_jwt_secret"
ADMIN_SETUP_KEY="your_admin_setup_key"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3000,https://your-vercel-app.vercel.app"
```

---

## Database Schema (Prisma + PostgreSQL)

Define the following models in `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum TitleType {
  ANIME
  MANHWA
  MOVIE
}

enum WatchStatus {
  PLAN_TO_WATCH
  WATCHING
  COMPLETED
  DROPPED
}

enum VoteType {
  HELPFUL
  NOT_HELPFUL
}

model User {
  id           String         @id @default(cuid())
  email        String         @unique
  username     String         @unique
  passwordHash String
  role         Role           @default(USER)
  profileImage String?
  createdAt    DateTime       @default(now())
  reviews      Review[]
  watchlist    WatchlistItem[]
  favorites    Favorite[]
  reviewVotes  ReviewVote[]
  reviewReplies ReviewReply[]
  activity     Activity[]
}

model Title {
  id           String         @id @default(cuid())
  name         String
  description  String
  releaseYear  Int
  type         TitleType
  genre        String[]
  coverImage   String?
  createdAt    DateTime       @default(now())
  reviews      Review[]
  watchlist    WatchlistItem[]
  favorites    Favorite[]
}

model Review {
  id        String        @id @default(cuid())
  userId    String
  titleId   String
  rating    Int           // 1–10
  content   String
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     Title         @relation(fields: [titleId], references: [id], onDelete: Cascade)
  votes     ReviewVote[]
  replies   ReviewReply[]

  @@unique([userId, titleId])
}

model ReviewVote {
  id       String   @id @default(cuid())
  userId   String
  reviewId String
  voteType VoteType
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  review   Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@unique([userId, reviewId])
}

model ReviewReply {
  id        String   @id @default(cuid())
  userId    String
  reviewId  String
  content   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  review    Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
}

model WatchlistItem {
  id        String      @id @default(cuid())
  userId    String
  titleId   String
  status    WatchStatus
  updatedAt DateTime    @updatedAt
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     Title       @relation(fields: [titleId], references: [id], onDelete: Cascade)

  @@unique([userId, titleId])
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  titleId   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     Title    @relation(fields: [titleId], references: [id], onDelete: Cascade)

  @@unique([userId, titleId])
}

model Activity {
  id         String   @id @default(cuid())
  userId     String
  actionType String   // e.g. "REVIEW_CREATED", "ADDED_TO_WATCHLIST", "FAVORITED"
  metadata   Json?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Authentication & Authorization

Implement these API routes under `/app/api/auth/`:

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Hash password with bcryptjs, create User, set JWT in httpOnly cookie |
| POST | `/api/auth/login` | Verify credentials, set JWT in httpOnly cookie |
| POST | `/api/auth/logout` | Clear the auth cookie |
| GET | `/api/auth/me` | Return current user decoded from JWT cookie |
| POST | `/api/auth/admin-setup?setupKey=` | One-time admin bootstrap (check env ADMIN_SETUP_KEY) |

Create the following middleware helpers in `/lib/middleware.ts`:
- `withAuth(handler)` — extract and verify JWT from cookie, attach user to request context
- `withAdmin(handler)` — same as withAuth but additionally assert `user.role === "ADMIN"`
- `sanitizeInput(data)` — strip HTML tags, trim strings, reject empty required fields

---

## API Routes — Titles

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/titles` | Public | List all titles. Query params: `?type=`, `?search=`, `?sort=newest\|oldest\|rating`, `?genre=` |
| GET | `/api/titles/[id]` | Public | Single title with avg rating and review count |
| POST | `/api/titles` | User | Create title. Accept `multipart/form-data` with fields: name, description, releaseYear, type, genre (array), coverImage (file). Validate file type (JPEG/PNG/WebP/GIF) and size (max 5MB). |
| DELETE | `/api/titles/[id]` | Admin | Delete title and cascade reviews/watchlist/favorites |

---

## API Routes — Reviews

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/reviews?titleId=` | Public | List reviews for a title. Query: `?sort=latest\|top_rated\|most_helpful` |
| POST | `/api/reviews` | User | Create review. Body: `{ titleId, rating, content }`. One review per user per title enforced at DB level. |
| PATCH | `/api/reviews/[id]` | User (owner) | Edit rating or content |
| DELETE | `/api/reviews/[id]` | User (owner) or Admin | Delete review |
| POST | `/api/reviews/[id]/vote` | User | Vote on review. Body: `{ voteType: "HELPFUL" \| "NOT_HELPFUL" }`. Upsert vote. |
| POST | `/api/reviews/[id]/reply` | User | Reply to review. Body: `{ content }` |

Apply rate limiting on POST /reviews and POST /vote — max 10 requests per minute per user using an in-memory or Redis-based limiter.

---

## API Routes — Watchlist

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/watchlist` | User | Get current user's watchlist, optionally filtered by `?status=` |
| POST | `/api/watchlist` | User | Add title. Body: `{ titleId, status }` |
| PATCH | `/api/watchlist/[titleId]` | User | Update status. Body: `{ status }` |
| DELETE | `/api/watchlist/[titleId]` | User | Remove from watchlist |
| GET | `/api/watchlist/stats` | User | Return counts grouped by status |

---

## API Routes — Favorites

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/favorites` | User | Get all favorites for current user |
| POST | `/api/favorites/toggle` | User | Toggle favorite. Body: `{ titleId }`. Add if not exists, remove if exists. Return `{ favorited: boolean }` |
| GET | `/api/favorites/status/[titleId]` | User | Return `{ favorited: boolean }` for a title |

---

## API Routes — Admin

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| DELETE | `/api/admin/users/[id]` | Admin | Delete user (prevent self-delete in logic) |
| PATCH | `/api/admin/users/[id]/role` | Admin | Toggle role between USER and ADMIN. Body: `{ role }` |
| GET | `/api/admin/titles` | Admin | List all titles |
| DELETE | `/api/admin/titles/[id]` | Admin | Delete title |

---

## API Routes — Profile

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/profile` | User | Return user profile with stats (review count, helpful votes received) |
| PATCH | `/api/profile` | User | Update username or profileImage (multipart/form-data). Image same constraints as cover image. |

---

## Frontend Pages

### Home Page `/`
- Category tabs: All, Anime, Manhwa, Movie
- Search bar (debounced, 300ms)
- Sort dropdown: Newest, Oldest, Top Rated
- Genre filter chips
- Title cards in responsive grid with cover image, name, type badge, avg rating
- Loading skeleton while fetching
- Personalized recommendations section (visible only when logged in)

### Title Detail Page `/titles/[id]`
- Cover image, name, type, genre tags, release year, description
- Average star rating with breakdown
- Watchlist status dropdown (if logged in)
- Favorite toggle heart button with toast feedback (if logged in)
- Review section:
  - Create review form (1 per user — hide form if already reviewed)
  - Sort reviews by latest / top rated / most helpful
  - Each review: username, avatar, rating, content, helpful/not helpful vote buttons, reply thread
  - Edit and delete own review

### Add Title Page `/add-title` (protected)
- Form: name, description, release year, type (select), genre (multi-select or tags input), cover image upload with preview
- Validates file type and size client-side before submit

### Profile Page `/profile` (protected)
- Avatar with upload button
- Display name, email, stats (reviews written, helpful votes received)
- Tabs:
  - **Watchlist** — grouped by status with status change dropdown per item
  - **Favorites** — grid of favorited titles with remove option
  - **Activity** — timeline of recent actions with timestamps

### Admin Dashboard `/admin` (admin-only)
- Users table: username, email, role, joined date — with delete and promote/demote buttons
- Titles table: name, type, created date — with delete button
- Prevent deleting own account in UI

### Auth Pages `/login` and `/register`
- Clean centered card layout
- Inline validation errors
- Redirect to `/` on success

---

## Shared UI Components

Build the following reusable components in `/components/ui/`:

- `StarRating` — interactive (for forms) and display-only (for listings) modes, accepts 1–10 scale
- `FavoriteButton` — heart icon, toggles on click, optimistic UI update, toast on success/error
- `WatchlistDropdown` — select with PLAN_TO_WATCH / WATCHING / COMPLETED / DROPPED, calls PATCH on change
- `Skeleton` — animated loading placeholder, variants: card, list item, profile header
- `Toast` — lightweight notification (success/error/info), auto-dismiss after 3s
- `RouteGuard` — HOC/wrapper that redirects to `/login` if user not authenticated
- `AdminGuard` — redirects non-admins to `/`

Build the following in `/components/layout/`:
- `Navbar` — logo, nav links, auth buttons, theme toggle, mobile hamburger menu
- `ThemeToggle` — light/dark toggle stored in localStorage and applied via `data-theme` on `<html>`
- `MobileMenu` — slide-in drawer for small screens with same nav links

---

## UX & Accessibility Requirements

- All pages use Framer Motion page transition (`AnimatePresence` + `motion.div` with `initial/animate/exit`)
- Empty states for watchlist, favorites, reviews with a clear message and CTA
- Error states with retry button for failed fetches
- All interactive elements keyboard-accessible with visible focus rings
- Images use `next/image` with `alt` text
- Forms use semantic `<label>` elements tied to inputs

---

## CORS & Security

In Next.js middleware (`/middleware.ts` at project root):
- Allow origins from `ALLOWED_ORIGINS` env variable (comma-separated)
- Always allow `localhost:3000` and `*.vercel.app` origins
- Set `Secure`, `HttpOnly`, `SameSite=Strict` on the auth cookie
- API routes return proper HTTP status codes (400 for validation, 401 for unauth, 403 for forbidden, 404, 429 for rate limit, 500 for server error)

---

## Error Handling

- Centralized try/catch in all API routes returning `{ error: string }` JSON with appropriate status codes
- Client-side: fetch wrapper utility that throws typed errors, caught per-component

---

## Scripts (package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

---

## Deployment Notes (Vercel)

- Set all env variables in Vercel project settings
- `DATABASE_URL` must point to a publicly accessible PostgreSQL instance (Neon, Railway, or Supabase DB-only)
- Run `prisma migrate deploy` as part of the build step or via a separate CI job
- `NEXT_PUBLIC_API_BASE_URL` should be the Vercel deployment URL in production
- File uploads: for production use Vercel Blob or Cloudinary instead of local `/public/uploads` since Vercel has an ephemeral filesystem

---

## Deliverables

Generate the full project with:
1. All files and folder structure as defined above
2. `prisma/schema.prisma` with all models
3. All API route handlers with proper auth middleware, validation, and error handling
4. All frontend pages with data fetching, loading/error/empty states
5. All shared UI components
6. `tailwind.config.ts` with any custom theme tokens needed
7. `next.config.ts` with image domains and any required config
8. `.env.local.example` listing all required variables
9. `README.md` with setup instructions, local dev steps, and deployment guide

Start with the Prisma schema and project scaffolding, then implement API routes domain by domain, then build the frontend.
