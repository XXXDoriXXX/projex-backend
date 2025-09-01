/*
  Warnings:

  - A unique constraint covering the columns `[id,userId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Project_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Project_id_userId_key" ON "public"."Project"("id", "userId");
