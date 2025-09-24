import {requireUserIdProjectId} from "../utils/requireUserIdProjectId";
import prisma from "../prisma";
import {DatabaseError, NotFoundError, ValidationError} from "../errors/CustomErrors";

export const likeProject = async (projectId: string, userId: string) => {
    requireUserIdProjectId(projectId, userId);

    const existing = await prisma.like.findUnique({
        where: { userId_projectId: { userId, projectId } },
    });
    if (existing) {
        throw new ValidationError(`User has already liked this project`);
    }

    try {
        await prisma.like.create({ data: { projectId, userId } });
        const count = await prisma.like.count({ where: { projectId } });
        return count;
    } catch (_err) {
        throw new DatabaseError(`Failed to like project.`, { projectId, userId });
    }
};

export const unlikeProject = async (projectId: string, userId: string) => {
    requireUserIdProjectId(projectId, userId);

    const existing = await prisma.like.findUnique({
        where: { userId_projectId: { userId, projectId } },
    });
    if (!existing) {
        throw new NotFoundError(`Like`);
    }

    try {
        await prisma.like.delete({
            where: { userId_projectId: { projectId, userId } },
        });
        const count = await prisma.like.count({ where: { projectId } });
        return count;
    } catch (_err) {
        throw new DatabaseError(`Failed to unlike project`, { projectId, userId });
    }
};
