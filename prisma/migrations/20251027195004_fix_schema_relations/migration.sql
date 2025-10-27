/*
  Warnings:

  - You are about to drop the column `hackathonRatingCategoryId` on the `Hackathon` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Hackathon" DROP CONSTRAINT "Hackathon_hackathonRatingCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HackathonProject" DROP CONSTRAINT "HackathonProject_hackathonId_fkey";

-- AlterTable
ALTER TABLE "public"."Hackathon" DROP COLUMN "hackathonRatingCategoryId";

-- AddForeignKey
ALTER TABLE "public"."HackathonProject" ADD CONSTRAINT "HackathonProject_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
