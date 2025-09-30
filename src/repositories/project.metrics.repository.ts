

import {prisma} from "../prisma";
import {injectable} from "tsyringe";
import {Like, View} from "@prisma/client";
export interface IProjectMetricsRepository {
    getLikeById(userId: string, projectId: string): Promise<Like | null>;
    createLike(userId: string, projectId: string): Promise<Like>;
    getLikesCount(projectId: string): Promise<number>;
    deleteLike(userId: string, projectId: string): Promise<Like>;
    upsertView(projectId: string, userId: string): Promise<View>;
    upsertAnonymousView(projectId: string, ipAddress: string): Promise<View>;
}
@injectable()
export class ProjectMetricsRepository implements IProjectMetricsRepository{
    async getLikeById(userId: string, projectId: string):Promise<Like | null>  {
        return prisma.like.findUnique({
            where: { userId_projectId: { userId, projectId } },
        });
    }
    async createLike(userId: string, projectId: string):Promise<Like>  {
        return prisma.like.create({ data: { projectId, userId } });
    }
    async getLikesCount(projectId: string):Promise<number>  {
        return prisma.like.count({ where: { projectId } });
    }
    async deleteLike(userId: string, projectId: string):Promise<Like>  {
       return prisma.like.delete({
            where: { userId_projectId: { projectId, userId } },
        });
    }
    async upsertView(projectId: string, userId: string):Promise<View>  {
        return prisma.view.upsert({
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
    async upsertAnonymousView(projectId: string, ipAddress: string):Promise<View>  {
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
