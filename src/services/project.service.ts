import { CreateProjectData } from '../types/Project';
import { ProjectVisible } from '../types/ProjectVisible';
import { projectFieldValid } from '../utils/projectFieldValid';
import crypto from 'crypto';
import { ValidationError, NotFoundError, ForbiddenError, DatabaseError } from '../errors/CustomErrors';
import { ensureAccess } from '../utils/encruceAcces';
import { requireUserIdProjectId } from '../utils/requireUserIdProjectId';
import { ProjectRepository } from '../repositories/project.repository';
import { Service } from 'typedi';
@Service()
export class ProjectService {
    constructor(public repo: ProjectRepository) {}
    async getProjectById(id: string, token?: string, userId?: string): Promise<ProjectDto> {
        if (!id) {
            throw new ValidationError('Project ID is required', 'id');
        }
        try {
            const project = await this.repo.findById(id);
            if (!project) {
                throw new NotFoundError(`Project`, id);
            }
            ensureAccess(project, token, userId);
            const viewsAgg = await this.repo.getViewsCount(id);
            const viewsTotal = viewsAgg?._sum?.count ?? 0;

            const { _count: internalCount, ...rest } = project as any;

            return {
                ...rest,
                metrics: {
                    likes: internalCount.likes,
                    views: {
                        rows: internalCount.views,
                        total: viewsTotal,
                    },
                },
            };
        } catch (err: any) {
            throw new DatabaseError(`Failed to fetch project. ${err.message}`, {
                projectId: id,
            });
        }
    }

    async getUserProjects(userId: string) {
        if (!userId) {
            throw new ValidationError(`User ID is required`, `${userId}`);
        }
        try {
            const projects = await this.repo.getUserProjects(userId);
            console.log(projects);
            if (projects.length === 0) {
                throw new NotFoundError(`User dont have a projects`, `user id:${userId}`);
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

    async updateProject(id: string, data: CreateProjectData) {
        requireUserIdProjectId(id, data?.userId);

        const project = await this.repo.isProjectExists(id);
        if (!project) {
            throw new NotFoundError(`Project`, id);
        }
        if (project.userId !== data.userId) {
            throw new ForbiddenError(`You do not have permission to update this project`);
        }

        await projectFieldValid(data);

        let previewUrlValue: string | null = project.previewUrl;
        if (!previewUrlValue && data.media && data.media.length > 0) {
            previewUrlValue = data.media[0].url;
        }

        try {
            return await this.repo.updateProject(id, previewUrlValue, data);
        } catch (err: any) {
            if (err?.code === `P2002`) {
                throw new ValidationError(`Project with this title already exists`, `title`);
            }
            throw new DatabaseError(`Failed to update project. ${err.message}`, { id });
        }
    }

    async createProject(data: CreateProjectData) {
        if (!data?.userId) {
            throw new ValidationError(`User ID is required`, `userId`);
        }

        await projectFieldValid(data);

        try {
            return await this.repo.createProject(data);
        } catch (err: any) {
            if (err?.code === `P2002`) {
                throw new ValidationError(`Project with this title already exists`, `title`);
            }
            throw new DatabaseError(`Failed to create project. ${err.message}`);
        }
    }

    async setVisibility(id: string, token: string | null) {
        try {
            return await this.repo.updateVisibility(id, token);
        } catch (_err) {
            throw new DatabaseError(`Failed to update project visibility`, { id });
        }
    }

    async changeProjectVisibility(id: string, userId: string, visible: ProjectVisible) {
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
}
