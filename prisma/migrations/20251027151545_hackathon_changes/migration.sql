/*
  Warnings:

  - A unique constraint covering the columns `[hackathonProjectId,raterId,categoryId,raterType]` on the table `HackathonProjectRating` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,order]` on the table `HackathonRatingCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `HackathonThemeCategory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `raterType` to the `HackathonProjectRating` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."HackathonRaterType" AS ENUM ('PARTICIPANT', 'JUDGE', 'PUBLIC');

-- DropIndex
DROP INDEX "public"."HackathonProjectRating_hackathonProjectId_raterId_categoryI_key";

-- DropIndex
DROP INDEX "public"."Project_id_userId_key";

-- AlterTable
ALTER TABLE "public"."Hackathon" ADD COLUMN     "allowParticipantRating" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowPublicRating" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hackathonRatingCategoryId" TEXT;

-- AlterTable
ALTER TABLE "public"."HackathonProjectRating" ADD COLUMN     "raterType" "public"."HackathonRaterType" NOT NULL;

-- CreateTable
CREATE TABLE "public"."_HackathonJudges" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HackathonJudges_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_HackathonRatingCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HackathonRatingCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_HackathonJudges_B_index" ON "public"."_HackathonJudges"("B");

-- CreateIndex
CREATE INDEX "_HackathonRatingCategories_B_index" ON "public"."_HackathonRatingCategories"("B");

-- CreateIndex
CREATE UNIQUE INDEX "HackathonProjectRating_hackathonProjectId_raterId_categoryI_key" ON "public"."HackathonProjectRating"("hackathonProjectId", "raterId", "categoryId", "raterType");

-- CreateIndex
CREATE UNIQUE INDEX "HackathonRatingCategory_name_order_key" ON "public"."HackathonRatingCategory"("name", "order");

-- CreateIndex
CREATE UNIQUE INDEX "HackathonThemeCategory_name_key" ON "public"."HackathonThemeCategory"("name");

-- AddForeignKey
ALTER TABLE "public"."Hackathon" ADD CONSTRAINT "Hackathon_hackathonRatingCategoryId_fkey" FOREIGN KEY ("hackathonRatingCategoryId") REFERENCES "public"."HackathonRatingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_HackathonJudges" ADD CONSTRAINT "_HackathonJudges_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_HackathonJudges" ADD CONSTRAINT "_HackathonJudges_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_HackathonRatingCategories" ADD CONSTRAINT "_HackathonRatingCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_HackathonRatingCategories" ADD CONSTRAINT "_HackathonRatingCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."HackathonRatingCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
