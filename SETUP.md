# AniMah - Setup & Installation Guide

Welcome to **AniMah**, a community platform for tracking anime, manhwa, and movies!

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 12+ (local or cloud-based like Neon/Railway)
- **Git**

### 1. Clone & Install Dependencies

```bash
cd animah
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Update `.env` with your database and JWT credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/animah_dev"
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"
ADMIN_SETUP_KEY="your_admin_setup_key_change_this_in_production"
NEXT_PUBLIC_API_URL="http://localhost:5000"
PORT=5000
```

### 3. Setup Database

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

This creates all tables based on `prisma/schema.prisma`.

### 4. Create Admin Account

Start the backend:

```bash
npm run dev:server
```

In another terminal, bootstrap an admin account:

```bash
curl -X POST http://localhost:5000/api/auth/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "setupKey": "your_admin_setup_key"
  }'
```

### 5. Start Development

Run both frontend and backend together:

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000 (Next.js)
- **Backend**: http://localhost:5000 (Express API)

## 📁 Project Structure

```
/
├── src/                           # Next.js Frontend
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/               # Login/Register pages
│   │   ├── (main)/               # Main app pages
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   └── layout/               # Layout components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities
│   └── types/                    # TypeScript types
├── server/                        # Express Backend
│   ├── src/
│   │   ├── index.ts             # Main server file
│   │   ├── routes/              # API route handlers
│   │   ├── middleware/          # Auth & error handling
│   │   └── utils/               # Helper functions
│   └── tsconfig.json
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── public/
│   └── uploads/                 # User-uploaded files
├── package.json
├── next.config.js
└── tailwind.config.js
```

## 🔑 Available Scripts

```bash
# Development
npm run dev              # Run frontend + backend together
npm run dev:server      # Run only backend
npm run dev:web         # Run only frontend

# Building
npm run build           # Build frontend + backend
npm run build:server    # Build only backend
npm run build:web       # Build only frontend

# Running
npm start              # Run built backend + frontend

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run pending migrations
npm run prisma:studio      # Open Prisma Studio UI

# Linting
npm run lint           # Run ESLint
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/admin/bootstrap` - Bootstrap admin (one-time)

### Titles
- `GET /api/titles` - Get all titles (with filtering & pagination)
- `GET /api/titles/:id` - Get specific title with reviews
- `POST /api/titles` - Create title (authenticated)
- `DELETE /api/titles/:id` - Delete title (admin only)

### Reviews
- `GET /api/reviews/:titleId` - Get title reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/vote` - Vote on review
- `POST /api/reviews/:id/reply` - Reply to review

### Watchlist
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add to watchlist
- `PUT /api/watchlist/:id` - Update status
- `DELETE /api/watchlist/:id` - Remove from watchlist
- `GET /api/watchlist/stats` - Get watchlist stats

### Favorites
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:titleId` - Remove from favorites
- `POST /api/favorites/toggle/:titleId` - Toggle favorite
- `GET /api/favorites/check/:titleId` - Check if favorited

### Admin
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/:id` - Delete user
- `PATCH /api/admin/users/:id/role` - Change user role
- `GET /api/admin/titles` - List all titles
- `GET /api/admin/stats` - Get dashboard stats

## 🎨 Features

✅ **Browse Titles** - Discover anime, manhwa, and movies with filtering & search
✅ **User Authentication** - Secure JWT-based registration & login
✅ **Reviews & Ratings** - Rate and review titles, see community feedback
✅ **Watchlist** - Track what you're watching with status management
✅ **Favorites** - Save your favorite titles
✅ **User Profiles** - View and manage your watchlist, favorites, and reviews
✅ **Admin Dashboard** - Manage users and content
✅ **Dark Mode** - Light/dark theme toggle
✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Smooth Animations** - Framer Motion transitions throughout

## 🗄️ Database Schema

Key tables:
- `User` - User accounts with role-based access
- `Title` - Anime/Manhwa/Movies metadata
- `Review` - User reviews with ratings
- `ReviewVote` - Helpful/not helpful votes on reviews
- `ReviewReply` - Replies to reviews
- `Watchlist` - User's titles with watch status
- `Favorite` - User's favorite titles

## 🚢 Deployment

### Vercel (Frontend)

1. Push code to GitHub
2. Connect to Vercel: https://vercel.com/new
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.com`
4. Deploy!

### Backend (Railway/Render/Heroku)

1. Create account on your chosen platform
2. Connect GitHub repository
3. Set environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_SETUP_KEY`
   - `CORS_ORIGIN=https://your-frontend.vercel.app`
4. Deploy!

## 🐛 Troubleshooting

**Database connection failed**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` format
- Verify database exists

**API not responding**
- Check if backend is running on port 5000
- Verify `NEXT_PUBLIC_API_URL` in `.env`
- Check browser console for CORS errors

**JWT errors**
- Ensure `JWT_SECRET` is set in `.env`
- Tokens expire after 7 days

**Migrations failed**
- Run `npm run prisma:generate` first
- Check Prisma schema syntax

## 📚 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Auth**: JWT with httpOnly cookies
- **Styling**: Tailwind CSS with custom components
- **Deployment**: Vercel (frontend), self-hosted/cloud (backend)

## 💡 Development Tips

1. Use `npm run prisma:studio` to visualize database
2. Check `/api/health` endpoint to verify backend is running
3. Browser DevTools Network tab helps debug API calls
4. Dark mode CSS classes use `dark:` prefix
5. Components are in `src/components/ui/` for reusability

## 📝 Contributing

Feel free to add new features! Some ideas:
- User notifications
- Social features (follow users, comments)
- Advanced search & filters
- Recommendation algorithm
- Image upload for profile pictures
- Community forums

---

**Happy tracking! 🎬📺**
