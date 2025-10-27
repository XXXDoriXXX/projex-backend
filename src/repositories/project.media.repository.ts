import {prisma} from "../prisma";
import {ProjectMedia} from "@prisma/client";
import {injectable} from "tsyringe";
import {MediaType} from  "@prisma/client";

export interface IProjectMediaRepository {
    createMedia(userId: string, type: MediaType, url: string): Promise<ProjectMedia>;
    getMediaById(mediaId: string): Promise<(ProjectMedia & { project: { userId: string } | null }) | null>;
    deleteMedia(mediaId: string): Promise<ProjectMedia>;
    attachMediaToProject(mediaIds: string[], projectId: string, userId: string): Promise<void>;
    detachUnusedMedia(projectId: string, keepMediaIds: string[]): Promise<void>;
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
    async attachMediaToProject(mediaIds: string[], projectId: string, userId: string): Promise<void> {

        await prisma.projectMedia.updateMany({
            where: {
                id: { in: mediaIds },
                userId: userId,
                status: 'PENDING',
            },
            data: {
                projectId: projectId,
                status: 'ATTACHED',
            },
        });
    }

    async detachUnusedMedia(projectId: string, keepMediaIds: string[]): Promise<void> {

        const mediaToDetach = await prisma.projectMedia.findMany({
            where: {
                projectId: projectId,
                id: { notIn: keepMediaIds },
            },
        });

        if (mediaToDetach.length === 0) return;

        await prisma.projectMedia.updateMany({
            where: {
                id: { in: mediaToDetach.map(m => m.id) },
            },
            data: {
                projectId: null,
                status: 'PENDING',
            },
        });
    }
}