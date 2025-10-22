import 'reflect-metadata';
import { CreateProjectData } from '../types/project/Project';
import { ProjectVisible } from '../types/project/ProjectVisible';
import { projectFieldValid } from '../utils/projectFieldValid';
import crypto from 'crypto';
import { ValidationError, NotFoundError, ForbiddenError, DatabaseError } from '../errors/CustomErrors';
import { ensureAccess } from '../utils/encruceAcces';
import { requireUserIdProjectId } from '../utils/requireUserIdProjectId';
import { type IProjectRepository, ProjectRepository } from '../repositories/project.repository';
import { inject, injectable } from 'tsyringe';
import { Project, ProjectMedia, Technology, User } from '@prisma/client';
import {type IProjectMediaRepository} from "../repositories/project.media.repository";
import {UserInfo} from "./auth.service";
import type {IProjectMetricsRepository} from "../repositories/project.metrics.repository";

export interface IProjectService {
    getProjectById(
        id: string,
        token?: string,
        userId?: string,
    ): Promise<{
        media: ProjectMedia[];
        technologies: Technology[];
        user?: User;
        subauthors?: UserInfo[];
        likesCount: number;
        viewsCount: number;
    }>;
    getUserProjects(userId: string): Promise<Project[]>;
    deleteProject(id: string, userId: string): Promise<Project>;
    updateProject(id: string, data: CreateProjectData): Promise<Project>;
    createProject(data: CreateProjectData): Promise<Project>;
    setVisibility(id: string, token: string | null): Promise<Project>;
    changeProjectVisibility(id: string, userId: string, visible: ProjectVisible): Promise<Project>;
    getAllTechnologies(): Promise<Technology[]>;
}

@injectable()
export class ProjectService implements IProjectService {
    constructor(@inject('IProjectRepository') private repo: IProjectRepository,
                @inject('IProjectMediaRepository') private mediaRepo: IProjectMediaRepository,
               @inject('IProjectMetricsRepository') private metricsRepo: IProjectMetricsRepository ) {}

    async getProjectById(
        id: string,
        token?: string,
        userId?: string,
    ): Promise<{
        media: ProjectMedia[];
        technologies: Technology[];
        user?: User;
        subauthors?: UserInfo[];
        likesCount: number;
        viewsCount: number;
        isLiked: boolean;
    }> {
        try {
            const project = await this.repo.findById(id);

            if (!project) {
                throw new NotFoundError('Project', id);
            }

            await ensureAccess(project, token, userId);

            const { _count: internalCount, user,subauthors, ...rest } = project;
            const author:UserInfo = {
                id: user.id,
                email: user.email,
                username: user.username,
                avatarUrl: user.avatarUrl,
            }
            const subauthorsInfo: UserInfo[] | undefined = subauthors?.map((sa => ({
                id: sa.id,
                email: sa.email,
                username: sa.username,
                avatarUrl: sa.avatarUrl,
            })));

                const [viewsCount, isLiked] = await Promise.all([
                    this.repo.getViewsCount(id),
                    this.metricsRepo.hasUserLiked(id, userId)
                ]);
            return {
                ...rest,
                author,
                subauthors: subauthorsInfo,
                likesCount: internalCount.likes,
                viewsCount: viewsCount._sum.count || 0,
                isLiked: isLiked,
            }as any;
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ForbiddenError) {
                throw error;
            }
            throw new DatabaseError('Failed to get project', { id });
        }
    }

    async getUserProjects(userId: string, currentUserId?: string | undefined): Promise<Project[]> {
        try {
            const projects = await this.repo.getUserProjects(userId);
            const isOwner = currentUserId === userId;

            if (!isOwner) {
                return projects.filter((project) => project.privateLinkToken === null);
            }

            return projects;
        } catch (err: any) {
            throw new DatabaseError(`Failed to fetch user's projects. ${err.message}`, {
                userId,
            });
        }
    }

    async deleteProject(id: string, userId: string) {
        requireUserIdProjectId(id, userId);

        try {
            return await this.repo.deleteProject(id, userId);
        } catch (err: any) {
            if (err?.code === `P2025`) {
                throw new NotFoundError(`Project`, id);
            }
            throw new DatabaseError(`Failed to delete project. ${err.message}`, {
                id,
                userId,
            });
        }
    }

    async updateProject(id: string, data: CreateProjectData): Promise<Project> {
        requireUserIdProjectId(id, data?.userId);

        const project = await this.repo.isProjectExists(id);
        if (!project) {
            throw new NotFoundError(`Project`, id);
        }

        if (project.userId !== data.userId) {
            throw new ForbiddenError(`You do not have permission to update this project`);
        }

        await projectFieldValid(data);
        const newMediaIds: string[] = data.mediaIds || [];
        let previewUrlValue: string | null = project.previewUrl;
        if (newMediaIds.length > 0) {
            const firstMedia = await this.mediaRepo.getMediaById(newMediaIds[0]);
            if (firstMedia) {
                previewUrlValue = firstMedia.url;
            }
        } else if (newMediaIds.length === 0) {

            previewUrlValue = null;
        }
        const projectToUpdate = { ...data, mediaIds: undefined } as any;

        let updatedProject: Project;
        try {
            updatedProject = await this.repo.updateProject(id, previewUrlValue, projectToUpdate);
        } catch (err: any) {
            if (err?.code === `P2002`) {
                throw new ValidationError(`Project with this title already exists`, `title`);
            }
            throw new DatabaseError(`Failed to update project. ${err.message}`, { id });
        }
        if (newMediaIds.length > 0) {
            try {
                await this.mediaRepo.attachMediaToProject(newMediaIds, id, data.userId);
            } catch (mediaError) {
                console.warn(`[ProjectService] Failed to attach new media ${newMediaIds} to project ${id}.`, mediaError);
            }
        }
        try {
            await this.mediaRepo.detachUnusedMedia(id, newMediaIds);
        } catch (cleanupError) {
            console.warn(`[ProjectService] Failed to detach old media from project ${id}.`, cleanupError);
        }
        return updatedProject;
    }

    async createProject(data: CreateProjectData): Promise<Project> {
        if (!data?.userId) {
            throw new ValidationError(`User ID is required`, `userId`);
        }

        await projectFieldValid(data);
        const mediaIds: string[] = data.mediaIds || [];
        const projectToCreate = { ...data,mediaIds: undefined};
        let newProject: Project;
        try {
            newProject = await this.repo.createProject(projectToCreate);
        } catch (err: any) {
            if (err?.code === `P2002`) {
                throw new ValidationError(`Project with this title already exists`, `title`);
            }
            throw new DatabaseError(`Failed to create project. ${err.message}`);
        }
        if (mediaIds.length > 0) {
            try {

                await this.mediaRepo.attachMediaToProject(mediaIds, newProject.id, data.userId);
            } catch (mediaError) {
                console.warn(`[ProjectService] Failed to attach media ${mediaIds} to project ${newProject.id}.`, mediaError);
            }
        }
        return newProject;
    }

    async setVisibility(id: string, token: string | null): Promise<Project> {
        try {
            return await this.repo.updateVisibility(id, token);
        } catch (_err) {
            throw new DatabaseError(`Failed to update project visibility`, { id });
        }
    }

    async changeProjectVisibility(id: string, userId: string, visible: ProjectVisible): Promise<Project> {
        requireUserIdProjectId(id, userId);

        if (!visible) {
            throw new ValidationError(`Visibility option is required`, `visible`);
        }

        const project = await this.repo.findById(id);
        if (!project) {
            throw new NotFoundError(`Project`, id);
        }

        if (project.userId !== userId) {
            throw new ForbiddenError(`You do not have permission to update this project`);
        }

        switch (visible) {
            case `link`: {
                const token = crypto.randomBytes(24).toString(`hex`);
                return this.setVisibility(id, token);
            }
            case `public`: {
                return this.setVisibility(id, null);
            }
            case `private`: {
                return this.setVisibility(id, `private`);
            }
            default: {
                throw new ValidationError(`Invalid visibility option`, `visible`);
            }
        }
    }
    async getAllTechnologies(): Promise<Technology[]> {
        try {
            return await this.repo.getAllTechnologies();
        } catch (error) {
            throw new DatabaseError('Failed to fetch technologies');
        }
    }
}
