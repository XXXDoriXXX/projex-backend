
import { Project, ProjectMedia, Technology, User, Prisma, ProjectStatus } from '@prisma/client';

export type ProjectExists = Project | null;

export const projectWithDetailsInclude = {
    user: true,
    media: true,
    technologies: true,
    _count: { select: { likes: true, views: true } },
    subauthors: true,
};

export type ProjectWithDetails = Prisma.ProjectGetPayload<{
    include: typeof projectWithDetailsInclude;
}>;

export const createdProjectInclude = {
    user: true,
    media: true,
    technologies: true,
    subauthors: true,
};

export type CreatedProject = Prisma.ProjectGetPayload<{
    include: typeof createdProjectInclude;
}>;

export type ViewsAggregation = {
    _sum: {
        count: number | null;
    };
};

export const projectSummaryInclude = {
    user: {
        select: {
            id: true,
            username: true,
            avatarUrl: true,
        },
    },
    technologies: {
        select: {
            id: true,
            name: true,
        },
    },
    _count: {
        select: {
            likes: true,
        },
    },
};
export type ProjectSummary = Prisma.ProjectGetPayload<{
    select: {
        id: true;
        title: true;
        description: true;
        previewUrl: true;
        status: true;
        createdAt: true;
        user: { select: { id: true; username: true; avatarUrl: true } };
        technologies: { select: { id: true; name: true } };
        _count: { select: { likes: true } };
    };
}>;
export const projectSummarySelect = {
    id: true,
    title: true,
    description: true,
    previewUrl: true,
    status: true,
    createdAt: true,
    user: {
        select: { id: true, username: true, avatarUrl: true },
    },
    technologies: {
        select: { id: true, name: true },
    },
    _count: {
        select: { likes: true },
    },
};
export type ProjectSummaryFromRepo = Prisma.ProjectGetPayload<{
    select: typeof projectSummarySelect;
}>;
export interface ProjectSummaryDto extends ProjectSummaryFromRepo {
    viewsCount: number;
    likesCount: number;
}
export interface GetProjectsQueryDto {
    limit?: number;
    cursor?: string;
    sortOrder?: 'asc' | 'desc';
    sortBy?: 'createdAt';
    search?: string;
    authorId?: string;
    technologyIds?: string[];
}

export interface PaginatedProjectsResponse {
    data: ProjectSummary[];
    nextCursor: string | null;
}