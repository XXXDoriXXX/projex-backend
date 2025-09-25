
import {PrismaService} from "../prisma";
import { Service, Inject  } from 'typedi';
@Service()
export class ProjectMetricsRepository{
    constructor(
        @Inject() private prisma: PrismaService
    ) {}

    async getLikeById(userId: string, projectId: string) {
        return  this.prisma.like.findUnique({
            where: { userId_projectId: { userId, projectId } },
        });
    }
    async createLike(userId: string, projectId: string) {
      return this.prisma.like.create({ data: { projectId, userId } });
    }
    async getLikesCount(projectId: string) {
        return this.prisma.like.count({ where: { projectId } });
    }
    async deleteLike(userId: string, projectId: string) {
        this.prisma.like.delete({
            where: { userId_projectId: { projectId, userId } },
        });
    }
    async upsertView(projectId: string, userId: string) {
       return  this.prisma.view.upsert({
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
        return this.prisma.view.upsert({
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