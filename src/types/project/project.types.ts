import { Project, ProjectMedia, Technology, User } from '@prisma/client';

export type ProjectWithDetails = Project & {
    media: ProjectMedia[];
    technologies: Technology[];
    _count: { likes: number; views: number };
    user?: User;
};

export type ProjectExists = Project | null;
export type ViewsAggregation = { _sum: { count: number | null } };
