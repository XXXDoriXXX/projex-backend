import { requireUserIdProjectId } from '../utils/requireUserIdProjectId';
import { DatabaseError, NotFoundError } from '../errors/CustomErrors';
import { ProjectMetricsRepository } from '../repositories/project.metrics.repository';
import { Service } from 'typedi';
@Service()
export class ProjectServiceLike {
    constructor(public repo: ProjectMetricsRepository) {}
    async isLikeExist(userId: string, projectId: string) {
        const existing = await this.repo.getLikeById(userId, projectId);
        if (!existing) {
            throw new NotFoundError(`Like`);
        }
    }
    async likeProject(projectId: string, userId: string) {
        requireUserIdProjectId(projectId, userId);
        await this.isLikeExist(projectId, userId);
        try {
            await this.repo.createLike(userId, projectId);
            return await this.repo.getLikesCount(projectId);
        } catch (_err) {
            throw new DatabaseError(`Failed to like project.`, { projectId, userId });
        }
    }

    async unlikeProject(projectId: string, userId: string) {
        requireUserIdProjectId(projectId, userId);
        await this.isLikeExist(projectId, userId);
        try {
            await this.repo.deleteLike(userId, projectId);
            return await this.repo.getLikesCount(projectId);
        } catch (_err) {
            throw new DatabaseError(`Failed to unlike project`, { projectId, userId });
        }
    }
}
