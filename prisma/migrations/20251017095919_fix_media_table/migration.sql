/*
  Warnings:

  - Added the required column `userId` to the `ProjectMedia` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MediaStatus" AS ENUM ('PENDING', 'ATTACHED');

-- DropForeignKey
ALTER TABLE "public"."ProjectMedia" DROP CONSTRAINT "ProjectMedia_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."ProjectMedia" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "public"."MediaStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "projectId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ProjectMedia_userId_idx" ON "public"."ProjectMedia"("userId");

-- AddForeignKey
ALTER TABLE "public"."ProjectMedia" ADD CONSTRAINT "ProjectMedia_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectMedia" ADD CONSTRAINT "ProjectMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
