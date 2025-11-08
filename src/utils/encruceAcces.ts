import { ForbiddenError, NotFoundError } from '../errors/CustomErrors';

export function ensureAccess(project: any, token?: string, userId?: string): void {
    if (!project) {
        throw new NotFoundError(`Project`);
    }
    if (!project.privateLinkToken) {
        return;
    }
    if (project.privateLinkToken.startsWith('private:')) {
        if (project.userId !== userId) {
            throw new ForbiddenError(`Access denied: project is private`);
        }
        return;
    }

    if (project.userId === userId) {
        return;
    }

    if (project.privateLinkToken !== token) {
        throw new ForbiddenError(`Access denied: invalid token`);
    }
    return;
}
