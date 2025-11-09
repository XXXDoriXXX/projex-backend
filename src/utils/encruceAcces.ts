import { ForbiddenError, NotFoundError } from '../errors/CustomErrors';

export function ensureAccess(project: any, token?: string, userId?: string): void {
    if (!project) {
        throw new NotFoundError(`Project`);
    }
    if (!project.privateLinkToken) {
        return;
    }
    if (project.userId === userId) {
        return;
    }
    const isCoauthor = project.subauthors?.some((subauthor: any) => subauthor.id === userId);
    if (isCoauthor) {
        return;
    }

    if (project.privateLinkToken.startsWith('private:')) {
        throw new ForbiddenError(`Access denied: project is private`);
    }

    if (project.privateLinkToken !== token) {
        throw new ForbiddenError(`Access denied: invalid token`);
    }

    return;
}