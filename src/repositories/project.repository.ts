import { CreateProjectData } from '../types/project/Project';
import { prisma } from '../prisma';
import {Prisma, Project, ProjectStatus, Technology} from '@prisma/client';
import { ProjectExists, ProjectWithDetails, ViewsAggregation } from '../types/project/project.types';
import { CreatedProject } from '../types/project/ProjectCreate';
import { injectable } from 'tsyringe';
import {
    GetProjectsQueryDto,
    PaginatedProjectsResponse,
    ProjectSummary, ProjectSummaryFromRepo,
    projectSummaryInclude, projectSummarySelect
} from '../types/project/project.list.types';
export interface IProjectRepository {
    isProjectExists(id: string): Promise<ProjectExists>;
    findById(id: string): Promise<ProjectWithDetails | null>;
    getViewsCount(projectId: string): Promise<ViewsAggregation>;
    getViewsCounts(projectIds: string[]): Promise<Map<string, number>>;
    getUserProjects(userId: string): Promise<ProjectWithDetails[]>;
    deleteProject(id: string, userId: string): Promise<Project>;
    updateProject(id: string, previewUrlValue: string | null, data: CreateProjectData): Promise<CreatedProject>;
    createProject(data: CreateProjectData): Promise<CreatedProject>;
    updateVisibility(id: string, token: string | null): Promise<Project>;
    getAllTechnologies(): Promise<Technology[]>;
    attachPreviewToProject(projectId: string, mediaId: string): Promise<Project>;
    updateStatus(id: string, status: ProjectStatus): Promise<Project>;
    findMany(options: GetProjectsQueryDto & { limit: number }): Promise<PaginatedProjectsResponse>;
}
type DecodedCursor = { id: string; createdAtTs: number };
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
            where: { id: id, userId: userId },
        });
    }
    async updateProject(id: string, previewUrlValue: string | null, data: any): Promise<CreatedProject> {

        const updateData: Prisma.ProjectUpdateInput = {

            title: data.title,
            description: data.description,
            previewUrl: previewUrlValue,
            privateLinkToken: data.privateLinkToken,
        };

        if (data.githubUrl !== undefined) {
            updateData.githubUrl = data.githubUrl ?? null;
        }
        if (data.demoUrl !== undefined) {
            updateData.demoUrl = data.demoUrl ?? null;
        }

        if (data.technologies) {
            updateData.technologies = {
                set: data.technologies.map((techId: string) => ({ id: techId })),
            };
        }
        if (data.subauthorIds) {
            updateData.subauthors = {
                set: data.subauthorIds.map((userId: string) => ({ id: userId })),
            };
        }

        return prisma.project.update({
            where: { id },
            data: updateData,
            include: {
                user: true,
                media: true,
                technologies: true,
                subauthors: true,
            },
        });
    }
    async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
        return prisma.project.update({
            where: { id },
            data: { status: status },
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
    async getViewsCount(projectId: string): Promise<ViewsAggregation> {
        return prisma.view.aggregate({
            where: { projectId: projectId },
            _sum: { count: true },
        });
    }
    async getViewsCounts(projectIds: string[]): Promise<Map<string, number>> {
        if (projectIds.length === 0) {
            return new Map<string, number>();
        }
        const results = await prisma.view.groupBy({
            by: ['projectId'],
            where: {
                projectId: { in: projectIds },
            },
            _sum: {
                count: true,
            },
        });
        const viewsMap = new Map<string, number>();
        for (const res of results) {
            viewsMap.set(res.projectId, res._sum.count || 0);
        }
        return viewsMap;
    }
    private encodeCursor(item: { id: string; createdAt: Date }): string {
        return Buffer.from(
            JSON.stringify({
                id: item.id,
                createdAtTs: item.createdAt.getTime(),
            }),
        ).toString('base64');
    }

    private decodeCursor(cursor: string): { id: string; createdAt: Date } {
        const { id, createdAtTs } = JSON.parse(
            Buffer.from(cursor, 'base64').toString('utf8'),
        ) as DecodedCursor;
        return { id, createdAt: new Date(createdAtTs) };
    }

    async findMany(
        options: GetProjectsQueryDto & { limit: number },
    ): Promise<PaginatedProjectsResponse> {
        const { limit, cursor, sortOrder = 'desc', search, authorId, technologyIds } = options;

        const take = limit + 1;
        const isDesc = sortOrder === 'desc';

        const whereConditions: Prisma.ProjectWhereInput[] = [
            { privateLinkToken: null },
            { status: ProjectStatus.PUBLISHED },
        ];

        if (search) {
            whereConditions.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (authorId) {
            whereConditions.push({ userId: authorId });
        }

        if (technologyIds && technologyIds.length > 0) {
            whereConditions.push({
                technologies: {
                    some: {
                        id: { in: technologyIds },
                    },
                },
            });
        }

        const orderBy = [{ createdAt: sortOrder }, { id: sortOrder }];

        if (cursor) {
            const decodedCursor = this.decodeCursor(cursor);
            const operator = isDesc ? 'lt' : 'gt';

            whereConditions.push({
                OR: [
                    {
                        createdAt: { [operator]: decodedCursor.createdAt },
                    },
                    {
                        createdAt: decodedCursor.createdAt,
                        id: { [operator]: decodedCursor.id },
                    },
                ],
            });
        }

        const items = await prisma.project.findMany({
            take,
            where: {
                AND: whereConditions,
            },
            orderBy: orderBy as any,
            select: projectSummarySelect,
        });

        let nextCursor: string | null = null;
        if (items.length > limit) {
            const nextItem = items.pop();
            if (nextItem) {
                nextCursor = this.encodeCursor(nextItem);
            }
        }

        return {
            data: items as ProjectSummaryFromRepo[],
            nextCursor,
        };
    }
}
