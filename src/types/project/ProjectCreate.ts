import { Project, ProjectMedia, Technology, User } from '@prisma/client';

export type CreatedProject = Project & {
    user: User;
    media: ProjectMedia[];
    technologies: Technology[];
    subauthors: User[];
};
