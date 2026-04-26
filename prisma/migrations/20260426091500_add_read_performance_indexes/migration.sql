-- Improve read/query latency on frequently-used list/detail endpoints.
CREATE INDEX IF NOT EXISTS "Title_createdAt_idx" ON "Title"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Review_titleId_createdAt_idx" ON "Review"("titleId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Review_titleId_helpful_idx" ON "Review"("titleId", "helpful" DESC);
CREATE INDEX IF NOT EXISTS "Favorite_userId_addedAt_idx" ON "Favorite"("userId", "addedAt" DESC);
CREATE INDEX IF NOT EXISTS "Watchlist_userId_addedAt_idx" ON "Watchlist"("userId", "addedAt" DESC);

-- Optional but high-value for contains/ILIKE searches used in title and admin filters.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Title_name_trgm_idx" ON "Title" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Title_description_trgm_idx" ON "Title" USING GIN ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_username_trgm_idx" ON "User" USING GIN ("username" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_email_trgm_idx" ON "User" USING GIN ("email" gin_trgm_ops);
