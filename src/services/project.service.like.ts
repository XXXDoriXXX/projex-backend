import { requireUserIdProjectId } from '../utils/requireUserIdProjectId';
import { DatabaseError, NotFoundError } from '../errors/CustomErrors';
import { type IProjectMetricsRepository } from '../repositories/project.metrics.repository';
import { inject, injectable } from 'tsyringe';
import { Like } from '@prisma/client';
export interface IProjectServiceLike {
    isLikeExist(userId: string, projectId: string): Promise<Like>;
    likeProject(projectId: string, userId: string): Promise<number>;
    unlikeProject(projectId: string, userId: string): Promise<number>;
}
@injectable()
export class ProjectServiceLike implements IProjectServiceLike {
    constructor(@inject('IProjectMetricsRepository') private repo: IProjectMetricsRepository) {}
    async isLikeExist(userId: string, projectId: string): Promise<Like> {
        const existing = await this.repo.getLikeById(userId, projectId);
        if (!existing) {
            throw new NotFoundError(`Like`);
        }
        return existing;
    }
    async likeProject(projectId: string, userId: string): Promise<number> {
        requireUserIdProjectId(projectId, userId);
        if (await this.isLikeExist(userId, projectId)) {
            throw new DatabaseError(`You have already liked this project.`, { projectId, userId });
        }
        try {
            await this.repo.createLike(userId, projectId);
            return await this.repo.getLikesCount(projectId);
        } catch (_err) {
            throw new DatabaseError(`Failed to like project.`, { projectId, userId });
        }
    }

    async unlikeProject(projectId: string, userId: string): Promise<number> {
        requireUserIdProjectId(projectId, userId);
        await this.isLikeExist(userId, projectId);
        try {
            await this.repo.deleteLike(userId, projectId);
            return await this.repo.getLikesCount(projectId);
        } catch (_err) {
            throw new DatabaseError(`Failed to unlike project`, { projectId, userId });
        }
    }
}
