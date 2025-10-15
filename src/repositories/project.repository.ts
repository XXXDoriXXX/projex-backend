import { CreateProjectData } from '../types/project/Project';
import { prisma } from '../prisma';
import { Project } from '@prisma/client';
import { ProjectExists, ProjectWithDetails, ViewsAggregation } from '../types/project/project.types';
import { CreatedProject } from '../types/project/ProjectCreate';
import { injectable } from 'tsyringe';
export interface IProjectRepository {
    isProjectExists(id: string): Promise<ProjectExists>;
    findById(id: string): Promise<ProjectWithDetails | null>;
    getViewsCount(projectId: string): Promise<ViewsAggregation>;
    getUserProjects(userId: string): Promise<ProjectWithDetails[]>;
    deleteProject(id: string, userId: string): Promise<Project>;
    updateProject(id: string, previewUrlValue: string | null, data: CreateProjectData): Promise<CreatedProject>;
    createProject(data: CreateProjectData): Promise<CreatedProject>;
    updateVisibility(id: string, token: string | null): Promise<Project>;
}
@injectable()
export class ProjectRepository implements IProjectRepository {
    async isProjectExists(id: string) {
        return prisma.project.findUnique({ where: { id } });
    }
    async findById(id: string): Promise<ProjectWithDetails | null> {
        return prisma.project.findUnique({
            where: { id },
            include: {
                media: true,
                technologies: true,
                _count: { select: { likes: true, views: true } },
            },
        });
    }
    async getViewsCount(projectId: string): Promise<ViewsAggregation> {
        return prisma.view.aggregate({
            where: { projectId: projectId },
            _sum: { count: true },
        });
    }
    async getUserProjects(userId: string): Promise<ProjectWithDetails[]> {
        return prisma.project.findMany({
            where: { userId },
            include: {
                media: true,
                _count: { select: { likes: true, views: true } },
                technologies: true,
            },
        });
    }
    async deleteProject(id: string, userId: string): Promise<Project> {
        return prisma.project.delete({
            where: { id_userId: { id, userId } },
        });
    }
    async updateProject(id: string, previewUrlValue: string | null, data: CreateProjectData): Promise<CreatedProject> {
        return prisma.project.update({
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
    async createProject(data: CreateProjectData): Promise<CreatedProject> {
        return prisma.project.create({
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
        return prisma.project.update({
            where: { id },
            data: { privateLinkToken: token },
        });
    }
}
