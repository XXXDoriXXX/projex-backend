/*
  Warnings:

  - You are about to drop the column `ip` on the `View` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `View` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."View" DROP COLUMN "ip",
ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "View_userId_key" ON "public"."View"("userId");
