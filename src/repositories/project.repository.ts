import { Inject, Service } from 'typedi';
import { CreateProjectData } from '../types/Project';
import { PrismaService } from '../prisma';

@Service()
export class ProjectRepository {
    constructor(@Inject() private prisma: PrismaService) {}
    async isProjectExists(id: string) {
        return this.prisma.project.findUnique({ where: { id } });
    }
    async findById(id: string) {
        return this.prisma.project.findUnique({
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
        return this.prisma.project.findMany({
            where: { userId },
            include: {
                media: true,
                _count: { select: { likes: true, views: true } },
                technologies: true,
            },
        });
    }
    async deleteProject(id: string, userId: string) {
        return this.prisma.project.delete({
            where: { id_userId: { id, userId } },
        });
    }
    async updateProject(id: string, previewUrlValue: string | null, data: CreateProjectData) {
        return this.prisma.project.update({
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
    async createProject(data: CreateProjectData) {
        return this.prisma.project.create({
            data: {
                userId: data.userId,
                title: data.title,
                description: data.description,
                githubUrl: data.githubUrl ?? null,
                demoUrl: data.demoUrl ?? null,
                media: data.media
                    ? {
                          create: data.media.map((m) => ({
                              type: m.type,
                              url: m.url,
                          })),
                      }
                    : undefined,
                technologies: data.technologies
                    ? {
                          connect: data.technologies.map((id) => ({ id })),
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
    async updateVisibility(id: string, token: string | null) {
        return this.prisma.project.update({
            where: { id },
            data: { privateLinkToken: token },
        });
    }
}
