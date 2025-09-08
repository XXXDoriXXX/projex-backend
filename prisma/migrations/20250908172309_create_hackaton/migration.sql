/*
  Warnings:

  - Added the required column `ip` to the `View` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."HackathonStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."View" DROP COLUMN "ip",
ADD COLUMN     "ip" INET NOT NULL;

-- CreateTable
CREATE TABLE "public"."Hackathon" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."HackathonStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HackathonParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HackathonParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HackathonThemeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "HackathonThemeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HackathonProject" (
    "id" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "HackathonProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HackathonRatingCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "HackathonRatingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HackathonProjectRating" (
    "id" TEXT NOT NULL,
    "hackathonProjectId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HackathonProjectRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_HackathonThemes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HackathonThemes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "HackathonParticipant_hackathonId_idx" ON "public"."HackathonParticipant"("hackathonId");

-- CreateIndex
CREATE UNIQUE INDEX "HackathonParticipant_userId_hackathonId_key" ON "public"."HackathonParticipant"("userId", "hackathonId");

-- CreateIndex
CREATE INDEX "HackathonProject_hackathonId_idx" ON "public"."HackathonProject"("hackathonId");

-- CreateIndex
CREATE UNIQUE INDEX "HackathonProject_hackathonId_projectId_key" ON "public"."HackathonProject"("hackathonId", "projectId");

-- CreateIndex
CREATE INDEX "HackathonProjectRating_hackathonProjectId_idx" ON "public"."HackathonProjectRating"("hackathonProjectId");

-- CreateIndex
CREATE INDEX "HackathonProjectRating_categoryId_idx" ON "public"."HackathonProjectRating"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "HackathonProjectRating_hackathonProjectId_raterId_categoryI_key" ON "public"."HackathonProjectRating"("hackathonProjectId", "raterId", "categoryId");

-- CreateIndex
CREATE INDEX "_HackathonThemes_B_index" ON "public"."_HackathonThemes"("B");

-- AddForeignKey
ALTER TABLE "public"."Hackathon" ADD CONSTRAINT "Hackathon_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HackathonParticipant" ADD CONSTRAINT "HackathonParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HackathonParticipant" ADD CONSTRAINT "HackathonParticipant_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."Hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HackathonProject" ADD CONSTRAINT "HackathonProject_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."Hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HackathonProject" ADD CONSTRAINT "HackathonProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HackathonProjectRating" ADD CONSTRAINT "HackathonProjectRating_hackathonProjectId_fkey" FOREIGN KEY ("hackathonProjectId") REFERENCES "public"."HackathonProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HackathonProjectRating" ADD CONSTRAINT "HackathonProjectRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HackathonProjectRating" ADD CONSTRAINT "HackathonProjectRating_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."HackathonRatingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_HackathonThemes" ADD CONSTRAINT "_HackathonThemes_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_HackathonThemes" ADD CONSTRAINT "_HackathonThemes_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."HackathonThemeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
