import { DatabaseError, NotFoundError, ValidationError } from '../errors/CustomErrors';
import { hashIp } from '../utils/hashIp';
import { type IProjectRepository } from '../repositories/project.repository';
import { inject, injectable } from 'tsyringe';
import { type IProjectMetricsRepository } from '../repositories/project.metrics.repository';
import { View } from '@prisma/client';
export interface IProjectServiceView {
    recordProjectView(projectId: string, opts?: { userId?: string; ip?: string; ipHash?: string }): Promise<View>;
}

@injectable()
export class ProjectServiceView implements IProjectServiceView {
    constructor(
        @inject('IProjectRepository') private projectRepository: IProjectRepository,
        @inject('IProjectMetricsRepository') private projectMetricsRepository: IProjectMetricsRepository,
    ) {}

    async recordProjectView(projectId: string, opts?: { userId?: string; ip?: string; ipHash?: string }): Promise<View> {

        const userId = opts?.userId ?? null;

        if (!projectId) {
            throw new ValidationError('Project ID is required', 'projectId');
        }

        const project = await this.projectRepository.findById(projectId);
        if (!project) {
            throw new NotFoundError('Project', projectId);
        }

        try {
            if (userId) {
                return await this.projectMetricsRepository.upsertView(projectId, userId);
            }
            console.log(opts?.ip);
            const salt = process.env.IP_HASH_SALT;
            if (!opts?.ip && !opts?.ipHash) {
                throw new ValidationError('IP is required for anonymous view', 'ip');
            }
            if (!salt && !opts?.ipHash) {
                throw new ValidationError('IP_HASH_SALT is not set', 'IP_HASH_SALT');
            }

            const finalIpHash = opts?.ipHash ?? hashIp(opts!.ip as string, salt as string);

            return await this.projectMetricsRepository.upsertAnonymousView(projectId, finalIpHash);
        } catch (err: any) {
            throw new DatabaseError('Failed to record project view', {
                projectId,
                reason: err?.message,
            });
        }
    }
}
