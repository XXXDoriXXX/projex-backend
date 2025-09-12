/*
  Warnings:

  - A unique constraint covering the columns `[projectId,userId]` on the table `View` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,ipHash]` on the table `View` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `View` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."View" ADD COLUMN     "ipHash" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "View_projectId_userId_key" ON "public"."View"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "View_projectId_ipHash_key" ON "public"."View"("projectId", "ipHash");
