import {requireUserIdProjectId} from "../utils/requireUserIdProjectId";
import prisma from "../prisma";
import {DatabaseError, NotFoundError} from "../errors/CustomErrors";

import {ProjectMetricsRepository} from "../repositories/project.metrics.repository";

const repo = new ProjectMetricsRepository(prisma);
async function isLikeExist(userId: string, projectId: string) {
    const existing = await repo.getLikeById(userId, projectId);
    if (!existing) {
        throw new NotFoundError(`Like`);
    }
}
export const likeProject = async (projectId: string, userId: string) => {
    requireUserIdProjectId(projectId, userId);
    await isLikeExist(projectId, userId);
    try {
        await repo.createLike(userId, projectId);
        return await repo.getLikesCount(projectId);
    } catch (_err) {
        throw new DatabaseError(`Failed to like project.`, { projectId, userId });
    }
};

export const unlikeProject = async (projectId: string, userId: string) => {
    requireUserIdProjectId(projectId, userId);
    await isLikeExist(projectId, userId);
    try {
        await repo.deleteLike(userId, projectId);
        return await repo.getLikesCount(projectId);
    } catch (_err) {
        throw new DatabaseError(`Failed to unlike project`, { projectId, userId });
    }
};
