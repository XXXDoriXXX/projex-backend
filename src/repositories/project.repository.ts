import { PrismaClient } from "@prisma/client";
import prisma from "../prisma";
import {NotFoundError} from "../errors/CustomErrors";
import {ensureAccess} from "../utils/encruceAcces";
import {CreateProjectData} from "../types/Project";


export class ProjectRepository{
    constructor(private prisma: PrismaClient) {}

    async findById(id: string) {
        return prisma.project.findUnique({
            where: { id },
                include: {
                    media: true,
                    technologies: true,
                    _count: { select: { likes: true, views: true } },
                },
        });
    }
    async getViewsCount(projectId: string) {
        return this.prisma.view.aggregate({
            where: { projectId: projectId },
            _sum: { count: true },
        });
    }
    async getUserProjects(userId: string) {
        return await prisma.project.findMany({
            where: { userId },
            include: {
                media: true,
                _count: { select: { likes: true, views: true } },
                technologies: true,
            },
        });
    }
    async deleteProject(id: string, userId: string) {
        return await prisma.project.delete({
            where: { id_userId: { id, userId } },
        });
    }
    async updateProject(id:string, data: CreateProjectData, previewUrlValue:string | null) {
        return await prisma.project.update({
            where: { id },
            data: {
                userId: data.userId,
                title: data.title,
                description: data.description,
                previewUrl: previewUrlValue,
                githubUrl: data.githubUrl ?? null,
                demoUrl: data.demoUrl ?? null,
                media: data.media
                    ? {
                        deleteMany: {},
                        create: data.media.map((m) => ({
                            type: m.type,
                            url: m.url,
                        })),
                    }
                    : undefined,
                technologies: data.technologies
                    ? {
                        set: data.technologies.map((techId) => ({ id: techId })),
                    }
                    : undefined,
            },
            include: {
                user: true,
                media: true,
                technologies: true,
            },
        });
    }
    async getProjectByUserId(userId:string){
        return await prisma.project.findUnique({ where: { id:userId } });
    }
}