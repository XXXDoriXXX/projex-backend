import { CreateProjectData } from '../types/project/Project';
import { prisma } from '../prisma';
import {Project, Technology} from '@prisma/client';
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
    getAllTechnologies(): Promise<Technology[]>;
    attachPreviewToProject(projectId: string, mediaId: string): Promise<Project>;
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
                user: true,
                media: true,
                technologies: true,
                _count: { select: { likes: true, views: true } },
                subauthors : true,
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
                user: true,
                media: true,
                subauthors: true,
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
        const dataWithoutMediaIds = { ...data, mediaIds: undefined };
        return prisma.project.update({
            where: { id },
            data: {
                userId: data.userId,
                title: data.title,
                description: data.description,
                previewUrl: previewUrlValue,
                githubUrl: data.githubUrl ?? null,
                demoUrl: data.demoUrl ?? null,
                technologies: data.technologies
                    ? {
                        set: data.technologies.map((techId) => ({ id: techId })),
                    }
                    : undefined,
                subauthors: data.subauthorIds
                    ? {

                        set: data.subauthorIds.map((userId) => ({ id: userId })),
                    }
                    : undefined,
            },
            include: {
                user: true,
                media: true,
                technologies: true,
                subauthors: true,
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
                privateLinkToken: data.visible ?? null,
                technologies: data.technologies
                    ? {
                        connect: data.technologies.map((id) => ({ id })),
                    }
                    : undefined,
                subauthors: data.subauthorIds
                    ? {
                        connect: data.subauthorIds.map((id) => ({ id })),
                    }
                    : undefined,
            },
            include: {
                user: true,
                media: true,
                technologies: true,
                subauthors: true,
            },
        });
    }
    async updateVisibility(id: string, token: string | null) {
        return prisma.project.update({
            where: { id },
            data: { privateLinkToken: token },
        });
    }
    async getAllTechnologies(): Promise<Technology[]> {
        return prisma.technology.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async attachPreviewToProject(projectId: string, mediaId: string): Promise<Project> {
        const media = await prisma.projectMedia.findUnique({
            where: { id: mediaId },
            select: { url: true },
        });
        const previewUrl = media?.url ?? null;
        return prisma.project.update({
            where: { id: projectId },
            data: {
                previewUrl: previewUrl,
            },
        });
    }

}
