import { ValidationError } from '../errors/CustomErrors';

export function requireUserIdProjectId(projectId: string, userId: string) {
    if (!projectId) {
        throw new ValidationError(`Project ID is required`, `projectId`);
    }
    if (!userId) {
        throw new ValidationError(`User ID is required`, `userId`);
    }
}
