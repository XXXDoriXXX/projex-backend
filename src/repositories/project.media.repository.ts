import {prisma} from "../prisma";
import {ProjectMedia} from "@prisma/client";
import {injectable} from "tsyringe";
import {MediaType} from  "@prisma/client";

export interface IProjectMediaRepository {
    createMedia(userId: string, type: MediaType, url: string): Promise<ProjectMedia>;
    getMediaById(mediaId: string): Promise<(ProjectMedia & { project: { userId: string } | null }) | null>;
    deleteMedia(mediaId: string): Promise<ProjectMedia>;
}

@injectable()
export class ProjectMediaRepository implements IProjectMediaRepository{
    async createMedia(userId: string, type: MediaType, url: string): Promise<ProjectMedia> {
        return prisma.projectMedia.create({
            data: {
                userId,
                type,
                url,
                status: 'PENDING',
            },
        });
    }

    async deleteMedia(mediaId: string): Promise<ProjectMedia> {
        return prisma.projectMedia.delete({
            where: { id: mediaId },
        });
    }
    async getMediaById(mediaId: string):Promise<(ProjectMedia & { project: { userId: string } | null }) | null>{
        return prisma.projectMedia.findUnique({
            where: { id: mediaId },
            include: {
                project: {
                    select: {
                        userId: true
                    }
                }
            }
        });
    }

}