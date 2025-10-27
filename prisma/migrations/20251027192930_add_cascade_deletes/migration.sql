-- DropForeignKey
ALTER TABLE "public"."HackathonParticipant" DROP CONSTRAINT "HackathonParticipant_hackathonId_fkey";

-- AddForeignKey
ALTER TABLE "public"."HackathonParticipant" ADD CONSTRAINT "HackathonParticipant_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
