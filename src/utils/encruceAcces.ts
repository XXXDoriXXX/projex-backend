import { ForbiddenError, NotFoundError } from '../errors/CustomErrors';

export function ensureAccess(project: any, token?: string, userId?: string): void {
    if (!project) {
        throw new NotFoundError(`Project`);
    }

    if (project.privateLinkToken === `private`) {
        if (project.userId !== userId) {
            throw new ForbiddenError(`Access denied: not your project`);
        }
        return;
    }

    if (project.privateLinkToken) {
        if (project.userId === userId) {
            return;
        }
        if (project.privateLinkToken !== token) {
            throw new ForbiddenError(`Access denied: invalid token`);
        }
        return;
    }
}
