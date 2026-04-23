# 🗄️ AniMah Database Setup Guide

This guide will walk you through setting up your PostgreSQL database for the AniMah platform.

## 📋 Prerequisites

Before starting, ensure you have:
- **PostgreSQL 12+** installed and running
- **Node.js 18+** with npm
- **Prisma CLI** (installed in the project via npm)
- Environment variables configured in `.env` file

## 🚀 Quick Setup (5 minutes)

### Step 1: Install PostgreSQL

**Windows:**
```bash
# Using Chocolatey
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database and User

Open PostgreSQL command line (psql):

```bash
psql -U postgres
```

Then run:

```sql
-- Create database
CREATE DATABASE animah_dev;

-- Create user with password
CREATE USER animah_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
ALTER ROLE animah_user SET client_encoding TO 'utf8';
ALTER ROLE animah_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE animah_user SET default_transaction_deferrable TO on;
ALTER ROLE animah_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE animah_dev TO animah_user;

-- Exit
\q
```

### Step 3: Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://animah_user:your_secure_password@localhost:5432/animah_dev"
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"
ADMIN_SETUP_KEY="your_admin_setup_key_change_this_in_production"
NEXT_PUBLIC_API_URL="http://localhost:5000"
PORT=5000
CORS_ORIGIN="http://localhost:3000,http://localhost:5000"
```

### Step 4: Generate Prisma Client & Run Migrations

```bash
# Generate Prisma client from schema
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

You'll be prompted to name your migration. Example:
```
? Enter a name for this migration › init
```

This will:
- Create all tables defined in `prisma/schema.prisma`
- Set up indexes and relations
- Prepare your database for use

### Step 5: Verify Database Setup

```bash
# Open Prisma Studio (visual database explorer)
npm run prisma:studio
```

This opens http://localhost:5555 in your browser, where you can:
- View all tables and their data
- Add/edit/delete records
- Test relationships between tables

---

## 🔄 Managing Your Database

### View Database URL

```bash
# Show current DATABASE_URL from .env
grep DATABASE_URL .env
```

### Connect to Database Directly

```bash
# Using psql
psql -U animah_user -d animah_dev -h localhost

# Or if using default postgres user
psql -U postgres -d animah_dev
```

### Create New Migration

When you modify `prisma/schema.prisma`:

```bash
npm run prisma:migrate
```

This will:
1. Compare your schema with the database
2. Generate migration file
3. Apply changes to database

### Reset Database (Caution!)

⚠️ **This deletes all data!**

```bash
npx prisma migrate reset
```

You'll need to re-bootstrap the admin account after this.

### View Migration History

```bash
ls prisma/migrations/
```

Each folder contains:
- `migration.sql` - The SQL that was executed
- `migration_lock.toml` - Lock file for consistency

---

## 🗄️ Database Schema Overview

The AniMah platform uses the following main tables:

### User
- `id` - Unique identifier
- `username` - Username (unique)
- `email` - Email address (unique)
- `passwordHash` - Hashed password
- `role` - USER or ADMIN
- `profileImage` - Profile picture URL
- `bio` - User biography

### Title
- `id` - Unique identifier
- `name` - Title name
- `description` - Long description
- `releaseYear` - Year released
- `type` - ANIME, MANHWA, or MOVIE
- `coverImage` - Cover image URL
- `genres` - Array of genre tags

### Review
- `id` - Unique identifier
- `rating` - Rating 1-10
- `content` - Review text
- `helpful` - Number of helpful votes
- `notHelpful` - Number of not helpful votes
- `userId` - Author ID (foreign key)
- `titleId` - Title ID (foreign key)

### Watchlist
- `id` - Unique identifier
- `status` - PLAN_TO_WATCH, WATCHING, COMPLETED, DROPPED
- `userId` - User ID (foreign key)
- `titleId` - Title ID (foreign key)
- `addedAt` - Timestamp when added

### Favorite
- `id` - Unique identifier
- `userId` - User ID (foreign key)
- `titleId` - Title ID (foreign key)
- `addedAt` - Timestamp when added

### ReviewVote
- `id` - Unique identifier
- `isHelpful` - Boolean vote
- `userId` - Voter ID (foreign key)
- `reviewId` - Review ID (foreign key)

### ReviewReply
- `id` - Unique identifier
- `content` - Reply text
- `userId` - Author ID (foreign key)
- `reviewId` - Review ID (foreign key)

---

## 🐛 Troubleshooting

### Error: "Can't reach database"

**Problem**: Connection refused
```
error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Ensure PostgreSQL is running:
   ```bash
   # Windows
   pg_isready

   # macOS
   brew services list | grep postgresql

   # Linux
   sudo systemctl status postgresql
   ```

2. Start PostgreSQL if not running:
   ```bash
   # Windows (Command Prompt as Admin)
   net start postgresql-x64-15

   # macOS
   brew services start postgresql@15

   # Linux
   sudo systemctl start postgresql
   ```

### Error: "Database does not exist"

```
error: database "animah_dev" does not exist
```

**Solution**: Create the database:
```bash
psql -U postgres -c "CREATE DATABASE animah_dev;"
```

### Error: "User does not have permission"

```
error: permission denied for schema public
```

**Solution**: Grant permissions:
```bash
psql -U postgres -d animah_dev -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO animah_user;"
```

### Error: "Invalid DATABASE_URL format"

**Problem**: Incorrect connection string format

**Solution**: Use this format:
```
postgresql://user:password@host:port/database
```

Example:
```
DATABASE_URL="postgresql://animah_user:mypassword@localhost:5432/animah_dev"
```

### Prisma Migration Failed

**Problem**: Migration crashes during `npm run prisma:migrate`

**Solutions:**
1. Check the generated SQL in `prisma/migrations/*/migration.sql`
2. Manually run problematic SQL in psql:
   ```bash
   psql -U animah_user -d animah_dev -f migration.sql
   ```
3. Try resetting (⚠️ loses data):
   ```bash
   npx prisma migrate reset
   ```

### Prisma Studio Won't Start

**Problem**: Connection timeout at `http://localhost:5555`

**Solutions:**
1. Ensure database is accessible
2. Check DATABASE_URL is correct
3. Restart PostgreSQL
4. Try a different port:
   ```bash
   npx prisma studio --port 5556
   ```

---

## 💾 Cloud Database Options

### Option 1: Neon (Recommended - Free tier available)

1. Go to https://neon.tech
2. Sign up with GitHub
3. Create a project
4. Copy the connection string
5. Set DATABASE_URL in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@neon.tech/database?sslmode=require"
   ```
6. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

### Option 2: Railway

1. Go to https://railway.app
2. Create new project → Add Database → PostgreSQL
3. Copy the database URL
4. Set DATABASE_URL in `.env`
5. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

### Option 3: Heroku Postgres

1. Create Heroku app
2. Add Heroku Postgres addon
3. Get DATABASE_URL from Config Vars
4. Set in `.env`
5. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

---

## 📊 Backup & Restore

### Backup Database

```bash
# Create backup file
pg_dump -U animah_user -d animah_dev -f backup.sql

# With compression
pg_dump -U animah_user -d animah_dev | gzip > backup.sql.gz
```

### Restore Database

```bash
# Restore from backup
psql -U animah_user -d animah_dev -f backup.sql

# From compressed backup
gunzip -c backup.sql.gz | psql -U animah_user -d animah_dev
```

---

## 🔐 Production Checklist

Before deploying to production:

- [ ] Use strong `JWT_SECRET` (min 32 characters)
- [ ] Use strong `ADMIN_SETUP_KEY` (min 32 characters)
- [ ] Set `DATABASE_URL` to production PostgreSQL
- [ ] Enable SSL: `?sslmode=require` in connection string
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Run `npm run prisma:migrate` on production
- [ ] Set `NODE_ENV=production`
- [ ] Implement database backups
- [ ] Monitor database performance
- [ ] Keep PostgreSQL updated

---

## 📞 Getting Help

If you encounter issues:

1. Check Prisma docs: https://www.prisma.io/docs/
2. Check PostgreSQL docs: https://www.postgresql.org/docs/
3. View Prisma error logs:
   ```bash
   tail -50 node_modules/.prisma/client/schema.wasm.log
   ```
4. Enable verbose Prisma logging:
   ```bash
   export DEBUG="*"
   npm run prisma:migrate
   ```

---

## ✅ Database Setup Complete!

Once setup is complete:

```bash
# Start development server
npm run dev

# Open in browser
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Prisma Studio: http://localhost:5555
```

Happy developing! 🚀
