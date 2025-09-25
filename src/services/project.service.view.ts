import {DatabaseError, NotFoundError, ValidationError} from "../errors/CustomErrors";
import prisma from "../prisma";
import {hashIp} from "../utils/hashIp";

export const recordProjectView = async (
    projectId: string,
    opts?: { userId?: string; ip?: string; ipHash?: string },
) => {
    console.log(opts)
    const userId = opts?.userId ?? null;

    if (!projectId) {
        throw new ValidationError("Project ID is required", "projectId");
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new NotFoundError("Project", projectId);
    }

    try {
        if (userId) {
            return await prisma.view.upsert({
                where: {
                    project_user: { projectId, userId },
                },
                create: {
                    projectId,
                    userId,
                    count: 1,
                },
                update: {
                    count: { increment: 1 },
                },
            });
        }
        console.log(opts?.ip);
        const salt = process.env.IP_HASH_SALT;
        if (!opts?.ip && !opts?.ipHash) {
            throw new ValidationError("IP is required for anonymous view", "ip");
        }
        if (!salt && !opts?.ipHash) {
            throw new ValidationError("IP_HASH_SALT is not set", "IP_HASH_SALT");
        }

        const finalIpHash =
            opts?.ipHash ?? hashIp(opts!.ip as string, salt as string);

        return await prisma.view.upsert({
            where: {
                project_iphash: { projectId, ipHash: finalIpHash },
            },
            create: {
                projectId,
                ipHash: finalIpHash,
                count: 1,
            },
            update: {
                count: { increment: 1 },
            },
        });
    } catch (err: any) {
        throw new DatabaseError("Failed to record project view", {
            projectId,
            reason: err?.message,
        });
    }
};
