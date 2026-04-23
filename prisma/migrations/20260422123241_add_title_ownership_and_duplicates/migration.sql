/*
  Warnings:

  - A unique constraint covering the columns `[normalizedName,type]` on the table `Title` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Title" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "normalizedName" TEXT;

-- CreateIndex
CREATE INDEX "Title_createdById_idx" ON "Title"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Title_normalizedName_type_key" ON "Title"("normalizedName", "type");

-- AddForeignKey
ALTER TABLE "Title" ADD CONSTRAINT "Title_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
