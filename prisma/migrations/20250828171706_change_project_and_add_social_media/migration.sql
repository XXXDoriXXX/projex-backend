/*
  Warnings:

  - You are about to drop the column `github` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `telegram` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[privateLinkToken]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "privateLinkToken" TEXT,
ADD COLUMN     "status" "public"."ProjectStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "github",
DROP COLUMN "linkedin",
DROP COLUMN "telegram";

-- CreateTable
CREATE TABLE "public"."SocialMedia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "handle" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SocialMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ProjectSubauthors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectSubauthors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProjectSubauthors_B_index" ON "public"."_ProjectSubauthors"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Project_privateLinkToken_key" ON "public"."Project"("privateLinkToken");

-- AddForeignKey
ALTER TABLE "public"."SocialMedia" ADD CONSTRAINT "SocialMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProjectSubauthors" ADD CONSTRAINT "_ProjectSubauthors_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProjectSubauthors" ADD CONSTRAINT "_ProjectSubauthors_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
