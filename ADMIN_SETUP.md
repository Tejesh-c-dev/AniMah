# Admin Role System - Setup & Documentation

Complete production-ready admin role system for AniMah built on Next.js + Express + Neon PostgreSQL.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Environment Variables](#environment-variables)
4. [First-Time Admin Setup](#first-time-admin-setup)
5. [Admin Features](#admin-features)
6. [Security Measures](#security-measures)
7. [API Endpoints](#api-endpoints)
8. [Deployment Checklist](#deployment-checklist)
9. [Testing Checklist](#testing-checklist)

---

## Overview

The admin role system provides:

- **Role-based access control (RBAC)** with `USER` and `ADMIN` roles
- **Secure JWT authentication** with role embedded in token
- **Server-side authorization** middleware for API routes
- **Client-side route protection** with Next.js middleware
- **Admin dashboard** for user management, content moderation, and analytics
- **One-time admin bootstrap** using a secure setup key

---

## Database Schema

The `User` model includes a `role` column with the `Role` enum:

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id            String     @id @default(cuid())
  username      String     @unique
  email         String     @unique
  passwordHash  String
  role          Role       @default(USER)
  // ... other fields
}
```

**Key points:**
- Default role is `USER` for new registrations
- Admin role must be explicitly assigned via bootstrap or promotion

---

## Environment Variables

Required environment variables in `.env`:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# JWT Configuration
JWT_SECRET="your-64-char-secure-random-string"

# Admin Setup Key (for first admin creation)
ADMIN_SETUP_KEY="your-64-char-secure-random-string"

# CORS Configuration
CORS_ORIGIN="https://your-domain.com"

# Production
NODE_ENV="production"
```

### Generating Secure Keys

```bash
# Generate JWT_SECRET
openssl rand -base64 48

# Generate ADMIN_SETUP_KEY
openssl rand -base64 48
```

---

## First-Time Admin Setup

### Method 1: Admin Bootstrap Page (Recommended)

1. Start the application
2. Navigate to `/admin-setup`
3. Enter:
   - Username (min 3 characters)
   - Email (valid format)
   - Password (min 8 characters)
   - Setup Key (from `ADMIN_SETUP_KEY` env var)
4. Click "Create Admin Account"
5. You'll be redirected to the admin dashboard

### Method 2: Direct API Call

```bash
curl -X POST http://localhost:5000/api/auth/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "securepassword123",
    "setupKey": "your-setup-key-here"
  }' \
  --cookie-jar cookies.txt
```

### Important Notes

- The bootstrap endpoint can **only** be used when **no admin exists** in the database
- The setup key is validated server-side
- After creating the first admin, the bootstrap endpoint becomes unavailable
- The setup key should be kept secret and **never committed to version control**

---

## Admin Features

### Dashboard (`/admin`)

The admin dashboard provides three main tabs:

#### 1. Stats Tab
- Total users, titles, reviews, watchlist entries, favorites
- New users in the last 7 days
- Total admin count
- Recent signups
- Trending titles by review count

#### 2. Users Tab
- **Search** users by username or email
- **View** user details (email, join date, activity counts)
- **Promote** users to admin
- **Demote** admins to regular users
- **Delete** users (with confirmation)
- **Pagination** for large user lists

#### 3. Titles Tab
- View all titles in the system
- **Delete** titles (with confirmation)
- View title statistics (reviews, favorites, watchlist counts)

### User Management Actions

| Action | Endpoint | Description |
|--------|----------|-------------|
| Promote | `POST /api/admin/users/:id/promote` | Upgrade user to admin |
| Demote | `POST /api/admin/users/:id/demote` | Downgrade admin to user |
| Delete | `DELETE /api/admin/users/:id` | Remove user and all data |
| Change Role | `PATCH /api/admin/users/:id/role` | Set specific role |

---

## Security Measures

### 1. JWT Token Security
- Role is embedded in JWT payload at token creation
- Token is signed with `JWT_SECRET` (min 32 chars)
- Token expires after 7 days
- Stored in httpOnly, secure cookie

### 2. Server-Side Authorization

All admin routes use the `authorize(Role.ADMIN)` middleware:

```typescript
router.get('/users', authorize(Role.ADMIN), async (req, res) => {
  // Only admins can access
});
```

### 3. Next.js Middleware

Client-side route protection in `middleware.ts`:

- Redirects unauthenticated users to login
- Verifies admin role for admin routes
- Prevents direct URL access to protected pages

### 4. Privilege Escalation Prevention

- **Cannot change own role**: Users cannot promote themselves
- **Last admin protection**: Cannot demote/delete the only admin
- **Admin deletion blocked**: Cannot delete other admin users
- **Server-side validation**: All role checks happen server-side

### 5. Input Sanitization

- Username/email are trimmed and normalized
- SQL injection prevented via Prisma ORM
- XSS prevention via input sanitization middleware

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (default: USER role) |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user (includes role) |
| POST | `/api/auth/admin/bootstrap` | Create first admin |
| POST | `/api/auth/admin/login` | Admin-only login endpoint |

### Admin - Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users (with search/pagination) |
| GET | `/api/admin/users/:id` | Get single user details |
| POST | `/api/admin/users/:id/promote` | Promote to admin |
| POST | `/api/admin/users/:id/demote` | Demote to user |
| DELETE | `/api/admin/users/:id` | Delete user |

### Admin - Titles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/titles` | List all titles |
| DELETE | `/api/admin/titles/:id` | Delete title |

### Admin - Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Get dashboard statistics |

---

## Deployment Checklist

### Pre-Deployment

- [ ] Generate secure `JWT_SECRET` (min 32 characters)
- [ ] Generate secure `ADMIN_SETUP_KEY` (min 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` for your production domain
- [ ] Update `DATABASE_URL` and `DIRECT_URL` for Neon production DB
- [ ] Run `prisma migrate deploy` to apply schema changes
- [ ] **Do not commit `.env` file**

### Vercel Deployment

1. **Environment Variables**: Add all required env vars in Vercel dashboard
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Server**: Deploy Express server separately (e.g., Railway, Render, or Vercel Functions)

### Neon Database

1. Connect to your Neon project
2. Run migrations: `npx prisma migrate deploy`
3. Verify schema includes `role` column on `User` table
4. Test connection with `DATABASE_URL`

### Post-Deployment

1. Navigate to `/admin-setup` on production
2. Create first admin account using `ADMIN_SETUP_KEY`
3. Verify admin dashboard is accessible
4. Test user promotion/demotion
5. Remove or rotate `ADMIN_SETUP_KEY` if desired

---

## Testing Checklist

### Authentication

- [ ] New user registration creates USER role by default
- [ ] Login returns JWT with correct role
- [ ] `/api/auth/me` returns user with role field
- [ ] Logout clears token cookie

### Admin Bootstrap

- [ ] Bootstrap fails without setup key
- [ ] Bootstrap fails with wrong setup key
- [ ] Bootstrap succeeds with valid setup key
- [ ] Bootstrap fails when admin already exists
- [ ] Created admin can login and access dashboard

### Route Protection

- [ ] `/admin` redirects to login when not authenticated
- [ ] `/admin` redirects to `/forbidden` for non-admin users
- [ ] Admin can access `/admin` without issues
- [ ] Admin badge shows only for admin users
- [ ] Admin link hidden from regular users in navbar

### User Management

- [ ] Admin can view all users
- [ ] Admin can search users by username/email
- [ ] Admin can promote user to admin
- [ ] Admin can demote admin to user
- [ ] Cannot demote the last admin
- [ ] Cannot delete admin users
- [ ] Cannot delete yourself
- [ ] Cannot change your own role

### Admin Dashboard

- [ ] Stats tab shows correct counts
- [ ] Users tab displays user list with roles
- [ ] Titles tab displays title list
- [ ] Pagination works for large datasets
- [ ] Delete confirmations show correctly
- [ ] Success/error messages display properly

### Security

- [ ] Role cannot be changed via client-side manipulation
- [ ] API requests without token are rejected
- [ ] API requests with invalid token are rejected
- [ ] Non-admin API requests to admin routes are rejected
- [ ] JWT expiration is enforced

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── admin-setup/page.tsx    # NEW: Admin bootstrap UI
│   ├── (main)/
│   │   ├── admin/page.tsx          # UPDATED: Full admin dashboard
│   │   └── profile/page.tsx        # UPDATED: Admin badge & link
│   └── forbidden/page.tsx
├── components/
│   ├── auth/ProtectedRoute.tsx
│   └── layout/Navbar.tsx           # UPDATED: Admin badges
├── hooks/useAuth.tsx
├── types/index.ts
└── middleware.ts                   # NEW: Route protection

server/
├── src/
│   ├── index.ts
│   ├── middleware/index.ts         # UPDATED: Admin middleware
│   ├── routes/
│   │   ├── auth.ts                 # Has bootstrap endpoint
│   │   └── admin.ts                # UPDATED: Promote/demote endpoints
│   └── utils/auth.ts

prisma/
└── schema.prisma                   # Has Role enum
```

---

## Troubleshooting

### "Invalid setup key" error
- Verify `ADMIN_SETUP_KEY` in your environment matches what you're entering
- Check for extra whitespace or quotes

### "Admin already exists" error
- An admin account was already created
- Use the existing admin account or check your database

### 403 Forbidden on admin routes
- Verify user has `ADMIN` role in database
- Check JWT token contains correct role
- Clear browser cache and re-login

### Database migration errors
- Run `npx prisma migrate deploy` to apply pending migrations
- Verify `role` column exists on `User` table

---

## Support

For issues or questions:
1. Check this documentation first
2. Review the testing checklist
3. Verify environment variables are set correctly
4. Check server logs for detailed error messages
