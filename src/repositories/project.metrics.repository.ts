import {PrismaClient} from "@prisma/client";
import prisma from "../prisma";


export class ProjectMetricsRepository{
    constructor(private prisma: PrismaClient) {}

    async getLikeById(userId: string, projectId: string) {
        return  prisma.like.findUnique({
            where: { userId_projectId: { userId, projectId } },
        });
    }
    async createLike(userId: string, projectId: string) {
      return prisma.like.create({ data: { projectId, userId } });
    }
    async getLikesCount(projectId: string) {
        return prisma.like.count({ where: { projectId } });
    }
    async deleteLike(userId: string, projectId: string) {
        prisma.like.delete({
            where: { userId_projectId: { projectId, userId } },
        });
    }
    async upsertView(projectId: string, userId: string) {
       return  prisma.view.upsert({
            where: {
                project_user: { projectId, userId },
            },
            create: {
                projectId,
                userId,
                count: 1,
            },
            update: {
                count: { increment: 1 },
            },
        });
    }
    async upsertAnonymousView(projectId: string, ipAddress: string) {
        return prisma.view.upsert({
            where: {
                project_iphash: { projectId, ipHash: ipAddress },
            },
            create: {
                projectId,
                ipHash: ipAddress,
                count: 1,
            },
            update: {
                count: { increment: 1 },
            },
        });
    }
}