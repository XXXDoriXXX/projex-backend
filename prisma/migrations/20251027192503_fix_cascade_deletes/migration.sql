-- DropForeignKey
ALTER TABLE "public"."HackathonProject" DROP CONSTRAINT "HackathonProject_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HackathonProjectRating" DROP CONSTRAINT "HackathonProjectRating_hackathonProjectId_fkey";

-- AddForeignKey
ALTER TABLE "public"."HackathonProject" ADD CONSTRAINT "HackathonProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HackathonProjectRating" ADD CONSTRAINT "HackathonProjectRating_hackathonProjectId_fkey" FOREIGN KEY ("hackathonProjectId") REFERENCES "public"."HackathonProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
